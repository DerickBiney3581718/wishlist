import { withAuth } from 'next-auth/middleware'

// The bare `export { default }` form ignores authOptions.pages and sends
// signed-out users to NextAuth's generic /api/auth/signin page, so the
// branded login route is declared again here.
export default withAuth({
  pages: { signIn: '/admin/login' },
})

// Protects the dashboard. /admin/login stays public, and the API routes do
// their own getServerSession check — this is defence in depth, not the only gate.
export const config = {
  matcher: ['/admin/dashboard/:path*'],
}
