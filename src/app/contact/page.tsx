import Link from 'next/link'
import { ChevronRight, Mail, MessageSquare, Clock, Shield } from 'lucide-react'
import { ContactForm } from './ContactForm'

export const metadata = {
  title: 'お問い合わせ',
  description: 'ぬりえプリントへのお問い合わせ・教材リクエスト・不具合報告のフォーム。著作権に関する報告もこちらからお受けしています。',
  alternates: { canonical: 'https://nurie-print.com/contact' },
}

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">ホーム</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground">お問い合わせ</span>
      </nav>

      <div className="mb-8">
        <div className="font-rounded font-bold text-[12px] text-primary mb-1 tracking-[0.1em]">— Contact —</div>
        <h1 className="font-rounded text-[26px] sm:text-[32px] font-black mb-3">お問い合わせ</h1>
        <p className="text-[14px] text-muted-foreground leading-relaxed">
          ぬりえプリントへのご質問・教材リクエスト・不具合のご報告など、お気軽にご連絡ください。<br className="hidden sm:inline" />
          内容を確認の上、必要に応じて返信いたします。
        </p>
      </div>

      {/* メタ情報バー */}
      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        <div className="bg-white border border-border rounded-lg p-3 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="text-[12px]">
            <div className="font-bold text-foreground mb-0.5">返信目安</div>
            <div className="text-muted-foreground">2〜5営業日</div>
          </div>
        </div>
        <div className="bg-white border border-border rounded-lg p-3 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="text-[12px]">
            <div className="font-bold text-foreground mb-0.5">プライバシー</div>
            <div className="text-muted-foreground">第三者提供なし</div>
          </div>
        </div>
        <div className="bg-white border border-border rounded-lg p-3 flex items-start gap-2.5">
          <Mail className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="text-[12px]">
            <div className="font-bold text-foreground mb-0.5">運営</div>
            <div className="text-muted-foreground">ぬりえプリント編集部</div>
          </div>
        </div>
      </div>

      {/* フォーム */}
      <ContactForm />

      {/* メール（フォームが使えない場合の代替） */}
      <div className="mt-10 bg-muted/50 border border-border rounded-lg p-5">
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-[13px] leading-relaxed">
            <p className="font-bold text-foreground mb-1">フォームが使えない場合</p>
            <p className="text-muted-foreground">
              下記のメールアドレスにお問い合わせください：<br />
              <span className="inline-block mt-1.5 font-mono bg-white border border-border px-3 py-1 rounded">
                contact@nurie-print.com
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* よくあるお問い合わせ */}
      <div className="mt-12">
        <h2 className="font-rounded text-[18px] font-black mb-4 flex items-center gap-2 pb-2 border-b border-border">
          <MessageSquare className="w-5 h-5 text-primary" />
          よくいただくお問い合わせ
        </h2>
        <div className="space-y-5 text-[14px] leading-relaxed">
          <div>
            <h3 className="font-bold mb-1.5">Q. 教材を商用で使ってもよいですか？</h3>
            <p className="text-muted-foreground">
              A. 保育園・幼稚園・教室・ご家庭での教育利用に限り無料でお使いいただけます。
              商用での販売・再配布、画像の二次配布は禁止しております。
              詳しくは<Link href="/terms" className="text-primary underline">利用規約</Link>をご覧ください。
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-1.5">Q. 「こんな教材が欲しい」というリクエストはできますか？</h3>
            <p className="text-muted-foreground">
              A. はい、上のフォームから「教材の追加リクエスト」を選んでお送りください。
              テーマ・対象年齢・用途などをお書きいただけると検討がスムーズです。
              可能なものから順次追加いたします。
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-1.5">Q. 印刷したらズレてしまいました。</h3>
            <p className="text-muted-foreground">
              A. ブラウザの印刷ダイアログで「用紙サイズ：A4」「向き：横」「余白：なし」をご指定ください。
              それでも改善しない場合はフォームから「不具合・印刷の問題」でご報告ください。
              使用OS・ブラウザ・プリンタの機種を教えていただけると助かります。
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-1.5">Q. 画像に著作権・不適切な内容の問題があります。</h3>
            <p className="text-muted-foreground">
              A. 該当ページのURLとあわせて、フォームから「著作権・不適切な内容の報告」でお早めにお知らせください。
              内容を確認の上、速やかに対応いたします（通常24時間以内）。
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-1.5">Q. 取材・広告掲載などのお問い合わせは？</h3>
            <p className="text-muted-foreground">
              A. 「その他」を選んでフォームよりご連絡ください。
              内容を確認の上、ご返答いたします。
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 text-[11px] text-muted-foreground bg-muted px-4 py-3 rounded-lg leading-relaxed">
        ※ お問い合わせの内容によっては、お返事までお時間をいただく場合がございます。<br />
        ※ いただいた個人情報は<Link href="/privacy" className="underline">プライバシーポリシー</Link>に従って取り扱います。
      </div>
    </div>
  )
}
