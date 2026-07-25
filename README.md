# Tween Learning — Wishlist

Pre-launch waitlist app. Public signup form + password-protected admin dashboard.
Standalone: it shares no database or auth with `core-backend` / `next-core-frontend`.

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL via Prisma
- **Auth**: NextAuth (credentials, JWT sessions)
- **Email**: Resend
- **Deploy target**: Vercel + a hosted Postgres (Supabase / Neon / Railway)

## Structure

```
app/
  page.tsx                   Public wishlist form
  page.module.css            Responsive styles for it
  layout.tsx                 Metadata + Google Fonts (Archivo, DM Mono)
  globals.css
  admin/
    page.tsx                 Redirects /admin → /admin/dashboard
    layout.tsx               SessionProvider (scoped to /admin only)
    login/page.tsx           Branded sign-in
    dashboard/page.tsx       Stats, charts, entries table, CSV export
  api/
    wishlist/route.ts        POST — public signup
    auth/[...nextauth]/      NextAuth handler
    admin/
      entries/route.ts       GET list (paginated/filtered), DELETE one
      stats/route.ts         GET dashboard aggregates
      export/route.ts        GET CSV
lib/
  prisma.ts                  Client singleton
  auth.ts                    authOptions
  validations.ts             Zod schema shared by form and API
  constants.ts               COURSES / COUNTRIES / ROLES
  email.ts                   Resend templates
prisma/
  schema.prisma              WishlistEntry + AdminUser
  seed.ts                    Creates the admin user from env
middleware.ts                Gates /admin/dashboard/*
types/next-auth.d.ts         Adds `id` to the session user
```

## Local setup

```bash
npm install

cp .env.example .env      # use .env, not .env.local — see note below
npm run db:push           # create tables
npm run seed              # create the admin user from ADMIN_EMAIL / ADMIN_PASSWORD

npm run dev               # http://localhost:3000
```

Generate a secret with `openssl rand -base64 32`.

**Use `.env`, not `.env.local`.** Next.js reads both, but the Prisma CLI (`db:push`,
`migrate`, `studio`) only reads `.env` — split them and the app works while every
database command fails. The seed script loads `.env.local` then `.env` explicitly,
because it runs under plain node via `tsx`, which loads neither on its own.

**`DATABASE_URL` must use a host reachable from wherever the command runs.** Pointing
it at a Docker service name like `db-core:5432` works inside the compose network but
not from your shell — use `localhost:5432` for local commands against a container
that publishes the port.

Public form is `/`. Admin is `/admin` → `/admin/dashboard`, sign in at `/admin/login`.

## Deploying

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** — full walkthrough for Vercel, targeting
`https://tweenlearning.vercel.app`, including the hosted-database and connection-pooling
requirements, the env var table, a verification checklist, and troubleshooting.

`npm run build` runs `prisma generate` first, so the client is always built against
the current schema.

## Things worth knowing

- **A missing `NEXTAUTH_SECRET` makes the admin API return 500, not 401.**
  `getServerSession` throws without it. It fails closed, but the error is opaque —
  check this first if the dashboard breaks after a deploy.
- **Duplicate emails return 409**, not an overwrite. Upserting on email would let
  anyone replace an existing person's details just by knowing their address.
- **Rate limiting on `POST /api/wishlist` is in-process** (5/min/IP). On serverless
  each instance keeps its own counter, so it stops casual abuse, not a distributed
  flood. Move to Redis/Upstash if the form is ever targeted.
- **The CSV export neutralises formula injection.** Cells starting with `= + - @`
  are prefixed with `'` so Excel and Sheets don't execute them.
- **`NEXT_PUBLIC_APP_URL` is read at build time** for `metadataBase` — changing it
  needs a redeploy, not a restart.
- Email failures never fail a signup; the entry is saved first and send errors are
  only logged.
