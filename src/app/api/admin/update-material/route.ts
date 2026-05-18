import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/db'
import { invalidateOverridesCache } from '@/lib/data-overrides'

type UpdatePayload = {
  id: string
  title?: string
  description?: string
  activityIdeas?: string[]
  imageStatus?: string
  illustNotes?: string
  tags?: string[]
  category?: string
  theme?: string
}

function escapeForTs(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

const FS_WRITE_ALLOWED = process.env.NODE_ENV !== 'production'

export async function PATCH(request: Request) {
  try {
    const body: UpdatePayload = await request.json()
    const { id, ...fields } = body
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    // ── DB overrides (production-safe path) ─────────────────────────────────
    // imageStatus / illustNotes は本番でも変更できるよう DB に保存する
    if (fields.imageStatus !== undefined || fields.illustNotes !== undefined) {
      const existing = await prisma.materialOverride.findUnique({ where: { materialId: id } })
      const next = {
        materialId: id,
        imageStatus: fields.imageStatus !== undefined
          ? (fields.imageStatus || null)
          : (existing?.imageStatus ?? null),
        illustNotes: fields.illustNotes !== undefined
          ? (fields.illustNotes || null)
          : (existing?.illustNotes ?? null),
      }
      // 両方が null になる場合は override 行を削除（静的値に戻す）
      if (next.imageStatus === null && next.illustNotes === null) {
        await prisma.materialOverride.deleteMany({ where: { materialId: id } })
      } else {
        await prisma.materialOverride.upsert({
          where: { materialId: id },
          create: next,
          update: next,
        })
      }
      invalidateOverridesCache()
      // SSG/ISR ページを即座に再生成させる
      try {
        revalidatePath('/')
        revalidatePath('/materials')
        revalidatePath(`/materials/${id}`)
        revalidatePath('/adult')
        revalidatePath('/adult/materials')
        revalidatePath('/favorites')
      } catch {}
    }

    // ── data.ts への書き込みは dev のみ（Vercel は read-only） ──────────────
    if (!FS_WRITE_ALLOWED) {
      // 本番: imageStatus / illustNotes は DB に保存済み。
      // それ以外のフィールド（title 等）は data.ts に書けないため保存されない。
      const nonDbFields = Object.keys(fields).filter(k => k !== 'imageStatus' && k !== 'illustNotes')
      const dbFieldsSaved = fields.imageStatus !== undefined || fields.illustNotes !== undefined
      return NextResponse.json({
        ok: true,
        viaDb: true,
        savedFields: dbFieldsSaved ? ['imageStatus', 'illustNotes'].filter(k => fields[k as 'imageStatus' | 'illustNotes'] !== undefined) : [],
        skippedFields: nonDbFields,
        ...(nonDbFields.length > 0 && {
          notice: `ステータス・メモは保存しました。${nonDbFields.length}件の他フィールド（タイトル等）は本番では保存されません（ローカルで data.ts 編集が必要）。`,
        }),
      })
    }

    // ローカル開発時のみ data.ts も同期更新
    const dataPath = path.join(process.cwd(), 'src', 'lib', 'data.ts')
    let content = fs.readFileSync(dataPath, 'utf8')

    const idPattern = new RegExp(`id: '${id.replace(/[-]/g, '\\-')}'`)
    const idMatch = idPattern.exec(content)
    if (!idMatch) return NextResponse.json({ error: '対象エントリが見つかりません' }, { status: 404 })

    const blockStart = content.lastIndexOf('\n  {', idMatch.index)
    const blockEnd = content.indexOf('\n  },', idMatch.index) + 5
    let block = content.slice(blockStart, blockEnd)

    if ('title' in fields && fields.title !== undefined) {
      block = block.replace(/title: '.*?'/, `title: '${escapeForTs(fields.title)}'`)
    }
    if ('description' in fields && fields.description !== undefined) {
      block = block.replace(/description: '.*?'/, `description: '${escapeForTs(fields.description)}'`)
    }
    if ('imageStatus' in fields && fields.imageStatus !== undefined) {
      block = block.replace(/imageStatus: '.*?'/, `imageStatus: '${fields.imageStatus}'`)
    }
    if ('illustNotes' in fields && fields.illustNotes !== undefined) {
      if (block.includes('illustNotes:')) {
        block = block.replace(/illustNotes: '.*?'/, `illustNotes: '${escapeForTs(fields.illustNotes)}'`)
      } else {
        block = block.replace(/(imageStatus: '.*?',)/, `$1\n    illustNotes: '${escapeForTs(fields.illustNotes)}',`)
      }
    }
    if ('activityIdeas' in fields && fields.activityIdeas !== undefined) {
      const ideas = fields.activityIdeas.filter(s => s.trim()).map(s => `      '${escapeForTs(s)}',`).join('\n')
      block = block.replace(/activityIdeas: \[[\s\S]*?\n    \]/, `activityIdeas: [\n${ideas}\n    ]`)
    }
    if ('category' in fields && fields.category !== undefined) {
      block = block.replace(/category: '.*?'/, `category: '${fields.category}'`)
    }
    if ('theme' in fields && fields.theme !== undefined) {
      if (block.match(/theme: '.*?'/)) {
        block = block.replace(/theme: '.*?'/, `theme: '${fields.theme}'`)
      } else {
        block = block.replace(/(category: '.*?',)/, `$1 theme: '${fields.theme}',`)
      }
    }
    if ('tags' in fields && fields.tags !== undefined) {
      const tags = fields.tags.filter(s => s.trim()).map(s => `'${escapeForTs(s)}'`).join(', ')
      block = block.replace(/tags: \[[\s\S]*?\]/, `tags: [${tags}]`)
    }

    content = content.slice(0, blockStart) + block + content.slice(blockEnd)
    fs.writeFileSync(dataPath, content, 'utf8')

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
