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
    const probe = new File([''], 'probe.png', { type: 'image/png' })
    return navigator.canShare({ files: [probe] })
  } catch {
    return false
  }
}

/**
 * 画像の右下に「{title} ｜ ぬりえプリント」を焼き込んだ Blob を返す。
 * 印刷時の右下ブランディングと同じトーン・配置。
 */
async function composeBrandedImage(imageUrl: string, title: string): Promise<Blob> {
  const res = await fetch(imageUrl)
  const srcBlob = await res.blob()
  const blobUrl = URL.createObjectURL(srcBlob)
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('image load failed'))
      img.src = blobUrl
    })

    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas context unavailable')

    // 透明背景PNG対策で白塗りつぶし
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)

    // 右下ブランディング: 印刷版と同じトーン (#999, sans-serif, 約8pt相当)
    const w = canvas.width
    const fontPx = Math.max(14, Math.round(w * 0.013))  // 画像幅の約1.3%、最低14px
    ctx.font = `${fontPx}px "Hiragino Sans", "Yu Gothic", system-ui, sans-serif`
    ctx.fillStyle = '#999999'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    const padding = Math.round(w * 0.015)
    const text = `${title} ｜ ぬりえプリント`
    ctx.fillText(text, w - padding, canvas.height - padding)

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
    })
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
}

export function SaveButton({ materialTitle, imageUrl, materialId }: Props) {
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [supportsShare, setSupportsShare] = useState(false)

  useEffect(() => {
    setSupportsShare(canSharePhotoFile())
  }, [])

  async function handleSave() {
    if (busy) return
    setBusy(true)
    trackEvent('save_click', {
      material_id: materialId ?? '',
      material_title: materialTitle,
    })
    try {
      // ブランディング焼き込み済みの画像を生成
      const branded = await composeBrandedImage(imageUrl, materialTitle)
      const file = new File([branded], `${materialTitle}.png`, { type: 'image/png' })

      // 共有可能なら共有シート起動（iOS: 「画像を保存」で写真アプリへ）
      if (supportsShare) {
        try {
          await navigator.share({ files: [file], title: materialTitle })
          setDone(true)
          setTimeout(() => setDone(false), 2500)
          return
        } catch (e) {
          const err = e as { name?: string }
          if (err?.name === 'AbortError') return  // キャンセル時は無音
          // 他のエラーはダウンロードにフォールバック
        }
      }

      // PC / Web Share 未対応端末: 従来のダウンロード
      const url = URL.createObjectURL(branded)
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
      // canvas 合成 or fetch エラー: ブランディングなしで素の画像を別タブで開く
      window.open(imageUrl, '_blank')
    } finally {
      setBusy(false)
    }
  }

  const label = busy
    ? '準備中…'
    : done
      ? '保存しました'
      : supportsShare
        ? '写真に保存'
        : 'ダウンロード'

  return (
    <button
      onClick={handleSave}
      disabled={busy}
      className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium active:scale-95 transition-all border-2 ${
        done
          ? 'bg-[#4FA7B8] text-white border-[#4FA7B8]'
          : 'bg-white text-foreground border-foreground hover:bg-foreground hover:text-white'
      } disabled:opacity-60`}
    >
      {done ? <Check className="w-4 h-4" /> : supportsShare ? <Share2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
      {label}
    </button>
  )
}
