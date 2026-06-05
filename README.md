# Memora — Educational Study App

A full-stack flashcard web app for studying topics with progress tracking, streaks, and an admin panel. Inspired by Quizlet-style study flows (Learn, Flashcards, Test).

## Tech Stack

| Layer | Stack |
|-------|--------|
| Frontend | React 19, Vite, Tailwind CSS, React Router, Recharts (admin dashboard) |
| Backend | Node.js, Express 5 (local + serverless fallback), `pg` fast paths on Vercel |
| Database | SQLite (local dev) or PostgreSQL / Supabase (production) |
| ORM | Prisma (Express routes); raw SQL fast paths for hot Vercel routes |
| Auth | JWT (bcrypt), email verification (Resend), Google Sign-In, guest sessions |
| Quality | Vitest, GitHub Actions CI, Supertest API smoke tests |
| Hosting | Vercel (static client + `api/index.js` serverless function) |

## Features

### Learners
- **Guest mode** or full registration with **subject enrollment**; dashboard shows only enrolled subjects
- **Add more subjects** anytime from the dashboard
- **Study hub** per topic: Learn, Flashcards, and Test
- Session options: shuffle, weak-cards-only, question-type filters (stored per topic in `localStorage`)
- MCQ, True/False, and Fill-in-the-blank practice with **server-side grading**
- Flashcards mode with 3D flip and self-rating (Got it / Needs practice)
- Progress tracking per card; **streak** and 7-day calendar on profile
- Dashboard: continue studying, per-subject mastery, subject accents
- Light/dark theme with theme-aware logos
- Paginated topic lists on profile and subject pages

### Admins
- **Dashboard** at `/admin/dashboard` — KPI tiles, activity charts, operations panel, links to detailed reports
- **Reports:** learner engagement (filters, CSV export) and content health by subject/topic
- CRUD flashcards, subjects, topics, and users (role-based)
- **Deactivate** users (soft delete; progress kept); super admins can **reactivate** and **verify email**
- CSV import/export with search and pagination on the cards table
- Super admin vs admin permission rules

### Seeded content
- Default super admin and sample **AI Concepts** flashcards (24 cards)

## Prerequisites

- Node.js 18+

## Quick Start (SQLite)

From the project root:

```bash
npm run setup    # install deps, migrate DB, seed data
npm run dev      # API on :5001 + Vite on :5173
```

Or run separately:

```bash
cd server && npm run dev   # API
cd client && npm run dev   # frontend
```

Open [http://localhost:5173](http://localhost:5173).

| Account | Email | Password |
|---------|-------|----------|
| Super admin | `admin@app.com` | `admin123` |

> **macOS:** Port 5000 is often used by AirPlay Receiver. The API defaults to **5001**. The Vite dev server proxies `/api` to `http://localhost:5001`.

## Environment Variables

Copy `server/.env.example` to `server/.env`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-at-least-32-characters-long"
JWT_EXPIRES_IN="7d"
PORT=5001
CLIENT_URL="http://localhost:5173"

# Optional
# MAX_STUDY_CARDS=500
# MAX_CSV_BYTES=2097152
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Prisma connection string |
| `JWT_SECRET` | Signing key (min 32 chars required in production) |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `PORT` | API port (default `5001`) |
| `CLIENT_URL` | CORS origin(s); comma-separated for multiple |
| `MAX_STUDY_CARDS` | Max cards returned per study session (default `500`) |
| `MAX_CSV_BYTES` | Max CSV upload size for import (default 2MB) |

### Authentication (email + Google)

| Variable | Where | Description |
|----------|--------|-------------|
| `APP_URL` | Server (Vercel) | Public app URL for email links (e.g. `https://memora.cards`) |
| `RESEND_API_KEY` | Server (Vercel) | [Resend](https://resend.com) API key for verification and reset emails |
| `EMAIL_FROM` | Server (Vercel) | Sender on a verified domain, e.g. `Memora <noreply@memora.cards>` |
| `CONTACT_EMAIL` | Server (Vercel) | Inbox for public contact form submissions (`POST /api/contact`) |
| `GOOGLE_CLIENT_ID` | Server (Vercel) | Google OAuth 2.0 **Web** client ID |
| `VITE_GOOGLE_CLIENT_ID` | Client build (Vercel) | Same Web client ID (required for Google button in UI) |

Copy [`client/.env.example`](client/.env.example) to **`client/.env`** for local Google sign-in (`VITE_GOOGLE_CLIENT_ID`). The server uses `GOOGLE_CLIENT_ID` in **`server/.env`** — both must be the same Web client ID. Restart dev after editing either file.

**Google Cloud Console:** add authorized JavaScript origins `http://localhost:5173` and `https://memora.cards`.

**Vercel (production):** after `npx vercel link`, sync env vars and redeploy:

```bash
RESEND_API_KEY=re_xxx GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com ./scripts/sync-vercel-auth-env.sh
npx vercel --prod
```

`APP_URL` and `EMAIL_FROM` can be set without the script; `RESEND_API_KEY` and `VITE_GOOGLE_CLIENT_ID` require a redeploy after adding.

New email/password users must verify before study **writes** (progress, enroll). Guests and existing backfilled users are not blocked.

## Deploy to Vercel

Memora is configured for a **single Vercel project**: static React app + Express API as one serverless function (`/api/*`).

### 1. Database (required)

SQLite does **not** work on Vercel. Use [Vercel Postgres](https://vercel.com/storage/postgres), [Neon](https://neon.tech), or [Supabase](https://supabase.com).

In `server/prisma/schema.prisma`, switch the datasource:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // optional; required for Supabase pooler + migrate
}
```

### 2. Vercel project settings

Import the repo in [Vercel](https://vercel.com). Defaults from `vercel.json` are used:

| Setting | Value |
|---------|--------|
| Build Command | `npm run build:vercel` → `scripts/build-vercel.sh` |
| Output Directory | `client/dist` |
| Install Command | root + `server` (prod deps only) + `client` (incl. dev for Vite build) |
| API | Single function `api/index.js` → `/api/*` |

**Serverless bundle:** Never set `includeFiles: server/**` (exceeds 250MB). File tracing from `api/index.js` plus short `excludeFiles` for macOS Prisma binaries. See [docs/SECURITY.md](docs/SECURITY.md).

### 3. Environment variables (Vercel → Settings → Environment Variables)

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | Postgres pooled URL |
| `DIRECT_URL` | Postgres direct URL (if your host provides one) |
| `JWT_SECRET` | Random string, **≥ 32 characters** |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | `https://your-app.vercel.app` (your production domain) |

`VERCEL_URL` is set automatically for CORS on preview deployments.

Schema sync on Vercel build uses `prisma db push` when `DATABASE_URL` is set (see `scripts/build-vercel.sh`). For migration history, run `npx prisma migrate deploy` locally or in CI against the same database. Seed once locally if you want demo data:

```bash
cd server && DATABASE_URL="your-postgres-url" npm run db:seed
```

### 4. Deploy

```bash
npm i -g vercel
vercel link
vercel env pull server/.env   # optional, for local testing against prod DB
vercel --prod
```

After deploy, open `https://your-app.vercel.app/api/health` — expect `{"status":"ok"}`.

### 5. Post-deploy checklist

- [ ] Change the default admin password (`admin@app.com` / `admin123` if you seeded).
- [ ] Confirm login and a study session work on production.
- [ ] Custom domain: add in Vercel and set `CLIENT_URL` to that URL.

### Local dev vs Vercel

| | Local | Vercel |
|---|--------|--------|
| Database | SQLite (`file:./dev.db`) | PostgreSQL only |
| API | `server` on port 5001 | `/api` serverless function |
| Frontend | Vite :5173 with proxy | Static `client/dist` |

Keep **SQLite** in `schema.prisma` for local work; use a **git branch** or second schema edit when deploying with Postgres.

Optional: `VITE_API_URL` in the client (only if API is hosted on another origin).

---

## Production: PostgreSQL / Supabase (non-Vercel)

1. Create a [Supabase](https://supabase.com) project (or any Postgres host).
2. In `server/prisma/schema.prisma`, set:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

3. Set `server/.env`:

```env
DATABASE_URL="postgresql://...pooler...:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...:5432/postgres"
```

4. Run migrations and seed:

```bash
cd server && npx prisma migrate deploy && npm run db:seed
```

## Project Structure

```
flashcards/
├── api/
│   └── index.js             # Vercel serverless entry (fast paths + Express fallback)
├── client/
│   ├── public/              # Logos, openapi.yaml (synced), api-docs.html
│   └── src/
│       ├── components/      # UI, study cards, admin dashboard tiles
│       ├── context/         # Auth, theme
│       ├── pages/           # Learner + admin (dashboard, reports, cards)
│       └── utils/           # API client, report dates, roles
├── server/
│   ├── lib/                 # fastApi, fastAuth, adminReports, MCQ, CSV, pg
│   ├── middleware/          # Auth, admin, validation, rate limits
│   ├── prisma/
│   ├── routes/              # Express routers (local + cold-path fallback)
│   └── tests/               # Vitest unit + API smoke
├── docs/
│   ├── openapi.yaml         # OpenAPI 3 spec (source of truth)
│   └── SECURITY.md          # Security assessment & ops checklist
├── scripts/
│   ├── build-vercel.sh      # Production build (tests skipped on Vercel)
│   └── sync-vercel-auth-env.sh
├── .github/workflows/ci.yml # Test + build on push/PR to main
├── vercel.json
└── package.json
```

## API Reference

**Interactive docs (Swagger UI):** [`/api-docs.html`](/api-docs.html) when the app is running (e.g. [memora.cards/api-docs.html](https://memora.cards/api-docs.html)). The landing page at `/` links here for guests.

**OpenAPI 3 spec:** [`docs/openapi.yaml`](docs/openapi.yaml) (also served at `/openapi.yaml` from the client build).

Base URL: `http://localhost:5001/api` (or proxied via Vite as `/api`).

Authenticated requests: `Authorization: Bearer <token>`.

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Register (`name`, `email`, `password`, `subjectIds[]`) |
| POST | `/auth/login` | — | Login → `{ token, user }` |
| POST | `/auth/guest` | — | Guest session → `{ token, user }` |
| POST | `/auth/upgrade-guest` | User | Convert guest to registered account |
| POST | `/auth/google` | — | Google ID token sign-in/register (`credential`, optional `subjectIds[]`) |
| POST | `/auth/verify-email` | Optional | Verify with `token` from email link |
| POST | `/auth/resend-verification` | User | Resend verification email |
| POST | `/auth/forgot-password` | — | Request password reset email |
| POST | `/auth/reset-password` | — | Reset password with `token` + `password` |
| GET | `/auth/config` | — | `{ emailConfigured, googleConfigured, appUrl }` |
| GET | `/auth/me` | User | Current user |
| POST | `/auth/close-account` | User | Self-deactivate (optional `password` for email accounts) |
| POST | `/auth/change-password` | User | Change password |

Auth-related **POST** routes are **rate-limited** (40 requests per 15 minutes per IP).

### Subjects & topics

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/subjects/catalog` | — | All subjects (registration picker) |
| GET | `/subjects` | User | Enrolled subjects with aggregated progress |
| GET | `/subjects/available` | User | Subjects not yet enrolled |
| POST | `/subjects/enroll` | User | Enroll in subjects (`subjectIds[]`) |
| GET | `/subjects/:id/topics` | User | Topics + stats; see pagination below |

### Study & progress

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/topics/:id/flashcards` | User | Study deck (see query params) |
| POST | `/progress` | User | Save review (requires enrollment on that card’s subject) |

**Study query params:** `mode=learn|test|flashcards`, `shuffle=true|false`, `weakOnly=true`, `types=MCQ,TRUE_FALSE,FILL_BLANK`.

**Study response:** Includes `totalAvailable`, `flashcards[]`, and optionally `truncated: true` + `maxCards` when the deck exceeds `MAX_STUDY_CARDS`.

**Progress body:** `{ flashcardId, status? }` or `{ flashcardId, selectedAnswer }` for graded practice. Returns `correct`, `correctAnswer`, updated `status`.

Progress is **rate-limited** (150 requests per minute per IP).

### Profile

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/profile` | User | Stats, streak calendar, paginated topics |

Query: `page`, `limit` (default 10 topics per page).

### Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/reports/overview` | Admin | KPIs, growth stats, DAU/WAU/MAU (`from`, `to` dates, UTC) |
| GET | `/admin/reports/learners` | Admin | Learner engagement table (`page`, `limit`, `role`, `inactiveDays`, `includeInactive`; `format=csv` export) |
| GET | `/admin/reports/content` | Admin | Content health by subject/topic with insight flags |
| GET/POST/PUT/DELETE | `/admin/users` | Admin | Users (`page`, `limit`, `group=learners\|admins\|all`, `includeInactive` on GET) |
| DELETE | `/admin/users/:id` | Admin | Deactivate user (not hard delete) |
| POST | `/admin/users/:id/reactivate` | Super admin | Reactivate deactivated user |
| POST | `/admin/users/:id/verify-email` | Super admin | Mark email verified |
| GET/POST/PUT/DELETE | `/admin/flashcards` | Admin | Cards (`page`, `limit`, `search` on GET) |
| POST | `/admin/flashcards/import` | Admin | Import CSV (`csv` string in JSON, max 2MB) |
| GET | `/admin/flashcards/import/template` | Admin | Download template |
| GET | `/admin/flashcards/export` | Admin | Export all cards |
| GET/POST/PUT/DELETE | `/admin/subjects` | Admin | Subjects |
| POST/PUT/DELETE | `/admin/topics` | Admin | Topics |

### Roles

| Role | Capabilities |
|------|----------------|
| `USER` | Study enrolled subjects only |
| `ADMIN` | Manage content and users (not super admins) |
| `SUPER_ADMIN` | Full user management; cannot delete self or demote last super admin |

Staff roles bypass subject enrollment and see all subjects.

**Admin UI:** Staff land on **Dashboard** (`/admin/dashboard`) with KPIs and charts; detailed **Learner engagement** and **Content health** reports are linked from the dashboard (`/admin/reports/learners`, `/admin/reports/content`). Flashcard CRUD is at `/admin/cards`. `/admin` and `/admin/reports` redirect to the dashboard.

### Pagination

Admin list endpoints return:

```json
{
  "items": [ ... ],
  "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

| Endpoint | Default `limit` |
|----------|-----------------|
| `GET /admin/flashcards` | 20 |
| `GET /admin/users` | 15 |
| `GET /admin/reports/learners` | 20 |
| `GET /profile` (topics) | 10 |
| `GET /subjects/:id/topics` | 12 (only when `page` or `limit` is sent) |

For `GET /subjects/:id/topics`, **omit** `page` and `limit` to return all topics (used by internal study navigation).

## Security

Full assessment: **[docs/SECURITY.md](docs/SECURITY.md)** (last reviewed June 2026).

**Implemented controls:**

- bcrypt passwords (min 8 chars); JWT on protected routes; role checks for admin
- Email verification gate for study writes; Google token verification server-side
- Account deactivation (admin + self-service close); super-admin reactivate / verify-email
- Rate limits: auth POST 40/15min/IP; progress 150/min/IP (Express + Vercel fast paths)
- Helmet headers; 2MB JSON body limit; CSV import size cap
- `JWT_SECRET` length validation in production; npm `uuid` override for Google auth chain
- No production secrets in git; dev-only Vitest patched (≥4.1.8)

**Advisory:** JWTs live in `localStorage` (XSS risk). Prefer HTTPS-only production; consider httpOnly cookies for stricter deployments.

After editing [`docs/openapi.yaml`](docs/openapi.yaml), run `npm run sync:openapi`.

## CSV Import & Question Types

From **Admin → Cards**. Required columns: `subject`, `topic`, `question`, `answer`, `difficulty`.

| Type | `questionType` | Notes |
|------|----------------|-------|
| Multiple choice | `MCQ` (default) | Optional `distractor1`–`3`; auto-filled from other MCQ in topic if omitted |
| True / False | `TRUE_FALSE` | `answer` must be `True` or `False` |
| Fill in the blank | `FILL_BLANK` | Use `___` in `question` |

```csv
subject,topic,questionType,question,answer,distractor1,distractor2,distractor3,difficulty
AI Concepts,Machine Learning Basics,MCQ,What is supervised learning?,Learning from labeled pairs,Wrong A,Wrong B,Wrong C,Easy
AI Concepts,Machine Learning Basics,TRUE_FALSE,Supervised learning requires labeled data.,True,,,,Easy
AI Concepts,Machine Learning Basics,FILL_BLANK,Cross-validation checks how well a model ___.,generalizes,,,,Medium
```

- Subjects and topics are created automatically if missing
- Duplicate questions (same topic + question text) are skipped
- Difficulty: `Easy`, `Medium`, `Hard` (case-insensitive)

## Database Commands

```bash
cd server
npx prisma migrate dev      # apply migrations (dev)
npx prisma migrate deploy   # apply migrations (production)
npx prisma generate
npm run db:seed             # seed admin + sample cards
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Request failed` / 403 from API | Ensure server runs on **5001**; restart after `.env` changes |
| `Cannot connect to the server` | Run `npm run dev` from project root or `cd server && npm run dev` |
| Login / DB errors | `cd server && npx prisma migrate dev && npm run db:seed` |
| `JWT_SECRET` startup error | Set a secret ≥ 32 characters in `server/.env` |
| `Too many attempts` on login | Wait 15 minutes or restart server (dev rate limit resets) |
| Frontend API not reaching backend | Confirm Vite proxy in `client/vite.config.js` points to port 5001 |
| Vercel build > 250MB function | Remove `includeFiles: server/**`; see [docs/SECURITY.md](docs/SECURITY.md) |
| `vercel.json` schema error | `excludeFiles` must be ≤256 characters (use short globs) |
| Vercel deploy OK but API 503 | Check `JWT_SECRET`, `DATABASE_URL`, `DIRECT_URL` in project env |

## Testing & CI

| When | What runs |
|------|-----------|
| Push / PR to `main` | [GitHub Actions](.github/workflows/ci.yml) → `npm run ci` (30 tests + client build) |
| Local pre-push | `npm run ci` (same as Actions) |
| Vercel deploy | `scripts/build-vercel.sh` — **no tests** on Vercel (keeps bundle small; rely on CI on `main`) |

| Layer | Tool | Coverage |
|-------|------|----------|
| Server unit | Vitest 4 | Question types, MCQ, roles, config, authUser, rate limits |
| Server API smoke | Supertest | `/api/health`, 404, `/api/auth/config` |
| Client unit | Vitest 4 | `reportDates`, `roles`, `formatDashboardNum` |

```bash
npm run test              # server + client (24 + 6 tests)
npm run ci                # test + client production build
npm run lint              # client ESLint (not gated in CI yet)
npm run sync:openapi      # copy docs/openapi.yaml → client/public/
```

**Next test improvements:** DB integration tests, Playwright E2E, ESLint in CI after rule cleanup.

### Audit log verification (PostgreSQL / Supabase)

After applying the `audit_events` migration:

1. Create or pick a disposable test user (not production data).
2. In the Supabase SQL editor (or `psql`), run: `DELETE FROM users WHERE email = 'your-test@example.com';`
3. Query: `SELECT action, source, metadata FROM audit_events WHERE action = 'USER_DELETED_DB' ORDER BY occurred_at DESC LIMIT 1;`
4. Expect one row with `source = DB_TRIGGER` and a `metadata.snapshot` of the deleted user.

Super admins can also browse events at **Admin → Audit log** (`/admin/audit`) after a normal login or admin action.

## Scripts

| Command | Location | Description |
|---------|----------|-------------|
| `npm run setup` | root | Install, migrate, seed |
| `npm run dev` | root | Run API + client concurrently |
| `npm run test` | root | Server + client unit/API smoke tests |
| `npm run ci` | root | Tests and client build (pre-deploy check) |
| `npm run lint` | root | Client ESLint |
| `npm run dev` | `server/` | API only (nodemon) |
| `npm run dev` | `client/` | Vite dev server |
| `npm run build` | `client/` | Production frontend build |

## SEO & search engines

Built-in: meta tags, Open Graph, `robots.txt`, `sitemap.xml`, and per-route titles. Public pages (`/`, `/login`, `/register`) are indexable; signed-in app routes use `noindex`.

**You still need to register the site in [Google Search Console](https://search.google.com/search-console)** and submit the sitemap. Step-by-step: [docs/SEO.md](docs/SEO.md).

Optional env: `VITE_SITE_URL=https://memora.cards` in `client/.env` and Vercel (canonical + social preview URLs).

## Roadmap

- Spaced repetition (SM-2 or similar)
- httpOnly cookie auth / refresh tokens
- Server-side study sessions
- Leaderboards and shared decks
