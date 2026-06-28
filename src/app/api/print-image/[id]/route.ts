import { NextResponse } from 'next/server'
import { getMaterialById } from '@/lib/data'
import hiresIds from '@/lib/print-hires-ids.json'

export const runtime = 'nodejs'

const HIRES_IDS = new Set(hiresIds as string[])
const HIRES_BASE =
  'https://hdhogsjmdowevijxooiq.supabase.co/storage/v1/object/public/print-hires'

/**
 * 印刷用画像の配信。
 * 事前生成済み(featured∪indexReady)は print-hires バケットの3500px版へ、
 * それ以外は元画像へリダイレクトするだけにする。
 * sharp の都度生成を廃止し、画像バイトは Supabase 側で配信することで
 * Vercel の Origin Transfer / 関数実行をほぼゼロにする。
 * 事前生成は scripts/pregenerate_print_images.py が print-hires-ids.json を更新する。
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const material = getMaterialById(id)

  if (!material?.imageUrl) {
    return new NextResponse('Not found', { status: 404 })
  }

  // 事前生成済み 3500px 版（恒久・immutable）
  if (HIRES_IDS.has(id) && !material.imageUrl.endsWith('.svg')) {
    return NextResponse.redirect(`${HIRES_BASE}/${id}-print.png`, {
      status: 308,
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    })
  }

  // 未生成・SVG は元画像へフォールバック（元画像でも印刷は可能）
  return NextResponse.redirect(material.imageUrl, {
    status: 307,
    headers: { 'Cache-Control': 'public, max-age=86400' },
  })
}
