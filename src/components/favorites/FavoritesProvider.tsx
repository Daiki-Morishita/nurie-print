'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
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
  /** 匿名（localStorage）モードかどうか */
  isAnonymous: boolean
  isFavorite: (id: string) => boolean
  getGroup: (id: string) => string | null
  toggle: (id: string) => Promise<ToggleResult>
  move: (materialIds: string[], groupName: string | null) => Promise<boolean>
  bulkDelete: (materialIds: string[]) => Promise<boolean>
  refresh: () => Promise<void>
}

type ToggleResult =
  | { ok: true; added: boolean }
  | { ok: false; reason: 'limit_reached' | 'error' }

const FavoritesContext = createContext<FavoritesState | null>(null)
const FREE_LIMIT = 10
const ANON_LIMIT = 10
const LS_KEY = 'np_favorites_v1'

function loadLocal(): Map<string, FavoriteEntry> {
  if (typeof window === 'undefined') return new Map()
  try {
    const raw = window.localStorage.getItem(LS_KEY)
    if (!raw) return new Map()
    const arr = JSON.parse(raw) as FavoriteEntry[]
    const map = new Map<string, FavoriteEntry>()
    for (const e of arr) {
      if (e && typeof e.materialId === 'string') {
        map.set(e.materialId, { materialId: e.materialId, groupName: e.groupName ?? null, createdAt: e.createdAt ?? new Date().toISOString() })
      }
    }
    return map
  } catch {
    return new Map()
  }
}

function saveLocal(entries: Map<string, FavoriteEntry>) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(Array.from(entries.values())))
  } catch {}
}

function clearLocal() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(LS_KEY)
  } catch {}
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [entries, setEntries] = useState<Map<string, FavoriteEntry>>(new Map())
  const [loading, setLoading] = useState(false)
  const migrationRanRef = useRef(false)

  const isAnonymous = status !== 'authenticated'
  const limit = isAnonymous ? ANON_LIMIT : FREE_LIMIT

  const refresh = useCallback(async () => {
    if (status === 'authenticated') {
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
    } else if (status === 'unauthenticated') {
      setEntries(loadLocal())
    }
  }, [status])

  useEffect(() => {
    refresh()
  }, [refresh])

  // ログイン時：localStorage に残っているお気に入りをサーバーに移行（1度だけ）
  useEffect(() => {
    if (status !== 'authenticated' || migrationRanRef.current) return
    const local = loadLocal()
    if (local.size === 0) {
      migrationRanRef.current = true
      return
    }
    migrationRanRef.current = true
    ;(async () => {
      const ids = Array.from(local.keys())
      for (const id of ids) {
        try {
          await fetch(`/api/favorites/${id}`, { method: 'POST' })
        } catch {}
      }
      clearLocal()
      await refresh()
    })()
  }, [status, refresh])

  const isFavorite = useCallback((id: string) => entries.has(id), [entries])
  const getGroup = useCallback((id: string) => entries.get(id)?.groupName ?? null, [entries])

  const toggle = useCallback(async (id: string): Promise<ToggleResult> => {
    const wasFavorited = entries.has(id)

    // 上限チェック（追加時のみ）
    if (!wasFavorited && entries.size >= limit) {
      return { ok: false, reason: 'limit_reached' }
    }

    if (isAnonymous) {
      // localStorage モード
      const next = new Map(entries)
      if (wasFavorited) next.delete(id)
      else next.set(id, { materialId: id, groupName: null, createdAt: new Date().toISOString() })
      setEntries(next)
      saveLocal(next)
      trackEvent(wasFavorited ? 'favorite_remove' : 'favorite_add', { material_id: id, anon: true })
      return { ok: true, added: !wasFavorited }
    }

    // サーバーモード（楽観更新）
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
        return { ok: true, added: !wasFavorited }
      }
      // ロールバック
      setEntries(prev => {
        const next = new Map(prev)
        if (wasFavorited) next.set(id, { materialId: id, groupName: null, createdAt: new Date().toISOString() })
        else next.delete(id)
        return next
      })
      if (res.status === 402) return { ok: false, reason: 'limit_reached' }
      return { ok: false, reason: 'error' }
    } catch {
      return { ok: false, reason: 'error' }
    }
  }, [entries, status, isAnonymous, limit])

  const move = useCallback(async (materialIds: string[], groupName: string | null): Promise<boolean> => {
    if (materialIds.length === 0) return true
    if (isAnonymous) {
      // 匿名はグループ未対応
      const next = new Map(entries)
      for (const id of materialIds) {
        const cur = next.get(id)
        if (cur) next.set(id, { ...cur, groupName })
      }
      setEntries(next)
      saveLocal(next)
      return true
    }
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
  }, [entries, isAnonymous, refresh])

  const bulkDelete = useCallback(async (materialIds: string[]): Promise<boolean> => {
    if (materialIds.length === 0) return true
    if (isAnonymous) {
      const next = new Map(entries)
      for (const id of materialIds) next.delete(id)
      setEntries(next)
      saveLocal(next)
      return true
    }
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
  }, [entries, isAnonymous, refresh])

  return (
    <FavoritesContext.Provider value={{
      entries,
      count: entries.size,
      limit,
      loading,
      isAnonymous,
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
