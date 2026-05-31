import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import { PostCarousel } from '@/components/posts/PostCarousel'
import { PostsRail } from '@/components/home/PostsRail'
import type { PostWithImages } from '@/lib/posts'
import { deriveTitle } from '@/lib/posts'

/** 本文を「半分くらいで途切れさせる」抜粋ロジック */
function makeExcerpt(body: string, maxLen = 180): string {
  const stripped = body.replace(/\n+/g, '\n').trim()
  if (stripped.length <= maxLen) return stripped
  return stripped.slice(0, maxLen)
}

export function TodaysPost({
  posts,
  titleMap,
}: {
  posts: PostWithImages[]
  titleMap: Map<string, string>
}) {
  if (posts.length === 0) return null
  const [post, ...rest] = posts

  const title = deriveTitle({ title: post.title, body: post.body })
  const excerpt = makeExcerpt(post.body)
  const hasMoreText = post.body.length > excerpt.length

  // 関連塗り絵チップ（画像右下オーバーレイ用）。最大3件 + 残数
  const validMaterials = post.materialIds
    .map(id => ({ id, title: titleMap.get(id) }))
    .filter((m): m is { id: string; title: string } => !!m.title)
  const relatedChips = validMaterials.slice(0, 3)
  const extraCount = validMaterials.length - relatedChips.length

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-[#FFF8EC]/80 to-background border-t border-border">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <div className="font-rounded text-[11px] text-primary tracking-[0.2em] mb-2 font-black">
            — Today&apos;s Piece —
          </div>
          <h2 className="font-mincho text-[24px] md:text-[34px] font-black mb-1">今日のいちまい</h2>
          <p className="text-[12px] text-muted-foreground">
            おやこの時間の、ちいさな記録。
          </p>
        </div>

        <article className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
          {post.images.length > 0 && (
            <div className="relative">
              <PostCarousel images={post.images} alt={title} aspectClass="aspect-[4/3] md:aspect-[16/9]" />
              {/* この記事の塗り絵 — 画像右下にオーバーレイ（余白節約） */}
              {relatedChips.length > 0 && (
                <div className="absolute bottom-3 right-3 z-[5] flex flex-col items-end gap-1.5 max-w-[80%]">
                  <span className="inline-flex items-center text-[11px] text-white font-bold tracking-wide bg-black/55 backdrop-blur px-2.5 py-1 rounded-full">
                    🖍️ この記事の塗り絵
                  </span>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {relatedChips.map(c => (
                      <Link
                        key={c.id}
                        href={`/materials/${c.id}`}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-primary text-white hover:bg-[#d05a23] rounded-full text-[13px] font-rounded font-black shadow-md transition-colors"
                      >
                        {c.title}
                      </Link>
                    ))}
                    {extraCount > 0 && (
                      <span className="inline-flex items-center px-3 py-2 bg-white/95 text-primary rounded-full text-[13px] font-rounded font-black shadow-md">
                        +{extraCount}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="p-5 md:p-8">
            <h3 className="font-mincho text-[20px] md:text-[26px] font-black leading-snug mb-4">
              {title}
            </h3>

            <div className="relative">
              <p className="text-[14px] md:text-[15px] text-foreground/85 leading-relaxed whitespace-pre-wrap">
                {excerpt}
                {hasMoreText && <span className="text-muted-foreground">…</span>}
              </p>
              {hasMoreText && (
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              )}
            </div>

            <div className="mt-5 text-center">
              <Link
                href={`/posts/${post.id}`}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full text-[13px] font-rounded font-black hover:opacity-90 transition-opacity"
              >
                <BookOpen className="w-4 h-4" />
                記事を読む
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </article>

        {/* ちょっと前のいちまい（記事2件以上のときのみ） */}
        {rest.length > 0 && (
          <div className="mt-10">
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="font-rounded text-[15px] md:text-[17px] font-black">ちょっと前のいちまい</h3>
              <Link href="/posts" className="text-[12px] text-primary hover:underline inline-flex items-center gap-1">
                ぜんぶ見る <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <PostsRail posts={rest} />
          </div>
        )}
      </div>
    </section>
  )
}
