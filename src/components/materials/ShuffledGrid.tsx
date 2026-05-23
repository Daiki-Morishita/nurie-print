'use client'

import { useMemo } from 'react'
import { MaterialCard } from './MaterialCard'
import type { Material } from '@/lib/types'

interface Props {
  items: Material[]
  className?: string
}

/**
 * sort=random 用のクライアントサイドシャッフル。
 * サーバー側 ISR キャッシュに左右されず、マウント毎に新しい順序になる。
 */
export function ShuffledGrid({ items, className }: Props) {
  const shuffled = useMemo(() => {
    const arr = [...items]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }, [items])

  return (
    <div className={className ?? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4'}>
      {shuffled.map(material => (
        <MaterialCard key={material.id} material={material} />
      ))}
    </div>
  )
}
