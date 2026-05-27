'use client'

import { useState, useTransition, useMemo, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Upload, AlertCircle, Camera, X, EyeOff, Sparkles, Loader2 } from 'lucide-react'
import { MaterialPicker, type MaterialOption } from './MaterialPicker'
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

type DetectStatus = 'idle' | 'detecting' | 'detected' | 'failed'
type DraftData = {
  materialId: string
  childAge: string
  comment: string
  duration: string
  tools: string
  savedAt: number
}
const DRAFT_KEY = 'gallery-works-draft-v1'

export function WorksAdmin({
  featuredOptions,
  initialWorks,
}: {
  featuredOptions: MaterialOption[]
  initialWorks: Work[]
}) {
  const [works, setWorks] = useState<Work[]>(
    initialWorks.map(w => ({ ...w, createdAt: new Date(w.createdAt).toISOString() })),
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState<Work | null>(null)

  // フォーム制御
  const [materialId, setMaterialId] = useState('')
  const [childAge, setChildAge] = useState('')
  const [comment, setComment] = useState('')
  const [duration, setDuration] = useState('')
  const [tools, setTools] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [detectStatus, setDetectStatus] = useState<DetectStatus>('idle')
  const [detectInfo, setDetectInfo] = useState<{ confidence?: string; reasoning?: string } | null>(null)
  const photoInputId = 'photo-input'

  // 下書き復元プロンプト
  const [draftPrompt, setDraftPrompt] = useState<DraftData | null>(null)
  const draftSavedRef = useRef(false) // 一度復元プロンプトを出したら以後は出さない

  // マウント時に下書き読み込み
  useEffect(() => {
    if (draftSavedRef.current) return
    draftSavedRef.current = true
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const d: DraftData = JSON.parse(raw)
      if (!d.materialId && !d.childAge && !d.comment) return
      setDraftPrompt(d)
    } catch {
      // ignore
    }
  }, [])

  // フォーム入力ごとに下書き自動保存
  useEffect(() => {
    if (!materialId && !childAge && !comment && !duration && !tools) return
    const draft: DraftData = { materialId, childAge, comment, duration, tools, savedAt: Date.now() }
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {
      // ignore (容量超過など)
    }
  }, [materialId, childAge, comment, duration, tools])

  function restoreDraft() {
    if (!draftPrompt) return
    setMaterialId(draftPrompt.materialId)
    setChildAge(draftPrompt.childAge)
    setComment(draftPrompt.comment)
    setDuration(draftPrompt.duration)
    setTools(draftPrompt.tools)
    setDraftPrompt(null)
  }

  function discardDraft() {
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
    setDraftPrompt(null)
  }

  function resetForm() {
    setMaterialId('')
    setChildAge('')
    setComment('')
    setDuration('')
    setTools('')
    setPhotoPreview(null)
    setDetectStatus('idle')
    setDetectInfo(null)
    const el = document.getElementById(photoInputId) as HTMLInputElement | null
    if (el) el.value = ''
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) {
      setPhotoPreview(null)
      setDetectStatus('idle')
      setDetectInfo(null)
      return
    }
    setPhotoPreview(URL.createObjectURL(f))
    // AI 自動判定をバックグラウンド実行
    setDetectStatus('detecting')
    setDetectInfo(null)
    const fd = new FormData()
    fd.append('photo', f)
    try {
      const res = await fetch('/api/admin/works/detect-material', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok && data.materialId) {
        setMaterialId(data.materialId)
        setDetectStatus('detected')
        setDetectInfo({ confidence: data.confidence, reasoning: data.reasoning })
      } else {
        setDetectStatus('failed')
        setDetectInfo({ reasoning: data.reasoning ?? data.error ?? '判定不能' })
      }
    } catch {
      setDetectStatus('failed')
      setDetectInfo({ reasoning: 'ネットワークエラー' })
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!materialId) {
      setError('素材を選択してください')
      return
    }
    const fd = new FormData(e.currentTarget)
    fd.set('materialId', materialId)

    startTransition(async () => {
      const res = await fetch('/api/admin/works', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '保存に失敗しました')
        return
      }
      const work = { ...data.work, createdAt: new Date(data.work.createdAt).toISOString() }
      setWorks(w => [work, ...w])
      setSuccess(`登録しました: ${data.work.materialId}`)
      resetForm()
      setTimeout(() => setSuccess(null), 5000)
    })
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

  const canSubmit = materialId && childAge && comment && photoPreview && !isPending

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
          <span className="flex-1">{success}</span>
          <button onClick={() => setSuccess(null)} aria-label="閉じる"><X className="w-4 h-4" /></button>
        </div>
      )}

      {draftPrompt && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-300 text-blue-900 rounded-lg text-sm flex items-center gap-2">
          <span className="flex-1">
            下書きが見つかりました ({new Date(draftPrompt.savedAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })})
          </span>
          <button
            onClick={restoreDraft}
            className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold"
          >
            復元
          </button>
          <button
            onClick={discardDraft}
            className="px-3 py-1.5 border border-blue-300 text-blue-800 rounded text-xs font-bold"
          >
            破棄
          </button>
        </div>
      )}

      <section className="mb-8 bg-white border border-border rounded-xl p-4 sm:p-5">
        <h2 className="font-bold text-base sm:text-lg mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4" /> 新規アップロード
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 写真 */}
          <div>
            <label className="block">
              <span className="text-xs font-bold text-muted-foreground">写真 <span className="text-red-500">*</span></span>
              <span className="text-[11px] text-muted-foreground ml-2">（選ぶとAIが素材IDを自動判定）</span>
            </label>
            {photoPreview ? (
              <div className="mt-1 relative aspect-[4/3] max-h-72 rounded-lg overflow-hidden border border-border bg-muted">
                <Image src={photoPreview} alt="プレビュー" fill className="object-contain" unoptimized />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoPreview(null)
                    setDetectStatus('idle')
                    setDetectInfo(null)
                    const el = document.getElementById(photoInputId) as HTMLInputElement | null
                    if (el) el.value = ''
                  }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
                  aria-label="写真をクリア"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor={photoInputId}
                className="mt-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg py-8 cursor-pointer hover:border-primary hover:bg-muted/30 transition-colors"
              >
                <Camera className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm font-bold">写真を選ぶ・撮影</span>
                <span className="text-[11px] text-muted-foreground">JPEG/PNG/HEIC・15MBまで・1600pxに最適化</span>
              </label>
            )}
            <input
              id={photoInputId}
              type="file"
              name="photo"
              accept="image/*"
              capture="environment"
              required
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* 素材ID + AI判定状態 */}
          <div>
            <label className="block">
              <span className="text-xs font-bold text-muted-foreground">どの素材を塗ったか <span className="text-red-500">*</span></span>
            </label>
            <div className="mt-1">
              <MaterialPicker options={featuredOptions} value={materialId} onChange={setMaterialId} />
            </div>
            {detectStatus === 'detecting' && (
              <div className="mt-2 flex items-center gap-2 text-[12px] text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> AIが素材を判定中…
              </div>
            )}
            {detectStatus === 'detected' && (
              <div className="mt-2 flex items-start gap-2 text-[12px] text-green-700 bg-green-50 border border-green-200 rounded p-2">
                <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="font-bold">AI判定: {detectInfo?.confidence ?? '?'} confidence</div>
                  {detectInfo?.reasoning && <div className="text-green-800/80 mt-0.5">{detectInfo.reasoning}</div>}
                  <div className="text-green-800/70 mt-0.5">合っていなければタップして手動で選択し直してください</div>
                </div>
              </div>
            )}
            {detectStatus === 'failed' && (
              <div className="mt-2 flex items-start gap-2 text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="font-bold">AI判定に失敗</div>
                  {detectInfo?.reasoning && <div className="text-amber-800/80 mt-0.5">{detectInfo.reasoning}</div>}
                  <div className="text-amber-800/70 mt-0.5">手動で素材を選択してください</div>
                </div>
              </div>
            )}
          </div>

          {/* 年齢 */}
          <label className="block">
            <span className="text-xs font-bold text-muted-foreground">年齢ラベル <span className="text-red-500">*</span></span>
            <input
              name="childAge"
              required
              value={childAge}
              onChange={e => setChildAge(e.target.value)}
              placeholder="例: 2歳10ヶ月 / 5歳 / 編集部試し塗り"
              className="mt-1 w-full px-3 py-3 border border-border rounded-lg text-base"
            />
            <span className="text-[11px] text-muted-foreground mt-1 block">
              ※ プライバシー保護のため表示は「2歳」「2歳半」「2歳すぎ」に自動正規化されます
            </span>
          </label>

          {/* コメント */}
          <label className="block">
            <span className="text-xs font-bold text-muted-foreground">体験コメント <span className="text-red-500">*</span></span>
            <textarea
              name="comment"
              required
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              placeholder="例: 途中で「キリンさんの首長いね」と言いながら塗っていました。最後の方は集中力が切れて適当に。"
              className="mt-1 w-full px-3 py-3 border border-border rounded-lg text-base"
            />
          </label>

          {/* オプション */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold text-muted-foreground">時間（分・任意）</span>
              <input
                type="number"
                name="duration"
                inputMode="numeric"
                min="0"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="18"
                className="mt-1 w-full px-3 py-3 border border-border rounded-lg text-base"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-muted-foreground">画材（任意）</span>
              <input
                name="tools"
                value={tools}
                onChange={e => setTools(e.target.value)}
                placeholder="クレヨン12色"
                className="mt-1 w-full px-3 py-3 border border-border rounded-lg text-base"
              />
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-3.5 border border-border rounded-lg text-sm font-bold text-muted-foreground hover:bg-muted"
            >
              クリア
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 px-6 py-3.5 bg-primary text-white rounded-lg font-bold text-sm disabled:opacity-40 active:opacity-80 transition-opacity"
            >
              {isPending ? '保存中…' : '作品を登録'}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            ※ テキスト入力は自動的に下書き保存されます（写真を除く）
          </p>
        </form>
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
