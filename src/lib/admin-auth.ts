import { auth } from '@/auth'
import { NextResponse } from 'next/server'

/**
 * 管理者メールアドレスのallowlist。
 * 環境変数 ADMIN_EMAILS にカンマ区切りで設定（例: "a@example.com,b@example.com"）。
 * 未設定の場合、すべての admin アクセスを拒否（fail-closed）。
 */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean)

export async function isAdminSession(): Promise<boolean> {
  const session = await auth()
  const email = session?.user?.email?.toLowerCase()
  if (!email) return false
  return ADMIN_EMAILS.includes(email)
}

/**
 * API route guard。
 * 使い方:
 *   const denied = await requireAdmin()
 *   if (denied) return denied
 *   // ... admin処理
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  if (await isAdminSession()) return null
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
