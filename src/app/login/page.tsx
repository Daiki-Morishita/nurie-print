import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Home } from 'lucide-react'
import { LoginForm } from './LoginForm'

export const metadata = { title: 'ログイン | ぬりえプリント', robots: { index: false, follow: false } }

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* 戻る導線（最優先表示） */}
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            ぬりえプリントのトップへ戻る
          </Link>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1">ログイン / 新規登録</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            お気に入りの保存・グループ整理にはログインが必要です。<br />
            ぬりえの<strong className="text-foreground">閲覧・印刷だけならログインなしで利用できます</strong>。
          </p>
        </div>
        <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded" />}>
          <LoginForm />
        </Suspense>
        <p className="text-xs text-center text-muted-foreground mt-6">
          ログインすることで
          <a href="/terms" className="underline underline-offset-2 hover:text-foreground">利用規約</a>
          と
          <a href="/privacy" className="underline underline-offset-2 hover:text-foreground">プライバシーポリシー</a>
          に同意したものとみなします
        </p>

        {/* 二次導線 */}
        <div className="mt-8 pt-6 border-t border-border flex items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12px] text-accent hover:text-primary transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            ホーム
          </Link>
          <span className="text-border">|</span>
          <Link
            href="/materials"
            className="text-[12px] text-accent hover:text-primary transition-colors"
          >
            ぬりえを探す
          </Link>
        </div>
      </div>
    </div>
  )
}
