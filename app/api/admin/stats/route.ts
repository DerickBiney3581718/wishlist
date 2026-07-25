import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [total, entries] = await Promise.all([
    prisma.wishlistEntry.count(),
    prisma.wishlistEntry.findMany({
      select: { courses: true, country: true, role: true, createdAt: true },
    }),
  ])

  const courseMap: Record<string, number> = {}
  entries.forEach((e) =>
    e.courses.forEach((c) => {
      courseMap[c] = (courseMap[c] ?? 0) + 1
    }),
  )
  const topCourses = Object.entries(courseMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({
      name: name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      count,
    }))

  const countryMap: Record<string, number> = {}
  entries.forEach((e) => {
    countryMap[e.country] = (countryMap[e.country] ?? 0) + 1
  })
  const topCountries = Object.entries(countryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))

  const now = new Date()
  const daily = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (13 - i))
    const ds = d.toISOString().split('T')[0]
    return {
      date: ds.slice(5),
      count: entries.filter((e) => e.createdAt.toISOString().split('T')[0] === ds).length,
    }
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  return NextResponse.json({
    total,
    todayCount: entries.filter((e) => new Date(e.createdAt) >= today).length,
    weekCount: entries.filter((e) => new Date(e.createdAt) >= weekAgo).length,
    topCourses,
    topCountries,
    daily,
  })
}
