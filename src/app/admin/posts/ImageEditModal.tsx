'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { X, RotateCw, Crop as CropIcon, Sun, Check, RefreshCw } from 'lucide-react'

/**
 * アップロード待ち画像の編集モーダル。
 * トリミング・回転(90°)・明るさ/コントラスト調整 → JPEG で書き出して差し替え。
 *
 * 回転はプレビューとcrop座標を一致させるため「画像に焼き込んだ派生画像(workSrc)」を
 * ReactCrop に渡す方式。明るさ/コントラストは軽量なので CSS filter で即時プレビューし、
 * 書き出し時に canvas filter で反映する。
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
  const [workSrc, setWorkSrc] = useState(src)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const [rotation, setRotation] = useState(0) // 0/90/180/270（焼き込み済みの累積角）
  const [brightness, setBrightness] = useState(100) // %
  const [contrast, setContrast] = useState(100) // %
  const [saving, setSaving] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const filterStr = `brightness(${brightness}%) contrast(${contrast}%)`

  /** 元画像に rot 度を焼き込んだ dataURL を生成して workSrc にする */
  const bakeRotation = useCallback(async (rot: number) => {
    if (rot === 0) {
      setWorkSrc(src)
      return
    }
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('load failed'))
      img.src = src
    })
    const rotated = rot === 90 || rot === 270
    const canvas = document.createElement('canvas')
    canvas.width = rotated ? img.naturalHeight : img.naturalWidth
    canvas.height = rotated ? img.naturalWidth : img.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rot * Math.PI) / 180)
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
    setWorkSrc(canvas.toDataURL('image/jpeg', 0.92))
  }, [src])

  // rotation 変更時に焼き込み（crop はリセット）
  useEffect(() => {
    setCrop(undefined)
    setCompletedCrop(null)
    bakeRotation(rotation)
  }, [rotation, bakeRotation])

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
      const scaleX = img.naturalWidth / img.width
      const scaleY = img.naturalHeight / img.height

      const cropX = completedCrop ? completedCrop.x * scaleX : 0
      const cropY = completedCrop ? completedCrop.y * scaleY : 0
      const cropW = completedCrop ? completedCrop.width * scaleX : img.naturalWidth
      const cropH = completedCrop ? completedCrop.height * scaleY : img.naturalHeight

      // 1600px に収める
      const maxDim = 1600
      const scale = Math.min(1, maxDim / Math.max(cropW, cropH))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(cropW * scale)
      canvas.height = Math.round(cropH * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('ctx unavailable')

      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.filter = filterStr
      // workSrc は回転済みなので、ここでは crop + 縮小のみ
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height)

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.85),
      )
      const file = new File([blob], `edited-${Date.now()}.jpg`, { type: 'image/jpeg' })
      const previewUrl = URL.createObjectURL(blob)
      onApply(file, previewUrl)
    } catch {
      // 失敗時は閉じない
    } finally {
      setSaving(false)
    }
  }, [completedCrop, filterStr, onApply])

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
                src={workSrc}
                alt="編集中"
                crossOrigin="anonymous"
                style={{ filter: filterStr, maxHeight: '50vh', maxWidth: '100%', display: 'block' }}
              />
            </ReactCrop>
          </div>

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
