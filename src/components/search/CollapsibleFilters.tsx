'use client'

import { useState } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { SearchFilters } from './SearchFilters'

/**
 * モバイル: タップで開閉する折りたたみカード（デフォルト閉）
 * デスクトップ: 常に開いた状態の sticky サイドバー
 */
export function CollapsibleFilters() {
  const [open, setOpen] = useState(false)
  const searchParams = useSearchParams()
  const activeCount = ['age', 'category', 'season', 'event', 'theme', 'search', 'difficulty']
    .filter(k => searchParams.get(k)).length

  return (
    <>
      {/* モバイル: コンパクトな折りたたみカード */}
      <div className="lg:hidden bg-white border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
          aria-expanded={open}
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <span className="font-rounded font-bold text-[14px]">絞り込み</span>
            {activeCount > 0 && (
              <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {activeCount}
              </span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="px-4 pb-4 pt-1 border-t border-border">
            <div className="flex items-center justify-end mb-3">
              {activeCount > 0 && (
                <Link href="/materials" className="text-[11px] text-primary hover:underline">クリア</Link>
              )}
            </div>
            <SearchFilters />
          </div>
        )}
      </div>

      {/* デスクトップ: 既存どおり常に開いた sticky サイドバー */}
      <div className="hidden lg:block bg-white border border-border rounded-lg p-4 lg:sticky lg:top-32">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-rounded font-bold text-[14px]">絞り込み</h2>
          {activeCount > 0 && (
            <Link href="/materials" className="text-[11px] text-primary hover:underline">クリア</Link>
          )}
        </div>
        <SearchFilters />
      </div>
    </>
  )
}
