'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

export interface FeaturedItem {
  id: string
  index: number
  title: string
  description: string
  imageUrl: string
  ageMin?: number
  ageMax?: number
  difficulty?: number
  duration?: number
}

interface Props {
  items: FeaturedItem[]
  intervalMs?: number
}

export function FeaturedPick({ items, intervalMs = 7000 }: Props) {
  const [idx, setIdx] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [paused, setPaused] = useState(false)
  const touchStart = useRef<number | null>(null)

  const goTo = useCallback((nextIdx: number, dir: 'next' | 'prev') => {
    if (items.length === 0) return
    setDirection(dir)
    setIdx(((nextIdx % items.length) + items.length) % items.length)
  }, [items.length])

  const next = useCallback(() => {
    goTo(idx + 1, 'next')
  }, [idx, goTo])

  const prev = useCallback(() => {
    goTo(idx - 1, 'prev')
  }, [idx, goTo])

  // Auto rotate
  useEffect(() => {
    if (items.length <= 1 || paused) return
    const tick = setInterval(() => {
      setDirection('next')
      setIdx(prev => (prev + 1) % items.length)
    }, intervalMs)
    return () => clearInterval(tick)
  }, [items.length, intervalMs, paused])

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next])

  if (items.length === 0) return null
  const current = items[idx]

  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX
    setPaused(true)
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStart.current === null) return
    const dx = e.changedTouches[0].clientX - touchStart.current
    if (Math.abs(dx) > 50) {
      if (dx < 0) next()
      else prev()
    }
    touchStart.current = null
    setPaused(false)
  }

  return (
    <section
      className="relative pb-12 pt-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Ribbon — 横幅枠の中、スライド枠の上に重ねる */}
      <div className="relative max-w-[1280px] mx-auto px-6 z-20 pointer-events-none">
        <div className="inline-flex items-center gap-1.5 bg-[#E66A2C] text-white px-4 py-1.5 rounded-full font-rounded font-black text-[12px] shadow-md border-2 border-white pointer-events-auto">
          <span>🌟</span>おすすめの１枚
        </div>
      </div>

      {/* Full-width slide — ribbon に半分かぶる位置 */}
      <div
        key={current.id}
        className={`-mt-4 relative w-full bg-gradient-to-br from-[#FFF3E0] via-white to-[#FFF8EC] border-y-2 border-[#E8B838]/40 overflow-hidden ${
          direction === 'next' ? 'animate-slide-in-right' : 'animate-slide-in-left'
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-6 py-8 md:py-12 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="order-2 md:order-1">
            <div className="font-rounded text-[11px] text-muted-foreground tracking-[0.2em] mb-3">
              No. {String(current.index + 1).padStart(3, '0')} / {idx + 1} of {items.length}
            </div>
            <h2 className="font-rounded text-[26px] md:text-[36px] font-black leading-[1.25] mb-4">
              <Link href={`/materials/${current.id}`} className="hover:text-primary transition-colors">
                {current.title}
              </Link>
            </h2>
            <p className="text-[14px] text-foreground/80 leading-relaxed mb-5 pl-4 border-l-[3px] border-primary">
              {current.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 mb-6 text-[11px] text-muted-foreground">
              {current.ageMin && current.ageMax && (
                <span className="bg-background px-2.5 py-1 rounded border border-border">
                  {current.ageMin}〜{current.ageMax}歳
                </span>
              )}
              {current.difficulty && (
                <span className="bg-background px-2.5 py-1 rounded border border-border">
                  難易度 {current.difficulty}
                </span>
              )}
              {current.duration && (
                <span className="bg-background px-2.5 py-1 rounded border border-border flex items-center gap-1">
                  <Clock className="w-3 h-3" />約{current.duration}分
                </span>
              )}
            </div>
            <Link
              href={`/materials/${current.id}`}
              className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3 rounded-full text-[14px] font-rounded font-black hover:-translate-y-0.5 transition-all shadow-md"
            >
              <span>🖍️</span>つかってみる
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <Link
            href={`/materials/${current.id}`}
            className="order-1 md:order-2 aspect-[1.414/1] bg-white border border-border rounded-md overflow-hidden flex items-center justify-center shadow-sm hover:border-primary transition-colors"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.imageUrl} alt={current.title} className="w-full h-full object-contain" />
          </Link>
        </div>

        {/* Arrows */}
        <button
          aria-label="前へ"
          onClick={prev}
          className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 hover:bg-white border border-border shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <button
          aria-label="次へ"
          onClick={next}
          className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 hover:bg-white border border-border shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        :global(.animate-slide-in-right) { animation: slide-in-right 0.45s ease-out; }
        :global(.animate-slide-in-left)  { animation: slide-in-left  0.45s ease-out; }
      `}</style>
    </section>
  )
}
