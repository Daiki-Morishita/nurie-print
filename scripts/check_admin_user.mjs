import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'

config({ path: '.env.local' })

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(s => s.trim()).filter(Boolean)
console.log('ADMIN_EMAILS:', adminEmails)

// 第1引数があれば、その password で既存ユーザーに設定 or 新規作成
const setPassword = process.argv[2]
if (setPassword) console.log(`💡 password "${setPassword}" を設定します`)

for (const email of adminEmails) {
  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    if (setPassword) {
      const hashed = await bcrypt.hash(setPassword, 12)
      user = await prisma.user.create({ data: { email, password: hashed } })
      console.log(`✨ ${email}: 新規作成（passwordセット済み）`)
    } else {
      console.log(`❌ ${email}: User なし。第1引数にパスワードを渡せば作成します`)
    }
    continue
  }
  console.log(`✅ ${email}: 存在 (id=${user.id}, password=${user.password ? '設定済み' : '未設定'})`)
  if (setPassword) {
    const hashed = await bcrypt.hash(setPassword, 12)
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })
    console.log(`   → password を更新しました`)
  }
}

await prisma.$disconnect()
await pool.end()
