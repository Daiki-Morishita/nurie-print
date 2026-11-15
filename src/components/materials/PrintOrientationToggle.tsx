'use client'

import { useEffect, useState } from 'react'

type Orient = 'landscape' | 'portrait'
const KEY = 'print-orient'
const EVENT = 'print-orient-change'
export const PRINT_PAGE_STYLE_ID = 'print-page-size'

export function pageSizeCss(o: Orient) {
  return `@page { size: A4 ${o}; margin: 8mm; }`
}

function apply(o: Orient) {
  const el = document.getElementById(PRINT_PAGE_STYLE_ID)
  if (el) el.textContent = pageSizeCss(o)
  document.documentElement.dataset.printOrient = o
}

export function PrintOrientationToggle() {
  const [orient, setOrient] = useState<Orient>('landscape')

  useEffect(() => {
    let saved: Orient = 'landscape'
    try {
      if (localStorage.getItem(KEY) === 'portrait') saved = 'portrait'
    } catch {}
    setOrient(saved)
    apply(saved)
    const onChange = (e: Event) => setOrient((e as CustomEvent<Orient>).detail)
    window.addEventListener(EVENT, onChange)
    return () => window.removeEventListener(EVENT, onChange)
  }, [])

  function choose(o: Orient) {
    apply(o)
    try {
      localStorage.setItem(KEY, o)
    } catch {}
    window.dispatchEvent(new CustomEvent(EVENT, { detail: o }))
  }

  const btn = (o: Orient, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => choose(o)}
      aria-pressed={orient === o}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] font-medium rounded-lg transition-colors ${
        orient === o ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  )

  return (
    <div>
      <div className="text-[11px] text-muted-foreground mb-1">用紙の向き</div>
      <div className="flex gap-1 p-1 bg-muted rounded-xl" role="group" aria-label="用紙の向き">
        {btn('landscape', 'よこ', <span className="inline-block w-4 h-3 border-[1.5px] border-current rounded-[2px]" />)}
        {btn('portrait', 'たて', <span className="inline-block w-3 h-4 border-[1.5px] border-current rounded-[2px]" />)}
      </div>
    </div>
  )
}
