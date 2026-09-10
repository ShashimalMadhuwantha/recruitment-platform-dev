---
name: recruitment-platform-dev
description: Use this skill whenever writing, structuring, or reviewing code for the Recruitment & ATS Platform project (React + TypeScript + Vite frontend, Express.js + TypeScript backend, MySQL database). Always consult this skill before creating a new file, adding a database table or migration, writing an API endpoint, adding a background job, or setting up a test — it defines the required folder structure, migration workflow, testing strategy, API conventions, and git branch naming so all code stays consistent with the project's SRS and Epic Backlog. Trigger this for ANY backend, database, testing, or project-structure work on this specific project, even if the user doesn't say "skill" or reference these documents directly — e.g. "add the job posting endpoint", "create the ATS scoring function", "set up the applicants table", "write a test for the apply flow".
---

# Recruitment & ATS Platform — Development Skill

This skill governs how code for the Recruitment & ATS Platform is structured and written. It implements the architecture defined in `Recruitment_Platform_SRS.md` and the work breakdown in `Epic_Backlog.md` — read both if present in the repo/workspace before starting new feature work, and follow this skill for *how* to build whatever epic/task you're implementing.

**Companion skill:** `recruitment-platform-frontend-design` covers theme, components, and visual layout. This skill covers structure, data, and logic. Use both together on any full-stack task.

## 1. Tech stack (fixed — do not substitute)

| Layer | Choice |
|---|---|
| Frontend | React 18 + TypeScript, built with **Vite**, styled with Tailwind CSS |
| Backend | **Express.js** (Node.js + TypeScript) as a single **modular monolith** — not microservices |
| Database | **MySQL only** — no Redis, no Docker, no Elasticsearch, no vector DB (see SRS §2.2/§2.3 for why) |
| ORM/Query builder | **Prisma** (preferred) or **Knex** — pick one at project start and use it everywhere; don't mix raw SQL and an ORM in the same module without reason |
| Auth | JWT (httpOnly cookie or Authorization header) + OAuth2 (Google/LinkedIn) |
| Background tasks | Plain `async` functions, fire-and-forget or `setImmediate`; `node-cron` + a `background_jobs` table for anything needing retry — never introduce a message queue/broker |
| ATS semantic scoring | `natural` npm package (TF-IDF + cosine similarity), in-process |
| Deployment | PM2 + Nginx on a single server, no containers |

If a task seems to need Redis, Docker, a second language runtime, or a microservice, stop and flag it — it's out of scope for this build (see SRS §8, Launch Scope).

## 2. Monorepo folder structure

```
recruitment-platform/
├── frontend/
│   ├── src/
│   │   ├── app/                    # App shell: router, providers, layout
│   │   │   ├── router.tsx
│   │   │   └── providers.tsx       # QueryClient, Auth context, Theme
│   │   ├── pages/                  # One folder per route, grouped by role
│   │   │   ├── admin/
│   │   │   ├── recruiter/
│   │   │   ├── applicant/
│   │   │   └── auth/
│   │   ├── components/
│   │   │   ├── ui/                 # Design-system primitives (button, input, card...)
│   │   │   └── shared/             # Cross-role composed components (ScoreBadge, Kanban...)
│   │   ├── features/               # Feature-scoped logic, one folder per domain
│   │   │   ├── auth/
│   │   │   ├── applicant-profile/
│   │   │   ├── job-vacancy/
│   │   │   ├── application-pipeline/
│   │   │   ├── ats-score/
│   │   │   └── admin/
│   │   │       # each feature folder: api.ts (calls backend), hooks.ts (TanStack Query), types.ts
│   │   ├── lib/                    # api client, utils, constants
│   │   ├── styles/                 # Tailwind config, theme tokens (see frontend-design skill)
│   │   └── main.tsx
│   ├── tests/
│   │   ├── unit/                   # Vitest, mirrors src/ structure
│   │   └── e2e/                    # Playwright specs, one file per user flow
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── modules/                # One folder per domain module — this is the core structure
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.types.ts
│   │   │   │   └── auth.test.ts
│   │   │   ├── applicant-profile/
│   │   │   ├── job-vacancy/
│   │   │   ├── application-pipeline/
│   │   │   ├── ats-scoring/         # see §6 for internal structure
│   │   │   ├── notifications/
│   │   │   └── admin/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts   # JWT verification
│   │   │   ├── rbac.middleware.ts   # role/permission checks
│   │   │   ├── error.middleware.ts  # central error handler
│   │   │   └── rate-limit.middleware.ts
│   │   ├── db/
│   │   │   ├── migrations/          # see §4
│   │   │   ├── seeds/
│   │   │   └── client.ts            # Prisma/Knex instance
│   │   ├── jobs/                    # background_jobs handlers + node-cron poller
│   │   ├── config/                  # env loading, constants
│   │   └── app.ts                   # Express app assembly (mounts all module routers)
│   ├── tests/
│   │   ├── integration/             # Supertest, one file per module, hits a test DB
│   │   └── fixtures/
│   ├── server.ts                    # entrypoint
│   ├── ecosystem.config.js          # PM2 config
│   └── package.json
│
├── shared/
│   └── types/                       # Types shared between frontend and backend (API contracts)
│
├── docs/
│   ├── Recruitment_Platform_SRS.md
│   └── Epic_Backlog.md
│
├── .github/workflows/               # CI pipeline
├── nginx/                           # Nginx site config
└── README.md
```

**Rule:** every backend module (`auth`, `job-vacancy`, etc.) is self-contained — routes, controller, service, types, and tests live together. Never put business logic directly in a route file; routes call controllers, controllers call services. Services contain the logic and are what unit/integration tests target.

## 3. Naming conventions

- Files: `kebab-case.ts` for backend, `PascalCase.tsx` for React components, `camelCase.ts` for hooks/utils.
- Database tables: `snake_case`, plural (`applicant_skills`, `job_vacancies`).
- Database columns: `snake_case`.
- API routes: `kebab-case`, plural nouns, versioned under `/api/v1/...` (e.g. `/api/v1/job-vacancies/:id/applications`).
- Branch names: follow `Epic_Backlog.md` exactly — `feature/<epic-number>-<task-slug>` off an `epic/<number>-<slug>` integration branch, itself off `develop`.

## 4. Database migrations

- One migration file per schema change, timestamp-prefixed (`20260910143000_create_applicants_table.ts`), never edit a migration that's already been merged — write a new one.
- Every migration has an `up` and a `down`. No migration merges without a working `down`.
- Table/column design follows SRS §6 (Core Data Entities) — this is the source of truth for field names and relationships. Extend it only with a documented reason.
- Seed files (`db/seeds/`) populate reference/master data needed for dev and tests: skill taxonomy, industries, job categories, default `ScoreWeightConfig` — never seed fake user accounts into anything but a local/test environment.
- Run migrations as part of the deploy script (`ecosystem` deploy hook or a CI step), never manually on production.

## 5. Testing strategy

| Layer | Tool | What it covers | Where it lives |
|---|---|---|---|
| Backend unit | **Vitest** (or Jest) | Service-layer logic in isolation (e.g. each ATS sub-score function), mocked DB calls | `backend/src/modules/*/*.test.ts` |
| Backend integration | **Supertest** + a real test MySQL DB (migrated fresh per run) | Full request→response through a module's routes | `backend/tests/integration/` |
| Frontend unit | **Vitest** + React Testing Library | Component logic, hooks, form validation | `frontend/tests/unit/` |
| End-to-end | **Playwright** | Full user flows across roles: register → build profile → apply → get scored; recruiter posts job → reviews candidate → schedules interview | `frontend/tests/e2e/` |

- **Every new backend module ships with**: at least one unit test per service function and one integration test per route.
- **The ATS scoring module (§6) requires the heaviest test coverage** — it's the platform's core differentiator (SRS §4). Each sub-score function needs unit tests covering: exact match, partial match, no match, and edge cases (empty required-skills list, applicant with zero experience, missing education data).
- Integration tests run against a disposable test database, migrated and seeded before the suite, torn down after — never against the dev or prod database.
- CI (`.github/workflows/`) runs unit + integration tests on every PR; E2E runs on merges to `develop`/`main` (slower, so not on every push).
- Target coverage: 80%+ on `modules/ats-scoring` and `modules/auth`, 60%+ elsewhere as a practical floor — coverage isn't the goal, but these two modules are where correctness matters most.

## 6. ATS Scoring module — internal structure

This is the platform's highest-priority module (Epic 7). Structure it explicitly:

```
backend/src/modules/ats-scoring/
├── ats-scoring.routes.ts
├── ats-scoring.controller.ts
├── ats-scoring.service.ts          # orchestrates the pipeline below
├── sub-scores/
│   ├── skills-match.ts             # SQL-based, weight ~40%
│   ├── experience-match.ts         # SQL-based, weight ~25%
│   ├── education-match.ts          # SQL-based, weight ~15%
│   ├── semantic-match.ts           # TF-IDF cosine similarity via `natural`, weight ~15%
│   └── certification-match.ts      # SQL-based, weight ~5%
├── weight-config.ts                 # reads ScoreWeightConfig (global/per-job)
├── explainability.ts                # builds the breakdown_json + top_matching_terms
└── ats-scoring.test.ts
```

Each sub-score function is pure where possible — takes structured applicant/job data in, returns a 0–1 score plus a small explanation object out — so it can be unit-tested without hitting the database. `ats-scoring.service.ts` is the only place that fetches data and calls the DB, then calls each pure sub-score function and aggregates. Follow SRS §4.3–§4.6 exactly; do not introduce ML/embeddings/an external API — that's an explicit non-goal for this build (SRS §4.6).

## 7. API conventions

- Response envelope: `{ data: ..., error: null }` on success, `{ data: null, error: { code, message } }` on failure — consistent across every endpoint so the frontend has one response-parsing path.
- HTTP status codes used meaningfully: 200/201 success, 400 validation error, 401 unauthenticated, 403 unauthorized (RBAC), 404 not found, 409 conflict, 500 unexpected.
- Every route validates its input (e.g. with `zod`) before it reaches the controller — reject bad input early with a 400 and a clear message.
- Pagination on any list endpoint: `?page=&limit=`, response includes `{ total, page, limit }`.
- Role-gating happens in middleware (`rbac.middleware.ts`), never as an `if` check buried in a controller.

## 8. Error handling & logging

- One central error-handling middleware (`error.middleware.ts`) — controllers/services throw typed errors (`NotFoundError`, `ValidationError`, `ForbiddenError`), never send raw `res.status().json()` for errors ad hoc.
- Structured logging (e.g. `pino`) — every request logged with method, path, status, duration, and user id (if authenticated). No `console.log` left in committed code.
- Every admin action, ATS score override, and data-access event affecting applicant PII gets an `AuditLog` row — required by SRS §5.6/NFR-18, not optional.

## 9. Environment & config

- `.env.example` checked into the repo listing every required variable (DB creds, JWT secret, OAuth client IDs/secrets, mail settings) with placeholder values — never real secrets.
- Config loaded once at startup (`config/index.ts`), validated (fail fast if a required var is missing), and imported everywhere else — no scattered `process.env.X` calls through the codebase.
- Separate `.env` files per environment (`development`, `test`, `production`); the test suite always points at a dedicated test database, never dev/prod.

## 10. Deployment

- `backend/ecosystem.config.js` defines the PM2 process (cluster mode across CPU cores once traffic justifies it, single instance is fine at launch).
- Nginx config (`nginx/`) reverse-proxies to the PM2-managed Express app and serves the built frontend static files; terminates TLS.
- CI/CD: GitHub Actions runs lint → test → build on every PR; on merge to `main`, builds the frontend, deploys via SSH/rsync, runs pending DB migrations, then `pm2 reload` for a zero-downtime restart.
- No Docker at any stage of this build — see SRS §2.2/§2.3 for the reasoning; don't reintroduce it without a deliberate scale-driven decision.

## 11. Coding standards

- TypeScript `strict: true` on both frontend and backend — no `any` without a comment explaining why.
- ESLint + Prettier configured once at the repo root, enforced in CI (fail the build on lint errors, not just warnings).
- Prefer named exports over default exports for anything that will be imported in multiple places (easier refactors, clearer grep).
- Keep controllers thin (parse request → call service → shape response); business logic always lives in the service layer where it can be unit tested without an HTTP layer.
