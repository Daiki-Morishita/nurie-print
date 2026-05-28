import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, ChevronRight } from 'lucide-react'
import { listPublishedPosts, deriveTitle } from '@/lib/posts'

export const dynamic = 'force-static'
export const revalidate = 60

export const metadata = {
  title: '今日のいちまい — おやこの記録',
  description: 'おやこの時間の、ちいさな記録。実際に塗ってみた作品と気づきを編集部が記事にしています。',
  alternates: { canonical: 'https://nurie-print.com/posts' },
}

const PAGE_SIZE = 24

export default async function PostsListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page ?? '1') || 1)
  const offset = (page - 1) * PAGE_SIZE
  const { posts, total } = await listPublishedPosts({ limit: PAGE_SIZE, offset })
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 md:py-12">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
        <Link href="/" className="hover:text-foreground">ホーム</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground">今日のいちまい</span>
      </nav>

      <header className="text-center mb-10">
        <div className="font-rounded text-[11px] text-primary tracking-[0.2em] mb-2 font-black">— Today&apos;s Pieces —</div>
        <h1 className="font-mincho text-[28px] md:text-[40px] font-black mb-2">今日のいちまい</h1>
        <p className="text-[13px] text-muted-foreground">
          おやこの時間の、ちいさな記録。{total > 0 ? `${total}件の記事があります。` : ''}
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground bg-muted rounded-lg py-12">
          まだ記事がありません。これから順次更新します。
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {posts.map(p => {
              const title = deriveTitle({ title: p.title, body: p.body })
              const thumb = p.images[0]?.url
              const excerpt = p.body.replace(/\n+/g, ' ').slice(0, 80)
              return (
                <Link
                  key={p.id}
                  href={`/posts/${p.id}`}
                  className="bg-white border border-border rounded-xl overflow-hidden hover:border-primary transition-colors flex flex-col group"
                >
                  {thumb ? (
                    <div className="relative aspect-[4/3] bg-muted">
                      <Image src={thumb} alt={title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" unoptimized />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-4 flex flex-col flex-1">
                    <h2 className="font-mincho font-black text-[16px] mb-2 line-clamp-2">{title}</h2>
                    <p className="text-[12px] text-muted-foreground line-clamp-2 mb-2 flex-1">{excerpt}</p>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border">
                      <time>
                        {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('ja-JP') : ''}
                      </time>
                      {p.materialIds.length > 0 && <span>塗り絵 {p.materialIds.length}件</span>}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {totalPages > 1 && (
            <nav className="flex justify-center gap-2 mt-10" aria-label="ページネーション">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <Link
                  key={p}
                  href={p === 1 ? '/posts' : `/posts?page=${p}`}
                  className={`px-3 py-1.5 rounded-lg border text-sm ${p === page ? 'bg-primary text-white border-primary' : 'border-border hover:bg-muted'}`}
                >
                  {p}
                </Link>
              ))}
            </nav>
          )}
        </>
      )}
    </div>
  )
}
