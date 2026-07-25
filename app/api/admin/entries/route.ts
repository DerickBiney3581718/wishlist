import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20') || 20))
  const search = searchParams.get('search') ?? ''
  const course = searchParams.get('course') ?? ''
  const country = searchParams.get('country') ?? ''

  const where = {
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(course ? { courses: { has: course } } : {}),
    ...(country ? { country: { equals: country, mode: 'insensitive' as const } } : {}),
  }

  const [entries, total] = await Promise.all([
    prisma.wishlistEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.wishlistEntry.count({ where }),
  ])

  return NextResponse.json({ entries, total, page, pages: Math.ceil(total / limit) })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let id: unknown
  try {
    ;({ id } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  if (typeof id !== 'string' || !id) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  try {
    await prisma.wishlistEntry.delete({ where: { id } })
  } catch {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
