# Epic 8: Job Search & Applicant Application Flow

## Overview
Epic 8 implements the complete candidate discovery and application lifecycle in accordance with `docs/Recruitment_Platform_SRS.md` (§3.3, §4.2, §4.5, §5.1) and `docs/Epic_Backlog.md`. Applicants can discover and search published vacancies with rich multi-dimensional filters, preview their predicted deterministic ATS match score before applying (via Epic 7's `PreApplyMatchPreviewDrawer`), complete a multi-step application submission workflow (with CV selection, cover letter, and knockout screening questions), trigger real-time ATS scoring, track application progression across stages, and withdraw applications prior to final hiring decisions.

---

## 1. Features Implemented

### 1.1 Public & Authenticated Job Search & Discovery (`FR-AP-16`, `FR-AP-17`)
- **Multi-Field Full-Text Search**:
  - Keyword search across vacancy title, role description, requirements summary, and company name.
  - Location filtering with case-insensitive boundary matching.
- **Parametric Filters**:
  - Employment Type (`FULL_TIME`, `PART_TIME`, `CONTRACT`, `REMOTE`, `INTERNSHIP`).
  - Remote-only quick toggle filtering positions marked remote or containing remote hubs.
  - Minimum and maximum salary range boundaries.
- **Vacancy Overview Cards**:
  - Company logo avatar, verified company name, and industry tag.
  - Clear metadata chips: location, employment type, salary range.
  - Required skills chips highlighting `MUST_HAVE` competencies.
  - Real-time bookmark / save toggle button with optimistic UI updates.
  - Dynamic "Applied" badge for candidates who have already submitted an application.
- **Saved Jobs / Bookmarking**:
  - `SavedJob` database model mapped to `applicantId` and `jobId` with unique constraint.
  - Dedicated "Saved Jobs" tab in the Applicant Dashboard with direct "Apply Now" actions.

### 1.2 Vacancy Details & Pre-Apply Match Preview (`FR-AP-18`)
- **Complete Role Breakdown**:
  - Full role overview, responsibilities, and key requirements.
  - Technical taxonomy breakdown rendering required skills, minimum proficiency ratings (1–5), and priority tags (`MUST_HAVE` vs `NICE_TO_HAVE`).
  - Position highlights card (experience years required, degree level, salary, deadline).
- **Integrated ATS Match Preview**:
  - "Check Match Score" CTA directly connecting candidates to the `PreApplyMatchPreviewDrawer`.
  - Calculates on-demand deterministic ATS match score, sub-scores (Skills, Experience, Education, Semantic TF-IDF, Certifications), missing critical skills, and recommendations *before* application submission.

### 1.3 Multi-Step Apply Flow & Knockout Screening (`FR-AP-19`, `FR-AP-20`)
- **`ApplyJobModal` Wizard**:
  - **Step 1: Resume Selection**: Selects primary CV from candidate's profile with one-click selection of alternative tailored CVs.
  - **Step 2: Pre-Screening Questionnaire**: Dynamically renders job-specific screening questions (`YES_NO`, `TEXT`), visually highlighting prerequisite `isKnockout` questions.
  - **Step 3: Cover Letter & Review**: Optional cover letter textarea, application summary check, and submission CTA.
- **Deterministic Knockout Evaluation Engine**:
  - Automatically evaluates candidate answers against required qualifying answers (`requiredAnswer`).
  - Non-qualifying candidate answers automatically transition the application status to `REJECTED` upon creation, recording a transparent reason in the candidate audit pipeline.
  - Qualifying answers transition the application status to `APPLIED`.
- **Duplicate Prevention Safeguard**:
  - Strict database-enforced unique constraint `@@unique([applicantId, jobId])`.
  - Descriptive 400 Bad Request error preventing duplicate submissions.
- **Automated ATS Scoring Trigger (`FR-ATS-01`)**:
  - Submitting an application immediately triggers `AtsScoringService.scoreApplication(application.id)`.
  - Persists the multi-dimensional `ATSScore` record in the database and renders the instant score badge to the candidate on the success screen.

### 1.4 Applicant Application Tracking & Withdrawal (`FR-AP-20`, `FR-AP-21`)
- **Application History Dashboard**:
  - Lists all submitted applications ordered by application date.
  - Real-time stage status pills (`Applied`, `Screening`, `Shortlisted`, `Interview`, `Offer`, `Hired`, `Rejected`, `Withdrawn`).
  - Live calculated ATS match score badge for each submitted vacancy.
  - Click-through inspect action opening the ATS explainability breakdown.
- **Application Withdrawal**:
  - Self-service withdrawal modal allowing candidates to withdraw active applications with an optional reason note.
  - Blocks withdrawal on terminal states (`HIRED`, `REJECTED`, `WITHDRAWN`).
  - Updates status to `WITHDRAWN` and timestamps `withdrawnAt`.

---

## 2. API Endpoints Reference

### 2.1 Job Search & Discovery (`/api/v1/jobs`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/jobs` | Search & filter published job vacancies with pagination | Public / Optional Auth |
| `GET` | `/api/v1/jobs/:id` | Get full details of a published vacancy | Public / Optional Auth |
| `GET` | `/api/v1/jobs/saved` | List authenticated applicant's bookmarked jobs | Applicant, Super Admin |
| `POST` | `/api/v1/jobs/:id/save` | Bookmark / save a vacancy | Applicant, Super Admin |
| `DELETE` | `/api/v1/jobs/:id/save` | Remove vacancy from bookmarks | Applicant, Super Admin |

### 2.2 Application Lifecycle (`/api/v1/applications`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/applications` | Submit application with CV, cover letter & answers | Applicant, Super Admin |
| `GET` | `/api/v1/applications/my-applications` | List authenticated applicant's submitted applications | Applicant, Super Admin |
| `GET` | `/api/v1/applications/:id` | Get full application details with timeline & score | Owner Applicant, Recruiter, Super Admin |
| `POST` | `/api/v1/applications/:id/withdraw` | Withdraw an active application | Owner Applicant, Super Admin |

---

## 3. Database Schema Changes

### 3.1 `SavedJob` Model
```prisma
model SavedJob {
  id          String   @id @default(uuid())
  applicantId String   @map("applicant_id")
  jobId       String   @map("job_id")
  createdAt   DateTime @default(now()) @map("created_at")

  applicant   ApplicantProfile @relation(fields: [applicantId], references: [id], onDelete: Cascade)
  job         JobVacancy       @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@unique([applicantId, jobId])
  @@map("saved_jobs")
}
```

### 3.2 `Application` Model Update
```prisma
model Application {
  // ...
  screeningAnswersJson   Json?             @map("screening_answers_json")
  // ...
}
```

---

## 4. Verification & Automated Test Coverage

### 4.1 Backend Tests (`backend/src/modules/application-pipeline/application.test.ts`)
- **10 Integration & Unit Tests**:
  1. Searches published jobs with keyword filter.
  2. Filters jobs by employment type and remote-only.
  3. Returns full published job details with taxonomy requirements.
  4. Toggles job bookmark (save & unsave) and retrieves saved jobs list.
  5. Submits application successfully with attached CV and computes deterministic ATS score.
  6. Enforces duplicate application prevention (rejects with 400).
  7. Routes application to `REJECTED` if knockout question criteria are not met.
  8. Retrieves applicant applications with live status and ATS score badges.
  9. Withdraws an active application successfully and records timestamp.
  10. Rejects withdrawal on terminal application states.
- **Backend Test Suite Result**: **83 / 83 tests passing** across 9 test files.

### 4.2 Frontend Tests (`frontend/tests/unit/JobSearchAndApplyFlow.test.tsx`)
- **7 Unit Tests**:
  1. Renders `JobSearchPage` with search inputs, filters, and published job cards.
  2. Triggers toggle bookmark action on job cards.
  3. Renders `JobDetailPage` with full role breakdown, required skills, and action CTAs.
  4. Navigates `ApplyJobModal` through CV picker and screening questions to submit application.
  5. Renders `ApplicantDashboardPage` with live submitted applications and status pills.
  6. Opens withdrawal modal and submits application withdrawal request.
  7. Switches to Saved Jobs tab and displays bookmarked vacancies.
- **Frontend Test Suite Result**: **57 / 57 tests passing** across 9 test files.
