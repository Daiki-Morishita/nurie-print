import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import fs from 'fs'

config({ path: '.env.local' })

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

// data.ts から有効な素材IDを集める
const src = fs.readFileSync('src/lib/data.ts', 'utf8')
const validIds = new Set([...src.matchAll(/id: '([^']+)'/g)].map(m => m[1]))
console.log('有効素材ID:', validIds.size)

const posts = await prisma.post.findMany({ select: { id: true, materialIds: true } })
let fixed = 0
for (const p of posts) {
  const cleaned = p.materialIds.filter(id => validIds.has(id))
  if (cleaned.length !== p.materialIds.length) {
    const removed = p.materialIds.filter(id => !validIds.has(id))
    await prisma.post.update({ where: { id: p.id }, data: { materialIds: cleaned } })
    console.log(`post ${p.id}: 除去 ${JSON.stringify(removed)}`)
    fixed++
  }
}
console.log(`\n修正した投稿: ${fixed}件 / 全 ${posts.length}件`)

await prisma.$disconnect()
await pool.end()
