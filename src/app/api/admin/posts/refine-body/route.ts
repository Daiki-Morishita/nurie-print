/**
 * /api/admin/posts/refine-body
 * 投稿本文を Claude で読みやすく・SEOを意識して整形する。
 * 事実の追加・脚色はせず、誤字脱字修正・改行調整・冗長表現の圧縮のみ。
 *
 * POST { body: string, title?: string }
 * Response: { refined: string }
 */
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { requireAdmin } from '@/lib/admin-auth'

function getApiKey(): string | undefined {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const content = fs.readFileSync(envPath, 'utf8')
    const match = content.match(/^ANTHROPIC_API_KEY=(.+)$/m)
    return match?.[1]?.trim().replace(/^["']|["']$/g, '')
  } catch {
    return undefined
  }
}

const SYSTEM = `あなたは育児・ぬりえブログの編集者です。投稿者が書いた本文を、読みやすく自然な日本語に整えます。

厳守:
- 事実・エピソードを新しく追加しない。書かれていないことを創作しない
- 誤字脱字・不自然な助詞を直す
- 一文が長すぎる箇所は自然に区切る。段落の間に空行を入れて読みやすくする
- 冗長な言い回しは簡潔に。ただし投稿者の素朴な語り口・温かみは残す
- 絵文字の乱用や過度な装飾はしない
- 宣伝くさい誇張（「最高」「絶対」等）は足さない
- 全体の長さは元の0.8〜1.2倍程度
- 結果の本文だけを返す。前置き・説明・「整形しました」等は一切書かない`

export async function POST(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  const apiKey = getApiKey()
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY 未設定' }, { status: 500 })

  try {
    const { body, title } = await request.json()
    if (typeof body !== 'string' || !body.trim()) {
      return NextResponse.json({ error: '本文が空です' }, { status: 400 })
    }
    if (body.length > 4000) {
      return NextResponse.json({ error: '本文が長すぎます（4000字以内）' }, { status: 400 })
    }

    const client = new Anthropic({ apiKey })
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: `${title ? `タイトル: ${title}\n\n` : ''}本文:\n${body}`,
      }],
    })
    const refined = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : ''
    if (!refined) return NextResponse.json({ error: '整形結果が空でした' }, { status: 500 })
    return NextResponse.json({ refined })
  } catch (err) {
    const message = err instanceof Error ? err.message : '整形に失敗しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
