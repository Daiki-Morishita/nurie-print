import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PostCarousel } from '@/components/posts/PostCarousel'
import { getPublishedPostById, getAllPublishedPostIds, deriveTitle } from '@/lib/posts'
import { materials, getMaterialById } from '@/lib/data'
import { MaterialCard } from '@/components/materials/MaterialCard'

export const dynamic = 'force-static'
export const revalidate = 60

export async function generateStaticParams() {
  const ids = await getAllPublishedPostIds()
  return ids.map(id => ({ id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getPublishedPostById(id)
  if (!post) return {}
  const title = deriveTitle({ title: post.title, body: post.body })
  const description = post.body.slice(0, 140).replace(/\n+/g, ' ')
  const firstImage = post.images[0]?.url
  return {
    title,
    description,
    alternates: { canonical: `https://nurie-print.com/posts/${id}` },
    openGraph: {
      title,
      description,
      type: 'article',
      ...(firstImage ? { images: [{ url: firstImage }] } : {}),
    },
  }
}

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getPublishedPostById(id)
  if (!post) notFound()

  const title = deriveTitle({ title: post.title, body: post.body })
  const linkedMaterials = post.materialIds
    .map(mid => getMaterialById(mid))
    .filter((m): m is NonNullable<typeof m> => !!m)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    inLanguage: 'ja',
    publisher: {
      '@type': 'Organization',
      name: 'ぬりえプリント',
      url: 'https://nurie-print.com',
    },
    image: post.images.map(i => i.url),
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://nurie-print.com/posts/${id}` },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="max-w-[860px] mx-auto px-4 sm:px-6 py-8 md:py-12">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
          <Link href="/" className="hover:text-foreground">ホーム</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground line-clamp-1">{title}</span>
        </nav>

        <header className="mb-6">
          <div className="font-rounded text-[11px] text-primary tracking-[0.2em] mb-2 font-black">— Today&apos;s Piece —</div>
          <h1 className="font-mincho text-[24px] md:text-[34px] font-black leading-snug mb-3">{title}</h1>
          {post.publishedAt && (
            <time className="text-[12px] text-muted-foreground">
              {new Date(post.publishedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
          )}
        </header>

        {post.images.length > 0 && (
          <div className="mb-8 rounded-2xl overflow-hidden">
            <PostCarousel images={post.images} alt={title} aspectClass="aspect-[4/3] md:aspect-[16/10]" />
          </div>
        )}

        <div className="prose max-w-none mb-10 text-[15px] md:text-[16px] leading-relaxed text-foreground/90">
          <p className="whitespace-pre-wrap">{post.body}</p>
        </div>

        {linkedMaterials.length > 0 && (
          <section className="mt-10 pt-8 border-t border-border">
            <div className="font-rounded text-[11px] text-primary tracking-[0.1em] mb-2 font-black">— Coloring Pages —</div>
            <h2 className="font-mincho text-[20px] font-black mb-5">この記事の塗り絵</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {linkedMaterials.map(m => (
                <MaterialCard key={m.id} material={m} />
              ))}
            </div>
          </section>
        )}

        <div className="mt-12 pt-6 border-t border-border">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <ChevronLeft className="w-4 h-4" />
            ホームに戻る
          </Link>
        </div>
      </article>
    </>
  )
}
