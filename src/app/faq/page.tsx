import Link from 'next/link'
import { ChevronRight, HelpCircle } from 'lucide-react'

export const metadata = {
  title: 'よくある質問（FAQ）｜ぬりえプリント',
  description: 'ぬりえプリントについてよくいただく質問をまとめています。教材の使い方・印刷方法・商用利用の可否・教材のリクエストなど。',
  alternates: { canonical: 'https://nurie-print.com/faq' },
}

type FAQ = { q: string; a: string }

const faqs: FAQ[] = [
  {
    q: '教材は本当に無料で使えますか？',
    a: 'はい、ご家庭・教育・保育での利用に限り、すべて無料でご利用いただけます。会員登録やダウンロード制限もありません。気軽にお使いください。',
  },
  {
    q: '印刷はどうやってするのですか？',
    a: '教材ページの「印刷」ボタンを押すと、ブラウザの印刷ダイアログが開きます。用紙サイズはA4・横向き・余白なしに設定すると、最も綺麗に印刷できます。フチありで印刷する設定でも問題なく使えます。',
  },
  {
    q: 'カラー印刷とモノクロ印刷、どちらがおすすめですか？',
    a: 'ぬりえなどの線画教材は、モノクロ印刷で十分です。インク代を抑えられますし、ぬりえ本来の「自分で色をつける楽しみ」を活かせます。',
  },
  {
    q: '保育園・幼稚園で使ってもいいですか？',
    a: 'もちろんです。保育園・幼稚園・学童保育・児童館・子育て支援センター等の現場での利用は、当サイトの主な想定利用シーンのひとつです。クラス全員分を印刷していただいて構いません。',
  },
  {
    q: 'ブログやYouTubeで紹介してもいいですか？',
    a: '当サイトの紹介・リンクは自由に行っていただけます。教材画像をそのままダウンロードしてブログ等に転載することはご遠慮いただきたいですが、「こんなサイトがありました」とリンクや画面キャプチャでご紹介いただくのは問題ありません。',
  },
  {
    q: '教材を販売したり、他のサイトに転載してもいいですか？',
    a: '商用での再配布・販売・有料素材としての転載は禁止しています。教材のライセンスは CC BY-NC 4.0（非営利利用）に準じます。',
  },
  {
    q: '希望する教材をリクエストできますか？',
    a: 'はい、お問い合わせフォームからリクエストを受け付けています。すべてのリクエストにお応えできるとは限りませんが、よくご要望をいただくテーマは優先的に制作するようにしています。',
  },
  {
    q: '教材の難易度はどう選べばいいですか？',
    a: '当サイトでは simple（2〜3歳向け）／ easy（3歳向け）／ normal（3〜5歳向け）／ rich（4〜6歳向け）の4段階を用意しています。年齢はあくまで目安なので、お子さまの様子を見ながら調整してください。詳しくは「年齢別ぬりえの選び方」のコラム記事をご参考にどうぞ。',
  },
  {
    q: 'テーマや季節で絞り込むことはできますか？',
    a: 'はい。動物・恐竜・乗り物・海の生き物など豊富なテーマや、春・夏・秋・冬の季節別で絞り込みができます。また年齢・難易度別でも探せます。教材一覧ページのフィルターをお使いください。',
  },
  {
    q: 'スマートフォンからも使えますか？',
    a: 'スマートフォン・タブレットからも閲覧・利用いただけます。ただし印刷の際はパソコンや家庭用プリンタを利用すると、よりきれいに出力できます。',
  },
  {
    q: '教材の使い方アイデアはありますか？',
    a: '各教材のページには「保育・家庭での活用例」を掲載しています。また、コラム記事では「雨の日のおうち遊び15選」「年齢別ぬりえの選び方」など、教材を使った具体的な遊び方を多数紹介しています。',
  },
  {
    q: '誤字・脱字・内容の誤りを見つけたら？',
    a: 'お問い合わせフォームよりご連絡ください。確認の上、速やかに修正いたします。サイトの品質維持にご協力ありがとうございます。',
  },
]

export default function FAQPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">ホーム</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">よくある質問</span>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-bold mb-3 flex items-center gap-2">
          <HelpCircle className="w-7 h-7 text-primary" />
          よくある質問
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-10">
          ぬりえプリントについてよく寄せられるご質問をまとめました。お探しの内容が見つからない場合は、お問い合わせフォームよりご連絡ください。
        </p>

        <div className="space-y-5">
          {faqs.map((f, i) => (
            <details key={i} className="bg-white border border-border rounded-xl p-5 group">
              <summary className="font-semibold text-sm cursor-pointer flex items-start gap-3 list-none">
                <span className="text-primary shrink-0">Q.</span>
                <span className="flex-1">{f.q}</span>
                <span className="text-muted-foreground text-xs ml-2 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="mt-4 pl-7 text-sm leading-relaxed text-foreground">
                {f.a}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-12 bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
          <p className="text-sm leading-relaxed mb-4">
            ここに載っていないご質問は、お気軽にお問い合わせください。
          </p>
          <Link href="/contact" className="inline-block bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            お問い合わせフォームへ
          </Link>
        </div>
      </div>
    </>
  )
}
