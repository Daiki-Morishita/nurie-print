/**
 * /api/admin/posts/[id]/images
 *  POST   - 既存投稿に画像を追加（multipart photos: File[]）
 *  PUT    - 既存画像のファイル差し替え（multipart imageId + photo。id・順序は維持）
 *  DELETE - クエリ ?imageId=xxx で特定画像を削除
 *  PATCH  - 画像順序の入れ替え（body.order: { imageId: order }）
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { uploadPostImage, deletePostImage } from '@/lib/post-storage'
import { revalidatePath } from 'next/cache'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const form = await request.formData()
  const imageId = form.get('imageId') as string | null
  const photo = form.get('photo')
  if (!imageId || !(photo instanceof File)) {
    return NextResponse.json({ error: 'imageId と photo が必要' }, { status: 400 })
  }

  const existing = await prisma.postImage.findFirst({ where: { id: imageId, postId: id } })
  if (!existing) return NextResponse.json({ error: '画像が見つかりません' }, { status: 404 })

  const buf = Buffer.from(await photo.arrayBuffer())
  const newUrl = await uploadPostImage(buf)
  const updated = await prisma.postImage.update({ where: { id: imageId }, data: { url: newUrl } })
  // 旧ファイルを削除（順序・idは維持）
  await deletePostImage(existing.url)

  revalidatePath('/')
  revalidatePath(`/posts/${id}`)
  return NextResponse.json({ ok: true, image: { id: updated.id, url: updated.url, order: updated.order } })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const form = await request.formData()
  const photos = form.getAll('photos').filter((v): v is File => v instanceof File)
  if (photos.length === 0) return NextResponse.json({ error: 'photos がありません' }, { status: 400 })

  const post = await prisma.post.findUnique({ where: { id }, include: { images: true } })
  if (!post) return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })

  const maxOrder = post.images.reduce((m, i) => Math.max(m, i.order), -1)
  const created: { id: string; url: string; order: number }[] = []
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    if (!photo.type.startsWith('image/')) continue
    const buf = Buffer.from(await photo.arrayBuffer())
    const url = await uploadPostImage(buf)
    const img = await prisma.postImage.create({
      data: { postId: id, url, order: maxOrder + 1 + i },
    })
    created.push({ id: img.id, url: img.url, order: img.order })
  }

  revalidatePath('/')
  revalidatePath(`/posts/${id}`)
  return NextResponse.json({ ok: true, images: created })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const url = new URL(request.url)
  const imageId = url.searchParams.get('imageId')
  if (!imageId) return NextResponse.json({ error: 'imageId が必要' }, { status: 400 })

  const img = await prisma.postImage.findFirst({ where: { id: imageId, postId: id } })
  if (!img) return NextResponse.json({ error: '画像が見つかりません' }, { status: 404 })

  await deletePostImage(img.url)
  await prisma.postImage.delete({ where: { id: imageId } })

  revalidatePath('/')
  revalidatePath(`/posts/${id}`)
  return NextResponse.json({ ok: true })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const body = await request.json()
  const orderMap = body.order as Record<string, number> | undefined
  if (!orderMap) return NextResponse.json({ error: 'order が必要' }, { status: 400 })

  await Promise.all(
    Object.entries(orderMap).map(([imageId, order]) =>
      prisma.postImage.updateMany({
        where: { id: imageId, postId: id },
        data: { order },
      }),
    ),
  )

  revalidatePath('/')
  revalidatePath(`/posts/${id}`)
  return NextResponse.json({ ok: true })
}
