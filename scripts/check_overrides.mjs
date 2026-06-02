import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
config({ path: '.env.local' })
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

// 全 overrides を取得して、コウノトリ含む notes を探す
const overrides = await prisma.materialOverride.findMany()
console.log('Total overrides:', overrides.length)
for (const o of overrides) {
  if ((o.illustNotes ?? '').includes('コウノトリ') || (o.illustNotes ?? '').includes('こうのとり')) {
    console.log(`MATCH: ${o.materialId} notes="${o.illustNotes}"`)
  }
}

// rainbow / cicada のすべて
console.log('---rainbow + cicada overrides:')
for (const o of overrides) {
  if (o.materialId.startsWith('rainbow') || o.materialId.startsWith('cicada')) {
    console.log(`${o.materialId}: status=${o.imageStatus} notes_len=${(o.illustNotes ?? '').length}`)
  }
}

await prisma.$disconnect()
await pool.end()
