# Memora — Educational Study App

A full-stack flashcard web app for studying topics with progress tracking, streaks, and an admin panel. Inspired by Quizlet-style study flows (Learn, Flashcards, Test).

## Tech Stack

| Layer | Stack |
|-------|--------|
| Frontend | React 19, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express 5 |
| Database | SQLite (local dev) or PostgreSQL / Supabase (production) |
| ORM | Prisma |
| Auth | JWT (bcrypt password hashing) |

## Features

### Learners
- Registration with **subject enrollment**; dashboard shows only enrolled subjects
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
- CRUD flashcards, subjects, topics, and users (role-based)
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
| `GOOGLE_CLIENT_ID` | Server (Vercel) | Google OAuth 2.0 **Web** client ID |
| `VITE_GOOGLE_CLIENT_ID` | Client build (Vercel) | Same Web client ID (required for Google button in UI) |

Copy [`client/.env.example`](client/.env.example) to `client/.env` for local Google sign-in.

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
| Build Command | `npm run build:vercel` |
| Output Directory | `client/dist` |
| Install Command | installs root, `server/`, and `client/` |

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

Migrations run during build (`prisma migrate deploy`). Seed once locally against the same database if you want demo data:

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
├── client/
│   ├── public/              # Logos, favicon
│   └── src/
│       ├── components/      # UI, study cards, auth layout
│       ├── context/         # Auth, theme
│       ├── pages/           # Dashboard, study, admin
│       └── utils/           # API client, study options, roles
├── server/
│   ├── lib/                 # Business logic (progress, MCQ, pagination, config)
│   ├── middleware/          # Auth, admin, validation, rate limits
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.js
│   └── routes/              # auth, subjects, topics, progress, profile, admin
├── docs/
│   └── openapi.yaml         # OpenAPI 3 spec (source of truth)
├── package.json             # Root scripts (setup, dev)
└── README.md
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
| GET | `/auth/me` | User | Current user |
| POST | `/auth/change-password` | User | Change password |

Login and register are **rate-limited** (40 requests per 15 minutes per IP).

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
| GET/POST/PUT/DELETE | `/admin/users` | Admin | Users (`page`, `limit` on GET) |
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
| `GET /profile` (topics) | 10 |
| `GET /subjects/:id/topics` | 12 (only when `page` or `limit` is sent) |

For `GET /subjects/:id/topics`, **omit** `page` and `limit` to return all topics (used by internal study navigation).

## Security

- Passwords hashed with bcrypt (min **8** characters on register and password change)
- JWT required for protected routes; admin routes also check role
- Progress writes verify the user is enrolled in the card’s subject (or staff)
- `helmet` HTTP security headers
- Rate limits on auth and progress endpoints
- Request body size capped at 2MB
- `JWT_SECRET` validated at server startup

**Note:** Tokens are stored in `localStorage` in the browser. For high-security deployments, consider httpOnly cookies and HTTPS-only production.

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

## Scripts

| Command | Location | Description |
|---------|----------|-------------|
| `npm run setup` | root | Install, migrate, seed |
| `npm run dev` | root | Run API + client concurrently |
| `npm run dev` | `server/` | API only (nodemon) |
| `npm run dev` | `client/` | Vite dev server |
| `npm run build` | `client/` | Production frontend build |

## Roadmap

- Spaced repetition (SM-2 or similar)
- httpOnly cookie auth / refresh tokens
- Server-side study sessions
- Leaderboards and shared decks
