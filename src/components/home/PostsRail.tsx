import Link from 'next/link'
import Image from 'next/image'
import { BookOpen } from 'lucide-react'
import type { PostWithImages } from '@/lib/posts'
import { deriveTitle } from '@/lib/posts'

/** 過去記事の横スクロールカード列（トップの「ちょっと前のいちまい」用） */
export function PostsRail({ posts }: { posts: PostWithImages[] }) {
  if (posts.length === 0) return null

  return (
    <div className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
      {posts.map(p => {
        const title = deriveTitle({ title: p.title, body: p.body })
        const thumb = p.images[0]?.url
        const excerpt = p.body.replace(/\n+/g, ' ').slice(0, 40)
        return (
          <Link
            key={p.id}
            href={`/posts/${p.id}`}
            className="snap-start shrink-0 w-[200px] sm:w-[230px] bg-white border border-border rounded-xl overflow-hidden hover:border-primary transition-colors flex flex-col"
          >
            {thumb ? (
              <div className="relative aspect-[4/3] bg-muted">
                <Image src={thumb} alt={title} fill className="object-cover" sizes="230px" unoptimized />
                {p.images.length > 1 && (
                  <div className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {p.images.length}枚
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-muted-foreground" />
              </div>
            )}
            <div className="p-3 flex flex-col flex-1">
              <h3 className="font-mincho font-black text-[14px] leading-snug line-clamp-1 mb-1">{title}</h3>
              <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2 flex-1">{excerpt}</p>
              <time className="text-[10px] text-muted-foreground">
                {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('ja-JP') : ''}
              </time>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
