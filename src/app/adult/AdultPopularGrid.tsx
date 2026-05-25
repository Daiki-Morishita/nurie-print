'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Material } from '@/lib/types'

interface Props {
  items: Material[]
  take?: number
}

function shuffle<T>(input: T[]): T[] {
  const arr = [...input]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * 大人ホームの人気カードグリッド
 * - 同じタイトル（≒同じアイテムの難易度違い）は1つだけ採用
 * - クライアントマウント時にシャッフル → 表示の偏りを解消
 */
export function AdultPopularGrid({ items, take = 8 }: Props) {
  const [picked, setPicked] = useState<Material[]>(() => items.slice(0, take))

  useEffect(() => {
    const shuffled = shuffle(items)
    // タイトル重複を排除
    const seen = new Set<string>()
    const uniq: Material[] = []
    for (const m of shuffled) {
      if (seen.has(m.title)) continue
      seen.add(m.title)
      uniq.push(m)
      if (uniq.length >= take) break
    }
    // 重複排除しても足りない場合は元プールから補完
    if (uniq.length < take) {
      for (const m of shuffled) {
        if (uniq.includes(m)) continue
        uniq.push(m)
        if (uniq.length >= take) break
      }
    }
    setPicked(uniq)
  }, [items, take])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
      {picked.map(m => (
        <Link
          key={m.id}
          href={`/adult/materials/${m.id}`}
          className="group bg-white border border-border rounded-sm overflow-hidden hover:border-primary transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="aspect-[1.414/1] bg-background overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.imageUrl} alt={m.title} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="px-3 py-2.5 border-t border-border/60">
            <h3 className="font-mincho text-[13px] font-bold leading-snug line-clamp-1 group-hover:text-primary transition-colors">
              {m.title}
            </h3>
          </div>
        </Link>
      ))}
    </div>
  )
}
