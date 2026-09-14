# Epic 15 — Applicant: Account, Privacy, Notification Preferences & GDPR Compliance

**Target Branch:** `epic/15-applicant-privacy-compliance`  
**Status:** Complete  
**Covers SRS Requirements:** FR-AP-28, FR-AP-29, FR-AP-30, FR-AP-10, FR-RC-11, UC-14  
**Design Skill Activated:** `recruitment-platform-frontend-design`  
**Dev Skill Activated:** `recruitment-platform-dev`

---

## 1. Overview & Business Objectives

Job seekers place immense trust in career platforms with their sensitive career history, contact details, and current employment situations. Maintaining privacy, adhering to strict data protection regulations (GDPR / CCPA / Data Portability), and giving candidates fine-grained governance over communication channels and employer visibility are non-negotiable requirements for modern recruitment ecosystems.

Epic 15 delivers an end-to-end **Account, Privacy & Compliance Hub** on the applicant side. Candidates can configure granular notification preferences across channels (email, in-app), exercise their GDPR rights (self-service single-click data portability exports and right-to-erasure account deletion requests), and block specific companies or current employers from discovering or viewing their profile in recruiter searches and talent pool databases.

### 1.1 Key User Value Propositions
- **Granular Communication Control (`FR-AP-28`)**: Candidates choose exactly which notifications to receive (application stage movements, interview scheduling, direct recruiter messages, followed company job drops) and through which channels (email vs in-app).
- **GDPR Rights & Data Portability (`FR-AP-29`, `UC-14`)**: Direct self-service data export generating a portable, machine-readable JSON archive of all candidate data; formal right-to-erasure deletion workflow with 30-day grace period or immediate compliance review.
- **Stealth Job Search & Company Blocking (`FR-AP-30`, `FR-AP-10`, `FR-RC-11`)**: Candidates can block their current employers or specific competing organizations by name or domain. Recruiters from blocked companies are strictly filtered out from discovering or viewing candidate profiles in candidate search, talent pools, and applicant suggestions.

---

## 2. Detailed Functional Breakdown

### 2.1 Notification Preference Center (`FR-AP-28`)
- **Dedicated Route**: `/applicant/settings?tab=notifications` (or `/applicant/notifications/preferences`).
- **Category Toggles**:
  - **Application Status Updates**: Notifications when application moves to Screening, Shortlisted, Interview, Offer, Rejected.
  - **Interview Invitations & Reminders**: New interview invites, schedule confirmations, reminder alerts (24h / 1h before).
  - **Recruiter Direct Messages**: New chat messages or thread updates from hiring teams.
  - **Followed Company Job Alerts (`FR-AP-35`)**: Real-time notifications when followed companies post new vacancies.
  - **Recommended Jobs & Match Alerts**: Weekly or instant alerts for vacancies with $\ge 80\%$ predicted ATS match score.
- **Channel Matrix**:
  - Independent toggles for **Email** and **In-App** per category.
  - Global "Mute all marketing & non-critical emails" switch.

### 2.2 Personal Data Portability & Right to Erasure (GDPR) (`FR-AP-29`, `UC-14`)
- **Self-Service Personal Data Export**:
  - Generates a comprehensive, downloadable `.json` archive containing:
    - User account credentials & authentication timestamps (excluding raw password hash).
    - Structured applicant profile (personal info, headline, bio, location).
    - Skills & proficiency levels.
    - Education history, GPA, and institutions.
    - Work experience, employment dates, responsibilities.
    - Achievements, certifications, and portfolio links.
    - Submitted job applications, statuses, and ATS match score records.
    - Uploaded and built CV versions metadata.
  - Direct download button with audit log entry (`GDPR_DATA_EXPORT`).
- **Account Deletion & Right to Erasure**:
  - Deletion request form requiring explicit password confirmation and reason/feedback.
  - Status tracking (`SUBMITTED` &rarr; `PROCESSING` &rarr; `COMPLETED`).
  - Anonymization / erasure of PII: wipes personal info, detaches applications into anonymized historical records to preserve company hiring statistics without violating candidate privacy.

### 2.3 Company Blocking & Employer Concealment (`FR-AP-30`, `FR-AP-10`, `FR-RC-11`)
- **Dedicated Route**: `/applicant/settings?tab=privacy`.
- **Searchable Company Selector**:
  - Typeahead autocomplete to find and block verified hiring organizations.
  - Instant addition to candidate's `blockedCompanyIds` list.
- **Active Blocklist Management**:
  - Table/cards displaying blocked company logo, name, industry, and blocked date.
  - One-click "Unblock" button with instant confirmation.
- **Enforcement Across Platform**:
  - **Talent Pool Search (`FR-RC-11`)**: Candidates who have blocked the querying recruiter's company are excluded from query results.
  - **Candidate Pipeline Visibility**: If candidate previously applied before blocking, internal notes remain accessible only within that specific requisition, but candidate is concealed from new recruiter searches.
  - **Direct Profile Access**: Direct link visits to `/applicant/profile/:id` by recruiters of blocked companies return `403 Forbidden` / `404 Not Found`.

---

## 3. Technical Architecture & Data Model

### 3.1 Database Schema Extensions (`backend/prisma/schema.prisma`)
```prisma
// -------------------------------------------------------------
// Notification Preferences (FR-AP-28)
// -------------------------------------------------------------
model UserNotificationPreference {
  id                      String   @id @default(uuid())
  userId                  String   @unique @map("user_id")
  applicationStatusEmail  Boolean  @default(true) @map("application_status_email")
  applicationStatusInApp  Boolean  @default(true) @map("application_status_in_app")
  interviewInvitesEmail   Boolean  @default(true) @map("interview_invites_email")
  interviewInvitesInApp   Boolean  @default(true) @map("interview_invites_in_app")
  messagesEmail           Boolean  @default(true) @map("messages_email")
  messagesInApp           Boolean  @default(true) @map("messages_in_app")
  followedCompanyJobEmail Boolean  @default(true) @map("followed_company_job_email")
  followedCompanyJobInApp Boolean  @default(true) @map("followed_company_job_in_app")
  jobAlertsEmail          Boolean  @default(false) @map("job_alerts_email")
  jobAlertsInApp          Boolean  @default(true) @map("job_alerts_in_app")
  createdAt               DateTime @default(now()) @map("created_at")
  updatedAt               DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_notification_preferences")
}

// -------------------------------------------------------------
// Blocked Companies (FR-AP-30)
// -------------------------------------------------------------
model CompanyBlock {
  id          String   @id @default(uuid())
  applicantId String   @map("applicant_id")
  companyId   String   @map("company_id")
  reason      String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at")

  applicant   User     @relation("ApplicantCompanyBlocks", fields: [applicantId], references: [id], onDelete: Cascade)
  company     Company  @relation("BlockedByApplicants", fields: [companyId], references: [id], onDelete: Cascade)

  @@unique([applicantId, companyId], name: "unique_applicant_company_block")
  @@index([applicantId])
  @@index([companyId])
  @@map("company_blocks")
}
```

### 3.2 API Surface (`/api/v1/applicant/privacy`)
- `GET /api/v1/applicant/preferences/notifications`: Retrieve current user notification preferences.
- `PUT /api/v1/applicant/preferences/notifications`: Update notification preferences.
- `GET /api/v1/applicant/compliance/export`: Download all personal candidate data as JSON.
- `POST /api/v1/applicant/compliance/erasure`: Submit right-to-erasure account deletion request.
- `GET /api/v1/applicant/blocked-companies`: List companies blocked by current candidate.
- `POST /api/v1/applicant/blocked-companies`: Block a company by ID.
- `DELETE /api/v1/applicant/blocked-companies/:companyId`: Unblock a company.

---

## 4. Implementation Roadmap

1. **Branch Setup**:
   - Create integration branch `epic/15-applicant-privacy-compliance` from `develop`.
2. **Database Schema & Migrations (`TASK-15-1`)**:
   - Add `UserNotificationPreference` and `CompanyBlock` models to `schema.prisma`.
   - Run `npm run db:push` and `npm run db:generate`.
3. **Shared Types & DTOs (`TASK-15-2`)**:
   - Define `NotificationPreferenceDto`, `UpdateNotificationPreferenceDto`, `BlockedCompanyDto`, `GdprExportDataDto`.
4. **Backend Privacy & Compliance Module (`TASK-15-3`)**:
   - Create `backend/src/modules/applicant-privacy/` (service, controller, routes, types).
   - Enforce company blocking filters in `talent-pool.service.ts` search queries.
5. **Frontend Settings & Privacy Hub (`TASK-15-4` to `TASK-15-7`)**:
   - Create `ApplicantSettingsPage.tsx` with tabs: "Notification Preferences", "Privacy & Blocked Companies", "Data & GDPR".
   - Components: `NotificationPreferencesForm.tsx`, `BlockedCompaniesManager.tsx`, `GdprDataExportCard.tsx`, `AccountDeletionModal.tsx`.
   - Update navigation in `Header.tsx` and user dropdown.
6. **Automated Testing & Verification (`TASK-15-8`)**:
   - Backend vitest tests: `applicant-privacy.test.ts`.
   - Frontend unit tests: `ApplicantPrivacyFlow.test.tsx`.
   - Zero typecheck errors across all workspaces.
