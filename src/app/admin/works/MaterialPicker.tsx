'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Check } from 'lucide-react'

export type MaterialOption = { id: string; title: string }

export function MaterialPicker({
  options,
  value,
  onChange,
}: {
  options: MaterialOption[]
  value: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  // 検索キーワードに対するマッチング: id, title 両方を見る
  const filtered = search
    ? options.filter(o => {
        const q = search.toLowerCase()
        return o.id.toLowerCase().includes(q) || o.title.toLowerCase().includes(q)
      })
    : options

  const selected = options.find(o => o.id === value)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full px-4 py-3 border border-border rounded-lg text-left bg-white hover:border-primary transition-colors flex items-center justify-between gap-2 min-h-[52px]"
      >
        {selected ? (
          <span className="flex-1 min-w-0">
            <span className="block font-bold text-sm truncate">{selected.title}</span>
            <span className="block text-[11px] text-muted-foreground font-mono truncate">{selected.id}</span>
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">タップして素材を選択（featured 295件から）</span>
        )}
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-lg sm:rounded-xl max-h-[92vh] flex flex-col rounded-t-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 p-3 border-b border-border">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="タイトル・IDで検索"
                  className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-base focus:outline-none focus:border-primary"
                />
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted"
                aria-label="閉じる"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 overscroll-contain">
              {filtered.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">該当する素材なし</p>
              ) : (
                <ul>
                  {filtered.map(o => {
                    const isSelected = o.id === value
                    return (
                      <li key={o.id}>
                        <button
                          type="button"
                          onClick={() => {
                            onChange(o.id)
                            setOpen(false)
                            setSearch('')
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-muted active:bg-muted/80 flex items-center justify-between gap-2 border-b border-border last:border-0 ${isSelected && 'bg-primary/5'}`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm truncate">{o.title}</div>
                            <div className="text-[11px] text-muted-foreground font-mono truncate">{o.id}</div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="border-t border-border p-2 text-center text-[11px] text-muted-foreground">
              {filtered.length} / {options.length} 件
            </div>
          </div>
        </div>
      )}
    </>
  )
}
