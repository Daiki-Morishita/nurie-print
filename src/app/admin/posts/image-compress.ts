/**
 * ブラウザ側で画像を JPEG 圧縮する。
 * - HEIC/HEIF は heic2any で JPEG 化（Chrome/Firefox は HEIC をデコード不可のため）
 * - 長辺 maxDim にリサイズ、白背景塗りつぶし
 * Vercel body 4.5MB 制限対策 + サムネ表示対応。
 */

async function convertHeicToJpeg(file: File): Promise<File> {
  const looksHeic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)
  if (!looksHeic) return file
  const mod = await import('heic2any')
  const heic2any = mod.default as (opts: { blob: Blob; toType?: string; quality?: number }) => Promise<Blob | Blob[]>
  const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
  const blob = Array.isArray(out) ? out[0] : out
  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
}

export async function compressToJpeg(file: File, maxDim = 1600, quality = 0.82): Promise<File> {
  const workFile = await convertHeicToJpeg(file)

  let bitmap: ImageBitmap | null = null
  try {
    bitmap = await createImageBitmap(workFile)
  } catch {
    bitmap = null
  }

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas context unavailable')

  if (bitmap) {
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
  } else {
    // createImageBitmap 失敗時は Image element fallback
    const img = new window.Image()
    const url = URL.createObjectURL(workFile)
    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('image decode failed'))
        img.src = url
      })
    } finally {
      URL.revokeObjectURL(url)
    }
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  }

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', quality),
  )
  return new File([blob], workFile.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
}
