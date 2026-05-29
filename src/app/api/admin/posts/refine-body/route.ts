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

const SYSTEM = `あなたは育児・ぬりえブログの編集者です。投稿者（保護者）が書いた素朴な本文を、
読みやすく、情景が目に浮かぶ温かい文章に仕上げ直します。リライト（書き直し）を含みます。

やること（積極的に）:
- 誤字脱字・不自然な助詞・敬体/常体の揺れを直す
- 一文が長い箇所は区切り、段落の間に空行を入れて読みやすくする
- 語彙・言い回しをより自然で表現豊かにする（平凡な動詞・形容を生き生きした表現に）
- すでに書かれている情景を、より具体的・感情的に描写し直す
  例:「楽しそうだった」→「夢中で手を動かし、ときどき顔を上げてにっこり笑った」
  （ただし下記の通り、書かれた事実の範囲を超えないこと）
- 子どもの様子・手の動き・色・表情など、原文にある要素の描写を膨らませる
- 読者（同じ立場の親）が共感できる、やわらかい結びを意識する

絶対に守る一線（事実の捏造禁止）:
- 原文に書かれていない出来事・発言・事実を創作しない
  （例: 原文にない「妹が」「公園で」「2回目の挑戦」等を足さない）
- 原文にない固有名詞・年齢・日付・場所を足さない
- 原文にない具体物を足さない。特に色・道具・登場人物・数を勝手に作らない
  （例: 原文が「ぬった」だけなら「赤・青・黄色で」のような色名を足さない。
   原文が「クレヨンで」とだけあれば色までは創作しない）
- 推測で心情を断定しすぎない。原文の事実から自然に汲める範囲にとどめる
- 子どもの名前・顔・地域が特定される表現は足さない

膨らませ方の原則:
- 「描写を豊かに」とは、原文にある要素の見せ方を変えること。新しい具体物の追加ではない
- 原文が短く具体に乏しいときは、無理に具体を作らず、動きや雰囲気の表現で自然に厚みを出す
  （「楽しかった」→「夢中になって手を動かしていた」はOK。色や物の追加はNG）

トーン:
- 投稿者本人が書いた温かみ・親しみは保つ。よそよそしい広告文にしない
- 過度な絵文字・記号の乱用はしない（あっても1〜2個まで）
- 「最高」「絶対」「感動」等の安い誇張で煽らない
- 全体の長さは元の0.8〜1.5倍程度（描写を膨らませる分やや長くなってよい）

出力:
- 仕上げた本文だけを返す。前置き・説明・「整形しました」等は一切書かない`

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
      max_tokens: 2500,
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
