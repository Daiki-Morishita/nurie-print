'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { trackEvent } from '@/lib/analytics'

export interface FavoriteEntry {
  materialId: string
  groupName: string | null
  createdAt: string
}

interface FavoritesState {
  entries: Map<string, FavoriteEntry>
  count: number
  limit: number
  loading: boolean
  isFavorite: (id: string) => boolean
  getGroup: (id: string) => string | null
  toggle: (id: string) => Promise<ToggleResult>
  move: (materialIds: string[], groupName: string | null) => Promise<boolean>
  bulkDelete: (materialIds: string[]) => Promise<boolean>
  refresh: () => Promise<void>
}

type ToggleResult =
  | { ok: true; added: boolean }
  | { ok: false; reason: 'unauthorized' | 'limit_reached' | 'error' }

const FavoritesContext = createContext<FavoritesState | null>(null)
const FREE_LIMIT = 10

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [entries, setEntries] = useState<Map<string, FavoriteEntry>>(new Map())
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (status !== 'authenticated') {
      setEntries(new Map())
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/favorites')
      if (res.ok) {
        const data = await res.json()
        const next = new Map<string, FavoriteEntry>()
        for (const f of data.favorites ?? []) {
          next.set(f.materialId, f)
        }
        setEntries(next)
      }
    } catch {}
    setLoading(false)
  }, [status])

  useEffect(() => {
    refresh()
  }, [refresh])

  const isFavorite = useCallback((id: string) => entries.has(id), [entries])
  const getGroup = useCallback((id: string) => entries.get(id)?.groupName ?? null, [entries])

  const toggle = useCallback(async (id: string): Promise<ToggleResult> => {
    if (status !== 'authenticated') return { ok: false, reason: 'unauthorized' }
    const wasFavorited = entries.has(id)

    setEntries(prev => {
      const next = new Map(prev)
      if (wasFavorited) next.delete(id)
      else next.set(id, { materialId: id, groupName: null, createdAt: new Date().toISOString() })
      return next
    })

    try {
      const res = await fetch(`/api/favorites/${id}`, { method: wasFavorited ? 'DELETE' : 'POST' })
      if (res.ok) {
        trackEvent(wasFavorited ? 'favorite_remove' : 'favorite_add', { material_id: id })
      }
      if (!res.ok) {
        setEntries(prev => {
          const next = new Map(prev)
          if (wasFavorited) next.set(id, { materialId: id, groupName: null, createdAt: new Date().toISOString() })
          else next.delete(id)
          return next
        })
        if (res.status === 402) return { ok: false, reason: 'limit_reached' }
        if (res.status === 401) return { ok: false, reason: 'unauthorized' }
        return { ok: false, reason: 'error' }
      }
      return { ok: true, added: !wasFavorited }
    } catch {
      return { ok: false, reason: 'error' }
    }
  }, [entries, status])

  const move = useCallback(async (materialIds: string[], groupName: string | null): Promise<boolean> => {
    if (materialIds.length === 0) return true
    // Optimistic
    setEntries(prev => {
      const next = new Map(prev)
      for (const id of materialIds) {
        const cur = next.get(id)
        if (cur) next.set(id, { ...cur, groupName })
      }
      return next
    })
    try {
      const res = await fetch('/api/favorites/bulk', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'move', materialIds, groupName }),
      })
      if (!res.ok) await refresh()
      return res.ok
    } catch {
      await refresh()
      return false
    }
  }, [refresh])

  const bulkDelete = useCallback(async (materialIds: string[]): Promise<boolean> => {
    if (materialIds.length === 0) return true
    setEntries(prev => {
      const next = new Map(prev)
      for (const id of materialIds) next.delete(id)
      return next
    })
    try {
      const res = await fetch('/api/favorites/bulk', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'delete', materialIds }),
      })
      if (!res.ok) await refresh()
      return res.ok
    } catch {
      await refresh()
      return false
    }
  }, [refresh])

  return (
    <FavoritesContext.Provider value={{
      entries,
      count: entries.size,
      limit: FREE_LIMIT,
      loading,
      isFavorite,
      getGroup,
      toggle,
      move,
      bulkDelete,
      refresh,
    }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used inside FavoritesProvider')
  return ctx
}
