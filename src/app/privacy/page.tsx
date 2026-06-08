import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export const metadata = {
  title: 'プライバシーポリシー',
  description: 'ぬりえプリントのプライバシーポリシー。個人情報の取り扱い、Cookie・アクセス解析・広告配信に関する方針を記載しています。',
  alternates: { canonical: 'https://nurie-print.com/privacy' },
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">ホーム</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground">プライバシーポリシー</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold mb-6">プライバシーポリシー</h1>

      <p className="text-sm text-muted-foreground mb-8">最終更新日: 2026年5月12日</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-lg font-bold mb-2">1. 取得する情報</h2>
          <p>
            当サイト「ぬりえプリント」（以下「当サイト」）は、サービス改善のために以下の情報を取得することがあります。
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
            <li>アクセス情報（IPアドレス、ブラウザ種別、参照元URL、閲覧ページ等）</li>
            <li>Cookie および類似の技術によって収集される情報</li>
            <li>お問い合わせフォームを通じてお預かりするお名前・メールアドレス等</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-2">2. 利用目的</h2>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>サービスの提供・改善・運営の安定化</li>
            <li>アクセス解析および利用状況の把握</li>
            <li>不正利用の検知と対応</li>
            <li>お問い合わせへの返信およびご連絡</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-2">3. アクセス解析ツールについて</h2>
          <p>
            当サイトでは、サービス改善のために Google Analytics をはじめとするアクセス解析ツールを利用する場合があります。
            これらのツールはCookieを使用してアクセス情報を収集しますが、個人を特定する情報は含みません。
            Cookieはブラウザの設定により無効化することが可能です。
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-2">4. 広告配信について</h2>
          <p>
            当サイトでは、第三者配信の広告サービス（Google AdSense等）を利用する場合があります。
            広告配信事業者は、ユーザーの興味に応じた広告を表示するためにCookieを使用することがあります。
            Cookieを無効にする方法および Google AdSense に関する詳細は、
            <a href="https://policies.google.com/technologies/ads?hl=ja" target="_blank" rel="noopener noreferrer" className="text-primary underline ml-1">
              Google 広告ポリシー
            </a>
            をご確認ください。
          </p>
          <p className="mt-2">
            広告のパーソナライズは、
            <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline mx-1">
              Google 広告設定
            </a>
            からいつでも無効にできます。
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-2">5. 個人情報の第三者提供</h2>
          <p>
            当サイトは、法令に基づく場合および本ポリシーに記載した利用目的の達成に必要な場合を除き、
            ユーザーの同意なく個人情報を第三者に提供することはありません。
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-2">6. 個人情報の管理</h2>
          <p>
            当サイトは、お預かりした個人情報を適切に管理し、漏えい・滅失・毀損の防止に努めます。
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-2">7. お子様の個人情報</h2>
          <p>
            当サイトは保育・教育目的を主たる対象としていますが、サイト自体は保護者・教育関係者の利用を想定しています。
            13歳未満のお子様から意図的に個人情報を収集することはありません。
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-2">8. ポリシーの変更</h2>
          <p>
            当サイトは、必要に応じて本プライバシーポリシーを変更することがあります。
            変更後の内容は本ページに掲載した時点から効力を生じるものとします。
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-2">9. お問い合わせ</h2>
          <p>
            本ポリシーに関するお問い合わせは、
            <Link href="/contact" className="text-primary underline mx-1">お問い合わせページ</Link>
            よりご連絡ください。
          </p>
        </div>
      </section>
    </div>
  )
}
