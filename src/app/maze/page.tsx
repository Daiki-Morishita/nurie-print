import type { Metadata } from 'next'
import { getMazesByShape } from '@/lib/maze/loader'
import { MAZE_SHAPE_ORDER, MAZE_SHAPE_LABELS } from '@/lib/maze/types'
import { MazeGrid, type MazeGridItem } from './MazeGrid'
import styles from './maze.module.css'

// 一覧のサムネはビルド時に scripts/pregenerate_maze_thumbs.py が生成した静止画（PNG化した buildMazeSvg 出力）を参照する。
// 一覧でSVGを都度インライン展開すると320枚分がHTMLに直接載り、ページが2MB近くまで肥大化するため（index対象ページの品質異常）。

export const metadata: Metadata = {
  title: 'めいろプリント 無料｜2〜6歳 / かんたん〜とてもむずかしい｜ぬりえプリント',
  description: '2歳から6歳までの子ども向け迷路プリントを無料ダウンロード。かんたん・ふつう・むずかしい・とてもむずかしいの4段階。印刷してすぐ遊べる、登録不要のA4プリントです。',
  alternates: { canonical: 'https://nurie-print.com/maze' },
  openGraph: {
    title: 'めいろプリント 無料｜ぬりえプリント',
    description: '2〜6歳むけ・印刷無料・登録不要のめいろプリント',
    url: 'https://nurie-print.com/maze',
    type: 'website',
  },
}

export default function MazeIndexPage() {
  return (
    <div className={styles['page-bg']}>
      <div className={styles['list-container']}>
        <h1 className={styles['list-title']}>めいろプリント</h1>
        <p className={styles['list-lead']}>
          2歳〜6歳までむけの、しかくのめいろ。難易度4段階。印刷無料・登録不要。
        </p>

        {MAZE_SHAPE_ORDER.map(shape => {
          const items = getMazesByShape(shape)
          if (items.length === 0) return null
          const gridItems: MazeGridItem[] = items.map(m => ({
            slug: m.slug,
            no: m.no,
            difficulty: m.difficulty,
            age_label: m.age_label,
            turns: m.turns,
          }))
          return (
            <section key={shape} className={styles['difficulty-section']}>
              <h2 className={styles['difficulty-heading']}>
                <span className={styles['difficulty-chip']}>{MAZE_SHAPE_LABELS[shape]}</span>
                <span style={{ fontWeight: 400, fontSize: 14, color: '#7E7066' }}>
                  {items.length}枚
                </span>
              </h2>
              <MazeGrid items={gridItems} />
            </section>
          )
        })}
      </div>
    </div>
  )
}
