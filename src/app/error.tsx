'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { AlertTriangle, Home, RotateCw } from 'lucide-react'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error)
    }
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 border border-amber-200 mb-5">
          <AlertTriangle className="w-8 h-8 text-amber-600" />
        </div>
        <div className="font-rounded text-[11px] text-primary tracking-[0.2em] mb-2 font-black">— Error —</div>
        <h1 className="font-mincho text-[24px] md:text-[28px] font-black mb-3">エラーが発生しました</h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          ページの読み込み中に問題が起きました。もう一度お試しいただくか、ホームに戻ってください。
          {error.digest && (
            <span className="block mt-2 text-[11px] font-mono text-muted-foreground/70">
              ref: {error.digest}
            </span>
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90"
          >
            <RotateCw className="w-4 h-4" /> もう一度試す
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-border rounded-lg text-sm font-bold hover:bg-muted"
          >
            <Home className="w-4 h-4" /> ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
