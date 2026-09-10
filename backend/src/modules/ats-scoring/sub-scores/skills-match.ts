import { ApplicantScoreInput, JobScoreInput, SubScoreCalculationResult } from '../ats-scoring.types';

/**
 * Computes Skills Match (default weight ~40%)
 * Compares required skills (must-have vs nice-to-have) with applicant's skills and proficiencies.
 */
export function calculateSkillsMatch(
  applicant: ApplicantScoreInput,
  job: JobScoreInput
): SubScoreCalculationResult {
  if (!job.requiredSkills || job.requiredSkills.length === 0) {
    return { score: 1.0, matchedItems: [], missingItems: [], details: { note: 'No required skills specified' } };
  }

  const applicantSkillsMap = new Map<string, { proficiency: number; years: number }>();
  applicant.skills.forEach((s) => applicantSkillsMap.set(s.name.toLowerCase().trim(), s));

  let totalWeight = 0;
  let earnedScore = 0;
  const matchedItems: string[] = [];
  const missingItems: string[] = [];

  for (const reqSkill of job.requiredSkills) {
    const skillNameLower = reqSkill.name.toLowerCase().trim();
    const isMustHave = reqSkill.priority === 'MUST_HAVE';
    const skillWeight = (reqSkill.weight || 1.0) * (isMustHave ? 1.5 : 1.0);
    totalWeight += skillWeight;

    const applicantSkill = applicantSkillsMap.get(skillNameLower);
    if (applicantSkill) {
      // Base match earned
      let skillMatchRatio = 1.0;

      // Check proficiency bonus/penalty if minProficiency specified
      if (reqSkill.minProficiency && applicantSkill.proficiency < reqSkill.minProficiency) {
        skillMatchRatio = Math.max(0.5, applicantSkill.proficiency / reqSkill.minProficiency);
      }

      earnedScore += skillWeight * skillMatchRatio;
      matchedItems.push(reqSkill.name);
    } else {
      missingItems.push(reqSkill.name);
    }
  }

  const finalScore = totalWeight > 0 ? Math.min(1.0, earnedScore / totalWeight) : 1.0;

  return {
    score: Math.round(finalScore * 100) / 100,
    matchedItems,
    missingItems,
    details: {
      totalRequired: job.requiredSkills.length,
      totalMatched: matchedItems.length,
    },
  };
}
