import { prisma } from '@/lib/db'

export type GalleryWork = {
  id: string
  materialId: string
  photoUrl: string
  videoUrl: string | null
  childAge: string
  duration: number | null
  tools: string | null
  comment: string
  createdAt: Date
}

/** 指定素材の公開済み作品を取得（新しい順） */
export async function getWorksForMaterial(materialId: string): Promise<GalleryWork[]> {
  const rows = await prisma.galleryWork.findMany({
    where: { materialId, published: true },
    orderBy: { createdAt: 'desc' },
    take: 12,
  })
  return rows
}

/** 全作品一覧（管理画面用） */
export async function listAllWorks(limit = 100) {
  return prisma.galleryWork.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
