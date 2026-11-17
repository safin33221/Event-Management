# Softilo Event Management — Full System Architecture & Codebase Review

**Review Date:** 2026-11-18  
**Scope:** End-to-end inspection of both repositories:
- **Frontend (`event-management`):** Next.js `16.4.6` (App Router + Turbopack + Cache Components + Partial Prefetching), React `19.3.0`, Tailwind CSS `4.3.3`
- **Backend (`event-management-server`):** NestJS `12.0.1`, Prisma `7.10.1` (`@prisma/adapter-pg`), PostgreSQL, Vitest `4.1.12`, Oxlint `1.58.0`

---

## 1. Executive Summary

The platform is a full-stack Event & Photography Studio Management ERP + Public Portfolio Storefront structured around a strict **Single-Studio (`default`)** PostgreSQL data model, **integer `BigInt` poisha** currency arithmetic (`BDT`), and **`Asia/Dhaka`-aware** UTC scheduling.

Overall, the core transactional workflows (**Inquiries → Versioned Quotes → Bookings → Advance-Gated Confirmation → Auto-Provisioned Deliverables & Tasks → Verified Payment Ledger → Digital Portfolios**) are thoughtfully engineered with strong server-side RBAC, transactional integrity (`SELECT ... FOR UPDATE` resource locking), idempotency keys on financial mutations, and RFC-5545 / PDFKit document generation.

At the same time, the review identified several **high-priority security hardening gaps, offline/build edge cases, pre-existing backend test type errors, and large-component refactoring targets** documented in Sections 5–7.

---

## 2. System Architecture Overview

### 2.1 High-Level Stack & Integration Flow

```text
Browser / Client
   │
   ├── Public Routes: /, /portfolio, /portfolio/[slug], /album/[slug], /a/[slug], /login
   └── Staff / Admin Routes: /admin/*, /staff, /api/*/invoice.pdf, /api/schedule/*.ics
          │
          ▼  (Next.js proxy.ts enforces cookie check, same-origin CSRF check, security headers)
Next.js Server Components & Server Actions (src/service/* via src/lib/serverFetch.ts)
          │
          ▼  (Authorization: Bearer <HS256 JWT>)
NestJS Backend API (AuthGuard + RolesGuard + ValidationPipe + PrismaExceptionFilter)
          │
          ▼  (@prisma/adapter-pg + pg Pool)
PostgreSQL Database (Softilo Schema: 652 lines, BigInt poisha, GIST/atomic reservations)
```

### 2.2 Backend Module Map (`event-management-server/src/modules`)

| Module | Controllers | Key Responsibilities |
| :--- | :--- | :--- |
| **`auth`** | `AuthController` (`/auth/login`, `/auth/me`) | Scrypt password verification (`crypto.scryptSync` + `timingSafeEqual`), HS256 JWT signing (`24h` default TTL) |
| **`studio`** | `StudioController`, `PublicBrandingController` | Studio settings (`Asia/Dhaka`, `BDT`, advance policy, `themeTokens`), branding updates, active team member management |
| **`catalog`** | `CatalogController`, `PublicCatalogController` | Event types, service items, published packages, deliverable rules (`DeliverableLabel`), task templates (`TaskTemplate`), Cloudinary signed uploads, gallery & digital portfolio albums (`PortfolioEvent` / `PortfolioMedia`) |
| **`inquiries`** | `InquiriesController`, `PublicInquiriesController` | Public lead capture + internal phone/walk-in logging, `INQ-YYYY-NNNN` sequencing, `reconcileInquiryPipeline()` self-healing |
| **`quotes`** | `QuotesController` | Multi-version quote builder (`QuoteVersion`, `QuoteLineItem`), PDF proposal/invoice streaming (`/quotes/:id/invoice.pdf`), `acceptQuote()` atomic booking creation + inquiry conversion + deliverable seeding |
| **`bookings`** | `BookingsController` | `BKG-YYYY-NNNN` management, advance-verified `confirmBooking()`, `completeBooking()`, `cancelBooking()`, receipt JSON & PDF invoice generation (`/bookings/:id/invoice.pdf`), automatic deliverable backfill (`deliverable-provisioning.ts`) |
| **`payments`** | `PaymentsController` | Receipt recording (`Idempotency-Key` + payload hash), verify/reject receipts, refunds, credit-note/charge adjustments, overpayment checks, `/finance/report` & CSV/JSON ledger export |
| **`schedule`** | `ScheduleController` | `Resource` management (`CREW`, `EQUIPMENT`, `ROOM`), availability conflict checks, atomic `reserveResourcesTx()` (`FOR UPDATE`), reschedule/cancel audit logs, `.ics` exports & HMAC-signed public feed (`/public/calendar/feed.ics`) |
| **`operations`** | `OperationsController` | Staff `Assignment` lifecycle (`/assignments/my`), `Deliverable` CRUD, `POST /bookings/:bookingId/deliverables/sync-quote`, `DELETE /deliverables/:id`, delivery tracking |

### 2.3 Frontend App Routes (`event-management/src/app`)

- **Public Storefront & Digital Albums:**
  - `/` (`src/app/page.tsx`) — Public agency showcase, featured portfolios, packages, gallery highlights, inquiry form
  - `/portfolio` (`src/app/portfolio/page.tsx`) & `/portfolio/[slug]` (`src/app/portfolio/[slug]/page.tsx`) — Client portfolio directory & album views
  - `/album/[slug]` (`src/app/album/[slug]/page.tsx`) & `/a/[slug]` (`src/app/a/[slug]/page.tsx`) — Shareable client digital album routes with custom `themeTokens`, `AdaptiveVideoPlayer`, `LazyAlbumImage`, lightbox viewer, and `<Suspense>` boundaries for Next.js 16 `cacheComponents: true`
  - `/login` (`src/app/login/page.tsx`)
- **Admin & Staff Workspaces (`(dashboard)` layout guarded by `getMe()` + `proxy.ts`):**
  - `/admin` — Operational overview & alerts (`Overview`)
  - `/admin/inquiries` — Open client inquiries (`NEW` / `QUOTED` default filter, `CONVERTED` hidden by default)
  - `/admin/quotes` — Active proposals (`DRAFT` / `SENT` default filter, `ACCEPTED` hidden by default) + PDF proposal download
  - `/admin/bookings` & `/admin/bookings/[id]` — Booking pipeline & workspace (`Payments & Ledger`, `Shoot Schedule`, `Deliverables`, `Crew Tasks`)
  - `/admin/calendar` — Studio schedule & `.ics` Google Calendar subscription
  - `/admin/finance` — Revenue, refunds, & ledger export (`OWNER` & `ACCOUNTANT` only)
  - `/admin/gallery`, `/admin/portfolio`, `/admin/catalog`, `/admin/team`, `/admin/settings`
  - `/staff` — Crew task & deliverable portal (`STAFF` landing workspace)
- **Next.js BFF Streaming / Download API Proxies (`src/app/api`):**
  - `/api/bookings/[id]/invoice.pdf`
  - `/api/quotes/[id]/invoice.pdf`
  - `/api/schedule/calendar.ics` & `/api/schedule/sessions/[id]/calendar.ics`

---

## 3. Core Engineering Strengths

1. **Global Deny-by-Default Auth & RBAC (`src/common/guards/auth.guard.ts`)**
   - `AuthGuard` is registered globally via `APP_GUARD` in `AppModule`. Public routes must opt in explicitly via `@Public()`.
   - Every authenticated request re-fetches `{ id, email, role, isActive }` from PostgreSQL (`prisma.user.findUnique`), ensuring deactivated users are blocked immediately even before JWT expiration.
2. **Exact Integer Money & Financial Guards (`src/common/money/money.ts`, `payments.service.ts`)**
   - Avoids floating-point rounding bugs by storing all currency values in integer `BigInt` poisha.
   - Enforces idempotency keys (`hashIdempotencyPayload`) on financial writes and rejects overpayments above remaining due balance with Tk-formatted error messages.
3. **Race-Free Resource Reservation (`src/modules/schedule/schedule.service.ts`)**
   - `reserveResourcesTx()` deterministically sorts resource IDs, locks rows with `SELECT id FROM resources ... FOR UPDATE`, and checks half-open `[startAt, endAt)` overlaps inside Prisma transactions (`P2010`/`P2034` exclusion conflicts mapped to `409 Conflict` in `PrismaExceptionFilter`).
4. **End-to-End Pipeline Consistency & Zero-Hassle Deliverables (`deliverable-provisioning.ts`)**
   - Accepting a quote atomically creates/updates the `Booking`, marks any linked `Inquiry` as `CONVERTED`, supersedes sibling quotes, and seeds `Deliverable` rows directly from `QuoteLineItem`s + `DeliverableLabel` templates—even before booking confirmation (`PENDING_CONFIRMATION`).
   - `BookingsService.getBooking()` also auto-backfills existing bookings that have `0` deliverables, and `BookingsWorkspace.tsx` provides 1-click preset additions, inline status/due-date/assignee controls, 1-click `Mark Delivered`, and 1-click Studio Album link autofill.
5. **Security Headers & Proxy Protections (`src/proxy.ts`)**
   - Sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy: same-origin`, `private, no-store` on authenticated routes, and enforces `Origin` vs `Host` checks on mutating `/api/*` requests.

---

## 4. Verification & Health Check Snapshot (Run During Review)

All commands below were executed directly against the current workspace on **2026-11-18**:

| Check | Repository | Command | Outcome | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Unit Tests** | Backend | `npm test` (`vitest run`) | **PASSED (13 files, 40/40 tests)** | Includes `deliverable-provisioning.spec.ts`, `quotes.service.spec.ts`, `booking-logic-guards.spec.ts`, `portfolio-showcase.spec.ts`, `financial-report.spec.ts`, `invoice-pdf.spec.ts`, `ical.spec.ts`, etc. |
| **Linter** | Backend | `npm run lint` (`oxlint --type-aware`) | **PASSED (0 warnings, 0 errors)** | Checked 113 files with 111 rules in 1.7s |
| **TypeScript** | Backend | `tsc --noEmit --incremental false` | **3 Pre-Existing Errors** | All 3 are in `src/modules/catalog/portfolio-showcase.spec.ts` (lines 193, 200, 282: mock typing `TS2698` & `TS7022`). Production `src/modules/*` runtime files have 0 TS errors. |
| **Nest CLI Build** | Backend | `npm run build` (`nest build`) | **FAILED on Node v20.15.0** | `@angular-devkit/schematics` throws `ERR_REQUIRE_ESM` loading `magic-string@1.4.1/dist/index.mjs`. Requires Node `20.19+`/`22+` or updating CLI tooling / compiling via `tsc`. |
| **TypeScript** | Frontend | `npx tsc --noEmit` | **PASSED (0 errors)** | Clean across all pages, components, services, and API routes |
| **ESLint** | Frontend | `npm run lint` (`eslint`) | **PASSED (0 warnings, 0 errors)** | Clean across full Next.js app |
| **Next.js Build** | Frontend | `npm run build` (`next build`) | **FAILED Offline** | `next/font/google` (`Cormorant Garamond`, `Inter`, `JetBrains Mono` in `src/app/layout.tsx`) failed reaching `fonts.googleapis.com` without internet. Needs internet during CI/Docker build or switch to `next/font/local`. |

---

## 5. Findings: Security, Reliability & Architecture Issues

### High Priority

1. **Frontend JWT Verification Fails Open When `AUTH_SECRET` Is Unset (`event-management/src/lib/jwtHandler.ts:58-70`)**
   - **Finding:** `verifyAccessToken()` only runs HMAC-SHA256 verification inside `if (secret && secret.trim().length > 0)`. If `AUTH_SECRET` is missing in the Next.js runtime environment, `proxy.ts` and `getMe()` accept an unsigned JWT payload (`sub`, `role`, `exp`) for UI cookie routing.
   - **Risk:** Although the NestJS backend (`AuthGuard`) strictly requires `AUTH_SECRET.length >= 16` and blocks forged tokens on every API call (preventing data leaks), the Next.js edge/page shell could still render empty admin chrome or bypass `/login` redirects if `AUTH_SECRET` is omitted on the frontend container.
   - **Recommendation:** Require `AUTH_SECRET` (`>= 16` chars) in `verifyAccessToken()` when `NODE_ENV === 'production'` (or always fail closed by returning `null` if `!secret`).

2. **No Rate Limiting / Brute-Force Protection or Helmet/CORS Policy in Backend (`main.ts`, `app.setup.ts`, `auth.controller.ts`, `public-inquiries.controller.ts`)**
   - **Finding:** Neither `@nestjs/throttler` nor custom rate-limiting middleware is installed. `@Public()` endpoints—especially `POST /auth/login` (password brute-force vector) and `POST /public/inquiries` (lead spam / sequence exhaustion)—have no request throttling. `app.enableCors()` and `helmet()` are also unconfigured.
   - **Recommendation:** Install `@nestjs/throttler` (tight limits on `/auth/login` and `/public/inquiries`), add `helmet()`, and configure explicit `enableCors({ origin: ... })` in `app.setup.ts`.

3. **Backend CLI Build Incompatibility on Node `v20.15.0` (`package.json`)**
   - **Finding:** Running `npm run build` (`nest build`) fails under Node `v20.15.0` with `ERR_REQUIRE_ESM` (`@angular-devkit/schematics` calling `require()` on ESM `magic-string@1.4.1`).
   - **Recommendation:** Enforce `"engines": { "node": ">=20.19.0" }` (or Node 22 LTS) in `package.json`, or use `tsc` directly in the build script if Nest schematics plugins are unneeded.

### Medium Priority

4. **Pre-Existing TypeScript Errors in Backend Test Spec (`src/modules/catalog/portfolio-showcase.spec.ts:193, 200, 282`)**
   - **Finding:** `vitest` transforms and passes the test at runtime, but strict `tsc --noEmit` fails due to `...(data as never)` (`TS2698`) and self-referencing `mockPrisma` (`TS7022`).
   - **Recommendation:** Type `mockPrisma` explicitly (`let mockPrisma: ...`) and cast `data as Record<string, unknown>` so `tsc --noEmit` stays 100% green across both `src/` and spec files.

5. **Static / Non-Revocable Public iCalendar Feed Token (`src/modules/schedule/ical.ts:98-115`)**
   - **Finding:** `signCalendarFeedToken(secret)` computes HMAC-SHA256 over the constant `'softilo-google-calendar-feed-v1'`. Everyone shares one permanent token, and revoking a leaked feed URL requires rotating `AUTH_SECRET` (which also logs out every studio user).
   - **Recommendation:** Store a dedicated rotatable `calendarFeedSecret` (or versioned feed key) in `StudioSettings` with a "Regenerate Calendar Feed URL" button in Settings/Calendar.

6. **Offline Build Sensitivity from Google Fonts (`src/app/layout.tsx`)**
   - **Finding:** `next/font/google` requires external access to `fonts.googleapis.com` at build time, causing `next build` to abort in offline or restricted build runners.
   - **Recommendation:** Bundle the WOFF2 font files under `src/app/fonts/` and switch to `next/font/local` for deterministic zero-network Docker/CI builds.

7. **Hardcoded Fallback Defaults in `AppModule` & `PrismaService`**
   - **Finding:** `AppModule` (`src/app.module.ts:24-28`) passes fallback `'YOUR_APP_KEY'` / `'YOUR_APP_SECRET'` to `ObserveModule.forRoot()`, and `PrismaService` (`src/prisma/prisma.service.ts:10`) falls back to `'postgresql://postgres:postgres@localhost:5432/softilo_events?schema=public'` when `DATABASE_URL` is absent.
   - **Recommendation:** Conditionally disable `@nestjs/observe` unless `OBSERVE_APP_KEY` & `OBSERVE_APP_SECRET` are provided, and rely strictly on `validateEnvironment()` rather than a default local DB credential string.

8. **Proxy Role Check Alignment (`event-management/src/proxy.ts:23-31`)**
   - **Finding:** `canRoleAccessPath()` restricts `/api/bookings/*/invoice.pdf` to `ADMIN_ROLES`, whereas `/api/quotes/*/invoice.pdf` is not listed in `canRoleAccessPath()` (it passes `proxy.ts` for any valid cookie, though backend `QuotesController` blocks `STAFF`/`ACCOUNTANT` with `403`).
   - **Recommendation:** Add `/api/quotes/` (`OWNER`, `COORDINATOR`) to `canRoleAccessPath()` in `proxy.ts` for consistent edge enforcement.

### Low Priority / Code Hygiene

9. **Large Monolithic Components & Services**
   - `event-management/src/components/module/admin/BookingsWorkspace.tsx` is **3,497 lines**, mixing Inquiries list/forms, Quote builder/revisions, Booking list, Payment ledger UI, Shoot scheduler, Deliverables manager, Crew tasks, and Receipt modal in one `'use client'` file.
   - `event-management-server/src/modules/catalog/catalog.service.ts` is **1,415 lines**, combining Catalog CRUD, Package pricing, Rules/Templates, Cloudinary upload signing/verification, Gallery management, and Portfolio showcases.
   - **Recommendation:** Gradually split `BookingsWorkspace.tsx` by tab/feature (`InquiryCreateModal`, `QuoteBuilderModal`, `BookingPaymentsTab`, `BookingScheduleTab`, `BookingDeliverablesTab`, `BookingTasksTab`) and extract `PortfolioShowcaseService` / `GalleryService` out of `CatalogService`.

10. **Dead/Legacy Stub Files (`src/service/auth/sendOtp.ts`, `src/service/auth/verifyOtp.ts`)**
    - Both files return hardcoded stubs (`Password authentication is active for this workspace.`). Remove them if OTP login is permanently retired.

11. **Schema Drift Safeguard (`PrismaService.ensurePortfolioShowcaseTables()`)**
    - `PrismaService.onModuleInit()` runs raw DDL (`CREATE TABLE IF NOT EXISTS "portfolio_events" ...`) on startup. While helpful to prevent `P2021` during rapid dev iteration, production deployments should standardize on `prisma migrate deploy` so raw DDL never diverges from `prisma/schema.prisma`.

---

## 6. Recommended Action Plan (Prioritized)

1. **Security First (Quick Wins):**
   - Fail closed in `event-management/src/lib/jwtHandler.ts` when `AUTH_SECRET` is missing in production.
   - Add `@nestjs/throttler` on `POST /auth/login` and `POST /public/inquiries` + `helmet()` in `app.setup.ts`.
   - Align `/api/quotes/*` role check in `proxy.ts`.
2. **Build & CI Reliability:**
   - Pin Node `>=20.19` / `22 LTS` (fixes `nest build` `ERR_REQUIRE_ESM`).
   - Fix the 3 strict TS mock errors in `portfolio-showcase.spec.ts` so `tsc --noEmit` passes 100% cleanly on the backend too.
   - Consider `next/font/local` if deploying in offline/air-gapped Docker build environments.
3. **Incremental Refactoring:**
   - Split `BookingsWorkspace.tsx` (3,497 lines) and `CatalogService` (1,415 lines) into focused feature modules as features grow.
   - Move Calendar feed signing key to a rotatable per-studio token.
