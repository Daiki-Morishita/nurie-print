/**
 * /api/admin/delete-material
 * data.ts からエントリを削除し、画像ファイルも削除する
 */
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { requireAdmin } from '@/lib/admin-auth'

export async function DELETE(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied
  try {
    const { illustUrl } = await request.json()
    if (!illustUrl) return NextResponse.json({ error: 'illustUrl is required' }, { status: 400 })

    const dataPath = path.join(process.cwd(), 'src', 'lib', 'data.ts')
    const content  = fs.readFileSync(dataPath, 'utf8')

    // illustUrl に一致するブロック（{ ... },）を正規表現で削除
    const escaped = illustUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(
      /\n  \{[^{}]*/.source + escaped + /[^{}]*\},/.source,
      's'
    )
    const updated = content.replace(pattern, '')
    if (updated === content) {
      return NextResponse.json({ error: '対象エントリが見つかりません' }, { status: 404 })
    }
    fs.writeFileSync(dataPath, updated, 'utf8')

    // 画像ファイルも削除
    const absPath = path.join(process.cwd(), 'public', illustUrl)
    if (fs.existsSync(absPath)) fs.unlinkSync(absPath)

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
