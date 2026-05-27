'use client'

import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useFavorites } from './FavoritesProvider'

interface Props {
  materialId: string
  size?: 'sm' | 'md' | 'lg'
  /** show as floating overlay on card image */
  variant?: 'overlay' | 'inline'
  className?: string
}

export function FavoriteButton({ materialId, size = 'md', variant = 'overlay', className = '' }: Props) {
  const router = useRouter()
  const { isFavorite, toggle, isAnonymous } = useFavorites()
  const [showLimitModal, setShowLimitModal] = useState(false)
  const favorited = isFavorite(materialId)

  const dim = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9'
  const iconDim = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const result = await toggle(materialId)
    if (!result.ok && result.reason === 'limit_reached') {
      setShowLimitModal(true)
    }
  }

  const overlayClass = variant === 'overlay'
    ? `absolute top-2 right-2 z-10 ${dim} rounded-full bg-white/95 backdrop-blur shadow-md border border-border flex items-center justify-center hover:scale-110 active:scale-95 transition-all`
    : `${dim} rounded-full bg-white border border-border flex items-center justify-center hover:scale-110 active:scale-95 transition-all`

  return (
    <>
      <button
        onClick={handleClick}
        aria-label={favorited ? 'お気に入りから削除' : 'お気に入りに追加'}
        className={`${overlayClass} ${className}`}
      >
        <Heart
          className={`${iconDim} transition-colors ${favorited ? 'fill-[#E66A2C] text-[#E66A2C]' : 'text-foreground/60'}`}
        />
      </button>

      {/* Limit reached modal */}
      {showLimitModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4" onClick={() => setShowLimitModal(false)}>
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-4xl mb-3">🎈</div>
            <h3 className="font-rounded font-black text-[18px] mb-2">お気に入りの上限です</h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-5">
              {isAnonymous ? (
                <>このブラウザでは <strong className="text-foreground">10 件まで</strong> 保存できます。<br />既存のお気に入りを整理するか、ログインしてクラウドに保存しましょう。</>
              ) : (
                <><strong className="text-foreground">10 件まで</strong> 保存できます。<br />既存のお気に入りを整理してから新しい教材を追加してください。</>
              )}
            </p>
            <div className="flex gap-2">
              {isAnonymous ? (
                <>
                  <button
                    onClick={() => setShowLimitModal(false)}
                    className="flex-1 bg-muted text-foreground py-2.5 rounded-lg text-[13px] font-medium hover:bg-muted/80 transition-colors"
                  >
                    整理する
                  </button>
                  <button
                    onClick={() => router.push('/login')}
                    className="flex-1 bg-primary text-white py-2.5 rounded-lg text-[13px] font-rounded font-black hover:opacity-90 transition-colors"
                  >
                    ログイン
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowLimitModal(false)}
                  className="flex-1 bg-primary text-white py-2.5 rounded-lg text-[13px] font-rounded font-black hover:opacity-90 transition-colors"
                >
                  整理する
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
