'use client'

import { useState, useCallback, useRef } from 'react'
import type { SuggestedMeta } from '@/app/api/admin/analyze-image/route'

type ItemStatus = 'pending' | 'uploading' | 'done' | 'error'

type UploadItem = {
  id: string
  file: File
  preview: string
  status: ItemStatus
  intendedId: string   // ユーザーが指定するID（例: elephant-simple-1）
  meta?: SuggestedMeta
  snippet?: string
  savedPath?: string
  error?: string
  appended?: boolean
}

const CATEGORIES = [
  { value: 'coloring',        label: 'ぬりえ' },
  { value: 'adult-coloring',  label: '大人ぬりえ' },
  { value: 'hiragana',        label: 'ひらがな' },
  { value: 'numbers',    label: '数字・数え方' },
  { value: 'drawing',    label: '運筆' },
  { value: 'maze',       label: '迷路' },
  { value: 'dotconnect', label: '点つなぎ' },
  { value: 'craft',      label: '工作' },
  { value: 'scissors',   label: 'ハサミ練習' },
]

export function ImageUploader() {
  const [items, setItems]       = useState<UploadItem[]>([])
  const [isDragOver, setDragOver] = useState(false)
  const [allCopied, setAllCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const updateItem = (id: string, patch: Partial<UploadItem>) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it))

  const processFile = useCallback(async (item: UploadItem) => {
    updateItem(item.id, { status: 'uploading' })
    try {
      const fd = new FormData()
      fd.append('image', item.file)
      if (item.intendedId) fd.append('intendedId', item.intendedId)
      const res  = await fetch('/api/admin/analyze-image', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Unknown error')
      // data.ts に自動追記
      let appended = false
      try {
        const appendRes = await fetch('/api/admin/append-material', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ snippet: json.snippet }),
        })
        appended = appendRes.ok
      } catch { /* 追記失敗してもUIは続行 */ }

      updateItem(item.id, {
        status: 'done',
        meta: json.meta,
        snippet: json.snippet,
        savedPath: json.savedPath,
        appended,
      })
    } catch (e) {
      updateItem(item.id, { status: 'error', error: e instanceof Error ? e.message : 'エラー' })
    }
  }, [])

  const addFiles = useCallback((files: File[]) => {
    const newItems: UploadItem[] = files.map(file => {
      // ファイル名から拡張子を除いてデフォルトIDに（例: elephant-simple-1.png → elephant-simple-1）
      const defaultId = file.name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9-]/gi, '-').toLowerCase()
      return {
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        status: 'pending',
        intendedId: defaultId,
      }
    })
    setItems(prev => [...prev, ...newItems])
  }, [])

  const startUpload = useCallback(() => {
    // setItems の updater 内で副作用を呼ぶと React Strict Mode で2回実行される。
    // items を closure から直接読んで副作用を updater の外に置く。
    const pending = items.filter(it => it.status === 'pending')
    pending.reduce((chain, item) => chain.then(() => processFile(item)), Promise.resolve())
  }, [items, processFile])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files).filter(f =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
    )
    if (files.length) addFiles(files)
  }, [addFiles])

  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true) }
  const onDragLeave = () => setDragOver(false)

  const updateMeta = (id: string, key: keyof SuggestedMeta, value: unknown) => {
    setItems(prev => prev.map(it => {
      if (it.id !== id || !it.meta) return it
      const next = { ...it.meta, [key]: value }
      return { ...it, meta: next, snippet: buildSnippet(next, it.savedPath ?? '') }
    }))
  }

  const copyAll = async () => {
    const all = items.filter(it => it.snippet).map(it => it.snippet).join('\n\n')
    await navigator.clipboard.writeText(all)
    setAllCopied(true)
    setTimeout(() => setAllCopied(false), 2000)
  }

  const pendingItems = items.filter(it => it.status === 'pending')
  const doneCount    = items.filter(it => it.status === 'done').length
  const allDone      = items.length > 0 && items.every(it => it.status === 'done' || it.status === 'error')
  const isProcessing = items.some(it => it.status === 'uploading')

  return (
    <div className="space-y-6">

      {/* ドロップゾーン */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className={[
          'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all',
          isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={e => {
            const files = Array.from(e.target.files ?? [])
            if (files.length) addFiles(files)
            e.target.value = ''
          }}
        />
        <div className="text-5xl mb-3">🖼️</div>
        <p className="text-sm font-medium text-gray-700">
          画像をドロップ、またはクリックして選択（複数可）
        </p>
        <p className="text-xs text-gray-400 mt-1">JPG / PNG / WebP</p>
      </div>

      {/* 確認ボタン：pending があるとき表示 */}
      {pendingItems.length > 0 && !isProcessing && (
        <div className="flex gap-3">
          <button
            onClick={startUpload}
            className="py-3 px-6 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            ⬆️ アップロード（{pendingItems.length}枚）
          </button>
          <button
            onClick={() => setItems(prev => prev.filter(it => it.status !== 'pending'))}
            className="px-5 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            キャンセル
          </button>
        </div>
      )}

      {/* 進捗バー */}
      {items.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-100 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${(doneCount / items.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 shrink-0">{doneCount} / {items.length} 完了</span>
        </div>
      )}

      {/* 結果一覧 */}
      {items.map(item => (
        <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden">

          {/* ヘッダー */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.preview} alt="" className="w-12 h-9 object-cover rounded" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{item.file.name}</p>
              {item.savedPath && (
                <p className="text-xs text-gray-400 truncate">{item.savedPath}</p>
              )}
            </div>
            <StatusBadge status={item.status} />
          </div>

          {/* pending: IDを入力させる */}
          {item.status === 'pending' && (
            <div className="px-4 py-3 flex items-center gap-3">
              <label className="text-xs text-gray-500 shrink-0">ID</label>
              <input
                type="text"
                value={item.intendedId}
                onChange={e => updateItem(item.id, { intendedId: e.target.value })}
                placeholder="例: elephant-simple-1"
                className="input flex-1 font-mono text-xs"
              />
            </div>
          )}

          {/* エラー */}
          {item.status === 'error' && (
            <div className="px-4 py-3 text-sm text-red-600">⚠️ {item.error}</div>
          )}

          {/* 解析中 */}
          {item.status === 'uploading' && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-blue-700">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Claude Vision で解析中…
            </div>
          )}

          {/* 完了 */}
          {item.status === 'done' && item.meta && (
            <div className="p-4 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">ID</label>
                  <input
                    type="text"
                    value={item.meta.id}
                    onChange={e => updateMeta(item.id, 'id', e.target.value)}
                    className="input mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">タイトル</label>
                  <input
                    type="text"
                    value={item.meta.title}
                    onChange={e => updateMeta(item.id, 'title', e.target.value)}
                    className="input mt-0.5"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500">説明文</label>
                  <textarea
                    value={item.meta.description}
                    onChange={e => updateMeta(item.id, 'description', e.target.value)}
                    rows={2}
                    className="input mt-0.5 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">カテゴリ</label>
                  <select
                    value={item.meta.category}
                    onChange={e => updateMeta(item.id, 'category', e.target.value)}
                    className="input mt-0.5"
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">年齢</label>
                  <div className="flex gap-2 mt-0.5">
                    <select
                      value={item.meta.ageMin}
                      onChange={e => updateMeta(item.id, 'ageMin', Number(e.target.value))}
                      className="input flex-1"
                    >
                      {[2,3,4,5,6].map(a => <option key={a} value={a}>{a}歳〜</option>)}
                    </select>
                    <select
                      value={item.meta.ageMax}
                      onChange={e => updateMeta(item.id, 'ageMax', Number(e.target.value))}
                      className="input flex-1"
                    >
                      {[2,3,4,5,6].map(a => <option key={a} value={a}>〜{a}歳</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* 追記ステータス */}
              {item.appended
                ? <p className="text-xs text-green-600 font-medium">✅ data.ts に自動追記しました</p>
                : <p className="text-xs text-yellow-600 font-medium">⚠️ 自動追記失敗 — 下のスニペットを手動でコピーしてください</p>
              }

              {/* スニペット */}
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-800">
                  <span className="text-xs text-gray-400 font-mono">data.ts スニペット</span>
                  <CopyButton text={item.snippet ?? ''} />
                </div>
                <pre className="px-4 py-3 text-xs text-green-400 font-mono overflow-x-auto whitespace-pre leading-relaxed">
                  {item.snippet}
                </pre>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* 全部コピー */}
      {allDone && doneCount > 1 && (
        <button
          onClick={copyAll}
          className={[
            'w-full py-3 rounded-xl text-sm font-medium transition-colors',
            allCopied ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700',
          ].join(' ')}
        >
          {allCopied ? '✅ コピー済み' : `📋 ${doneCount}件のスニペットをまとめてコピー`}
        </button>
      )}

      {/* リセット */}
      {items.length > 0 && (
        <button
          onClick={() => setItems([])}
          className="text-xs text-gray-400 hover:text-gray-600 underline"
        >
          クリアして最初から
        </button>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: ItemStatus }) {
  const map: Record<ItemStatus, { label: string; className: string }> = {
    pending:   { label: '待機中', className: 'bg-gray-100 text-gray-500' },
    uploading: { label: '解析中', className: 'bg-blue-100 text-blue-700' },
    done:      { label: '完了',   className: 'bg-green-100 text-green-700' },
    error:     { label: 'エラー', className: 'bg-red-100 text-red-700' },
  }
  const { label, className } = map[status]
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${className}`}>{label}</span>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className={[
        'text-xs px-2 py-1 rounded font-medium transition-colors',
        copied ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600',
      ].join(' ')}
    >
      {copied ? '✅' : '📋 コピー'}
    </button>
  )
}

function buildSnippet(meta: SuggestedMeta, savedPath: string): string {
  const lines: (string | null)[] = [
    `  {`,
    `    id: '${meta.id}',`,
    `    title: '${meta.title}',`,
    `    description: '${meta.description}',`,
    `    ageMin: ${meta.ageMin},`,
    `    ageMax: ${meta.ageMax},`,
    `    difficulty: ${meta.difficulty},`,
    `    duration: ${meta.duration},`,
    `    category: '${meta.category}',`,
    meta.theme   ? `    theme: '${meta.theme}',`   : null,
    `    tags: [${meta.tags.map(t => `'${t}'`).join(', ')}],`,
    meta.season  ? `    season: '${meta.season}',`  : null,
    meta.event   ? `    event: '${meta.event}',`    : null,
    `    tools: [${meta.tools.map(t => `'${t}'`).join(', ')}],`,
    `    activityIdeas: [`,
    ...meta.activityIdeas.map(a => `      '${a}',`),
    `    ],`,
    `    imageUrl: '${savedPath}',`,
    `    illustUrl: '${savedPath}',`,
    `    illustVersion: 1,`,
    `    imageStatus: 'pending_review',`,
    `    pdfUrl: '',`,
    `    createdAt: '${new Date().toISOString().split('T')[0]}',`,
    `    popular: false,`,
    `  },`,
  ]
  return lines.filter((l): l is string => l !== null).join('\n')
}
