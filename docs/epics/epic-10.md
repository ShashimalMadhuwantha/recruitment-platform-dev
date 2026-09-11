# Epic 10: Job Search & Application Flow

## Overview
Epic 10 implements the complete **Job Search & Application Flow** lifecycle according to `docs/Recruitment_Platform_SRS.md` (§3.3.3, `FR-AP-16` to `FR-AP-21`) and `docs/Epic_Backlog.md`.
It allows applicants to discover job vacancies, save/bookmark jobs, preview their ATS match score before applying, submit structured applications with screening questions, and track all submitted applications through an application status dashboard.

---

## 1. Features Implemented

### 1.1 Multi-Parameter Job Search & Filtering (`FR-AP-16`)
- **Search Capabilities**:
  - Live full-text keyword search querying job titles, company names, requirements summaries, and job descriptions.
  - Multi-dimensional facet filters:
    - **Workplace Type**: `REMOTE`, `HYBRID`, `ONSITE`.
    - **Employment Type**: `FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERNSHIP`.
    - **Experience Level**: Minimum years of experience requirement.
    - **Salary Range Slider**: Filter by minimum expected monthly/annual salary.
    - **Required Skills**: Tag filter chips mapped to the central skills taxonomy.
  - Dynamic sorting: Newest First, Highest Salary, Application Deadline, Relevance.

### 1.2 Saved Jobs & Bookmarking (`FR-AP-17`)
- **Bookmarking Flow**:
  - Single-click bookmark toggle on job cards and job detail header.
  - State persisted to `saved_jobs` table linking `applicantId` and `jobId`.
  - Dedicated "Saved Jobs" view allowing applicants to manage bookmarked postings and quickly trigger the apply flow.

### 1.3 Pre-Apply ATS Match Score & Feasibility Check (`FR-AP-18`)
- **Real-Time Match Preview**:
  - On-demand calculation of ATS match score prior to application submission.
  - Displays overall match score pill (`High Match ≥ 75%`, `Good Match 60–74%`, `Partial < 60%`).
  - Matched vs missing must-have and nice-to-have skill pills, highlighting exact alignment and missing skill gaps.

### 1.4 Structured Application Submission (`FR-AP-19`)
- **Apply Modal Flow (`JobApplyModal`)**:
  - **Tailored CV Selection**: Choose which CV version to attach (pre-selects Primary CV).
  - **Optional Cover Letter**: Markdown-supported cover letter input.
  - **Screening Questions**:
    - Renders recruiter-defined boolean questions (with knockout criteria detection) and text response fields.
    - Instant client-side validation preventing submission of incomplete responses.
  - **Submission Handling**: Creates `applications` record, triggers async ATS scoring engine (`ats-scoring.service.ts`), and transitions candidate into the `APPLIED` pipeline stage.

### 1.5 Application Withdrawal with Audit Logging (`FR-AP-20`)
- **Withdrawal Action**:
  - Applicants can withdraw submitted applications that have not reached a terminal stage (`HIRED` or `REJECTED`).
  - Prompts for an optional withdrawal reason stored for recruiter audit tracking.
  - Updates application status to `WITHDRAWN` and frees candidate slot.

### 1.6 Applicant Application Status Dashboard (`FR-AP-21`)
- **Unified Tracking Dashboard (`MyApplicationsPage`)**:
  - Responsive table and card view of all submitted applications.
  - Displays Company Name & Logo, Job Title, Employment Type, Applied Date, ATS Match Score badge, and current Pipeline Stage pill (`APPLIED`, `SCREENING`, `SHORTLISTED`, `INTERVIEW`, `OFFER`, `HIRED`, `REJECTED`, `WITHDRAWN`).
  - Direct links to view original job vacancy details or withdraw application.

---

## 2. API Endpoints Reference

All endpoints are mounted under `/api/v1` and require appropriate JWT authentication (`Applicant` role for application routes).

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/jobs` | Search and filter published job vacancies | Public / Optional |
| `GET` | `/api/v1/jobs/:id` | Get job vacancy details and screening questions | Public / Optional |
| `POST` | `/api/v1/jobs/:id/save` | Bookmark / save a job vacancy | Applicant |
| `DELETE` | `/api/v1/jobs/:id/save` | Remove bookmark / un-save job vacancy | Applicant |
| `GET` | `/api/v1/jobs/saved` | List all bookmarked jobs for authenticated applicant | Applicant |
| `POST` | `/api/v1/applications` | Submit application with CV selection & screening answers | Applicant |
| `GET` | `/api/v1/applications/my-applications` | List all applications submitted by authenticated applicant | Applicant |
| `GET` | `/api/v1/applications/:id` | Get detailed application status, answers & ATS score | Applicant |
| `POST` | `/api/v1/applications/:id/withdraw` | Withdraw active application with optional reason | Applicant |

---

## 3. Frontend Architecture

### 3.1 Components & Pages
- `frontend/src/pages/applicant/JobSearchPage.tsx`: Job discovery search page with filter drawer, salary sliders, and search cards.
- `frontend/src/pages/applicant/JobDetailPage.tsx`: Detailed job view with requirements checklist, ATS match preview banner, and apply trigger.
- `frontend/src/pages/applicant/MyApplicationsPage.tsx`: Application tracker dashboard with status pills and withdrawal actions.
- `frontend/src/features/job-search/components/JobApplyModal.tsx`: Multi-step apply modal with CV selector and screening question inputs.
- `frontend/src/features/job-search/components/JobCard.tsx`: Job card with bookmark button, company branding, and salary tags.

### 3.2 State Management & Hooks
- `frontend/src/features/job-search/hooks.ts`:
  - `useJobSearch(filters)`: TanStack Query hook with debounced keyword search.
  - `useJobDetail(id)`: Query hook fetching vacancy and applicant apply status.
  - `useSaveJob()`, `useUnsaveJob()`: Mutations with optimistic UI updates.
  - `useSubmitApplication()`: Mutation triggering apply flow and invalidating dashboard query.
  - `useWithdrawApplication()`: Mutation updating application status.

---

## 4. Verification & Testing

### 4.1 Unit & Integration Tests
- **Frontend Test Suite**: [`frontend/tests/unit/JobSearchAndApplyFlow.test.tsx`](file:///c:/Users/shash/OneDrive/Desktop/Reactjs/RecruitingPlatformwithATS/frontend/tests/unit/JobSearchAndApplyFlow.test.tsx)
  - 7 comprehensive tests passing:
    1. Renders JobSearchPage with search bar, filters, and published job cards.
    2. Filters job list by keyword and employment type.
    3. Toggles bookmarking / saving jobs with optimistic icon update.
    4. Opens JobApplyModal and submits application with selected CV and screening answers.
    5. Displays knockout warning when required screening question is not met.
    6. Renders MyApplicationsPage with application list, ATS score badges, and status stages.
    7. Successfully withdraws an application with confirmation modal.
