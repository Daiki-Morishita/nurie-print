import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, ArrowRight } from 'lucide-react'
import type { PostWithImages } from '@/lib/posts'
import { deriveTitle } from '@/lib/posts'

export function RelatedPosts({ posts, materialTitle }: { posts: PostWithImages[]; materialTitle: string }) {
  if (posts.length === 0) return null

  return (
    <section className="mt-10 mb-2 bg-gradient-to-br from-[#FFF8EC] to-white border border-border rounded-2xl p-5 md:p-7">
      <div className="font-rounded font-bold text-[11px] text-primary mb-1 tracking-[0.1em]">— Real Stories —</div>
      <h2 className="font-rounded text-[18px] md:text-[22px] font-black mb-1">この塗り絵を使った記事</h2>
      <p className="text-[12px] text-muted-foreground mb-5">
        「{materialTitle}」を実際に塗ってみたときの記録が{posts.length}件あります。
      </p>

      <div className="space-y-3">
        {posts.map(p => {
          const title = deriveTitle({ title: p.title, body: p.body })
          const thumb = p.images[0]?.url
          const excerpt = p.body.replace(/\n+/g, ' ').slice(0, 100)
          return (
            <Link
              key={p.id}
              href={`/posts/${p.id}`}
              className="flex gap-3 sm:gap-4 bg-white border border-border rounded-xl overflow-hidden hover:border-primary transition-colors group"
            >
              {thumb ? (
                <div className="relative w-24 sm:w-32 aspect-square shrink-0 bg-muted">
                  <Image src={thumb} alt={title} fill className="object-cover" sizes="128px" unoptimized />
                </div>
              ) : (
                <div className="w-24 sm:w-32 aspect-square shrink-0 bg-muted flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0 p-3 flex flex-col">
                <h3 className="font-bold text-[14px] line-clamp-1 mb-1">{title}</h3>
                <p className="text-[12px] text-muted-foreground line-clamp-2 mb-2 flex-1">{excerpt}</p>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <time>
                    {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('ja-JP') : ''}
                  </time>
                  <span className="inline-flex items-center gap-0.5 text-primary group-hover:gap-1 transition-all font-bold">
                    記事を読む <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
