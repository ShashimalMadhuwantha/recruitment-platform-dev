export type {
  ApplicantProfileDto,
  UpdateApplicantProfileDto,
  ProfileVisibility,
  ProfileVisibilitySettings,
  ProfileCompletenessBreakdown,
  ApplicantSkillDto,
  EducationDto,
  WorkExperienceDto,
  AchievementDto,
  CertificationDto,
  PortfolioDto,
  CVDto,
  CVVersionDto,
  CVTemplateType,
  CVBuilderRequestDto,
  SelectiveSyncDto,
  UpdateCVLabelDto,
  ParsedResumeData,
  AnonymizedProfileDto,
  SkillMaster,
} from '@recruitment-platform/shared';

export type ProfileTab =
  | 'basic'
  | 'experience'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'portfolio'
  | 'resume'
  | 'privacy';
