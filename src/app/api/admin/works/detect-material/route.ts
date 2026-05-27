/**
 * /api/admin/works/detect-material
 *
 * 子のぬりえ写真を Claude Vision で解析し、対応する素材IDを推定する。
 * 線画の右下にタイトルが書かれていることが多いのでそれを優先、無ければ絵柄から推定。
 *
 * POST multipart/form-data
 *   photo: File
 *
 * Response: { materialId: string|null, confidence: 'high'|'medium'|'low', reasoning?: string }
 */
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { requireAdmin } from '@/lib/admin-auth'
import { materials } from '@/lib/data'

function getApiKey(): string | undefined {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const content = fs.readFileSync(envPath, 'utf8')
    const match = content.match(/^ANTHROPIC_API_KEY=(.+)$/m)
    return match?.[1]?.trim()
  } catch {
    return undefined
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  const apiKey = getApiKey()
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY が未設定です' }, { status: 500 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('photo')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'photo がありません' }, { status: 400 })
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '画像ファイルを選択してください' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    // Claude Vision 向けに 1024px に縮小（コスト・速度最適化）
    const small = await sharp(buffer)
      .rotate()
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer()

    const featured = materials.filter(m => m.featured).map(m => ({ id: m.id, title: m.title }))
    if (featured.length === 0) {
      return NextResponse.json({ error: 'featured 素材がありません' }, { status: 500 })
    }

    const candidateList = featured.map(f => `- ${f.id}: ${f.title}`).join('\n')

    const client = new Anthropic({ apiKey })
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: small.toString('base64') },
          },
          {
            type: 'text',
            text: `この写真は子どもがぬりえを完成させたものです。元の線画には右下などにタイトル（日本語）が小さく書かれていることが多いです。

以下の候補リストから、この写真のぬりえに対応するものを1件だけ選び、materialId を返してください。
判定基準:
1. 線画にタイトル文字が見えればそれを最優先（"くまさん" のような短い語でも可）
2. 文字が読めなければイラスト（主役・場面・小道具）から判断
3. どれにも該当しないと思えば materialId は null

候補リスト（${featured.length}件）:
${candidateList}

回答はJSONのみ（コードブロック不要）:
{"materialId": "<id or null>", "confidence": "high|medium|low", "reasoning": "<根拠を1文で>"}`,
          },
        ],
      }],
    })

    const text = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim()
    let parsed: { materialId: string | null; confidence?: string; reasoning?: string }
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: '解析結果のパース失敗', raw: text }, { status: 500 })
    }

    // 念のため、返ってきたIDが本当に featured に含まれるか検証
    if (parsed.materialId && !featured.find(f => f.id === parsed.materialId)) {
      parsed = { ...parsed, materialId: null, reasoning: `不正なID返答: ${parsed.materialId}` }
    }

    return NextResponse.json(parsed)
  } catch (err) {
    const message = err instanceof Error ? err.message : '判定に失敗しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
