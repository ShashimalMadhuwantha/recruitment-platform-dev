# Epic 14 — Analytics & Reporting (Company Level)

**Target Branch:** `epic/14-company-analytics-reporting`  
**Status:** Complete  
**Covers Requirements:** FR-RC-21, FR-RC-22, FR-RC-23  
**Design Skill Activated:** `recruitment-platform-frontend-design`  
**Dev Skill Activated:** `recruitment-platform-dev`

---

## 1. Overview & Business Objectives

Epic 14 equips recruiters and talent acquisition leaders with real-time operational visibility into their recruiting funnels, pipeline velocity, candidate sourcing performance, and workforce diversity metrics.

1. **Company Hiring Dashboard & Funnel Analytics (FR-RC-21)**:
   - **Executive KPI Cards**: Total Applications, Active Jobs, Average ATS Match Score, Average Time-to-Hire (days from application to hired stage), Offer Acceptance Rate, and Pipeline Velocity.
   - **Recruitment Funnel Conversion**: Stage-by-stage progression (`APPLIED → SCREENING → SHORTLISTED → INTERVIEW → OFFER → HIRED`) with conversion percentages and stage drop-off analysis.
   - **Candidate Source Attribution**: Tracking where top candidates originate (`DIRECT`, `LINKEDIN`, `REFERRAL`, `JOB_BOARD`, `INTERNAL`).
   - **Application Velocity Over Time**: Time-series aggregation (daily, weekly, monthly) showing applicant volume trends.
   - **ATS Score Distribution**: Breakdown of candidates across semantic score bands (`Strong Match ≥ 80%`, `Partial Match 50-79%`, `Weak Match < 50%`).

2. **Exportable Candidate Lists & Pipeline Reports (FR-RC-22)**:
   - On-demand CSV and JSON export engine for candidate pipelines, job requisition summaries, and time-to-hire audit logs.
   - Granular filtering by Job Vacancy, Pipeline Stage, ATS Score Band, and Date Range.
   - Compliance-friendly export formats with formula-injection escaping (`=`, `+`, `-`, `@`) for spreadsheet security.

3. **Diversity & Inclusion Analytics (FR-RC-23)**:
   - Optional, confidential, voluntary candidate survey responses (Gender identity, Race/Ethnicity, Veteran status, Disability status).
   - **Strict Privacy Architecture (k-Anonymity ≥ 5)**: Responses are decoupled from candidate evaluation cards (recruiters can never see an individual's demographic answers). Aggregated D&I metrics are only displayed when the sample size meets or exceeds 5 respondents to prevent de-anonymization.

---

## 2. Tasks Delivered

| Task ID | Component / Requirement | Description | Key Files Created / Modified |
|---|---|---|---|
| **TASK-14-1** | Database Schema & Migrations | Added `source` column to `Application`, created `DiversitySurveyResponse` model with indexes and relations | `backend/prisma/schema.prisma` |
| **TASK-14-2** | Shared Contracts & DTOs | Defined analytics summary, funnel, sourcing, velocity, score bands, export, and D&I interfaces | `shared/src/types/index.ts` |
| **TASK-14-3** | Backend Analytics Module | Implemented `AnalyticsService`, controller, Zod validation schemas, and CSV export engine | `backend/src/modules/analytics/*` |
| **TASK-14-4** | Route Mounting & RBAC | Mounted `/api/v1/analytics` routes with `authenticateToken` and `requireRecruiter` | `backend/src/app.ts`, `analytics.routes.ts` |
| **TASK-14-5** | Frontend Analytics API & Hooks | Built TanStack Query hooks and API functions for analytics endpoints | `frontend/src/features/analytics/api.ts`, `hooks.ts` |
| **TASK-14-6** | Frontend Recruiter Analytics UI | Built `KpiMetricCard`, `FunnelChart`, `VelocityChart`, `SourceAttributionCard`, `ScoreDistributionCard`, `ExportReportModal`, `DiversityAnalyticsTab`, `CandidateReportsTab`, and `CompanyAnalyticsPage` | `frontend/src/features/analytics/components/*`, `frontend/src/pages/recruiter/CompanyAnalyticsPage.tsx` |
| **TASK-14-7** | Routing & Navigation | Registered `/recruiter/analytics` route and added Analytics link in Recruiter Header | `frontend/src/app/router.tsx`, `Header.tsx` |
| **TASK-14-8** | Automated Verification | Comprehensive unit tests for backend formulas, k-anonymity, CSV sanitization, and frontend UI flow | `backend/src/modules/analytics/analytics.test.ts`, `frontend/tests/unit/AnalyticsFlow.test.tsx` |

---

## 3. Architecture & Data Models

### Database Schema Additions (`backend/prisma/schema.prisma`)

```prisma
// 1. Application model extension: Add candidate acquisition source
model Application {
  // ... existing fields
  source String? @default("DIRECT") // DIRECT, LINKEDIN, REFERRAL, JOB_BOARD, INTERNAL
  diversitySurvey DiversitySurveyResponse?
  // ... relations
}

// 2. Anonymized Diversity Survey Response (FR-RC-23)
model DiversitySurveyResponse {
  id               String   @id @default(uuid())
  applicationId    String?  @unique @map("application_id")
  companyId        String   @map("company_id")
  jobId            String?  @map("job_id")
  gender           String?  // Female, Male, Non-Binary, Prefer not to say
  raceEthnicity    String?  @map("race_ethnicity") // Asian, Black/African American, Hispanic/Latino, White, Two or more races, Other, Prefer not to say
  veteranStatus    String?  @map("veteran_status") // Veteran, Non-Veteran, Prefer not to say
  disabilityStatus String?  @map("disability_status") // Yes, No, Prefer not to say
  optedIn          Boolean  @default(true) @map("opted_in")
  submittedAt      DateTime @default(now()) @map("submitted_at")

  application Application? @relation(fields: [applicationId], references: [id], onDelete: SetNull)
  company     Company      @relation(fields: [companyId], references: [id], onDelete: Cascade)
  job         JobVacancy?  @relation(fields: [jobId], references: [id], onDelete: SetNull)

  @@index([companyId, jobId])
  @@map("diversity_survey_responses")
}
```

---

## 4. Metric Definitions & Verification Results

1. **Average Time-to-Hire**:
   $$\text{Time to Hire} = \frac{\sum (\text{Hired Date} - \text{Application Date})}{N_{\text{hired candidates}}}$$
   Verified with unit test: correctly measures duration in calendar days and handles 0 hires without `NaN`.

2. **Stage Conversion Rate & Drop-Off**:
   $$\text{Conversion Rate}_{S_i \to S_{i+1}} = \frac{\text{Count of candidates reaching } S_{i+1}}{\text{Count of candidates reaching } S_i} \times 100\%$$
   $$\text{Drop-off Rate} = \frac{N_{S_i} - N_{S_{i+1}}}{N_{S_i}} \times 100\%$$

3. **Offer Acceptance Rate**:
   $$\text{Offer Acceptance Rate} = \frac{N_{\text{accepted offers}}}{N_{\text{total offers extended}}} \times 100\%$$

4. **k-Anonymity Privacy Guarantee for D&I**:
   $$\text{Show D\&I Breakdown} = \begin{cases} \text{True} & \text{if } N_{\text{respondents}} \ge 5 \\ \text{False (Protected)} & \text{if } N_{\text{respondents}} < 5 \end{cases}$$
   Verified: $N < 5$ returns `isProtected: true` with empty demographic arrays; $N \ge 5$ returns verified category distributions.

5. **Test Suite Execution**:
   - Backend unit tests: **16 test files, 139 tests passed (100%)**.
   - Frontend unit tests: **14 test files, 84 tests passed (100%)**.
   - Monorepo typecheck (`npm run typecheck`): **0 errors**.
   - Monorepo production build (`npm run build`): **Complete success**.

