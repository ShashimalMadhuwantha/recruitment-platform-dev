# Epic 0 — Project Setup & Infrastructure

- **Epic Number:** 0
- **Epic Title:** Project Setup & Infrastructure
- **Integration Branch:** `epic/00-project-setup`
- **Status:** Completed
- **Reference SRS:** Sections 2.2, 2.3, 6, 8

---

## 1. Overview & Goal

The goal of Epic 0 was to stand up the foundational monorepo, database schema, Express modular monolith backend, React + TypeScript + Tailwind CSS frontend design system, single-VPS PM2/Nginx deployment scripts, and GitHub Actions CI pipeline so every subsequent epic has a robust foundation to build upon.

---

## 2. Tasks Delivered

| Task | Purpose | Branch | Files Created / Modified |
|---|---|---|---|
| **Initialize monorepo structure** | Set up npm workspaces for `/shared`, `/backend`, and `/frontend` with unified scripts and Prettier. | `feature/00-monorepo-init` | `package.json`, `.gitignore`, `.prettierrc`, `shared/*` |
| **Set up MySQL schema & migrations** | Create Prisma ORM schema modeling 20+ tables per SRS §6 and database seed scripts. | `feature/00-db-migrations-setup` | `backend/prisma/schema.prisma`, `backend/prisma/seed.ts`, `backend/src/db/client.ts` |
| **Configure Express app skeleton** | Build the modular monolith domain modules (`auth`, `ats-scoring`, `applicant-profile`, `job-vacancy`, `application-pipeline`, `notifications`, `admin`). | `feature/00-express-skeleton` | `backend/src/app.ts`, `backend/src/server.ts`, `backend/src/modules/**/*` |
| **Set up environment config & secrets** | Add typed config with Zod schema validation and `.env.example` templates. | `feature/00-env-config` | `backend/src/config/index.ts`, `backend/.env.example`, `frontend/.env.example`, `.env.example` |
| **Set up PM2 + Nginx deployment** | Write PM2 cluster process config and Nginx reverse-proxy configuration. | `feature/00-deploy-pm2-nginx` | `backend/ecosystem.config.js`, `nginx/recruitment-platform.conf` |
| **Set up CI pipeline** | Automated lint, typecheck, test, and build workflow on push/PRs. | `feature/00-ci-pipeline` | `.github/workflows/ci.yml` |

---

## 3. Architecture & Technical Decisions

### Monorepo Workspaces
- **Workspaces:** `shared`, `backend`, `frontend`.
- **Shared Contracts:** `@recruitment-platform/shared` exports standard API envelope `{ data, error }`, user roles (`SUPER_ADMIN`, `RECRUITER`, `APPLICANT`), statuses, and ATS breakdown interfaces.

### Frontend Layer
- **Tech:** React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, React Router DOM.
- **Design Tokens:** Base palette (`brand-900`, `brand-600`, `brand-100`), ATS score color bands (High: 80–100%, Mid: 50–79%, Low: 0–49%), and semantic states.
- **Components:** `ScoreBadge.tsx` (with color bands & progress bar), `Button.tsx`, `StatusPill.tsx`, `FormField.tsx`, `Card.tsx`, `EmptyState.tsx`, `ScoreBreakdown.tsx`.

### Backend Layer
- **Tech:** Express.js + TypeScript as a **modular monolith** (no microservices, zero Redis, zero Docker).
- **Domain Modules:** Self-contained folders with routes, controller, service, types, and tests.
- **ATS Scoring Engine:** Pure sub-scores (`skills-match`, `experience-match`, `education-match`, `semantic-match` with in-process TF-IDF cosine similarity via `natural`, `certification-match`) and weight configuration resolver.
- **Middleware:** Centralized typed error handler, JWT authentication, RBAC authorization, in-memory rate limiting, Pino logging.
- **Background Jobs:** Lightweight in-process poller using `node-cron` against MySQL `BackgroundJob` table.

---

## 4. Verification & Test Results

```text
✓ Prisma Client generation: PASSED
✓ TypeScript typecheck across all workspaces: PASSED (0 errors)
✓ Backend Tests (vitest): 8/8 PASSED (ATS engine unit tests + /api/health integration tests)
✓ Frontend Tests (vitest): 4/4 PASSED (ScoreBadge rendering across score bands)
✓ Production Build (npm run build): PASSED
```

---

## 5. Next Steps

- Proceed to **Epic 1: Authentication & Access Control** (`epic/01-auth-access-control`):
  - `feature/01-email-auth` (Bcrypt + JWT)
  - `feature/01-google-oauth`
  - `feature/01-linkedin-oauth`
  - `feature/01-jwt-middleware`
  - `feature/01-rbac-middleware`
  - `feature/01-password-reset-mfa`
