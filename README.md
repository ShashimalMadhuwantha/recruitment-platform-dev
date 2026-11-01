# AI-Powered Recruitment & ATS Platform

A full-stack, multi-tenant recruitment and Applicant Tracking System (ATS) platform built with **React 18 + TypeScript (Vite)**, **Express.js (TypeScript)** modular monolith, and **MySQL (Prisma ORM)**. Features deterministic in-process ATS score prediction, 7-stage candidate Kanban pipelines, multi-tenant employer portals, and GDPR-compliant candidate privacy shielding.

---

## 📑 Table of Contents

1. [🚀 Tech Stack](#-tech-stack)
2. [📁 Monorepo Structure](#-monorepo-structure)
3. [⚡ Quick Start: Project Initialization for Other Users](#-quick-start-project-initialization-for-other-users)
4. [⚙️ Environment Variables Configuration](#️-environment-variables-configuration)
5. [📧 How to Get & Configure SMTP Credentials](#-how-to-get--configure-smtp-credentials)
   - [Option 1: Gmail App Password (Recommended for Real Emails)](#option-1-gmail-app-password-recommended-for-real-emails)
   - [Option 2: Mailtrap Sandbox (Recommended for Team Testing)](#option-2-mailtrap-sandbox-recommended-for-team-testing)
   - [Option 3: Local Console Fallback (Zero Setup)](#option-3-local-console-fallback-zero-setup)
6. [🗄️ Database Setup, Migrations & Seeding](#️-database-setup-migrations--seeding)
   - [Base Master Data Seed](#1-base-master-data-seed-super-admin--taxonomy)
   - [Full Demo Data Seed (12 Published Jobs & Candidates)](#2-full-demo-data-seed-12-jobs--recruiters--applicants)
   - [Visual Database Explorer (Prisma Studio)](#3-visual-database-explorer-prisma-studio)
7. [🔑 Pre-Seeded Default Login Accounts](#-pre-seeded-default-login-accounts)
8. [💻 Starting the Application](#-starting-the-application)
9. [🧪 Testing & Health Verification](#-testing--health-verification)
10. [🌿 Git Branching & Contribution Workflow](#-git-branching--contribution-workflow)
11. [🚢 Production Deployment (PM2 + Nginx)](#-production-deployment-pm2--nginx)
12. [❓ Common Troubleshooting & FAQ](#-common-troubleshooting--faq)

---

## 🚀 Tech Stack

| Layer | Technology | Key Details |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite | Tailwind CSS, TanStack React Query v5, React Router DOM 6, Lucide Icons |
| **Backend** | Express.js (Node.js + TypeScript) | Modular monolith architecture, Zod validation, Pino structured logging |
| **Database** | MySQL (8.x) + Prisma ORM | Relational schema with 20+ entities, deterministic indexing |
| **ATS Scoring** | In-Process Hybrid Engine | Rule-based SQL matching + TF-IDF cosine text similarity (`natural`) |
| **Email Service**| Nodemailer + SMTP | Template-driven notifications with automatic console fallback for dev |
| **Process & Infra**| PM2 + Nginx (Single VPS) | Zero Docker, Zero Redis, pure lean production deployment |
| **CI / CD** | GitHub Actions | Automated lint, typecheck, unit/integration testing, and build checks |

---

## 📁 Monorepo Structure

```text
recruitment-platform/
├── frontend/               # Vite + React 18 + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── app/            # App shell: Router, Providers, Auth Context
│   │   ├── components/     # UI primitives (ScoreBadge, Button, Card, StatusPill) & Shared
│   │   ├── features/       # Domain-scoped state & hooks (ats-scoring, application, etc.)
│   │   ├── pages/          # Role-based views (Applicant, Recruiter, Admin, Auth, Home)
│   │   └── lib/            # Axios API client, Tailwind utility helpers
│   └── tests/              # Vitest + React Testing Library component tests
│
├── backend/                # Express.js + TypeScript Modular Monolith
│   ├── prisma/             # schema.prisma & seed.ts
│   ├── scripts/            # Database inspection, seeding, and backup utilities
│   ├── src/
│   │   ├── config/         # Strongly-typed environment configuration (Zod)
│   │   ├── db/             # Prisma client singleton
│   │   ├── middleware/     # Error handler, JWT auth, RBAC, Rate limiter, Logger
│   │   ├── modules/        # Domain modules (auth, ats-scoring, applicant, job, etc.)
│   │   ├── services/       # Email & utility services (mail.service.ts)
│   │   └── jobs/           # In-process background job scheduler (node-cron)
│   ├── uploads/            # Resumes & document storage (PDF/DOCX)
│   └── tests/              # Vitest + Supertest integration & unit test suites
│
├── shared/                 # @recruitment-platform/shared (API envelopes, types, enums)
├── docs/                   # Product & Engineering documentation
│   ├── Recruitment_Platform_SRS.md
│   ├── Epic_Backlog.md
│   └── epics/              # Per-epic summary files
│
├── nginx/                  # Production Nginx reverse-proxy configuration
└── .github/workflows/      # GitHub Actions CI pipeline
```

---

## ⚡ Quick Start: Project Initialization for Other Users

Follow these steps to get the full platform running locally on any new machine.

### 1. Prerequisites
Ensure you have the following installed:
- **Node.js**: `v20.x` or `v22.x` (LTS recommended) — verify with `node -v`
- **npm**: `v10.x` or later — verify with `npm -v`
- **MySQL**: MySQL 8.0+ server installed and running locally (default port `3306` or `3308`)
- **Git**: Git 2.30+

### 2. Clone Repository & Install Dependencies
Clone the repository and install all workspace dependencies from the root:

```bash
git clone https://github.com/ShashimalMadhuwantha/recruitment-platform-dev.git
cd recruitment-platform-dev

# Install root, backend, frontend, and shared workspace dependencies in one command
npm install
```

### 3. Create Local Environment Files (`.env`)
Copy the provided `.env.example` templates to active `.env` files:

```bash
# Backend environment file
cp backend/.env.example backend/.env

# Frontend environment file
cp frontend/.env.example frontend/.env

# Optional root convenience environment file
cp .env.example .env
```
*(On Windows Command Prompt, use `copy backend\.env.example backend\.env` and `copy frontend\.env.example frontend\.env`)*.

---

## ⚙️ Environment Variables Configuration

Open `backend/.env` and adjust the variables for your local machine:

```env
# Server Runtime
NODE_ENV=development
PORT=5000

# MySQL Database (Adjust user, password, host, and port 3306 or 3308)
DATABASE_URL="mysql://root:password@localhost:3306/recruitment_ats_db"

# JWT Authentication
JWT_SECRET="super-secret-jwt-key-recruitment-platform-2026-min-32-chars"
JWT_EXPIRES_IN="7d"

# CORS & Application URLs
CORS_ORIGIN="http://localhost:5173"
FRONTEND_URL="http://localhost:5173"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Seed Super Admin Account
ADMIN_INITIAL_EMAIL="admin@atsplatform.local"
ADMIN_INITIAL_PASSWORD="AdminSecurePassword123!"

# SMTP Email Dispatch (See section below for how to get credentials)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER="your-email@gmail.com"
SMTP_PASS="xxxx xxxx xxxx xxxx"
SMTP_FROM="RecruitATS Platform <your-email@gmail.com>"
```

In `frontend/.env`:
```env
VITE_API_BASE_URL="http://localhost:5000/api"
```

---

## 📧 How to Get & Configure SMTP Credentials

The platform uses **Nodemailer** to dispatch automated system emails (Password Resets, Interview Invites, Stage Updates, Job Offers, and Candidate Acceptance notices).

Choose one of the 3 options below based on your workflow:

---

### Option 1: Gmail App Password (Recommended for Real Emails)

If you want real emails delivered to actual inboxes (e.g. testing password resets or interview notifications with your personal/work address), generate a Google App Password:

1. **Enable 2-Step Verification on Google**:
   - Log into your Google Account and visit: [myaccount.google.com/security](https://myaccount.google.com/security).
   - Under *"How you sign in to Google"*, make sure **2-Step Verification** is turned **ON**. (Google requires this before generating app passwords).

2. **Generate an App Password**:
   - Go directly to: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
   - In the *"App name"* field, enter `RecruitATS` (or any label) and click **Create**.
   - Google will display a **16-character passkey** in a yellow box (e.g., `abcd efgh ijkl mnop`).

3. **Configure `backend/.env`**:
   Paste the 16-character code into `SMTP_PASS` (the platform automatically strips any spaces):
   ```env
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER="your.personal.email@gmail.com"
   SMTP_PASS="abcdefghijklmnop"
   SMTP_FROM="RecruitATS Platform <your.personal.email@gmail.com>"
   ```

> [!TIP]
> Do NOT use your normal Gmail account password in `SMTP_PASS`. Google blocks standard password sign-ins for external apps; only generated **App Passwords** will authenticate.

---

### Option 2: Mailtrap Sandbox (Recommended for Team Testing)

If you are developing or testing with a team and want a safe "fake" inbox to preview HTML emails without sending emails to real users:

1. Visit [mailtrap.io](https://mailtrap.io/) and create a free account.
2. In your Mailtrap dashboard, navigate to **Email Testing** &rarr; **Inboxes** &rarr; Click **My Inbox**.
3. Under **Integrations**, select **Nodemailer** or copy the credentials:
   - **Host:** `sandbox.smtp.mailtrap.io`
   - **Port:** `2525` (or `587`)
   - **Username:** `(Your Mailtrap Username)`
   - **Password:** `(Your Mailtrap Password)`
4. Update `backend/.env`:
   ```env
   SMTP_HOST="sandbox.smtp.mailtrap.io"
   SMTP_PORT=2525
   SMTP_SECURE=false
   SMTP_USER="your-mailtrap-username"
   SMTP_PASS="your-mailtrap-password"
   SMTP_FROM="RecruitATS Sandbox <noreply@atsplatform.local>"
   ```
5. All dispatched emails will instantly appear in your Mailtrap web inbox for HTML inspection.

---

### Option 3: Local Console Fallback (Zero Setup)

If you do **not** configure any SMTP variables in `backend/.env`:
- The backend will **not crash**.
- The `MailService` automatically detects that SMTP is unconfigured.
- Whenever a password reset or invitation is triggered, the complete link and token are **printed directly into your backend terminal console**:
  ```text
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📧 [MailService Fallback - Local Dev] Password Reset link:
  🔗 Target: candidate@example.com
  🔗 Link:   http://localhost:5173/auth/reset-password?token=xxxx&email=...
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ```
You can simply click the printed link directly in your terminal to complete the user flow!

---

## 🗄️ Database Setup, Migrations & Seeding

### 1. Ensure MySQL Database Exists
Open MySQL in your terminal, MySQL Workbench, or phpMyAdmin, and create the database:

```sql
CREATE DATABASE IF NOT EXISTS recruitment_ats_db;
```

### 2. Push Schema & Generate Prisma Client
From the project root directory, run:

```bash
# 1. Generate Prisma Client TypeScript definitions
npm run db:generate

# 2. Push schema to MySQL (creates tables, foreign keys, and indexes)
npm run db:push
```

---

### 3. Choose Your Seeding Level

#### 1. Base Master Data Seed (Super Admin + Taxonomy)
Seeds the platform baseline: the Super Admin account, 20+ master taxonomy skills, default scoring weights, pipeline stages, subscription plans, and banned keywords.

```bash
npm run db:seed
```

#### 2. Full Demo Data Seed (12 Jobs + Recruiters + Applicants)
If you want a fully populated environment with published job listings, active recruiting companies, applicant profiles, and pre-calculated ATS scores:

```bash
# Seed 12 published jobs across fintech, health, and tech organizations
npm run db:seed:demo
```
*(Or individually: `npm run db:seed:open-jobs --workspace=backend` and `npm run db:seed:demo-applicant --workspace=backend`)*.

---

### 3. Visual Database Explorer (Prisma Studio)
To visually inspect, search, and edit database records in your browser:

```bash
npm run db:studio
```
Opens Prisma Studio at [http://localhost:5555](http://localhost:5555).

---

## 🔑 Pre-Seeded Default Login Accounts

When you run `npm run db:seed` and `npm run db:seed:demo`, the following verified accounts are ready for instant login:

| Role | Email | Password | What You Can Test |
|---|---|---|---|
| **Super Admin** | `admin@atsplatform.local` | `AdminSecurePassword123!` | Global ATS weights, tenant company approvals, system config, moderation &amp; banned keywords |
| **Recruiter (Fintech)** | `techlead@fintechhub.io` | `RecruiterPass123!` | 7-stage Kanban pipeline, candidate scorecards, job creation wizard, interview notes |
| **Recruiter (Cloud)** | `talent@cloudmatrix.io` | `RecruiterPass123!` | Talent pool search, candidate comparison matrix, company profile editing |
| **Applicant (Demo)** | `alex.chen@example.com` | `ApplicantPass123!` | Pre-filled CV &amp; skills profile, live application tracker, on-demand ATS score prediction |

---

## 💻 Starting the Application

### Option A: Run Both Concurrently (Recommended)
From the project root:

```bash
npm run dev
```

- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Option B: Run Services in Separate Terminals

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

---

## 🧪 Testing & Health Verification

The repository includes comprehensive unit, integration, and flow tests:

```bash
# Typecheck TypeScript across shared, backend, and frontend
npm run typecheck

# Run all test suites
npm run test

# Run backend integration tests (Vitest + Supertest)
npm run test:backend

# Run frontend UI component tests (Vitest + Testing Library)
npm run test:frontend

# Production build check
npm run build
```

---

## 🌿 Git Branching & Contribution Workflow

Per the project development guidelines in `.agent/skills/recruitment-platform-dev/SKILL.md`:

1. **Branch Hierarchy:**
   - Base branch: `develop`
   - Epic integration branch: `epic/<epic-number>-<epic-slug>` (e.g. `epic/01-auth-access-control`)
   - Feature/Task branch: `feature/<epic-number>-<task-slug>` (e.g. `feature/01-email-auth`)

2. **Conventional Commits:**
   - `feat(scope): ...` — New feature or API endpoint
   - `fix(scope): ...` — Bug fix
   - `docs(scope): ...` — Documentation updates
   - `style(scope): ...` — UI styling / theme adjustments
   - `refactor(scope): ...` — Code refactoring
   - `test(scope): ...` — Test additions or updates
   - `chore(scope): ...` — Maintenance, migrations, dependencies

3. **Pre-Commit Check:**
   Always run `npm run typecheck` and `npm run test` before pushing changes.

---

## 🚢 Production Deployment (PM2 + Nginx)

1. **Build Production Bundles:**
   ```bash
   npm run build
   ```

2. **Start PM2 Process Cluster:**
   ```bash
   pm2 start backend/ecosystem.config.js --env production
   ```

3. **Configure Nginx:**
   Copy `nginx/recruitment-platform.conf` to `/etc/nginx/sites-available/` and reload Nginx:
   ```bash
   sudo cp nginx/recruitment-platform.conf /etc/nginx/sites-available/recruitment-platform
   sudo ln -s /etc/nginx/sites-available/recruitment-platform /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

## ❓ Common Troubleshooting & FAQ

### 1. `Error: connect ECONNREFUSED 127.0.0.1:3306`
- **Cause**: MySQL is not running locally, or it is running on a different port (such as `3308`).
- **Fix**: Check your MySQL server status in Windows Services or run `mysql -u root -p`. Adjust the port in `backend/.env`'s `DATABASE_URL` (e.g., change `:3306` to `:3308`).

### 2. `Invalid environment variables: DATABASE_URL is required`
- **Cause**: `backend/.env` is missing or placed in the wrong directory.
- **Fix**: Ensure `backend/.env` exists and contains a valid `DATABASE_URL` string.

### 3. `Invalid login: 535-5.7.8 Username and Password not accepted` (Gmail SMTP)
- **Cause**: You entered your personal Google account password rather than an App Password, or 2-Step Verification is disabled.
- **Fix**: Follow [Option 1](#option-1-gmail-app-password-recommended-for-real-emails) to generate a dedicated 16-character App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).

### 4. Previous database records are missing
- **Cause**: Running `prisma migrate reset` or switching MySQL databases wipes local rows.
- **Fix**: Run `npm run db:seed` and `npm run db:seed:demo` to instantly regenerate all master data, published jobs, and candidate profiles.
