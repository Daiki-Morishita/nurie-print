import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  currentPage: number
  totalPages: number
  /** Base path (e.g. "/materials") */
  basePath: string
  /** All current search params except `page` — preserved across pagination clicks */
  searchParams: Record<string, string | undefined>
  /** Optional: total result count, shown next to numbers */
  totalCount?: number
}

/**
 * 番号付きページャー。中央 5ページ前後 + 先頭・末尾を表示。
 * Server Component（next/link で純粋にURLを変える）。
 */
export function Pagination({ currentPage, totalPages, basePath, searchParams, totalCount }: Props) {
  if (totalPages <= 1) return null

  // ページ番号リスト: 1, ..., current-2, current-1, current, current+1, current+2, ..., last
  function buildPageList(): (number | '...')[] {
    const pages = new Set<number>([1, totalPages])
    for (let p = currentPage - 2; p <= currentPage + 2; p++) {
      if (p >= 1 && p <= totalPages) pages.add(p)
    }
    const sorted = [...pages].sort((a, b) => a - b)
    const result: (number | '...')[] = []
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...')
      result.push(sorted[i])
    }
    return result
  }

  function buildHref(page: number): string {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries(searchParams)) {
      if (v != null && k !== 'page') q.set(k, v)
    }
    if (page > 1) q.set('page', String(page))
    const qs = q.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  const pages = buildPageList()
  const startItem = (currentPage - 1) * 48 + 1
  const endItem = totalCount ? Math.min(currentPage * 48, totalCount) : currentPage * 48

  return (
    <nav className="mt-8 flex flex-col items-center gap-3" aria-label="ページネーション">
      {totalCount && (
        <p className="text-[12px] text-muted-foreground">
          {startItem}–{endItem} / {totalCount} 件
        </p>
      )}
      <div className="flex items-center gap-1 flex-wrap justify-center">
        {/* Previous */}
        {currentPage > 1 ? (
          <Link
            href={buildHref(currentPage - 1)}
            rel="prev nofollow"
            className="flex items-center gap-1 px-3 py-2 text-[13px] border border-border rounded hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />前へ
          </Link>
        ) : (
          <span className="flex items-center gap-1 px-3 py-2 text-[13px] text-muted-foreground/50 border border-border rounded">
            <ChevronLeft className="w-4 h-4" />前へ
          </span>
        )}

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-muted-foreground">…</span>
          ) : p === currentPage ? (
            <span
              key={p}
              aria-current="page"
              className="min-w-[36px] text-center px-3 py-2 text-[13px] bg-primary text-white rounded font-bold"
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={buildHref(p)}
              rel="nofollow"
              className="min-w-[36px] text-center px-3 py-2 text-[13px] border border-border rounded hover:bg-muted transition-colors"
            >
              {p}
            </Link>
          )
        )}

        {/* Next */}
        {currentPage < totalPages ? (
          <Link
            href={buildHref(currentPage + 1)}
            rel="next nofollow"
            className="flex items-center gap-1 px-3 py-2 text-[13px] border border-border rounded hover:bg-muted transition-colors"
          >
            次へ<ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <span className="flex items-center gap-1 px-3 py-2 text-[13px] text-muted-foreground/50 border border-border rounded">
            次へ<ChevronRight className="w-4 h-4" />
          </span>
        )}
      </div>
    </nav>
  )
}
