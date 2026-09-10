# Epic 4: Super Admin: System Configuration

## Overview
Epic 4 delivers platform-wide system configuration controls for Super Administrators as specified in `docs/Recruitment_Platform_SRS.md` (§3.1, §4.3, §5.1, §6, §7.1) and `docs/Epic_Backlog.md`. It empowers administrators to configure global ATS scoring algorithms, manage standardized master taxonomy dictionaries (skills with synonym recognition, industries, locations), edit dynamic notification templates with sample previews, test third-party integrations (SMTP, OAuth, Zoom), and toggle feature flag capability tiers.

---

## 1. Features Implemented

### 1.1 Global ATS Weight Configuration
- **Endpoint**: `GET /api/v1/admin/config/ats-weights` & `PUT /api/v1/admin/config/ats-weights`
- **Validation**: Enforces strict `sum(weights) === 1.0` (100%) validation across all 5 score dimensions:
  - `skillsWeight` (default: 40%)
  - `experienceWeight` (default: 25%)
  - `educationWeight` (default: 15%)
  - `semanticWeight` (default: 15%)
  - `certificationWeight` (default: 5%)
- **Presets Available**: Standard Balanced, Engineering & Technical Roles, Executive & Leadership, and Entry-Level & Graduate Hiring.
- **Frontend UI**: Interactive real-time sliders, live percentage distribution visualizer bar, preset buttons, and 100% balance validation badges.

### 1.2 Master Data & Taxonomy Management
- **Skills Taxonomy (`/api/v1/admin/config/skills`)**:
  - CRUD operations with recognized aliases/synonyms (e.g. "ReactJS", "React.js" -> "React").
  - Cascade protection: Rejects deletion if a skill is currently referenced by applicant profiles or job vacancy requirement models.
- **Industry Sectors (`/api/v1/admin/config/industries`)**:
  - Standardized business categories (Technology, Finance, Healthcare, Retail, etc.).
- **Locations & Remote Hubs (`/api/v1/admin/config/locations`)**:
  - Global standardized city, state, country dictionary with `isRemoteAllowed` hub indicators.

### 1.3 Automated Notification Template Editor
- **Endpoint**: `/api/v1/admin/config/notification-templates`
- **Variable Tokens**: Supports dynamic injection for `{{candidate_name}}`, `{{job_title}}`, `{{company_name}}`, `{{stage_name}}`, `{{interview_time}}`, `{{meeting_link}}`, `{{portal_url}}`, etc.
- **Live Preview**: Replaces tokens with realistic mock context strings in real time.

### 1.4 Third-Party Integration Settings
- **Endpoint**: `/api/v1/admin/config/integrations` & `/api/v1/admin/config/integrations/:provider/test`
- **Providers**: `SMTP_EMAIL`, `GOOGLE_OAUTH`, `LINKEDIN_OAUTH`, `ZOOM_CALENDAR`.
- **Connection Testing**: Verifies mandatory parameters (host/fromEmail for SMTP, client ID for OAuth, API keys for Zoom) and updates status badges (`CONNECTED`, `NOT_CONFIGURED`, `ERROR`).

### 1.5 Feature Flags & Plan Tier Matrix
- **Endpoint**: `/api/v1/admin/config/feature-flags` & `PUT /api/v1/admin/config/feature-flags/:key`
- **Capability Matrix**: Configures feature entitlement across `FREE`, `PRO`, `ENTERPRISE` plan tiers.
- **Global Master Kill-switch**: Instantly toggle individual capabilities platform-wide.

---

## 2. API Endpoints Reference

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/api/v1/admin/config/ats-weights` | Get default ATS score weights and presets | Super Admin |
| `PUT` | `/api/v1/admin/config/ats-weights` | Update default ATS weights (must sum to 100%) | Super Admin |
| `GET` | `/api/v1/admin/config/skills` | List skills taxonomy with search, category & aliases | Super Admin |
| `POST` | `/api/v1/admin/config/skills` | Create new taxonomy skill | Super Admin |
| `PUT` | `/api/v1/admin/config/skills/:id` | Update skill category or aliases | Super Admin |
| `DELETE` | `/api/v1/admin/config/skills/:id` | Delete unused skill | Super Admin |
| `GET` | `/api/v1/admin/config/industries` | List industry master data | Super Admin |
| `POST` | `/api/v1/admin/config/industries` | Create industry sector | Super Admin |
| `DELETE` | `/api/v1/admin/config/industries/:id` | Delete industry | Super Admin |
| `GET` | `/api/v1/admin/config/locations` | List locations and remote hubs | Super Admin |
| `POST` | `/api/v1/admin/config/locations` | Create location | Super Admin |
| `DELETE` | `/api/v1/admin/config/locations/:id` | Delete location | Super Admin |
| `GET` | `/api/v1/admin/config/notification-templates` | List automated email/SMS templates | Super Admin |
| `PUT` | `/api/v1/admin/config/notification-templates/:id` | Update template subject and body | Super Admin |
| `POST` | `/api/v1/admin/config/notification-templates/:id/preview` | Render preview with token interpolation | Super Admin |
| `GET` | `/api/v1/admin/config/integrations` | List integration provider settings | Super Admin |
| `PUT` | `/api/v1/admin/config/integrations/:provider` | Update integration configuration | Super Admin |
| `POST` | `/api/v1/admin/config/integrations/:provider/test` | Test integration connection | Super Admin |
| `GET` | `/api/v1/admin/config/feature-flags` | List feature flags & plan tier matrix | Super Admin |
| `PUT` | `/api/v1/admin/config/feature-flags/:key` | Update flag allowed tiers and global toggle | Super Admin |

---

## 3. Database Schema Models Added

```prisma
model Industry {
  id        String   @id @default(uuid())
  name      String   @unique
  category  String?
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  @@map("industries")
}

model Location {
  id              String   @id @default(uuid())
  city            String
  state           String?
  country         String   @default("United States")
  isRemoteAllowed Boolean  @default(true) @map("is_remote_allowed")
  isActive        Boolean  @default(true) @map("is_active")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  @@unique([city, state, country])
  @@map("locations")
}

model NotificationTemplate {
  id            String              @id @default(uuid())
  name          String
  code          String              @unique
  channel       NotificationChannel @default(EMAIL)
  subject       String
  body          String              @db.Text
  variablesJson Json?               @map("variables_json")
  isActive      Boolean             @default(true) @map("is_active")
  createdAt     DateTime            @default(now()) @map("created_at")
  updatedAt     DateTime            @updatedAt @map("updated_at")
  @@map("notification_templates")
}

model SystemIntegrationSetting {
  id           String              @id @default(uuid())
  provider     IntegrationProvider @unique
  configJson   Json?               @map("config_json")
  status       IntegrationStatus   @default(NOT_CONFIGURED)
  lastTestedAt DateTime?           @map("last_tested_at")
  errorMessage String?             @map("error_message") @db.Text
  createdAt    DateTime            @default(now()) @map("created_at")
  updatedAt    DateTime            @updatedAt @map("updated_at")
  @@map("system_integration_settings")
}

model FeatureFlag {
  id                String   @id @default(uuid())
  key               String   @unique
  name              String
  description       String?  @db.Text
  enabledTiersJson  Json?    @map("enabled_tiers_json")
  isGloballyEnabled Boolean  @default(true) @map("is_globally_enabled")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")
  @@map("feature_flags")
}
```

---

## 4. Verification & Testing

- **Backend Unit & Integration Tests**: `backend/src/modules/system-config/system-config.test.ts` (17 tests passing, covering weight validations, master taxonomy CRUD, token rendering, connection tests, and feature flags).
- **Frontend Unit Tests**: `frontend/tests/unit/SystemConfigFlow.test.tsx` (5 comprehensive test suites passing).
- **TypeScript Typecheck**: 100% strict compliance across `shared`, `backend`, and `frontend`.
- **Production Build**: `npm run build` builds all monorepo workspaces cleanly.
