# Epic 3 — Super Admin: Moderation & Compliance

- **Epic Number:** 3
- **Epic Title:** Super Admin: Moderation & Compliance
- **Integration Branch:** `epic/03-super-admin-moderation`
- **Status:** Completed
- **Reference SRS:** Sections 3.1, 5.1, 5.6, 6.1, 7.1

---

## 1. Overview & Goal

The goal of Epic 3 was to implement a complete Moderation & Compliance Center for Super Admins to keep the platform safe, fair, and legally compliant (FR-SA-09 to FR-SA-13). This includes:
- Flagged Job Posting review queue with Take Down / Restore workflows.
- Reported Profile & CV review queue with Warn / Suspend controls.
- Prohibited and discriminatory keyword taxonomy with an automated pre-publish scanner.
- Immutable platform audit log explorer with multi-criteria filtering and payload inspection.
- GDPR and Data Privacy subject request handler supporting Right to Access (Data Export) and Right to be Forgotten (Erasure/Anonymization) within the 30-day statutory SLA.

---

## 2. Tasks Delivered

| Task | Purpose | Branch | Files Created / Modified |
|---|---|---|---|
| **Flagged Job Posting Review Queue** | Review jobs flagged for spam, fraud, or discrimination; apply `TAKEDOWN`, `RESTORE`, or `DISMISS` actions with mandatory resolution notes. | `feature/03-job-moderation-queue` | `backend/src/modules/moderation/*`, `frontend/src/pages/admin/AdminModerationPage.tsx`, `frontend/src/features/moderation/*` |
| **Reported Profile & CV Review Queue** | Investigate reported fake or abusive applicant profiles/resumes with `SUSPEND_PROFILE`, `WARN_USER`, and `DISMISS` triggers. | `feature/03-profile-report-queue` | `backend/src/modules/moderation/moderation.service.ts`, `frontend/src/pages/admin/AdminModerationPage.tsx` |
| **Banned-Keyword & Anti-Discrimination Filter** | Configurable taxonomy dictionary across categories (`DISCRIMINATION`, `SPAM`, `OFFENSIVE`, `MISLEADING`) and text analysis validator. | `feature/03-keyword-filter` | `backend/src/modules/moderation/banned-keyword.validator.ts`, `backend/prisma/seed.ts`, `frontend/src/pages/admin/AdminModerationPage.tsx` |
| **Immutable Audit Log System** | Filterable platform audit explorer by action, actor, target type, and date range with JSON payload inspector. | `feature/03-audit-log-system` | `backend/src/modules/moderation/moderation.controller.ts`, `frontend/src/pages/admin/AdminModerationPage.tsx` |
| **GDPR Data Privacy Request Handler** | Handle subject access requests (`DATA_EXPORT`, `ERASURE`) with 30-day SLA countdown, archive generation, and user PII anonymization. | `feature/03-gdpr-request-handler` | `backend/src/modules/moderation/moderation.service.ts`, `frontend/src/pages/admin/AdminModerationPage.tsx` |

---

## 3. Architecture & Technical Decisions

### Database & Schema Additions
- **`ContentReport` Model:**
  - `id`, `reporterId` (User relation), `targetType` (`JOB_POSTING`, `APPLICANT_PROFILE`, `CV`), `targetId`, `reason`, `description`, `status` (`PENDING`, `RESOLVED`, `DISMISSED`), `resolutionAction`, `resolutionNotes`, `resolvedById`, `resolvedAt`.
- **`BannedKeyword` Model:**
  - `id`, `keyword` (unique), `category` (`DISCRIMINATION`, `SPAM`, `OFFENSIVE`, `MISLEADING`), `severity` (`BLOCK`, `WARN`), `isActive`.
- **`GdprRequest` Model:**
  - `id`, `userId` (User relation), `requestType` (`DATA_EXPORT`, `ERASURE`), `status` (`SUBMITTED`, `PROCESSING`, `COMPLETED`, `REJECTED`), `slaDeadline` (30 days from creation), `detailsJson`, `rejectionReason`, `completedAt`.

### API Endpoints
Mounted under `/api/v1/admin/moderation/*` with standard `{ data: T | null, error: ApiError | null }` envelopes:

- `GET /api/v1/admin/moderation/stats`: Moderation overview metrics.
- `POST /api/v1/admin/moderation/reports`: Authenticated report submission.
- `GET /api/v1/admin/moderation/reports`: Paginated flagged jobs and profile reports with enriched target details.
- `PATCH /api/v1/admin/moderation/reports/:id/resolve`: Executes resolution action (`TAKEDOWN`, `RESTORE`, `SUSPEND_PROFILE`, `DISMISS`) and records an audit log.
- `GET /api/v1/admin/moderation/keywords`: Lists active prohibited keywords.
- `POST /api/v1/admin/moderation/keywords`: Adds keyword to taxonomy.
- `DELETE /api/v1/admin/moderation/keywords/:id`: Deletes keyword.
- `POST /api/v1/admin/moderation/keywords/test`: Scans text against active keywords and returns violations.
- `GET /api/v1/admin/moderation/audit-logs`: Multi-filter platform audit trail query.
- `GET /api/v1/admin/moderation/gdpr/requests`: Lists pending GDPR requests with SLA deadlines.
- `POST /api/v1/admin/moderation/gdpr/requests`: Submits user data export or erasure request.
- `PATCH /api/v1/admin/moderation/gdpr/requests/:id/process`: Fulfills export (generates complete archive) or executes account anonymization.

### Frontend Moderation Center Experience
- **Super Admin Navigation:** Added `Moderation` link in Header navbar.
- **Tabbed Interface:**
  1. `Flagged Jobs`: Table with search, status filters, target details, Take Down, and Dismiss actions.
  2. `Reported Profiles`: Reviews reported candidate accounts with Suspend User action.
  3. `Banned Keywords`: Active keywords manager with category chips and live anti-bias text validator.
  4. `Platform Audit Logs`: Filterable audit event explorer with JSON payload inspector modal.
  5. `GDPR Privacy Requests`: SLA deadline tracking with Fulfill / Complete actions.

---

## 4. Verification & Test Results

```text
✓ Monorepo Typecheck: PASSED (0 errors across @recruitment-platform/shared, backend, frontend)
✓ Backend Tests (vitest): 31/31 PASSED
  - moderation.test.ts (7 tests: metrics, create/list reports, takedown flagged job, suspend reported profile, banned keywords scanner, audit logs query, GDPR data export & erasure)
  - admin.test.ts (7 tests)
  - ats-scoring.test.ts (6 tests)
  - auth.test.ts (9 tests)
  - health.test.ts (2 tests)
✓ Frontend Tests (vitest): 21/21 PASSED
  - ModerationFlow.test.tsx (4 tests: Moderation Center KPIs, Banned Keywords tab, Audit Logs tab, GDPR tab)
  - AdminFlow.test.tsx (5 tests)
  - AuthFlow.test.tsx (8 tests)
  - ScoreBadge.test.tsx (4 tests)
✓ Monorepo Build (npm run build): PASSED (shared, backend, and Vite frontend production bundles)
```

---

## 5. Next Steps

- Proceed to **Epic 4: Super Admin: System Configuration** (`epic/04-super-admin-config`):
  - Global ATS weight configuration (skills/experience/education/semantic/certifications default weights).
  - Master data management (skills taxonomy, industries, locations).
  - Notification template editor.
  - Feature flag management per plan tier.
