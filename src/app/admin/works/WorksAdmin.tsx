'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Eye, EyeOff, Upload, AlertCircle } from 'lucide-react'

type Option = { id: string; title: string }
type Work = {
  id: string
  materialId: string
  photoUrl: string
  childAge: string
  comment: string
  duration: number | null
  tools: string | null
  videoUrl: string | null
  published: boolean
  createdAt: string | Date
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
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const form = e.currentTarget
    const fd = new FormData(form)

    startTransition(async () => {
      const res = await fetch('/api/admin/works', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '保存に失敗しました')
        return
      }
      setWorks(w => [{ ...data.work, createdAt: new Date(data.work.createdAt).toISOString() }, ...w])
      setSuccess(`保存しました: ${data.work.materialId}`)
      form.reset()
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('この作品を削除しますか？')) return
    const res = await fetch(`/api/admin/works/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? '削除に失敗しました')
      return
    }
    setWorks(w => w.filter(x => x.id !== id))
  }

  async function togglePublished(id: string, current: boolean) {
    const res = await fetch(`/api/admin/works/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !current }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? '更新に失敗しました')
      return
    }
    setWorks(w => w.map(x => (x.id === id ? { ...x, published: !current } : x)))
  }

  const filtered = filter
    ? works.filter(w => w.materialId.toLowerCase().includes(filter.toLowerCase()))
    : works

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-2xl font-black">作品ギャラリー管理</h1>
        <Link href="/admin" className="text-sm text-primary hover:underline">← 素材管理に戻る</Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-800 rounded text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-300 text-green-800 rounded text-sm">
          {success}
        </div>
      )}

      <section className="mb-10 bg-white border border-border rounded-lg p-5">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4" /> 新規アップロード
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-bold text-muted-foreground">素材ID（featured 295件から選択）<span className="text-red-500">*</span></span>
              <input
                name="materialId"
                list="featured-list"
                required
                placeholder="例: bear-simple-1"
                className="mt-1 w-full px-3 py-2 border border-border rounded text-sm"
              />
              <datalist id="featured-list">
                {featuredOptions.map(o => (
                  <option key={o.id} value={o.id}>{o.title}</option>
                ))}
              </datalist>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-muted-foreground">年齢ラベル<span className="text-red-500">*</span></span>
              <input
                name="childAge"
                required
                placeholder="例: 2歳10ヶ月 / 5歳 / 編集部試し塗り"
                className="mt-1 w-full px-3 py-2 border border-border rounded text-sm"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-bold text-muted-foreground">写真<span className="text-red-500">*</span>（1600pxにリサイズして保存）</span>
            <input
              type="file"
              name="photo"
              accept="image/*"
              required
              className="mt-1 w-full text-sm"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-muted-foreground">体験コメント<span className="text-red-500">*</span></span>
            <textarea
              name="comment"
              required
              rows={3}
              placeholder="例: 途中で「キリンさんの首長いね」と言いながら塗っていました。最後の方は集中力が切れて適当に。"
              className="mt-1 w-full px-3 py-2 border border-border rounded text-sm"
            />
          </label>

          <div className="grid sm:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-xs font-bold text-muted-foreground">時間（分・任意）</span>
              <input
                type="number"
                name="duration"
                min="0"
                placeholder="18"
                className="mt-1 w-full px-3 py-2 border border-border rounded text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-muted-foreground">画材（任意）</span>
              <input
                name="tools"
                placeholder="クレヨン12色"
                className="mt-1 w-full px-3 py-2 border border-border rounded text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-muted-foreground">動画URL（任意）</span>
              <input
                name="videoUrl"
                type="url"
                placeholder="https://..."
                className="mt-1 w-full px-3 py-2 border border-border rounded text-sm"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white rounded font-bold text-sm hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? '保存中…' : '作品を登録'}
          </button>
        </form>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-bold text-lg">登録済み作品（{works.length}件）</h2>
          <input
            type="search"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="素材IDで絞り込み"
            className="px-3 py-1.5 border border-border rounded text-sm w-56"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-muted p-6 rounded text-center">
            {works.length === 0 ? 'まだ作品がありません。上から登録してください。' : '該当する作品がありません。'}
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map(w => (
              <div key={w.id} className={`border border-border rounded-lg overflow-hidden bg-white ${!w.published && 'opacity-50'}`}>
                <div className="relative aspect-square bg-muted">
                  <Image src={w.photoUrl} alt={w.childAge} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" unoptimized />
                </div>
                <div className="p-3 space-y-1.5 text-xs">
                  <div className="font-mono text-[11px] text-muted-foreground truncate">{w.materialId}</div>
                  <div className="font-bold">{w.childAge}</div>
                  <p className="text-foreground/80 line-clamp-3">{w.comment}</p>
                  <div className="text-[10px] text-muted-foreground">
                    {w.duration && `${w.duration}分・`}
                    {w.tools && `${w.tools}・`}
                    {new Date(w.createdAt).toLocaleDateString('ja-JP')}
                  </div>
                  <div className="flex gap-1 pt-2">
                    <button
                      onClick={() => togglePublished(w.id, w.published)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 border border-border rounded text-[11px] hover:bg-muted"
                      title={w.published ? '非公開にする' : '公開する'}
                    >
                      {w.published ? <><Eye className="w-3 h-3" /> 公開中</> : <><EyeOff className="w-3 h-3" /> 非公開</>}
                    </button>
                    <button
                      onClick={() => handleDelete(w.id)}
                      className="px-2 py-1 border border-red-300 text-red-600 rounded text-[11px] hover:bg-red-50"
                      title="削除"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
