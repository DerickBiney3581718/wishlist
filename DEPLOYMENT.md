# Deploying the Wishlist to Vercel

Target: **https://tweenlearning.vercel.app** — Vercel's free generated URL, no custom
domain, no DNS to configure.

The `.vercel.app` suffix is fixed; you only control the label in front of it, and it
comes from the **project name**. So the project must be named exactly `tweenlearning`.

| Level | Meaning |
|---|---|
| **P0** | Blocking. Deploy fails or the app is broken without it. |
| **P1** | Do before sharing the link with anyone real. |
| **P2** | Cleanup / nice to have. |

---

## 0. Two blockers to clear first

**There is no git repository — P0.** Vercel's normal flow deploys from a connected
GitHub/GitLab/Bitbucket repo, and neither `wishlist/` nor the parent folder is under
version control. Pick one:

- **Recommended:** create a repo for `wishlist/` and push it. Set Vercel's *Root
  Directory* to `.` if the repo root is `wishlist/`, or to `wishlist` if you push the
  whole `tween-learning` folder.
- **No repo:** deploy straight from your machine with `npx vercel --prod` (§5). Works,
  but you lose per-PR preview deployments and every deploy is manual.

```bash
cd wishlist
git init
git add .
git commit -m "Wishlist app"
# .gitignore already excludes .env and node_modules — verify before pushing:
git status --short   # .env must NOT appear
```

**`RESEND_API_KEY` is still the placeholder — P1.** `.env` has the literal
`re_xxxxxxxxxxxxxxxxxxxx` from the template. Signups will still save (email failures are
caught and only logged), but nobody gets a confirmation and your team gets no
notification. See §4.

---

## 1. Provision a database — P0

**Vercel is serverless; it cannot reach the Postgres in your local Docker container.**
Your current `DATABASE_URL` points at `localhost:5432`, which on Vercel resolves to the
function's own sandbox. You need a hosted Postgres:

- [Neon](https://neon.tech) — generous free tier, built for serverless
- [Supabase](https://supabase.com) — free tier, also gives you a table browser

**Use the pooled connection string — P0.** Serverless functions open a new connection
per cold start and will exhaust a normal Postgres connection limit fast. Both providers
give you a pooled URL; take that one, not the direct one.

- Neon: the endpoint containing `-pooler`
- Supabase: **Connection Pooling** section, port `6543` (not `5432`)

If you later use `prisma migrate` rather than `db push`, migrations need the *direct*
(unpooled) URL — add `directUrl` to the datasource block then. `db push` doesn't care.

---

## 2. Create the schema and admin user — P0

Run these **from your machine, pointed at the production database** — Vercel never runs
them for you.

```bash
cd wishlist

# temporarily point at production
# (keep a copy of your local value; .env.bak already holds the pre-localhost version)
#   DATABASE_URL="<pooled connection string from step 1>"

npm run db:push        # creates wishlist_entries + admin_users
npm run seed           # creates the admin from ADMIN_EMAIL / ADMIN_PASSWORD
```

**Set a real `ADMIN_PASSWORD` before seeding — P0.** If it's still `ChangeMe123!` the
seed prints a warning; that password is in a template committed to the repo. The seed
upserts, so you can change it and re-run any time.

Then put `DATABASE_URL` back to `localhost:5432` for local work.

---

## 3. Create the Vercel project — P0

1. **Add New → Project**, import the repo.
2. **Project Name: `tweenlearning`** — this is what produces `tweenlearning.vercel.app`.
   If it's taken you'll get a suffixed variant; check before assuming the URL.
   Don't name it something domain-shaped like `tweenlearning-com` — Vercel's
   anti-phishing protection silently shortens names that resemble real domains.
3. **Root Directory:** `wishlist` (skip if the repo root is already `wishlist/`).
4. **Framework Preset:** Next.js (auto-detected).
5. Leave the build command alone — `package.json` already runs
   `prisma generate && next build`, which is required or the client won't match the schema.

---

## 4. Environment variables — P0

Add these in **Settings → Environment Variables** *before* the first build. The
`NEXT_PUBLIC_*` ones are compiled into the client bundle at build time — setting them
afterwards does nothing until you redeploy.

| Variable | Production value | Notes |
|---|---|---|
| `DATABASE_URL` | pooled string from §1 | **not** localhost |
| `NEXTAUTH_URL` | `https://tweenlearning.vercel.app` | must match the origin exactly or admin login breaks |
| `NEXTAUTH_SECRET` | fresh value | generate a **new** one: `openssl rand -base64 32` |
| `RESEND_API_KEY` | real key from resend.com | placeholder = no email |
| `FROM_EMAIL` | see below | must be a Resend-verified domain |
| `NOTIFICATION_EMAIL` | `hello@tweentechnologies.com` | where signup alerts land |
| `NEXT_PUBLIC_APP_URL` | `https://tweenlearning.vercel.app` | build-time; feeds `metadataBase` |

`ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` are only read by the seed script, which
runs locally. They don't need to exist on Vercel.

**Don't reuse the local `NEXTAUTH_SECRET` — P1.** It's sitting in a `.env` on your disk;
production should have its own. Changing it invalidates existing sessions, which is fine
before launch.

### 4.1 Resend needs a verified sending domain — P1

This is the part most likely to catch you out, so it gets its own section.

**Until a domain is verified, Resend only delivers to your own account address.** That
affects the app's two emails very differently:

| Email | Recipient | Unverified |
|---|---|---|
| Team notification | `NOTIFICATION_EMAIL` | **Works**, if that's your Resend account address |
| Signup confirmation | whoever just signed up | **Never works** — arbitrary recipients are blocked |

The confirmation is the one users are told to expect, so treat verification as a launch
requirement rather than polish.

**`tweenlearning.vercel.app` cannot be used for email.** Verification means adding DNS
records at a registrar, and you don't control `vercel.app`. But hosting and sending
domains are independent — there is no requirement that they match.

**Use `tweentechnologies.com`.** It's already your team address (`hello@…`) and your
Linktree handle, so you presumably control its DNS. Verify it in Resend and set:

```
FROM_EMAIL="Tween Learning <noreply@send.tweentechnologies.com>"
```

Resend recommends sending from a **subdomain** (`send.`) rather than the root domain, so
that transactional volume or a deliverability problem can't damage the reputation of the
domain you send normal business mail from.

**The DNS records.** Resend generates the exact values — including the region in the MX
host and the DKIM public key — in **Domains → Add Domain**. Copy them from there rather
than from here; this is only the shape of what you'll be adding:

| Type | Name | Purpose |
|---|---|---|
| `TXT` | `resend._domainkey.send` | DKIM — signs your mail so receivers can verify it |
| `TXT` | `send` | SPF — authorises Resend's servers to send as you |
| `MX` | `send` | Bounce and complaint handling |
| `TXT` | `_dmarc` | DMARC policy — start at `p=none`, tighten later |

Propagation is usually minutes; Resend re-checks automatically.

**Until that's done**, set `FROM_EMAIL="onboarding@resend.dev"`. It only delivers to the
address on your Resend account, which is enough to prove the integration works — but
real signups will get nothing.

**Check the plan limits.** Resend's free tier caps monthly and daily volume and allows
one verified domain. Fine for a waitlist; confirm the current numbers against the signup
volume you're expecting.

**The app degrades honestly.** `POST /api/wishlist` inspects Resend's response and
returns an `emailed` flag; the success screen only says *"Check your email for
confirmation"* when the confirmation actually sent, and otherwise points the user at
their reference number. So an unverified domain is not a broken-looking signup — but it
is a silent one, visible only in the function logs.

---

## 5. Deploy

**From git:** push to the production branch. Vercel builds automatically.

**Without git:**

```bash
cd wishlist
npx vercel          # first run links/creates the project — answer "tweenlearning"
npx vercel --prod
```

---

## 6. Verify — P0

In order; each depends on the previous.

- [ ] `https://tweenlearning.vercel.app` loads and the form renders with all 14 courses
- [ ] Submit a real signup → success screen with a reference code
- [ ] Row appears in the database
- [ ] Submitting the same email again → *"You're already on the list"* (409, no overwrite)
- [ ] `/admin/dashboard` while signed out → redirects to `/admin/login`
- [ ] Log in with your admin credentials → dashboard loads with stats
- [ ] Entries tab lists the signup; search and filters work
- [ ] **Export CSV** downloads and opens correctly in Excel
- [ ] Confirmation email arrives (only if §4's Resend setup is done)
- [ ] Delete the test entry

---

## 7. After launch — P1/P2

- [ ] Change `ADMIN_PASSWORD` from anything that appeared in a template, re-run the seed — **P1**
- [ ] Confirm `.env` never got committed: `git log --all --full-history -- .env` should be empty — **P1**
- [ ] Verify your real sending domain in Resend and switch `FROM_EMAIL` back — **P1**
- [ ] Take a database backup or enable your provider's automatic backups — **P1**
- [ ] Move rate limiting to Upstash Redis if the form gets abused (see README) — **P2**
- [ ] Attach a real custom domain when you have one; only `NEXTAUTH_URL` and
      `NEXT_PUBLIC_APP_URL` change, then redeploy — **P2**

---

## Troubleshooting

**Admin API returns 500 instead of 401.** `NEXTAUTH_SECRET` is missing.
`getServerSession` throws without it. Fails closed, but the error is opaque.

**Admin login redirects in a loop, or the callback 404s.** `NEXTAUTH_URL` doesn't match
the actual origin. It must be the full `https://` URL with no trailing slash.

**Build fails with `Missing API key. Pass it to the constructor`.** A Resend client is
being constructed at import time. `lib/email.ts` constructs it lazily to avoid exactly
this — don't move it back to module scope.

**`Can't reach database server`.** Either `DATABASE_URL` still points at `localhost` /
a Docker service name like `db-core`, or you used the direct rather than pooled string.

**Signups 500 under load, or `too many connections`.** You're on the unpooled
connection string. Switch to the pooler (§1).

**`Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding`.** The seed runs under
`tsx`, not Next.js, and loads `.env.local` then `.env` explicitly. Make sure the values
are in one of those files — not only in your shell.

**The page renders unstyled.** `app/layout.tsx` loads Archivo and DM Mono from Google
Fonts by literal family name, because `page.module.css` references them directly. A
Content-Security-Policy or blocked request to `fonts.googleapis.com` breaks this.
