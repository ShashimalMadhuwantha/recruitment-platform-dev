# Epic 11: Recruiter: Candidate Pipeline & Talent Sourcing

## Overview
Epic 11 implements the complete **Recruiter: Candidate Pipeline & Talent Sourcing** workflow according to `docs/Recruitment_Platform_SRS.md` (§3.2.3, `FR-RC-10` to `FR-RC-16`) and `docs/Epic_Backlog.md`.
It provides hiring teams with:
1. **Applicant List with ATS Score Sorting & Filtering (`FR-RC-10`)**: Dual-view candidate management (Kanban Board & Table) with text search, score band filters, and dynamic multi-criteria sorting.
2. **Talent Pool Sourcing Directory (`FR-RC-11`)**: Central applicant database search strictly enforcing candidate visibility settings (`PUBLIC` vs `BLIND` vs `PRIVATE`) and authenticated CV downloads.
3. **Interactive Kanban Pipeline Board (`FR-RC-12`)**: Drag-and-drop / selector progression across 7 standardized stages with automatic transition auditing in `candidate_pipelines` and `audit_logs`.
4. **ATS Score Explainability & Recruiter Override (`FR-RC-13`, `FR-ATS-07`)**: Score breakdown modal with sub-scores, matched/missing skills, top matching terms, and audited manual score override.
5. **Bulk Candidate Actions (`FR-RC-14`)**: Multi-candidate selection with a floating action bar supporting bulk stage transitions, CSV exports, and multi-candidate comparison.
6. **Internal Team Notes & Star Ratings (`FR-RC-15`)**: Candidate detail drawer with private team note threads and 1–5 star rating evaluations.
7. **Side-by-Side Candidate Comparison Matrix (`FR-RC-16`)**: Multi-column comparison modal analyzing 2 to 4 shortlisted candidates across skills, scores, experience, education, and ratings.

---

## 1. Features Implemented

### 1.1 Candidate Pipeline Dual View with ATS Score Sorting & Filtering (`FR-RC-10`)
- **Dual View Modes**:
  - **Kanban Board**: 7 stage columns with visual cards, avatar initials, match score badges, team ratings, and stage selector dropdowns.
  - **Table View**: Dense tabular display for high-volume recruitment screening with columns for Candidate Name, Current Stage, ATS Match Score, Experience, Location, Must-have Skills Match ratio, and Actions.
- **Search & Filter Controls**:
  - Real-time search by full name, email, headline, or location.
  - Quick-filter score band pills:
    - **All Scores**
    - **Strong Match (≥ 75% / HIGH)**
    - **Good Match (60–74% / MID)**
    - **Partial / Weak (< 60% / LOW)**
  - Dynamic sorting dropdown: Newest Applied, Oldest Applied, ATS Score (High to Low / Low to High), Team Rating, and Candidate Name (A–Z).

### 1.2 Talent Pool Sourcing Directory (`FR-RC-11`)
- **Search & Discovery (`/recruiter/talent-pool`)**:
  - Query candidates across active applicant profiles by keyword, required skills, location, and minimum experience.
- **Strict Privacy Compliance**:
  - `PUBLIC`: Full candidate profile and contact info visible; CV downloadable.
  - `BLIND`: Masked as `Candidate #<ID>`, contact info redacted, labeled with "Blind Profile - Identity Protected" shield badge.
  - `PRIVATE`: Strictly excluded from search results.
- **Authenticated CV Download**:
  - Secure blob download via `apiClient` using JWT authorization, with automatic filename formatting.

### 1.3 Interactive Kanban Pipeline Board across 7 Stages (`FR-RC-12`)
- **Standardized Progression Stages**:
  1. `APPLIED`
  2. `SCREENING`
  3. `SHORTLISTED`
  4. `INTERVIEW`
  5. `OFFER`
  6. `HIRED`
  7. `REJECTED`
- **Audit Trails**: Every stage move updates `applications.status`, creates a record in `candidate_pipelines`, and writes an entry into `audit_logs` tracking the recruiter actor and timestamp.

### 1.4 ATS Score Explainability & Recruiter Override (`FR-RC-13`, `FR-ATS-07`)
- **Score Breakdown Modal (`CandidateScoreAnalysisModal`)**:
  - Detailed sub-score bars: Skills Match, Work Experience, Education Level, Semantic TF-IDF, and Certifications.
  - Highlighted must-have and nice-to-have skill match badges.
  - TF-IDF top matching keywords.
- **Manual Score Override**:
  - Recruiters can override the automated match score (0–100) with a mandatory justification reason.
  - Override is badged with an edit icon and recorded in `audit_logs`.

### 1.5 Bulk Candidate Actions (`FR-RC-14`)
- **Floating Action Bar (`BulkActionBar`)**:
  - Appears whenever 1 or more candidates are checked.
  - **Move to Stage Popover**: Custom upward-opening menu with stage color accents for moving all selected candidates at once.
  - **Compare Button**: Enabled when 2 to 4 candidates are selected, opening the side-by-side comparison matrix.
  - **Export CSV**: Instant client-side CSV download containing candidate names, emails, stages, ATS scores, ratings, and application dates.
  - **Deselect All**: Quick dismissal of active selection.

### 1.6 Internal Team Notes & 1–5 Star Ratings (`FR-RC-15`)
- **Candidate Detail Drawer (`CandidateDetailDrawer`)**:
  - Accessible via "Details & Notes" on cards and table rows.
  - Interactive 1–5 star rating widget.
  - Markdown note textarea with submit action.
  - Chronological thread of team notes displaying author name, timestamp, rating, and author-only delete option.
  - Aggregated average star rating and note count badged on pipeline cards.

### 1.7 Side-by-Side Candidate Comparison Matrix (`FR-RC-16`)
- **Comparison Matrix (`CandidateComparisonModal`)**:
  - Side-by-side columns comparing 2 to 4 selected candidates.
  - Overall ATS match score and score band badge.
  - Sub-scores radar / progress breakdown.
  - Must-have skills checklist with green checks for matches and red crosses for gaps.
  - Total experience years, education summary, and internal team ratings.

---

## 2. API Endpoints Reference

All endpoints are mounted under `/api/v1` and require `Recruiter` or `Super Admin` role authentication.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/applications/jobs/:jobId` | Fetch vacancy pipeline candidates with scores, stages, and ratings |
| `PATCH` | `/api/v1/applications/:id/stage` | Move single candidate to a new pipeline stage |
| `POST` | `/api/v1/applications/bulk-stage` | Move multiple candidates to a target stage in bulk |
| `GET` | `/api/v1/applications/:id/notes` | Get all internal team notes for an application |
| `POST` | `/api/v1/applications/:id/notes` | Create a private team note with optional 1–5 star rating |
| `DELETE` | `/api/v1/applications/notes/:noteId` | Delete team note (author or admin only) |
| `POST` | `/api/v1/applications/compare` | Fetch side-by-side comparison payload for 2–4 candidates |
| `GET` | `/api/v1/talent-pool` | Search talent directory with privacy filtering |
| `GET` | `/api/v1/applicant/resume/:id/download` | Download candidate CV with recruiter role authorization |

---

## 3. Frontend Architecture

### 3.1 Components & Pages
- `frontend/src/pages/recruiter/RecruiterPipelinePage.tsx`: Main pipeline dashboard with vacancy selector, search/filter header, Kanban board, and Table view.
- `frontend/src/pages/recruiter/TalentPoolPage.tsx`: Talent pool sourcing directory with facet filters, privacy badges, and CV download.
- `frontend/src/features/recruiter-pipeline/components/KanbanBoard.tsx`: 7-stage column board with card counters and drag/stage selectors.
- `frontend/src/features/recruiter-pipeline/components/PipelineTableView.tsx`: High-density candidate table.
- `frontend/src/features/recruiter-pipeline/components/BulkActionBar.tsx`: Floating action bar with stage popover, comparison trigger, and CSV export.
- `frontend/src/features/recruiter-pipeline/components/CandidateDetailDrawer.tsx`: Sliding evaluation drawer with 1–5 star ratings and note thread.
- `frontend/src/features/recruiter-pipeline/components/CandidateComparisonModal.tsx`: Matrix modal comparing 2–4 candidates.

---

## 4. Verification & Testing

### 4.1 Backend Tests
- File: [`backend/src/modules/application-pipeline/pipeline-management.test.ts`](file:///c:/Users/shash/OneDrive/Desktop/Reactjs/RecruitingPlatformwithATS/backend/src/modules/application-pipeline/pipeline-management.test.ts)
  - **6 / 6 tests passing**:
    1. Vacancy candidate pipeline retrieval with ATS score ordering.
    2. Stage movement with audit logging and candidate pipeline history.
    3. Bulk stage transition.
    4. Internal candidate notes and star ratings.
    5. Side-by-side candidate comparison matrix payload generation.
    6. Talent pool candidate search strictly respecting visibility settings (`PUBLIC` vs `BLIND` vs `PRIVATE`).

### 4.2 Frontend Tests
- File: [`frontend/tests/unit/RecruiterPipelineFlow.test.tsx`](file:///c:/Users/shash/OneDrive/Desktop/Reactjs/RecruitingPlatformwithATS/frontend/tests/unit/RecruiterPipelineFlow.test.tsx)
  - **5 / 5 tests passing**:
    1. Renders pipeline page with 7 stages and candidate cards.
    2. Filters and sorts candidate cards by ATS score band and text search.
    3. Multi-candidate selection, floating bulk action bar, and stage popover move.
    4. Opens candidate detail drawer and submits team note with star rating.
    5. Talent pool directory rendering with privacy badges and CV download.
