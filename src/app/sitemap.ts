import type { MetadataRoute } from 'next'
import { columns } from '@/lib/columns'
import { materials } from '@/lib/data'

const BASE_URL = 'https://nurie-print.com'

// AdSense審査・scaled content 対策として、インデックス対象を絞ったホワイトリスト方式。
// 掲載対象: home + columns + 静的ページ + featured 素材（人気上位50件・独自解説200字+）
// 残り 3,200+ の素材ページは個別ページの厚みが揃うまで noindex 維持
export default function sitemap(): MetadataRoute.Sitemap {
  const featuredMaterials = materials
    .filter(m => m.featured)
    .map(m => ({
      url: `${BASE_URL}/materials/${m.id}`,
      lastModified: new Date(m.createdAt || Date.now()),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/columns`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    ...columns.map(c => ({
      url: `${BASE_URL}/columns/${c.slug}`,
      lastModified: new Date(c.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    { url: `${BASE_URL}/maze`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/operator`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${BASE_URL}/editorial-policy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    ...featuredMaterials,
  ]
}
