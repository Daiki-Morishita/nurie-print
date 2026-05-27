import Link from 'next/link'
import { ChevronRight, Check } from 'lucide-react'

export const metadata = {
  title: 'プランをアップグレード',
  description: '無料プランでは10件まで、有料プランで無制限保存・まとめて印刷など便利な機能をお使いいただけます。',
  robots: { index: false, follow: false },
}

export default function UpgradePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <nav className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">ホーム</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground">プラン</span>
      </nav>

      <div className="font-rounded font-bold text-[12px] text-primary mb-1 tracking-[0.1em]">— PLAN —</div>
      <h1 className="font-rounded text-[28px] sm:text-[36px] font-black mb-2">プランをアップグレード</h1>
      <p className="text-[13px] text-muted-foreground leading-relaxed mb-8">
        無料プランでも基本機能はすべてご利用いただけます。<br />
        頻繁にご利用いただく方には、有料プランで便利な機能をご用意しています。
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-10">
        {/* Free */}
        <div className="bg-white border border-border rounded-2xl p-6">
          <div className="text-[11px] text-muted-foreground mb-2 tracking-[0.1em]">FREE</div>
          <div className="font-rounded text-[24px] font-black mb-1">無料プラン</div>
          <div className="text-[12px] text-muted-foreground mb-5">¥0 / 月</div>
          <ul className="space-y-2.5 text-[13px]">
            <FeatureRow text="すべての教材を閲覧・印刷" />
            <FeatureRow text="お気に入り 10 件まで保存" />
            <FeatureRow text="お気に入りまとめて印刷" />
            <FeatureRow text="コンビニ印刷ガイド" />
          </ul>
        </div>

        {/* Paid */}
        <div className="bg-foreground text-white rounded-2xl p-6 relative shadow-lg">
          <div className="absolute -top-3 right-5 bg-primary text-white text-[11px] px-3 py-1 rounded-full font-rounded font-black">
            COMING SOON
          </div>
          <div className="text-[11px] text-white/70 mb-2 tracking-[0.1em]">PRO</div>
          <div className="font-rounded text-[24px] font-black mb-1">有料プラン</div>
          <div className="text-[12px] text-white/70 mb-5">料金は近日公開</div>
          <ul className="space-y-2.5 text-[13px]">
            <FeatureRow text="お気に入り無制限保存" dark />
            <FeatureRow text="フォルダ・タグで整理" dark />
            <FeatureRow text="広告非表示" dark />
            <FeatureRow text="優先生成リクエスト" dark />
            <FeatureRow text="先行公開教材へのアクセス" dark />
          </ul>
          <button
            disabled
            className="w-full mt-6 bg-white/20 text-white py-3 rounded-lg text-[13px] font-rounded font-black cursor-not-allowed"
          >
            準備中
          </button>
        </div>
      </div>

      <div className="bg-background border border-border rounded-lg p-5 text-[12px] text-muted-foreground leading-relaxed">
        <strong className="text-foreground">有料プランの開始予定：</strong>
        現在準備中です。リリースをご希望の方は{' '}
        <Link href="/contact" className="text-primary underline">お問い合わせ</Link>
        からご一報ください。
      </div>
    </div>
  )
}

function FeatureRow({ text, dark = false }: { text: string; dark?: boolean }) {
  return (
    <li className="flex items-start gap-2">
      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${dark ? 'text-primary' : 'text-primary'}`} />
      <span>{text}</span>
    </li>
  )
}
