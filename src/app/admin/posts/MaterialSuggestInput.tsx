'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { X, Search } from 'lucide-react'
import { normalizeQuery, normalizeText } from '@/lib/utils'

type Option = { id: string; title: string }

/** value は space 区切りの素材ID文字列。onChange で同形式を返す（既存の submit ロジックと互換）。 */
export function MaterialSuggestInput({
  titleMap,
  value,
  onChange,
}: {
  titleMap: Map<string, string>
  value: string
  onChange: (v: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)

  // value 文字列 → 選択済みID配列（URL・ID両対応、titleMap に存在するもののみ）
  const selectedIds = useMemo(
    () =>
      value
        .split(/[\s,]+/)
        .map(s => s.trim())
        .filter(Boolean)
        .map(t => {
          const m = t.match(/\/materials\/([a-z0-9-]+)/i)
          return m ? m[1] : t
        })
        .filter(id => titleMap.has(id)),
    [value, titleMap],
  )

  const allOptions = useMemo<Option[]>(
    () => Array.from(titleMap.entries()).map(([id, title]) => ({ id, title })),
    [titleMap],
  )

  const suggestions = useMemo(() => {
    const q = normalizeQuery(query.trim())
    if (!q) return []
    const sel = new Set(selectedIds)
    const result: Option[] = []
    for (const o of allOptions) {
      if (sel.has(o.id)) continue
      const hay = normalizeText(o.title) + ' ' + o.id.toLowerCase()
      if (hay.includes(q)) {
        result.push(o)
        if (result.length >= 10) break
      }
    }
    return result
  }, [query, allOptions, selectedIds])

  function addId(id: string) {
    if (!selectedIds.includes(id)) {
      onChange([...selectedIds, id].join(' '))
    }
    setQuery('')
    setOpen(false)
    setActiveIdx(0)
  }
  function removeId(id: string) {
    onChange(selectedIds.filter(x => x !== id).join(' '))
  }

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div ref={boxRef} className="relative">
      {/* 選択済みチップ */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedIds.map(id => (
            <span
              key={id}
              className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-green-50 text-green-800 rounded-full text-[12px] border border-green-200"
            >
              {titleMap.get(id)}
              <button
                type="button"
                onClick={() => removeId(id)}
                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-green-200"
                aria-label={`${titleMap.get(id)} を削除`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setOpen(true)
            setActiveIdx(0)
          }}
          onFocus={() => { if (query) setOpen(true) }}
          onKeyDown={e => {
            if (!open || suggestions.length === 0) return
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActiveIdx(i => Math.min(i + 1, suggestions.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActiveIdx(i => Math.max(i - 1, 0))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              addId(suggestions[activeIdx].id)
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
          placeholder="塗り絵のタイトルで検索（例: こいのぼり、くま、しんかんせん）"
          autoComplete="off"
          className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-base"
        />

        {open && suggestions.length > 0 && (
          <ul className="absolute z-30 left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {suggestions.map((o, i) => (
              <li key={o.id}>
                <button
                  type="button"
                  onMouseDown={e => {
                    e.preventDefault()
                    addId(o.id)
                  }}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 ${
                    i === activeIdx ? 'bg-primary/10' : 'hover:bg-muted'
                  }`}
                >
                  <span className="text-sm truncate">{o.title}</span>
                  <span className="text-[10px] text-muted-foreground font-mono truncate shrink-0">{o.id}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {open && query.trim() && suggestions.length === 0 && (
          <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg px-3 py-2.5 text-[12px] text-amber-700">
            「{query}」に一致する塗り絵が見つかりません
          </div>
        )}
      </div>
    </div>
  )
}
