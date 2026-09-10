# Epic 6: Applicant: Profile & Resume Management

## Overview
Epic 6 implements candidate profile construction, resume uploading and background parsing, completeness calculation, and blind recruitment profile anonymization in accordance with `docs/Recruitment_Platform_SRS.md` (§3.3, §4.4, §5.1, §6) and `docs/Epic_Backlog.md`. Applicants can create and manage their professional identities, upload resumes in standard formats (PDF, DOCX, TXT) with automated skill and entity extraction, track profile completeness with a weighted 0–100% meter, and preview their anonymized profile as viewed under blind recruitment conditions to safeguard against unconscious hiring bias.

---

## 1. Features Implemented

### 1.1 Candidate Profile Builder (`feature/06-candidate-profile`)
- **Personal & Contact Info**:
  - First name, last name, phone, headline (e.g. "Senior Full-Stack Engineer"), location, and executive bio summary.
- **Work Experience History**:
  - Company name, job title, start/end dates, "Currently working here" toggle, bullet point descriptions, and tagged skills used.
- **Education History**:
  - Degree level, field of study, academic institution, graduation dates, and GPA.
- **Taxonomy-Linked Skills**:
  - Direct integration with the master `Skill` taxonomy.
  - Proficiency self-assessment (1 to 5 stars: Novice to Expert) and years of experience.
- **Certifications & Portfolios**:
  - Professional credentials (name, issuer, issue date, credential URL).
  - External links (GitHub, LinkedIn, Personal Portfolio, Design Behance/Dribbble).
- **Profile Completeness Engine (0–100%)**:
  - Weighted algorithm evaluating candidate profile readiness:
    - Personal Information: 20%
    - Work Experience: 25%
    - Education: 20%
    - Skills (at least one skill recorded): 20%
    - Resume / CV Attached: 15%
  - Real-time suggestions panel guiding applicants to 100% profile strength.

### 1.2 Resume Upload & Background Parsing (`feature/06-resume-parser`)
- **File Upload & Validation**:
  - Secure upload endpoint supporting PDF, DOCX, and plain text files with strict 5MB size limit checks.
  - Stored securely in `uploads/resumes/` with UUID-based naming.
- **Background Parsing Pipeline**:
  - Creates a `BackgroundJob` record with `RESUME_PARSING` type.
  - Entity extraction parser extracting candidate contact info, text preview, and detecting skills matching against the platform's active skill taxonomy.
  - Stores parsed JSON payload and updates `CV.parsingStatus` (`PROCESSING` &rarr; `COMPLETED`).
- **One-Click "Apply to Profile" Auto-Fill**:
  - Automatically imports parsed experiences, educations, and matched taxonomy skills into the candidate's active profile with a single click.

### 1.3 Profile Anonymization & Privacy (`feature/06-profile-privacy`)
- **Visibility Settings**:
  - Granular privacy settings: `PUBLIC` (searchable by recruiters), `PRIVATE` (visible only on direct job application), or `ANONYMOUS` (blind recruitment mode).
- **Redaction Engine**:
  - Strips PII (full name, email, phone number, physical address, profile photos).
  - Replaces candidate identity with a deterministic pseudonym (e.g., "Candidate #A1B2").
  - Generalizes company names to sector archetypes (e.g., "Technology / Software Enterprise") and academic institutions to tiers to prevent prestige or demographic bias during preliminary screening.
- **Blind Recruitment Preview Modal**:
  - Interactive preview modal allowing candidates to see how their profile appears to recruiters under blind screening mode.
- **Audit Logging**:
  - Records an `AuditLog` entry whenever anonymized profiles are accessed or reviewed.

---

## 2. API Endpoints Reference

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/api/v1/applicant/profile` | Get logged-in applicant's full profile and completeness breakdown | Applicant, Super Admin |
| `PUT` | `/api/v1/applicant/profile` | Update basic info and privacy visibility settings | Applicant, Super Admin |
| `POST` | `/api/v1/applicant/profile/experiences` | Add a work experience entry | Applicant, Super Admin |
| `DELETE` | `/api/v1/applicant/profile/experiences/:id` | Remove a work experience entry | Applicant, Super Admin |
| `POST` | `/api/v1/applicant/profile/educations` | Add an education entry | Applicant, Super Admin |
| `DELETE` | `/api/v1/applicant/profile/educations/:id` | Remove an education entry | Applicant, Super Admin |
| `POST` | `/api/v1/applicant/profile/skills` | Add or update a taxonomy-linked skill | Applicant, Super Admin |
| `DELETE` | `/api/v1/applicant/profile/skills/:id` | Remove a skill from profile | Applicant, Super Admin |
| `POST` | `/api/v1/applicant/profile/certifications` | Add a certification | Applicant, Super Admin |
| `DELETE` | `/api/v1/applicant/profile/certifications/:id` | Remove a certification | Applicant, Super Admin |
| `POST` | `/api/v1/applicant/profile/portfolios` | Add a portfolio/social link | Applicant, Super Admin |
| `DELETE` | `/api/v1/applicant/profile/portfolios/:id` | Remove a portfolio link | Applicant, Super Admin |
| `POST` | `/api/v1/applicant/resume` | Upload resume file (PDF, DOCX <= 5MB) | Applicant, Super Admin |
| `GET` | `/api/v1/applicant/resume/status/:id` | Poll background parsing job status | Applicant, Super Admin |
| `POST` | `/api/v1/applicant/resume/apply-to-profile` | Apply parsed resume items directly to profile | Applicant, Super Admin |
| `GET` | `/api/v1/applicant/profile/anonymized-preview` | Get PII-redacted blind recruitment profile | Applicant, Super Admin |

---

## 3. Database Schema Changes

Updated `CV` model in `backend/prisma/schema.prisma` with `parsingStatus` tracking column:

```prisma
model CV {
  id            String      @id @default(uuid())
  applicantId   String      @map("applicant_id")
  fileRef       String      @map("file_ref")
  fileName      String      @map("file_name")
  fileSize      Int         @map("file_size")
  mimeType      String      @map("mime_type")
  parsedText    String?     @map("parsed_text") @db.Text
  parsedJson    Json?       @map("parsed_json")
  versionLabel  String?     @map("version_label")
  isPrimary     Boolean     @default(true) @map("is_primary")
  parsingStatus String?     @default("COMPLETED") @map("parsing_status")
  createdAt     DateTime    @default(now()) @map("created_at")

  applicant     Applicant   @relation(fields: [applicantId], references: [id], onDelete: Cascade)
  applications  Application[]

  @@map("cvs")
}
```

---

## 4. Frontend Components & Pages

| Component / Page | Path | Description |
|---|---|---|
| `ApplicantProfilePage` | `frontend/src/pages/applicant/ApplicantProfilePage.tsx` | Comprehensive profile builder with sticky completeness meter, tabs for all sections, and blind preview trigger |
| `ApplicantDashboardPage` | `frontend/src/pages/applicant/ApplicantDashboardPage.tsx` | Dashboard featuring real-time completeness progress card and quick-action links |
| `CompletenessMeter` | `frontend/src/features/applicant-profile/components/CompletenessMeter.tsx` | Visual progress bar, percentage gauge, readiness checklist, and suggestions |
| `BasicInfoSection` | `frontend/src/features/applicant-profile/components/BasicInfoSection.tsx` | Name, headline, location, and executive summary editor |
| `ExperienceSection` | `frontend/src/features/applicant-profile/components/ExperienceSection.tsx` | Timeline list and modal form for work history |
| `EducationSection` | `frontend/src/features/applicant-profile/components/EducationSection.tsx` | Academic history list and modal form |
| `SkillsSection` | `frontend/src/features/applicant-profile/components/SkillsSection.tsx` | Taxonomy skill picker with 1–5 star proficiency slider |
| `CertificationsSection` | `frontend/src/features/applicant-profile/components/CertificationsSection.tsx` | Professional credentials manager |
| `PortfolioSection` | `frontend/src/features/applicant-profile/components/PortfolioSection.tsx` | External link and portfolio manager |
| `ResumeUploader` | `frontend/src/features/applicant-profile/components/ResumeUploader.tsx` | Drag-and-drop resume uploader with parsing progress and parsed preview |
| `BlindRecruitmentPreviewModal` | `frontend/src/features/applicant-profile/components/BlindRecruitmentPreviewModal.tsx` | Modal demonstrating bias-free candidate presentation |
| `PrivacySettingsSection` | `frontend/src/features/applicant-profile/components/PrivacySettingsSection.tsx` | Visibility setting switcher (`PUBLIC`, `PRIVATE`, `ANONYMOUS`) |

---

## 5. Verification & Test Suite

### Automated Backend Tests
- **Path**: `backend/src/modules/applicant-profile/applicant-profile.test.ts` (9 tests)
- **Coverage**:
  1. Auto-creates profile record if non-existent upon first retrieval.
  2. Updates profile basic info and contact details.
  3. Manages work experiences (CRUD operations).
  4. Manages education history entries.
  5. Adds and deletes taxonomy-linked skills with proficiency levels.
  6. Calculates profile completeness score dynamically based on populated sections.
  7. Parses uploaded resume content and maps skills against the taxonomy.
  8. Applies parsed resume entities to candidate profile records.
  9. Generates anonymized blind recruitment profile and logs audit event.
- **Backend Total**: **66 / 66 passed** across all 8 backend test files.

### Automated Frontend Tests
- **Path**: `frontend/tests/unit/ApplicantProfileFlow.test.tsx` (5 tests)
- **Coverage**:
  1. Renders profile header and completeness meter with readiness breakdown.
  2. Switches between builder tabs (Experience, Skills, Resume, Privacy).
  3. Adds a new work experience entry through the modal dialog.
  4. Adds a taxonomy-backed skill with proficiency.
  5. Opens and displays the Blind Recruitment Preview modal with redacted PII.
- **Frontend Total**: **41 / 41 passed** across all 7 frontend test files.

### Typecheck & Build
- `npm run typecheck`: Passed across `@recruitment-platform/shared`, `@recruitment-platform/backend`, and `@recruitment-platform/frontend`.
- `npm run build`: Production bundling completed successfully.
