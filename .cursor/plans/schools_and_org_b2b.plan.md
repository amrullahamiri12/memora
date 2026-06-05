# Schools & Org B2B Plan

Free-first strategy: everyone gets full access in the pilot. Payment, seat limits, and Stripe are deferred. Architecture should support future Plus (B2C) and Team (B2B) monetization.

## Principles

- **Platform roles** stay global: `USER`, `ADMIN`, `SUPER_ADMIN`
- **Org roles** are tenant-scoped: `ORG_OWNER`, `ORG_ADMIN`, `INSTRUCTOR`, `LEARNER`
- Stop using global `ADMIN` for school staff — school staff use org roles
- **Content**: platform catalog subjects have `organizationId = null`; school-owned subjects have `organizationId` set
- **Billing**: deferred — `plan` defaults to `FREE`, `seatLimit` nullable

---

## Phase 1 — Free org pilot (start here)

1. **Schema**: `Organization`, `OrganizationMember`, `OrganizationInvitation`; `organizationId` on `Subject`; `plan` default `FREE`
2. **Roles**: Split platform `SUPER_ADMIN` from org roles; `activeOrganizationId` in JWT/session; org middleware on admin routes
3. **API**: Scope admin reports, users, subjects, flashcards by `organizationId`
4. **UI**: Org context/switcher; adapt existing admin pages (`AdminDashboard`, `AdminReportsLearners`, `AdminUsers`, `AdminSubjects`)
5. **Invites**: Email invite + join codes; org setup flow (`/org/setup`, `/org/join`, `/org/accept`)
6. **Entitlements**: `server/lib/entitlements.js` — all features enabled in pilot; no Stripe

**Deferred in Phase 1:** Stripe, seat limits, Plus upsell, SSO, classrooms

---

## Phase 2 — Team billing

- Stripe Checkout + webhooks
- Seat limits and entitlements for Team plan
- Upgrade path from free pilot orgs

---

## Phase 3 — Plus (B2C)

- User-level Plus subscription
- Upgrade entry in account menu

---

## Phase 4 — Classrooms & assignments

- Cohorts/classes, roster CSV
- Assigned subjects and due dates

---

## Key files (when implementing)

| Area | Paths |
|------|-------|
| Schema | `server/prisma/schema.prisma` |
| Org API | `server/routes/organizations.js`, `server/lib/organizations.js` |
| Org context | `server/lib/orgContext.js`, `server/middleware/orgContext.js` |
| Entitlements | `server/lib/entitlements.js` |
| Scoped admin | `server/routes/admin.js`, `server/lib/adminReports.js` |
| Client org UI | `client/src/pages/org/`, `client/src/components/OrgSwitcher.jsx` |
| Auth | `server/lib/authUser.js` (JWT `organizationId`), `client/src/context/AuthContext.jsx` |

---

## SUPER_ADMIN pilot tooling

- Provision pilot schools on behalf of customers
- Impersonate / select any org in switcher
- Global dashboard when no org selected (current platform-wide behavior)

---

## Local dev notes

- Client: `http://localhost:5173/`
- API: `http://localhost:5001/`
- Marketing home while logged in: `/home`
- Invites need `RESEND_API_KEY` + email configured in `server/.env`
