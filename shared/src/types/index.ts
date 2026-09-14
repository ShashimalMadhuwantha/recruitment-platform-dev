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
  recruiterPermissions?: Partial<RecruiterPermissions> | null;
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
  jobOffer?: JobOfferDto | null;
  atsScore?: AtsScoreDetailDto | null;
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
  jobOffer?: JobOfferDto | null;
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

// -------------------------------------------------------------
// Epic 12: Communication, Scheduling & Notifications
// -------------------------------------------------------------
export interface ApplicationMessageDto {
  id: string;
  applicationId: string;
  senderId: string;
  senderName?: string;
  senderRole?: UserRole;
  receiverId: string;
  receiverName?: string;
  body: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface SendMessageDto {
  body: string;
}

export type InterviewType = 'VIDEO' | 'PHONE' | 'IN_PERSON';
export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';

export interface InterviewScheduleDto {
  id: string;
  applicationId: string;
  candidateName?: string;
  jobTitle?: string;
  interviewerId: string;
  interviewerName?: string;
  title: string;
  interviewType: InterviewType;
  scheduledAt: string;
  durationMins: number;
  timezone: string;
  videoLink?: string | null;
  location?: string | null;
  status: InterviewStatus;
  notes?: string | null;
  hasFeedback?: boolean;
  createdAt: string;
  updatedAt?: string;
  feedbacks?: InterviewFeedbackDto[];
}

export interface CreateInterviewDto {
  title?: string;
  interviewType?: InterviewType;
  scheduledAt: string;
  durationMins?: number;
  timezone?: string;
  videoLink?: string;
  location?: string;
  notes?: string;
}

export interface UpdateInterviewStatusDto {
  status: InterviewStatus;
  notes?: string;
}

export type RecommendationType =
  | 'STRONG_HIRE'
  | 'HIRE'
  | 'NEUTRAL'
  | 'DO_NOT_HIRE'
  | 'STRONG_DO_NOT_HIRE';

export interface ScorecardRatingCriteria {
  technicalCompetency: number; // 1 to 5
  communication: number; // 1 to 5
  problemSolving: number; // 1 to 5
  experienceAlignment: number; // 1 to 5
  culturalFit: number; // 1 to 5
  overallAverage: number;
}

export interface InterviewFeedbackDto {
  id: string;
  interviewId: string;
  interviewerId: string;
  interviewerName?: string;
  scorecardJson?: ScorecardRatingCriteria | Record<string, any> | null;
  recommendation?: RecommendationType | string | null;
  notes?: string | null;
  submittedAt: string;
  updatedAt?: string;
}

export interface SubmitFeedbackDto {
  scorecard: ScorecardRatingCriteria;
  recommendation: RecommendationType;
  notes?: string;
}

export type NotificationType =
  | 'APPLICATION_STATUS_CHANGED'
  | 'NEW_MESSAGE'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_CANCELLED'
  | 'FEEDBACK_SUBMITTED'
  | 'JOB_OFFER_RECEIVED'
  | 'OFFER_ACCEPTED'
  | 'OFFER_DECLINED'
  | 'CANDIDATE_HIRED'
  | 'SYSTEM_ALERT';

export interface NotificationDto {
  id: string;
  userId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  link?: string | null;
  payloadJson?: Record<string, any> | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

// =============================================================
// Epic 13: Offers, Hiring & Applicant Career Tools
// =============================================================

export type OfferStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export interface JobOfferDto {
  id: string;
  applicationId: string;
  jobId: string;
  jobTitle: string;
  companyId?: string;
  companyName: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  createdById: string;
  creatorName?: string;
  baseSalary: number;
  currency: string;
  bonus?: number | null;
  equity?: string | null;
  startDate: string;
  expirationDate: string;
  offerLetterText?: string | null;
  benefitsSummary?: string | null;
  notes?: string | null;
  status: OfferStatus;
  declinedReason?: string | null;
  sentAt?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOfferDto {
  baseSalary: number;
  currency?: string;
  bonus?: number;
  equity?: string;
  startDate: string;
  expirationDate: string;
  offerLetterText?: string;
  benefitsSummary?: string;
  notes?: string;
  autoSend?: boolean; // if true, status set to SENT immediately
}

export interface RespondOfferDto {
  action: 'ACCEPT' | 'DECLINE';
  declinedReason?: string;
  signedName?: string;
}

export interface HireCandidateDto {
  closeRequisition?: boolean; // if true, sets JobVacancy status to FILLED
  hireDate?: string;
  notes?: string;
}

export interface CvHealthIssueDto {
  id: string;
  category: 'COMPLETENESS' | 'CONTENT_QUALITY' | 'IMPACT_METRICS' | 'FORMATTING';
  severity: 'CRITICAL' | 'WARNING' | 'SUGGESTION' | 'PASSED';
  title: string;
  description: string;
  recommendation: string;
}

export interface CvHealthCheckResultDto {
  healthScore: number; // 0 to 100
  grade: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'CRITICAL';
  wordCount: number;
  actionVerbCount: number;
  quantifiableMetricsCount: number;
  bulletPointsCount: number;
  sectionChecks: {
    contactInfo: boolean;
    summary: boolean;
    experience: boolean;
    education: boolean;
    skills: boolean;
  };
  topKeywords: Array<{ word: string; count: number; densityPercent: number }>;
  issues: CvHealthIssueDto[];
  passedChecksCount: number;
  criticalIssuesCount: number;
  warningsCount: number;
  analyzedAt: string;
}

export interface ProfileImprovementSuggestionDto {
  id: string;
  category: 'SKILL_GAP' | 'EXPERIENCE_CLARITY' | 'HEADLINE_OPTIMIZATION' | 'EDUCATION_CERT';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  marketDemandPercent?: number; // e.g. 75% of target jobs require this
  actionLabel: string;
  actionType: 'ADD_SKILL' | 'EDIT_SUMMARY' | 'ADD_EXPERIENCE' | 'ADD_CERTIFICATION';
  metadata?: Record<string, any>;
}

export interface ProfileImprovementResponseDto {
  overallReadinessScore: number;
  targetJobsAnalyzedCount: number;
  topMissingSkills: Array<{ name: string; frequency: number; priority: 'HIGH' | 'MEDIUM' | 'LOW' }>;
  suggestions: ProfileImprovementSuggestionDto[];
  generatedAt: string;
}

// -------------------------------------------------------------
// Epic 14: Analytics & Reporting (Company Level) (FR-RC-21 to FR-RC-23)
// -------------------------------------------------------------

export interface CompanyAnalyticsSummaryDto {
  totalApplications: number;
  activeJobs: number;
  avgAtsScore: number;
  avgTimeToHireDays: number;
  offerAcceptanceRate: number; // percentage, e.g. 85.5
  pipelineVelocityDays: number;
  trends: {
    applicationsTrendPercent: number; // e.g. +14.2%
    timeToHireTrendDays: number; // e.g. -2.1 days
    offerAcceptanceTrendPercent: number; // e.g. +5.0%
    atsScoreTrendPercent: number; // e.g. +1.8%
  };
}

export interface FunnelStageMetricDto {
  stage: string;
  label: string;
  count: number;
  percentageOfTotal: number;
  conversionFromPrev: number;
  dropOffCount: number;
  dropOffPercentage: number;
}

export interface CompanyFunnelResponseDto {
  stages: FunnelStageMetricDto[];
  totalApplications: number;
  totalHired: number;
  overallConversionRate: number;
}

export interface SourceAttributionDto {
  source: string;
  label: string;
  count: number;
  percentage: number;
}

export interface CompanySourcesResponseDto {
  sources: SourceAttributionDto[];
  total: number;
}

export interface ApplicationVelocityPointDto {
  date: string;
  label: string;
  count: number;
}

export interface ApplicationVelocityResponseDto {
  interval: 'day' | 'week' | 'month';
  points: ApplicationVelocityPointDto[];
  total: number;
}

export interface AtsScoreDistributionDto {
  strongMatchCount: number; // >= 80%
  strongMatchPercentage: number;
  partialMatchCount: number; // 50-79%
  partialMatchPercentage: number;
  weakMatchCount: number; // < 50%
  weakMatchPercentage: number;
  totalScored: number;
  averageScore: number;
}

export interface DiversityCategoryCountDto {
  category: string;
  count: number;
  percentage: number;
}

export interface DiversityAnalyticsDto {
  totalRespondents: number;
  isProtected: boolean; // true if totalRespondents < 5 (k-anonymity privacy guarantee)
  protectionMessage?: string;
  genderBreakdown: DiversityCategoryCountDto[];
  raceBreakdown: DiversityCategoryCountDto[];
  veteranBreakdown: DiversityCategoryCountDto[];
  disabilityBreakdown: DiversityCategoryCountDto[];
}

export interface SubmitDiversitySurveyDto {
  applicationId?: string;
  companyId: string;
  jobId?: string;
  gender?: string;
  raceEthnicity?: string;
  veteranStatus?: string;
  disabilityStatus?: string;
  optedIn: boolean;
}

export interface CandidateExportItemDto {
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  stage: string;
  atsScore: number | null;
  scoreBand: string | null;
  source: string;
  appliedAt: string;
  updatedAt: string;
  timeInPipelineDays: number;
}

export interface CandidateExportResponseDto {
  totalCandidates: number;
  exportedAt: string;
  candidates: CandidateExportItemDto[];
}

export interface AnalyticsFilterParams {
  jobId?: string;
  startDate?: string;
  endDate?: string;
  interval?: 'day' | 'week' | 'month';
  stage?: string;
  scoreBand?: ScoreBand | string;
}

// -------------------------------------------------------------
// Epic 17: Company, Team & Subscription Plan Seat Management
// -------------------------------------------------------------

export type TeamInvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

export interface RecruiterPermissions {
  canCreateJobs: boolean;
  canEditJobs: boolean;
  canDeleteJobs: boolean;
  canViewCandidateSalary: boolean;
  canAdvancePipeline: boolean;
  canScheduleInterviews: boolean;
  canSubmitScorecards: boolean;
  canExtendOffers: boolean;
  canManageTeam: boolean;
  canViewAnalytics: boolean;
  canManageCompanyProfile: boolean;
}

export interface CompanyLocation {
  city: string;
  state?: string;
  country: string;
  address?: string;
  isHq?: boolean;
}

export interface CultureMediaItem {
  type: 'IMAGE' | 'VIDEO';
  url: string;
  caption?: string;
}

export interface CompanySocialLinks {
  linkedin?: string;
  twitter?: string;
  github?: string;
  glassdoor?: string;
  website?: string;
}

export interface CompanyProfileDto {
  id: string;
  name: string;
  slug: string;
  industry?: string | null;
  size?: string | null;
  logoUrl?: string | null;
  coverPhotoUrl?: string | null;
  website?: string | null;
  description?: string | null;
  locations?: CompanyLocation[];
  cultureMedia?: CultureMediaItem[];
  socialLinks?: CompanySocialLinks;
  planId?: string | null;
  status: CompanyStatus;
  plan?: SubscriptionPlan | null;
}

export interface UpdateCompanyProfileDto {
  name?: string;
  industry?: string | null;
  size?: string | null;
  logoUrl?: string | null;
  coverPhotoUrl?: string | null;
  website?: string | null;
  description?: string | null;
  locations?: CompanyLocation[];
  cultureMedia?: CultureMediaItem[];
  socialLinks?: CompanySocialLinks;
}

export interface TeamMemberDto {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  title?: string | null;
  department?: string | null;
  subRole: RecruiterSubRole;
  permissions?: Partial<RecruiterPermissions> | null;
  createdAt: string;
}

export interface TeamInvitationDto {
  id: string;
  email: string;
  subRole: RecruiterSubRole;
  permissions?: Partial<RecruiterPermissions> | null;
  status: TeamInvitationStatus;
  invitedById: string;
  invitedByName?: string;
  expiresAt: string;
  createdAt: string;
  isExpired: boolean;
}

export interface TeamDirectoryResponseDto {
  members: TeamMemberDto[];
  pendingInvitations: TeamInvitationDto[];
}

export interface InviteTeamMemberDto {
  email: string;
  subRole: RecruiterSubRole;
  department?: string;
  title?: string;
  permissions?: Partial<RecruiterPermissions>;
}

export interface UpdateTeamMemberDto {
  subRole?: RecruiterSubRole;
  department?: string | null;
  title?: string | null;
  permissions?: Partial<RecruiterPermissions> | null;
}

export interface RemoveTeamMemberDto {
  transferRequisitionsToUserId?: string;
}

export interface AcceptInvitationDto {
  token: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

export interface VerifyInvitationResponseDto {
  valid: boolean;
  email: string;
  companyName: string;
  companyLogoUrl?: string | null;
  subRole: RecruiterSubRole;
  isExistingUser: boolean;
}

export interface PlanUsageDto {
  plan: {
    id: string;
    name: string;
    tier: PlanTier;
    priceMonthly: number;
    maxSeats: number;
    maxJobPosts: number;
    maxAtsScans: number;
    features: Record<string, boolean>;
  };
  usage: {
    seats: {
      activeRecruiters: number;
      pendingInvites: number;
      occupiedSeats: number;
      maxSeats: number;
      remainingSeats: number;
      percentUsed: number;
      isAtCapacity: boolean;
    };
    jobPosts: {
      activeJobs: number;
      maxJobPosts: number;
      remainingJobs: number;
      percentUsed: number;
      isAtCapacity: boolean;
    };
    atsScans: {
      scansUsed: number;
      maxAtsScans: number;
      remainingScans: number;
      percentUsed: number;
      isAtCapacity: boolean;
    };
  };
}

export interface RequestPlanUpgradeDto {
  requestedTier: PlanTier;
  note?: string;
}

// -------------------------------------------------------------
// Epic 18: Applicant Company Discovery & Employer Profile Hub
// -------------------------------------------------------------
export interface PublicCompanyOfficeLocation {
  id?: string;
  name: string;
  isHQ: boolean;
  address?: string;
  city: string;
  state?: string;
  country: string;
}

export interface PublicCompanyCultureMedia {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  caption?: string;
  order: number;
}

export interface PublicCompanySocialLinks {
  linkedin?: string;
  twitter?: string;
  github?: string;
  facebook?: string;
  youtube?: string;
  glassdoor?: string;
}

export interface PublicCompanySummaryDto {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  size: string | null;
  logoUrl: string | null;
  coverPhotoUrl: string | null;
  website: string | null;
  description: string | null;
  headquarters: string | null;
  activeJobCount: number;
  followerCount: number;
  isFollowedByMe?: boolean;
  createdAt: string;
}

export interface PublicCompanyDetailDto {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  size: string | null;
  logoUrl: string | null;
  coverPhotoUrl: string | null;
  website: string | null;
  description: string | null;
  locations: PublicCompanyOfficeLocation[];
  cultureMedia: PublicCompanyCultureMedia[];
  socialLinks: PublicCompanySocialLinks;
  activeJobCount: number;
  followerCount: number;
  isFollowedByMe?: boolean;
  createdAt: string;
}

export interface PublicCompanyJobItemDto {
  id: string;
  title: string;
  slug?: string;
  department?: string | null;
  employmentType: string;
  workplaceType: string;
  location?: string | null;
  experienceLevel?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  skills: string[];
  createdAt: string;
  predictedAtsScore?: number | null;
  hasApplied?: boolean;
}

export interface PublicCompanyJobsResponseDto {
  jobs: PublicCompanyJobItemDto[];
  total: number;
}

export interface ToggleCompanyFollowResponseDto {
  isFollowed: boolean;
  followerCount: number;
}

export interface CompanyDiscoveryQueryDto {
  page?: number;
  limit?: number;
  keyword?: string;
  industry?: string;
  location?: string;
  size?: string;
  hasActiveJobs?: boolean;
  sortBy?: 'name' | 'activeJobs' | 'followers' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
