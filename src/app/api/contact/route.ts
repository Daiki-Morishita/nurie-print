import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const ALLOWED_CATEGORIES = ['request', 'bug', 'copyright', 'other'] as const
const MAX_BODY = 5000
const MAX_SUBJECT = 200
const MAX_NAME = 100

// ざっくりレート制限（同一IPから5分以内に5回まで）
type RateRecord = { count: number; firstAt: number }
const RATE: Map<string, RateRecord> = new Map()
const RATE_WINDOW_MS = 5 * 60 * 1000
const RATE_MAX = 5

function rateOk(ip: string): boolean {
  const now = Date.now()
  const r = RATE.get(ip)
  if (!r || now - r.firstAt > RATE_WINDOW_MS) {
    RATE.set(ip, { count: 1, firstAt: now })
    return true
  }
  if (r.count >= RATE_MAX) return false
  r.count += 1
  return true
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, category, subject, message, website } = body ?? {}

    // ハニーポット（隠しフィールド）：人間は埋めない、bot は埋めがち
    if (typeof website === 'string' && website.trim().length > 0) {
      // bot とみなして成功扱いで返す（ログには残さない）
      return NextResponse.json({ ok: true })
    }

    // バリデーション
    if (typeof email !== 'string' || !isEmail(email)) {
      return NextResponse.json({ error: 'メールアドレスの形式が正しくありません' }, { status: 400 })
    }
    if (typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json({ error: 'お問い合わせ内容は10文字以上入力してください' }, { status: 400 })
    }
    if (message.length > MAX_BODY) {
      return NextResponse.json({ error: `お問い合わせ内容は${MAX_BODY}文字以内でお願いします` }, { status: 400 })
    }
    if (typeof category !== 'string' || !(ALLOWED_CATEGORIES as readonly string[]).includes(category)) {
      return NextResponse.json({ error: 'カテゴリが不正です' }, { status: 400 })
    }
    if (subject && (typeof subject !== 'string' || subject.length > MAX_SUBJECT)) {
      return NextResponse.json({ error: '件名が長すぎます' }, { status: 400 })
    }
    if (name && (typeof name !== 'string' || name.length > MAX_NAME)) {
      return NextResponse.json({ error: 'お名前が長すぎます' }, { status: 400 })
    }

    // レート制限
    const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || 'unknown'
    if (!rateOk(ip)) {
      return NextResponse.json({ error: '送信回数が多すぎます。少し時間を置いて再度お試しください' }, { status: 429 })
    }

    await prisma.contactMessage.create({
      data: {
        name: name?.trim() || null,
        email: email.trim(),
        category,
        subject: subject?.trim() || null,
        body: message.trim(),
        ip: ip.slice(0, 64),
        userAgent: request.headers.get('user-agent')?.slice(0, 500) ?? null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('contact submit error', e)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
