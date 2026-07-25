import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { wishlistSchema } from '@/lib/validations'
import { sendConfirmation, sendTeamNotification } from '@/lib/email'

// Best-effort rate limit. This is per-instance memory, so on serverless it caps
// a single burst rather than a distributed flood — enough to stop casual abuse
// of a public form. Move to Redis/Upstash if the form ever gets targeted.
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 5
const hits = new Map<string, number[]>()

function rateLimited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)

  if (hits.size > 5000) hits.clear() // crude memory ceiling
  return recent.length > MAX_PER_WINDOW
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null

  if (rateLimited(ip ?? 'unknown')) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait a minute and try again.' },
      { status: 429 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const parsed = wishlistSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Please check the form and try again.' },
      { status: 400 },
    )
  }

  const { website, gdprConsent, ...data } = parsed.data

  // Honeypot tripped: report success so the bot doesn't retry, but write nothing.
  if (website && website.length > 0) {
    return NextResponse.json({ success: true, ref: 'THANKS' }, { status: 201 })
  }

  let entry
  try {
    entry = await prisma.wishlistEntry.create({
      data: {
        ...data,
        note: data.note ?? null,
        gdprConsent,
        ipAddress: ip,
        source: req.headers.get('referer'),
      },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      // Deliberately not an upsert: upserting on email would let anyone
      // overwrite an existing person's details just by knowing their address.
      return NextResponse.json(
        { error: "You're already on the list — we'll be in touch soon!" },
        { status: 409 },
      )
    }
    console.error('wishlist create failed', err)
    return NextResponse.json(
      { error: 'Could not save your details. Please try again.' },
      { status: 500 },
    )
  }

  // Email must never fail the signup — the entry is already saved.
  const [teamResult, confirmResult] = await Promise.allSettled([
    sendTeamNotification({
      id: entry.id,
      fullName: entry.fullName,
      email: entry.email,
      phone: entry.phone,
      country: entry.country,
      role: entry.role,
      courses: entry.courses,
      note: entry.note ?? undefined,
    }),
    sendConfirmation({
      fullName: entry.fullName,
      email: entry.email,
      courses: entry.courses,
    }),
  ])

  // resend-node resolves with { data, error } rather than throwing on API
  // errors — an unverified sending domain lands here, not in `rejected` — so a
  // fulfilled promise on its own is not proof the mail actually went out.
  function delivered(
    result: PromiseSettledResult<{ error?: unknown } | null>,
    label: string,
  ): boolean {
    if (result.status === 'rejected') {
      console.error(`wishlist ${label} email failed`, result.reason)
      return false
    }
    if (result.value?.error) {
      console.error(`wishlist ${label} email rejected`, result.value.error)
      return false
    }
    return true
  }

  delivered(teamResult, 'team')

  // Reported to the client so the success screen only promises a confirmation
  // email when one was really sent.
  const emailed = delivered(confirmResult, 'confirmation')

  return NextResponse.json(
    { success: true, ref: entry.id.slice(-8).toUpperCase(), emailed },
    { status: 201 },
  )
}
