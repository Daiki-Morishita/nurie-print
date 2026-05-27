'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Clock, Calendar, FileText, Eye } from 'lucide-react'
import type { PostDTO } from './PostsAdmin'

type Filter = 'all' | 'draft' | 'scheduled' | 'published'
type Sort = 'newest' | 'oldest' | 'updated'

function statusOf(p: PostDTO): Filter {
  if (!p.publishedAt) return 'draft'
  if (new Date(p.publishedAt).getTime() > Date.now()) return 'scheduled'
  return 'published'
}

function deriveTitle(p: PostDTO): string {
  if (p.title?.trim()) return p.title
  const firstLine = p.body.split('\n').find(l => l.trim().length > 0) ?? ''
  return firstLine.slice(0, 40) || '無題の投稿'
}

export function PostList({
  posts,
  titleMap,
  onEdit,
}: {
  posts: PostDTO[]
  titleMap: Map<string, string>
  onEdit: (p: PostDTO) => void
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('newest')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let list = posts.slice()
    if (filter !== 'all') list = list.filter(p => statusOf(p) === filter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        deriveTitle(p).toLowerCase().includes(q)
        || p.body.toLowerCase().includes(q)
        || p.materialIds.some(id => (titleMap.get(id) ?? '').toLowerCase().includes(q)),
      )
    }
    if (sort === 'newest') list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    else if (sort === 'oldest') list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    else if (sort === 'updated') list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    return list
  }, [posts, filter, sort, search, titleMap])

  const counts = useMemo(() => ({
    all: posts.length,
    draft: posts.filter(p => statusOf(p) === 'draft').length,
    scheduled: posts.filter(p => statusOf(p) === 'scheduled').length,
    published: posts.filter(p => statusOf(p) === 'published').length,
  }), [posts])

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3 gap-3 flex-wrap">
        <h2 className="font-bold text-base sm:text-lg shrink-0">投稿一覧（{posts.length}件）</h2>
        <div className="flex gap-2 flex-wrap items-center">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="絞り込み"
            className="px-3 py-1.5 border border-border rounded-lg text-sm w-32 sm:w-44"
          />
          <select
            value={sort}
            onChange={e => setSort(e.target.value as Sort)}
            className="px-2 py-1.5 border border-border rounded-lg text-sm"
          >
            <option value="newest">新着順</option>
            <option value="oldest">古い順</option>
            <option value="updated">更新順</option>
          </select>
        </div>
      </div>

      {/* フィルタタブ */}
      <div className="flex gap-1 mb-4 bg-muted p-1 rounded-lg overflow-x-auto">
        {([
          ['all', 'すべて'],
          ['draft', '下書き'],
          ['scheduled', '予約'],
          ['published', '公開中'],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              filter === k ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'
            }`}
          >
            {label} <span className="text-[10px] opacity-60">{counts[k]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground bg-muted p-6 rounded-lg text-center">
          {posts.length === 0 ? 'まだ投稿がありません。' : '該当する投稿なし'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map(p => {
            const status = statusOf(p)
            const StatusIcon = status === 'draft' ? FileText : status === 'scheduled' ? Calendar : Eye
            const firstImage = p.images[0]
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onEdit(p)}
                className="text-left border border-border rounded-lg overflow-hidden bg-white hover:border-primary transition-colors flex flex-col"
              >
                {firstImage ? (
                  <div className="relative aspect-[4/3] bg-muted">
                    <Image src={firstImage.url} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
                    {p.images.length > 1 && (
                      <div className="absolute top-1.5 right-1.5 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        +{p.images.length - 1}
                      </div>
                    )}
                    <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                      status === 'draft' ? 'bg-amber-200 text-amber-900'
                      : status === 'scheduled' ? 'bg-blue-200 text-blue-900'
                      : 'bg-green-200 text-green-900'
                    }`}>
                      <StatusIcon className="w-2.5 h-2.5" />
                      {status === 'draft' ? '下書き' : status === 'scheduled' ? '予約' : '公開'}
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-muted flex flex-col items-center justify-center gap-1 relative">
                    <FileText className="w-6 h-6 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">画像なし</span>
                    <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                      status === 'draft' ? 'bg-amber-200 text-amber-900'
                      : status === 'scheduled' ? 'bg-blue-200 text-blue-900'
                      : 'bg-green-200 text-green-900'
                    }`}>
                      <StatusIcon className="w-2.5 h-2.5" />
                      {status === 'draft' ? '下書き' : status === 'scheduled' ? '予約' : '公開'}
                    </div>
                  </div>
                )}
                <div className="p-3 space-y-1.5 flex-1">
                  <div className="font-bold text-sm line-clamp-1">{deriveTitle(p)}</div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{p.body}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
                    <Clock className="w-3 h-3" />
                    {status === 'scheduled' && p.publishedAt
                      ? `予約: ${new Date(p.publishedAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                      : status === 'published' && p.publishedAt
                      ? `公開: ${new Date(p.publishedAt).toLocaleDateString('ja-JP')}`
                      : `作成: ${new Date(p.createdAt).toLocaleDateString('ja-JP')}`}
                  </div>
                  {p.materialIds.length > 0 && (
                    <div className="text-[10px] text-muted-foreground">塗り絵 {p.materialIds.length}件</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
