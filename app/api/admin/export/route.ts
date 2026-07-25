import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Quote every cell, and neutralise formula injection: a cell starting with
 * = + - @ (or tab/CR) is executed by Excel and Sheets when the file is opened,
 * so a signup named `=HYPERLINK(...)` would run against whoever opens the export.
 * Prefixing with a single quote makes it inert text.
 *
 * `+` and `-` are only treated as dangerous when what follows isn't purely a
 * phone number — otherwise every `+233…` in the phone column gets mangled.
 * `+233241234567` evaluates to a harmless number; `+HYPERLINK(…)` does not.
 */
const PHONE_LIKE = /^[+-][\d\s()\-.]*$/

function csvCell(value: unknown): string {
  const raw = value == null ? '' : String(value)
  const dangerous =
    /^[=@\t\r]/.test(raw) || (/^[+-]/.test(raw) && !PHONE_LIKE.test(raw))
  return `"${(dangerous ? `'${raw}` : raw).replace(/"/g, '""')}"`
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const entries = await prisma.wishlistEntry.findMany({ orderBy: { createdAt: 'desc' } })

  const csv = [
    ['ID', 'Full Name', 'Email', 'Phone', 'Country', 'Role', 'Courses', 'Note', 'Signed Up']
      .map(csvCell)
      .join(','),
    ...entries.map((e) =>
      [
        e.id,
        e.fullName,
        e.email,
        e.phone,
        e.country,
        e.role,
        e.courses.join('; '),
        e.note ?? '',
        e.createdAt.toISOString(),
      ]
        .map(csvCell)
        .join(','),
    ),
  ].join('\r\n')

  const filename = `tween-wishlist-${new Date().toISOString().split('T')[0]}.csv`

  // BOM so Excel reads the file as UTF-8 (names with accents survive).
  return new NextResponse('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
