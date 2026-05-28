import Link from 'next/link'
import Image from 'next/image'
import { Clock, Users, Star } from 'lucide-react'
import type { Material, Difficulty } from '@/lib/types'
import { FavoriteButton } from '@/components/favorites/FavoriteButton'

// 難易度ごとの色・ラベル（再利用可）
const DIFFICULTY_COLOR: Record<Difficulty, { border: string; text: string; bg: string }> = {
  1: { border: '#7AA875', text: '#3F6334', bg: '#EEF6E9' }, // green: やさしい
  2: { border: '#E8B838', text: '#A87716', bg: '#FBF3DE' }, // yellow: ふつう
  3: { border: '#E66A2C', text: '#9F4516', bg: '#FBE7D8' }, // orange: むずかしい
  4: { border: '#C25A6E', text: '#83384D', bg: '#F7DEE4' }, // rose: とてもむずかしい
}

export function DifficultyBadge({ level }: { level: Difficulty }) {
  const c = DIFFICULTY_COLOR[level]
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[12px] px-2.5 py-1 rounded-full font-bold border-2 shadow-sm"
      style={{ borderColor: c.border, color: c.text, background: c.bg }}
    >
      {'★'.repeat(level)}
    </span>
  )
}

interface MaterialCardProps {
  material: Material
}

export function MaterialCard({ material }: MaterialCardProps) {
  const ageLabel = material.ageMin === material.ageMax
    ? `${material.ageMin}歳`
    : `${material.ageMin}〜${material.ageMax}歳`

  const hasImage = !!material.imageUrl

  return (
    <Link
      href={`/materials/${material.id}`}
      className="group bg-white border border-border rounded-lg overflow-hidden hover:border-primary hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
    >
      {/* Preview area */}
      <div className="relative bg-background aspect-[1.414/1] flex items-center justify-center overflow-hidden">
        {hasImage ? (
          <Image
            src={material.imageUrl}
            alt={material.title}
            width={420}
            height={297}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-200"
            unoptimized
          />
        ) : (
          <div className="text-5xl select-none opacity-30">🎨</div>
        )}
        {material.popular && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center gap-1 text-[12px] bg-[#E66A2C] text-white px-2.5 py-1 rounded-full font-black shadow-sm border-2 border-white">
              <Star className="w-3 h-3 fill-white" />
              にんき
            </span>
          </div>
        )}
        <div className="absolute bottom-2 left-2">
          <DifficultyBadge level={material.difficulty} />
        </div>
        <FavoriteButton materialId={material.id} size="sm" variant="overlay" />
      </div>

      {/* Card content */}
      <div className="p-3.5 flex flex-col gap-2 flex-1">
        <h3 className="text-material-title-md group-hover:text-primary transition-colors line-clamp-2">
          {material.title}
        </h3>

        {material.description && (
          <p className="text-[12px] text-primary/85 leading-relaxed line-clamp-2 border-l-2 border-primary/30 pl-2">
            {material.description.replace(/[。、]+$/, '')}
          </p>
        )}

        <div className="flex items-center justify-between text-[12px] text-muted-foreground mt-auto pt-2 border-t border-border">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {ageLabel}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {material.duration}分
          </span>
        </div>
      </div>
    </Link>
  )
}
