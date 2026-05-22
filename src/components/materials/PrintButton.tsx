'use client'

import { Printer } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

export function PrintButton({ materialTitle, materialId }: { materialTitle: string; materialId?: string }) {
  function handleClick() {
    trackEvent('print_click', {
      material_id: materialId ?? '',
      material_title: materialTitle,
    })
    window.print()
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 px-4 rounded-xl font-medium hover:bg-primary/90 active:scale-95 transition-all"
    >
      <Printer className="w-4 h-4" />
      印刷する（無料）
    </button>
  )
}
