# Epic 9: Applicant CV / Resume Management

## Overview
Epic 9 implements the complete **Applicant CV / Resume Management** lifecycle according to `docs/Recruitment_Platform_SRS.md` (§3.3.2, `FR-AP-12` to `FR-AP-15`) and `docs/Epic_Backlog.md`. 
It provides candidates with:
1. **Multi-format CV Upload & Smart Parsing (`FR-AP-12`)**: Validated file ingestion (PDF, DOCX) with text & entity extraction and an interactive review drawer to selectively verify and sync parsed skills, experiences, and education to their profile.
2. **CV Builder from Structured Profile (`FR-AP-13`)**: Template-based PDF generator supporting 3 ATS-optimized layouts (`MODERN_CLEAN`, `TECHNICAL_ATS`, `EXECUTIVE_CLASSIC`), live A4 simulation preview, section toggles, and PDF generation with `pdf-lib`.
3. **Multiple Tailored CV Versions (`FR-AP-14`)**: Multi-version management (e.g. "Frontend Specialist CV", "Full-Stack React/Node CV"), inline version labeling, primary CV designation for one-click job applications, and CV duplication.
4. **CV Version History & Restore Rollback (`FR-AP-15`)**: Chronological version tracking via `CVVersion` model, version timeline UI, and one-click rollback to any historical file snapshot.

---

## 1. Features Implemented

### 1.1 CV Upload & Smart Parsing Verification (`FR-AP-12`)
- **File Validation & Ingestion**:
  - Validates document MIME types (`application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/msword`, `text/plain`) and limits file size to 5MB max.
  - Generates secure file references under `uploads/resumes/` on disk.
- **Smart Text & Entity Extraction**:
  - Extracts raw plain text for ATS TF-IDF indexing.
  - Extracts contact information, matching taxonomy skills, work experience titles, and education credentials into `parsedJson`.
- **Selective Sync Confirmation Drawer (`SmartParseReviewModal`)**:
  - Interactive drawer that pops up after upload (or via "Review Data" button).
  - Allows the candidate to selectively review extracted entities:
    - Toggle headline & summary import.
    - Select/deselect individual detected skills chips with "Select All" / "Deselect All".
    - Toggle importing work experiences and education milestones.
  - Saves verified entities into `ApplicantProfile`, `ApplicantSkill`, `WorkExperience`, and `Education` records.

### 1.2 CV Builder from Structured Profile (`FR-AP-13`)
- **Template-Based PDF Generator (`CVBuilderService`)**:
  - Generates clean, ATS-optimized vector PDFs using `pdf-lib`.
  - Supports 3 distinct layout themes:
    - `MODERN_CLEAN`: Accent colored header bars, contemporary typography, modern two-column layout.
    - `TECHNICAL_ATS`: Linear single-column, high-contrast monochrome layout optimized for machine parsers and bot ingestion.
    - `EXECUTIVE_CLASSIC`: Formal serif-styled header, traditional centered alignment, horizontal dividing rules.
- **Tailoring Controls & Live Preview (`CVBuilderModal`)**:
  - Live browser preview with A4 ratio container and print-ready CSS (`@media print`).
  - Section toggles for Summary, Technical Skills, Work Experience, Education, and Certifications.
  - Editable headline, summary, and version label.
  - Single-click "Compile & Save CV Version" button, immediately producing a download-ready PDF document and snapshotting version #1 in `CVVersion`.

### 1.3 Multiple Tailored CV Versions (`FR-AP-14`)
- **CV Library & Tailoring Dashboard (`CVManager`)**:
  - Displays all candidate CVs in responsive cards with visual source badges (`Built with Generator` vs `Uploaded PDF/DOCX`).
  - Template badges (`Modern Clean`, `Technical ATS`, `Executive Classic`).
  - Parsing status pills (`PARSED`, `PROCESSING`, `FAILED`).
  - Highlighted skill keyword pills.
- **Custom Version Labeling**:
  - Inline version label renaming with pencil action (e.g. "Senior Frontend Specialist CV").
- **Primary CV Designation**:
  - Candidates can mark any CV as their "Primary CV".
  - One-click application flows automatically pre-select this CV.
- **CV Duplication**:
  - "Duplicate" action clones an existing CV and creates a new editable copy ready for role-specific tweaking.

### 1.4 Chronological Version Tracking & Rollback (`FR-AP-15`)
- **Version Tracking Engine (`CVVersionService`)**:
  - Every build and upload automatically records a permanent snapshot in the `CVVersion` table with incrementing `versionNumber`.
  - Captures `fileName`, `fileRef`, `fileSize`, `mimeType`, `parsedText`, `parsedJson`, `templateName`, and `createdFrom`.
- **Version History Drawer (`CVVersionHistoryModal`)**:
  - Chronological timeline of all iterations for a given CV.
  - Displays version label, template used, creation timestamp, and active status indicator.
  - Expandable detail view showing parsed skills and word count.
- **One-Click Rollback**:
  - "Rollback to this version" action safely reverts the parent `CV` record to point to the historical file snapshot and parsed data without destroying future history.

---

## 2. API Endpoints Reference

All endpoints are mounted under `/api/v1/applicant/resume` and require authentication (`Applicant` or `Super Admin` role).

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/applicant/resume` | List all CVs for the authenticated applicant |
| `POST` | `/api/v1/applicant/resume` | Upload a new CV file (PDF/DOCX) and parse entities |
| `DELETE` | `/api/v1/applicant/resume/:id` | Delete a CV and all its historical version records |
| `PUT` | `/api/v1/applicant/resume/:id/primary` | Designate a CV as the Primary CV |
| `POST` | `/api/v1/applicant/resume/:id/apply-to-profile` | Legacy: Apply all parsed CV entities to profile |
| `POST` | `/api/v1/applicant/resume/:id/sync-selective` | **Epic 9**: Selectively sync verified parsed skills/experience |
| `POST` | `/api/v1/applicant/resume/build` | **Epic 9**: Generate ATS-optimized PDF CV from profile data |
| `GET` | `/api/v1/applicant/resume/:id/versions` | **Epic 9**: List chronological version snapshots for a CV |
| `POST` | `/api/v1/applicant/resume/:id/versions/:versionId/restore` | **Epic 9**: Roll back active CV to a previous version |
| `PUT` | `/api/v1/applicant/resume/:id/label` | **Epic 9**: Update the custom version label of a CV |
| `POST` | `/api/v1/applicant/resume/:id/duplicate` | **Epic 9**: Duplicate a CV into a new tailored version |
| `GET` | `/api/v1/applicant/resume/:id/download` | **Epic 9**: Stream the binary PDF file for local download |

---

## 3. Database Schema Changes

### 3.1 `CVVersion` Model
```prisma
model CVVersion {
  id            String   @id @default(uuid())
  cvId          String   @map("cv_id")
  versionNumber Int      @map("version_number")
  versionLabel  String?  @map("version_label")
  fileRef       String   @map("file_ref")
  fileName      String   @map("file_name")
  fileSize      Int      @map("file_size")
  mimeType      String   @default("application/pdf") @map("mime_type")
  parsedText    String?  @db.LongText @map("parsed_text")
  parsedJson    Json?    @map("parsed_json")
  createdFrom   String   @default("BUILDER") @map("created_from") // BUILDER | UPLOAD
  templateName  String?  @map("template_name")
  createdAt     DateTime @default(now()) @map("created_at")

  cv CV @relation(fields: [cvId], references: [id], onDelete: Cascade)

  @@unique([cvId, versionNumber])
  @@map("cv_versions")
}
```

### 3.2 `CV` Model Extensions
```prisma
model CV {
  // ... existing fields ...
  versionLabel  String?     @map("version_label")
  createdFrom   String      @default("UPLOAD") @map("created_from") // BUILDER | UPLOAD
  templateName  String?     @map("template_name")
  updatedAt     DateTime    @default(now()) @updatedAt @map("updated_at")

  versions      CVVersion[]
}
```

---

## 4. Frontend Component Architecture

| Component | Path | Description |
|---|---|---|
| `CVManager` | `frontend/src/features/applicant-profile/components/CVManager.tsx` | Main CV library container, drag-and-drop dropzone, card grid, inline label editor, actions |
| `CVBuilderModal` | `frontend/src/features/applicant-profile/components/CVBuilderModal.tsx` | Template selector (`MODERN_CLEAN`, `TECHNICAL_ATS`, `EXECUTIVE_CLASSIC`), live A4 preview, section toggles, PDF compile trigger |
| `CVVersionHistoryModal` | `frontend/src/features/applicant-profile/components/CVVersionHistoryModal.tsx` | Chronological version timeline, template pills, keyword inspectors, rollback confirmation action |
| `SmartParseReviewModal` | `frontend/src/features/applicant-profile/components/SmartParseReviewModal.tsx` | Entity verification drawer with selective skill chips, headline/summary import toggles |

---

## 5. Verification & Test Coverage

### 5.1 Automated Backend Tests (`cv-builder.test.ts`)
- `CVBuilderService`:
  - Successfully generates clean vector PDF buffers across all 3 templates (`MODERN_CLEAN`, `TECHNICAL_ATS`, `EXECUTIVE_CLASSIC`).
  - Correctly indexes plain text and extracts skill keywords for ATS TF-IDF compatibility.
- `CVVersionService`:
  - Lists chronological versions ordered by `versionNumber DESC`.
  - Reverts active CV to historical snapshot and updates file references and labels.
  - Updates version labels and duplicates CVs into new records with fresh version trees.
- `ResumeParserService`:
  - `syncResumeSelective` imports only checked skills and ignores unchecked ones.
- **Backend Test Result**: 91 / 91 passed (10/10 test files).

### 5.2 Automated Frontend Tests (`CVManagementFlow.test.tsx`)
- Renders tailored CV versions with primary badges, template tags, file sizes, and skill keywords.
- Inline version label editing via pencil button and Enter key.
- `CVBuilderModal` configuration, template selection, and compile payload submission.
- `CVVersionHistoryModal` chronological timeline and one-click rollback.
- `SmartParseReviewModal` skill chip toggling and selective profile synchronization.
- **Frontend Test Result**: 62 / 62 passed (10/10 test files).
