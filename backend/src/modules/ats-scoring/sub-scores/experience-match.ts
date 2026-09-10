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
  const maxReq = job.maxExperienceYears;
  const applicantExp = Math.round((applicant.totalExperienceYears || 0) * 10) / 10;

  if (minReq === 0 && applicantExp === 0) {
    return {
      score: 1.0,
      details: {
        applicantExperienceYears: 0,
        requiredExperienceYears: 0,
        experienceGap: 0,
        note: 'No minimum experience required',
      },
    };
  }

  // 1. Duration score (70% weight of this subscore)
  let durationScore = 1.0;
  let experienceGap = 0;

  if (minReq > 0) {
    if (applicantExp >= minReq) {
      durationScore = 1.0;
      experienceGap = 0;

      // Check for extreme over-qualification if maxExperienceYears is defined
      if (maxReq && maxReq > minReq && applicantExp > maxReq + 8) {
        durationScore = 0.92; // Slight over-qualification adjustment
      }
    } else {
      experienceGap = Math.round((applicantExp - minReq) * 10) / 10;
      durationScore = Math.max(0.2, applicantExp / minReq);
    }
  }

  // 2. Title relevance score (30% weight of this subscore)
  let titleRelevance = 0.5; // Baseline default
  const jobTitleTokens = job.jobTitle
    .toLowerCase()
    .split(/[\s\-/,|()]+/)
    .filter((t) => t.length > 2 && !['and', 'for', 'the', 'with'].includes(t));

  if (applicant.pastJobTitles && applicant.pastJobTitles.length > 0 && jobTitleTokens.length > 0) {
    const pastTokens = applicant.pastJobTitles.flatMap((title) =>
      title
        .toLowerCase()
        .split(/[\s\-/,|()]+/)
        .filter((t) => t.length > 2)
    );

    const matchingTokens = jobTitleTokens.filter((token) => pastTokens.includes(token));
    const tokenMatchRatio = matchingTokens.length / jobTitleTokens.length;

    if (tokenMatchRatio >= 0.5) {
      titleRelevance = 1.0;
    } else if (tokenMatchRatio > 0) {
      titleRelevance = 0.8;
    } else {
      titleRelevance = 0.5;
    }
  }

  const finalScore = durationScore * 0.7 + titleRelevance * 0.3;

  return {
    score: Math.round(Math.min(1.0, finalScore) * 100) / 100,
    details: {
      applicantExperienceYears: applicantExp,
      requiredExperienceYears: minReq,
      maxExperienceYears: maxReq ?? null,
      experienceGap,
      durationScore: Math.round(durationScore * 100) / 100,
      titleRelevance: Math.round(titleRelevance * 100) / 100,
    },
  };
}
