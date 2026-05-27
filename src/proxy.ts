import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean)

export async function proxy(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  // ログイン済みユーザーが /login にアクセス → リダイレクト
  if (session && pathname === '/login') {
    // callbackUrl が同一オリジン内のパスなら最優先
    const cb = request.nextUrl.searchParams.get('callbackUrl')
    if (cb && cb.startsWith('/') && !cb.startsWith('//')) {
      return NextResponse.redirect(new URL(cb, request.url))
    }
    const dest = session.user.onboardingDone ? '/materials' : '/onboarding'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // 要認証ページへの未ログインアクセス → /login へ
  const protected_ = ['/account', '/onboarding']
  if (!session && protected_.some(p => pathname.startsWith(p))) {
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // 管理者領域: ADMIN_EMAILS allowlist でガード
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const email = session?.user?.email?.toLowerCase()
    const isAdmin = !!email && ADMIN_EMAILS.includes(email)
    if (!isAdmin) {
      // /api/admin/* は 401 JSON、それ以外は /login へ
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const url = new URL('/login', request.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/login',
    '/account/:path*',
    '/onboarding/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
  ],
}
