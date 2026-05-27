/**
 * /api/admin/works
 *  GET  — 作品一覧（最新100件）
 *  POST — multipart/form-data で写真+メタを受け取り、Supabaseに保存
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { uploadGalleryPhoto } from '@/lib/gallery-storage'
import { getMaterialById } from '@/lib/data'
import { revalidatePath } from 'next/cache'

const MAX_PHOTO_BYTES = 15 * 1024 * 1024 // 15MB (スマホ写真の上限ライン)

export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied

  const works = await prisma.galleryWork.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  return NextResponse.json({ works })
}

export async function POST(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const form = await request.formData()
    const photo = form.get('photo') as File | null
    const materialId = (form.get('materialId') as string | null)?.trim()
    const childAge = (form.get('childAge') as string | null)?.trim()
    const comment = (form.get('comment') as string | null)?.trim()
    const durationRaw = form.get('duration') as string | null
    const tools = (form.get('tools') as string | null)?.trim() || null

    if (!photo || !materialId || !childAge || !comment) {
      return NextResponse.json(
        { error: '必須項目が不足しています（photo, materialId, childAge, comment）' },
        { status: 400 },
      )
    }

    // material 実在チェック（typo検知）
    if (!getMaterialById(materialId)) {
      return NextResponse.json(
        { error: `素材ID「${materialId}」は存在しません` },
        { status: 400 },
      )
    }

    // 画像MIMEチェック
    if (!photo.type.startsWith('image/')) {
      return NextResponse.json(
        { error: `画像ファイルを選択してください (現在: ${photo.type || '不明'})` },
        { status: 400 },
      )
    }
    if (photo.size > MAX_PHOTO_BYTES) {
      return NextResponse.json(
        { error: `写真サイズが大きすぎます (上限 ${MAX_PHOTO_BYTES / 1024 / 1024}MB)` },
        { status: 400 },
      )
    }

    const duration = durationRaw ? Number(durationRaw) : null
    if (duration !== null && (!Number.isFinite(duration) || duration < 0)) {
      return NextResponse.json({ error: 'duration は正の数値で入力してください' }, { status: 400 })
    }

    const buf = Buffer.from(await photo.arrayBuffer())
    const photoUrl = await uploadGalleryPhoto(buf)

    const work = await prisma.galleryWork.create({
      data: {
        materialId,
        photoUrl,
        childAge,
        comment,
        duration,
        tools,
      },
    })

    // 該当素材ページの ISR キャッシュを破棄
    revalidatePath(`/materials/${materialId}`)

    return NextResponse.json({ ok: true, work })
  } catch (err) {
    const message = err instanceof Error ? err.message : '保存に失敗しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
