'use client'

import { Download, Check } from 'lucide-react'
import { useState } from 'react'
import { trackEvent } from '@/lib/analytics'

interface Props {
  materialTitle: string
  imageUrl: string
  materialId?: string
}

export function SaveButton({ materialTitle, imageUrl, materialId }: Props) {
  const [done, setDone] = useState(false)

  async function handleSave() {
    trackEvent('save_click', {
      material_id: materialId ?? '',
      material_title: materialTitle,
    })
    try {
      const res = await fetch(imageUrl)
      const blob = await res.blob()
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
      // Fallback for browsers that block fetch+download: open in new tab
      window.open(imageUrl, '_blank')
    }
  }

  return (
    <button
      onClick={handleSave}
      className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium active:scale-95 transition-all border-2 ${
        done
          ? 'bg-[#4FA7B8] text-white border-[#4FA7B8]'
          : 'bg-white text-foreground border-foreground hover:bg-foreground hover:text-white'
      }`}
    >
      {done ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
      {done ? '保存しました' : '保存・ダウンロード'}
    </button>
  )
}
