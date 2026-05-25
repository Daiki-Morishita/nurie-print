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

  // 認証済みはサーバーから取得、匿名は空（クライアント側のlocalStorageから読む）
  let items: FavoriteItem[] = []
  if (session?.user?.id) {
    const favRows = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })
    items = favRows
      .map(f => {
        const m = getMaterialById(f.materialId)
        if (!m) return null
        return { material: m, groupName: f.groupName }
      })
      .filter((v): v is FavoriteItem => !!v)
  }

  return <FavoritesView initialItems={items} limit={10} />
}
