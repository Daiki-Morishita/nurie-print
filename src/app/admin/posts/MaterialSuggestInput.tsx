'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Image from 'next/image'
import { X, Search } from 'lucide-react'
import { normalizeQuery, normalizeText } from '@/lib/utils'

type Option = { id: string; title: string }

/** value は space 区切りの素材ID文字列。onChange で同形式を返す（既存の submit ロジックと互換）。 */
export function MaterialSuggestInput({
  titleMap,
  imageMap,
  value,
  onChange,
}: {
  titleMap: Map<string, string>
  imageMap?: Map<string, string>
  value: string
  onChange: (v: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null)
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
      {/* 選択済みチップ（サムネ付き） */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedIds.map(id => {
            const thumb = imageMap?.get(id)
            return (
              <span
                key={id}
                className="inline-flex items-center gap-2 pl-1 pr-1.5 py-1 bg-white text-foreground rounded-lg text-[12px] border border-green-300 shadow-sm"
              >
                {thumb ? (
                  <button
                    type="button"
                    onClick={() => setLightbox({ url: thumb, title: titleMap.get(id) ?? '' })}
                    className="relative w-10 h-10 rounded overflow-hidden bg-muted shrink-0 hover:ring-2 hover:ring-primary"
                    aria-label={`${titleMap.get(id)} を拡大表示`}
                  >
                    <Image src={thumb} alt={titleMap.get(id) ?? ''} fill className="object-cover" sizes="40px" unoptimized />
                  </button>
                ) : (
                  <span className="w-10 h-10 rounded bg-muted shrink-0" />
                )}
                <span className="max-w-[140px] truncate font-medium">{titleMap.get(id)}</span>
                <button
                  type="button"
                  onClick={() => removeId(id)}
                  className="w-5 h-5 flex items-center justify-center rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600 shrink-0"
                  aria-label={`${titleMap.get(id)} を削除`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )
          })}
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
            {suggestions.map((o, i) => {
              const thumb = imageMap?.get(o.id)
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onMouseDown={e => {
                      e.preventDefault()
                      addId(o.id)
                    }}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={`w-full text-left px-2.5 py-2 flex items-center gap-2.5 ${
                      i === activeIdx ? 'bg-primary/10' : 'hover:bg-muted'
                    }`}
                  >
                    {thumb ? (
                      <span className="relative w-9 h-9 rounded overflow-hidden bg-muted shrink-0">
                        <Image src={thumb} alt="" fill className="object-cover" sizes="36px" unoptimized />
                      </span>
                    ) : (
                      <span className="w-9 h-9 rounded bg-muted shrink-0" />
                    )}
                    <span className="text-sm truncate flex-1">{o.title}</span>
                    <span className="text-[10px] text-muted-foreground font-mono truncate shrink-0 max-w-[120px]">{o.id}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {open && query.trim() && suggestions.length === 0 && (
          <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg px-3 py-2.5 text-[12px] text-amber-700">
            「{query}」に一致する塗り絵が見つかりません
          </div>
        )}
      </div>

      {/* サムネ拡大モーダル */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[120] bg-black/70 flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white text-foreground border border-border shadow flex items-center justify-center z-10"
              aria-label="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="bg-white rounded-xl overflow-hidden">
              <div className="relative w-full aspect-[1.414/1] bg-muted">
                <Image src={lightbox.url} alt={lightbox.title} fill className="object-contain" sizes="512px" unoptimized />
              </div>
              <div className="px-4 py-3 text-center text-sm font-bold">{lightbox.title}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
