'use server'

import { signIn } from '@/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { AuthError } from 'next-auth'

/** callbackUrl の安全なバリデーション（オープンリダイレクト防止） */
function safeRedirect(cb: string | undefined | null): string {
  if (cb && typeof cb === 'string' && cb.startsWith('/') && !cb.startsWith('//')) {
    return cb
  }
  return '/onboarding'
}

export async function loginWithCredentials(email: string, password: string, callbackUrl?: string) {
  try {
    await signIn('credentials', { email, password, redirectTo: safeRedirect(callbackUrl) })
  } catch (e) {
    if (e instanceof AuthError) return { error: 'メールアドレスまたはパスワードが間違っています' }
    throw e
  }
}

export async function registerWithCredentials(email: string, password: string, callbackUrl?: string) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: 'このメールアドレスはすでに登録されています' }

  const hashed = await bcrypt.hash(password, 12)
  await prisma.user.create({ data: { email, password: hashed } })

  try {
    await signIn('credentials', { email, password, redirectTo: safeRedirect(callbackUrl) })
  } catch (e) {
    if (e instanceof AuthError) return { error: '登録しましたがログインに失敗しました。再度ログインしてください' }
    throw e
  }
}

export async function loginWithGoogle(formData?: FormData) {
  const cb = formData?.get('callbackUrl')?.toString()
  await signIn('google', { redirectTo: safeRedirect(cb) })
}

export async function loginWithLINE(formData?: FormData) {
  const cb = formData?.get('callbackUrl')?.toString()
  await signIn('line', { redirectTo: safeRedirect(cb) })
}
