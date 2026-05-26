import type { MetadataRoute } from 'next'
import { materials, filterMaterials, getAudience } from '@/lib/data'
import { ADULT_THEMES } from '@/lib/types'
import { columns } from '@/lib/columns'
import { getAllMazes } from '@/lib/maze/loader'

const BASE_URL = 'https://nurie-print.com'

const AGES = [2, 3, 4, 5, 6]
const KIDS_THEMES = ['animals', 'dinosaurs', 'vehicles', 'trains', 'densha', 'shinkansen', 'sea', 'park', 'insects', 'fruits', 'vegetables', 'sweets', 'sports', 'yokai', 'flowers', 'gotochi', 'fairytale', 'seasonal-events']

// Material.createdAt は "2026-05-22T14:30" のような不完全な ISO 形式（秒・TZ欠落）。
// Google Search Console は ISO 8601 全要素を要求するため、Date オブジェクトに変換して渡す。
function toSitemapDate(s: string): Date {
  // パターン1: "YYYY-MM-DDThh:mm" → 秒とJSTタイムゾーンを補完
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) {
    return new Date(s + ':00+09:00')
  }
  // パターン2: "YYYY-MM-DD" → 00:00 JST
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(s + 'T00:00:00+09:00')
  }
  const d = new Date(s)
  return isNaN(d.getTime()) ? new Date() : d
}

export default function sitemap(): MetadataRoute.Sitemap {
  // Kids materials
  const kidsMaterials = materials.filter(m => getAudience(m) === 'kids')
  const adultMaterials = materials.filter(m => getAudience(m) === 'adult')

  const kidsMaterialPages = kidsMaterials.map(m => ({
    url: `${BASE_URL}/materials/${m.id}`,
    lastModified: toSitemapDate(m.createdAt),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
    ...(m.imageUrl ? { images: [m.imageUrl] } : {}),
  }))

  const adultMaterialPages = adultMaterials.map(m => ({
    url: `${BASE_URL}/adult/materials/${m.id}`,
    lastModified: toSitemapDate(m.createdAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
    ...(m.imageUrl ? { images: [m.imageUrl] } : {}),
  }))

  // Kids category pages
  const kidsThemePages = KIDS_THEMES
    .filter(t => filterMaterials({ theme: t as Parameters<typeof filterMaterials>[0]['theme'], audience: 'kids' }).length > 0)
    .map(t => ({ url: `${BASE_URL}/category/theme/${t}`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 }))

  const seasonPages = ['spring', 'summer', 'autumn', 'winter']
    .filter(s => filterMaterials({ season: s as Parameters<typeof filterMaterials>[0]['season'], audience: 'kids' }).length > 0)
    .map(s => ({ url: `${BASE_URL}/category/season/${s}`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 }))

  const kidsCategoryPages = [
    ...AGES.map(age => ({ url: `${BASE_URL}/category/age/${age}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 })),
    { url: `${BASE_URL}/category/type/coloring`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${BASE_URL}/category/type/adult-coloring`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    ...kidsThemePages,
    ...seasonPages,
  ]

  // Adult category pages (all themes get a page regardless of material count — "準備中" placeholder)
  const adultThemePages = ADULT_THEMES.map(t => ({
    url: `${BASE_URL}/adult/category/theme/${t}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [
    // Kids root
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/materials`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/columns`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    ...columns.map(c => ({
      url: `${BASE_URL}/columns/${c.slug}`,
      lastModified: new Date(c.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    // Adult root
    { url: `${BASE_URL}/adult`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/adult/materials`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    // Site info
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/editorial-policy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    // Maze (independent route)
    { url: `${BASE_URL}/maze`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    ...getAllMazes().map(m => ({
      url: `${BASE_URL}/maze/${m.slug}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    })),
    // Categories
    ...kidsCategoryPages,
    ...adultThemePages,
    // Materials
    ...kidsMaterialPages,
    ...adultMaterialPages,
  ]
}
