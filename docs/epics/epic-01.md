# Epic 1 — Authentication & Access Control

- **Epic Number:** 1
- **Epic Title:** Authentication & Access Control
- **Integration Branch:** `epic/01-auth-access-control`
- **Status:** Completed
- **Reference SRS:** Sections 3.1, 4.1, 4.2, 5.1, 6.1, 6.2, 7.1

---

## 1. Overview & Goal

The goal of Epic 1 was to implement a complete, secure, production-ready authentication and authorization system supporting multiple user roles (`SUPER_ADMIN`, `RECRUITER`, `APPLICANT`), recruiter sub-roles (`COMPANY_ADMIN`, `HIRING_MANAGER`, `INTERVIEWER`), OAuth2 social logins (Google & LinkedIn), short-lived JWT access tokens with rotating refresh tokens, granular RBAC middleware, TOTP two-factor authentication (MFA), password reset flows, and role-guarded frontend routing.

---

## 2. Tasks Delivered

| Task | Purpose | Branch | Files Created / Modified |
|---|---|---|---|
| **Email/Password Auth & Registration** | Bcrypt (cost 10) password hashing, multi-role registration (Applicant vs Recruiter/Company), and login endpoints. | `feature/01-email-auth` | `backend/src/modules/auth/*`, `frontend/src/pages/auth/LoginPage.tsx`, `frontend/src/pages/auth/RegisterPage.tsx` |
| **OAuth2 Social Login** | Google and LinkedIn OAuth2 authentication flow with user profile upserting and JWT issuance. | `feature/01-google-oauth`, `feature/01-linkedin-oauth` | `backend/src/modules/auth/auth.service.ts`, `backend/src/modules/auth/auth.controller.ts`, `frontend/src/components/ui/OAuthButtons.tsx` |
| **JWT Access & Refresh Token Rotation** | 15-minute access tokens with SHA-256 hashed refresh tokens (7 days) and Axios silent refresh interceptor with request queuing. | `feature/01-jwt-middleware` | `backend/src/middleware/auth.middleware.ts`, `backend/prisma/schema.prisma`, `frontend/src/lib/api-client.ts`, `frontend/src/app/providers.tsx` |
| **Role-Based Access Control (RBAC)** | Strict role and recruiter sub-role authorization middleware and frontend ProtectedRoute guards. | `feature/01-rbac-middleware` | `backend/src/middleware/rbac.middleware.ts`, `frontend/src/components/shared/ProtectedRoute.tsx`, `frontend/src/app/router.tsx` |
| **Password Reset & TOTP MFA** | Secure time-limited password reset tokens, in-process TOTP MFA generation/verification, and backup codes. | `feature/01-password-reset-mfa` | `backend/src/modules/auth/auth.service.ts`, `frontend/src/pages/auth/ForgotPasswordPage.tsx`, `frontend/src/pages/auth/ResetPasswordPage.tsx`, `frontend/src/pages/auth/MfaVerificationPage.tsx` |

---

## 3. Architecture & Technical Decisions

### Database & Security Enhancements
- **RefreshToken Table:** Persists hashed refresh tokens (`tokenHash`), `userId`, `familyId`, `expiresAt`, `revokedAt`, and `replacedByTokenHash` to detect and mitigate token reuse attacks.
- **PasswordResetToken Table:** 1-hour expiry tokens hashed via SHA-256 before storage to prevent plaintext leaks.
- **Bcrypt Salt Rounds:** 10 rounds for user password hashing.
- **Zero External Auth Services:** Uses native Node.js crypto and JWT utilities without reliance on Auth0 or Firebase.

### API Endpoints
All endpoints follow the standard envelope format `{ data: T | null, error: ApiError | null }`:

- `POST /api/v1/auth/register/applicant`: Registers job seeker, creates `ApplicantProfile`.
- `POST /api/v1/auth/register/recruiter`: Registers employer with company info, creates `Company` and `RecruiterProfile` with sub-role.
- `POST /api/v1/auth/login`: Authenticates credentials, checks MFA status, issues access/refresh tokens.
- `POST /api/v1/auth/refresh`: Validates refresh token and issues rotated token pair.
- `POST /api/v1/auth/logout`: Revokes refresh token family.
- `GET /api/v1/auth/me`: Returns authenticated user context.
- `GET /api/v1/auth/google`, `GET /api/v1/auth/google/callback`: OAuth2 Google login flow.
- `GET /api/v1/auth/linkedin`, `GET /api/v1/auth/linkedin/callback`: OAuth2 LinkedIn login flow.
- `POST /api/v1/auth/password-reset/request`: Initiates password recovery token.
- `POST /api/v1/auth/password-reset/confirm`: Validates reset token and sets new hashed password.
- `POST /api/v1/auth/mfa/setup`: Generates base32 secret, otpauth URI, and QR code representation.
- `POST /api/v1/auth/mfa/verify`: Validates TOTP token and enables MFA on account.
- `POST /api/v1/auth/mfa/challenge`: Authenticates 2FA step during login with temporary token.

### Frontend Auth Experience
- **Role Switching:** Clear segmented tabs on Login and Register pages.
- **Silent Refresh Interceptor:** Axios handles 401 errors, requests a new access token via `/api/v1/auth/refresh`, and resumes queued API calls seamlessly.
- **Route Protection:** `<ProtectedRoute>` prevents unauthorized access and gracefully redirects users based on their authenticated role.

---

## 4. Verification & Test Results

```text
✓ Monorepo Typecheck: PASSED (0 errors across @recruitment-platform/shared, backend, frontend)
✓ Backend Tests (vitest): 17/17 PASSED
  - ats-scoring.test.ts (6 tests)
  - auth.test.ts (9 tests: applicant/recruiter registration, login, token rotation, password reset, MFA setup/verify, OAuth)
  - health.test.ts (2 tests)
✓ Frontend Tests (vitest): 12/12 PASSED
  - ScoreBadge.test.tsx (4 tests)
  - AuthFlow.test.tsx (8 tests: Login, Register role switching, Forgot/Reset password, ProtectedRoute guards)
✓ Production Build (npm run build): PASSED
```

---

## 5. Next Steps

- Proceed to **Epic 2: Job Vacancy & Pipeline Management** (`epic/02-job-pipeline`):
  - Job vacancy creation and publishing workflows with skill requirement tagging.
  - Multi-stage pipeline definitions (Applied, Screening, Shortlisted, Interview, Offer, Hired, Rejected).
  - Recruiter Kanban board and candidate stage transitions.
