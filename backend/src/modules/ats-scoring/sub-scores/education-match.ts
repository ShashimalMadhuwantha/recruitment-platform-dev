import { ApplicantScoreInput, JobScoreInput, SubScoreCalculationResult } from '../ats-scoring.types';

const DEGREE_RANK: Record<string, number> = {
  NONE: 0,
  HIGH_SCHOOL: 1,
  DIPLOMA: 2,
  ASSOCIATE: 2,
  BACHELORS: 3,
  MASTERS: 4,
  DOCTORATE: 5,
  PHD: 5,
};

function normalizeDegree(degreeStr?: string): number {
  if (!degreeStr) return 0;
  const cleaned = degreeStr.toUpperCase();

  if (cleaned.includes('PHD') || cleaned.includes('DOCTOR')) return DEGREE_RANK.PHD;
  if (cleaned.includes('MASTER') || cleaned.includes('M.S') || cleaned.includes('MS') || cleaned.includes('MBA'))
    return DEGREE_RANK.MASTERS;
  if (
    cleaned.includes('BACHELOR') ||
    cleaned.includes('B.S') ||
    cleaned.includes('BS') ||
    cleaned.includes('B.A') ||
    cleaned.includes('BA') ||
    cleaned.includes('BTECH') ||
    cleaned.includes('UNDERGRADUATE')
  )
    return DEGREE_RANK.BACHELORS;
  if (cleaned.includes('DIPLOMA') || cleaned.includes('ASSOCIATE')) return DEGREE_RANK.DIPLOMA;
  if (cleaned.includes('HIGH SCHOOL') || cleaned.includes('ADVANCED LEVEL') || cleaned.includes('A/L'))
    return DEGREE_RANK.HIGH_SCHOOL;

  return 2; // Fallback general post-secondary qualification
}

/**
 * Computes Education Match (default weight ~15%)
 * Compares degree rank hierarchy and field of study keywords.
 */
export function calculateEducationMatch(
  applicant: ApplicantScoreInput,
  job: JobScoreInput
): SubScoreCalculationResult {
  const reqRank = normalizeDegree(job.requiredEducationLevel);
  const applicantRank = normalizeDegree(applicant.educationLevel);

  if (reqRank === 0) {
    return {
      score: 1.0,
      details: {
        note: 'No specific education requirement set',
        educationMet: true,
        applicantEducationLevel: applicant.educationLevel || 'None',
        requiredEducationLevel: 'Not specified',
      },
    };
  }

  // 1. Degree level match (80% of sub-score)
  let levelScore = 1.0;
  const educationMet = applicantRank >= reqRank;

  if (educationMet) {
    levelScore = 1.0;
  } else {
    levelScore = Math.max(0.35, applicantRank / reqRank);
  }

  // 2. Field of study match (20% of sub-score)
  let fieldRelevance = 0.7; // Neutral baseline
  if (applicant.fieldOfStudy) {
    const fieldLower = applicant.fieldOfStudy.toLowerCase();
    const techKeywords = ['computer', 'software', 'information technology', 'engineering', 'math', 'science', 'data'];
    const isTechField = techKeywords.some((k) => fieldLower.includes(k));

    if (isTechField) {
      fieldRelevance = 1.0;
    }
  }

  const finalScore = levelScore * 0.8 + fieldRelevance * 0.2;

  return {
    score: Math.round(Math.min(1.0, finalScore) * 100) / 100,
    details: {
      applicantEducationLevel: applicant.educationLevel,
      requiredEducationLevel: job.requiredEducationLevel || 'Not specified',
      applicantRank,
      requiredRank: reqRank,
      educationMet,
      fieldOfStudy: applicant.fieldOfStudy || null,
      levelScore: Math.round(levelScore * 100) / 100,
      fieldRelevance: Math.round(fieldRelevance * 100) / 100,
    },
  };
}
