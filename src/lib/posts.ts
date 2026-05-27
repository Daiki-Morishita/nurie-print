import { prisma } from '@/lib/db'

export type PostWithImages = {
  id: string
  title: string | null
  body: string
  publishedAt: Date | null
  materialIds: string[]
  images: { id: string; url: string; order: number }[]
  createdAt: Date
  updatedAt: Date
}

export type PostStatus = 'draft' | 'scheduled' | 'published'

export function getPostStatus(publishedAt: Date | null): PostStatus {
  if (!publishedAt) return 'draft'
  if (publishedAt.getTime() > Date.now()) return 'scheduled'
  return 'published'
}

/** 公開済み（now以前にpublishedAt）の投稿を取得。トップページ用。 */
export async function getPublishedPosts(limit = 1): Promise<PostWithImages[]> {
  const rows = await prisma.post.findMany({
    where: {
      publishedAt: { not: null, lte: new Date() },
    },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    include: { images: { orderBy: { order: 'asc' } } },
  })
  return rows
}

/** 公開済み投稿を1件、IDで取得 */
export async function getPublishedPostById(id: string): Promise<PostWithImages | null> {
  const row = await prisma.post.findUnique({
    where: { id },
    include: { images: { orderBy: { order: 'asc' } } },
  })
  if (!row) return null
  if (!row.publishedAt || row.publishedAt.getTime() > Date.now()) return null
  return row
}

/** 公開済みID列挙（generateStaticParams 用） */
export async function getAllPublishedPostIds(): Promise<string[]> {
  const rows = await prisma.post.findMany({
    where: { publishedAt: { not: null, lte: new Date() } },
    select: { id: true },
  })
  return rows.map(r => r.id)
}

/** 管理画面用: 全投稿（下書き含む） */
export async function listAllPostsForAdmin(limit = 200): Promise<PostWithImages[]> {
  return prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { images: { orderBy: { order: 'asc' } } },
  })
}

/** タイトル抽出（タイトル未指定なら本文先頭から） */
export function deriveTitle(post: { title: string | null; body: string }): string {
  if (post.title?.trim()) return post.title
  const firstLine = post.body.split('\n').find(line => line.trim().length > 0) ?? ''
  return firstLine.slice(0, 40) || '無題の投稿'
}
