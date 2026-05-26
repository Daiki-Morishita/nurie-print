'use client'

import { useState } from 'react'
import { Send, CheckCircle2, AlertCircle } from 'lucide-react'

type Category = 'request' | 'bug' | 'copyright' | 'other'

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'request',   label: '教材の追加リクエスト' },
  { value: 'bug',       label: '不具合・印刷の問題' },
  { value: 'copyright', label: '著作権・不適切な内容の報告' },
  { value: 'other',     label: 'その他' },
]

export function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState<Category>('request')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setStatus('idle')
    setErrorMsg('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, category, subject, message, website }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.error || '送信に失敗しました')
        return
      }
      setStatus('success')
      setName(''); setEmail(''); setSubject(''); setMessage(''); setAgreed(false)
    } catch {
      setStatus('error')
      setErrorMsg('通信エラー。時間を置いて再度お試しください')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-white border border-border rounded-2xl p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="font-rounded font-black text-[20px] mb-2">送信完了しました</h2>
        <p className="text-[14px] text-muted-foreground leading-relaxed">
          お問い合わせありがとうございます。<br />
          内容を確認の上、必要に応じてご連絡いたします。
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-6 text-[13px] text-primary hover:underline"
        >
          もう一度送信する
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-6 sm:p-7 space-y-5">
      {/* honeypot: 隠しフィールド・bot対策 */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      {/* カテゴリ */}
      <div>
        <label className="block text-[13px] font-bold mb-2">
          お問い合わせの種類 <span className="text-primary">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CATEGORY_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                category === opt.value
                  ? 'bg-primary/10 border-primary text-foreground'
                  : 'bg-white border-border hover:border-primary/50'
              }`}
            >
              <input
                type="radio"
                name="category"
                value={opt.value}
                checked={category === opt.value}
                onChange={() => setCategory(opt.value)}
                className="accent-primary"
              />
              <span className="text-[13px]">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* お名前 */}
      <div>
        <label htmlFor="name" className="block text-[13px] font-bold mb-2">
          お名前 <span className="text-muted-foreground text-[11px] font-normal">（任意）</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          className="w-full px-3 py-2.5 text-[14px] border border-border rounded-lg focus:outline-none focus:border-primary"
          placeholder="例: 山田 はな子"
        />
      </div>

      {/* メールアドレス */}
      <div>
        <label htmlFor="email" className="block text-[13px] font-bold mb-2">
          メールアドレス <span className="text-primary">*</span>
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2.5 text-[14px] border border-border rounded-lg focus:outline-none focus:border-primary"
          placeholder="返信が必要な場合に使用します"
        />
      </div>

      {/* 件名 */}
      <div>
        <label htmlFor="subject" className="block text-[13px] font-bold mb-2">
          件名 <span className="text-muted-foreground text-[11px] font-normal">（任意）</span>
        </label>
        <input
          id="subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={200}
          className="w-full px-3 py-2.5 text-[14px] border border-border rounded-lg focus:outline-none focus:border-primary"
        />
      </div>

      {/* お問い合わせ内容 */}
      <div>
        <label htmlFor="message" className="block text-[13px] font-bold mb-2">
          お問い合わせ内容 <span className="text-primary">*</span>
        </label>
        <textarea
          id="message"
          required
          rows={7}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          minLength={10}
          maxLength={5000}
          className="w-full px-3 py-2.5 text-[14px] border border-border rounded-lg focus:outline-none focus:border-primary resize-y"
          placeholder="例: 「動物」テーマで「ペンギン」を追加していただきたいです。3〜5歳の子ども向けに使えると嬉しいです。"
        />
        <p className="text-[11px] text-muted-foreground mt-1.5">
          {message.length} / 5,000 文字
        </p>
      </div>

      {/* 同意 */}
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 accent-primary"
        />
        <span className="text-[12px] text-muted-foreground leading-relaxed">
          <a href="/privacy" className="text-primary hover:underline" target="_blank" rel="noopener">プライバシーポリシー</a>
          に同意の上、送信します。
        </span>
      </label>

      {/* エラー */}
      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-[13px] text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 送信 */}
      <button
        type="submit"
        disabled={submitting || !agreed}
        className="w-full bg-primary text-white py-3 rounded-lg font-rounded font-black hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        {submitting ? '送信中…' : '送信する'}
      </button>

      <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
        送信後、確認の上できる限り迅速にお返事いたします（数日かかる場合があります）。
      </p>
    </form>
  )
}
