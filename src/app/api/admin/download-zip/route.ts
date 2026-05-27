import { NextResponse } from 'next/server'
import JSZip from 'jszip'
import { getMaterialById } from '@/lib/data'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied
  try {
    const { ids } = await request.json() as { ids: string[] }
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids required' }, { status: 400 })
    }

    const zip = new JSZip()
    let added = 0

    for (const id of ids) {
      const m = getMaterialById(id)
      if (!m?.illustUrl) continue
      try {
        const res = await fetch(m.illustUrl)
        if (!res.ok) continue
        const buf = Buffer.from(await res.arrayBuffer())
        const ext = m.illustUrl.endsWith('.svg') ? 'svg' : 'png'
        zip.file(`${id}.${ext}`, buf)
        added++
      } catch {
        // skip
      }
    }

    if (added === 0) {
      return NextResponse.json({ error: 'no files' }, { status: 404 })
    }

    const blob = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
    const filename = `nurie-print-materials-${new Date().toISOString().slice(0,10)}.zip`

    return new NextResponse(blob as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(blob.length),
      },
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'error' },
      { status: 500 }
    )
  }
}
