'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { Material, ImageStatus, Category, Theme } from '@/lib/types'
import { IMAGE_STATUS_LABELS, IMAGE_STATUS_COLOR, CATEGORY_LABELS, THEME_LABELS } from '@/lib/types'
import { normalizeQuery, normalizeText } from '@/lib/utils'
import { DeleteButton } from './DeleteButton'
import { EditMaterialModal } from './EditMaterialModal'

type SortKey = 'id' | 'status' | 'version' | 'created' | 'title'
type SortDir = 'asc' | 'desc'

// ソートプルダウンの選択肢（key + dir をまとめて1値で扱う）
const SORT_OPTIONS: { value: string; label: string; key: SortKey; dir: SortDir }[] = [
  { value: 'created-desc', label: '登録日が新しい順', key: 'created', dir: 'desc' },
  { value: 'created-asc',  label: '登録日が古い順',   key: 'created', dir: 'asc' },
  { value: 'id-asc',       label: 'ID（テーマ）順',   key: 'id',      dir: 'asc' },
  { value: 'title-asc',    label: 'タイトル順（あ→ん）', key: 'title', dir: 'asc' },
  { value: 'title-desc',   label: 'タイトル順（ん→あ）', key: 'title', dir: 'desc' },
  { value: 'status-asc',   label: 'ステータス順（要修正→承認済）', key: 'status', dir: 'asc' },
  { value: 'status-desc',  label: 'ステータス順（承認済→要修正）', key: 'status', dir: 'desc' },
  { value: 'version-desc', label: 'バージョンが新しい順', key: 'version', dir: 'desc' },
  { value: 'version-asc',  label: 'バージョンが古い順',   key: 'version', dir: 'asc' },
]
type ViewMode = 'list' | 'tile'
type TileSize = 'sm' | 'md' | 'lg' | 'xl'

const STATUS_ORDER: Record<ImageStatus | 'placeholder', number> = {
  needs_revision: 0,
  pending_review: 1,
  approved: 2,
  placeholder: 3,
}

const DIFFICULTY_RANK: Record<string, number> = {
  simple: 0,
  easy: 1,
  normal: 2,
  rich: 3,
}

/** Finder風の日付表記（今日HH:MM / 昨日HH:MM / 一昨日 / 日付） */
function formatDate(dateStr: string): string {
  // 時刻情報を含むISO形式 or 日付のみ
  const hasTime = /T\d{2}:\d{2}/.test(dateStr)
  const d = hasTime ? new Date(dateStr) : new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return dateStr
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dDay = new Date(d)
  dDay.setHours(0, 0, 0, 0)
  const diffDays = Math.round((today.getTime() - dDay.getTime()) / (1000 * 60 * 60 * 24))
  const timeStr = hasTime
    ? ` ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    : ''
  if (diffDays === 0) return `今日${timeStr}`
  if (diffDays === 1) return `昨日${timeStr}`
  if (diffDays === 2) return `一昨日${timeStr}`
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}/${mm}/${dd}${timeStr}`
}

/** id を {theme, difficulty順, variant} に分解してソート用キーを返す */
function parseId(id: string): { theme: string; diff: number; variant: number } {
  // パターン: {theme}-{simple|easy|normal|rich}-{N}
  const m = id.match(/^(.+)-(simple|easy|normal|rich)(?:-(\d+))?$/)
  if (m) {
    return {
      theme: m[1],
      diff: DIFFICULTY_RANK[m[2]] ?? 99,
      variant: m[3] ? parseInt(m[3], 10) : 1,
    }
  }
  return { theme: id, diff: 99, variant: 0 }
}

const STATUS_OPTIONS: ImageStatus[] = ['placeholder', 'pending_review', 'approved', 'needs_revision']

const TILE_SIZES: Record<TileSize, { cols: string; w: number; h: number }> = {
  sm: { cols: 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8', w: 120, h: 90 },
  md: { cols: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6', w: 180, h: 135 },
  lg: { cols: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4', w: 280, h: 210 },
  xl: { cols: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3', w: 400, h: 300 },
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="ml-0.5 text-gray-300 text-[10px]">↕</span>
  return <span className="ml-0.5 text-[10px]">{dir === 'asc' ? '↑' : '↓'}</span>
}

async function updateStatus(id: string, status: ImageStatus) {
  const res = await fetch('/api/admin/update-material', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, imageStatus: status }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'ステータス更新失敗')
  }
}

const LS_KEY = 'admin-materials-prefs'

type StoredPrefs = {
  viewMode?: ViewMode
  tileSize?: TileSize
  sortKey?: SortKey
  sortDir?: SortDir
  filterCategory?: Category | 'all'
  filterTheme?: Theme | 'all'
  filterStatus?: ImageStatus | 'all'
}

export function AdminMaterialsTable({ materials: initialMaterials }: { materials: Material[] }) {
  // Mirror server-passed materials so we can update status in-place without page reload
  const [materials, setMaterials] = useState<Material[]>(initialMaterials)
  // If server data changes (re-fetch), sync — preserves user filter/view in the meantime
  useEffect(() => { setMaterials(initialMaterials) }, [initialMaterials])

  const [sortKey, setSortKey] = useState<SortKey>('created')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [editTarget, setEditTarget] = useState<Material | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [tileSize, setTileSize] = useState<TileSize>('md')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<ImageStatus>('approved')
  const [busy, setBusy] = useState(false)
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all')
  const [filterTheme, setFilterTheme] = useState<Theme | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<ImageStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [prefsLoaded, setPrefsLoaded] = useState(false)

  // Sticky toolbar via sentinel + IntersectionObserver (more robust than CSS position:sticky
  // which can be defeated by flex containing blocks)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)
  const [toolbarHeight, setToolbarHeight] = useState(0)

  useEffect(() => {
    if (!sentinelRef.current) return
    const obs = new IntersectionObserver(
      entries => setStuck(!entries[0].isIntersecting),
      { rootMargin: '-176px 0px 0px 0px', threshold: 0 }
    )
    obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    function updateHeight() {
      if (toolbarRef.current) setToolbarHeight(toolbarRef.current.offsetHeight)
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [viewMode, selectedIds.size])

  // Restore prefs on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) {
        const p: StoredPrefs = JSON.parse(raw)
        if (p.viewMode) setViewMode(p.viewMode)
        if (p.tileSize) setTileSize(p.tileSize)
        if (p.sortKey) setSortKey(p.sortKey)
        if (p.sortDir) setSortDir(p.sortDir)
        if (p.filterCategory) setFilterCategory(p.filterCategory)
        if (p.filterTheme) setFilterTheme(p.filterTheme)
        if (p.filterStatus) setFilterStatus(p.filterStatus)
      }
    } catch {}
    setPrefsLoaded(true)
  }, [])

  // Persist prefs whenever any changes
  useEffect(() => {
    if (!prefsLoaded) return
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        viewMode, tileSize, sortKey, sortDir,
        filterCategory, filterTheme, filterStatus,
      }))
    } catch {}
  }, [prefsLoaded, viewMode, tileSize, sortKey, sortDir, filterCategory, filterTheme, filterStatus])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll(ids: string[]) {
    setSelectedIds(prev => {
      const allSelected = ids.every(i => prev.has(i))
      if (allSelected) return new Set()
      return new Set(ids)
    })
  }

  async function handleRowStatusChange(id: string, status: ImageStatus) {
    // Optimistic update — keeps view/sort/scroll/selection intact
    const prev = materials
    setMaterials(ms => ms.map(m => m.id === id ? { ...m, imageStatus: status } : m))
    setBusy(true)
    try {
      await updateStatus(id, status)
    } catch (e) {
      // Rollback on failure
      setMaterials(prev)
      alert(e instanceof Error ? e.message : 'エラー')
    } finally {
      setBusy(false)
    }
  }

  async function handleBulkDownload() {
    if (selectedIds.size === 0) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })
      if (!res.ok) throw new Error('ZIP生成失敗')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nurie-print-materials-${new Date().toISOString().slice(0,10)}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'エラー')
    } finally {
      setBusy(false)
    }
  }

  function downloadSingle(url: string, id: string) {
    const a = document.createElement('a')
    a.href = url
    a.download = `${id}.${url.endsWith('.svg') ? 'svg' : 'png'}`
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  async function handleBulkStatusChange() {
    if (selectedIds.size === 0) return
    if (!confirm(`${selectedIds.size}件のステータスを「${IMAGE_STATUS_LABELS[bulkStatus]}」に変更しますか？`)) return
    const ids = Array.from(selectedIds)
    const prev = materials
    // Optimistic
    setMaterials(ms => ms.map(m => ids.includes(m.id) ? { ...m, imageStatus: bulkStatus } : m))
    setBusy(true)
    try {
      for (const id of ids) {
        await updateStatus(id, bulkStatus)
      }
    } catch (e) {
      setMaterials(prev)
      alert(e instanceof Error ? e.message : 'エラー')
    } finally {
      setBusy(false)
    }
  }

  // データに実在する category / theme を抽出
  const availableCategories = Array.from(new Set(materials.map(m => m.category))).sort()
  const availableThemes = Array.from(new Set(materials.map(m => m.theme).filter(Boolean) as Theme[])).sort()

  const q = normalizeQuery(search)
  const filtered = materials.filter(m => {
    if (filterCategory !== 'all' && m.category !== filterCategory) return false
    if (filterTheme !== 'all' && m.theme !== filterTheme) return false
    if (filterStatus !== 'all' && (m.imageStatus ?? 'placeholder') !== filterStatus) return false
    if (q) {
      const raw = [
        m.id, m.title, m.description, m.category, m.theme ?? '',
        ...m.tags, m.illustNotes ?? '',
      ].join(' ')
      const hay = normalizeText(raw) + ' ' + normalizeQuery(raw)
      if (!hay.includes(q)) return false
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'id') {
      const pa = parseId(a.id)
      const pb = parseId(b.id)
      cmp = pa.theme.localeCompare(pb.theme)
        || (pa.variant - pb.variant)
        || (pa.diff - pb.diff)
    } else if (sortKey === 'status') {
      const sa = STATUS_ORDER[a.imageStatus ?? 'placeholder'] ?? 99
      const sb = STATUS_ORDER[b.imageStatus ?? 'placeholder'] ?? 99
      cmp = sa - sb
    } else if (sortKey === 'version') {
      cmp = (a.illustVersion ?? 0) - (b.illustVersion ?? 0)
    } else if (sortKey === 'created') {
      cmp = a.createdAt.localeCompare(b.createdAt)
    } else if (sortKey === 'title') {
      cmp = a.title.localeCompare(b.title, 'ja')
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  const allIds = sorted.map(m => m.id)
  const allSelected = selectedIds.size > 0 && allIds.every(i => selectedIds.has(i))

  const thBase = 'px-4 py-2 text-left font-medium'
  const thSort = `${thBase} cursor-pointer hover:text-gray-700 select-none`

  return (
    <>
      {editTarget && (
        <EditMaterialModal
          material={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            // Refresh materials list via server fetch trigger
            // The simplest non-reload approach: refetch the admin page via router.refresh()
            // but materials is a server prop. For now, soft-refresh by reloading,
            // however user prefs persisted in localStorage will restore view/sort/filter.
            window.location.reload()
          }}
        />
      )}

      {/* Sentinel: detect when toolbar's natural position scrolls out */}
      <div ref={sentinelRef} aria-hidden style={{ height: 1 }} />

      {/* Placeholder reserves space when toolbar becomes fixed */}
      {stuck && <div aria-hidden style={{ height: toolbarHeight }} />}

      {/* 操作エリア（fixed when stuck） */}
      <div
        ref={toolbarRef}
        className={`${stuck ? 'fixed top-[112px] sm:top-[136px] md:top-[176px] left-0 right-0 z-40 shadow-md' : 'relative'} bg-white border-b border-gray-200 ${stuck ? '' : 'rounded-t-xl'}`}
      >
      <div className={stuck ? 'max-w-7xl mx-auto px-6' : ''}>
      {/* 検索バー */}
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/30 flex items-center gap-2 text-xs">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 ID / タイトル / 説明 / タグ / メモ を検索"
          className="flex-1 border border-gray-200 rounded px-2.5 py-1.5"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-gray-500 hover:text-gray-700 underline"
          >クリア</button>
        )}
        <span className="text-gray-400">{sorted.length} / {materials.length}件</span>
      </div>

      {/* フィルタ行 */}
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/20 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-gray-500">絞り込み:</span>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value as Category | 'all')}
          className="border border-gray-200 rounded px-2 py-1.5"
        >
          <option value="all">全カテゴリ</option>
          {availableCategories.map(c => (
            <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>
          ))}
        </select>
        <select
          value={filterTheme}
          onChange={e => setFilterTheme(e.target.value as Theme | 'all')}
          className="border border-gray-200 rounded px-2 py-1.5"
        >
          <option value="all">全テーマ</option>
          {availableThemes.map(t => (
            <option key={t} value={t}>{THEME_LABELS[t] ?? t}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as ImageStatus | 'all')}
          className="border border-gray-200 rounded px-2 py-1.5"
        >
          <option value="all">全ステータス</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{IMAGE_STATUS_LABELS[s]}</option>
          ))}
        </select>
        {(filterCategory !== 'all' || filterTheme !== 'all' || filterStatus !== 'all') && (
          <button
            onClick={() => { setFilterCategory('all'); setFilterTheme('all'); setFilterStatus('all') }}
            className="text-gray-500 hover:text-gray-700 underline"
          >フィルタクリア</button>
        )}

        {/* 並び替え */}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-gray-500">並び替え:</span>
          <select
            value={`${sortKey}-${sortDir}`}
            onChange={e => {
              const opt = SORT_OPTIONS.find(o => o.value === e.target.value)
              if (opt) { setSortKey(opt.key); setSortDir(opt.dir) }
            }}
            className="border border-gray-200 rounded px-2 py-1.5"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ツールバー */}
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center gap-3 text-xs">
        {/* 表示切替 */}
        <div className="flex items-center gap-1">
          <span className="text-gray-500">表示:</span>
          <button
            onClick={() => setViewMode('list')}
            className={`px-2 py-1 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
          >リスト</button>
          <button
            onClick={() => setViewMode('tile')}
            className={`px-2 py-1 rounded ${viewMode === 'tile' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
          >タイル</button>
        </div>

        {/* タイルサイズ */}
        {viewMode === 'tile' && (
          <div className="flex items-center gap-1">
            <span className="text-gray-500">サイズ:</span>
            {(['sm','md','lg','xl'] as TileSize[]).map(s => (
              <button
                key={s}
                onClick={() => setTileSize(s)}
                className={`px-2 py-1 rounded ${tileSize === s ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
              >{s.toUpperCase()}</button>
            ))}
          </div>
        )}

        {/* 一括操作 */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-gray-500">選択中: {selectedIds.size}件</span>
          <select
            value={bulkStatus}
            onChange={e => setBulkStatus(e.target.value as ImageStatus)}
            className="border border-gray-200 rounded px-2 py-1"
            disabled={busy}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{IMAGE_STATUS_LABELS[s]}</option>
            ))}
          </select>
          <button
            onClick={handleBulkStatusChange}
            disabled={busy || selectedIds.size === 0}
            className="px-2.5 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400"
          >一括変更</button>
          <button
            onClick={handleBulkDownload}
            disabled={busy || selectedIds.size === 0}
            className="px-2.5 py-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400"
          >⬇ 一括DL</button>
          {selectedIds.size > 0 && (
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-2 py-1 text-gray-500 hover:text-gray-700"
            >クリア</button>
          )}
        </div>
      </div>
      </div>
      </div>
      {/* ← end sticky 操作エリア */}

      {viewMode === 'list' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200">
                <th className={thBase}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => toggleSelectAll(allIds)}
                  />
                </th>
                <th className={thBase}>プレビュー</th>
                <th className={thSort} onClick={() => handleSort('id')}>
                  ID / タイトル <SortIcon active={sortKey === 'id'} dir={sortDir} />
                </th>
                <th className={thSort} onClick={() => handleSort('status')}>
                  ステータス <SortIcon active={sortKey === 'status'} dir={sortDir} />
                </th>
                <th className={thBase}>イラストファイル</th>
                <th className={thSort} onClick={() => handleSort('version')}>
                  VER. <SortIcon active={sortKey === 'version'} dir={sortDir} />
                </th>
                <th className={thSort} onClick={() => handleSort('created')}>
                  登録日 <SortIcon active={sortKey === 'created'} dir={sortDir} />
                </th>
                <th className={thBase}>メモ</th>
                <th className={thBase}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map(m => {
                const status = m.imageStatus ?? 'placeholder'
                const badgeClass = IMAGE_STATUS_COLOR[status]
                const hasIllust = !!m.illustUrl
                const checked = selectedIds.has(m.id)

                return (
                  <tr key={m.id} className={`hover:bg-gray-50 transition-colors ${checked ? 'bg-blue-50/40' : ''}`}>
                    <td className="px-4 py-1.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(m.id)}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <a
                        href={`/materials/${m.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-14 h-10 bg-gray-100 rounded overflow-hidden flex items-center justify-center border border-gray-200 hover:border-blue-400 hover:ring-1 hover:ring-blue-300 transition"
                      >
                        {hasIllust ? (
                          <Image
                            src={m.illustUrl!}
                            alt={m.title}
                            width={56}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : m.imageUrl.endsWith('.svg') ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.imageUrl} alt={m.title} className="w-full h-full object-contain p-1" />
                        ) : (
                          <span className="text-xl">🖼️</span>
                        )}
                      </a>
                    </td>

                    <td className="px-4 py-1.5">
                      <a
                        href={`/materials/${m.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-blue-600 hover:underline"
                      >
                        {m.id}
                      </a>
                      <p className="text-xs text-gray-700 mt-0.5 max-w-[200px]">{m.title}</p>
                    </td>

                    <td className="px-4 py-1.5">
                      <select
                        value={status}
                        onChange={e => handleRowStatusChange(m.id, e.target.value as ImageStatus)}
                        disabled={busy}
                        className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badgeClass} cursor-pointer`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{IMAGE_STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-1.5 max-w-[180px]">
                      {hasIllust ? (
                        <code className="text-xs text-green-700 bg-green-50 px-1.5 py-0.5 rounded block truncate" title={m.illustUrl!}>
                          {m.illustUrl!.split('/').pop()}
                        </code>
                      ) : (
                        <code className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                          未設定
                        </code>
                      )}
                    </td>

                    <td className="px-4 py-1.5 text-xs text-gray-500">
                      {m.illustVersion ? `v${m.illustVersion}` : '—'}
                    </td>

                    <td className="px-4 py-1.5 text-xs text-gray-500" title={m.createdAt}>
                      {formatDate(m.createdAt)}
                    </td>

                    <td className="px-4 py-1.5 text-xs text-gray-500 max-w-[160px] truncate">
                      {m.illustNotes ?? <span className="text-gray-300">—</span>}
                    </td>

                    <td className="px-4 py-1.5 flex items-center gap-2">
                      <button
                        onClick={() => setEditTarget(m)}
                        className="text-xs text-blue-500 hover:text-blue-700 border border-blue-200 hover:border-blue-400 px-2 py-0.5 rounded"
                      >
                        編集
                      </button>
                      {m.illustUrl && (
                        <button
                          onClick={() => downloadSingle(m.illustUrl!, m.id)}
                          title="ダウンロード"
                          className="text-xs text-emerald-600 hover:text-emerald-800 border border-emerald-200 hover:border-emerald-400 px-2 py-0.5 rounded"
                        >⬇</button>
                      )}
                      {m.illustUrl && <DeleteButton illustUrl={m.illustUrl} />}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        // タイル表示
        <div className="p-4">
          <div className={`grid ${TILE_SIZES[tileSize].cols} gap-3`}>
            {sorted.map(m => {
              const status = m.imageStatus ?? 'placeholder'
              const badgeClass = IMAGE_STATUS_COLOR[status]
              const hasIllust = !!m.illustUrl
              const checked = selectedIds.has(m.id)
              const { w, h } = TILE_SIZES[tileSize]

              return (
                <div key={m.id} className={`border rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow ${checked ? 'ring-2 ring-blue-400 border-blue-300' : 'border-gray-200'}`}>
                  <div className="relative bg-gray-50 flex items-center justify-center" style={{ height: h }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelect(m.id)}
                      className="absolute top-2 left-2 z-10 w-4 h-4"
                    />
                    <a
                      href={`/materials/${m.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block w-full h-full flex items-center justify-center hover:opacity-80 transition"
                    >
                      {hasIllust ? (
                        <Image
                          src={m.illustUrl!}
                          alt={m.title}
                          width={w}
                          height={h}
                          className="w-full h-full object-contain"
                        />
                      ) : m.imageUrl.endsWith('.svg') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.imageUrl} alt={m.title} className="w-full h-full object-contain p-2" />
                      ) : (
                        <span className="text-4xl">🖼️</span>
                      )}
                    </a>
                  </div>
                  <div className="p-2 space-y-1.5">
                    <a
                      href={`/materials/${m.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block font-mono text-[10px] text-blue-600 hover:underline truncate"
                      title={m.id}
                    >
                      {m.id}
                    </a>
                    <p className="text-xs text-gray-700 truncate" title={m.title}>{m.title}</p>
                    <select
                      value={status}
                      onChange={e => handleRowStatusChange(m.id, e.target.value as ImageStatus)}
                      disabled={busy}
                      className={`w-full text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${badgeClass} cursor-pointer`}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{IMAGE_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditTarget(m)}
                        className="flex-1 text-[10px] text-blue-500 hover:text-blue-700 border border-blue-200 hover:border-blue-400 px-1.5 py-0.5 rounded"
                      >
                        編集
                      </button>
                      {m.illustUrl && (
                        <button
                          onClick={() => downloadSingle(m.illustUrl!, m.id)}
                          title="ダウンロード"
                          className="text-[10px] text-emerald-600 hover:text-emerald-800 border border-emerald-200 hover:border-emerald-400 px-1.5 py-0.5 rounded"
                        >⬇</button>
                      )}
                      {m.illustUrl && <DeleteButton illustUrl={m.illustUrl} />}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
