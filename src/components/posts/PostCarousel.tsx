'use client'

import Image from 'next/image'
import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function PostCarousel({
  images,
  alt = '',
  aspectClass = 'aspect-[4/3]',
}: {
  images: { id: string; url: string }[]
  alt?: string
  aspectClass?: string
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    function onScroll() {
      if (!el) return
      const idx = Math.round(el.scrollLeft / el.clientWidth)
      setActiveIndex(idx)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  function scrollTo(idx: number) {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' })
  }

  if (images.length === 0) return null

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none rounded-xl"
        style={{ scrollbarWidth: 'none' }}
      >
        {images.map((img, i) => (
          <div key={img.id} className={`relative shrink-0 w-full ${aspectClass} snap-center bg-muted`}>
            <Image
              src={img.url}
              alt={images.length > 1 && alt ? `${alt}（${i + 1}枚目）` : alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
              unoptimized
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          {/* 前へ */}
          {activeIndex > 0 && (
            <button
              type="button"
              onClick={() => scrollTo(activeIndex - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 text-foreground shadow flex items-center justify-center hover:bg-white z-10"
              aria-label="前の画像"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {/* 次へ */}
          {activeIndex < images.length - 1 && (
            <button
              type="button"
              onClick={() => scrollTo(activeIndex + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 text-foreground shadow flex items-center justify-center hover:bg-white z-10"
              aria-label="次の画像"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
          {/* ドット */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === activeIndex ? 'bg-white w-4' : 'bg-white/60'
                }`}
                aria-label={`${i + 1}枚目を表示`}
              />
            ))}
          </div>
          {/* 枚数バッジ */}
          <div className="absolute top-3 right-3 bg-black/60 text-white text-[11px] font-bold px-2 py-0.5 rounded-full z-10">
            {activeIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  )
}
