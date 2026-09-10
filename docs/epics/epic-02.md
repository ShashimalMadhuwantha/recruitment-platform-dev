# Epic 2 — Super Admin: Platform & User Management

- **Epic Number:** 2
- **Epic Title:** Super Admin: Platform & User Management
- **Integration Branch:** `epic/02-super-admin-user-mgmt`
- **Status:** Completed
- **Reference SRS:** Sections 3.1, 4.1, 4.2, 5.1, 5.4, 6.1, 7.1

---

## 1. Overview & Goal

The goal of Epic 2 was to implement a comprehensive Super Admin governance suite for platform operations, tenant approval workflows, resource quota allocations, user access lifecycle management, and full audit logging with secure support impersonation capabilities.

---

## 2. Tasks Delivered

| Task | Purpose | Branch | Files Created / Modified |
|---|---|---|---|
| **Company & Tenant Approval Workflow** | Multi-status company lifecycle (`PENDING_APPROVAL`, `ACTIVE`, `SUSPENDED`, `REJECTED`), approval/rejection audit notes, recruiter user auto-activation on approval, and email notification trigger. | `feature/02-company-approval-workflow` | `backend/src/modules/admin/*`, `frontend/src/pages/admin/AdminCompaniesPage.tsx`, `frontend/src/features/admin/*` |
| **Subscription Plan Assignment** | Plan tier modeling (`FREE`, `PRO`, `ENTERPRISE`), configurable limits (max job postings, team seats, monthly ATS scan quota), and tenant assignment modal. | `feature/02-plan-assignment` | `backend/prisma/schema.prisma`, `backend/prisma/seed.ts`, `frontend/src/pages/admin/AdminPlansPage.tsx`, `frontend/src/pages/admin/AdminCompaniesPage.tsx` |
| **User Impersonation with Audit Log** | Secure temporary token generation (`isImpersonating: true`), audit trail logging (`AUDIT_LOG_ENTRY`), persistent UI warning banner, and one-click session restore. | `feature/02-impersonation-audit` | `backend/src/modules/admin/admin.service.ts`, `frontend/src/components/shared/ImpersonationBanner.tsx`, `frontend/src/features/admin/hooks.ts` |
| **Global User Management** | User search and role/status filtering, account status transitions (`ACTIVE`, `SUSPENDED`, `BANNED`), mandatory audit justification notes, and user profile drawer. | `feature/02-user-directory-management` | `backend/src/modules/admin/admin.controller.ts`, `frontend/src/pages/admin/AdminUsersPage.tsx` |
| **Platform Governance Dashboard** | Live KPI metric cards (Total Users, Active Companies, Pending Approvals, Job Postings, Applications) and quick navigation shortcuts. | `feature/02-admin-overview` | `frontend/src/pages/admin/AdminOverviewPage.tsx`, `frontend/src/components/shared/Header.tsx`, `frontend/src/app/router.tsx` |

---

## 3. Architecture & Technical Decisions

### Database & Schema Enhancements
- **SubscriptionPlan Table:** Stores `id`, `name`, `tier` (`FREE`, `PRO`, `ENTERPRISE`), `maxJobPosts`, `maxSeats`, `maxAtsScans`, and `priceMonthly`.
- **Company Table Relation:** Added `planId` foreign key referencing `SubscriptionPlan`.
- **Prisma Seeding:** Seeded default tiers:
  - Free Starter (3 jobs, 2 seats, 50 ATS scans)
  - Pro Recruiter (25 jobs, 10 seats, 500 ATS scans, $99/mo)
  - Enterprise ATS (Unlimited jobs, seats, scans, $499/mo)
- **Atomic Recruiter Activation:** When a Super Admin approves a company (`ACTIVE`), all associated recruiter users with `PENDING_APPROVAL` status are automatically transitioned to `ACTIVE` within a single Prisma transaction.

### API Endpoints
All admin endpoints are guarded by `authenticateToken` + `requireSuperAdmin` and follow the standard `{ data: T | null, error: ApiError | null }` envelope format:

- `GET /api/v1/admin/stats`: Returns platform-wide KPIs (total users, applicants, recruiters, active/pending companies, jobs, applications).
- `GET /api/v1/admin/companies`: Paginated list with search, status filters, and recruiter/job counts.
- `GET /api/v1/admin/companies/:id`: Detailed company profile with recruiter team and job vacancies.
- `PATCH /api/v1/admin/companies/:id/status`: Updates company status (`PENDING_APPROVAL`, `ACTIVE`, `SUSPENDED`, `REJECTED`) with audit logging and recruiter auto-activation.
- `GET /api/v1/admin/plans`: Lists all available subscription plans.
- `PUT /api/v1/admin/companies/:id/plan`: Assigns a subscription plan to a company tenant.
- `GET /api/v1/admin/users`: Paginated platform user directory with role and status filtering.
- `PATCH /api/v1/admin/users/:id/status`: Transitions user status (`ACTIVE`, `SUSPENDED`, `BANNED`) with mandatory justification.
- `POST /api/v1/admin/impersonate`: Generates scoped impersonation token and records an audit log entry.
- `GET /api/v1/admin/audit-logs`: Retrieves filterable platform audit trail.

### Frontend Super Admin Experience
- **Super Admin Navigation:** Header dynamically shows Super Admin links (`Overview`, `Companies`, `Users`, `Plans`) for `SUPER_ADMIN` users.
- **Company Management Page:** Filter tabs (`All`, `Pending Approval`, `Active`, `Suspended`, `Rejected`), live search, company detail drawer, status modal, and plan assignment modal.
- **Global User Directory:** Role filter (`APPLICANT`, `RECRUITER`, `SUPER_ADMIN`), status filter (`ACTIVE`, `PENDING_APPROVAL`, `SUSPENDED`, `BANNED`), user detail drawer, and status transition modal.
- **Impersonation Mode Banner:** High-visibility sticky banner (`ImpersonationBanner`) displayed when `user.isImpersonating === true`, backing up the original Super Admin session in `sessionStorage` and restoring it with a single click.

---

## 4. Verification & Test Results

```text
✓ Monorepo Typecheck: PASSED (0 errors across @recruitment-platform/shared, backend, frontend)
✓ Backend Tests (vitest): 24/24 PASSED
  - admin.test.ts (7 tests: stats, companies list/details, company status update + recruiter activation, plan assignment, user status update, user impersonation + audit log)
  - ats-scoring.test.ts (6 tests)
  - auth.test.ts (9 tests)
  - health.test.ts (2 tests)
✓ Frontend Tests (vitest): 17/17 PASSED
  - ScoreBadge.test.tsx (4 tests)
  - AuthFlow.test.tsx (8 tests)
  - AdminFlow.test.tsx (5 tests: AdminOverview KPIs & alerts, AdminCompaniesPage filters & actions, AdminUsersPage directory & actions, AdminPlansPage quotas, ImpersonationBanner session restore)
✓ Production Build (npm run build): PASSED (shared, backend, and frontend Vite production bundle)
```

---

## 5. Next Steps

- Proceed to **Epic 3: Job Vacancy Lifecycle & Custom Pipelines** (`epic/03-job-vacancy-lifecycle`):
  - Recruiter job creation wizard with skill tagging, employment types, salary ranges, and custom ATS weights.
  - Multi-stage pipeline builder (Screening, Shortlisted, Interview, Offer, Hired, Rejected) with stage-specific requirements.
  - Job publishing, pausing, and closing workflows with quota enforcement based on company subscription tier.
