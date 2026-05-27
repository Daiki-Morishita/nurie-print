'use client'

import { useState, useTransition, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Upload, AlertCircle, Camera, X, EyeOff } from 'lucide-react'
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
  const photoInputId = 'photo-input'

  function resetForm() {
    setMaterialId('')
    setChildAge('')
    setComment('')
    setDuration('')
    setTools('')
    setPhotoPreview(null)
    const el = document.getElementById(photoInputId) as HTMLInputElement | null
    if (el) el.value = ''
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) {
      setPhotoPreview(null)
      return
    }
    setPhotoPreview(URL.createObjectURL(f))
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
      // 5秒で成功表示を消す
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

      <section className="mb-8 bg-white border border-border rounded-xl p-4 sm:p-5">
        <h2 className="font-bold text-base sm:text-lg mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4" /> 新規アップロード
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 写真 */}
          <div>
            <label className="block">
              <span className="text-xs font-bold text-muted-foreground">写真 <span className="text-red-500">*</span></span>
            </label>
            {photoPreview ? (
              <div className="mt-1 relative aspect-[4/3] max-h-72 rounded-lg overflow-hidden border border-border bg-muted">
                <Image src={photoPreview} alt="プレビュー" fill className="object-contain" unoptimized />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoPreview(null)
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

          {/* 素材ID */}
          <div>
            <label className="block">
              <span className="text-xs font-bold text-muted-foreground">どの素材を塗ったか <span className="text-red-500">*</span></span>
            </label>
            <div className="mt-1">
              <MaterialPicker options={featuredOptions} value={materialId} onChange={setMaterialId} />
            </div>
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

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full px-6 py-3.5 bg-primary text-white rounded-lg font-bold text-sm disabled:opacity-40 active:opacity-80 transition-opacity"
          >
            {isPending ? '保存中…' : '作品を登録'}
          </button>
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
