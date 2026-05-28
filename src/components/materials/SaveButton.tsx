'use client'

import { Download, Check, Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { trackEvent } from '@/lib/analytics'

interface Props {
  materialTitle: string
  imageUrl: string
  materialId?: string
}

/** Web Share API でファイル共有が可能か判定 */
function canSharePhotoFile(): boolean {
  if (typeof navigator === 'undefined') return false
  if (!navigator.canShare || !navigator.share) return false
  try {
    // 空ファイルで判定（実際には share で正しいファイルを渡す）
    const probe = new File([''], 'probe.png', { type: 'image/png' })
    return navigator.canShare({ files: [probe] })
  } catch {
    return false
  }
}

export function SaveButton({ materialTitle, imageUrl, materialId }: Props) {
  const [done, setDone] = useState(false)
  const [supportsShare, setSupportsShare] = useState(false)

  useEffect(() => {
    setSupportsShare(canSharePhotoFile())
  }, [])

  async function handleSave() {
    trackEvent('save_click', {
      material_id: materialId ?? '',
      material_title: materialTitle,
    })
    try {
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      const file = new File([blob], `${materialTitle}.png`, { type: 'image/png' })

      // 共有可能なら共有シート起動（iOS: ここから「画像を保存」で写真アプリへ）
      if (supportsShare) {
        try {
          await navigator.share({ files: [file], title: materialTitle })
          setDone(true)
          setTimeout(() => setDone(false), 2500)
          return
        } catch (e) {
          // ユーザーが共有シートをキャンセル → 何もしない（成功扱いにしない）
          const err = e as { name?: string }
          if (err?.name === 'AbortError') return
          // それ以外のエラーはダウンロードにフォールバック
        }
      }

      // 従来のダウンロード（PC・Web Share未対応端末）
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${materialTitle}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setDone(true)
      setTimeout(() => setDone(false), 2500)
    } catch {
      // 最終フォールバック: 別タブで画像を開く
      window.open(imageUrl, '_blank')
    }
  }

  const label = done
    ? '保存しました'
    : supportsShare
      ? '写真に保存'
      : 'ダウンロード'

  return (
    <button
      onClick={handleSave}
      className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium active:scale-95 transition-all border-2 ${
        done
          ? 'bg-[#4FA7B8] text-white border-[#4FA7B8]'
          : 'bg-white text-foreground border-foreground hover:bg-foreground hover:text-white'
      }`}
    >
      {done ? <Check className="w-4 h-4" /> : supportsShare ? <Share2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
      {label}
    </button>
  )
}
