'use client'

import { useState } from 'react'
import type { Material, ImageStatus, Category, Theme } from '@/lib/types'
import { IMAGE_STATUS_LABELS, CATEGORY_LABELS, THEME_LABELS } from '@/lib/types'

type Props = {
  material: Material
  onClose: () => void
  onSaved: () => void
}

export function EditMaterialModal({ material, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(material.title)
  const [description, setDescription] = useState(material.description)
  const [ideas, setIdeas] = useState<string[]>(
    material.activityIdeas.length >= 2
      ? material.activityIdeas
      : [...material.activityIdeas, '', '']
  )
  const [tags, setTags] = useState(material.tags.join(', '))
  const [imageStatus, setImageStatus] = useState<ImageStatus>(material.imageStatus ?? 'pending_review')
  const [illustNotes, setIllustNotes] = useState(material.illustNotes ?? '')
  const [category, setCategory] = useState<Category>(material.category)
  const [theme, setTheme] = useState<Theme | ''>(material.theme ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function handleSave() {
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const res = await fetch('/api/admin/update-material', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: material.id,
          title,
          description,
          activityIdeas: ideas.filter(s => s.trim()),
          tags: tags.split(',').map(s => s.trim()).filter(Boolean),
          imageStatus,
          illustNotes: illustNotes || undefined,
          category,
          theme: theme || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'エラーが発生しました')
      // 本番で一部フィールドがスキップされた場合は通知して閉じる
      if (data.notice) {
        setNotice(data.notice)
        setSaving(false)
        setTimeout(() => { onSaved(); onClose() }, 1800)
        return
      }
      onSaved()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  const statuses: ImageStatus[] = ['pending_review', 'approved', 'needs_revision', 'placeholder']
  const categories = Object.keys(CATEGORY_LABELS) as Category[]
  const themes = Object.keys(THEME_LABELS) as Theme[]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <p className="text-xs text-gray-400 font-mono">{material.id}</p>
            <h2 className="text-sm font-semibold text-gray-800">エントリを編集</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* タイトル */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* 説明文 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">説明文</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>

          {/* 活動アイデア */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">活動のアイデア</label>
            {ideas.map((idea, i) => (
              <input
                key={i}
                type="text"
                value={idea}
                onChange={e => {
                  const next = [...ideas]
                  next[i] = e.target.value
                  setIdeas(next)
                }}
                placeholder={`アイデア ${i + 1}`}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mb-1.5"
              />
            ))}
          </div>

          {/* カテゴリ & テーマ */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">カテゴリ</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as Category)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">テーマ</label>
              <select
                value={theme}
                onChange={e => setTheme(e.target.value as Theme | '')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">（未設定）</option>
                {themes.map(t => (
                  <option key={t} value={t}>{THEME_LABELS[t]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* タグ */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">タグ（カンマ区切り）</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* ステータス */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">ステータス</label>
            <select
              value={imageStatus}
              onChange={e => setImageStatus(e.target.value as ImageStatus)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {statuses.map(s => (
                <option key={s} value={s}>{IMAGE_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          {/* メモ */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">メモ（修正指示など）</label>
            <textarea
              value={illustNotes}
              onChange={e => setIllustNotes(e.target.value)}
              rows={2}
              placeholder="修正指示・承認コメントなど"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          {notice && <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{notice}</p>}
        </div>

        <div className="px-5 py-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  )
}
