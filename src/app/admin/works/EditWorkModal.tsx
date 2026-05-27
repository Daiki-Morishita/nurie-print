'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Trash2, Eye, EyeOff, Save } from 'lucide-react'

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

export function EditWorkModal({
  work,
  onClose,
  onUpdate,
  onDelete,
}: {
  work: Work
  onClose: () => void
  onUpdate: (updated: Work) => void
  onDelete: (id: string) => void
}) {
  const [childAge, setChildAge] = useState(work.childAge)
  const [comment, setComment] = useState(work.comment)
  const [duration, setDuration] = useState<string>(work.duration?.toString() ?? '')
  const [tools, setTools] = useState(work.tools ?? '')
  const [published, setPublished] = useState(work.published)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    const payload: Record<string, unknown> = {
      childAge,
      comment,
      tools: tools || null,
      published,
    }
    if (duration) payload.duration = Number(duration)

    const res = await fetch(`/api/admin/works/${work.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? '保存に失敗しました')
      return
    }
    const { work: updated } = await res.json()
    onUpdate({ ...updated, createdAt: new Date(updated.createdAt).toISOString() })
    onClose()
  }

  async function handleDelete() {
    if (!confirm('この作品を削除します。よろしいですか？')) return
    setSaving(true)
    const res = await fetch(`/api/admin/works/${work.id}`, { method: 'DELETE' })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? '削除に失敗しました')
      return
    }
    onDelete(work.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-xl sm:rounded-xl max-h-[95vh] flex flex-col rounded-t-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="font-bold text-sm">作品を編集</div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 overscroll-contain">
          <div className="relative aspect-[4/3] bg-muted">
            <Image src={work.photoUrl} alt={work.childAge} fill className="object-contain" unoptimized />
          </div>

          <div className="p-4 space-y-3">
            <div className="text-[11px] text-muted-foreground font-mono">{work.materialId}</div>

            {error && (
              <div className="p-2.5 bg-red-50 border border-red-300 text-red-800 rounded text-xs">{error}</div>
            )}

            <label className="block">
              <span className="text-xs font-bold text-muted-foreground">年齢ラベル</span>
              <input
                value={childAge}
                onChange={e => setChildAge(e.target.value)}
                className="mt-1 w-full px-3 py-3 border border-border rounded-lg text-base"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold text-muted-foreground">体験コメント</span>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={4}
                className="mt-1 w-full px-3 py-3 border border-border rounded-lg text-base"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-bold text-muted-foreground">時間（分）</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  className="mt-1 w-full px-3 py-3 border border-border rounded-lg text-base"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-muted-foreground">画材</span>
                <input
                  value={tools}
                  onChange={e => setTools(e.target.value)}
                  className="mt-1 w-full px-3 py-3 border border-border rounded-lg text-base"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => setPublished(p => !p)}
              className={`w-full px-4 py-3 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 ${published ? 'border-border bg-white' : 'border-amber-300 bg-amber-50 text-amber-800'}`}
            >
              {published ? <><Eye className="w-4 h-4" /> 公開中</> : <><EyeOff className="w-4 h-4" /> 非公開</>}
            </button>
          </div>
        </div>

        <div className="border-t border-border p-3 flex gap-2 bg-white">
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="px-4 py-3 border border-red-300 text-red-600 rounded-lg text-sm font-bold flex items-center gap-1.5 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> 削除
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-3 bg-primary text-white rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
