# Epic 13 — Offers, Hiring & Applicant Career Tools

**Target Branch:** `epic/13-offers-hiring-career-tools`  
**Status:** In Progress  
**Covers Requirements:** FR-RC-24, FR-RC-25, FR-AP-22 to FR-AP-24  
**Design Skill Activated:** `recruitment-platform-frontend-design`  
**Dev Skill Activated:** `recruitment-platform-dev`

---

## 1. Overview & Business Objectives

Epic 13 closes the recruiting lifecycle loop while providing applicants with transparent post-apply score feedback, profile optimization guidance, and automated CV health diagnostics.

1. **Offer Letter Generation & Tracking (FR-RC-24)**:
   Recruiters can generate structured, template-based job offers specifying compensation (base salary, bonus, currency, equity), proposed start date, expiration date, and benefits summary. Offers transition through `DRAFT`, `SENT`, `ACCEPTED`, `DECLINED`, and `EXPIRED`.
2. **Mark as Hired & Requisition Closing (FR-RC-25)**:
   Upon candidate acceptance (or recruiter decision), recruiters can mark a candidate as `HIRED`, automatically moving pipeline status and offering to close the requisition as `FILLED` (or `CLOSED`) with audit logging.
3. **Post-Apply Detailed Score Feedback (FR-AP-22)**:
   Candidates who have submitted applications can inspect their full explainable ATS score breakdown, matched vs. missing skills, experience gaps, and targeted outcome recommendations.
4. **"Improve My Profile" Suggestions (FR-AP-23)**:
   An intelligent career advisor service that scans all of an applicant's applied and saved job vacancies, extracts market-level skill demand, and ranks personalized profile enhancement recommendations.
5. **CV Health-Check Diagnostic Tool (FR-AP-24)**:
   An automated diagnostic engine analyzing uploaded/profile CVs across section completeness (Contact, Summary, Experience, Education, Skills), word count / length optimization, action verb density, measurable quantifiable metrics, and keyword repetition.

---

## 2. Architecture & Data Models

### Database Schema Additions (`backend/prisma/schema.prisma`)

```prisma
enum OfferStatus {
  DRAFT
  SENT
  ACCEPTED
  DECLINED
  EXPIRED
}

model JobOffer {
  id              String      @id @default(uuid())
  applicationId   String      @unique @map("application_id")
  createdById     String      @map("created_by_id")
  baseSalary      Decimal     @map("base_salary") @db.Decimal(12, 2)
  currency        String      @default("USD")
  bonus           Decimal?    @db.Decimal(12, 2)
  equity          String?
  startDate       DateTime    @map("start_date")
  expirationDate  DateTime    @map("expiration_date")
  offerLetterText String?     @map("offer_letter_text") @db.Text
  benefitsSummary String?     @map("benefits_summary") @db.Text
  notes           String?     @db.Text
  status          OfferStatus @default(DRAFT)
  declinedReason  String?     @map("declined_reason") @db.Text
  sentAt          DateTime?   @map("sent_at")
  respondedAt     DateTime?   @map("responded_at")
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  application Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  createdBy   User        @relation("OffersCreated", fields: [createdById], references: [id], onDelete: Cascade)

  @@index([createdById])
  @@index([status])
  @@map("job_offers")
}
```

### Job Status Enum Update
```prisma
enum JobStatus {
  DRAFT
  PUBLISHED
  PAUSED
  CLOSED
  FILLED
  FLAGGED
}
```

---

## 3. API Contract Specifications

### Offers & Hiring (`/api/v1/offers`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/applications/:applicationId` | Recruiter, Applicant, Admin | Get offer for application |
| `POST` | `/applications/:applicationId` | Recruiter, Admin | Create or update draft offer |
| `POST` | `/applications/:applicationId/send` | Recruiter, Admin | Send official offer to candidate |
| `PATCH` | `/:offerId/respond` | Applicant | Accept or decline offer |
| `POST` | `/applications/:applicationId/hire` | Recruiter, Admin | Mark candidate as `HIRED` & optionally close vacancy (`FILLED`) |

### Career Tools & CV Diagnostics (`/api/v1/career-tools`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/cv-health-check` | Applicant, Admin | Run automated diagnostic check on current profile CV |
| `GET` | `/profile-suggestions` | Applicant, Admin | Get ranked profile improvement suggestions based on target vacancies |

---

## 4. Frontend Component Architecture

1. **Recruiter Features**:
   - `OfferGeneratorModal.tsx`: Configure compensation, benefits, start date, expiration; live preview of generated offer letter; send offer button.
   - `MarkHiredModal.tsx`: Finalize hiring, confirm hire date, and option to set job vacancy to `FILLED`.
   - `CandidateDetailDrawer.tsx`: Embedded "Offer" action button, offer status badge, and "Mark as Hired" workflow.

2. **Applicant Features**:
   - `OfferReviewModal.tsx`: Full official offer letter preview, compensation breakdown, benefits, terms, expiry countdown, print/download summary, and Accept/Decline action buttons.
   - `CvHealthCheckModal.tsx`: Visual health score gauge (0–100%), grouped findings (Critical, Warnings, Passed), keyword density breakdown, and action items.
   - `ProfileImprovementDrawer.tsx`: Targeted skills recommendations from applied/saved roles with priority badges (High, Medium, Low).
   - `ApplicantDashboardPage.tsx`: Official offer callout banner, post-apply score feedback drawer trigger, and career diagnostic tools in header/actions.

---

## 5. Verification & Testing Strategy

- **Backend Unit & Integration Tests**:
  - `backend/src/modules/offers/offers.test.ts`: Verify offer creation, sending, candidate acceptance/rejection, expiration logic, and requisition closing.
  - `backend/src/modules/career-tools/career-tools.test.ts`: Verify CV completeness scoring, verb analysis, metric detection, and vacancy skill gap aggregation.
- **Frontend Unit Tests**:
  - `frontend/tests/unit/OffersAndCareerToolsFlow.test.tsx`: Render modals, verify form validations, simulate offer acceptance, and check diagnostic displays.
- **Build Checks**:
  - Full TypeScript validation (`tsc --noEmit`) and Vite production bundle (`vite build`).
