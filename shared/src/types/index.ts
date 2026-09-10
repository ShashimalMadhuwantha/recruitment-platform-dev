// User Roles
export type UserRole = 'SUPER_ADMIN' | 'RECRUITER' | 'APPLICANT';

export type RecruiterSubRole = 'COMPANY_ADMIN' | 'HIRING_MANAGER' | 'INTERVIEWER';

export type UserStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED' | 'BANNED';

// Company Status
export type CompanyStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

// Job Status
export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'CLOSED' | 'FLAGGED';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'REMOTE';

export type SkillPriority = 'MUST_HAVE' | 'NICE_TO_HAVE';

// Application Pipeline Stages
export type ScoreBand = 'HIGH' | 'MID' | 'LOW';

export type ApplicationStatus =
  | 'APPLIED'
  | 'SCREENING'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'OFFER'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN';

// ATS Scoring Models & Breakdowns
export interface SubScoreDetail {
  score: number; // 0 to 1 or 0 to 100
  weight: number;
  weightedScore: number;
  details?: Record<string, unknown>;
  matchedItems?: string[];
  missingItems?: string[];
}

export interface AtsScoreBreakdown {
  overallScore: number; // 0 - 100
  scoreBand: 'HIGH' | 'MID' | 'LOW'; // HIGH (80-100), MID (50-79), LOW (0-49)
  bandLabel: 'Strong match' | 'Partial match' | 'Weak match';
  skillsMatch: SubScoreDetail;
  experienceMatch: SubScoreDetail;
  educationMatch: SubScoreDetail;
  semanticMatch: SubScoreDetail;
  certificationMatch: SubScoreDetail;
  topMatchingTerms: string[];
  computedAt: string;
}

export interface ScoreWeightConfig {
  skillsWeight: number; // default 40%
  experienceWeight: number; // default 25%
  educationWeight: number; // default 15%
  semanticWeight: number; // default 15%
  certificationWeight: number; // default 5%
}

// API Envelope Format (per recruitment-platform-dev rule)
export interface ApiSuccessResponse<T> {
  data: T;
  error: null;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  data: null;
  error: ApiErrorDetail;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// User Context
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  companyId?: string | null;
  recruiterSubRole?: RecruiterSubRole | null;
}
