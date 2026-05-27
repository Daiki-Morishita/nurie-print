import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getMazeBySlug, getAllSlugs } from '@/lib/maze/loader'
import { MazeSheet } from '../MazeSheet'
import styles from '../maze.module.css'

type Params = { slug: string }

export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const maze = getMazeBySlug(slug)
  if (!maze) return { title: 'めいろが みつかりません｜ぬりえプリント' }
  const title = `しかくのめいろ ${maze.difficulty_label} No.${String(maze.no).padStart(3, '0')}｜${maze.age_label}むけ｜ぬりえプリント`
  const desc = `${maze.age_label}むけのしかくのめいろ ${maze.difficulty_label}。ターン${maze.turns}回。印刷無料・登録不要のA4プリント。`
  return {
    title,
    description: desc,
    alternates: { canonical: `https://nurie-print.com/maze/${maze.slug}` },
    robots: { index: false, follow: true },
    openGraph: { title, description: desc, url: `https://nurie-print.com/maze/${maze.slug}`, type: 'article' },
  }
}

export default async function MazeDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const maze = getMazeBySlug(slug)
  if (!maze) notFound()
  return (
    <div className={styles['page-bg']}>
      <MazeSheet maze={maze} />
    </div>
  )
}
