'use client'

import { useState, useTransition, useMemo, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Upload, AlertCircle, X, EyeOff, Check, Plus, Image as ImageIcon, Loader2 } from 'lucide-react'
import { EditWorkModal } from './EditWorkModal'

type Work = {
  id: string
  materialId: string
  photoUrl: string
  childAge: string
  comment: string
  duration: number | null
  tools: string | null
  published: boolean
  createdAt: string | Date
}

type Option = { id: string; title: string }

type ItemStatus = 'pending' | 'uploading' | 'done' | 'error'

type QueueItem = {
  uid: string
  file: File
  previewUrl: string
  materialInput: string
  comment: string
  status: ItemStatus
  errorMessage?: string
}

type DraftData = {
  childAge: string
  duration: string
  tools: string
  savedAt: number
}
const DRAFT_KEY = 'gallery-works-shared-draft-v1'

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

/** ID or URL から material.id を抽出 */
function extractMaterialId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const m = trimmed.match(/\/materials\/([a-z0-9-]+)/i)
  if (m) return m[1]
  if (/^[a-z0-9-]+$/i.test(trimmed)) return trimmed
  return null
}

export function WorksAdmin({
  featuredOptions,
  initialWorks,
}: {
  featuredOptions: Option[]
  initialWorks: Work[]
}) {
  const [works, setWorks] = useState<Work[]>(
    initialWorks.map(w => ({ ...w, createdAt: new Date(w.createdAt).toISOString() })),
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState<Work | null>(null)

  // 共通フィールド
  const [childAge, setChildAge] = useState('')
  const [duration, setDuration] = useState('')
  const [tools, setTools] = useState('')

  // バッチキュー
  const [queue, setQueue] = useState<QueueItem[]>([])

  const photoInputId = 'photo-input-batch'

  // 共通フィールドの自動下書き保存
  const draftLoadedRef = useRef(false)
  const [draftPrompt, setDraftPrompt] = useState<DraftData | null>(null)

  useEffect(() => {
    if (draftLoadedRef.current) return
    draftLoadedRef.current = true
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const d: DraftData = JSON.parse(raw)
      if (!d.childAge && !d.duration && !d.tools) return
      setDraftPrompt(d)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!childAge && !duration && !tools) return
    const draft: DraftData = { childAge, duration, tools, savedAt: Date.now() }
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)) } catch {}
  }, [childAge, duration, tools])

  function restoreDraft() {
    if (!draftPrompt) return
    setChildAge(draftPrompt.childAge)
    setDuration(draftPrompt.duration)
    setTools(draftPrompt.tools)
    setDraftPrompt(null)
  }
  function discardDraft() {
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
    setDraftPrompt(null)
  }

  // featured 素材辞書
  const featuredMap = useMemo(() => {
    const m = new Map<string, string>()
    featuredOptions.forEach(o => m.set(o.id, o.title))
    return m
  }, [featuredOptions])

  // 写真を追加
  function handleFilesAdded(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    const newItems: QueueItem[] = files.map(f => ({
      uid: uid(),
      file: f,
      previewUrl: URL.createObjectURL(f),
      materialInput: '',
      comment: '',
      status: 'pending',
    }))
    setQueue(q => [...q, ...newItems])
    // input をリセット（同じファイルを連続選択できるように）
    e.target.value = ''
  }

  function updateItem(uid: string, patch: Partial<QueueItem>) {
    setQueue(q => q.map(it => (it.uid === uid ? { ...it, ...patch } : it)))
  }

  function removeItem(uid: string) {
    setQueue(q => q.filter(it => it.uid !== uid))
  }

  function clearAll() {
    setQueue([])
  }

  // 各 item の validation
  function validateItem(item: QueueItem): { resolvedId: string; valid: boolean; reason?: string } {
    const id = extractMaterialId(item.materialInput)
    if (!id) return { resolvedId: '', valid: false, reason: '素材IDまたはURLが入力されていません' }
    if (!featuredMap.has(id)) return { resolvedId: id, valid: false, reason: `featured 295件に存在しないID: ${id}` }
    if (!item.comment.trim()) return { resolvedId: id, valid: false, reason: 'コメントが空です' }
    return { resolvedId: id, valid: true }
  }

  // 1件アップロード
  async function uploadOne(item: QueueItem, resolvedId: string): Promise<{ ok: boolean; work?: Work; error?: string }> {
    const fd = new FormData()
    fd.set('photo', item.file)
    fd.set('materialId', resolvedId)
    fd.set('childAge', childAge)
    fd.set('comment', item.comment)
    if (duration) fd.set('duration', duration)
    if (tools) fd.set('tools', tools)
    try {
      const res = await fetch('/api/admin/works', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? '保存失敗' }
      return { ok: true, work: { ...data.work, createdAt: new Date(data.work.createdAt).toISOString() } }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'ネットワークエラー' }
    }
  }

  // バッチアップロード（並列度3）
  async function uploadAll() {
    setError(null)
    setSuccess(null)
    if (!childAge.trim()) {
      setError('共通設定の「年齢ラベル」を入力してください')
      return
    }
    const pendingItems = queue.filter(it => it.status === 'pending' || it.status === 'error')
    if (pendingItems.length === 0) {
      setError('アップロード対象がありません')
      return
    }
    // validate all
    const planned: Array<{ item: QueueItem; resolvedId: string }> = []
    for (const it of pendingItems) {
      const v = validateItem(it)
      if (!v.valid) {
        updateItem(it.uid, { status: 'error', errorMessage: v.reason })
      } else {
        planned.push({ item: it, resolvedId: v.resolvedId })
      }
    }
    if (planned.length === 0) {
      setError('入力に不備のあるカードがあります（各カードの赤いメッセージを確認）')
      return
    }

    setIsUploading(true)
    let okCount = 0
    let errCount = 0
    // 並列度3 のシンプル実装: chunk処理
    const CONCURRENCY = 3
    for (let i = 0; i < planned.length; i += CONCURRENCY) {
      const chunk = planned.slice(i, i + CONCURRENCY)
      // chunk 内は並列で送信
      chunk.forEach(({ item }) => updateItem(item.uid, { status: 'uploading', errorMessage: undefined }))
      const results = await Promise.all(chunk.map(({ item, resolvedId }) => uploadOne(item, resolvedId)))
      results.forEach((r, idx) => {
        const { item } = chunk[idx]
        if (r.ok && r.work) {
          updateItem(item.uid, { status: 'done' })
          setWorks(ws => [r.work!, ...ws])
          okCount++
        } else {
          updateItem(item.uid, { status: 'error', errorMessage: r.error })
          errCount++
        }
      })
    }
    setIsUploading(false)
    if (errCount === 0) {
      setSuccess(`${okCount}件アップロード完了`)
      // 完了したカードをキューから自動削除
      setQueue(q => q.filter(it => it.status !== 'done'))
      setTimeout(() => setSuccess(null), 4000)
    } else {
      setSuccess(`${okCount}件成功 / ${errCount}件失敗。失敗したカードは赤く表示されています`)
      setTimeout(() => setSuccess(null), 6000)
    }
  }

  const filtered = useMemo(() => {
    if (!filter) return works
    const q = filter.toLowerCase()
    return works.filter(w =>
      w.materialId.toLowerCase().includes(q)
      || w.childAge.toLowerCase().includes(q)
      || w.comment.toLowerCase().includes(q),
    )
  }, [works, filter])

  const pendingCount = queue.filter(it => it.status === 'pending' || it.status === 'error').length
  const canUpload = childAge.trim() && pendingCount > 0 && !isUploading

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
      <div className="flex items-baseline justify-between mb-5">
        <h1 className="text-xl sm:text-2xl font-black">作品ギャラリー管理</h1>
        <Link href="/admin" className="text-xs sm:text-sm text-primary hover:underline shrink-0">
          ← 素材管理に戻る
        </Link>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-300 text-red-800 rounded-lg text-sm flex items-start gap-2 sticky top-2 z-10 shadow-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} aria-label="閉じる"><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="mb-3 p-3 bg-green-50 border border-green-300 text-green-800 rounded-lg text-sm flex items-center gap-2 sticky top-2 z-10 shadow-sm">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{success}</span>
          <button onClick={() => setSuccess(null)} aria-label="閉じる"><X className="w-4 h-4" /></button>
        </div>
      )}

      {draftPrompt && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-300 text-blue-900 rounded-lg text-sm flex items-center gap-2">
          <span className="flex-1">
            前回の共通設定が残っています ({new Date(draftPrompt.savedAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })})
          </span>
          <button onClick={restoreDraft} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold">復元</button>
          <button onClick={discardDraft} className="px-3 py-1.5 border border-blue-300 text-blue-800 rounded text-xs font-bold">破棄</button>
        </div>
      )}

      <section className="mb-8 bg-white border border-border rounded-xl p-4 sm:p-5">
        <h2 className="font-bold text-base sm:text-lg mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4" /> 新規バッチアップロード
        </h2>

        {/* 共通設定 */}
        <div className="bg-muted/40 border border-border rounded-lg p-3 mb-4">
          <div className="text-[11px] font-bold text-muted-foreground mb-2">▼ 全件共通設定（1回入力すれば全カードに適用）</div>
          <label className="block mb-2">
            <span className="text-xs font-bold text-muted-foreground">年齢ラベル <span className="text-red-500">*</span></span>
            <input
              value={childAge}
              onChange={e => setChildAge(e.target.value)}
              placeholder="例: 2歳10ヶ月 / 5歳 / 編集部試し塗り"
              className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg text-base"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs font-bold text-muted-foreground">時間（分・任意）</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="18"
                className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg text-base"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-muted-foreground">画材（任意）</span>
              <input
                value={tools}
                onChange={e => setTools(e.target.value)}
                placeholder="クレヨン12色"
                className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg text-base"
              />
            </label>
          </div>
        </div>

        {/* 写真追加ボタン */}
        <div className="mb-4">
          <label
            htmlFor={photoInputId}
            className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg py-4 cursor-pointer hover:border-primary hover:bg-muted/30 transition-colors"
          >
            <Plus className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold">写真を追加（複数選択OK）</span>
          </label>
          <input
            id={photoInputId}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesAdded}
            className="hidden"
          />
          <p className="text-[11px] text-muted-foreground mt-1 text-center">
            ライブラリから複数枚タップして選択。各カードに素材ID/URLとコメントを入力 → 全部アップロード。
          </p>
        </div>

        {/* キューカード */}
        {queue.length > 0 && (
          <>
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-xs font-bold text-muted-foreground">
                選択中: {queue.length}件 (pending {pendingCount})
              </div>
              <button
                type="button"
                onClick={clearAll}
                disabled={isUploading}
                className="text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                全てクリア
              </button>
            </div>
            <div className="space-y-3 mb-4">
              {queue.map(item => (
                <QueueCard
                  key={item.uid}
                  item={item}
                  featuredMap={featuredMap}
                  onChange={(patch) => updateItem(item.uid, patch)}
                  onRemove={() => removeItem(item.uid)}
                  disabled={isUploading}
                />
              ))}
            </div>
          </>
        )}

        <button
          type="button"
          onClick={uploadAll}
          disabled={!canUpload}
          className="w-full px-6 py-3.5 bg-primary text-white rounded-lg font-bold text-sm disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
        >
          {isUploading ? (<><Loader2 className="w-4 h-4 animate-spin" />アップロード中…</>) : `${pendingCount}件をアップロード`}
        </button>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3 gap-3">
          <h2 className="font-bold text-base sm:text-lg shrink-0">登録済み（{works.length}件）</h2>
          <input
            type="search"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="絞り込み"
            className="px-3 py-2 border border-border rounded-lg text-sm w-32 sm:w-48"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-muted p-6 rounded-lg text-center">
            {works.length === 0 ? 'まだ作品がありません。' : '該当する作品なし'}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map(w => (
              <button
                key={w.id}
                type="button"
                onClick={() => setEditing(w)}
                className={`group block text-left border border-border rounded-lg overflow-hidden bg-white active:opacity-80 transition-opacity ${!w.published && 'opacity-60'}`}
              >
                <div className="relative aspect-square bg-muted">
                  <Image
                    src={w.photoUrl}
                    alt={w.childAge}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 25vw"
                    unoptimized
                  />
                  {!w.published && (
                    <div className="absolute top-1.5 left-1.5 bg-white/90 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                      <EyeOff className="w-3 h-3" /> 非公開
                    </div>
                  )}
                </div>
                <div className="p-2 space-y-1 text-xs">
                  <div className="font-bold truncate">{w.childAge}</div>
                  <div className="font-mono text-[10px] text-muted-foreground truncate">{w.materialId}</div>
                  <p className="text-foreground/80 line-clamp-2 text-[11px]">{w.comment}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {editing && (
        <EditWorkModal
          work={editing}
          onClose={() => setEditing(null)}
          onUpdate={updated => setWorks(ws => ws.map(w => (w.id === updated.id ? updated : w)))}
          onDelete={id => setWorks(ws => ws.filter(w => w.id !== id))}
        />
      )}
    </div>
  )
}

function QueueCard({
  item,
  featuredMap,
  onChange,
  onRemove,
  disabled,
}: {
  item: QueueItem
  featuredMap: Map<string, string>
  onChange: (patch: Partial<QueueItem>) => void
  onRemove: () => void
  disabled: boolean
}) {
  const resolvedId = extractMaterialId(item.materialInput)
  const resolvedTitle = resolvedId ? featuredMap.get(resolvedId) : undefined
  const isValid = !!resolvedTitle

  const statusBg =
    item.status === 'done' ? 'bg-green-50 border-green-300'
    : item.status === 'uploading' ? 'bg-blue-50 border-blue-300'
    : item.status === 'error' ? 'bg-red-50 border-red-300'
    : 'bg-white border-border'

  return (
    <div className={`flex gap-3 border rounded-lg p-2 ${statusBg}`}>
      <div className="relative w-20 sm:w-24 h-20 sm:h-24 shrink-0 rounded overflow-hidden bg-muted">
        <Image src={item.previewUrl} alt="" fill className="object-cover" unoptimized />
        {item.status === 'uploading' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
        )}
        {item.status === 'done' && (
          <div className="absolute inset-0 bg-green-600/70 flex items-center justify-center">
            <Check className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        <input
          value={item.materialInput}
          onChange={e => onChange({ materialInput: e.target.value })}
          placeholder="素材ID または ページURL"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled || item.status === 'done'}
          className="w-full px-2.5 py-2 border border-border rounded text-sm font-mono"
        />
        {resolvedTitle && (
          <div className="text-[11px] text-green-700 truncate">✓ {resolvedTitle}</div>
        )}
        {item.materialInput && !isValid && (
          <div className="text-[11px] text-amber-700">⚠ 該当する素材なし</div>
        )}
        <textarea
          value={item.comment}
          onChange={e => onChange({ comment: e.target.value })}
          placeholder="体験コメント"
          rows={2}
          disabled={disabled || item.status === 'done'}
          className="w-full px-2.5 py-2 border border-border rounded text-sm resize-y"
        />
        {item.errorMessage && (
          <div className="text-[11px] text-red-700">✗ {item.errorMessage}</div>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="w-8 h-8 shrink-0 flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-red-600 disabled:opacity-30"
        aria-label="このカードを削除"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
