import { ApplicantScoreInput, JobScoreInput, SubScoreCalculationResult } from '../ats-scoring.types';

/**
 * Computes Experience Match (default weight ~25%)
 * Compares total experience years against required range and job title relevance.
 */
export function calculateExperienceMatch(
  applicant: ApplicantScoreInput,
  job: JobScoreInput
): SubScoreCalculationResult {
  const minReq = job.minExperienceYears || 0;
  const applicantExp = applicant.totalExperienceYears || 0;

  if (minReq === 0 && applicantExp === 0) {
    return { score: 1.0, details: { applicantExp, minReq, note: 'No minimum experience required' } };
  }

  // 1. Duration score (0 to 0.75 weight of this subscore)
  let durationScore = 1.0;
  if (minReq > 0) {
    if (applicantExp >= minReq) {
      durationScore = 1.0;
    } else {
      durationScore = Math.max(0, applicantExp / minReq);
    }
  }

  // 2. Title relevance score (0 to 0.25 weight of this subscore)
  let titleRelevance = 0.5; // default baseline
  const jobTitleTokens = job.jobTitle.toLowerCase().split(/\W+/).filter((t) => t.length > 2);

  if (applicant.pastJobTitles && applicant.pastJobTitles.length > 0 && jobTitleTokens.length > 0) {
    const pastTokens = applicant.pastJobTitles.flatMap((title) =>
      title.toLowerCase().split(/\W+/).filter((t) => t.length > 2)
    );
    const hasSharedTitleToken = jobTitleTokens.some((token) => pastTokens.includes(token));
    titleRelevance = hasSharedTitleToken ? 1.0 : 0.6;
  }

  const finalScore = durationScore * 0.75 + titleRelevance * 0.25;

  return {
    score: Math.round(Math.min(1.0, finalScore) * 100) / 100,
    details: {
      applicantExperienceYears: applicantExp,
      requiredExperienceYears: minReq,
      durationScore,
      titleRelevance,
    },
  };
}
