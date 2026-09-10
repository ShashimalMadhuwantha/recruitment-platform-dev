# AI-Powered Recruitment & ATS Platform

A full-stack, multi-tenant recruitment and Applicant Tracking System (ATS) platform built with **React 18 + TypeScript (Vite)**, **Express.js (TypeScript)** modular monolith, and **MySQL (Prisma ORM)**.

---

## 🚀 Tech Stack

| Layer | Technology | Key Details |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite | Tailwind CSS, TanStack React Query, React Router DOM 6 |
| **Backend** | Express.js (Node.js + TypeScript) | Modular monolith architecture, Zod validation, Pino structured logging |
| **Database** | MySQL (8.x) + Prisma ORM | Relational schema with 20+ entities, deterministic indexing |
| **ATS Scoring** | In-Process Hybrid Engine | Rule-based SQL matching + TF-IDF cosine text similarity (`natural`) |
| **Process & Infra** | PM2 + Nginx (Single VPS) | Zero Docker, Zero Redis, pure lean production deployment |
| **CI / CD** | GitHub Actions | Automated lint, typecheck, unit/integration testing, and build checks |

---

## 📁 Monorepo Structure

```text
recruitment-platform/
├── frontend/               # Vite + React 18 + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── app/            # App shell: Router, Providers, Auth Context
│   │   ├── components/     # UI primitives (ScoreBadge, Button, FormField...) & Shared
│   │   ├── pages/          # Role-based views (Applicant, Recruiter, Admin, Auth)
│   │   └── lib/            # Axios API client, Tailwind utility helpers
│   └── tests/              # Vitest + React Testing Library component tests
│
├── backend/                # Express.js + TypeScript Modular Monolith
│   ├── prisma/             # schema.prisma & seed.ts
│   ├── src/
│   │   ├── config/         # Strongly-typed environment configuration (Zod)
│   │   ├── db/             # Prisma client singleton
│   │   ├── middleware/     # Error handler, JWT auth, RBAC, Rate limiter, Logger
│   │   ├── modules/        # Domain modules (auth, ats-scoring, applicant, job, etc.)
│   │   └── jobs/           # In-process background job scheduler (node-cron)
│   └── tests/              # Vitest + Supertest integration & unit test suites
│
├── shared/                 # @recruitment-platform/shared (API envelopes, types, enums)
├── docs/                   # Product & Engineering documentation
│   ├── Recruitment_Platform_SRS.md
│   ├── Epic_Backlog.md
│   └── epics/              # Per-epic summary files (e.g. epic-00.md)
│
├── nginx/                  # Production Nginx reverse-proxy configuration
└── .github/workflows/      # GitHub Actions CI pipeline
```

---

## 🛠️ Development Environment Setup Guidelines

### 1. Prerequisites
Ensure the following tools are installed on your machine:
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **npm**: `v10.x` or later
- **MySQL**: MySQL 8.0+ server installed and running locally (e.g., on default port `3306` or `3308`)
- **Git**: Git 2.30+

---

### 2. Clone & Install Dependencies
Clone the repository and install dependencies across all npm workspaces:
```bash
git clone https://github.com/ShashimalMadhuwantha/recruitment-platform-dev.git
cd recruitment-platform-dev
npm install
```

---

### 3. Environment Variables Configuration

Create the environment files from the provided templates:

#### Backend Configuration (`backend/.env`):
Create `backend/.env` with your database and authentication settings:
```env
# Server Environment
NODE_ENV=development
PORT=5000

# MySQL Database Connection (Adjust port 3306 / 3308 and credentials as needed)
DATABASE_URL="mysql://root:root@localhost:3308/recruitment_ats_db"

# JWT Authentication
JWT_SECRET="super-secret-jwt-key-recruitment-platform-2026-min-32-chars"
JWT_EXPIRES_IN="7d"

# CORS Origin
CORS_ORIGIN="http://localhost:5173"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Seed Super Admin
ADMIN_INITIAL_EMAIL="admin@atsplatform.local"
ADMIN_INITIAL_PASSWORD="AdminSecurePassword123!"
```

#### Frontend Configuration (`frontend/.env`):
Create `frontend/.env`:
```env
VITE_API_BASE_URL="http://localhost:5000/api"
```

#### Root Configuration (`.env`):
Optionally create `.env` at root mirroring the backend values for root-level tool convenience.

---

### 4. Database Setup & Seeding

Run the following commands from the root directory:

```bash
# 1. Generate the Prisma Client
npm run db:generate --workspace=backend

# 2. Push schema to MySQL database (creates tables & indexes)
npx prisma db push --schema=./backend/prisma/schema.prisma

# 3. Seed baseline Super Admin & 20+ Master taxonomy skills
npm run db:seed --workspace=backend
```

#### Default Seeded Credentials:
- **Super Admin Email:** `admin@atsplatform.local`
- **Super Admin Password:** `AdminSecurePassword123!`

---

### 5. Starting the Development Servers

#### Option A: Run Both Concurrently (Recommended)
From the root directory:
```bash
npm run dev
```
- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

#### Option B: Run Services Separately
In Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

In Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

---

## 🧪 Testing & Validation

Run test suites and typecheck across all workspaces:

```bash
# Typecheck TypeScript across shared, backend, and frontend
npm run typecheck

# Run all test suites
npm run test

# Run backend unit & integration tests (Vitest + Supertest)
npm run test:backend

# Run frontend component tests (Vitest + React Testing Library)
npm run test:frontend

# Build all packages for production
npm run build
```

---

## 🌿 Git Branching & Contribution Workflow

Per the development guidelines in `.agent/skills/recruitment-platform-dev/SKILL.md`:

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
   Always run `npm run typecheck` and `npm run test` before pushing.

---

## 🚢 Single-VPS Deployment (PM2 + Nginx)

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
