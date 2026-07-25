import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Next.js loads .env files itself, but this script runs under plain node (via
// tsx), which does not. Loaded in precedence order — dotenv never overwrites a
// variable that is already set, so .env.local and the real shell env both win.
config({ path: '.env.local' })
config({ path: '.env' })

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME ?? 'Tween Admin'

  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding')
  }

  const hashed = await bcrypt.hash(password, 12)

  const admin = await prisma.adminUser.upsert({
    where: { email: email.toLowerCase() },
    update: { password: hashed, name },
    create: { email: email.toLowerCase(), password: hashed, name },
  })

  console.log(`Admin ready: ${admin.email}`)
  if (password === 'ChangeMe123!') {
    console.warn('WARNING: you seeded the example password. Change ADMIN_PASSWORD and re-run.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
