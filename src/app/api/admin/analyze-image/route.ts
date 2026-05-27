/**
 * /api/admin/analyze-image
 *
 * アップロードされた教材イラストを Claude Vision で解析し、
 * data.ts に追記するための構造化メタデータを返す。
 *
 * POST multipart/form-data
 *   image: File  — jpg/png/webp
 *
 * Response: { meta: SuggestedMeta, snippet: string, savedPath: string }
 */
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { requireAdmin } from '@/lib/admin-auth'

// Next.js 16 + Turbopack での env 読み込み不具合の回避策
function getApiKey(): string | undefined {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const content = fs.readFileSync(envPath, 'utf8')
    const match   = content.match(/^ANTHROPIC_API_KEY=(.+)$/m)
    return match?.[1]?.trim()
  } catch {
    return undefined
  }
}

// ── 型定義 ──────────────────────────────────────────────────────────────────

export type SuggestedMeta = {
  id: string
  title: string
  description: string
  category: string
  theme?: string
  ageMin: number
  ageMax: number
  difficulty: 1 | 2 | 3
  duration: 5 | 10 | 15 | 20 | 30
  tags: string[]
  season?: string
  event?: string
  tools: string[]
  activityIdeas: string[]
}

// ── プロンプト ───────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `あなたは保育園・幼稚園向けの教材コンテンツ管理システムです。
アップロードされた子ども向け教材イラストを分析して、
data.ts ファイルに追加するための構造化メタデータを JSON で返してください。

必ず以下のスキーマに厳密に従うこと（余分なキーは追加しない）:
{
  "id": "kebab-case の英語ID（例: cat-coloring）",
  "title": "日本語のタイトル。絵に描かれているポーズ・場所・一緒に描かれているもの（食べ物・小道具・背景要素など）を盛り込んだ、この絵だけを表す個性的な短いフレーズ。（例: 「はちみつをなめるくまさん」「ブランコにのるこぶたたち」「おひさまとちょうちょとうさぎ」）",
  "description": "日本語の説明文（80字以内）",
  "category": "coloring | hiragana | numbers | drawing | maze | dotconnect | craft | scissors",
  "theme": "animals | dinosaurs | vehicles | trains | food | sea | insects | flowers | characters  // 該当しない場合は省略",
  "ageMin": 2〜6の整数,
  "ageMax": 2〜6の整数,
  "difficulty": 1（やさしい）| 2（ふつう）| 3（むずかしい）,
  "duration": 5 | 10 | 15 | 20 | 30  // 分,
  "tags": ["日本語タグ", ...],
  "season": "spring | summer | autumn | winter  // 季節性がない場合は省略",
  "event": "tanabata | setsubun | summerfestival | halloween | christmas | hinamatsuri | sports | graduation | mothers | fathers  // 行事に関係ない場合は省略",
  "tools": ["クレヨン", ...],
  "activityIdeas": ["活動アイデア（日本語）", ...]  // 2〜4個
}

重要ルール:
- title は「〇〇のぬりえ」という形式を絶対に使わない。絵に描かれているポーズ・場所・小道具・登場する要素を具体的に含んだ、その絵だけを表すユニークな短いフレーズにする
- category は画像の用途から判断（ぬりえ線画→coloring, 迷路→maze, ひらがなの練習→hiragana 等）
- ageMin/ageMax は線の複雑さ・難易度から推定
- tools は最低限必要な道具を列挙（ぬりえなら「クレヨン」「色鉛筆」等）
- activityIdeas は保育士がすぐ使える具体的なアイデア
- JSON のみを返す（コードブロックも不要、説明文も不要）`

// ── ルートハンドラ ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied
  try {
    const formData = await request.formData()
    const file = formData.get('image')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    // ── ファイルを public/materials/ に保存 ────────────────────────────────
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      return NextResponse.json({ error: 'Unsupported file type. Use JPG, PNG, or WebP.' }, { status: 400 })
    }

    const bytes   = await file.arrayBuffer()
    const buffer  = Buffer.from(bytes)

    // intendedId が指定されていて既に同名ファイルが存在する場合は即エラー
    const earlyIntendedId = formData.get('intendedId')
    if (typeof earlyIntendedId === 'string' && earlyIntendedId.trim()) {
      const finalExt0  = ext === 'jpeg' ? 'jpg' : ext
      const checkPath  = path.join(process.cwd(), 'public', 'materials', `${earlyIntendedId.trim()}-illust.${finalExt0}`)
      if (fs.existsSync(checkPath)) {
        return NextResponse.json(
          { error: `ID「${earlyIntendedId.trim()}」は既に登録済みです。削除してから再アップロードしてください。` },
          { status: 409 }
        )
      }
    }

    // タイムスタンプベースの一時ファイル名（後でIDが確定したら rename できる）
    const timestamp = Date.now()
    const savedName = `upload-${timestamp}.${ext === 'jpeg' ? 'jpg' : ext}`
    const savedPath = `/materials/${savedName}`
    const absPath   = path.join(process.cwd(), 'public', savedPath)

    fs.mkdirSync(path.dirname(absPath), { recursive: true })
    fs.writeFileSync(absPath, buffer)

    // ── Claude Vision で解析 ──────────────────────────────────────────────
    const apiKey = getApiKey()
    if (!apiKey) {
      // temp ファイルを削除してからエラーを返す
      fs.unlinkSync(absPath)
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY が設定されていません' }, { status: 500 })
    }
    const client = new Anthropic({ apiKey })

    const base64Data = buffer.toString('base64')
    const mediaType  = ext === 'png' ? 'image/png'
                     : ext === 'webp' ? 'image/webp'
                     : 'image/jpeg'

    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: 'この教材画像を分析して、メタデータを JSON で返してください。',
            },
          ],
        },
      ],
    })

    // ── レスポンス解析 ────────────────────────────────────────────────────
    const rawText = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')
      .trim()

    let meta: SuggestedMeta
    try {
      meta = JSON.parse(rawText)
    } catch {
      // JSON が取り出せない場合はテキストごと返してデバッグ
      return NextResponse.json({ error: 'Failed to parse Claude response', raw: rawText }, { status: 500 })
    }

    // ── 解析後に正式なファイル名へリネーム ────────────────────────────────
    const intendedId    = formData.get('intendedId')
    const finalExt      = ext === 'jpeg' ? 'jpg' : ext
    // intendedId が指定されていればそれを優先、なければ Claude Vision の提案を使う
    const baseId        = (typeof intendedId === 'string' && intendedId.trim())
      ? intendedId.trim()
      : meta.id
    meta.id             = baseId
    const finalFilename = `${baseId}-illust.${finalExt}`
    const finalAbsPath  = path.join(process.cwd(), 'public', 'materials', finalFilename)
    const finalPath     = `/materials/${finalFilename}`

    // 同名ファイルが既にある場合は上書きしない（-v2, -v3 とする）
    let resolvedAbsPath = finalAbsPath
    let resolvedPath    = finalPath
    if (fs.existsSync(finalAbsPath) && finalAbsPath !== absPath) {
      let v = 2
      while (fs.existsSync(path.join(process.cwd(), 'public', 'materials', `${meta.id}-illust-v${v}.${finalExt}`))) v++
      const vFilename   = `${meta.id}-illust-v${v}.${finalExt}`
      resolvedAbsPath   = path.join(process.cwd(), 'public', 'materials', vFilename)
      resolvedPath      = `/materials/${vFilename}`
    }
    fs.renameSync(absPath, resolvedAbsPath)

    // ── data.ts スニペット生成 ────────────────────────────────────────────
    const snippet = generateSnippet(meta, resolvedPath)

    return NextResponse.json({ meta, snippet, savedPath: resolvedPath })
  } catch (err) {
    console.error('[analyze-image]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// ── data.ts スニペット生成ヘルパー ───────────────────────────────────────────

function generateSnippet(meta: SuggestedMeta, illustUrl: string): string {
  const lines: (string | null)[] = [
    `  {`,
    `    id: '${meta.id}',`,
    `    title: '${meta.title}',`,
    `    description: '${meta.description}',`,
    `    ageMin: ${meta.ageMin},`,
    `    ageMax: ${meta.ageMax},`,
    `    difficulty: ${meta.difficulty},`,
    `    duration: ${meta.duration},`,
    `    category: '${meta.category}',`,
    meta.theme   ? `    theme: '${meta.theme}',`   : null,
    `    tags: [${meta.tags.map(t => `'${t}'`).join(', ')}],`,
    meta.season  ? `    season: '${meta.season}',`  : null,
    meta.event   ? `    event: '${meta.event}',`    : null,
    `    tools: [${meta.tools.map(t => `'${t}'`).join(', ')}],`,
    `    activityIdeas: [`,
    ...meta.activityIdeas.map(a => `      '${a}',`),
    `    ],`,
    `    imageUrl: '${illustUrl}',`,
    `    illustUrl: '${illustUrl}',`,
    `    illustVersion: 1,`,
    `    imageStatus: 'pending_review',`,
    `    pdfUrl: '',`,
    `    createdAt: '${new Date().toISOString().split('T')[0]}',`,
    `    popular: false,`,
    `  },`,
  ]
  return lines.filter((l): l is string => l !== null).join('\n')
}
