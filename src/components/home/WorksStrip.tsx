import Image from 'next/image'
import Link from 'next/link'
import type { GalleryWork } from '@/lib/gallery'
import { normalizeChildAge } from '@/lib/child-age'

type Props = {
  works: GalleryWork[]
  /** materialId → タイトルの辞書 */
  titleMap: Map<string, string>
}

export function WorksStrip({ works, titleMap }: Props) {
  if (works.length === 0) return null

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-[#FFF8EC]/70 to-background">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <div className="font-rounded text-[11px] text-primary tracking-[0.2em] mb-2 font-black">
            — ColoredByKids —
          </div>
          <h2 className="font-rounded text-[24px] md:text-[32px] font-black mb-2">おやこの一枚</h2>
          <p className="text-[13px] text-muted-foreground">
            実際に塗ってみた作品と、ちいさな気づきを編集部が記録しています。
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {works.map(w => {
            const materialTitle = titleMap.get(w.materialId)
            const href = materialTitle ? `/materials/${w.materialId}` : null
            const displayAge = normalizeChildAge(w.childAge)

            const card = (
              <article className="block bg-white border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow h-full">
                <div className="relative aspect-square bg-muted">
                  <Image
                    src={w.photoUrl}
                    alt={materialTitle ? `${materialTitle}を塗った作品 — ${displayAge}` : `${displayAge}の作品`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    unoptimized
                  />
                  <div className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur text-primary text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {displayAge}
                  </div>
                </div>
                <div className="p-2.5 md:p-3 space-y-1">
                  {materialTitle && (
                    <div className="text-[12px] font-bold leading-tight line-clamp-1">{materialTitle}</div>
                  )}
                  <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{w.comment}</p>
                </div>
              </article>
            )

            return (
              <div key={w.id}>
                {href ? <Link href={href}>{card}</Link> : card}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
