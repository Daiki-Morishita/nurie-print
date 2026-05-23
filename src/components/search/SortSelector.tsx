'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import type { SortKey } from '@/lib/data'

interface Props {
  /** Override target path. Defaults to current pathname. */
  basePath?: string
  /** Whether to show favorites option (only if logged in). Default true. */
  showFavorites?: boolean
}

export function SortSelector({ basePath, showFavorites = true }: Props = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const current = (searchParams.get('sort') as SortKey) ?? 'newest'

  const options: { key: SortKey; label: string }[] = [
    { key: 'newest',  label: '新着順' },
    { key: 'popular', label: '人気順' },
    { key: 'random',  label: 'ランダム' },
    ...(showFavorites && session ? [{ key: 'favorites' as SortKey, label: 'お気に入り順' }] : []),
  ]

  function select(key: SortKey) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', key)
    const target = basePath ?? pathname
    router.push(`${target}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
      {options.map(({ key, label }) => {
        const active = current === key
        return (
          <button
            key={key}
            onClick={() => select(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap
              ${active ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
