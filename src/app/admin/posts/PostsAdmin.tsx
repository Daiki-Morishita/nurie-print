'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { AlertCircle, Check, X } from 'lucide-react'
import { PostComposer } from './PostComposer'
import { PostList } from './PostList'
import { EditPostModal } from './EditPostModal'

export type PostDTO = {
  id: string
  title: string | null
  body: string
  publishedAt: string | null
  materialIds: string[]
  images: { id: string; url: string; order: number }[]
  createdAt: string
  updatedAt: string
}

type Option = { id: string; title: string }

export function PostsAdmin({
  featuredOptions,
  allMaterialTitles,
  initialPosts,
}: {
  featuredOptions: Option[]
  allMaterialTitles: [string, string][]
  initialPosts: PostDTO[]
}) {
  const [posts, setPosts] = useState<PostDTO[]>(initialPosts)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editing, setEditing] = useState<PostDTO | null>(null)

  const titleMap = useMemo(() => new Map(allMaterialTitles), [allMaterialTitles])

  function handleCreated(post: PostDTO) {
    setPosts(ps => [post, ...ps])
    setSuccess('投稿を作成しました')
    setTimeout(() => setSuccess(null), 4000)
  }
  function handleUpdated(post: PostDTO) {
    setPosts(ps => ps.map(p => (p.id === post.id ? post : p)))
    setSuccess('投稿を更新しました')
    setTimeout(() => setSuccess(null), 4000)
  }
  function handleDeleted(id: string) {
    setPosts(ps => ps.filter(p => p.id !== id))
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
      <div className="flex items-baseline justify-between mb-5">
        <h1 className="text-xl sm:text-2xl font-black">今日のいちまい 管理</h1>
        <Link href="/admin" className="text-xs sm:text-sm text-primary hover:underline shrink-0">
          ← 素材管理に戻る
        </Link>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-300 text-red-800 rounded-lg text-sm flex items-start gap-2 sticky top-2 z-10 shadow-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} aria-label="閉じる"><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="mb-3 p-3 bg-green-50 border border-green-300 text-green-800 rounded-lg text-sm flex items-center gap-2 sticky top-2 z-10 shadow-sm">
          <Check className="w-4 h-4" />
          <span className="flex-1">{success}</span>
          <button onClick={() => setSuccess(null)} aria-label="閉じる"><X className="w-4 h-4" /></button>
        </div>
      )}

      <PostComposer
        featuredOptions={featuredOptions}
        titleMap={titleMap}
        onCreated={handleCreated}
        onError={setError}
      />

      <PostList
        posts={posts}
        titleMap={titleMap}
        onEdit={setEditing}
      />

      {editing && (
        <EditPostModal
          post={editing}
          featuredOptions={featuredOptions}
          titleMap={titleMap}
          onClose={() => setEditing(null)}
          onUpdate={handleUpdated}
          onDelete={handleDeleted}
        />
      )}
    </div>
  )
}
