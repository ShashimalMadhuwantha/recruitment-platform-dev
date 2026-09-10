import { AtsScoreBreakdown, ScoreWeightConfig } from '@recruitment-platform/shared';

export interface ApplicantScoreInput {
  skills: Array<{ name: string; proficiency: number; years: number }>;
  totalExperienceYears: number;
  pastJobTitles: string[];
  educationLevel: string; // e.g. "Bachelor's", "Master's", "PhD", "Diploma"
  fieldOfStudy?: string;
  certifications: string[];
  rawCvText?: string;
}

export interface JobScoreInput {
  requiredSkills: Array<{
    name: string;
    priority: 'MUST_HAVE' | 'NICE_TO_HAVE';
    weight: number;
    minProficiency: number;
  }>;
  minExperienceYears: number;
  maxExperienceYears?: number;
  requiredEducationLevel?: string;
  requiredCertifications?: string[];
  jobTitle: string;
  jobDescriptionText: string;
}

export interface SubScoreCalculationResult {
  score: number; // 0 to 1
  matchedItems?: string[];
  missingItems?: string[];
  details?: Record<string, unknown>;
}

export type { AtsScoreBreakdown, ScoreWeightConfig };
