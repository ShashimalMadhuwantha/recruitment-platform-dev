# Epic 5: Recruiter: Job Vacancy Management

## Overview
Epic 5 implements the complete job vacancy creation, lifecycle management, ATS scoring configuration, and fair-hiring compliance scanning features for recruiters, in accordance with `docs/Recruitment_Platform_SRS.md` (§3.2, §4.3, §5.1, §6) and `docs/Epic_Backlog.md`. Recruiters can construct comprehensive job postings via a 4-step wizard, map structured requirements and taxonomy-backed competency weights, override vacancy-level ATS sub-score weights, configure knockout screening questions, run real-time anti-discrimination compliance scans before publishing, enforce company subscription plan posting quotas, duplicate existing postings, and generate public candidate application links.

---

## 1. Features Implemented

### 1.1 Multi-Step Job Creation & Publishing Wizard
- **Step 1: Role Overview & Basic Details**:
  - Title, department, location/remote hub, employment type (`FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERNSHIP`, `REMOTE`), salary range (min/max), application deadline, and long-form role description.
  - Step navigation validation ensuring minimum character constraints before progression.
- **Step 2: Requirements & Taxonomy Skills Selection**:
  - Minimum/maximum years of experience, minimum education level (`High School`, `Associate`, `Bachelor`, `Master`, `Doctorate`), and required certifications list.
  - Required skills picker dynamically linked to the master `Skill` taxonomy.
  - Skill priority classification (`MUST_HAVE` vs `NICE_TO_HAVE`), relative weight slider (0.1–2.0), and required minimum proficiency (1–5).
- **Step 3: Vacancy-Level ATS Weight Overrides & Screening Rules**:
  - Role-specific weight overrides across all 5 ATS dimensions (`skillsWeight`, `experienceWeight`, `educationWeight`, `semanticWeight`, `certificationWeight`) with strict 100% sum validation.
  - ATS Preset selector (Balanced Default, Technical & Engineering, Executive & Leadership, Entry-Level).
  - Custom screening questions with question type (`YES_NO`, `TEXT`), "Knockout" qualification flags, and required qualifying answers.
- **Step 4: Review, Pre-Publish Compliance Verification & Publishing**:
  - Automated anti-discrimination compliance scan executed before publishing.
  - Full configuration review summary cards.
  - Save as `DRAFT` or `PUBLISH` actions.

### 1.2 Company Subscription Plan Quota Enforcement
- Enforces posting limits based on the company's active `SubscriptionPlan` tier (`maxJobPosts`).
- In case of quota saturation, rejects publishing with a descriptive `400 Bad Request` error prompting plan upgrades.

### 1.3 Pre-Publish Anti-Discrimination Compliance Engine
- Automatically evaluates the vacancy title and description against the `BannedKeyword` registry.
- Detects discriminatory terms across protected classes (age, gender, ethnicity, disability, religion).
- Blocks publishing if any keyword violation has severity `BLOCK`. Displays contextual explanations and required corrective actions.
- Warns recruiter if violations have severity `WARN`.

### 1.4 Job Vacancy Dashboard & Lifecycle Management
- Overview table of company vacancies with quick status filtering tabs (`ALL`, `PUBLISHED`, `DRAFT`, `PAUSED`, `CLOSED`).
- Live applicant pipeline metrics per vacancy: Total applications count, screening, interview, offer, and hired counts.
- Real-time status toggles:
  - `DRAFT` &rarr; `PUBLISHED` (triggers quota check and compliance check)
  - `PUBLISHED` &rarr; `PAUSED`
  - `PAUSED` &rarr; `PUBLISHED`
  - Any status &rarr; `CLOSED`
- **Duplicate/Clone Action**: Duplicates an existing job with all its requirements, skills, screening questions, and ATS weight overrides as a new `DRAFT` prefixed with "Copy of...".
- **Public Share Link Modal**: Generates direct public URL (`/jobs/:id`) with one-click clipboard copying for external candidate sourcing.

---

## 2. API Endpoints Reference

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/api/v1/job-vacancies` | List company vacancies with applicant stats and status filters | Recruiter, Super Admin |
| `GET` | `/api/v1/job-vacancies/:id` | Get full vacancy details including requirements, skills, and screening questions | Recruiter, Super Admin |
| `POST` | `/api/v1/job-vacancies` | Create a job vacancy (draft or published with quota validation) | Recruiter, Super Admin |
| `PUT` | `/api/v1/job-vacancies/:id` | Update job vacancy details, requirements, skills, and ATS overrides | Recruiter, Super Admin |
| `PATCH` | `/api/v1/job-vacancies/:id/status` | Transition vacancy status (`DRAFT`, `PUBLISHED`, `PAUSED`, `CLOSED`) | Recruiter, Super Admin |
| `POST` | `/api/v1/job-vacancies/:id/clone` | Duplicate job vacancy as a new `DRAFT` | Recruiter, Super Admin |
| `DELETE` | `/api/v1/job-vacancies/:id` | Delete job vacancy (restricted to vacancies without active applicants) | Recruiter, Super Admin |
| `POST` | `/api/v1/job-vacancies/compliance-check` | Scan vacancy title and description against banned keyword dictionary | Recruiter, Super Admin |

---

## 3. Database Schema Changes

Added `screeningQuestionsJson` column to `JobVacancy` to store screening criteria without altering relational normalization:

```prisma
model JobVacancy {
  id                      String              @id @default(uuid())
  companyId               String              @map("company_id")
  creatorId               String              @map("creator_id")
  title                   String
  description             String              @db.Text
  requirementsSummary     String?             @map("requirements_summary") @db.Text
  location                String?
  employmentType          EmploymentType      @default(FULL_TIME) @map("employment_type")
  salaryMin               Decimal?            @map("salary_min") @db.Decimal(12, 2)
  salaryMax               Decimal?            @map("salary_max") @db.Decimal(12, 2)
  deadline                DateTime?
  status                  JobStatus           @default(DRAFT)
  screeningQuestionsJson  Json?               @map("screening_questions_json")
  createdAt               DateTime            @default(now()) @map("created_at")
  updatedAt               DateTime            @updatedAt @map("updated_at")

  company                 Company             @relation(fields: [companyId], references: [id])
  creator                 User                @relation(fields: [creatorId], references: [id])
  jobRequirement          JobRequirement?
  jobRequiredSkills       JobRequiredSkill[]
  scoreWeightConfigs      ScoreWeightConfig[]
  applications            Application[]

  @@map("job_vacancies")
}
```

---

## 4. Frontend Components & Pages

| Component / Page | Path | Description |
|---|---|---|
| `RecruiterJobsPage` | `frontend/src/pages/recruiter/RecruiterJobsPage.tsx` | Vacancy dashboard with status tabs, candidate count metrics, search, status actions, clone, and share link modal |
| `JobCreationWizardPage` | `frontend/src/pages/recruiter/JobCreationWizardPage.tsx` | 4-step wizard for role creation, taxonomy skill assignment, ATS weights, screening questions, and compliance scan |
| `Header` | `frontend/src/components/shared/Header.tsx` | Added recruiter navigation links ("Job Vacancies", "+ Post Job", "Pipeline") |
| `jobVacancyApi` | `frontend/src/features/job-vacancy/api.ts` | Axios client feature methods for vacancy CRUD, status update, clone, and compliance check |
| `useCompanyJobs` & hooks | `frontend/src/features/job-vacancy/hooks.ts` | TanStack Query query and mutation hooks |

---

## 5. Verification & Test Suite

### Automated Backend Tests
- **Path**: `backend/src/modules/job-vacancy/job-vacancy.test.ts` (9 tests)
- **Coverage**:
  1. Detects discriminatory keywords with BLOCK and WARN severities.
  2. Creates draft vacancy with requirements, taxonomy skills, and screening questions.
  3. Enforces company subscription plan job posting quotas on publish.
  4. Returns full vacancy details with applicant statistics.
  5. Updates vacancy fields, requirements, and skill weights.
  6. Enforces that vacancy-level ATS weights sum to 100%.
  7. Transitions vacancy status through lifecycle (`PUBLISHED` &rarr; `PAUSED` &rarr; `CLOSED`).
  8. Clones vacancy with all requirements into a new `DRAFT`.
  9. Enforces company data isolation between recruiters.
- **Backend Total**: **57 / 57 passed** across all backend modules.

### Automated Frontend Tests
- **Path**: `frontend/tests/unit/JobVacancyFlow.test.tsx` (10 tests)
- **Coverage**:
  1. Renders job vacancies listing with candidate counts, departments, and badges.
  2. Filters vacancies by status tabs.
  3. Opens share link modal with public URL.
  4. Triggers status transitions (Pause, Activate, Close).
  5. Triggers duplicate/clone action.
  6. Renders Step 1 with validation rules.
  7. Navigates through all 4 wizard steps.
  8. Detects discriminatory keywords during compliance scan and blocks publishing.
  9. Submits vacancy as draft.
  10. Publishes vacancy.
- **Frontend Total**: **36 / 36 passed** across all frontend modules.

### Typecheck & Build
- `npm run typecheck`: Passed across `@recruitment-platform/shared`, `@recruitment-platform/backend`, and `@recruitment-platform/frontend`.
- `npm run build`: Production bundling completed successfully.
