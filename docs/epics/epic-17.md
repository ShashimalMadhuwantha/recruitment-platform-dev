# Epic 17 — Recruiter: Company, Team & Subscription Plan Seat Management

**Target Branch:** `epic/17-company-team-management`  
**Status:** Planned / Ready for Implementation  
**Covers SRS Requirements:** FR-RC-01, FR-RC-02, FR-RC-03, FR-SA-03  
**Design Skill Activated:** `recruitment-platform-frontend-design`  
**Dev Skill Activated:** `recruitment-platform-dev`

---

## 1. Overview & Business Objectives

Modern recruitment operations are collaborative team efforts requiring strict role partitioning, tenant employer branding, and strict adherence to enterprise SaaS subscription tiers. Epic 17 delivers a complete multi-tenant governance module for employer companies, empowering hiring teams to manage their brand identity, invite and govern recruiters, assign granular permission matrices, and enforce hard seat quotas tied directly to the company's active subscription tier.

### 1.1 Company Profile & Employer Branding (FR-RC-01)
- Let company administrators manage comprehensive employer branding to attract top talent:
  - Corporate logo, banner/cover photo, company name, industry, company size, founded year, and headquarters location.
  - Multi-office locations directory (`locationsJson`: city, state, country, address, isHq).
  - Rich employer story: mission, company culture description, and media galleries (`cultureMediaJson`: workplace photos, office tour videos, leadership links).
  - Social media and web links (`socialLinksJson`: LinkedIn, Twitter/X, GitHub, Glassdoor, Website).
  - Public company profile page preview seen by job seekers when browsing job vacancies.

### 1.2 Team Member Invitation & Onboarding Workflow (FR-RC-02)
- Provide Company Admins with a secure invitation engine:
  - Invite recruiters and hiring team members via corporate email.
  - Pre-assign recruiter sub-roles (`COMPANY_ADMIN`, `HIRING_MANAGER`, `INTERVIEWER`) and optional permission overrides during invitation.
  - Issue cryptographically secure, time-limited invitation tokens (valid for 7 days, salted SHA-256 hash stored in database).
  - Automated invitation email delivery with one-click onboarding link.
  - Full invitation lifecycle: resend pending invitations, view expiration dates, and revoke unwanted invitations (which immediately restores reserved seats).
  - Seamless onboarding flow: handles both new user registration (account creation + recruiter profile) and existing platform user role linking.

### 1.3 Recruiter Sub-Role & Granular Permissions Matrix (FR-RC-02)
- Implement structured sub-roles within tenant organizations:
  - **Company Admin**: Full administrative control over company settings, branding, billing/plan quotas, team invitations, role assignments, job postings, candidate pipelines, and analytics.
  - **Hiring Manager**: Lead hiring decisions for assigned requisitions; create and edit job postings, review applications, conduct screenings, advance pipeline stages, schedule interviews, and extend offers.
  - **Interviewer**: Focused candidate evaluation role; access assigned candidate profiles, participate in interview panels, submit structured scorecard feedback, and leave internal evaluation notes (strictly restricted from seeing sensitive candidate salary or publishing jobs).
- Granular permission overrides stored in `RecruiterProfile.permissions` (JSON):
  - `canCreateJobs`: Ability to draft and publish job openings.
  - `canEditJobs`: Ability to modify live requisition requirements or ATS weights.
  - `canDeleteJobs`: Ability to close or archive job postings.
  - `canViewCandidateSalary`: Control over viewing candidate expected salary and compensation packages.
  - `canAdvancePipeline`: Ability to transition candidates between pipeline stages.
  - `canScheduleInterviews`: Ability to schedule interviews and dispatch calendar links.
  - `canSubmitScorecards`: Ability to submit structured interview feedback.
  - `canExtendOffers`: Ability to generate and issue formal job offers.
  - `canManageTeam`: Ability to invite, edit, or remove team members.
  - `canViewAnalytics`: Access to company hiring metrics and reporting dashboards.
  - `canManageCompanyProfile`: Update company branding, media, and location directory.

---

## 2. Subscription Plan Tiers, Quota Limits & Feature Entitlements

The platform architecture enforces subscription plan limits across three official tiers (`FREE`, `PRO`, `ENTERPRISE`), configured in the database (`SubscriptionPlan` model) and seeded in `backend/prisma/seed.ts`:

### 2.1 Concrete Subscription Plan Quota Matrix

| Specification | Free Starter (`FREE`) | Pro Recruiter (`PRO`) | Enterprise ATS (`ENTERPRISE`) |
|---|:---:|:---:|:---:|
| **Monthly Price** | **$0.00 / mo** | **$99.00 / mo** | **$399.00 / mo** |
| **Max Recruiter Seats (`maxSeats`)** | **2 Seats** | **10 Seats** | **100 Seats** (or Unlimited $\ge 9999$) |
| **Max Active Job Postings (`maxJobPosts`)** | **3 Jobs** | **20 Jobs** | **9,999 (Unlimited)** |
| **Max Monthly ATS Scans (`maxAtsScans`)** | **50 Scans / mo** | **500 Scans / mo** | **99,999 (Unlimited) / mo** |
| **Target Organization Size** | Early-stage startups / Solo recruiters | Growing teams & agencies | Mid-market & Enterprise orgs |

### 2.2 Plan Feature Entitlements (`featuresJson` & System Feature Flags)

| Feature / Capability | Key | `FREE` | `PRO` | `ENTERPRISE` |
|---|---|:---:|:---:|:---:|
| **Custom Screening Questions** | `featuresJson.customScreeningQuestions` | ❌ Disabled | ✅ Enabled | ✅ Enabled |
| **Per-Job ATS Weight Overrides** | `featuresJson.advancedAtsWeightOverride` | ❌ Disabled | ✅ Enabled | ✅ Enabled |
| **Analytics CSV/JSON Data Export** | `featuresJson.analyticsExport` | ❌ Disabled | ✅ Enabled | ✅ Enabled |
| **AI-Powered ATS Match Scoring** | `featureFlags.ai_ats_scoring` | ❌ (Standard) | ✅ Enabled | ✅ Enabled |
| **Direct Candidate Messaging** | `featureFlags.direct_candidate_messaging` | ✅ Enabled | ✅ Enabled | ✅ Enabled |
| **Custom Branded Domain / Portal** | `featureFlags.multi_tenant_custom_domain` | ❌ Disabled | ❌ Disabled | ✅ Enabled |
| **Semantic CV Talent Pool Search** | `featureFlags.semantic_cv_search` | ❌ Disabled | ❌ Disabled | ✅ Enabled |
| **Dedicated Account Manager & SLA** | `featuresJson.dedicatedAccountManager` | ❌ Disabled | ❌ Disabled | ✅ Enabled |
| **Custom API Webhooks & Integrations** | `featuresJson.customIntegrations` | ❌ Disabled | ❌ Disabled | ✅ Enabled |

### 2.3 Quota Enforcement Mechanics (FR-RC-03, FR-SA-03)

1. **Recruiter Team Seat Quota Formula**:
   $$\text{Occupied Seats} = N_{\text{Active Recruiter Profiles}} + N_{\text{Pending Invitations}}$$
   - **Hard Check**: When inviting a new team member, the backend computes:
     $$\text{Is Allowed} = (\text{Plan.maxSeats} \ge 9999) \lor (\text{Occupied Seats} < \text{Plan.maxSeats})$$
   - If $\text{Occupied Seats} \ge \text{Plan.maxSeats}$, the API immediately throws `403 Forbidden` with error code `SEAT_QUOTA_EXCEEDED` and returns current quota usage and upgrade instructions.
   - **Immediate Seat Release**: When an invitation is revoked, expires, or a team member is deleted/deactivated, the occupied seat license is instantly returned to the company's available pool.

2. **Active Job Vacancies Quota**:
   - As implemented in `job-vacancy.service.ts` (`checkCompanyJobQuota`):
     $$\text{Published Jobs} < \text{Plan.maxJobPosts}$$
   - Attempting to publish beyond `maxJobPosts` throws `400 Bad Request` prompting tier upgrade.

3. **Monthly ATS Scans Quota**:
   - Monthly ATS scoring executions are tracked and verified against `plan.maxAtsScans` before kicking off semantic scoring pipelines.

4. **Plan Upgrade Request Workflow**:
   - When seat utilization reaches $\ge 80\%$ or reaches capacity ($100\%$), UI displays contextual upgrade callouts:
     *"Seat limit reached (10/10 seats on Pro Recruiter). Upgrade to Enterprise for up to 100 seats."*
   - Recruiter can submit a one-click "Request Plan Upgrade" request, triggering an in-app and email notification to the Super Admin platform team.

---

## 3. Tasks & Feature Branch Breakdown

| Task ID | Task Name | Purpose & Scope | Target Branch |
|---|---|---|---|
| **TASK-17-1** | Database Schema & Invitations Model | Add `TeamInvitation` model, extend `Company` with `coverPhotoUrl`, `locationsJson`, `cultureMediaJson`, `socialLinksJson`, and define the `RecruiterPermissions` schema. | `feature/17-schema-invitations-model` |
| **TASK-17-2** | Company Profile & Employer Branding Setup (FR-RC-01) | Implement company profile management endpoints, logo and cover uploads, rich text bio, multi-location directory, culture media, and public brand preview. | `feature/17-company-profile-branding` |
| **TASK-17-3** | Team Member Invitation & Onboarding Workflow (FR-RC-02) | Implement invite creation, secure token generation, email notification sending, invite acceptance page, and account linking. | `feature/17-team-invitations` |
| **TASK-17-4** | Recruiter Sub-Role & Permissions Matrix (FR-RC-02) | Implement role management API, sub-role default permissions, custom permission overrides, and backend RBAC authorization middleware. | `feature/17-subrole-permissions` |
| **TASK-17-5** | Subscription Plan Seat Quota & Usage Enforcement (FR-RC-03, FR-SA-03) | Build plan usage aggregation service, atomic seat reservation check, hard quota enforcement on invites, feature gate middleware, and plan upgrade notifications. | `feature/17-plan-seat-quota-enforcement` |
| **TASK-17-6** | Team Offboarding, Requisition Transfer & Seat Release (FR-RC-02) | Build member removal workflow, requisition reassignment logic, seat release, and audit trail generation. | `feature/17-team-offboarding-seat-release` |
| **TASK-17-7** | Frontend Recruiter Team & Plan Workspace UI | Build `/recruiter/team` page: Plan & Seat Usage Progress Card, Member Table, Pending Invitations, Invite Modal with seat preview, Role & Permission Drawer, and Reassign Modal. | `feature/17-team-workspace-ui` |
| **TASK-17-8** | Automated Verification & Unit Tests | Comprehensive test suite covering seat quota limits across all 3 tiers (`FREE`, `PRO`, `ENTERPRISE`), invitation token validation, permission guards, and UI rendering flows. | `feature/17-verification-tests` |

---

## 4. Architecture & Data Models

### 4.1 Database Schema Extensions (`backend/prisma/schema.prisma`)

```prisma
// 1. Team Invitation Status Enum
enum TeamInvitationStatus {
  PENDING
  ACCEPTED
  REVOKED
  EXPIRED
}

// 2. Team Invitation Model
model TeamInvitation {
  id          String               @id @default(uuid())
  companyId   String               @map("company_id")
  email       String
  subRole     RecruiterSubRole     @default(HIRING_MANAGER) @map("sub_role")
  permissions Json?
  tokenHash   String               @unique @map("token_hash")
  status      TeamInvitationStatus @default(PENDING)
  invitedById String               @map("invited_by_id")
  expiresAt   DateTime             @map("expires_at")
  acceptedAt  DateTime?            @map("accepted_at")
  createdAt   DateTime             @default(now()) @map("created_at")
  updatedAt   DateTime             @updatedAt @map("updated_at")

  company   Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  invitedBy User    @relation("SentTeamInvitations", fields: [invitedById], references: [id], onDelete: Cascade)

  @@index([companyId, status])
  @@index([email])
  @@map("team_invitations")
}

// 3. Company Model Extensions
model Company {
  // ... existing fields (id, name, slug, industry, size, logoUrl, website, description, planId, status)
  coverPhotoUrl    String?  @map("cover_photo_url")
  locationsJson    Json?    @map("locations_json")    // [{ city, state, country, address, isHq: boolean }]
  cultureMediaJson Json?    @map("culture_media_json") // [{ type: "IMAGE" | "VIDEO", url, caption }]
  socialLinksJson  Json?    @map("social_links_json")  // { linkedin, twitter, github, glassdoor, website }
  
  // Relations
  teamInvitations  TeamInvitation[]
  // ... existing relations
}
```

### 4.2 Sub-Role Default Permissions Matrix

| Permission Key | Description | `COMPANY_ADMIN` | `HIRING_MANAGER` | `INTERVIEWER` |
|---|---|:---:|:---:|:---:|
| `canCreateJobs` | Draft and publish new job vacancies | Yes | Yes | No |
| `canEditJobs` | Edit requirements, salary, and ATS weights | Yes | Yes (Own Jobs) | No |
| `canDeleteJobs` | Close or archive job postings | Yes | Yes (Own Jobs) | No |
| `canViewCandidateSalary` | View candidate expected salary & offer details | Yes | Yes | No |
| `canAdvancePipeline` | Transition candidates across pipeline stages | Yes | Yes | No |
| `canScheduleInterviews` | Schedule interviews and send calendar invites | Yes | Yes | Yes |
| `canSubmitScorecards` | Submit structured evaluation feedback | Yes | Yes | Yes |
| `canExtendOffers` | Generate and issue candidate offer letters | Yes | Yes | No |
| `canManageTeam` | Invite, configure, and remove team members | Yes | No | No |
| `canViewAnalytics` | Access company hiring dashboard and reports | Yes | Yes | No |
| `canManageCompanyProfile` | Update company branding, locations, and media | Yes | No | No |

---

## 5. API Endpoint Specifications

All endpoints require standard Bearer token authentication (`authenticateToken`) and company tenant scoping (`requireRecruiter`).

### 5.1 Company Profile & Branding
- `GET /api/v1/company/profile`  
  *Returns*: Full company profile including branding, locations, culture media, and social links.
- `PATCH /api/v1/company/profile`  
  *Guarded by*: `requireCompanyAdmin`  
  *Payload*: `{ name, industry, size, website, description, logoUrl, coverPhotoUrl, locations, cultureMedia, socialLinks }`  
  *Returns*: Updated company profile.

### 5.2 Subscription Plan & Resource Usage Dashboard
- `GET /api/v1/company/plan-usage`  
  *Returns*: Real-time quota metrics strictly aligned with the company's active plan:
  ```json
  {
    "plan": {
      "id": "c1f7b920-8e12-4321-9a76-bc341098ef01",
      "name": "Pro Recruiter",
      "tier": "PRO",
      "priceMonthly": 99.00,
      "maxSeats": 10,
      "maxJobPosts": 20,
      "maxAtsScans": 500,
      "features": {
        "customScreeningQuestions": true,
        "advancedAtsWeightOverride": true,
        "analyticsExport": true,
        "dedicatedAccountManager": false,
        "customIntegrations": false
      }
    },
    "usage": {
      "seats": {
        "activeRecruiters": 6,
        "pendingInvites": 2,
        "occupiedSeats": 8,
        "maxSeats": 10,
        "remainingSeats": 2,
        "percentUsed": 80,
        "isAtCapacity": false
      },
      "jobPosts": {
        "activeJobs": 14,
        "maxJobPosts": 20,
        "remainingJobs": 6,
        "percentUsed": 70,
        "isAtCapacity": false
      },
      "atsScans": {
        "scansUsed": 142,
        "maxAtsScans": 500,
        "remainingScans": 358,
        "percentUsed": 28.4
      }
    }
  }
  ```

- `POST /api/v1/company/request-upgrade`  
  *Guarded by*: `requireCompanyAdmin`  
  *Payload*: `{ requestedTier: "PRO" | "ENTERPRISE", note?: string }`  
  *Returns*: Confirmation message and dispatches notification to Super Admin platform team.

### 5.3 Team Member & Invitation Management
- `GET /api/v1/team`  
  *Returns*: List of active recruiters (with user name, email, subRole, department, title, permissions) and active pending invitations.
- `POST /api/v1/team/invite`  
  *Guarded by*: `requireCompanyAdmin`  
  *Payload*: `{ email: string, subRole: RecruiterSubRole, department?: string, title?: string, permissions?: Partial<RecruiterPermissions> }`  
  *Logic*: Checks `occupiedSeats < plan.maxSeats`. If exceeded, returns `403 FORBIDDEN` with code `SEAT_QUOTA_EXCEEDED`. Otherwise generates token, creates `TeamInvitation`, and sends invitation email.
- `DELETE /api/v1/team/invite/:id`  
  *Guarded by*: `requireCompanyAdmin`  
  *Logic*: Marks invitation as `REVOKED`, releasing the reserved seat license immediately.
- `POST /api/v1/team/invite/:id/resend`  
  *Guarded by*: `requireCompanyAdmin`  
  *Logic*: Extends expiration by 7 days and resends invitation email.
- `GET /api/v1/team/invite/verify?token=...`  
  *Public*: Validates invitation token, returning company name, invited email, and assigned subRole.
- `POST /api/v1/team/accept-invite`  
  *Public or Authenticated*: Verifies token, creates or links `RecruiterProfile`, sets status to `ACCEPTED`, and logs audit entry.
- `PATCH /api/v1/team/members/:id`  
  *Guarded by*: `requireCompanyAdmin`  
  *Payload*: `{ subRole?: RecruiterSubRole, department?: string, title?: string, permissions?: Partial<RecruiterPermissions> }`
- `DELETE /api/v1/team/members/:id`  
  *Guarded by*: `requireCompanyAdmin`  
  *Payload*: `{ transferRequisitionsToUserId?: string }`  
  *Logic*: Prevents self-deletion if the user is the sole Company Admin. Reassigns active job postings if specified, deactivates/removes profile, and frees the seat license.

---

## 6. UI/UX Design System Compliance

Following `recruitment-platform-frontend-design` standards:
1. **Plan & Resource Utilization Header**:
   - Interactive KPI cards for **Seats (Used / Max)**, **Active Jobs (Used / Max)**, and **ATS Scans (Used / Max)**.
   - Dynamic progress bar with color thresholds:
     - Indigo/Primary: `< 75%`
     - Amber/Warning: `75% - 99%`
     - Crimson/Danger: `100% capacity reached`
   - Tier Badges: `FREE` (Neutral/Gray), `PRO` (Primary/Indigo), `ENTERPRISE` (Success/Emerald).
   - "Upgrade Plan" quick-action button if approaching or at capacity.
2. **Team Member Management Table**:
   - Avatar with user initials, full name, email, department, sub-role badge (`Company Admin` in Purple, `Hiring Manager` in Blue, `Interviewer` in Slate).
   - "Custom Permissions" indicator badge if permissions differ from role defaults.
   - Action menu: Edit Role & Permissions, Reassign Jobs, Deactivate Member.
3. **Invite Modal & Quota Awareness**:
   - Clear banner in modal: *"2 of 10 seats available on your Pro Recruiter plan"*.
   - If quota is full, invite button is replaced with *"Seat Limit Reached — Upgrade Plan"*.
4. **Permissions Drawer**:
   - Accessible toggle switches grouped by category:
     - Requisition & Job Management
     - Candidate Pipeline & Scoring
     - Interviewing & Feedback
     - Administrative & Billing

---

## 7. Verification & Definition of Done

1. **Subscription Quota Enforcement Across Tiers**:
   - **Free Starter (2 seats, 3 jobs, 50 scans)**:
     - Successfully invite 1 member (2 seats total).
     - Attempting to invite a 3rd member throws `403 FORBIDDEN (SEAT_QUOTA_EXCEEDED)`.
     - Revoking the pending invitation immediately permits sending a new invitation.
   - **Pro Recruiter (10 seats, 20 jobs, 500 scans)**:
     - Verify up to 10 total seats (active + pending).
     - Verify feature gate permits custom screening questions and analytics export.
   - **Enterprise ATS (100 seats / 9999, unlimited jobs/scans)**:
     - Verify large team invitations with bypass of standard small-quota restrictions.
2. **Token Security**:
   - Expired tokens (> 7 days) and revoked tokens return `400 Bad Request`.
   - Token hashes are salted SHA-256 and never stored in plain text.
3. **Sub-Role Access Control**:
   - Interviewers attempting to create or publish a job vacancy receive `403 Forbidden`.
   - Interviewers cannot view applicant expected salary or compensation packages.
4. **Requisition Reassignment**:
   - Deleting a team member properly transfers all `jobVacanciesCreated` to the selected target recruiter with audit trail logging.
