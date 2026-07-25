import { redirect } from 'next/navigation'

// The public footer links to /admin — send it somewhere real.
export default function AdminIndex() {
  redirect('/admin/dashboard')
}
