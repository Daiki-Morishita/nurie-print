'use client'

import { useState, useRef, useCallback } from 'react'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { X, RotateCw, Crop as CropIcon, Sun, Check, RefreshCw } from 'lucide-react'

/**
 * アップロード待ち画像の編集モーダル。
 * トリミング・回転(90°)・明るさ/コントラスト調整 → JPEG で書き出して差し替え。
 */
export function ImageEditModal({
  src,
  onApply,
  onClose,
}: {
  src: string
  onApply: (file: File, previewUrl: string) => void
  onClose: () => void
}) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const [rotation, setRotation] = useState(0) // 0/90/180/270
  const [brightness, setBrightness] = useState(100) // %
  const [contrast, setContrast] = useState(100) // %
  const [saving, setSaving] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const filterStr = `brightness(${brightness}%) contrast(${contrast}%)`

  function reset() {
    setCrop(undefined)
    setCompletedCrop(null)
    setRotation(0)
    setBrightness(100)
    setContrast(100)
  }

  const apply = useCallback(async () => {
    const img = imgRef.current
    if (!img) return
    setSaving(true)
    try {
      // 自然サイズ基準のスケール
      const scaleX = img.naturalWidth / img.width
      const scaleY = img.naturalHeight / img.height

      // クロップ範囲（未指定なら全体）
      const cropX = completedCrop ? completedCrop.x * scaleX : 0
      const cropY = completedCrop ? completedCrop.y * scaleY : 0
      const cropW = completedCrop ? completedCrop.width * scaleX : img.naturalWidth
      const cropH = completedCrop ? completedCrop.height * scaleY : img.naturalHeight

      // 回転後のキャンバスサイズ
      const rotated = rotation === 90 || rotation === 270
      const canvas = document.createElement('canvas')
      canvas.width = rotated ? cropH : cropW
      canvas.height = rotated ? cropW : cropH
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('ctx unavailable')

      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.filter = filterStr
      ctx.save()
      // 回転の中心をキャンバス中央に
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      // クロップ領域を中央に描画
      ctx.drawImage(
        img,
        cropX, cropY, cropW, cropH,
        -cropW / 2, -cropH / 2, cropW, cropH,
      )
      ctx.restore()

      // 1600px に収める
      const maxDim = 1600
      const scale = Math.min(1, maxDim / Math.max(canvas.width, canvas.height))
      let out = canvas
      if (scale < 1) {
        const c2 = document.createElement('canvas')
        c2.width = Math.round(canvas.width * scale)
        c2.height = Math.round(canvas.height * scale)
        const ctx2 = c2.getContext('2d')
        if (!ctx2) throw new Error('ctx2 unavailable')
        ctx2.fillStyle = '#FFFFFF'
        ctx2.fillRect(0, 0, c2.width, c2.height)
        ctx2.drawImage(canvas, 0, 0, c2.width, c2.height)
        out = c2
      }

      const blob = await new Promise<Blob>((resolve, reject) =>
        out.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.85),
      )
      const file = new File([blob], `edited-${Date.now()}.jpg`, { type: 'image/jpeg' })
      const previewUrl = URL.createObjectURL(blob)
      onApply(file, previewUrl)
    } catch {
      // 失敗時は何もせず閉じない
    } finally {
      setSaving(false)
    }
  }, [completedCrop, rotation, filterStr, onApply])

  return (
    <div className="fixed inset-0 z-[140] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-xl flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="font-bold text-sm flex items-center gap-2"><CropIcon className="w-4 h-4" /> 画像を編集</div>
          <button type="button" onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted" aria-label="閉じる">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          <div className="flex justify-center bg-muted/40 rounded-lg p-2 mb-4">
            <ReactCrop
              crop={crop}
              onChange={c => setCrop(c)}
              onComplete={c => setCompletedCrop(c)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={src}
                alt="編集中"
                crossOrigin="anonymous"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  filter: filterStr,
                  maxHeight: '50vh',
                  maxWidth: '100%',
                }}
              />
            </ReactCrop>
          </div>

          {/* 操作 */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRotation(r => (r + 90) % 360)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 border border-border rounded-lg text-sm font-bold hover:bg-muted"
              >
                <RotateCw className="w-4 h-4" /> 90°回転
              </button>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted"
              >
                <RefreshCw className="w-4 h-4" /> リセット
              </button>
            </div>

            <label className="block">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5" /> 明るさ {brightness}%
              </span>
              <input type="range" min={50} max={150} value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="w-full mt-1 accent-primary" />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-muted-foreground">コントラスト {contrast}%</span>
              <input type="range" min={50} max={150} value={contrast} onChange={e => setContrast(Number(e.target.value))} className="w-full mt-1 accent-primary" />
            </label>
            <p className="text-[11px] text-muted-foreground">
              画像の上をドラッグするとトリミング範囲を指定できます（未指定なら全体）。
            </p>
          </div>
        </div>

        <div className="border-t border-border p-3 flex gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2.5 border border-border rounded-lg text-sm font-bold text-muted-foreground hover:bg-muted">
            キャンセル
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Check className="w-4 h-4" /> {saving ? '適用中…' : 'この内容で適用'}
          </button>
        </div>
      </div>
    </div>
  )
}
