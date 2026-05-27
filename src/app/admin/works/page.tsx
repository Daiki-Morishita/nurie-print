import { redirect } from 'next/navigation'
import { isAdminSession } from '@/lib/admin-auth'
import { materials } from '@/lib/data'
import { listAllWorks } from '@/lib/gallery'
import { WorksAdmin } from './WorksAdmin'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: '作品ギャラリー管理 | Admin',
  robots: { index: false, follow: false },
}

export default async function WorksAdminPage() {
  if (!await isAdminSession()) {
    redirect('/login?callbackUrl=/admin/works')
  }

  // 投稿候補は featured: true の素材のみに絞る（300件）
  const featuredOptions = materials
    .filter(m => m.featured)
    .map(m => ({ id: m.id, title: m.title }))

  const works = await listAllWorks(200)

  return <WorksAdmin featuredOptions={featuredOptions} initialWorks={works} />
}
