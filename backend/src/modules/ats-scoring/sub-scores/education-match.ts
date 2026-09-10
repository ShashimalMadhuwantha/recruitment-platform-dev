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
  const cleaned = degreeStr.toUpperCase().replace(/[^A-Z]/g, '');
  if (cleaned.includes('PHD') || cleaned.includes('DOCTOR')) return DEGREE_RANK.PHD;
  if (cleaned.includes('MASTER') || cleaned.includes('MS') || cleaned.includes('MBA')) return DEGREE_RANK.MASTERS;
  if (cleaned.includes('BACHELOR') || cleaned.includes('BS') || cleaned.includes('BA') || cleaned.includes('BTECH'))
    return DEGREE_RANK.BACHELORS;
  if (cleaned.includes('DIPLOMA') || cleaned.includes('ASSOCIATE')) return DEGREE_RANK.DIPLOMA;
  if (cleaned.includes('HIGH')) return DEGREE_RANK.HIGH_SCHOOL;
  return 2; // fallback general degree
}

/**
 * Computes Education Match (default weight ~15%)
 * Compares degree level and field of study keywords.
 */
export function calculateEducationMatch(
  applicant: ApplicantScoreInput,
  job: JobScoreInput
): SubScoreCalculationResult {
  const reqRank = normalizeDegree(job.requiredEducationLevel);
  const applicantRank = normalizeDegree(applicant.educationLevel);

  if (reqRank === 0) {
    return { score: 1.0, details: { note: 'No specific education requirement' } };
  }

  let levelScore = 1.0;
  if (applicantRank >= reqRank) {
    levelScore = 1.0;
  } else {
    levelScore = Math.max(0.4, applicantRank / reqRank);
  }

  return {
    score: Math.round(levelScore * 100) / 100,
    details: {
      applicantEducationLevel: applicant.educationLevel,
      requiredEducationLevel: job.requiredEducationLevel || 'Not specified',
      applicantRank,
      requiredRank: reqRank,
    },
  };
}
