# Memora — Security Assessment

Last reviewed: **June 2026** (codebase on `main`). This document summarizes controls, known gaps, and operational checks. It does not replace a formal penetration test.

## Summary

| Area | Status | Notes |
|------|--------|--------|
| Dependency audit (production) | **Pass** | Root + server prod deps: 0 vulnerabilities. `uuid` pinned via npm overrides. |
| Dependency audit (dev) | **Pass** | Vitest upgraded to ≥4.1.8 (dev-only; not deployed to Vercel server bundle). |
| Authentication | **Pass** | JWT (HS256), bcrypt passwords, Google ID token verified server-side. |
| Account lifecycle | **Pass** | Soft deactivation; closed accounts blocked at auth; optional reactivate (super admin). |
| Authorization | **Pass** | Role checks on admin routes; enrollment checks on progress; staff bypass documented. |
| Rate limiting | **Pass** | Auth POST: 40 / 15 min per IP; progress POST: 150 / min (Express + Vercel fast paths). |
| Input validation | **Pass** | express-validator on auth/admin writes; question-type validation; CSV size cap. |
| Transport & headers | **Pass** | Helmet on Express; production assumes HTTPS (Vercel). |
| Secrets in repo | **Pass** | `.env` gitignored; examples use placeholders only. |
| Session storage | **Advisory** | JWT in `localStorage` — XSS could exfiltrate tokens; see roadmap. |
| Automated tests | **Pass** | 67 unit/smoke tests; GitHub Actions on `main`. |
| Vercel bundle | **Pass** | No `includeFiles: server/**`; Linux-only Prisma engine on deploy. |

## Authentication & accounts

- **Passwords:** bcrypt, minimum 8 characters on register, reset, and change.
- **JWT:** `JWT_SECRET` required; ≥32 characters enforced in production / Vercel.
- **Google:** `credential` JWT verified with `GOOGLE_CLIENT_ID` in `server/.env`; UI needs `VITE_GOOGLE_CLIENT_ID` in `client/.env` (same Web client ID). Do not commit either file.
- **Email verification:** Required for study **writes** (progress, enroll) on normal email/password accounts; guests and staff are exempt per product rules.
- **Guests:** `@guest.memora.local` accounts; upgrade path to full registration.
- **Deactivation:** `DELETE /admin/users/:id` sets `deactivated_at` (data retained). Users may `POST /auth/close-account`. Deactivated users receive `403` + `ACCOUNT_DEACTIVATED`.
- **optionalAuth:** Does not attach deactivated users (used for verify-email with optional bearer).

## API hardening

- **CORS:** `CLIENT_URL` (+ `VERCEL_URL` / branch URL on previews).
- **Body size:** JSON limited to 2MB; CSV import capped by `MAX_CSV_BYTES` (default 2MB).
- **SQL:** Parameterized queries in fast paths (`pg`); Prisma for Express routes.
- **Admin:** `authMiddleware` + `adminMiddleware`; super-admin-only reactivate and manual verify-email.
- **Reporting:** Guest users excluded from learner metrics (`%@guest.memora.local`).

## Audit trail

Memora records security and admin actions in an append-only `audit_events` table (application writes + PostgreSQL `BEFORE DELETE` trigger on `users`).

| Source | What it captures |
|--------|------------------|
| **APP** | Login success/failure, registration, account close, admin CRUD, CSV import/export, contact form, rate-limit hits |
| **DB_TRIGGER** | Hard `DELETE FROM users` in SQL (row snapshot in `metadata` before cascades) |

- **Read access:** `GET /admin/audit-events` — super admin only; paginated filters by action, source, date, actor/target user.
- **PII:** Failed-login events store attempted email (abuse detection). Passwords, tokens, and credential fields are never stored in `metadata`.
- **Retention:** No automatic purge in v1; optional `AUDIT_RETENTION_DAYS` + scheduled job can be added later.
- **GDPR:** Soft deactivation retains account data; hard DB delete leaves a trigger archive row — disclose in privacy policy that security logs may outlive the account.
- **Verification (manual):** In Supabase SQL editor, delete a disposable test user with `DELETE FROM users WHERE email = '…'`; confirm an `USER_DELETED_DB` row with `source = DB_TRIGGER` appears in `audit_events`.

## Deployment (Vercel)

- **Single serverless function:** `api/index.js` — fast paths (`fastAuth`, `fastApi`, `pg`) first; Express fallback for remaining routes.
- **Do not** set `includeFiles: server/**` — exceeds 250MB unzipped limit.
- **Install:** Server uses `--omit=dev` (no Vitest in deploy tree).
- **Build:** `scripts/build-vercel.sh` — tests only when not on Vercel; `prisma generate` with Linux binary target on Vercel.
- **Optional:** `VERCEL_ANALYZE_BUILD_OUTPUT=1` for bundle size debugging.

## Dependency hygiene

```bash
npm audit                    # root (API handler deps)
npm audit --prefix server    # after: npm install --prefix server
npm audit --prefix client    # after: npm install --prefix client --include=dev
```

Re-run after dependency bumps. Production Vercel installs omit server devDependencies.

## Known limitations (accepted / roadmap)

| Risk | Mitigation today | Future improvement |
|------|------------------|-------------------|
| JWT in `localStorage` | Short-ish TTL (`JWT_EXPIRES_IN`); HTTPS only in prod | httpOnly cookies + refresh tokens |
| No CSRF tokens | Same-site SPA + bearer header | Cookie-based auth with CSRF |
| Rate limits per IP | In-memory on Vercel (per warm instance) | Shared store (Redis) for strict global limits |
| Express cold start | Fast paths for hot routes | Move remaining admin writes to `fastApi` |
| No E2E security tests | Unit + smoke coverage | Playwright + seeded test DB |

## Pre-production checklist

- [ ] Rotate `JWT_SECRET` from any dev default; never commit real secrets.
- [ ] Set production `DATABASE_URL`, `DIRECT_URL`, `CLIENT_URL`, `APP_URL`.
- [ ] Configure Resend + verified `EMAIL_FROM` domain (or documented test sender).
- [ ] Set `GOOGLE_CLIENT_ID` + `VITE_GOOGLE_CLIENT_ID` (same Web client).
- [ ] Change seeded admin password if `db:seed` was run on production.
- [ ] Confirm GitHub Actions CI green on `main`.
- [ ] Hit `/api/health` and complete one study + one admin report on production.

## Reporting issues

Report security concerns privately to the repository owner. Do not post secrets or live tokens in issues or chat.
