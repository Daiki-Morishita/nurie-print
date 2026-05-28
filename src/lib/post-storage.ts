/**
 * 投稿画像ストレージヘルパー。
 *
 * SUPABASE_URL / SUPABASE_SECRET_KEY が揃っていれば Supabase Storage の
 * "post-images" バケットに保存。揃っていなければ public/uploads/posts/ にローカル保存。
 *
 * 出力フォーマット: WebP q=82, 長辺1920px に最適化。
 */
import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY
const BUCKET = 'post-images'
const LOCAL_DIR = path.join(process.cwd(), 'public', 'uploads', 'posts')
const LOCAL_PREFIX = '/uploads/posts'

function useSupabase(): boolean {
  return !!(SUPABASE_URL && SUPABASE_KEY)
}

async function optimize(file: Buffer): Promise<Buffer> {
  return sharp(file)
    .rotate()
    .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer()
}

function makeFilename(): string {
  const stamp = Date.now()
  const rand = Math.random().toString(36).slice(2, 8)
  return `post-${stamp}-${rand}.webp`
}

async function ensureBucket(): Promise<void> {
  if (!useSupabase()) return
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
      apikey: SUPABASE_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  })
  if (res.status === 409) return
  if (!res.ok) {
    const text = await res.text()
    if (text.includes('already exists') || text.includes('duplicate')) return
    throw new Error(`bucket作成失敗: ${res.status} ${text}`)
  }
}

export async function uploadPostImage(file: Buffer): Promise<string> {
  const optimized = await optimize(file)
  const filename = makeFilename()

  if (useSupabase()) {
    await ensureBucket()
    const body = new Blob([new Uint8Array(optimized)], { type: 'image/webp' })
    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apikey: SUPABASE_KEY!,
        'Content-Type': 'image/webp',
        'x-upsert': 'false',
      },
      body,
    })
    if (!uploadRes.ok) {
      const text = await uploadRes.text()
      throw new Error(`Supabase upload失敗: ${uploadRes.status} ${text}`)
    }
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`
  }

  // ローカル
  await fs.mkdir(LOCAL_DIR, { recursive: true })
  await fs.writeFile(path.join(LOCAL_DIR, filename), optimized)
  return `${LOCAL_PREFIX}/${filename}`
}

export async function deletePostImage(publicUrl: string): Promise<void> {
  if (useSupabase()) {
    const prefix = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`
    if (publicUrl.startsWith(prefix)) {
      const filename = publicUrl.slice(prefix.length)
      await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY! },
      }).catch(() => {})
    }
    return
  }
  if (!publicUrl.startsWith(LOCAL_PREFIX + '/')) return
  const filename = publicUrl.slice(LOCAL_PREFIX.length + 1)
  if (filename.includes('/') || filename.includes('..')) return
  try {
    await fs.unlink(path.join(LOCAL_DIR, filename))
  } catch {
    // ignore
  }
}
