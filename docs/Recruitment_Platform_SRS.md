# Software Requirements Specification (SRS)
## AI-Powered Recruitment & ATS Platform

**Version:** 1.0
**Date:** September 8, 2026
**Status:** Draft

---

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements for a multi-tenant recruitment platform that connects **Job Seekers (Applicants)**, **Recruiters**, and a **Super Admin**. The platform's core differentiator is an **ATS (Applicant Tracking System) Score Prediction Engine** that automatically evaluates how well an applicant's profile/CV matches a specific job vacancy.

### 1.2 Scope
The system will allow:
- Applicants to build rich profiles (skills, CVs, achievements, education, experience, portfolio) and apply to jobs.
- Recruiters to post vacancies, manage pipelines, and view AI-generated ATS match scores per applicant per job.
- A Super Admin to govern the entire platform — users, recruiters/companies, plans, moderation, configuration, and analytics.

Out of scope for v1: payroll integration, background-check integrations, video-interview hosting (only scheduling links).

### 1.3 Definitions, Acronyms
| Term | Meaning |
|---|---|
| ATS | Applicant Tracking System |
| JD | Job Description |
| CV/Resume | Curriculum Vitae |
| RBAC | Role-Based Access Control |
| NLP | Natural Language Processing |
| SLA | Service Level Agreement |

### 1.4 Intended Audience
Product owners, engineering team, QA, UI/UX designers, and DevOps.

### 1.5 User Roles Overview
| Role | Description |
|---|---|
| **Super Admin** | Owns the platform. Manages recruiters, companies, applicants, plans, system config, compliance. |
| **Recruiter** (incl. Company Admin / Hiring Manager / Interviewer sub-roles) | Posts jobs, screens candidates using ATS scores, manages hiring pipeline. |
| **Applicant** | Builds profile, uploads CV, applies to jobs, tracks application status, sees own ATS score/feedback. |

---

## 2. Overall Description

### 2.1 Product Perspective
A cloud-based, multi-tenant SaaS web application (with optional mobile apps later). Each recruiting organization is a **tenant**; applicants are global users who can apply across tenants.

### 2.2 High-Level Architecture (Lean / Fast-to-Build Stack)

A **single deployable backend (modular monolith)** is recommended over microservices for short-term delivery — fewer moving parts, faster to build, easier to run, and still cleanly separable into services later if needed.

```
┌───────────────────────────────────────────────────────────────┐
│                        Presentation Layer                       │
│         Web App (React + TypeScript, built with Vite) — all 3 roles │
└───────────────────────────────────────────────────────────────┘
                                │  REST API (JWT auth)
┌───────────────────────────────────────────────────────────────┐
│                     Backend (Modular Monolith)                  │
│  Modules: Auth/User · Applicant Profile · Job/Vacancy ·          │
│           Application & Pipeline · ATS Scoring (SQL-based) ·    │
│           Notifications · Admin/Audit                           │
│  CV parsing & ATS scoring run inline as async functions          │
│  (no separate queue needed — see note below)                     │
└───────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────────────────┐
                    │        MySQL            │
                    │  (single source of      │
                    │   truth for all data:   │
                    │   users, profiles,      │
                    │   skills, jobs,          │
                    │   applications, scores,  │
                    │   messages, audit logs,  │
                    │   and a lightweight      │
                    │   `background_jobs`      │
                    │   table for anything     │
                    │   that needs retry)      │
                    └───────────────────────┘
```

**Why this is enough for launch (no Redis, no Docker):**
- **MySQL** handles all relational data *and* doubles as your search layer for MVP (use MySQL `FULLTEXT` indexes + `MATCH...AGAINST`/`LIKE` queries + regular B-tree indexes on skills/location/title — no Elasticsearch needed until scale demands it).
- **No caching layer needed at MVP scale.** Since it's a single Node.js process, use a small in-memory cache (a plain JS `Map` or the `node-cache` package) for anything hot (e.g., skill taxonomy list), instead of a distributed cache like Redis.
- **No message broker/queue needed.** ATS scoring is plain SQL queries (see §4.3), not ML — it's fast enough to run as a normal `async` function right after an application is submitted, without blocking the response noticeably. For CV parsing (which can take a second or two), kick it off with `setImmediate`/a fire-and-forget async call so the upload response returns instantly while parsing finishes just after. If you want retry-safety for these background steps, add a simple `background_jobs` table in MySQL (status: pending/done/failed) and a `node-cron` job that polls it every few seconds — no Redis/BullMQ/Kafka required.
- **Sessions are stateless** (JWT in an httpOnly cookie or Authorization header) — no server-side session store needed.
- **Rate limiting** uses `express-rate-limit`'s built-in in-memory store — fine for a single-instance deployment.
- CV/document files: store on local disk or a single object-storage bucket (S3-compatible) referenced by a URL column in MySQL — this is a file store, not a database/cache, so it doesn't add stack complexity.
- ATS scoring is **rule-based SQL/application-logic matching** (see §4.3) instead of embeddings/vector DB/ML — same weighted-score output, far less infrastructure and time to build.

### 2.3 Suggested Tech Stack (Minimal, Fast-to-Ship — No Redis, No Docker)
- **Frontend:** React + TypeScript, bundled/served with **Vite**, Tailwind CSS, React Router, TanStack Query (data fetching/caching against the API)
- **Backend:** **Express.js (Node.js + TypeScript)** — **one modular monolith** (organized by feature modules: auth, applicant, job, application/pipeline, ats-scoring, notifications, admin), not microservices
- **Database:** **MySQL only** (relational data + full-text search via built-in `FULLTEXT` indexes; a small `background_jobs` table covers async/retry needs)
- **In-process cache:** simple in-memory cache (`node-cache` or a plain `Map`) for hot, rarely-changing data (skill taxonomy, config) — no external cache server
- **Background tasks:** plain Node.js `async` functions run inline/fire-and-forget; `node-cron` for anything scheduled or needing polling/retry against the `background_jobs` table
- **CV Parsing:** lightweight library (e.g., `pdf-parse`/`mammoth` for text extraction + regex/keyword-based entity extraction) — no heavy ML/NLP service required for MVP
- **ATS Semantic Matching:** `natural` npm package for TF-IDF vectorization + cosine similarity (pure JS, in-process, no external API, no training data required) — see §4.3
- **Auth:** JWT + OAuth2 (Google/LinkedIn login)
- **File storage:** S3-compatible bucket or local disk with signed URLs
- **Infra (no Docker):** run the Express app directly with **PM2** (process manager, auto-restart, clustering across CPU cores when you outgrow one process) behind **Nginx** as a reverse proxy/SSL terminator, on a single VPS (or a Node-friendly host like Railway/Render if preferred). MySQL can run natively installed on the same or a separate server. CI/CD via GitHub Actions (build → SSH/rsync deploy → `pm2 reload`).
- **Deferred until scale requires it:** Redis, Docker/Kubernetes, Elasticsearch, Kafka/RabbitMQ, vector DB, dedicated ML microservice

### 2.4 Assumptions & Constraints
- CVs are uploaded as PDF/DOCX; system must parse both.
- ATS scoring is advisory — recruiters retain final decision authority.
- Multi-language support (at least English) required from v1; scoring model must handle non-English resumes gracefully (flag rather than fail).
- Compliance with GDPR-style data protection (applicant data deletion/export rights).

---

## 3. Functional Requirements by Role

---

## 3.1 SUPER ADMIN

### 3.1.1 Platform & Tenant Management
- FR-SA-01: Create, suspend, and delete recruiter/company (tenant) accounts.
- FR-SA-02: Approve or reject new recruiter/company sign-ups (manual verification workflow — business registration doc upload optional).
- FR-SA-03: Assign subscription plans/tiers to companies (e.g., Free, Pro, Enterprise) with configurable limits (active job posts, seats, ATS scans/month).
- FR-SA-04: View and impersonate (with audit logging) any tenant account for support purposes.

### 3.1.2 User Management
- FR-SA-05: View, search, filter all users (applicants + recruiters) platform-wide.
- FR-SA-06: Suspend/ban/reinstate any user account for policy violations.
- FR-SA-07: Reset passwords / force MFA re-enrollment for any account.
- FR-SA-08: Manage role assignments and custom permission sets (RBAC editor).

### 3.1.3 Content & Compliance Moderation
- FR-SA-09: Review flagged job postings (spam, discriminatory language, fraud) and approve/reject/edit.
- FR-SA-10: Review reported user profiles/CVs (fake profiles, plagiarism, inappropriate content).
- FR-SA-11: Configure a banned-keyword/discriminatory-language filter applied to job postings automatically.
- FR-SA-12: Maintain audit logs of all admin actions (immutable, exportable).
- FR-SA-13: Manage data subject requests (GDPR export/delete requests) with SLA tracking.

### 3.1.4 System Configuration
- FR-SA-14: Configure global ATS scoring weightage defaults (skills %, experience %, education %, keyword match %, certifications %) — recruiters may override within allowed bounds per job.
- FR-SA-15: Manage master data: skill taxonomy, industries, job categories, certifications library, currencies, locations.
- FR-SA-16: Configure email/SMS templates for system notifications.
- FR-SA-17: Manage integrations (LinkedIn import, job board syndication, calendar/video-call providers, payment gateway).
- FR-SA-18: Feature flag management (enable/disable features per tenant tier).

### 3.1.5 Analytics & Reporting (Platform-wide)
- FR-SA-19: Dashboard showing platform KPIs: total users, active jobs, applications/day, average ATS scores, top skills in demand, churn, revenue (MRR/ARR).
- FR-SA-20: Exportable reports (CSV/PDF) for finance, usage, and compliance audits.
- FR-SA-21: Anomaly/fraud detection alerts (e.g., bot applications, duplicate accounts).

### 3.1.6 Billing & Subscription (if monetized)
- FR-SA-22: Manage pricing plans, invoices, payment failures, refunds.
- FR-SA-23: View revenue analytics by tenant/plan.

---

## 3.2 RECRUITER

*(Sub-roles configurable within a company: Company Admin, Hiring Manager, Interviewer — Company Admin has full rights below; others scoped per job/permission.)*

### 3.2.1 Company & Team Management
- FR-RC-01: Set up company profile (logo, description, industry, size, locations, culture media/photos).
- FR-RC-02: Invite and manage team members (Hiring Managers, Interviewers) with role-based permissions.
- FR-RC-03: View subscription plan usage (job post quota, ATS scan quota, seats used).

### 3.2.2 Job Vacancy Management
- FR-RC-04: Create job postings with structured fields: title, department, location (remote/hybrid/onsite), employment type, salary range, JD text, **required skills** (mapped to taxonomy, with weight/priority: must-have vs nice-to-have), required experience (years), education requirements, certifications required, application deadline.
- FR-RC-05: Save job postings as drafts, templates, or duplicate from previous postings.
- FR-RC-06: Set custom ATS scoring weights per job (within Super-Admin-allowed bounds) — e.g., prioritize skills over education for a technical role.
- FR-RC-07: Publish/unpublish/close/archive job postings.
- FR-RC-08: Configure application form (custom screening questions, knockout questions).
- FR-RC-09: Multi-location/multi-department posting support.

### 3.2.3 Candidate Sourcing & Pipeline
- FR-RC-10: View list of applicants per vacancy, sortable/filterable by **ATS Match Score**, application date, skills, experience, location.
- FR-RC-11: Search the applicant/talent pool database directly (not just applicants) using skills, experience, keyword, location filters — subject to applicant's visibility/privacy settings.
- FR-RC-12: Move candidates through pipeline stages (Applied → Screening → Shortlisted → Interview → Offer → Hired → Rejected) via drag-and-drop kanban or list view.
- FR-RC-13: View detailed ATS score breakdown per applicant per job (skills match %, experience match %, education match %, keyword match %, missing skills list, strengths/gaps summary).
- FR-RC-14: Bulk actions: shortlist, reject, tag, or message multiple candidates at once.
- FR-RC-15: Add private internal notes and star-ratings on candidates, visible only to the hiring team.
- FR-RC-16: Compare multiple shortlisted candidates side-by-side (skills, score, experience).

### 3.2.4 Communication & Scheduling
- FR-RC-17: In-app messaging with applicants; email notifications synced.
- FR-RC-18: Schedule interviews with calendar integration (Google/Outlook) and auto-generate video-call links (Zoom/Meet/Teams integration).
- FR-RC-19: Send automated status-update emails (rejection, shortlisted, interview invite) using configurable templates.
- FR-RC-20: Collect structured interview feedback/scorecards from interviewers.

### 3.2.5 Analytics & Reporting (Company-level)
- FR-RC-21: Dashboard: applications per job, average ATS scores, time-to-hire, source of applicants, funnel conversion rates.
- FR-RC-22: Exportable candidate lists and reports.
- FR-RC-23: Diversity & inclusion analytics (optional, anonymized, opt-in data only).

### 3.2.6 Offer & Onboarding (basic)
- FR-RC-24: Generate and send offer letters (template-based) and track acceptance status.
- FR-RC-25: Mark candidate as "Hired" and archive/close the requisition.

---

## 3.3 APPLICANT (Job Seeker)

### 3.3.1 Profile Management
- FR-AP-01: Register/login via email, Google, or LinkedIn OAuth.
- FR-AP-02: Build a structured profile: personal info, headline/summary, contact details, profile photo.
- FR-AP-03: **Skills management** — add skills from a standardized taxonomy (with autosuggest), self-rate proficiency (Beginner/Intermediate/Advanced/Expert), optionally add years of experience per skill.
- FR-AP-04: **Education** — add institutions, degrees, majors, GPA, dates, certificates.
- FR-AP-05: **Work experience** — company, title, dates, responsibilities, achievements (bullet points), technologies used.
- FR-AP-06: **Achievements/Awards** — add awards, publications, patents, competition results, volunteer work.
- FR-AP-07: **Certifications & Licenses** — name, issuing body, issue/expiry date, credential ID/URL, with optional verification upload.
- FR-AP-08: **Portfolio** — links (GitHub, Behance, personal site), upload work samples/project files.
- FR-AP-09: **Languages** known with proficiency level.
- FR-AP-10: Profile visibility/privacy settings (public to all recruiters, private/apply-only, hidden from current employer's domain).
- FR-AP-11: Profile completeness meter/gamification to encourage full profiles (improves ATS scoring accuracy).

### 3.3.2 CV / Resume Management
- FR-AP-12: Upload existing CV (PDF/DOCX) — system auto-parses and pre-fills profile fields (editable by applicant to confirm accuracy).
- FR-AP-13: Alternatively, build a CV from profile data using selectable templates; export as PDF.
- FR-AP-14: Maintain multiple CV versions (e.g., "Frontend CV", "Full-stack CV") and choose which to attach per application.
- FR-AP-15: CV version history with restore.

### 3.3.3 Job Search & Application
- FR-AP-16: Search/browse jobs with filters (title, location, remote, salary, industry, experience level, posted date).
- FR-AP-17: Save/bookmark jobs; save search alerts with notification triggers.
- FR-AP-18: **View predicted ATS match score before applying** (so applicant can decide whether/how to improve profile first).
- FR-AP-19: Apply with one click (using profile + selected CV) or answer job-specific screening questions.
- FR-AP-20: Withdraw an application.
- FR-AP-21: Track application status in a personal dashboard (Applied, Under Review, Shortlisted, Interview Scheduled, Offer, Rejected).

### 3.3.4 ATS Feedback & Career Tools
- FR-AP-22: After applying (or on-demand against any JD), view a detailed score breakdown: overall match %, matched skills, missing/recommended skills, suggestions to improve match (e.g., "Add 'Kubernetes' to reach 85% match").
- FR-AP-23: "Improve my profile" suggestions generated from aggregate gaps across jobs the applicant is interested in.
- FR-AP-24: Resume health-check tool (formatting issues, missing sections, keyword density) independent of a specific job.

### 3.3.5 Communication & Notifications
- FR-AP-25: In-app + email notifications for application status changes, interview invites, messages from recruiters.
- FR-AP-26: In-app messaging thread per application/recruiter.
- FR-AP-27: Calendar sync for scheduled interviews.

### 3.3.6 Account & Privacy
- FR-AP-28: Manage notification preferences.
- FR-AP-29: Download all personal data (data portability) / request account deletion (GDPR).
- FR-AP-30: Block specific companies from viewing profile.

---

## 4. ATS Score Prediction Engine — Detailed Specification

### 4.1 Objective
Given an **Applicant Profile/CV** and a **Job Vacancy (JD)**, compute a **Match Score (0–100%)** with an explainable breakdown, generated automatically on application submission and recalculable on demand.

### 4.2 Inputs
- Structured applicant data: skills (+ proficiency + years), work experience (titles, durations, descriptions), education, certifications, achievements, keywords extracted from free-text CV.
- Structured job data: required skills (must-have vs nice-to-have, each weighted), min/max years of experience, required education level, required certifications, JD full text.

### 4.3 Scoring Pipeline — Hybrid: Rule-Based (SQL) + TF-IDF Similarity (Lightweight ML)

This is a **two-layer scoring approach**: precise rule-based matching for structured data (skills, experience, education, certifications) combined with a genuine statistical-ML layer (TF-IDF + cosine similarity) for free-text matching. Both run **inside the existing Node/Express backend** — no external API calls, no Python service, no vector database, and no training data required to get started.

1. **Parsing & Normalization** — On CV upload, extract raw text (`pdf-parse`/`mammoth`), then use simple keyword/regex extraction plus the applicant's own structured profile fields (skills, experience, education, certifications — see §3.3.1) as the primary data source. Since skills are selected from a **standardized taxonomy table** (not free text), matching becomes a straightforward SQL `JOIN`/set-overlap, avoiding the "does the NLP understand the resume" problem for the structured fields.
2. **Sub-score Calculation** (computed via SQL aggregate queries against `ApplicantSkill`, `WorkExperience`, `Education`, `Certification` tables vs. `JobRequiredSkill`/`JobRequirement`, plus one ML-based sub-score):
   - **Skills Match (default weight ~40%):** `COUNT(matched required skills, weighted must-have/nice-to-have) / COUNT(total required skills)`, with a bonus/penalty multiplier if the applicant's self-rated proficiency meets the job's minimum.
   - **Experience Match (~25%):** compares `SUM(work experience years)` against the job's required range; a simple title/keyword overlap check (e.g., required title words found in past job titles) adds a relevance factor.
   - **Education Match (~15%):** rule table mapping degree levels (e.g., Diploma < Bachelor's < Master's < PhD) compared against the job's minimum requirement, plus a field-of-study keyword match.
   - **Semantic/Text Match — TF-IDF Cosine Similarity (~15%):** the genuine ML component. Full CV text and full JD text are each converted into a TF-IDF vector (term frequency–inverse document frequency, computed in-process using the `natural` npm package — pure JavaScript, no external calls, no GPU, no training data needed), then compared with **cosine similarity** to produce a 0–1 relevance score. This catches relevant phrasing and context that exact keyword matching misses (e.g., a CV describing "built REST APIs with Node.js" scoring well against a JD asking for "backend API development experience" even without identical wording).
   - **Certifications/Achievements (~5%):** presence of any required certification (exact/alias match against the certification table).
3. **Weighted Aggregation** — Weighted sum of the five sub-scores → overall score (0–100%). Weights stored per job (or platform default) in `ScoreWeightConfig` and configurable by Super Admin / Recruiter.
4. **Explainability Layer** — The four rule-based sub-scores produce a natural breakdown (matched skills, missing skills, experience gap, etc.) directly from the SQL comparison. For the TF-IDF sub-score, surface the **top overlapping terms** between CV and JD (the highest-weighted shared TF-IDF terms) as a simple "why this matched" explanation, so the score doesn't feel like a black box.
5. **Score Storage & Recompute** — Score stored per (applicant, job) pair in `ATSScore`; recomputed via an inline async function (or a `background_jobs` table entry picked up by `node-cron` for heavier recompute batches) whenever the applicant updates their profile or the recruiter edits job requirements — kept off the critical request path so the UI stays responsive.

### 4.4 Functional Requirements
- FR-ATS-01: System shall generate an ATS score automatically within N seconds (target: <10s) of application submission.
- FR-ATS-02: System shall allow on-demand scoring (applicant can test their profile against a job before applying).
- FR-ATS-03: System shall provide a breakdown by category (skills/experience/education/semantic-text/certifications), not just a single number.
- FR-ATS-04: System shall log the exact weight configuration used for each score (for auditability/consistency if weights change later).
- FR-ATS-05: System shall flag low-confidence parses (e.g., poorly formatted CV) and prompt applicant/recruiter to verify data manually.
- FR-ATS-06: System shall support recruiter override/manual adjustment of a candidate's score with a mandatory reason note (for audit).
- FR-ATS-07: System shall never be the sole basis for auto-rejection without recruiter confirmation (bias/compliance safeguard) — configurable auto-reject threshold is opt-in per company.
- FR-ATS-08: System shall support batch re-scoring of all applicants when a job's requirements are edited.
- FR-ATS-09: System shall exclude protected-class signals (age, gender, marital status, photo, etc.) from the scoring model to reduce bias risk; these fields must not influence the score even if present in the CV.
- FR-ATS-10: Provide bias/fairness monitoring reports to Super Admin (score distribution across demographic segments where legally permissible and anonymized).
- FR-ATS-11: System shall surface the top matching terms from the TF-IDF comparison as part of the score explanation shown to recruiters and applicants.

### 4.5 Non-Functional Requirements for ATS Engine
- Explainability output must be deterministic and reproducible for the same input+weights (both the SQL sub-scores and TF-IDF are deterministic — no randomness, unlike a trained probabilistic model).
- Scoring runs as an async function right after application submission (or via the `background_jobs` table for batch recomputes) so applying/searching never blocks on score calculation.
- TF-IDF vectorization/comparison runs in-process (pure JS, `natural` package) — no added infrastructure, no network calls, negligible latency (milliseconds) for typical CV/JD text lengths.

### 4.6 Explicit Non-Goal for Launch
No trained/ML classifier model is used at launch — the hybrid rule-based + TF-IDF approach in §4.3 is the complete scoring engine for Stage 1. This keeps the ATS engine deployable with zero training data and zero extra infrastructure beyond MySQL and the Node/Express backend already in use.

---

## 5. Cross-Cutting / Non-Functional Requirements

### 5.1 Security
- NFR-01: RBAC enforced at API layer for all three roles + sub-roles.
- NFR-02: MFA available for Recruiter/Admin accounts; recommended for Applicants.
- NFR-03: All data encrypted in transit (TLS 1.2+) and at rest (AES-256).
- NFR-04: CVs and documents stored in access-controlled object storage with signed, time-limited URLs.
- NFR-05: Regular penetration testing and dependency vulnerability scanning.

### 5.2 Privacy & Compliance
- NFR-06: GDPR/CCPA-style compliance: consent capture, data export, right-to-erasure workflows.
- NFR-07: Configurable data retention policy (e.g., auto-delete inactive applicant data after X months, with notice).
- NFR-08: Audit trail for all access to applicant personal data by recruiters.

### 5.3 Performance & Scalability
- NFR-09: ATS scoring runs as lightweight async logic within the same backend process; if/when scoring volume grows, it can be split into a separate worker process reading from the `background_jobs` table without needing a message broker.
- NFR-10: Search/filter operations (job search, candidate search) return results in acceptable time (<2s) for early-to-mid scale using indexed MySQL queries (`FULLTEXT` and B-tree indexes on skills/location/title); migrate to Elasticsearch only if/when data volume or query complexity outgrows this.
- NFR-11: Architecture should stay modular enough that MySQL tables can later be sharded/replicated (e.g., read replicas), and the scoring worker pool scaled horizontally, without a rewrite.

### 5.4 Usability & Accessibility
- NFR-12: WCAG 2.1 AA accessibility compliance.
- NFR-13: Responsive design (desktop, tablet, mobile web).
- NFR-14: Multi-language UI support (i18n-ready architecture from v1).

### 5.5 Availability & Reliability
- NFR-15: Target 99.9% uptime SLA.
- NFR-16: Automated backups (daily) with point-in-time recovery.
- NFR-17: Graceful degradation — if ATS scoring service is down, applications still submit; scoring queued and applied when service recovers.

### 5.6 Auditability
- NFR-18: Immutable audit logs for admin actions, score overrides, and data access, retained per compliance policy.

---

## 6. Core Data Entities (High-Level ER Overview)

```
User (id, email, password_hash, role, status, mfa_enabled, created_at)
 ├── SuperAdminProfile
 ├── RecruiterProfile (company_id, sub_role, permissions)
 └── ApplicantProfile (headline, summary, visibility_settings)

Company (id, name, industry, size, logo, plan_id, status)

Skill (id, name, category, aliases[])
ApplicantSkill (applicant_id, skill_id, proficiency, years)

Education (id, applicant_id, institution, degree, field, start_date, end_date, gpa)
WorkExperience (id, applicant_id, company, title, start_date, end_date, description, skills_used[])
Achievement (id, applicant_id, title, type, description, date, issuer)
Certification (id, applicant_id, name, issuer, issue_date, expiry_date, credential_url)
Portfolio (id, applicant_id, type, url, file_ref)

CV (id, applicant_id, file_ref, parsed_json, version_label, created_at)

JobVacancy (id, company_id, title, description, location, employment_type,
            salary_min, salary_max, status, deadline, created_by)
JobRequiredSkill (job_id, skill_id, priority[must-have/nice-to-have], weight, min_proficiency)
JobRequirement (job_id, min_experience_years, education_level, required_certifications[])

Application (id, applicant_id, job_id, cv_id, status, applied_at, withdrawn_at)
ATSScore (id, application_id, overall_score, skills_score, experience_score,
          education_score, semantic_tfidf_score, certification_score, weight_config_id,
          breakdown_json, top_matching_terms_json, computed_at)
ScoreWeightConfig (id, company_id/job_id, skills_w, experience_w, education_w, semantic_w, cert_w)

PipelineStage (id, job_id, name, order)
CandidatePipeline (application_id, stage_id, moved_at, moved_by)
InterviewSchedule (id, application_id, interviewer_id, datetime, video_link, status)
InterviewFeedback (id, interview_id, interviewer_id, scorecard_json, recommendation)

Message (id, thread_id, sender_id, receiver_id, body, sent_at)
Notification (id, user_id, type, payload, read_status, created_at)
AuditLog (id, actor_id, action, target_type, target_id, metadata, timestamp)
```

---

## 7. Key Use Cases (Summary)

| # | Use Case | Primary Actor |
|---|---|---|
| UC-01 | Register & build applicant profile | Applicant |
| UC-02 | Upload CV and auto-parse profile | Applicant |
| UC-03 | Search jobs and check ATS score before applying | Applicant |
| UC-04 | Apply to a job vacancy | Applicant |
| UC-05 | Track application status | Applicant |
| UC-06 | Post a new job vacancy with skill weights | Recruiter |
| UC-07 | View ranked candidate list by ATS score | Recruiter |
| UC-08 | Move candidate through pipeline & schedule interview | Recruiter |
| UC-09 | Override an ATS score with justification | Recruiter |
| UC-10 | Approve a new recruiter/company account | Super Admin |
| UC-11 | Configure global ATS scoring weights | Super Admin |
| UC-12 | Moderate flagged job posting | Super Admin |
| UC-13 | View platform-wide analytics | Super Admin |
| UC-14 | Handle GDPR data deletion request | Super Admin |

---

## 8. Launch Scope (Stage 1)

The goal is to ship a **fully functional, real system** in one go, on a lean stack (MySQL only, no Redis, no Docker — see §2.2/§2.3), covering essentially all functions from §3 rather than splitting them across future phases.

**Scope covered in this build:**
- Auth (JWT + Google/LinkedIn OAuth) for all 3 roles
- Full Applicant profile (skills, education, experience, achievements, certifications, portfolio)
- CV upload + parsing/pre-fill, CV builder/export, multiple CV versions
- Job posting management (incl. per-job skill weights)
- Apply flow, application tracking, withdraw
- **Hybrid rule-based + TF-IDF ATS scoring with full breakdown** (§4.3)
- Recruiter pipeline (kanban stages, notes, bulk actions, candidate comparison)
- Interview scheduling + calendar link generation, structured interview feedback/scorecards
- Offer letters and hire/close tracking
- Company-level analytics dashboard
- CV health-check tool, saved searches/alerts
- In-app + email notifications, messaging
- Super Admin: user/company management, approvals, moderation, global weight config, platform dashboard, GDPR export/delete flows
- Search/filter using MySQL full-text search

**Infra:** MySQL only, PM2 + Nginx on a single server, single backend service — no containers, no additional services to operate (see §2.2/§2.3 for what's deliberately left out and why).

---

## 9. Open Questions for Stakeholders
1. Is the platform single-company (internal ATS) or multi-tenant SaaS (many companies)?
2. Should the ATS scoring model be rule-based only for v1, or is ML/embedding-based scoring required from launch?
3. What monetization model — subscription per recruiter seat, per job post, or freemium?
4. Are video interviews to be hosted natively or only scheduled via external links (Zoom/Meet)?
5. What jurisdictions' compliance rules apply (GDPR, CCPA, local labor law on automated hiring decisions — e.g., NYC Local Law 144 style AI-hiring disclosure)?

---

*End of Document*
