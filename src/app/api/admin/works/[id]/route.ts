/**
 * /api/admin/works/[id]
 *  PATCH  — 編集（published, comment, childAge など）
 *  DELETE — 削除（DB行 + Supabase写真）
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { deleteGalleryPhoto } from '@/lib/gallery-storage'
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
  if (typeof body.comment === 'string') data.comment = body.comment.trim()
  if (typeof body.childAge === 'string') data.childAge = body.childAge.trim()
  if (typeof body.duration === 'number') data.duration = body.duration
  if (typeof body.tools === 'string') data.tools = body.tools.trim() || null
  if (typeof body.published === 'boolean') data.published = body.published

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: '更新項目がありません' }, { status: 400 })
  }

  const work = await prisma.galleryWork.update({ where: { id }, data })
  revalidatePath(`/materials/${work.materialId}`)
  return NextResponse.json({ ok: true, work })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const work = await prisma.galleryWork.findUnique({ where: { id } })
  if (!work) return NextResponse.json({ error: '該当作品が見つかりません' }, { status: 404 })

  await deleteGalleryPhoto(work.photoUrl)
  await prisma.galleryWork.delete({ where: { id } })

  revalidatePath(`/materials/${work.materialId}`)
  return NextResponse.json({ ok: true })
}
