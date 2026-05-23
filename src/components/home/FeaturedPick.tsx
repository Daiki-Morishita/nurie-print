'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'

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

export function FeaturedPick({ items, intervalMs = 5000 }: Props) {
  const [idx, setIdx] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    if (items.length <= 1) return
    const tick = setInterval(() => {
      setFade(false)
      const fadeOutDuration = 350
      setTimeout(() => {
        setIdx(prev => {
          let next = prev
          while (next === prev && items.length > 1) {
            next = Math.floor(Math.random() * items.length)
          }
          return next
        })
        setFade(true)
      }, fadeOutDuration)
    }, intervalMs)
    return () => clearInterval(tick)
  }, [items, intervalMs])

  const current = items[idx]
  if (!current) return null

  return (
    <section className="pb-12">
      <div className="max-w-[1080px] mx-auto px-6">
        <div className="bg-white border-2 border-[#E8B838]/40 rounded-2xl p-7 md:p-10 grid md:grid-cols-2 gap-8 md:gap-10 items-center shadow-sm relative">
          <div className="absolute -top-3 left-6 md:left-10 inline-flex items-center gap-1.5 bg-[#E66A2C] text-white px-4 py-1.5 rounded-full font-rounded font-black text-[12px] shadow-md border-2 border-white">
            <span>🌟</span>おすすめの１枚
          </div>
          <div
            className="transition-opacity duration-300 ease-out"
            style={{ opacity: fade ? 1 : 0 }}
          >
            <div className="font-rounded text-[11px] text-muted-foreground tracking-[0.2em] mb-3 mt-2">
              No. {String(current.index + 1).padStart(3, '0')}
            </div>
            <h2 className="font-rounded text-[26px] md:text-[34px] font-black leading-[1.3] mb-4">
              {current.title}
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
          <div className="aspect-[1.414/1] bg-background border border-border rounded-md overflow-hidden flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.imageUrl}
              alt={current.title}
              className="w-full h-full object-contain transition-opacity duration-300 ease-out"
              style={{ opacity: fade ? 1 : 0 }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
