'use client'

import { MAZE_DIFFICULTY_LABELS, type MazeDifficulty } from '@/lib/maze/types'
import styles from './maze.module.css'

const MAZE_THUMB_BASE = 'https://hdhogsjmdowevijxooiq.supabase.co/storage/v1/object/public/maze-thumbs'

export type MazeGridItem = {
  slug: string
  no: number
  difficulty: MazeDifficulty
  age_label: string
  turns: number
}

// 320件をサーバー側でJSXツリーとして書き出すと、RSCのhydrationペイロードに
// ノードごとの型/props記述が重複して載りHTMLが肥大化する（1.97MB事故の残存要因）。
// ここではクライアントコンポーネントに軽量タプル配列だけを渡し、カードのJSX自体は
// 共有JSチャンク側に持たせることでペイロード重複を避ける。SSR自体は行われるため
// 初回HTML・クローラビリティは維持される。
export function MazeGrid({ items }: { items: MazeGridItem[] }) {
  return (
    <div className={styles['maze-grid']}>
      {items.map(m => (
        <a key={m.slug} href={`/maze/${m.slug}`} className={styles['maze-card']}>
          <div className={styles['maze-card-thumb']}>
            {/* eslint-disable-next-line @next/next/no-img-element -- next/image はクライアントコンポーネントで320件分のprops重複がRSCペイロードを肥大化させるため、静的サムネにはプレーンimgを使う */}
            <img
              src={`${MAZE_THUMB_BASE}/${m.slug}.png`}
              alt=""
              width={480}
              height={360}
              className="w-[90%] h-[90%] object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className={styles['maze-card-title']}>{`${MAZE_DIFFICULTY_LABELS[m.difficulty]} No.${String(m.no).padStart(3, '0')}`}</div>
          <div className={styles['maze-card-meta']}>{`${m.age_label}・ターン${m.turns}回`}</div>
        </a>
      ))}
    </div>
  )
}
