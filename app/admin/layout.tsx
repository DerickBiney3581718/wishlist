'use client'
import { SessionProvider } from 'next-auth/react'

// Scoped to /admin so the public landing page stays free of the session provider.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
