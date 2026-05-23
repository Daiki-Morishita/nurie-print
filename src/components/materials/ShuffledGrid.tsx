'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { MaterialCard } from './MaterialCard'
import type { Material } from '@/lib/types'

interface Props {
  items: Material[]
  className?: string
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
 * sort=random 用のクライアントサイドシャッフル。
 * - 初回マウント時にシャッフル
 * - URL の `_r` nonce が変わるたびに再シャッフル（同じ URL を再クリックしても効く）
 */
export function ShuffledGrid({ items, className }: Props) {
  const searchParams = useSearchParams()
  const seed = searchParams.get('_r') ?? ''
  const [shuffled, setShuffled] = useState<Material[]>(items)

  useEffect(() => {
    setShuffled(shuffle(items))
  }, [items, seed])

  return (
    <div className={className ?? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4'}>
      {shuffled.map(material => (
        <MaterialCard key={material.id} material={material} />
      ))}
    </div>
  )
}
