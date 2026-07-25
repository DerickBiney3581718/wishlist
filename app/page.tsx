'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { wishlistSchema, type WishlistInput } from '@/lib/validations'
import { COURSES, COUNTRIES, ROLES } from '@/lib/constants'
import styles from './page.module.css'

export default function WishlistPage() {
  const [submitted, setSubmitted] = useState(false)
  const [ref, setRef] = useState('')
  const [emailed, setEmailed] = useState(false)
  const [existed, setExisted] = useState(false)
  const [addedCourses, setAddedCourses] = useState<string[]>([])
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WishlistInput>({
    resolver: zodResolver(wishlistSchema),
    defaultValues: { courses: [] },
  })

  const selectedCourses = watch('courses') ?? []

  function toggleCourse(id: string) {
    const curr = selectedCourses
    setValue(
      'courses',
      curr.includes(id) ? curr.filter((c: string) => c !== id) : [...curr, id],
      { shouldValidate: true }
    )
  }

  async function onSubmit(data: WishlistInput) {
    setServerError('')
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (res.ok) {
        setRef(json.ref ?? '')
        setEmailed(Boolean(json.emailed))
        setExisted(Boolean(json.existed))
        setAddedCourses(Array.isArray(json.addedCourses) ? json.addedCourses : [])
        setSubmitted(true)
      } else {
        setServerError(json.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setServerError('Network error — check your connection and try again.')
    }
  }

  if (submitted)
    return (
      <SuccessScreen
        ref_={ref}
        emailed={emailed}
        existed={existed}
        addedCourses={addedCourses}
      />
    )

  return (
    <div className={styles.page}>
      <Bg />
      <div className={styles.shell}>
        <nav className={styles.nav}>
          <span className={styles.logo}>
            twn.<span className={styles.logoSub}>LEARNING</span>
          </span>
          <div className={styles.navPill}>
            <span className={styles.navDot} />
            Launching Soon
          </div>
        </nav>

        <main className={styles.main}>
          <section className={styles.left} aria-label="About Tween Learning">
            <p className={styles.eyebrow}>Tween Learning · {new Date().getFullYear()}</p>

            <h1 className={styles.h1}>
              Be first in line<br />
              to <em className={styles.em}>learn</em><br />
              what&apos;s next.
            </h1>

            <p className={styles.desc}>
              Tween Learning is a new kind of learning platform built for
              real-world skills in tech and innovation. No fluff. Just what
              actually moves your career forward.
            </p>

            <p className={styles.cta}>
              Join the waitlist and be first to access what others will wish
              they started earlier.
            </p>

            <div className={styles.chips} aria-label="Sample courses">
              {COURSES.slice(0, 5).map((c) => (
                <span key={c.id} className={styles.chip}>
                  <span className={styles.chipDot} style={{ background: c.color }} />
                  {c.label}
                </span>
              ))}
              <span className={styles.chip}>
                <span className={styles.chipDot} style={{ background: '#888' }} />
                +{COURSES.length - 5} more tracks
              </span>
            </div>

            <div className={styles.proof} aria-hidden="true">
              <div className={styles.avatars}>
                {['KA', 'YO', 'ND'].map((i) => (
                  <div key={i} className={styles.av}>{i}</div>
                ))}
                <div className={styles.av}>+</div>
              </div>
              <p className={styles.proofText}>
                <strong>Early applicants</strong> already on the list.
              </p>
            </div>
          </section>

          <div className={styles.card} role="region" aria-label="Wishlist sign-up form">
            <div className={styles.cardGlow} aria-hidden="true" />

            <h2 className={styles.cardTitle}>Claim your spot 🎯</h2>
            <p className={styles.cardSub}>Takes 20 seconds. No payment needed.</p>

            {serverError && (
              <div className={styles.bannerError} role="alert">{serverError}</div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <input
                {...register('website')}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, pointerEvents: 'none' }}
              />

              <div className={styles.row2}>
                <Field label="First Name *" error={errors.fullName?.message}>
                  <input
                    className={`${styles.input} ${errors.fullName ? styles.inputErr : ''}`}
                    placeholder="Kwame"
                    autoComplete="given-name"
                    {...register('fullName')}
                  />
                </Field>
                <Field label="Email Address *" error={errors.email?.message}>
                  <input
                    className={`${styles.input} ${errors.email ? styles.inputErr : ''}`}
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...register('email')}
                  />
                </Field>
              </div>

              <div className={styles.row2}>
                <Field label="Phone / WhatsApp *" error={errors.phone?.message}>
                  <input
                    className={`${styles.input} ${errors.phone ? styles.inputErr : ''}`}
                    type="tel"
                    placeholder="+1 555 000 0000"
                    autoComplete="tel"
                    {...register('phone')}
                  />
                </Field>
                <Field label="Country *" error={errors.country?.message}>
                  <div className={styles.selectWrap}>
                    <select
                      className={`${styles.input} ${errors.country ? styles.inputErr : ''}`}
                      defaultValue=""
                      {...register('country')}
                    >
                      <option value="" disabled>Select…</option>
                      {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <span className={styles.selectArrow} aria-hidden="true">▾</span>
                  </div>
                </Field>
              </div>

              <Field label="Current Role *" error={errors.role?.message}>
                <div className={styles.selectWrap}>
                  <select
                    className={`${styles.input} ${errors.role ? styles.inputErr : ''}`}
                    defaultValue=""
                    {...register('role')}
                  >
                    <option value="" disabled>Select your role…</option>
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                  <span className={styles.selectArrow} aria-hidden="true">▾</span>
                </div>
              </Field>

              <div className={styles.fieldGroup}>
                <span className={styles.label}>
                  Courses I want *{' '}
                  <span className={styles.labelNote}>(select all that apply)</span>
                </span>
                <div className={styles.courseGrid} role="group" aria-label="Select courses">
                  {COURSES.map((c) => {
                    const active = selectedCourses.includes(c.id)
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCourse(c.id)}
                        aria-pressed={active}
                        className={`${styles.courseBtn} ${active ? styles.courseBtnActive : ''}`}
                        style={active ? { borderColor: c.color, background: `${c.color}1a` } : {}}
                      >
                        <span
                          className={styles.courseCheck}
                          style={active ? { background: c.color, borderColor: c.color } : {}}
                        >
                          {active && <span aria-hidden="true">✓</span>}
                        </span>
                        {c.label}
                      </button>
                    )
                  })}
                </div>
                {errors.courses && (
                  <span className={styles.err} role="alert">{errors.courses.message}</span>
                )}
              </div>

              <Field label="Anything else?" hint="(optional)" error={errors.note?.message}>
                <textarea
                  className={styles.input}
                  rows={2}
                  placeholder="Goals, schedule preferences, questions…"
                  {...register('note')}
                />
              </Field>

              <div className={styles.gdpr}>
                <input
                  type="checkbox"
                  id="gdpr"
                  className={styles.gdprCheck}
                  {...register('gdprConsent')}
                />
                <label htmlFor="gdpr" className={styles.gdprLabel}>
                  I agree to Tween Technologies collecting my details to send course
                  updates and enrollment info. We never sell your data.
                </label>
              </div>
              {errors.gdprConsent && (
                <span className={styles.err} role="alert" style={{ marginTop: 4 }}>
                  {errors.gdprConsent.message}
                </span>
              )}

              <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                {isSubmitting ? (
                  'Saving your spot…'
                ) : (
                  <>
                    <span>Hold my spot</span>
                    <span className={styles.arrow} aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </main>

        <footer className={styles.footer}>
          <span className={styles.footBrand}>
            twn.<span className={styles.footSub}>LEARNING</span>
          </span>
          <nav className={styles.footLinks} aria-label="Footer links">
            <a href="https://linktr.ee/tween_technologies" target="_blank" rel="noopener noreferrer">Linktree</a>
            <a href="mailto:hello@tweentechnologies.com">Contact</a>
            <a href="/admin/login">Admin</a>
          </nav>
        </footer>
      </div>
    </div>
  )
}

function Bg() {
  return (
    <div className={styles.bg} aria-hidden="true">
      <div className={styles.blob1} />
      <div className={styles.blob2} />
      <div className={styles.grid} />
    </div>
  )
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        {label}{' '}
        {hint && <span className={styles.labelNote}>{hint}</span>}
      </label>
      {children}
      {error && <span className={styles.err} role="alert">{error}</span>}
    </div>
  )
}

function SuccessScreen({
  ref_,
  emailed,
  existed,
  addedCourses,
}: {
  ref_: string
  emailed: boolean
  existed: boolean
  addedCourses: string[]
}) {
  const addedLabels = addedCourses.map(
    (id) => COURSES.find((c) => c.id === id)?.label ?? id.replace(/-/g, ' '),
  )

  const title = !existed
    ? "You're on the list!"
    : addedLabels.length
      ? 'Courses added!'
      : "You're already on the list"

  const icon = !existed ? '🎉' : addedLabels.length ? '✅' : '👋'

  return (
    <div className={styles.page}>
      <Bg />
      <div className={styles.shell}>
        <nav className={styles.nav}>
          <span className={styles.logo}>twn.<span className={styles.logoSub}>LEARNING</span></span>
        </nav>
        <main className={styles.successMain}>
          <div className={styles.successIcon} aria-hidden="true">{icon}</div>
          <h1 className={styles.successTitle}>{title}</h1>
          <p className={styles.successDesc}>
            {!existed ? (
              <>We&apos;ll personally reach out when enrollment opens for your chosen courses. </>
            ) : addedLabels.length ? (
              <>
                You were already on the list, so we added{' '}
                <strong>{addedLabels.join(', ')}</strong> to your existing spot.{' '}
              </>
            ) : (
              <>Everything you picked was already on your list — nothing to change. </>
            )}
            {emailed
              ? 'Check your email for confirmation.'
              : 'Keep the reference below — that’s your spot.'}
          </p>
          {ref_ && <p className={styles.successRef}>Reference: #{ref_}</p>}
          <a
            href="https://linktr.ee/tween_technologies"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.followBtn}
          >
            Follow Tween Tech →
          </a>
        </main>
      </div>
    </div>
  )
}
