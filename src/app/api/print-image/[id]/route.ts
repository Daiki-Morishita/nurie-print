import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { getMaterialById } from '@/lib/data'

export const runtime = 'nodejs'

/**
 * 印刷用の高解像度画像を配信する。
 * 元画像（約1536px）を長辺3500px（A4横で約300DPI）に lanczos でアップスケール。
 * 線画なので拡大しても破綻しにくい。immutable キャッシュで CDN に常駐させる。
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

  // SVG は解像度非依存なのでそのままリダイレクト
  if (material.imageUrl.endsWith('.svg')) {
    return NextResponse.redirect(material.imageUrl, {
      headers: { 'Cache-Control': 'public, max-age=86400' },
    })
  }

  try {
    const res = await fetch(material.imageUrl)
    if (!res.ok) throw new Error(`fetch ${res.status}`)
    const input = Buffer.from(await res.arrayBuffer())

    const out = await sharp(input)
      .resize({ width: 3500, height: 3500, fit: 'inside', withoutEnlargement: false, kernel: 'lanczos3' })
      .flatten({ background: '#FFFFFF' })
      .png({ compressionLevel: 9 })
      .toBuffer()

    return new NextResponse(new Uint8Array(out), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    // アップスケール失敗時は元画像へフォールバック
    return NextResponse.redirect(material.imageUrl, {
      headers: { 'Cache-Control': 'public, max-age=86400' },
    })
  }
}
