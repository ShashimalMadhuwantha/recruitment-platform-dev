# Epic 18 — Applicant: Company Discovery & Employer Profile Hub

**Target Branch:** `epic/18-applicant-company-discovery`  
**Status:** Planned / Ready for Implementation  
**Covers SRS Requirements:** FR-AP-31, FR-AP-32, FR-AP-33, FR-AP-34, FR-AP-35, FR-RC-01  
**Design Skill Activated:** `recruitment-platform-frontend-design`  
**Dev Skill Activated:** `recruitment-platform-dev`

---

## 1. Overview & Business Objectives

Modern job seekers prioritize authentic workplace culture, transparent values, and organizational credibility before investing time in job applications. While Epic 17 empowered recruiters to configure employer branding (cover banners, multi-office directories, culture media, and social links), job seekers currently only interact with isolated job postings without a dedicated mechanism to explore the hiring companies behind those openings.

Epic 18 closes this critical loop by delivering an end-to-end **Company Discovery & Employer Profile Hub** for applicants and guests. Job seekers can browse verified hiring organizations, explore immersive employer branding pages, inspect multi-city office footprints, watch workplace culture videos, evaluate all active openings with predicted ATS match scores, and follow companies to receive automatic alerts when new vacancies are published.

### 1.1 Key User Value Propositions
- **For Job Seekers (Applicants)**:
  - Discover reputable hiring organizations filtered by industry, office location, and team size.
  - Learn about team culture, mission, perks, and working environment through high-res photo and video galleries.
  - Explore all open requisitions from a specific company in one unified view, complete with real-time predicted ATS match scores.
  - Follow preferred employers to stay updated on future hiring opportunities.
- **For Hiring Organizations (Recruiters & Companies)**:
  - Maximize the ROI of employer branding assets configured in Epic 17 (`FR-RC-01`).
  - Differentiate employer brand from competitors to attract higher-caliber talent.
  - Build organic talent followings and pipelines directly on the platform.

---

## 2. Detailed Functional Breakdown

### 2.1 Public Company Directory & Search (`FR-AP-31`)
- **Dedicated Route**: `/companies` accessible to both public visitors and authenticated applicants.
- **Search & Filter Bar**:
  - Keyword search matching company name, industry, and mission keywords.
  - Industry multi-select filter (e.g., Software & Technology, FinTech, Healthcare, E-Commerce).
  - Location filter matching headquarters or satellite office cities.
  - Company Size filter (1-10, 11-50, 51-200, 201-500, 500+ employees).
  - "Has Active Openings" toggle to surface actively hiring teams first.
  - Sort options: Most Active Jobs, Most Followed, Alphabetical (A-Z), Recently Joined.
- **Company Directory Cards**:
  - Branded header banner, logo avatar with fallback initials, company name, industry, and headquarters city.
  - "X Active Openings" badge with direct link to their vacancies.
  - Follower count and one-click "Follow" button.
  - Brief 2-line company mission summary.

### 2.2 Rich Employer Branding Profile View (`FR-AP-32`)
- **Dedicated Route**: `/companies/:idOrSlug` (supporting both UUID and URL-friendly company slugs).
- **Hero Employer Banner**:
  - Full-width cover photo banner with responsive aspect ratio and subtle gradient overlay.
  - High-res corporate logo avatar with verified company badge.
  - Key metadata bar: Company Name, Industry, Company Size, Founded Year, Website Link, Follow Button, and Share Profile button.
- **Tabbed Experience**:
  1. **Overview & Culture**:
     - "About Us" deep-dive narrative highlighting mission, core values, and employee benefits/perks.
     - **Workplace Culture Media Gallery**: Interactive responsive photo grid and video embeds showcasing team offsites, hackathons, and office life with lightbox modal view.
     - **Leadership & Social Presence**: Verified external links (LinkedIn, Twitter/X, GitHub, Company Website).
  2. **Office Locations Directory**:
     - Comprehensive directory of headquarters and regional branches (`city`, `state`, `country`, `street address`).
     - Distinct green `HQ` badge for primary headquarters.
  3. **Active Job Openings (`FR-AP-33`)**:
     - Real-time catalog of all published vacancies from this specific employer.
     - Integrated **Predicted ATS Match Score** badge for logged-in applicants so candidates instantly see their qualification fit.
     - Department and location pills, employment type (`Full-time`, `Remote`, `Hybrid`), and 1-click apply triggers.

### 2.3 Cross-Platform Navigation & Deeplinking (`FR-AP-34`)
- Make company branding ubiquitous throughout the applicant experience:
  - **Job Search Results (`/jobs`)**: Company name and logo in job cards become clickable links navigating directly to `/companies/:idOrSlug`.
  - **Job Detail Page (`/jobs/:id`)**: Header company avatar, name, and "About the Company" sidebar widget link directly to the full company profile.
  - **Applicant Dashboard (`/applicant/dashboard`)**: Applied job cards display linked company names for quick employer reference.

### 2.4 Company Follow & Vacancy Alerts (`FR-AP-35`)
- **Follow / Unfollow Action**: Authenticated applicants can follow any hiring organization with a single click.
- **Following Hub**: Applicants can view and manage their followed companies under `/applicant/profile?tab=following` or a dedicated section.
- **New Requisition Alerts**: When a followed company publishes a new vacancy, automated in-app and email notifications are dispatched to followers.

---

## 3. Architecture & Data Model Additions

### 3.1 Database Schema (`backend/prisma/schema.prisma`)

```prisma
// 1. Company Follower Relation (FR-AP-35)
model CompanyFollow {
  id          String   @id @default(uuid())
  applicantId String   @map("applicant_id")
  companyId   String   @map("company_id")
  createdAt   DateTime @default(now()) @map("created_at")

  applicant   User     @relation("ApplicantCompanyFollows", fields: [applicantId], references: [id], onDelete: Cascade)
  company     Company  @relation("CompanyFollowers", fields: [companyId], references: [id], onDelete: Cascade)

  @@unique([applicantId, companyId], name: "unique_applicant_company_follow")
  @@index([companyId])
  @@index([applicantId])
  @@map("company_follows")
}

// 2. Extend User model with followed companies relation
model User {
  // ... existing fields
  followedCompanies CompanyFollow[] @relation("ApplicantCompanyFollows")
}

// 3. Extend Company model with followers relation
model Company {
  // ... existing fields
  followers CompanyFollow[] @relation("CompanyFollowers")
}
```

### 3.2 Shared Contracts (`shared/src/types/index.ts`)

```typescript
export interface PublicCompanySummaryDto {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string | null;
  coverPhotoUrl?: string | null;
  industry?: string | null;
  size?: string | null;
  location?: string | null;
  headquarters?: {
    city: string;
    country: string;
  } | null;
  description?: string | null;
  activeJobsCount: number;
  followersCount: number;
  isFollowed?: boolean;
}

export interface PublicCompanyDetailDto extends PublicCompanySummaryDto {
  website?: string | null;
  locations: CompanyLocation[];
  cultureMedia: CultureMediaItem[];
  socialLinks: CompanySocialLinks;
}

export interface PublicCompanyJobsResponseDto {
  company: {
    id: string;
    name: string;
    logoUrl?: string | null;
  };
  jobs: Array<{
    id: string;
    title: string;
    department?: string | null;
    location?: string | null;
    employmentType: EmploymentType;
    salaryMin?: number | null;
    salaryMax?: number | null;
    salaryCurrency?: string | null;
    createdAt: string;
    deadline?: string | null;
    predictedAtsScore?: number | null;
    scoreBand?: ScoreBand | null;
  }>;
  totalJobs: number;
}

export interface ToggleCompanyFollowResponseDto {
  followed: boolean;
  followersCount: number;
  message: string;
}
```

---

## 4. API Endpoints Specification

### 4.1 Company Discovery API
- **`GET /api/v1/companies/public`**
  - *Access*: Public (Anonymous & Authenticated)
  - *Query Parameters*: `search`, `industry`, `location`, `size`, `hasActiveJobs`, `sortBy`, `page`, `limit`
  - *Returns*: Paginated list of `PublicCompanySummaryDto` items with total count.
- **`GET /api/v1/companies/public/:idOrSlug`**
  - *Access*: Public
  - *Params*: `idOrSlug` (UUID or unique URL slug)
  - *Returns*: Full `PublicCompanyDetailDto` including locations, culture media, social links, and follower status.
- **`GET /api/v1/companies/public/:idOrSlug/jobs`**
  - *Access*: Public (with optional applicant JWT token)
  - *Returns*: List of published active vacancies with predicted ATS scores for authenticated applicants.
- **`POST /api/v1/companies/:id/follow`**
  - *Access*: Authenticated (`APPLICANT`)
  - *Returns*: `{ followed: boolean, followersCount: number, message: string }`.
- **`GET /api/v1/companies/followed`**
  - *Access*: Authenticated (`APPLICANT`)
  - *Returns*: Array of companies followed by the active user.

---

## 5. UI/UX Design System Compliance

Adhering strictly to `recruitment-platform-frontend-design`:
1. **Typography & Layout**:
   - Clean Inter typography hierarchy with sentence-case headers.
   - Standard 4px/8px grid spacing with responsive padding (`px-4 sm:px-6 lg:px-8`).
2. **Company Directory Cards**:
   - `rounded-2xl` cards with subtle `border border-border-default` and hover elevation (`hover:shadow-md hover:border-brand-300`).
   - Top mini-banner preview with circular avatar badge overlapping the banner.
   - Tag pills with consistent color coding: Industry (Indigo), Location (Emerald), Active Jobs (Brand blue).
3. **Hero Header on Company Profile**:
   - Dynamic cover banner (1200x320 recommended aspect) with smooth dark gradient scrim.
   - Logo container with white border isolation preventing color clashes with banner imagery.
   - Accessible tab navigation (`Overview`, `Jobs`, `Locations`) with animated active underlines.
4. **Media Lightbox Modal**:
   - Dark modal overlay (`bg-black/80 backdrop-blur-sm`) with high-resolution photo display and caption bar.
5. **Navigation Header Updates**:
   - Add **`Companies`** link to the primary header for both guests and authenticated applicants (`Find Jobs`, `Companies`, `Dashboard`).

---

## 6. Implementation Task Breakdown

| Task ID | Component / Requirement | Description | Target Files |
|---|---|---|---|
| **TASK-18-1** | Database Schema & Migrations | Create `CompanyFollow` model with compound index, relations to `User` and `Company`, and run migration | `backend/prisma/schema.prisma` |
| **TASK-18-2** | Shared Contracts & DTOs | Define public company list/detail DTOs, job responses with ATS scores, and follow responses | `shared/src/types/index.ts` |
| **TASK-18-3** | Backend Company Discovery Module | Implement `CompanyDiscoveryService`, controller, search queries, and follow/unfollow engine | `backend/src/modules/company-discovery/*` |
| **TASK-18-4** | Public Company Routes Mounting | Mount `/api/v1/companies/public` and follow routes with optional auth token decoding for ATS scoring | `backend/src/app.ts`, `company-discovery.routes.ts` |
| **TASK-18-5** | Frontend API Client & Query Hooks | Create `companyDiscoveryApi` and hooks (`usePublicCompanies`, `usePublicCompanyDetail`, `useCompanyJobs`, `useToggleFollowCompany`) | `frontend/src/features/company-discovery/*` |
| **TASK-18-6** | Frontend Components & Lightbox | Build `CompanyDirectoryCard`, `CompanyFilterBar`, `CompanyHeroBanner`, `CompanyCultureGallery`, `CompanyLocationsList`, `CompanyActiveJobsList` | `frontend/src/features/company-discovery/components/*` |
| **TASK-18-7** | Frontend Pages & Routing | Build `CompanyDirectoryPage.tsx` (`/companies`), `CompanyPublicProfilePage.tsx` (`/companies/:idOrSlug`), and register in router | `frontend/src/pages/applicant/*`, `frontend/src/app/router.tsx` |
| **TASK-18-8** | Cross-Platform Links & Header Nav | Add "Companies" link to `Header.tsx`, link company names in `JobSearchPage` and `JobDetailPage` | `frontend/src/components/shared/Header.tsx`, `JobSearchPage.tsx`, `JobDetailPage.tsx` |
| **TASK-18-9** | Automated Testing & Verification | Write unit tests for backend search/follow service, controller endpoints, and frontend UI directory/profile flow | `backend/src/modules/company-discovery/company-discovery.test.ts`, `frontend/tests/unit/CompanyDiscoveryFlow.test.tsx` |

---

## 7. Verification & Definition of Done

1. **Company Directory & Search**:
   - `/companies` displays all active, verified employers.
   - Searching by company name, industry, or location filters the list dynamically.
   - Filtering by "Has Active Openings" excludes companies with 0 active jobs.
2. **Employer Profile Page**:
   - `/companies/:id` and `/companies/:slug` render the cover banner, logo, bio, culture gallery, and office directory.
   - Clicking photos in the culture gallery opens the lightbox modal with captions.
   - Office locations accurately display the primary headquarters badge.
3. **Active Job Openings & ATS Match**:
   - "Jobs" tab lists all published vacancies for that specific tenant.
   - When viewed by a logged-in applicant, each job displays their real-time predicted ATS match score.
   - Clicking "Apply" opens the application flow pre-filled for that vacancy.
4. **Company Follow Alerts**:
   - Clicking "Follow" updates the button to "Following" and increments the follower counter.
   - Unfollowing decrements the count and removes the relationship.
5. **Cross-Linking**:
   - Clicking any company name or logo from `/jobs` or `/jobs/:id` seamlessly navigates to `/companies/:id`.
