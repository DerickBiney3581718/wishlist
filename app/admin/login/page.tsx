'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.ok) {
      router.push('/admin/dashboard')
      router.refresh()
    } else setError('Invalid email or password.')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#031f36', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#EFEFEF', letterSpacing: '-0.4px', marginBottom: '0.5rem' }}>
            twn. <span style={{ fontSize: '0.65rem', fontWeight: 400, opacity: 0.4, letterSpacing: '2px' }}>LEARNING</span>
          </div>
          <p style={{ color: 'rgba(239,239,239,0.5)', fontSize: '0.88rem' }}>Admin Dashboard</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(0,130,212,0.2)', borderRadius: '16px', padding: '2rem' }}>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#EFEFEF', marginBottom: '1.5rem' }}>Sign in</h1>
          {error && (
            <div style={{ background: 'rgba(227,83,54,0.12)', border: '1px solid rgba(227,83,54,0.3)', color: '#f5917a', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>
          )}
          <form onSubmit={handleSubmit}>
            {[
              { label: 'Email', type: 'email', autoComplete: 'username', value: email, onChange: (v: string) => setEmail(v) },
              { label: 'Password', type: 'password', autoComplete: 'current-password', value: password, onChange: (v: string) => setPassword(v) },
            ].map((f) => (
              <div key={f.label} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(239,239,239,0.5)', marginBottom: '0.4rem' }}>{f.label}</label>
                <input
                  type={f.type}
                  autoComplete={f.autoComplete}
                  value={f.value}
                  onChange={(e) => f.onChange(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.78rem 0.95rem', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#EFEFEF', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.9rem', background: '#0082D4', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
