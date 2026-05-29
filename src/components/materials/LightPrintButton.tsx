'use client'

import { Pencil } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

/**
 * うす色印刷ボタン。線画を薄いグレーで印刷し、上から線をなぞって描く練習用。
 * body に print-light クラスを付けて印刷 → 印刷後に afterprint で除去。
 */
export function LightPrintButton({ materialTitle, materialId }: { materialTitle: string; materialId?: string }) {
  function handleClick() {
    trackEvent('light_print_click', {
      material_id: materialId ?? '',
      material_title: materialTitle,
    })
    document.body.classList.add('print-light')
    // 印刷ダイアログを閉じたらクラス除去（afterprint。保険で setTimeout も）
    const cleanup = () => document.body.classList.remove('print-light')
    window.addEventListener('afterprint', cleanup, { once: true })
    setTimeout(cleanup, 60000)
    window.print()
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className="w-full flex items-center justify-center gap-2 bg-white text-foreground border border-border py-2.5 px-4 rounded-xl font-medium hover:bg-muted active:scale-95 transition-all"
      >
        <Pencil className="w-4 h-4" />
        うす色で印刷
      </button>
      <p className="text-[11px] text-muted-foreground text-center mt-1.5">
        うすい線をなぞって、お絵かきの練習にも ✏️
      </p>
    </div>
  )
}
