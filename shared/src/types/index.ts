// User Roles
export type UserRole = 'SUPER_ADMIN' | 'RECRUITER' | 'APPLICANT';

export type RecruiterSubRole = 'COMPANY_ADMIN' | 'HIRING_MANAGER' | 'INTERVIEWER';

export type UserStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED' | 'BANNED';

// Company Status
export type CompanyStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

// Subscription Plans
export type PlanTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: PlanTier;
  description?: string | null;
  maxJobPosts: number;
  maxSeats: number;
  maxAtsScans: number;
  priceMonthly: number | string;
  featuresJson?: Record<string, boolean> | null;
  createdAt?: string;
  updatedAt?: string;
}

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
  isImpersonating?: boolean;
  impersonatorId?: string | null;
}

// Super Admin Platform Statistics
export interface AdminPlatformStats {
  totalUsers: number;
  totalApplicants: number;
  totalRecruiters: number;
  pendingCompaniesCount: number;
  activeCompaniesCount: number;
  totalJobsCount: number;
}

// Audit Log Entry
export interface AuditLogEntry {
  id: string;
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  detailsJson?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  actor?: {
    id: string;
    email: string;
    role: UserRole;
  } | null;
}

// -------------------------------------------------------------
// Moderation & Compliance Types
// -------------------------------------------------------------
export type ReportTargetType = 'JOB_POSTING' | 'APPLICANT_PROFILE' | 'CV';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface ContentReport {
  id: string;
  reporterId?: string | null;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  description?: string | null;
  status: ReportStatus;
  resolutionAction?: string | null;
  resolutionNotes?: string | null;
  resolvedById?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  reporter?: {
    id: string;
    email: string;
    role: UserRole;
  } | null;
  targetDetails?: {
    title?: string;
    name?: string;
    email?: string;
    companyName?: string;
    status?: string;
    description?: string;
  } | null;
}

export type BannedKeywordCategory = 'DISCRIMINATION' | 'SPAM' | 'OFFENSIVE' | 'MISLEADING';

export interface BannedKeyword {
  id: string;
  keyword: string;
  category: BannedKeywordCategory;
  severity: 'BLOCK' | 'WARN' | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type GdprRequestType = 'DATA_EXPORT' | 'ERASURE';
export type GdprRequestStatus = 'SUBMITTED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';

export interface GdprRequest {
  id: string;
  userId: string;
  requestType: GdprRequestType;
  status: GdprRequestStatus;
  slaDeadline: string;
  detailsJson?: Record<string, unknown> | null;
  rejectionReason?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  };
}

export interface ModerationStats {
  pendingJobReports: number;
  pendingProfileReports: number;
  totalBannedKeywords: number;
  openGdprRequests: number;
}

