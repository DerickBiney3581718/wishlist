'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

type Entry = {
  id: string
  fullName: string
  email: string
  phone: string
  country: string
  role: string
  courses: string[]
  note?: string
  createdAt: string
}

type Stats = {
  total: number
  todayCount: number
  weekCount: number
  topCourses: { name: string; count: number }[]
  topCountries: { name: string; count: number }[]
  daily: { date: string; count: number }[]
}

const COLS = ['#0082D4', '#E35336', '#2da85a', '#a855f7', '#f59e0b', '#06b6d4', '#ec4899', '#10b981', '#f43f5e', '#14b8a6']

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [course, setCourse] = useState('')
  const [country, setCountry] = useState('')
  const [tab, setTab] = useState<'overview' | 'entries'>('overview')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login')
  }, [status, router])

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/admin/stats')
    if (res.ok) setStats(await res.json())
  }, [])

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), search, course, country })
    const res = await fetch(`/api/admin/entries?${params}`)
    if (res.ok) {
      const d = await res.json()
      setEntries(d.entries)
      setTotal(d.total)
      setPages(d.pages)
    }
    setLoading(false)
  }, [page, search, course, country])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { if (tab === 'entries') fetchEntries() }, [tab, fetchEntries])

  async function deleteEntry(id: string) {
    if (!confirm('Delete this entry?')) return
    setDeleting(id)
    await fetch('/api/admin/entries', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    fetchEntries()
    fetchStats()
    setDeleting(null)
  }

  if (status === 'loading' || !session) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#031f36', color: '#EFEFEF', fontSize: '0.9rem' }}>Loading…</div>
  )

  const s = {
    page: { minHeight: '100vh', background: '#031f36', color: '#EFEFEF', fontFamily: "'Archivo', sans-serif" } as React.CSSProperties,
    topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', background: 'rgba(4,46,77,0.8)', borderBottom: '1px solid rgba(0,130,212,0.15)', flexWrap: 'wrap' as const, gap: '0.8rem' },
    logo: { fontSize: '1.1rem', fontWeight: 900, color: '#EFEFEF', letterSpacing: '-0.3px' } as React.CSSProperties,
    badge: { background: 'rgba(0,130,212,0.15)', border: '1px solid rgba(0,130,212,0.3)', color: '#5ec8ff', fontSize: '0.7rem', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.1em' } as React.CSSProperties,
    signout: { background: 'rgba(227,83,54,0.15)', border: '1px solid rgba(227,83,54,0.25)', color: '#f5917a', padding: '0.4rem 0.9rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' } as React.CSSProperties,
    inner: { maxWidth: '1200px', margin: '0 auto', padding: '2rem 2rem' } as React.CSSProperties,
    tabs: { display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0' } as React.CSSProperties,
    tab: (active: boolean) => ({ padding: '0.6rem 1.2rem', background: 'none', border: 'none', color: active ? '#0082D4' : 'rgba(239,239,239,0.45)', fontWeight: active ? 800 : 600, fontSize: '0.88rem', cursor: 'pointer', borderBottom: active ? '2px solid #0082D4' : '2px solid transparent', marginBottom: '-1px', transition: 'color 0.15s' }) as React.CSSProperties,
    statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' } as React.CSSProperties,
    statCard: { background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(0,130,212,0.15)', borderRadius: '12px', padding: '1.2rem 1.4rem' } as React.CSSProperties,
    statNum: { fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-1px', color: '#EFEFEF', lineHeight: 1 } as React.CSSProperties,
    statLabel: { fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'rgba(239,239,239,0.45)', marginTop: '0.4rem' } as React.CSSProperties,
    chartCard: { background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(0,130,212,0.15)', borderRadius: '12px', padding: '1.4rem', marginBottom: '1.2rem' } as React.CSSProperties,
    chartTitle: { fontSize: '0.82rem', fontWeight: 800, color: 'rgba(239,239,239,0.6)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '1.2rem' } as React.CSSProperties,
    chartsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.2rem' } as React.CSSProperties,
    input: { background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#EFEFEF', padding: '0.6rem 0.9rem', fontSize: '0.85rem', outline: 'none', width: '100%', appearance: 'none' as const } as React.CSSProperties,
    table: { width: '100%', borderCollapse: 'collapse' as const } as React.CSSProperties,
    th: { textAlign: 'left' as const, padding: '0.7rem 0.8rem', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'rgba(239,239,239,0.45)', borderBottom: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' as const } as React.CSSProperties,
    td: { padding: '0.75rem 0.8rem', fontSize: '0.84rem', color: 'rgba(239,239,239,0.8)', borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'top' as const } as React.CSSProperties,
    tag: (color: string) => ({ display: 'inline-block', background: `${color}20`, border: `1px solid ${color}50`, color, fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', margin: '2px 2px 2px 0' }) as React.CSSProperties,
    delBtn: { background: 'rgba(227,83,54,0.1)', border: '1px solid rgba(227,83,54,0.25)', color: '#f5917a', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' } as React.CSSProperties,
  }

  const COURSE_COLORS: Record<string, string> = {
    'Data Science & Ai': '#0082D4',
    'Web App Pentesting': '#E35336',
    'Cybersecurity Fundamentals': '#2da85a',
    'Cloud Engineering': '#a855f7',
    'Virtual Assistantship': '#f59e0b',
    'Data Engineering': '#06b6d4',
    'Video Editing': '#ec4899',
    'Animation': '#f97316',
    'Graphic Design': '#8b5cf6',
    'Software Engineering': '#10b981',
    'Ai Engineering': '#3b82f6',
    'Prompt Engineering': '#14b8a6',
    'Mobile App Development': '#f43f5e',
    'Software Testing & Qa': '#84cc16',
  }

  return (
    <div style={s.page}>
      <div style={s.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={s.logo}>twn. <span style={{ fontSize: '0.6rem', opacity: 0.4, letterSpacing: '2px' }}>LEARNING</span></span>
          <span style={s.badge}>Admin Dashboard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'rgba(239,239,239,0.45)' }}>{session?.user?.email}</span>
          <a href="/api/admin/export" style={{ ...s.badge, textDecoration: 'none', cursor: 'pointer' }}>↓ Export CSV</a>
          <button onClick={() => signOut({ callbackUrl: '/admin/login' })} style={s.signout}>Sign out</button>
        </div>
      </div>

      <div style={s.inner}>
        <div style={s.tabs}>
          {(['overview', 'entries'] as const).map((t) => (
            <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>
              {t === 'overview' ? '📊 Overview' : `📋 Entries (${total || stats?.total || 0})`}
            </button>
          ))}
        </div>

        {tab === 'overview' && stats && (
          <>
            <div style={s.statGrid}>
              {[
                { num: stats.total, label: 'Total Signups' },
                { num: stats.todayCount, label: 'Today' },
                { num: stats.weekCount, label: 'This Week' },
                { num: stats.topCourses[0]?.name ?? '—', label: 'Top Course', small: true },
              ].map(({ num, label, small }) => (
                <div key={label} style={s.statCard}>
                  <div style={{ ...s.statNum, fontSize: small ? '1.1rem' : '2.2rem', color: label === 'Total Signups' ? '#5ec8ff' : '#EFEFEF' }}>{num}</div>
                  <div style={s.statLabel}>{label}</div>
                </div>
              ))}
            </div>

            <div style={s.chartCard}>
              <div style={s.chartTitle}>Signups — last 14 days</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={stats.daily} barSize={18}>
                  <XAxis dataKey="date" tick={{ fill: 'rgba(239,239,239,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: 'rgba(239,239,239,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip contentStyle={{ background: '#042E4D', border: '1px solid rgba(0,130,212,0.3)', borderRadius: '8px', color: '#EFEFEF', fontSize: '0.82rem' }} cursor={{ fill: 'rgba(0,130,212,0.08)' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#0082D4" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={s.chartsRow}>
              <div style={s.chartCard}>
                <div style={s.chartTitle}>Course Interest</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.topCourses} layout="vertical" barSize={12}>
                    <XAxis type="number" tick={{ fill: 'rgba(239,239,239,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(239,239,239,0.55)', fontSize: 10 }} axisLine={false} tickLine={false} width={130} />
                    <Tooltip contentStyle={{ background: '#042E4D', border: '1px solid rgba(0,130,212,0.3)', borderRadius: '8px', color: '#EFEFEF', fontSize: '0.82rem' }} cursor={{ fill: 'rgba(0,130,212,0.06)' }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {stats.topCourses.map((_, i) => <Cell key={i} fill={COLS[i % COLS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={s.chartCard}>
                <div style={s.chartTitle}>Top Countries</div>
                {stats.topCountries.map((c, i) => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.82rem', color: 'rgba(239,239,239,0.7)', width: '110px', flexShrink: 0 }}>{c.name}</span>
                    <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: COLS[i % COLS.length], borderRadius: '4px', width: `${Math.round((c.count / stats.total) * 100)}%` }} />
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'rgba(239,239,239,0.45)', width: '24px', textAlign: 'right' }}>{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'entries' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.8rem', marginBottom: '1.2rem', alignItems: 'end' }}>
              <input style={s.input} placeholder="Search name or email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
              <input style={{ ...s.input, width: '160px' }} placeholder="Filter country…" value={country} onChange={(e) => { setCountry(e.target.value); setPage(1) }} />
              <input style={{ ...s.input, width: '200px' }} placeholder="Filter course slug…" value={course} onChange={(e) => { setCourse(e.target.value); setPage(1) }} />
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(239,239,239,0.4)', fontSize: '0.88rem' }}>Loading entries…</div>
            ) : (
              <>
                <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px' }}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        {['Name', 'Email', 'Phone', 'Country', 'Role', 'Courses', 'Date', ''].map((h) => (
                          <th key={h} style={s.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {entries.length === 0 && (
                        <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', padding: '3rem', color: 'rgba(239,239,239,0.3)' }}>No entries found.</td></tr>
                      )}
                      {entries.map((e) => (
                        <tr key={e.id} style={{ transition: 'background 0.1s' }}>
                          <td style={s.td}><span style={{ fontWeight: 700, color: '#EFEFEF' }}>{e.fullName}</span></td>
                          <td style={s.td}><a href={`mailto:${e.email}`} style={{ color: '#5ec8ff', textDecoration: 'none', fontSize: '0.82rem' }}>{e.email}</a></td>
                          <td style={s.td}><span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{e.phone}</span></td>
                          <td style={s.td}>{e.country}</td>
                          <td style={s.td}><span style={{ fontSize: '0.8rem' }}>{e.role}</span></td>
                          <td style={s.td}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', maxWidth: '220px' }}>
                              {e.courses.map((c) => {
                                const label = c.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
                                return <span key={c} style={s.tag(COURSE_COLORS[label] ?? '#0082D4')}>{label}</span>
                              })}
                            </div>
                          </td>
                          <td style={s.td}><span style={{ fontSize: '0.78rem', color: 'rgba(239,239,239,0.4)', whiteSpace: 'nowrap' }}>{new Date(e.createdAt).toLocaleDateString()}</span></td>
                          <td style={s.td}>
                            <button style={s.delBtn} onClick={() => deleteEntry(e.id)} disabled={deleting === e.id}>
                              {deleting === e.id ? '…' : 'Del'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {pages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.2rem' }}>
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ ...s.delBtn, color: 'rgba(239,239,239,0.6)', borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}>
                      ← Prev
                    </button>
                    <span style={{ fontSize: '0.82rem', color: 'rgba(239,239,239,0.45)' }}>Page {page} of {pages}</span>
                    <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} style={{ ...s.delBtn, color: 'rgba(239,239,239,0.6)', borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}>
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
