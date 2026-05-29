'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { X, Plus, Pencil } from 'lucide-react'

export type StripItem = { key: string; src: string }

/**
 * 画像の横並びストリップ。
 * - ポインタ操作（マウス・タッチ両対応）でドラッグ並べ替え（割り込み挿入型・縦線インジケータ）
 * - タップ（ほぼ動かさず離す）でモーダル拡大
 * - × で削除、末尾に「写真追加」ラベル（任意）
 */
export function ImageReorderStrip({
  items,
  onReorder,
  onRemove,
  onEdit,
  addInputId,
  onAddFiles,
  addLabel,
}: {
  items: StripItem[]
  onReorder: (orderedKeys: string[]) => void
  onRemove: (key: string) => void
  /** 指定時、各カードに鉛筆ボタンを表示し編集を起動 */
  onEdit?: (key: string) => void
  /** 追加用 file input の id（指定時のみ「+」追加ボタンを表示） */
  addInputId?: string
  onAddFiles?: (e: React.ChangeEvent<HTMLInputElement>) => void
  addLabel?: string
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const downPos = useRef<{ x: number; y: number } | null>(null)
  const movedRef = useRef(false)

  function computeGapIndex(clientX: number): number {
    const sc = scrollerRef.current
    if (!sc) return 0
    const cards = Array.from(sc.querySelectorAll<HTMLElement>('[data-card]'))
    let gap = 0
    for (const c of cards) {
      const r = c.getBoundingClientRect()
      if (clientX > r.left + r.width / 2) gap++
      else break
    }
    return gap
  }

  function reorderToGap(fromKey: string, gapIndex: number) {
    const from = items.findIndex(i => i.key === fromKey)
    if (from === -1) return
    const order = items.map(i => i.key)
    const [moved] = order.splice(from, 1)
    const to = from < gapIndex ? gapIndex - 1 : gapIndex
    order.splice(to, 0, moved)
    onReorder(order)
  }

  function onPointerDown(key: string, e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest('button')) return
    downPos.current = { x: e.clientX, y: e.clientY }
    movedRef.current = false
    setDragKey(key)
    setDropIndex(items.findIndex(i => i.key === key))
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) } catch {}
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragKey || !downPos.current) return
    const dx = e.clientX - downPos.current.x
    const dy = e.clientY - downPos.current.y
    if (Math.hypot(dx, dy) > 6) movedRef.current = true
    e.preventDefault()
    setDropIndex(computeGapIndex(e.clientX))
  }
  function onPointerUp() {
    if (dragKey) {
      if (!movedRef.current) {
        const item = items.find(i => i.key === dragKey)
        if (item) setLightbox(item.src)
      } else if (dropIndex !== null) {
        reorderToGap(dragKey, dropIndex)
      }
    }
    setDragKey(null)
    setDropIndex(null)
    downPos.current = null
    movedRef.current = false
  }

  return (
    <>
      <div ref={scrollerRef} className="flex items-stretch overflow-x-auto pb-2 -mx-1 px-1">
        {items.map((item, idx) => (
          <div key={item.key} className="flex items-stretch">
            {/* 挿入インジケータ（左ギャップ = idx） */}
            <div className={`w-0.5 self-stretch my-0.5 rounded-full mx-1 transition-colors ${
              dragKey && dropIndex === idx ? 'bg-primary' : 'bg-transparent'
            }`} />
            <div
              data-card
              onPointerDown={e => onPointerDown(item.key, e)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{ touchAction: 'none' }}
              className={`relative shrink-0 w-24 h-24 rounded-lg overflow-hidden border bg-muted cursor-grab active:cursor-grabbing select-none transition-opacity ${
                dragKey === item.key ? 'opacity-30' : 'border-border'
              }`}
            >
              <Image src={item.src} alt="" fill className="object-cover pointer-events-none" sizes="96px" unoptimized />
              <button
                type="button"
                onClick={() => onRemove(item.key)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center"
                aria-label="削除"
              >
                <X className="w-3 h-3" />
              </button>
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(item.key)}
                  className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center"
                  aria-label="編集"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
              <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold rounded px-1.5 py-0.5">{idx + 1}</div>
            </div>
            {/* 末尾ギャップ（最後のカードの右 = length） */}
            {idx === items.length - 1 && (
              <div className={`w-0.5 self-stretch my-0.5 rounded-full mx-1 transition-colors ${
                dragKey && dropIndex === items.length ? 'bg-primary' : 'bg-transparent'
              }`} />
            )}
          </div>
        ))}
        {/* 追加ボタン */}
        {addInputId && onAddFiles && (
          <label
            htmlFor={addInputId}
            className="shrink-0 w-24 h-24 ml-1 rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center cursor-pointer hover:border-primary self-start"
            title={addLabel ?? '写真を追加'}
          >
            <Plus className="w-5 h-5 text-muted-foreground" />
            <input id={addInputId} type="file" multiple accept="image/*,.heic,.heif" onChange={onAddFiles} className="hidden" />
          </label>
        )}
      </div>

      {/* タップで拡大 */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[130] bg-black/70 flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white text-foreground border border-border shadow flex items-center justify-center z-10"
              aria-label="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative w-full aspect-[1.414/1] bg-white rounded-xl overflow-hidden">
              <Image src={lightbox} alt="" fill className="object-contain" sizes="768px" unoptimized />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
