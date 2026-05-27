/**
 * /api/admin/append-material
 * data.ts の materials 配列末尾にスニペットを自動追記する
 */
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied
  try {
    const { snippet } = await request.json()
    if (!snippet) return NextResponse.json({ error: 'snippet is required' }, { status: 400 })

    const dataPath = path.join(process.cwd(), 'src', 'lib', 'data.ts')
    const content  = fs.readFileSync(dataPath, 'utf8')

    // 重複IDチェック：同じIDがすでに存在する場合は追記しない
    const idMatch = snippet.match(/id:\s*'([^']+)'/)
    if (idMatch) {
      const id = idMatch[1]
      if (content.includes(`id: '${id}'`)) {
        return NextResponse.json({ error: `ID「${id}」はすでに登録済みです` }, { status: 409 })
      }
    }

    // materials 配列の閉じ括弧 `]` の直前に挿入
    const insertTarget = '\n]\n'
    const idx = content.lastIndexOf(insertTarget)
    if (idx === -1) return NextResponse.json({ error: 'data.ts の挿入位置が見つかりません' }, { status: 500 })

    const updated = content.slice(0, idx) + '\n' + snippet + content.slice(idx)
    fs.writeFileSync(dataPath, updated, 'utf8')

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
