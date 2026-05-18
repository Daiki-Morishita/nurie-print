import Link from 'next/link'
import { Heart, LogIn, UserPlus, ArrowRight } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { getMaterialById } from '@/lib/data'
import { FavoritesView, type FavoriteItem } from './FavoritesView'

export const metadata = {
  title: 'お気に入りのぬりえ',
  robots: { index: false, follow: false },
}

export default async function FavoritesPage() {
  const session = await auth()

  // 未ログインユーザーは自動リダイレクトせず、案内画面を表示
  if (!session?.user?.id) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
          <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-rounded text-[20px] font-black mb-2">お気に入り機能</h1>
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
            お気に入りを保存・グループで整理するには<br />ログインが必要です（無料）。
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/login?callbackUrl=/favorites"
              className="inline-flex items-center justify-center gap-2 bg-foreground text-white px-5 py-3 rounded-full text-[14px] font-medium hover:bg-foreground/90 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              ログインして続ける
            </Link>
            <Link
              href="/login?tab=register&callbackUrl=/favorites"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white px-5 py-3 rounded-full text-[14px] font-rounded font-black hover:opacity-90 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              新規登録（無料）
            </Link>
          </div>
          <div className="mt-6 pt-6 border-t border-border">
            <Link href="/" className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-primary transition-colors">
              ぬりえプリントのトップへ戻る
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const favRows = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })
  const items: FavoriteItem[] = favRows
    .map(f => {
      const m = getMaterialById(f.materialId)
      if (!m) return null
      return { material: m, groupName: f.groupName }
    })
    .filter((v): v is FavoriteItem => !!v)

  return <FavoritesView initialItems={items} limit={10} />
}
