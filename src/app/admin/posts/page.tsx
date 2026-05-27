import { redirect } from 'next/navigation'
import { isAdminSession } from '@/lib/admin-auth'
import { materials } from '@/lib/data'
import { listAllPostsForAdmin } from '@/lib/posts'
import { PostsAdmin } from './PostsAdmin'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: '今日のいちまい 管理 | Admin',
  robots: { index: false, follow: false },
}

export default async function PostsAdminPage() {
  if (!await isAdminSession()) {
    redirect('/login?callbackUrl=/admin/posts')
  }

  // featured 素材を提示候補に
  const featuredOptions = materials
    .filter(m => m.featured)
    .map(m => ({ id: m.id, title: m.title }))
  const allMaterialTitles = new Map(materials.map(m => [m.id, m.title]))

  const posts = await listAllPostsForAdmin(200)

  return (
    <PostsAdmin
      featuredOptions={featuredOptions}
      allMaterialTitles={Array.from(allMaterialTitles.entries())}
      initialPosts={posts.map(p => ({
        ...p,
        publishedAt: p.publishedAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }))}
    />
  )
}
