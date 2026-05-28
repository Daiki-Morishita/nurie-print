import Link from 'next/link'
import { Smartphone, Printer, Store, ChevronRight } from 'lucide-react'

export const metadata = {
  title: 'スマホからぬりえを印刷する方法（AirPrint・コンビニ）',
  description: 'iPhone・Android・コンビニのマルチコピー機で、ぬりえプリントを印刷する方法を解説します。',
  alternates: { canonical: 'https://nurie-print.com/help/print-on-mobile' },
}

export default function PrintOnMobilePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
        <Link href="/" className="hover:text-foreground">ホーム</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground">スマホからの印刷方法</span>
      </nav>

      <header className="mb-8">
        <div className="font-rounded text-[11px] text-primary tracking-[0.2em] mb-2 font-black">— How to Print —</div>
        <h1 className="font-mincho text-[26px] md:text-[34px] font-black leading-snug mb-3">
          スマホからぬりえを印刷する方法
        </h1>
        <p className="text-[14px] text-muted-foreground leading-relaxed">
          iPhone・Android・コンビニのマルチコピー機の3パターンで、ぬりえプリントを印刷する手順をまとめました。
          まずは素材ページの「写真に保存」ボタンで画像をスマホに保存してから、以下の手順に進んでください。
        </p>
      </header>

      {/* iPhone / iPad */}
      <section className="bg-white border border-border rounded-xl p-5 md:p-7 mb-5">
        <h2 className="flex items-center gap-2 font-rounded text-[18px] md:text-[20px] font-black mb-4 pb-2 border-b border-border">
          <Smartphone className="w-5 h-5 text-primary" />
          iPhone / iPad（AirPrint）
        </h2>
        <ol className="space-y-2.5 text-[14px] leading-relaxed list-decimal pl-5">
          <li>素材ページの「写真に保存」ボタンで画像を保存</li>
          <li>写真アプリで該当の画像を開く</li>
          <li>左下の <strong>共有アイコン（□↑）</strong> をタップ</li>
          <li>メニューから「<strong>プリント</strong>」を選択</li>
          <li>プリンタを選んで「プリント」をタップ</li>
        </ol>
        <div className="mt-5 p-4 bg-muted/40 rounded-lg">
          <p className="text-[13px] font-bold mb-2">AirPrint対応プリンタが無い場合</p>
          <p className="text-[12px] text-muted-foreground mb-2">
            お使いのプリンタメーカー専用アプリをApp Storeからインストールしてください。
          </p>
          <ul className="text-[12px] text-muted-foreground space-y-0.5">
            <li>• Canon: 「Canon PRINT」</li>
            <li>• Epson: 「Epson iPrint」</li>
            <li>• Brother: 「Brother iPrint&amp;Scan」</li>
            <li>• HP: 「HP Smart」</li>
          </ul>
        </div>
      </section>

      {/* Android */}
      <section className="bg-white border border-border rounded-xl p-5 md:p-7 mb-5">
        <h2 className="flex items-center gap-2 font-rounded text-[18px] md:text-[20px] font-black mb-4 pb-2 border-b border-border">
          <Smartphone className="w-5 h-5 text-primary" />
          Android
        </h2>
        <ol className="space-y-2.5 text-[14px] leading-relaxed list-decimal pl-5">
          <li>素材ページの「写真に保存」ボタンで画像を保存</li>
          <li>ギャラリー（フォトアプリ）で該当の画像を開く</li>
          <li>メニュー（︙）から「<strong>印刷</strong>」を選択</li>
          <li>プリンタを選択して印刷</li>
        </ol>
        <p className="text-[12px] text-muted-foreground mt-4">
          ※ お使いのプリンタメーカーがアプリを提供している場合は、各社のアプリ手順に従ってください。
        </p>
      </section>

      {/* Convenience Store */}
      <section className="bg-white border border-border rounded-xl p-5 md:p-7 mb-5">
        <h2 className="flex items-center gap-2 font-rounded text-[18px] md:text-[20px] font-black mb-4 pb-2 border-b border-border">
          <Store className="w-5 h-5 text-primary" />
          コンビニのマルチコピー機で印刷
        </h2>
        <p className="text-[13px] text-muted-foreground mb-5 leading-relaxed">
          プリンタが無くてもコンビニのマルチコピー機で印刷できます。事前にネットで画像をアップロードして、店頭で番号を入力するしくみです。
        </p>

        <div className="mb-5">
          <h3 className="font-rounded text-[15px] font-black mb-2 text-primary">
            ▼ セブンイレブン（かんたんネットプリント）
          </h3>
          <ol className="space-y-1.5 text-[13px] leading-relaxed list-decimal pl-5">
            <li><a href="https://www.printing.ne.jp/" target="_blank" rel="noopener noreferrer" className="text-primary underline">netprint.jp</a> にアクセス</li>
            <li>画像をアップロード</li>
            <li>表示された予約番号を控える</li>
            <li>セブンイレブンのマルチコピー機で番号を入力</li>
          </ol>
          <p className="text-[12px] text-muted-foreground mt-2 pl-5">
            料金: A4白黒 20円 / カラー 60円
          </p>
        </div>

        <div>
          <h3 className="font-rounded text-[15px] font-black mb-2 text-primary">
            ▼ ローソン・ファミマ（ネットワークプリント）
          </h3>
          <ol className="space-y-1.5 text-[13px] leading-relaxed list-decimal pl-5">
            <li><a href="https://networkprint.ne.jp/" target="_blank" rel="noopener noreferrer" className="text-primary underline">networkprint.ne.jp</a> にアクセス</li>
            <li>画像をアップロード</li>
            <li>ユーザー番号を控える</li>
            <li>各店のマルチコピー機で番号入力</li>
          </ol>
          <p className="text-[12px] text-muted-foreground mt-2 pl-5">
            料金: A4白黒 20円 / カラー 60円
          </p>
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="mt-10 text-center">
        <p className="text-[13px] text-muted-foreground mb-3">準備ができたら、お気に入りのぬりえを選んでください。</p>
        <Link
          href="/materials"
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full text-[14px] font-rounded font-black hover:opacity-90 transition-opacity"
        >
          <Printer className="w-4 h-4" />
          ぬりえを探す
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
