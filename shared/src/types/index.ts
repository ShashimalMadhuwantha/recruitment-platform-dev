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

// -------------------------------------------------------------
// System Configuration & Master Data (Epic 4)
// -------------------------------------------------------------
export type NotificationChannel = 'EMAIL' | 'IN_APP' | 'SMS';

export type IntegrationProvider =
  | 'SMTP_EMAIL'
  | 'GOOGLE_OAUTH'
  | 'LINKEDIN_OAUTH'
  | 'ZOOM_CALENDAR';

export type IntegrationStatus = 'CONNECTED' | 'NOT_CONFIGURED' | 'ERROR';

export interface SkillTaxonomyItem {
  id: string;
  name: string;
  category?: string | null;
  aliasesJson?: string[] | null;
  createdAt?: string;
  _count?: {
    applicantSkills?: number;
    jobRequiredSkills?: number;
  };
}

export type SkillMaster = SkillTaxonomyItem;

export interface IndustryItem {
  id: string;
  name: string;
  category?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocationItem {
  id: string;
  city: string;
  state?: string | null;
  country: string;
  isRemoteAllowed: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTemplateItem {
  id: string;
  name: string;
  code: string;
  channel: NotificationChannel;
  subject: string;
  body: string;
  variablesJson?: string[] | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemIntegrationSettingItem {
  id: string;
  provider: IntegrationProvider;
  configJson?: Record<string, unknown> | null;
  status: IntegrationStatus;
  lastTestedAt?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlagItem {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  enabledTiersJson?: PlanTier[] | null;
  isGloballyEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AtsWeightPreset {
  id: string;
  name: string;
  description: string;
  weights: ScoreWeightConfig;
}

// -------------------------------------------------------------
// Job Vacancy Management & Lifecycle (Epic 5)
// -------------------------------------------------------------
export interface ScreeningQuestion {
  id: string;
  question: string;
  type: 'YES_NO' | 'TEXT' | 'MULTIPLE_CHOICE';
  options?: string[];
  isKnockout: boolean;
  requiredAnswer?: string;
}

export interface JobRequiredSkillDto {
  skillId: string;
  priority: SkillPriority;
  weight?: number;
  minProficiency: number; // 1 - 5
  skill?: {
    id: string;
    name: string;
    category?: string | null;
  };
}

export interface JobRequirementDto {
  minExperienceYears?: number | null;
  maxExperienceYears?: number | null;
  educationLevel?: string | null;
  requiredCertifications?: string[] | null;
}

export interface CreateJobVacancyDto {
  title: string;
  description: string;
  requirementsSummary?: string | null;
  location?: string | null;
  employmentType?: EmploymentType;
  salaryMin?: number | null;
  salaryMax?: number | null;
  deadline?: string | null;
  status?: JobStatus; // DRAFT or PUBLISHED
  requirements?: JobRequirementDto;
  requiredSkills?: JobRequiredSkillDto[];
  screeningQuestions?: ScreeningQuestion[];
  atsWeightOverrides?: ScoreWeightConfig | null;
}

export interface UpdateJobVacancyDto extends Partial<CreateJobVacancyDto> {}

export interface JobVacancyDetail {
  id: string;
  companyId: string;
  title: string;
  description: string;
  requirementsSummary?: string | null;
  location?: string | null;
  employmentType: EmploymentType;
  salaryMin?: number | string | null;
  salaryMax?: number | string | null;
  status: JobStatus;
  deadline?: string | null;
  screeningQuestionsJson?: ScreeningQuestion[] | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
    logoUrl?: string | null;
    industry?: string | null;
  };
  jobRequirement?: JobRequirementDto | null;
  jobRequiredSkills?: JobRequiredSkillDto[];
  scoreWeightConfigs?: ScoreWeightConfig[];
  _count?: {
    applications?: number;
  };
}

export interface RecruiterJobListItem {
  id: string;
  companyId: string;
  title: string;
  location?: string | null;
  employmentType: EmploymentType;
  status: JobStatus;
  deadline?: string | null;
  createdAt: string;
  updatedAt: string;
  applicationsCount: number;
  stagesCount?: Record<string, number>;
}

export interface JobComplianceCheckResult {
  hasViolations: boolean;
  canPublish: boolean; // false if BLOCK violation found
  violations: Array<{
    keyword: string;
    category: string;
    severity: 'BLOCK' | 'WARN';
    reason: string;
  }>;
}

// -------------------------------------------------------------
// Applicant Profile & Resume Management (Epic 6)
// -------------------------------------------------------------
export type ProfileVisibility = 'PUBLIC' | 'PRIVATE' | 'ANONYMOUS';

export interface ProfileVisibilitySettings {
  visibility: ProfileVisibility;
  hideFromCompanies?: string[];
  allowRecruiterContact?: boolean;
}

export interface ProfileCompletenessBreakdown {
  score: number; // 0 to 100
  personalInfo: boolean; // 20%
  workExperience: boolean; // 25%
  education: boolean; // 20%
  skills: boolean; // 20%
  resumeAttached: boolean; // 15%
  suggestions: string[];
}

export interface ApplicantSkillDto {
  id: string;
  applicantId: string;
  skillId: string;
  proficiency: number; // 1 to 5
  yearsExperience?: number | null;
  skill?: {
    id: string;
    name: string;
    category?: string | null;
  };
}

export interface EducationDto {
  id: string;
  applicantId: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  gpa?: number | string | null;
  createdAt?: string;
}

export interface WorkExperienceDto {
  id: string;
  applicantId: string;
  companyName: string;
  title: string;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  description?: string | null;
  skillsUsedJson?: string[] | null;
  createdAt?: string;
}

export interface AchievementDto {
  id: string;
  applicantId: string;
  title: string;
  type?: string | null;
  description?: string | null;
  date?: string | null;
  issuer?: string | null;
  createdAt?: string;
}

export interface CertificationDto {
  id: string;
  applicantId: string;
  name: string;
  issuer: string;
  issueDate?: string | null;
  expiryDate?: string | null;
  credentialUrl?: string | null;
  createdAt?: string;
}

export interface PortfolioDto {
  id: string;
  applicantId: string;
  type: string;
  url: string;
  fileRef?: string | null;
  createdAt?: string;
}

export interface ParsedResumeData {
  summary?: string;
  contactInfo: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  detectedSkills: string[];
  workExperience: Array<{
    title: string;
    company: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    description?: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
  }>;
  certifications?: string[];
  rawTextPreview?: string;
}

export type CVTemplateType = 'MODERN_CLEAN' | 'TECHNICAL_ATS' | 'EXECUTIVE_CLASSIC';

export interface CVVersionDto {
  id: string;
  cvId: string;
  versionNumber: number;
  versionLabel: string;
  fileRef: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  parsedText?: string | null;
  parsedJson?: ParsedResumeData | null;
  createdFrom: 'UPLOAD' | 'BUILDER' | 'RESTORE' | string;
  templateName?: string | null;
  createdAt: string;
}

export interface CVDto {
  id: string;
  applicantId: string;
  fileRef: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  parsedText?: string | null;
  parsedJson?: ParsedResumeData | null;
  versionLabel?: string | null;
  isPrimary: boolean;
  parsingStatus?: string | null;
  createdFrom?: string | null;
  templateName?: string | null;
  createdAt: string;
  updatedAt?: string;
  versions?: CVVersionDto[];
}

export interface CVBuilderRequestDto {
  template: CVTemplateType;
  versionLabel: string;
  targetCvId?: string;
  includedSections: {
    summary: boolean;
    skills: boolean;
    experience: boolean;
    education: boolean;
    certifications: boolean;
    portfolio?: boolean;
  };
  selectedSkillIds?: string[];
  selectedExperienceIds?: string[];
  selectedEducationIds?: string[];
  selectedCertificationIds?: string[];
  customHeadline?: string;
  customSummary?: string;
  makePrimary?: boolean;
}

export interface SelectiveSyncDto {
  updateHeadline?: boolean;
  updateSummary?: boolean;
  selectedSkillNames?: string[];
  importExperiences?: boolean;
  importEducations?: boolean;
}

export interface UpdateCVLabelDto {
  versionLabel: string;
}

export interface ApplicantProfileDto {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  headline?: string | null;
  summary?: string | null;
  location?: string | null;
  visibilitySettings?: ProfileVisibilitySettings | null;
  completeness: ProfileCompletenessBreakdown;
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
  applicantSkills: ApplicantSkillDto[];
  educations: EducationDto[];
  workExperiences: WorkExperienceDto[];
  achievements: AchievementDto[];
  certifications: CertificationDto[];
  portfolios: PortfolioDto[];
  cvs: CVDto[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateApplicantProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  headline?: string | null;
  summary?: string | null;
  location?: string | null;
  visibilitySettings?: ProfileVisibilitySettings | null;
}

export interface AnonymizedProfileDto {
  applicantId: string;
  candidatePseudonym: string;
  headline?: string | null;
  summary?: string | null;
  generalLocation?: string | null;
  skills: Array<{
    name: string;
    category?: string | null;
    proficiency: number;
    yearsExperience?: number | null;
  }>;
  anonymizedExperiences: Array<{
    id: string;
    title: string;
    generalizedCompany: string;
    startDate: string;
    endDate?: string | null;
    isCurrent: boolean;
    description?: string | null;
    skillsUsed: string[];
  }>;
  anonymizedEducations: Array<{
    id: string;
    degree: string;
    fieldOfStudy?: string | null;
    institutionTier: string;
    endDate?: string | null;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    issueDate?: string | null;
  }>;
  completenessScore: number;
  blindRecruitmentNotice: string;
}

// -------------------------------------------------------------
// ATS Scoring & Pre-Apply Predictions (Epic 7)
// -------------------------------------------------------------
export interface PreApplyMatchPreviewDto {
  jobId: string;
  jobTitle: string;
  companyName: string;
  overallScore: number;
  scoreBand: ScoreBand;
  bandLabel: 'Strong match' | 'Partial match' | 'Weak match';
  breakdown: AtsScoreBreakdown;
  missingCriticalSkills: string[];
  missingNiceToHaveSkills: string[];
  experienceGap: number; // in years (0 if met/exceeded, negative if gap)
  educationMet: boolean;
  recommendations: string[];
}

export interface OverrideAtsScoreDto {
  overrideScore: number; // 0 to 100
  reason: string;
}

export interface AtsScoreDetailDto {
  id: string;
  applicationId: string;
  overallScore: number;
  scoreBand: ScoreBand;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  semanticTfidfScore: number;
  certificationScore: number;
  breakdown: AtsScoreBreakdown;
  topMatchingTerms: string[];
  manualOverrideScore?: number | null;
  overrideReason?: string | null;
  overrideById?: string | null;
  overrideBy?: {
    id: string;
    email: string;
    role: UserRole;
  } | null;
  computedAt: string;
  applicant?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    headline?: string | null;
  };
  job?: {
    id: string;
    title: string;
    companyName: string;
  };
}

export interface BatchRescoreResultDto {
  jobId: string;
  totalApplications: number;
  updatedScoresCount: number;
  averageScore: number;
  durationMs: number;
}

// -------------------------------------------------------------
// Job Search & Applicant Application Flow (Epic 8)
// -------------------------------------------------------------
export interface JobSearchFilters {
  keyword?: string;
  location?: string;
  employmentType?: EmploymentType;
  minSalary?: number;
  maxSalary?: number;
  remoteOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface PublicJobListItem {
  id: string;
  companyId: string;
  companyName: string;
  companyLogoUrl?: string | null;
  companyIndustry?: string | null;
  title: string;
  location?: string | null;
  employmentType: EmploymentType;
  salaryMin?: number | null;
  salaryMax?: number | null;
  deadline?: string | null;
  createdAt: string;
  requiredSkills: Array<{
    id: string;
    name: string;
    priority: SkillPriority;
    minProficiency: number;
  }>;
  isSaved?: boolean;
  hasApplied?: boolean;
}

export interface PublicJobDetailDto {
  id: string;
  companyId: string;
  companyName: string;
  companyLogoUrl?: string | null;
  companyIndustry?: string | null;
  title: string;
  description: string;
  requirementsSummary?: string | null;
  location?: string | null;
  employmentType: EmploymentType;
  salaryMin?: number | null;
  salaryMax?: number | null;
  deadline?: string | null;
  createdAt: string;
  requirements?: JobRequirementDto | null;
  requiredSkills: Array<{
    id: string;
    name: string;
    priority: SkillPriority;
    minProficiency: number;
    weight: number;
  }>;
  screeningQuestions?: ScreeningQuestion[];
  isSaved?: boolean;
  hasApplied?: boolean;
  applicationId?: string | null;
  applicationStatus?: ApplicationStatus | null;
}

export interface ScreeningAnswerItem {
  questionId: string;
  question: string;
  answer: string | boolean;
}

export interface SubmitApplicationDto {
  jobId: string;
  cvId?: string;
  coverLetter?: string;
  screeningAnswers?: ScreeningAnswerItem[];
}

export interface ApplicantApplicationListItem {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyLogoUrl?: string | null;
  location?: string | null;
  employmentType: EmploymentType;
  status: ApplicationStatus;
  appliedAt: string;
  withdrawnAt?: string | null;
  cvFileName?: string | null;
  overallScore?: number | null;
  scoreBand?: ScoreBand | null;
  canWithdraw: boolean;
}

export interface SavedJobDto {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyLogoUrl?: string | null;
  location?: string | null;
  employmentType: EmploymentType;
  salaryMin?: number | null;
  salaryMax?: number | null;
  deadline?: string | null;
  savedAt: string;
}

export interface WithdrawApplicationDto {
  reason?: string;
}

// -------------------------------------------------------------
// Recruiter Candidate Pipeline & Talent Sourcing (FR-RC-10 to FR-RC-16)
// -------------------------------------------------------------

export interface MoveCandidateStageDto {
  stage: ApplicationStatus;
  notes?: string;
}

export interface BulkMoveCandidateStageDto {
  applicationIds: string[];
  stage: ApplicationStatus;
  notes?: string;
}

export interface CandidateNoteDto {
  id: string;
  applicationId: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  rating?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCandidateNoteDto {
  content: string;
  rating?: number; // 1 to 5
}

export interface PipelineCandidateDto {
  id: string; // applicationId
  applicantId: string;
  jobId: string;
  jobTitle: string;
  fullName: string;
  email: string;
  phone?: string;
  headline?: string;
  avatarUrl?: string | null;
  location?: string;
  status: ApplicationStatus;
  appliedAt: string;
  cvId?: string | null;
  cvFileName?: string | null;
  cvFileUrl?: string | null;
  atsScore?: {
    overallScore: number;
    scoreBand: ScoreBand;
    skillsScore: number;
    experienceScore: number;
    educationScore: number;
    semanticTfidfScore: number;
    certificationScore: number;
    manualOverrideScore?: number | null;
    overrideReason?: string | null;
    topMatchingTerms?: string[];
  } | null;
  averageRating?: number | null;
  notesCount: number;
  lastNote?: {
    authorName: string;
    content: string;
    createdAt: string;
  } | null;
  screeningAnswers?: ScreeningAnswerItem[];
  mustHaveSkillsCount?: number;
  matchedMustHaveSkillsCount?: number;
}

export interface CandidateComparisonItemDto {
  applicationId: string;
  candidateName: string;
  candidateEmail?: string;
  headline?: string;
  avatarUrl?: string | null;
  currentStage: ApplicationStatus;
  appliedAt: string;
  overallScore?: number;
  manualOverrideScore?: number | null;
  scoreBand?: ScoreBand;
  subScores?: {
    skillsScore?: number;
    experienceScore?: number;
    educationScore?: number;
    semanticTfidfScore?: number;
    certificationScore?: number;
  };
  skills: Array<{ name: string; isMatched: boolean; priority: SkillPriority }>;
  yearsOfExperience?: number;
  educationSummary?: string;
  averageTeamRating?: number | null;
  notesCount: number;
}

export interface CandidateComparisonResponseDto {
  jobId: string;
  jobTitle: string;
  candidates: CandidateComparisonItemDto[];
}

export interface TalentPoolSearchParams {
  search?: string;
  skills?: string[];
  location?: string;
  minExperience?: number;
  page?: number;
  limit?: number;
}

export interface TalentPoolCandidateDto {
  id: string; // applicant profile ID
  fullName: string;
  email?: string;
  phone?: string;
  headline?: string;
  location?: string;
  summary?: string;
  avatarUrl?: string | null;
  skills: Array<{ name: string; proficiencyLevel?: string; yearsExperience?: number }>;
  experienceYears?: number;
  isBlind: boolean;
  cvUrl?: string | null;
  cvId?: string | null;
  cvFileName?: string | null;
  profileVisibility: 'PUBLIC' | 'BLIND';
}
