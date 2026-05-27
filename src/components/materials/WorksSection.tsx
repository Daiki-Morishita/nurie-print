import Image from 'next/image'
import { Clock, Palette } from 'lucide-react'
import type { GalleryWork } from '@/lib/gallery'

export function WorksSection({ works, materialTitle }: { works: GalleryWork[]; materialTitle: string }) {
  if (works.length === 0) return null

  return (
    <section className="mt-10 mb-2 bg-gradient-to-br from-[#FFF8EC] to-white border border-border rounded-2xl p-6 md:p-8">
      <div className="font-rounded font-bold text-[11px] text-primary mb-1 tracking-[0.1em]">— Real Works —</div>
      <h2 className="font-rounded text-[20px] md:text-[24px] font-black mb-2">実際に塗ってみました</h2>
      <p className="text-[13px] text-muted-foreground mb-6">
        「{materialTitle}」を実際に塗ってみたときの作品と気づきを{works.length}件ご紹介します。
      </p>

      <div className="grid sm:grid-cols-2 gap-5 md:gap-6">
        {works.map(w => (
          <article key={w.id} className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="relative aspect-[4/3] bg-muted">
              <Image
                src={w.photoUrl}
                alt={`${materialTitle}を塗った作品 — ${w.childAge}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 50vw"
                unoptimized
              />
            </div>
            <div className="p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-[12px] font-bold">
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">{w.childAge}</span>
                <span className="text-muted-foreground text-[11px]">
                  {new Date(w.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' })}
                </span>
              </div>
              <p className="text-[13px] leading-relaxed text-foreground/90">{w.comment}</p>
              {(w.duration || w.tools) && (
                <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-muted-foreground border-t border-border/60 pt-2">
                  {w.duration && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />{w.duration}分
                    </span>
                  )}
                  {w.tools && (
                    <span className="inline-flex items-center gap-1">
                      <Palette className="w-3 h-3" />{w.tools}
                    </span>
                  )}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
