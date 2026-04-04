# RideConnect — Senior Ride Coordination Platform

A web application that connects volunteer drivers with seniors who need rides to medical appointments. Replaces the manual spreadsheet-and-email coordination workflow with a real-time ride board, one-click claiming with duplicate prevention, and automatic email notifications.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), Tailwind CSS, PWA-ready
- **Backend**: Next.js API Routes + Server Actions
- **Database**: PostgreSQL via Supabase (Prisma ORM v7)
- **Auth**: NextAuth.js with magic-link (passwordless) email login
- **Email**: Resend
- **Hosting**: Vercel (frontend) + Supabase (database)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or Supabase)

### Setup

1. **Install dependencies**

```bash
cd app
npm install
```

2. **Configure environment**

```bash
cp .env.example .env
```

Edit `.env` with your database URL, auth secret, and Resend API key.

3. **Generate Prisma client and run migrations**

```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. **Seed the database** (optional — creates sample users and rides)

```bash
npx tsx prisma/seed.ts
```

5. **Import historical Excel data** (optional — Phase 0 migration)

```bash
npx tsx scripts/migrate-excel.ts "../schedule sept 29.xlsx"
```

6. **Start development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## User Roles

| Role | Access |
|------|--------|
| **Admin/Staff** | Create ride requests, manage all rides, view audit trail, reassign or cancel rides |
| **Volunteer** | Browse available rides, claim rides, view "My Rides" with full details, mark rides complete |

Seniors interact by phone only — no login required.

## Key Features

- **Live ride board** with zone-based filtering (North Van, West Van, Downtown Van)
- **Atomic claim locking** — prevents duplicate sign-ups via optimistic concurrency control
- **Structured accessibility fields** — mobility aid type, vehicle transfer assistance
- **One-way / Round-trip toggle** — accurate time estimates for volunteers
- **"My Rides" persistence** — full contact details, Call Patient button, Open in Maps, .ics calendar download
- **Audit trail** — every status change logged with actor and timestamp
- **Magic-link auth** — passwordless login with 30-day persistent sessions
- **Email notifications** — new ride alerts, claim confirmations, cancellation alerts, ride reminders
- **PWA support** — installable on phone home screen

## Deployment

### Vercel + Supabase

1. Create a Supabase project and get the connection string.
2. Deploy to Vercel and set environment variables:
   - `DATABASE_URL` — Supabase Postgres connection string
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - `AUTH_URL` — your production URL
   - `RESEND_API_KEY` — from resend.com
   - `EMAIL_FROM` — sender address
   - `CRON_SECRET` — random token for cron endpoint auth
3. Run `npx prisma migrate deploy` against the production database.
4. The `vercel.json` cron config sends ride reminders every hour.

## Project Structure

```
app/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Sample data seeder
├── scripts/
│   └── migrate-excel.ts       # Phase 0: Excel → Postgres migration
├── src/
│   ├── app/
│   │   ├── admin/             # Staff dashboard, ride form, ride detail
│   │   ├── (volunteer)/       # Ride board, My Rides, Settings
│   │   ├── login/             # Auth pages
│   │   └── api/               # NextAuth + cron routes
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── nav.tsx            # Navigation bar
│   │   └── ride-badges.tsx    # Status/zone/accessibility badges
│   └── lib/
│       ├── actions/rides.ts   # Server actions (CRUD + claim/unclaim)
│       ├── auth.ts            # NextAuth configuration
│       ├── audit.ts           # Audit log helper
│       ├── db.ts              # Prisma client singleton
│       ├── email.ts           # Resend email wrapper
│       ├── notifications.ts   # Notification templates
│       ├── ics.ts             # .ics calendar file generator
│       └── zones.ts           # Zone detection from addresses
└── vercel.json                # Cron job configuration
```
