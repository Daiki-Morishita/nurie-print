'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Plus, X, Send, FileText, Calendar, Loader2 } from 'lucide-react'
import type { PostDTO } from './PostsAdmin'

type Option = { id: string; title: string }

type ImageItem = {
  uid: string
  file: File
  previewUrl: string
}

type Draft = {
  title: string
  body: string
  materialUrls: string
  savedAt: number
}
const DRAFT_KEY = 'post-composer-draft-v1'

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

/** 入力テキストから素材ID配列を解決 */
function resolveMaterialIds(input: string, titleMap: Map<string, string>): { ids: string[]; invalid: string[] } {
  const tokens = input.split(/[\s,]+/).map(t => t.trim()).filter(Boolean)
  const ids: string[] = []
  const invalid: string[] = []
  for (const t of tokens) {
    const m = t.match(/\/materials\/([a-z0-9-]+)/i)
    const id = m ? m[1] : (/^[a-z0-9-]+$/i.test(t) ? t : null)
    if (id && titleMap.has(id)) {
      if (!ids.includes(id)) ids.push(id)
    } else if (id) {
      invalid.push(id)
    } else {
      invalid.push(t)
    }
  }
  return { ids, invalid }
}

export function PostComposer({
  featuredOptions: _featuredOptions,
  titleMap,
  onCreated,
  onError,
}: {
  featuredOptions: Option[]
  titleMap: Map<string, string>
  onCreated: (post: PostDTO) => void
  onError: (msg: string) => void
}) {
  const [images, setImages] = useState<ImageItem[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [materialUrls, setMaterialUrls] = useState('')
  const [scheduledAt, setScheduledAt] = useState('') // datetime-local 形式
  const [showSchedulePicker, setShowSchedulePicker] = useState(false)
  const [submitting, setSubmitting] = useState<'draft' | 'publish' | 'schedule' | null>(null)
  const [processing, setProcessing] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const fileInputId = 'composer-photos'

  // 下書き読込
  const draftLoadedRef = useRef(false)
  useEffect(() => {
    if (draftLoadedRef.current) return
    draftLoadedRef.current = true
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const d: Draft = JSON.parse(raw)
      if (d.title || d.body || d.materialUrls) {
        setTitle(d.title)
        setBody(d.body)
        setMaterialUrls(d.materialUrls)
      }
    } catch {}
  }, [])
  useEffect(() => {
    if (!title && !body && !materialUrls) return
    try {
      const draft: Draft = { title, body, materialUrls, savedAt: Date.now() }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {}
  }, [title, body, materialUrls])

  // textarea 自動リサイズ
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.style.height = 'auto'
      bodyRef.current.style.height = `${Math.min(bodyRef.current.scrollHeight, 400)}px`
    }
  }, [body])

  async function handleFilesAdded(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    e.target.value = ''
    setProcessing(true)
    // クライアント側で JPEG 圧縮（HEIC対応・Vercel body 4.5MB 制限対策）
    const newItems: ImageItem[] = []
    for (const f of files) {
      try {
        const compressed = await compressToJpeg(f, 1600, 0.82)
        newItems.push({
          uid: uid(),
          file: compressed,
          previewUrl: URL.createObjectURL(compressed),
        })
      } catch {
        newItems.push({ uid: uid(), file: f, previewUrl: URL.createObjectURL(f) })
      }
    }
    setImages(imgs => [...imgs, ...newItems])
    setProcessing(false)
  }

  /** HEIC を JPEG に変換（heic2any を dynamic import で必要時のみロード） */
  async function convertHeicToJpeg(file: File): Promise<File> {
    const looksHeic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)
    if (!looksHeic) return file
    const mod = await import('heic2any')
    const heic2any = mod.default
    const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
    const blob = Array.isArray(out) ? out[0] : out
    return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
  }

  /** 画像を 1600px JPEG q=0.82 に圧縮。HEIC は heic2any 経由で JPEG 化してから処理。 */
  async function compressToJpeg(file: File, maxDim: number, quality: number): Promise<File> {
    // 先に HEIC → JPEG に変換しておく（Chrome/Firefox は HEIC をデコードできない）
    const workFile = await convertHeicToJpeg(file)
    let bitmap: ImageBitmap
    try {
      bitmap = await createImageBitmap(workFile)
    } catch {
      // createImageBitmap が失敗した場合 → Image element fallback
      const img = new window.Image()
      const url = URL.createObjectURL(workFile)
      try {
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error('image decode failed'))
          img.src = url
        })
      } finally {
        URL.revokeObjectURL(url)
      }
      const canvas = document.createElement('canvas')
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
      canvas.width = Math.round(img.naturalWidth * scale)
      canvas.height = Math.round(img.naturalHeight * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('ctx unavailable')
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', quality),
      )
      return new File([blob], workFile.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
    }
    const canvas = document.createElement('canvas')
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('ctx unavailable')
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', quality),
    )
    return new File([blob], workFile.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
  }

  function removeImage(uid: string) {
    setImages(imgs => imgs.filter(i => i.uid !== uid))
  }

  function moveImage(uid: string, direction: -1 | 1) {
    setImages(imgs => {
      const idx = imgs.findIndex(i => i.uid === uid)
      if (idx === -1) return imgs
      const newIdx = idx + direction
      if (newIdx < 0 || newIdx >= imgs.length) return imgs
      const next = [...imgs]
      ;[next[idx], next[newIdx]] = [next[newIdx], next[idx]]
      return next
    })
  }

  function resetForm() {
    setImages([])
    setTitle('')
    setBody('')
    setMaterialUrls('')
    setScheduledAt('')
    setShowSchedulePicker(false)
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
  }

  const resolved = resolveMaterialIds(materialUrls, titleMap)
  const canSubmit = (body.trim().length > 0 || images.length > 0) && submitting === null

  async function submit(kind: 'draft' | 'publish' | 'schedule') {
    if (!body.trim() && images.length === 0) {
      onError('本文か写真のどちらかは必要です')
      return
    }
    if (kind === 'schedule' && !scheduledAt) {
      onError('予約日時を選んでください')
      return
    }
    setSubmitting(kind)
    const fd = new FormData()
    images.forEach(img => fd.append('photos', img.file))
    if (title.trim()) fd.set('title', title)
    fd.set('body', body)
    if (resolved.ids.length > 0) fd.set('materialIds', resolved.ids.join(','))
    if (kind === 'publish') {
      fd.set('publishedAt', new Date().toISOString())
    } else if (kind === 'schedule') {
      fd.set('publishedAt', new Date(scheduledAt).toISOString())
    }
    // draft は publishedAt 空 → DB は NULL

    try {
      const res = await fetch('/api/admin/posts', { method: 'POST', body: fd })
      // 413 Request Entity Too Large 等で Vercel が HTML/text を返した場合、JSON.parse は失敗する
      const text = await res.text()
      let data: { ok?: boolean; error?: string; post?: { id: string; publishedAt: string | null; createdAt: string; updatedAt: string; title: string | null; body: string; materialIds: string[]; images: { id: string; url: string; order: number }[] } } = {}
      try {
        data = JSON.parse(text)
      } catch {
        // JSON でない = サーバーがエラーレスポンス（413 等）
        if (res.status === 413 || /entity too large/i.test(text)) {
          onError('画像のサイズが大きすぎます。枚数を減らすか、画像を別途圧縮してください')
        } else {
          onError(`サーバーエラー (${res.status})`)
        }
        setSubmitting(null)
        return
      }
      if (!res.ok || !data.post) {
        onError(data.error ?? '投稿に失敗しました')
        setSubmitting(null)
        return
      }
      onCreated({
        ...data.post,
        publishedAt: data.post.publishedAt,
        createdAt: data.post.createdAt,
        updatedAt: data.post.updatedAt,
      })
      resetForm()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'ネットワークエラー')
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <section className="mb-8 bg-white border border-border rounded-xl p-4 sm:p-5">
      <h2 className="font-bold text-base sm:text-lg mb-4">新規投稿</h2>

      {/* 画像 */}
      <div className="mb-4">
        {images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2 -mx-1 px-1">
            {images.map((img, idx) => (
              <div key={img.uid} className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden border border-border bg-muted group">
                <Image src={img.previewUrl} alt="" fill className="object-cover" unoptimized />
                <button
                  type="button"
                  onClick={() => removeImage(img.uid)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center"
                  aria-label="削除"
                >
                  <X className="w-3 h-3" />
                </button>
                {idx > 0 && (
                  <button type="button" onClick={() => moveImage(img.uid, -1)} className="absolute bottom-1 left-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs">←</button>
                )}
                {idx < images.length - 1 && (
                  <button type="button" onClick={() => moveImage(img.uid, 1)} className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs">→</button>
                )}
                <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold rounded px-1.5 py-0.5">{idx + 1}</div>
              </div>
            ))}
          </div>
        )}
        <label
          htmlFor={fileInputId}
          className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-lg py-3 transition-colors text-sm ${
            processing
              ? 'border-blue-300 bg-blue-50 text-blue-700 cursor-wait'
              : 'border-border cursor-pointer hover:border-primary hover:bg-muted/30'
          }`}
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>変換中… (HEICはJPEGに変換しています)</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>写真を追加（複数OK・並びは矢印で変更）</span>
            </>
          )}
        </label>
        <input
          id={fileInputId}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          disabled={processing}
          onChange={handleFilesAdded}
          className="hidden"
        />
      </div>

      {/* タイトル */}
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="タイトル（任意・未入力なら本文先頭から自動）"
        className="w-full px-3 py-2 mb-2 border border-border rounded-lg text-base"
      />

      {/* 本文 */}
      <textarea
        ref={bodyRef}
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="本文。何をした日か・どんな様子だったか・気づきを自由に。"
        rows={4}
        className="w-full px-3 py-3 mb-3 border border-border rounded-lg text-base resize-none"
      />

      {/* 関連塗り絵 */}
      <div className="mb-4">
        <label className="text-xs font-bold text-muted-foreground block mb-1">
          関連する塗り絵（任意・スペース or 改行区切りで複数OK）
        </label>
        <textarea
          value={materialUrls}
          onChange={e => setMaterialUrls(e.target.value)}
          placeholder="bear-simple-1&#10;https://nurie-print.com/materials/cat-easy"
          rows={2}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono"
        />
        {resolved.ids.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {resolved.ids.map(id => (
              <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-800 rounded text-[11px] border border-green-200">
                ✓ {titleMap.get(id)}
              </span>
            ))}
          </div>
        )}
        {resolved.invalid.length > 0 && (
          <div className="text-[11px] text-amber-700 mt-1">⚠ 該当なし: {resolved.invalid.join(', ')}</div>
        )}
      </div>

      {/* 予約日時 */}
      {showSchedulePicker && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <label className="text-xs font-bold text-blue-900 block mb-1">
            <Calendar className="w-3 h-3 inline mr-1" />予約公開日時
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full px-3 py-2 border border-border rounded text-sm"
          />
        </div>
      )}

      {/* アクション */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={() => submit('draft')}
          disabled={!canSubmit}
          className="px-4 py-2.5 border border-border rounded-lg text-sm font-bold text-muted-foreground hover:bg-muted disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          {submitting === 'draft' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          下書き保存
        </button>
        <button
          type="button"
          onClick={() => setShowSchedulePicker(s => !s)}
          className={`px-4 py-2.5 border rounded-lg text-sm font-bold inline-flex items-center gap-1.5 ${showSchedulePicker ? 'border-blue-300 bg-blue-50 text-blue-900' : 'border-border text-muted-foreground hover:bg-muted'}`}
        >
          <Calendar className="w-4 h-4" />
          予約
        </button>
        {showSchedulePicker && (
          <button
            type="button"
            onClick={() => submit('schedule')}
            disabled={!canSubmit || !scheduledAt}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {submitting === 'schedule' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            予約する
          </button>
        )}
        <button
          type="button"
          onClick={() => submit('publish')}
          disabled={!canSubmit}
          className="flex-1 sm:flex-none px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
        >
          {submitting === 'publish' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          すぐ公開
        </button>
      </div>
    </section>
  )
}
