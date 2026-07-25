import { Resend } from 'resend'

const FROM  = process.env.FROM_EMAIL ?? 'Tween Learning <noreply@tweenlearning.com>'
const TEAM  = process.env.NOTIFICATION_EMAIL ?? 'hello@tweentechnologies.com'

// Constructed on first send, not at import. The Resend constructor throws when
// RESEND_API_KEY is missing, and at module scope that fails `next build` on any
// machine without the key set.
let client: Resend | null = null
function resend(): Resend {
  if (!client) client = new Resend(process.env.RESEND_API_KEY)
  return client
}

const wrap = (body: string) => `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#f0f4f8;font-family:Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto">
    <div style="background:#042E4D;padding:20px 24px 14px;border-radius:10px 10px 0 0">
      <div style="font-size:18px;font-weight:900;color:#EFEFEF;letter-spacing:-0.5px">twn. <span style="font-size:11px;font-weight:400;opacity:0.4;letter-spacing:1.5px">LEARNING</span></div>
    </div>
    <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none">${body}</div>
    <div style="background:#021C32;padding:14px 24px;border-radius:0 0 10px 10px;text-align:center">
      <span style="font-size:11px;color:rgba(239,239,239,0.3)">Tween Technologies · <a href="https://linktr.ee/tween_technologies" style="color:#0082D4">Follow us</a></span>
    </div>
  </div>
</body></html>`

export async function sendTeamNotification(data: {
  fullName: string; email: string; phone: string; country: string;
  role: string; courses: string[]; note?: string; id: string
}) {
  const courseList = data.courses.map(c =>
    `<li style="margin:3px 0;font-size:13px">${c.replace(/-/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}</li>`
  ).join('')

  return resend().emails.send({
    from: FROM, to: [TEAM], replyTo: data.email,
    subject: `[Wishlist] ${data.fullName} — ${data.courses.length} course(s)`,
    html: wrap(`
      <p style="font-size:15px;font-weight:700;color:#042E4D;margin:0 0 16px">New wishlist entry #${data.id.slice(-6).toUpperCase()}</p>
      <table style="width:100%;border-collapse:collapse">
        ${[
          ['Name', data.fullName], ['Email', `<a href="mailto:${data.email}">${data.email}</a>`],
          ['Phone', data.phone], ['Country', data.country], ['Role', data.role],
          ['Note', data.note || '—']
        ].map(([k,v]) => `<tr><td style="padding:7px 0;font-size:12px;font-weight:700;color:#6b7280;width:90px;border-bottom:1px solid #f3f4f6">${k}</td><td style="padding:7px 0;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6">${v}</td></tr>`).join('')}
      </table>
      <p style="font-size:12px;font-weight:700;color:#6b7280;margin:16px 0 6px">COURSES WANTED</p>
      <ul style="margin:0;padding-left:16px">${courseList}</ul>
    `)
  })
}

/**
 * Sent when someone already on the list submits the form again with courses
 * they hadn't picked before. `added` is only the new ones; `all` is their full
 * list after the merge.
 */
export async function sendCoursesAdded(data: {
  fullName: string; email: string; added: string[]; all: string[]
}) {
  const addedList = data.added.map(c =>
    `<div style="padding:8px 12px;background:#f0f9ff;border-left:3px solid #0082D4;margin:6px 0;font-size:13px;color:#042E4D;font-weight:600">
      ${c.replace(/-/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}
    </div>`
  ).join('')

  const allList = data.all.map(c =>
    `<li style="margin:3px 0;font-size:13px;color:#374151">${c.replace(/-/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}</li>`
  ).join('')

  return resend().emails.send({
    from: FROM, to: [data.email], replyTo: TEAM,
    subject: `Added to your Tween Learning wishlist — ${data.added.length} more course${data.added.length === 1 ? '' : 's'}`,
    html: wrap(`
      <p style="font-size:15px;color:#374151;margin:0 0 12px">Hi <strong>${data.fullName.split(' ')[0]}</strong>,</p>
      <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 16px">You were already on the list, so we've added these to your existing spot:</p>
      ${addedList}
      <p style="font-size:12px;font-weight:700;color:#6b7280;margin:20px 0 6px">YOUR FULL WISHLIST</p>
      <ul style="margin:0;padding-left:16px">${allList}</ul>
      <p style="font-size:13px;color:#6b7280;margin:20px 0 0;line-height:1.6">
        We'll reach out when enrollment opens. Questions? Reply here or email
        <a href="mailto:${TEAM}" style="color:#0082D4">${TEAM}</a>.
      </p>
    `)
  })
}

export async function sendConfirmation(data: { fullName: string; email: string; courses: string[] }) {
  const courseList = data.courses.map(c =>
    `<div style="padding:8px 12px;background:#f0f9ff;border-left:3px solid #0082D4;margin:6px 0;font-size:13px;color:#042E4D;font-weight:600">
      ${c.replace(/-/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}
    </div>`
  ).join('')

  return resend().emails.send({
    from: FROM, to: [data.email], replyTo: TEAM,
    subject: "You're on the Tween Learning wishlist!",
    html: wrap(`
      <p style="font-size:15px;color:#374151;margin:0 0 12px">Hi <strong>${data.fullName.split(' ')[0]}</strong>,</p>
      <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 16px">You're on the list. We'll personally reach out when enrollment opens for:</p>
      ${courseList}
      <p style="font-size:13px;color:#6b7280;margin:20px 0 0;line-height:1.6">
        Questions? Reply to this email or reach us at <a href="mailto:${TEAM}" style="color:#0082D4">${TEAM}</a>.
      </p>
    `)
  })
}
