# AI-Powered Recruitment & ATS Platform

A multi-tenant recruitment and ATS platform built as a modular monolith with React + TypeScript (Vite), Express.js + TypeScript, and MySQL.

## Tech Stack (per SRS §2.2 / §2.3)
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router DOM
- **Backend:** Express.js (Node.js + TypeScript) Modular Monolith
- **Database:** MySQL only with Prisma ORM
- **ATS Engine:** Hybrid rule-based SQL scoring + in-process TF-IDF cosine similarity (`natural`)
- **Process & Deploy:** PM2 + Nginx on a single VPS (Zero Docker, Zero Redis)

---

## Monorepo Structure

```text
├── frontend/               # Vite + React + TypeScript + Tailwind CSS
├── backend/                # Express.js + TypeScript Modular Monolith
│   ├── prisma/             # Schema & Seeds
│   └── src/modules/        # Domain modules (auth, ats-scoring, job-vacancy, etc.)
├── shared/                 # Shared types and API contracts (@recruitment-platform/shared)
├── nginx/                  # Nginx production reverse-proxy configuration
├── docs/                   # SRS and Epic Backlog documentation
└── .github/workflows/      # GitHub Actions CI pipeline
```

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` in `backend/` and `frontend/`:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Database Setup (MySQL)
Ensure your MySQL server is running and `DATABASE_URL` is set in `backend/.env`.
```bash
# Generate Prisma Client
npm run db:generate --workspace=backend

# Run Migrations
npm run db:migrate --workspace=backend

# Seed Baseline Super Admin & Master Taxonomy Data
npm run db:seed --workspace=backend
```

### 4. Development Server
Run both frontend and backend concurrently:
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- Health Check: `http://localhost:5000/api/health`

### 5. Running Tests
```bash
npm run test           # Run all tests
npm run test:backend   # Run backend Vitest suite
npm run test:frontend  # Run frontend component tests
```

---

## Deployment (PM2 + Nginx)

1. Build all workspaces:
```bash
npm run build
```
2. Start PM2 cluster:
```bash
pm2 start backend/ecosystem.config.js
```
3. Symlink or copy `nginx/recruitment-platform.conf` to `/etc/nginx/sites-available/` and reload Nginx.
