import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { wishlistSchema } from '@/lib/validations'
import { sendConfirmation, sendCoursesAdded, sendTeamNotification } from '@/lib/email'

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

  // The form shouldn't produce repeats, but dedupe before anything touches the
  // database so a crafted payload can't bloat the array.
  const courses = Array.from(new Set(data.courses))

  let entry
  let existed = false
  let addedCourses: string[] = []

  try {
    entry = await prisma.wishlistEntry.create({
      data: {
        ...data,
        courses,
        note: data.note ?? null,
        gdprConsent,
        ipAddress: ip,
        source: req.headers.get('referer'),
      },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      // Already on the list. Merge in any courses they hadn't picked before —
      // but deliberately leave name, phone, country and role alone, so knowing
      // someone's email can't be used to overwrite their details.
      existed = true

      const current = await prisma.wishlistEntry.findUnique({ where: { email: data.email } })
      if (!current) {
        // Lost a race with a concurrent delete. Vanishingly rare.
        console.error('wishlist conflict but no existing row', data.email)
        return NextResponse.json(
          { error: 'Could not save your details. Please try again.' },
          { status: 500 },
        )
      }

      addedCourses = courses.filter((c) => !current.courses.includes(c))

      entry = addedCourses.length
        ? await prisma.wishlistEntry.update({
            where: { email: data.email },
            data: { courses: [...current.courses, ...addedCourses] },
          })
        : current
    } else {
      console.error('wishlist create failed', err)
      return NextResponse.json(
        { error: 'Could not save your details. Please try again.' },
        { status: 500 },
      )
    }
  }

  // Email must never fail the signup — the entry is already saved.
  //
  // Three cases: a brand new signup gets the team alert + a confirmation; a
  // returning person who picked something new gets told what was added; a
  // returning person who picked nothing new gets no mail at all.
  const sends: Promise<{ error?: unknown } | null>[] = []

  if (!existed) {
    sends.push(
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
    )
  } else if (addedCourses.length) {
    sends.push(
      sendCoursesAdded({
        fullName: entry.fullName,
        email: entry.email,
        added: addedCourses,
        all: entry.courses,
      }),
    )
  }

  const settled = await Promise.allSettled(sends)

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

  // For a new signup the confirmation is the last send; for a returning one it
  // is the only send. Either way it's the mail the success screen refers to.
  const emailed =
    settled.length > 0 &&
    delivered(settled[settled.length - 1], existed ? 'courses-added' : 'confirmation')

  if (!existed && settled.length > 1) delivered(settled[0], 'team')

  return NextResponse.json(
    {
      success: true,
      ref: entry.id.slice(-8).toUpperCase(),
      emailed,
      existed,
      addedCourses,
    },
    { status: existed ? 200 : 201 },
  )
}
