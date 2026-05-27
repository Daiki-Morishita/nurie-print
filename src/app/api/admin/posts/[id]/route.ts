/**
 * /api/admin/posts/[id]
 *  PATCH  - 投稿の編集（title, body, materialIds, publishedAt）
 *           画像追加は POST /api/admin/posts/[id]/images で
 *  DELETE - 投稿削除（画像も全削除）
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { deletePostImage } from '@/lib/post-storage'
import { getMaterialById } from '@/lib/data'
import { revalidatePath } from 'next/cache'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const body = await request.json()
  const data: Record<string, unknown> = {}

  if (typeof body.title === 'string' || body.title === null) data.title = body.title?.trim() || null
  if (typeof body.body === 'string') {
    if (!body.body.trim()) return NextResponse.json({ error: '本文を空にはできません' }, { status: 400 })
    data.body = body.body
  }
  if (Array.isArray(body.materialIds)) {
    const valid = (body.materialIds as unknown[])
      .filter((x): x is string => typeof x === 'string')
      .map(t => {
        const m = t.match(/\/materials\/([a-z0-9-]+)/i)
        return m ? m[1] : (/^[a-z0-9-]+$/i.test(t) ? t : null)
      })
      .filter((x): x is string => !!x && !!getMaterialById(x))
    data.materialIds = Array.from(new Set(valid))
  }
  if ('publishedAt' in body) {
    if (body.publishedAt === null) {
      data.publishedAt = null
    } else if (typeof body.publishedAt === 'string') {
      const d = new Date(body.publishedAt)
      if (Number.isNaN(d.getTime())) return NextResponse.json({ error: '日時形式が不正' }, { status: 400 })
      data.publishedAt = d
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: '更新項目がありません' }, { status: 400 })
  }

  const post = await prisma.post.update({
    where: { id },
    data,
    include: { images: { orderBy: { order: 'asc' } } },
  })

  revalidatePath('/')
  revalidatePath(`/posts/${id}`)
  return NextResponse.json({ ok: true, post })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const post = await prisma.post.findUnique({
    where: { id },
    include: { images: true },
  })
  if (!post) return NextResponse.json({ error: '該当投稿が見つかりません' }, { status: 404 })

  // 画像ストレージ削除
  await Promise.all(post.images.map(img => deletePostImage(img.url)))
  // DB削除（images は cascade）
  await prisma.post.delete({ where: { id } })

  revalidatePath('/')
  revalidatePath(`/posts/${id}`)
  return NextResponse.json({ ok: true })
}
