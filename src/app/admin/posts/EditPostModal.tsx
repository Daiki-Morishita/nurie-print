'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Trash2, Save, Calendar, Send, FileText } from 'lucide-react'
import type { PostDTO } from './PostsAdmin'
import { MaterialSuggestInput } from './MaterialSuggestInput'
import { ImageReorderStrip } from './ImageReorderStrip'
import { compressToJpeg } from './image-compress'

type Option = { id: string; title: string }

function resolveMaterialIds(input: string, titleMap: Map<string, string>): { ids: string[]; invalid: string[] } {
  const tokens = input.split(/[\s,]+/).map(t => t.trim()).filter(Boolean)
  const ids: string[] = []
  const invalid: string[] = []
  for (const t of tokens) {
    const m = t.match(/\/materials\/([a-z0-9-]+)/i)
    const id = m ? m[1] : (/^[a-z0-9-]+$/i.test(t) ? t : null)
    if (id && titleMap.has(id)) {
      if (!ids.includes(id)) ids.push(id)
    } else {
      invalid.push(t)
    }
  }
  return { ids, invalid }
}

function isoToLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const tzOffset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16)
}

export function EditPostModal({
  post,
  featuredOptions: _featuredOptions,
  titleMap,
  imageMap,
  onClose,
  onUpdate,
  onDelete,
}: {
  post: PostDTO
  featuredOptions: Option[]
  titleMap: Map<string, string>
  imageMap?: Map<string, string>
  onClose: () => void
  onUpdate: (p: PostDTO) => void
  onDelete: (id: string) => void
}) {
  const [title, setTitle] = useState(post.title ?? '')
  const [body, setBody] = useState(post.body)
  const [materialUrls, setMaterialUrls] = useState(post.materialIds.join('\n'))
  const [publishedAt, setPublishedAt] = useState<string>(isoToLocalInput(post.publishedAt))
  const [images, setImages] = useState(post.images)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const addPhotoInputId = `add-photo-${post.id}`

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.style.height = 'auto'
      bodyRef.current.style.height = `${Math.min(bodyRef.current.scrollHeight, 400)}px`
    }
  }, [body])

  const resolved = resolveMaterialIds(materialUrls, titleMap)

  async function handleSave(kind: 'as-is' | 'publish-now' | 'unpublish') {
    setSaving(true)
    setError(null)
    const payload: Record<string, unknown> = {
      title: title.trim() || null,
      body,
      materialIds: resolved.ids,
    }
    if (kind === 'publish-now') {
      payload.publishedAt = new Date().toISOString()
    } else if (kind === 'unpublish') {
      payload.publishedAt = null
    } else if (publishedAt) {
      payload.publishedAt = new Date(publishedAt).toISOString()
    } else {
      payload.publishedAt = null
    }

    const res = await fetch(`/api/admin/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? '更新に失敗しました')
      return
    }
    const data = await res.json()
    onUpdate({ ...data.post, publishedAt: data.post.publishedAt, createdAt: data.post.createdAt, updatedAt: data.post.updatedAt })
    onClose()
  }

  async function handleDelete() {
    if (!confirm('この投稿を削除します。よろしいですか？（画像も全て削除されます）')) return
    setSaving(true)
    const res = await fetch(`/api/admin/posts/${post.id}`, { method: 'DELETE' })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? '削除に失敗しました')
      return
    }
    onDelete(post.id)
    onClose()
  }

  async function handleAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    e.target.value = ''
    setSaving(true)
    const fd = new FormData()
    // クライアント側で HEIC→JPEG + 圧縮（413・サムネ非表示対策）
    for (const f of files) {
      try {
        fd.append('photos', await compressToJpeg(f))
      } catch {
        fd.append('photos', f)
      }
    }
    const res = await fetch(`/api/admin/posts/${post.id}/images`, { method: 'POST', body: fd })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? '画像追加に失敗しました')
      return
    }
    const data = await res.json()
    setImages(imgs => [...imgs, ...data.images])
  }

  async function handleDeletePhoto(imageId: string) {
    if (!confirm('この画像を削除しますか？')) return
    const res = await fetch(`/api/admin/posts/${post.id}/images?imageId=${imageId}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? '画像削除に失敗しました')
      return
    }
    setImages(imgs => imgs.filter(i => i.id !== imageId))
  }

  /** ドラッグ並べ替え → 即座にUI反映 + order を API に保存 */
  async function handleReorder(orderedKeys: string[]) {
    const byId = new Map(images.map(i => [i.id, i]))
    const reordered = orderedKeys.map(k => byId.get(k)).filter((x): x is typeof images[number] => !!x)
    setImages(reordered)
    const orderMap: Record<string, number> = {}
    reordered.forEach((img, i) => { orderMap[img.id] = i })
    const res = await fetch(`/api/admin/posts/${post.id}/images`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: orderMap }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? '並べ替えの保存に失敗しました')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-xl max-h-[95vh] flex flex-col rounded-t-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="font-bold text-sm">投稿を編集</div>
          <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted" aria-label="閉じる">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-300 text-red-800 rounded text-xs">{error}</div>
          )}

          {/* 画像管理 — ドラッグ並べ替え + タップ拡大 */}
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">画像（{images.length}枚）</label>
            {images.length > 0 && (
              <p className="text-[11px] text-muted-foreground mb-1.5">
                ドラッグで並べ替え（落ちる位置に縦線）・タップで拡大
              </p>
            )}
            <ImageReorderStrip
              items={images.map(i => ({ key: i.id, src: i.url }))}
              onReorder={handleReorder}
              onRemove={handleDeletePhoto}
              addInputId={addPhotoInputId}
              onAddFiles={handleAddPhotos}
            />
          </div>

          {/* タイトル */}
          <label className="block">
            <span className="text-xs font-bold text-muted-foreground">タイトル（任意）</span>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="無題の投稿"
              className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg text-base"
            />
          </label>

          {/* 本文 */}
          <label className="block">
            <span className="text-xs font-bold text-muted-foreground">本文</span>
            <textarea
              ref={bodyRef}
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={5}
              className="mt-1 w-full px-3 py-3 border border-border rounded-lg text-base resize-none"
            />
          </label>

          {/* 関連塗り絵 — タイトル検索サジェスト */}
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">
              関連する塗り絵（タイトルで検索して追加）
            </label>
            <MaterialSuggestInput titleMap={titleMap} imageMap={imageMap} value={materialUrls} onChange={setMaterialUrls} />
          </div>

          {/* 公開日時 */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <label className="text-xs font-bold text-blue-900 block mb-1">
              <Calendar className="w-3 h-3 inline mr-1" />公開日時
            </label>
            <input
              type="datetime-local"
              value={publishedAt}
              onChange={e => setPublishedAt(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded text-sm"
            />
            <p className="text-[11px] text-blue-800/70 mt-1">
              {!publishedAt ? '空欄=下書き' : new Date(publishedAt).getTime() > Date.now() ? '未来=予約' : '過去/現在=公開中'}
            </p>
          </div>
        </div>

        <div className="border-t border-border p-3 flex gap-2 bg-white flex-wrap">
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="px-3 py-2.5 border border-red-300 text-red-600 rounded-lg text-sm font-bold flex items-center gap-1.5 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> 削除
          </button>
          {post.publishedAt ? (
            <button
              type="button"
              onClick={() => handleSave('unpublish')}
              disabled={saving}
              className="px-3 py-2.5 border border-border rounded-lg text-sm font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" /> 下書きへ戻す
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSave('publish-now')}
              disabled={saving}
              className="px-3 py-2.5 border border-primary text-primary rounded-lg text-sm font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> すぐ公開
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSave('as-is')}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
