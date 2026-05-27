/**
 * /api/admin/posts
 *  GET  - 投稿一覧（全件・管理用）
 *  POST - 新規投稿作成（multipart/form-data）
 *    field photos: File[]          — 1〜N枚
 *    field title?: string
 *    field body: string
 *    field materialIds?: string    — カンマ区切りまたは改行区切りのIDリスト
 *    field publishedAt?: string    — ISO日時。空=下書き、未来=予約、過去/now=即時公開
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { uploadPostImage } from '@/lib/post-storage'
import { getMaterialById } from '@/lib/data'
import { revalidatePath } from 'next/cache'

const MAX_PHOTO_BYTES = 15 * 1024 * 1024

export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { images: { orderBy: { order: 'asc' } } },
  })
  return NextResponse.json({ posts })
}

export async function POST(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const form = await request.formData()
    const photoEntries = form.getAll('photos').filter((v): v is File => v instanceof File)
    const title = (form.get('title') as string | null)?.trim() || null
    const body = (form.get('body') as string | null)?.trim() ?? ''
    const materialIdsRaw = (form.get('materialIds') as string | null) ?? ''
    const publishedAtRaw = (form.get('publishedAt') as string | null)?.trim() ?? ''

    if (!body) {
      return NextResponse.json({ error: '本文が空です' }, { status: 400 })
    }

    // materialIds: カンマ・改行・空白で区切り、URL含めて解決
    const rawTokens = materialIdsRaw
      .split(/[\s,]+/)
      .map(t => t.trim())
      .filter(Boolean)
    const resolvedIds: string[] = []
    for (const t of rawTokens) {
      const m = t.match(/\/materials\/([a-z0-9-]+)/i)
      const id = m ? m[1] : (/^[a-z0-9-]+$/i.test(t) ? t : null)
      if (!id) continue
      if (!getMaterialById(id)) continue
      if (!resolvedIds.includes(id)) resolvedIds.push(id)
    }

    // publishedAt: null=下書き
    let publishedAt: Date | null = null
    if (publishedAtRaw) {
      const d = new Date(publishedAtRaw)
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: 'publishedAt の形式が不正です' }, { status: 400 })
      }
      publishedAt = d
    }

    // 画像アップロード
    const imageUrls: string[] = []
    for (const photo of photoEntries) {
      if (!photo.type.startsWith('image/')) {
        return NextResponse.json({ error: `画像形式が不正: ${photo.type}` }, { status: 400 })
      }
      if (photo.size > MAX_PHOTO_BYTES) {
        return NextResponse.json({ error: `画像が大きすぎます (上限 ${MAX_PHOTO_BYTES / 1024 / 1024}MB)` }, { status: 400 })
      }
      const buf = Buffer.from(await photo.arrayBuffer())
      const url = await uploadPostImage(buf)
      imageUrls.push(url)
    }

    const post = await prisma.post.create({
      data: {
        title,
        body,
        publishedAt,
        materialIds: resolvedIds,
        images: {
          create: imageUrls.map((url, i) => ({ url, order: i })),
        },
      },
      include: { images: { orderBy: { order: 'asc' } } },
    })

    revalidatePath('/')
    if (publishedAt && publishedAt.getTime() <= Date.now()) {
      revalidatePath(`/posts/${post.id}`)
    }

    return NextResponse.json({ ok: true, post })
  } catch (err) {
    const message = err instanceof Error ? err.message : '保存に失敗しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
