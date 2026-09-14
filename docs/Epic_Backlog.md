# Epic Backlog — Recruitment & ATS Platform

**Based on:** Recruitment_Platform_SRS.md (v1.0)
**Stack:** React + TypeScript (Vite) · Express.js (Node.js + TypeScript) · MySQL · PM2/Nginx

## Branch naming convention
- Integration branch per epic: `epic/<epic-number>-<epic-slug>` (branched from `develop`)
- Task branch: `feature/<epic-number>-<task-slug>` (branched from the epic branch, merged back via PR)
- Example: Epic 6 "Job Vacancy Management", task "Create job post form" → `feature/06-create-job-post-form`

---

## Epic 0 — Project Setup & Infrastructure
**Goal:** Stand up the base repo, database, and deployment pipeline so every later epic has something to build on.

| Task | Purpose | Branch |
|---|---|---|
| Initialize monorepo structure | Set up `/frontend` (Vite + React + TS) and `/backend` (Express + TS) as a single repo with shared linting/formatting (ESLint, Prettier) so both sides follow the same code standards from day one. | `feature/00-monorepo-init` |
| Set up MySQL schema & migrations | Create the initial database and a migration tool (e.g., `knex`/`prisma migrate`) so schema changes are version-controlled and repeatable across environments, based on §6 of the SRS. | `feature/00-db-migrations-setup` |
| Configure Express app skeleton | Build the modular monolith folder structure (auth, applicant, job, application, ats-scoring, notifications, admin modules) matching §2.2/§2.3 so features are added into a consistent structure. | `feature/00-express-skeleton` |
| Set up environment config & secrets handling | Add `.env` handling for DB credentials, JWT secret, mail settings, etc., with separate configs for dev/staging/production. | `feature/00-env-config` |
| Set up PM2 + Nginx deployment scripts | Write the PM2 process file and Nginx reverse-proxy config so the app can be deployed to a single VPS without Docker, per §2.3. | `feature/00-deploy-pm2-nginx` |
| Set up CI pipeline (GitHub Actions) | Automate lint/test/build on every push, and a deploy step (SSH/rsync + `pm2 reload`) for merges to `main`. | `feature/00-ci-pipeline` |

---

## Epic 1 — Authentication & Access Control
**Goal:** Give every role a secure way to sign in and be restricted to what they're allowed to do. Covers the foundation used by all three roles.

| Task | Purpose | Branch |
|---|---|---|
| Email/password registration & login | Core sign-up/sign-in flow with hashed passwords (bcrypt) and JWT issuance, the base login method for all roles. | `feature/01-email-auth` |
| Google OAuth login | Let applicants and recruiters sign in with Google, reducing signup friction (FR-AP-01). | `feature/01-google-oauth` |
| LinkedIn OAuth login | Let applicants sign in with LinkedIn, which also opens the door to profile-import later (FR-AP-01). | `feature/01-linkedin-oauth` |
| JWT middleware & refresh tokens | Protect API routes with token verification and support silent token refresh so users aren't logged out unexpectedly. | `feature/01-jwt-middleware` |
| Role-based access control (RBAC) middleware | Restrict each API route to the roles/permissions allowed to call it (Super Admin, Recruiter sub-roles, Applicant), the backbone of every other epic's security. | `feature/01-rbac-middleware` |
| Password reset & MFA (recruiter/admin) | Let users recover access safely, and let admins/recruiters optionally enable multi-factor authentication (NFR-02). | `feature/01-password-reset-mfa` |

---

## Epic 2 — Super Admin: Platform & User Management
**Goal:** Give the Super Admin control over every company and every user on the platform (FR-SA-01 to FR-SA-08).

| Task | Purpose | Branch |
|---|---|---|
| Company/tenant CRUD & approval workflow | Let the admin create, approve, reject, suspend, or delete recruiter/company accounts, controlling who gets to use the platform. | `feature/02-company-approval-workflow` |
| Subscription plan assignment | Let the admin assign a plan (Free/Pro/Enterprise) to each company with its own usage limits (job posts, seats, ATS scans). | `feature/02-plan-assignment` |
| Admin impersonation with audit logging | Let the admin log in as any tenant for support purposes, with every impersonation session recorded for accountability. | `feature/02-admin-impersonation` |
| Global user directory (search/filter) | Give the admin one place to view, search, and filter every user (applicant or recruiter) on the platform. | `feature/02-global-user-directory` |
| Suspend/ban/reinstate user accounts | Let the admin enforce platform policy by disabling or restoring any account. | `feature/02-user-suspension` |
| RBAC editor for staff roles | Let the admin define and adjust what each internal role/staff member can do, instead of hard-coded permissions. | `feature/02-rbac-editor` |

---

## Epic 3 — Super Admin: Moderation & Compliance
**Goal:** Keep the platform's content safe, fair, and compliant with data-protection law (FR-SA-09 to FR-SA-13).

| Task | Purpose | Branch |
|---|---|---|
| Flagged job posting review queue | Let the admin review job posts flagged for spam, discrimination, or fraud, and approve/edit/reject them before they stay live. | `feature/03-job-moderation-queue` |
| Reported profile/CV review queue | Let the admin investigate profiles or CVs reported for fake content or abuse. | `feature/03-profile-report-queue` |
| Banned-keyword filter for job posts | Automatically block discriminatory or unfair language in job postings at creation time, reducing manual moderation load. | `feature/03-keyword-filter` |
| Immutable audit log system | Record every admin action platform-wide (who did what, when) so the platform can be audited and disputes investigated. | `feature/03-audit-log-system` |
| GDPR data export/delete request handler | Let users request their data or deletion, and give the admin a queue to fulfil these requests within an SLA. | `feature/03-gdpr-request-handler` |

---

## Epic 4 — Super Admin: System Configuration
**Goal:** Give the admin the controls needed to configure shared platform behavior without a code deploy (FR-SA-14 to FR-SA-18).

| Task | Purpose | Branch |
|---|---|---|
| Global ATS weight configuration | Let the admin set the default weighting (skills/experience/education/semantic/certifications) used by the ATS engine platform-wide. | `feature/04-global-ats-weights` |
| Master data management (skills, industries, locations) | Give the admin a UI to manage the shared taxonomy lists that power search, filters, and skill autosuggest everywhere else in the app. | `feature/04-master-data-mgmt` |
| Notification template editor | Let the admin edit the email/SMS templates the system sends automatically, without needing a developer for copy changes. | `feature/04-notification-templates` |
| Third-party integration settings | Let the admin manage connections to calendar/video-call providers and other integrations from one settings screen. | `feature/04-integration-settings` |
| Feature flag management | Let the admin turn specific features on/off per company plan tier, enabling gradual rollout and plan differentiation. | `feature/04-feature-flags` |

---

## Epic 5 — Super Admin: Analytics & Billing
**Goal:** Give the admin visibility into platform health and revenue (FR-SA-19 to FR-SA-23).

| Task | Purpose | Branch |
|---|---|---|
| Platform KPI dashboard | Show the admin key numbers at a glance — users, active jobs, applications/day, average ATS scores, churn — so platform health is visible in one place. | `feature/05-platform-kpi-dashboard` |
| Exportable compliance/usage reports | Let the admin download CSV/PDF reports for finance and compliance audits. | `feature/05-exportable-reports` |
| Fraud/anomaly detection alerts | Flag suspicious activity like bot applications or duplicate accounts so the admin can act before it affects the platform. | `feature/05-fraud-alerts` |
| Billing & subscription management | Let the admin manage pricing plans, invoices, failed payments, and refunds if the platform is monetized. | `feature/05-billing-management` |
| Revenue analytics by plan/tenant | Show the admin how much revenue each plan or company generates, supporting business decisions. | `feature/05-revenue-analytics` |

---

## Epic 6 — Recruiter: Company & Job Vacancy Management
**Goal:** Let recruiters represent their company and post structured, ATS-ready job vacancies (FR-RC-01 to FR-RC-09).

| Task | Purpose | Branch |
|---|---|---|
| Company profile setup | Let a recruiter build their company's public profile (logo, description, industry, locations) so applicants know who they're applying to. | `feature/06-company-profile-setup` |
| Team invitations & role permissions | Let a Company Admin invite Hiring Managers/Interviewers and control what each can do within the company account. | `feature/06-team-invitations` |
| Plan usage dashboard for recruiters | Show the recruiter how much of their subscription quota (job posts, ATS scans, seats) they've used. | `feature/06-plan-usage-dashboard` |
| Job posting creation form | The core form for creating a job with title, location, salary, required skills (mapped to taxonomy), experience, education, and deadline — the primary input to the ATS engine. | `feature/06-job-post-form` |
| Draft/template/duplicate job posts | Let recruiters save time by saving drafts, reusing templates, or duplicating past postings. | `feature/06-job-templates` |
| Per-job ATS weight override | Let a recruiter adjust how much each ATS sub-score matters for a specific job, within admin-set bounds. | `feature/06-job-ats-weight-override` |
| Publish/unpublish/archive job lifecycle | Manage the visible state of a job post through its lifecycle. | `feature/06-job-lifecycle-states` |
| Custom application screening questions | Let recruiters add extra questions or knockout questions to the application form for a specific job. | `feature/06-screening-questions` |

---

## Epic 7 — ATS Scoring Engine
**Goal:** Build the platform's core differentiator — an automatic, explainable match score between an applicant and a job (§4 of the SRS). This is the highest-priority technical epic.

| Task | Purpose | Branch |
|---|---|---|
| Skills match sub-score (SQL) | Compute the weighted overlap between an applicant's tagged skills and a job's required skills, including proficiency checks — the heaviest-weighted sub-score. | `feature/07-ats-skills-score` |
| Experience match sub-score (SQL) | Compare total relevant work experience against the job's required range, with a title-relevance factor. | `feature/07-ats-experience-score` |
| Education match sub-score (SQL) | Compare the applicant's degree level and field of study against the job's education requirement. | `feature/07-ats-education-score` |
| TF-IDF semantic match sub-score | Convert CV text and JD text into TF-IDF vectors and compute cosine similarity using the `natural` package — the ML component that catches relevant phrasing beyond exact keywords. | `feature/07-ats-tfidf-score` |
| Certifications match sub-score | Check for required or relevant certifications against the applicant's certification list. | `feature/07-ats-certification-score` |
| Weighted score aggregation engine | Combine all sub-scores using the configured weights (global default or per-job override) into the final overall score. | `feature/07-ats-weight-aggregation` |
| Score breakdown & explainability output | Generate the human-readable breakdown (matched/missing skills, top TF-IDF terms) shown to both recruiters and applicants. | `feature/07-ats-explainability` |
| Async scoring on application submit | Trigger scoring right after an application is submitted without blocking the response, per the async pattern in §2.2. | `feature/07-ats-async-trigger` |
| On-demand pre-apply scoring | Let an applicant check their match score against a job before applying (FR-AP-18). | `feature/07-ats-preapply-check` |
| Batch re-scoring on job/profile edits | Recompute affected scores when a recruiter edits job requirements or an applicant updates their profile (FR-ATS-08). | `feature/07-ats-batch-rescoring` |
| Recruiter score override with audit note | Let a recruiter manually adjust a candidate's score with a mandatory reason, for cases where the automatic score misses context. | `feature/07-ats-score-override` |
| Bias-safeguard field exclusion | Ensure protected-class signals (age, gender, marital status, photo) never influence the score, satisfying FR-ATS-09. | `feature/07-ats-bias-exclusion` |

---

## Epic 8 — Applicant: Profile Management
**Goal:** Let applicants build a complete, structured profile that both powers the ATS engine and represents them to recruiters (FR-AP-01 to FR-AP-11).

| Task | Purpose | Branch |
|---|---|---|
| Profile basics (personal info, summary, photo) | The foundational profile fields every applicant fills in first. | `feature/08-profile-basics` |
| Skills manager with taxonomy autosuggest | Let applicants add skills from the standardized taxonomy and self-rate proficiency — this directly feeds the ATS skills sub-score. | `feature/08-skills-manager` |
| Education history manager | Let applicants add institutions, degrees, and dates — feeds the ATS education sub-score. | `feature/08-education-manager` |
| Work experience manager | Let applicants add past roles, responsibilities, and technologies used — feeds the ATS experience sub-score. | `feature/08-work-experience-manager` |
| Achievements & awards manager | Let applicants showcase awards, publications, and volunteer work that make their profile stand out. | `feature/08-achievements-manager` |
| Certifications & licenses manager | Let applicants add certificates with issuer/expiry info — feeds the ATS certification sub-score. | `feature/08-certifications-manager` |
| Portfolio links & work samples | Let applicants attach GitHub/Behance/personal site links or upload work samples. | `feature/08-portfolio-manager` |
| Languages known | Let applicants list languages and proficiency levels. | `feature/08-languages-manager` |
| Profile visibility/privacy settings | Let applicants control who can see their profile (public, private, hidden from specific companies). | `feature/08-profile-privacy-settings` |
| Profile completeness meter | Show applicants how complete their profile is, nudging them toward the full data that makes ATS scoring more accurate. | `feature/08-profile-completeness-meter` |

---

## Epic 9 — Applicant: CV / Resume Management
**Goal:** Let applicants get a CV into the system quickly and manage multiple versions for different job types (FR-AP-12 to FR-AP-15).

| Task | Purpose | Branch |
|---|---|---|
| CV upload with PDF/DOCX parsing | Let applicants upload an existing CV and have the system auto-extract text and pre-fill profile fields, removing manual data entry. | `feature/09-cv-upload-parsing` |
| CV builder from profile data | Let applicants generate a polished CV from their structured profile using selectable templates, exported as PDF. | `feature/09-cv-builder` |
| Multiple CV versions | Let applicants keep several tailored CVs (e.g., "Frontend CV") and choose which to attach per application. | `feature/09-multi-cv-versions` |
| CV version history & restore | Let applicants view and roll back to earlier CV versions if needed. | `feature/09-cv-version-history` |

---

## Epic 10 — Job Search & Application Flow
**Goal:** Let applicants find relevant jobs and apply efficiently (FR-AP-16 to FR-AP-21).

| Task | Purpose | Branch |
|---|---|---|
| Job search with filters | Let applicants search/filter jobs by title, location, salary, industry, and more, using MySQL full-text search. | `feature/10-job-search-filters` |
| Saved jobs & search alerts | Let applicants bookmark jobs and get notified when new matching jobs are posted. | `feature/10-saved-jobs-alerts` |
| Apply flow with CV/profile selection | The core "apply" action — select a CV version, answer any screening questions, and submit. | `feature/10-apply-flow` |
| Application withdrawal | Let applicants pull back an application they no longer want considered. | `feature/10-application-withdrawal` |
| Applicant application-status dashboard | Give applicants one place to track every application's status (Applied, Under Review, Shortlisted, Interview, Offer, Rejected). | `feature/10-application-status-dashboard` |

---

## Epic 11 — Recruiter: Candidate Pipeline & Sourcing
**Goal:** Let recruiters efficiently screen and move applicants through the hiring process using the ATS score (FR-RC-10 to FR-RC-16).

| Task | Purpose | Branch |
|---|---|---|
| Applicant list with ATS score sorting | Let recruiters see and sort all applicants for a job by match score, date, skills, or experience — the main screening view. | `feature/11-applicant-list-sorting` |
| Talent pool search | Let recruiters search the whole applicant database directly, not just people who applied, respecting applicant privacy settings. | `feature/11-talent-pool-search` |
| Kanban pipeline board | Let recruiters drag candidates through hiring stages (Applied → Screening → Shortlisted → Interview → Offer → Hired → Rejected). | `feature/11-kanban-pipeline` |
| ATS score breakdown view | Show recruiters the full explainable score breakdown per candidate, built on Epic 7's output. | `feature/11-score-breakdown-view` |
| Bulk candidate actions | Let recruiters shortlist, reject, tag, or message several candidates at once to save time on high-volume roles. | `feature/11-bulk-candidate-actions` |
| Private notes & star ratings | Let hiring teams leave internal notes and ratings on candidates, visible only to their own team. | `feature/11-notes-and-ratings` |
| Candidate comparison view | Let recruiters compare several shortlisted candidates side by side on skills, score, and experience. | `feature/11-candidate-comparison` |

---

## Epic 12 — Communication, Scheduling & Notifications
**Goal:** Keep recruiters and applicants connected throughout the hiring process (FR-RC-17 to FR-RC-20, FR-AP-25 to FR-AP-27).

| Task | Purpose | Branch |
|---|---|---|
| In-app messaging system | Let recruiters and applicants message each other directly within the platform, per application. | `feature/12-messaging-system` |
| Email notification sync | Mirror key in-app events (messages, status changes) to email so users don't have to check the app constantly. | `feature/12-email-notifications` |
| Interview scheduling with calendar integration | Let recruiters schedule interviews and sync them to Google/Outlook calendars. | `feature/12-interview-scheduling` |
| Auto-generated video-call links | Automatically create a Zoom/Meet/Teams link when an interview is scheduled. | `feature/12-video-call-links` |
| Automated status-update emails | Send templated emails automatically when a candidate's status changes (shortlisted, rejected, interview invite). | `feature/12-status-update-emails` |
| Structured interview feedback forms | Let interviewers submit a consistent scorecard after each interview, feeding hiring decisions. | `feature/12-interview-feedback-forms` |
| Applicant calendar sync | Sync an applicant's scheduled interviews to their personal calendar. | `feature/12-applicant-calendar-sync` |

---

## Epic 13 — Offers, Hiring & Applicant Career Tools
**Goal:** Close the loop on hiring, and give applicants tools to improve their chances (FR-RC-24, FR-RC-25, FR-AP-22 to FR-AP-24).

| Task | Purpose | Branch |
|---|---|---|
| Offer letter generation & tracking | Let recruiters send template-based offer letters and track whether the candidate accepted. | `feature/13-offer-letter-flow` |
| Mark candidate as hired & close requisition | Finalize the hiring process and archive the job post once filled. | `feature/13-mark-hired-close-job` |
| Post-apply detailed score feedback | Show applicants their full score breakdown and missing skills after applying, so they understand the outcome. | `feature/13-post-apply-score-feedback` |
| "Improve my profile" suggestions | Aggregate gaps across jobs an applicant is interested in and suggest concrete profile improvements. | `feature/13-profile-improvement-suggestions` |
| CV health-check tool | Let applicants run an independent check on formatting issues, missing sections, and keyword density in their CV. | `feature/13-cv-health-check` |

---

## Epic 14 — Analytics & Reporting (Company Level)
**Goal:** Give recruiters visibility into their hiring funnel (FR-RC-21 to FR-RC-23).

| Task | Purpose | Branch |
|---|---|---|
| Company hiring dashboard | Show applications per job, average ATS scores, time-to-hire, and applicant sources. | `feature/14-company-hiring-dashboard` |
| Exportable candidate lists/reports | Let recruiters download candidate data for offline review or reporting. | `feature/14-exportable-candidate-reports` |
| Diversity & inclusion analytics (opt-in) | Show anonymized D&I data, using only data from applicants who explicitly opted in. | `feature/14-di-analytics` |

---

## Epic 15 — Account, Privacy & Compliance (Applicant Side)
**Goal:** Give applicants control over their own data and notifications (FR-AP-28 to FR-AP-30).

| Task | Purpose | Branch |
|---|---|---|
| Notification preference center | Let applicants control which notifications they receive and how. | `feature/15-notification-preferences` |
| Personal data export/delete (GDPR) | Let applicants download or delete their own data, satisfying data-portability and right-to-erasure requirements. | `feature/15-applicant-data-export-delete` |
| Block specific companies | Let applicants prevent named companies from viewing their profile. | `feature/15-block-companies` |

---

## Epic 16 — Non-Functional: Security, Performance & Quality
**Goal:** Cross-cutting hardening work that applies across every feature (§5 of the SRS). Ongoing throughout the project, not a single sprint.

| Task | Purpose | Branch |
|---|---|---|
| Input validation & rate limiting | Protect every API endpoint from malformed input and abuse using `express-rate-limit`'s in-memory store. | `feature/16-validation-rate-limiting` |
| TLS/encryption setup | Enforce HTTPS in transit and encrypt sensitive data at rest (AES-256), per NFR-03. | `feature/16-tls-encryption` |
| Automated backups | Set up daily MySQL backups with point-in-time recovery so data loss risk is minimized. | `feature/16-automated-backups` |
| WCAG 2.1 AA accessibility pass | Audit and fix the frontend for accessibility compliance (NFR-12). | `feature/16-accessibility-pass` |
| Responsive design QA | Verify and fix layouts across desktop, tablet, and mobile web. | `feature/16-responsive-qa` |
| End-to-end test suite | Cover the critical paths (register → build profile → apply → get scored → recruiter reviews) with automated tests. | `feature/16-e2e-test-suite` |
| Load testing for ATS scoring | Verify the async scoring pipeline holds up under peak application volume before launch. | `feature/16-ats-load-testing` |

---

## Epic 17 — Recruiter: Company, Team & Subscription Plan Seat Management
**Goal:** Empower tenant organizations to manage company profile branding, invite and manage team members with recruiter sub-roles (Company Admin, Hiring Manager, Interviewer), configure role permissions, and strictly align team size and active postings with their assigned subscription plan seat limits (FR-RC-01 to FR-RC-03, FR-SA-03).

| Task | Purpose | Branch |
|---|---|---|
| Company profile & branding setup | Let recruiters configure company profile details (logo upload, description, industry, company size, website, locations, and culture media) to represent the tenant brand to applicants (FR-RC-01). | `feature/17-company-profile-branding` |
| Team member invitation & onboarding workflow | Let Company Admins invite team members by email with time-limited secure invitation tokens and pre-assigned sub-roles (`HIRING_MANAGER`, `INTERVIEWER`) (FR-RC-02). | `feature/17-team-invitations` |
| Recruiter sub-role & permissions matrix | Manage recruiter sub-roles (`COMPANY_ADMIN`, `HIRING_MANAGER`, `INTERVIEWER`) with granular permission flags (job posting, viewing candidate salary, advancing pipeline stages, scheduling interviews, extending offers) (FR-RC-02). | `feature/17-subrole-permissions` |
| Subscription plan seat quota & usage enforcement | Track and display real-time plan usage (seats used vs `plan.maxSeats`, active jobs vs `plan.maxJobPosts`, ATS scans quota); strictly enforce hard seat limits to prevent over-allocation with upgrade prompts (FR-RC-03, FR-SA-03). | `feature/17-plan-seat-quota-enforcement` |
| Team member offboarding, requisition transfer & seat release | Safely deactivate or remove team members, transfer their open requisitions and candidate pipeline assignments, and release seat licenses back to the company pool (FR-RC-02). | `feature/17-team-offboarding-seat-release` |

---

## Epic 18 — Applicant: Company Discovery & Employer Profile Hub
**Goal:** Empower job seekers to discover employers, explore authentic employer branding (office locations, workplace culture photos/videos, company bio, social presence), and browse company-specific active vacancies with predicted ATS match scores (FR-AP-31 to FR-AP-35, FR-RC-01).

| Task | Purpose | Branch |
|---|---|---|
| Public company directory & search | Give applicants a searchable directory of hiring companies with industry, location, size, and active job count filters (FR-AP-31). | `feature/18-company-directory-search` |
| Rich employer branding profile view | Build public company profile page showcasing cover photo, logo, bio, culture gallery, office directory, and social links (FR-AP-32). | `feature/18-employer-branding-profile` |
| Company-specific active job listings | Display all active openings for a selected company with real-time ATS match prediction and one-click application initiation (FR-AP-33). | `feature/18-company-active-jobs` |
| Cross-platform company links | Link company names/logos from job search results, job detail pages, and applicant tracking dashboard to company profiles (FR-AP-34). | `feature/18-cross-platform-company-navigation` |
| Company follow & vacancy alert engine | Let applicants follow favorite companies and receive notifications when new requisitions are published (FR-AP-35). | `feature/18-company-follow-alerts` |

---

## Suggested build order
1. **Epic 0 → Epic 1** (setup + auth) — nothing else can start without these.
2. **Epic 8 → Epic 9** (applicant profile + CV) and **Epic 6** (recruiter job posting) can run in parallel once auth is done — they produce the data the ATS engine needs.
3. **Epic 7** (ATS Scoring Engine) — start as soon as profile and job data shapes are stable; this is the platform's core value and should not be left late.
4. **Epic 10 → Epic 11** (apply flow + recruiter pipeline) — depends on Epic 7 being functional.
5. **Epic 2 → Epic 5** (Super Admin epics) can run in parallel with the above once Epic 1 (RBAC) is done.
6. **Epic 12 → Epic 13 → Epic 14** (communication, offers, analytics) — later-stage polish, once the core apply/hire loop works.
7. **Epic 15** and **Epic 16** — ongoing, with a final hardening pass before launch.
8. **Epic 17** (recruiter company, team & plan seat management) — tenant organization governance, multi-recruiter sub-roles, and seat limits aligned to the company's subscription plan.
9. **Epic 18** (applicant company discovery & employer profile hub) — public company directory, rich employer branding pages, and company-specific vacancy discovery for job seekers.

