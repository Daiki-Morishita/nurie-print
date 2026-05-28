'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { loginWithCredentials, registerWithCredentials, loginWithGoogle, loginWithLINE } from './actions'

type Tab = 'login' | 'register'

export function LoginForm() {
  const searchParams = useSearchParams()
  const initialTab: Tab = searchParams.get('tab') === 'register' ? 'register' : 'login'
  const callbackUrl = searchParams.get('callbackUrl') ?? undefined
  // NextAuth v5 が credentials 失敗時に ?error=... へリダイレクトする
  const urlError = searchParams.get('error')
  const initialError = urlError === 'CredentialsSignin'
    ? 'メールアドレスまたはパスワードが間違っています'
    : urlError
    ? 'ログインに失敗しました。再度お試しください'
    : ''
  const [tab, setTab]         = useState<Tab>(initialTab)
  const [email, setEmail]     = useState('')
  const [password, setPw]     = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError]     = useState(initialError)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (tab === 'register' && password !== confirm) {
      setError('パスワードが一致しません')
      return
    }
    setLoading(true)
    const fn = tab === 'login' ? loginWithCredentials : registerWithCredentials
    const res = await fn(email, password, callbackUrl)
    if (res?.error) { setError(res.error); setLoading(false) }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* OAuth ボタン */}
      <div className="flex flex-col gap-3 mb-6">
        <form action={loginWithGoogle}>
          {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <GoogleIcon />
            Googleでログイン
          </button>
        </form>
        <form action={loginWithLINE}>
          {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 rounded-xl py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#06C755' }}
          >
            <LineIcon />
            LINEでログイン
          </button>
        </form>
      </div>

      <div className="flex items-center gap-3 mb-6 text-xs text-muted-foreground">
        <div className="flex-1 h-px bg-border" />
        または
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* タブ */}
      <div className="flex rounded-xl bg-muted p-1 mb-5">
        {(['login', 'register'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setError('') }}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'
            }`}
          >
            {t === 'login' ? 'ログイン' : '新規登録'}
          </button>
        ))}
      </div>

      {/* メール/パスワードフォーム */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="メールアドレス"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        />
        <input
          type="password"
          required
          placeholder="パスワード（8文字以上）"
          minLength={8}
          value={password}
          onChange={e => setPw(e.target.value)}
          className="w-full px-4 py-2.5 text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        />
        {tab === 'register' && (
          <input
            type="password"
            required
            placeholder="パスワード（確認）"
            minLength={8}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="w-full px-4 py-2.5 text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {loading ? '処理中…' : tab === 'login' ? 'ログイン' : 'アカウントを作成'}
        </button>
      </form>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}

function LineIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M12 .5C5.649.5.5 4.85.5 10.222c0 4.216 2.8 7.865 7.003 9.873-.098.344-.63 2.21-.722 2.536-.112.4.147.394.307.287.126-.085 2.002-1.325 2.814-1.862.678.094 1.374.143 2.098.143 6.351 0 11.5-4.35 11.5-9.722C23.5 4.85 18.351.5 12 .5zm-3.8 12.84H6.286a.44.44 0 0 1-.44-.44V8.534a.44.44 0 0 1 .88 0v3.424h1.474a.44.44 0 0 1 0 .88zm1.55 0a.44.44 0 0 1-.44-.44V8.534a.44.44 0 0 1 .88 0V12.9a.44.44 0 0 1-.44.44zm4.684 0a.44.44 0 0 1-.31-.129l-2.02-2.19V12.9a.44.44 0 0 1-.88 0V8.534a.44.44 0 0 1 .75-.312l2.02 2.19V8.534a.44.44 0 0 1 .88 0V12.9a.44.44 0 0 1-.44.44zm3.066 0h-1.914a.44.44 0 0 1-.44-.44V8.534a.44.44 0 0 1 .44-.44H17.5a.44.44 0 0 1 0 .88h-1.474v.964H17.5a.44.44 0 0 1 0 .88h-1.474v.964H17.5a.44.44 0 0 1 0 .88z"/>
    </svg>
  )
}
