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
    return {
      score: 1.0,
      matchedItems: [],
      missingItems: [],
      details: {
        note: 'No required skills specified for this vacancy',
        totalRequired: 0,
        totalMatched: 0,
      },
    };
  }

  if (!applicant.skills || applicant.skills.length === 0) {
    return {
      score: 0.0,
      matchedItems: [],
      missingItems: job.requiredSkills.map((s) => s.name),
      details: {
        note: 'Applicant has no skills listed',
        totalRequired: job.requiredSkills.length,
        totalMatched: 0,
        missingMustHave: job.requiredSkills.filter((s) => s.priority === 'MUST_HAVE').map((s) => s.name),
        missingNiceToHave: job.requiredSkills.filter((s) => s.priority === 'NICE_TO_HAVE').map((s) => s.name),
      },
    };
  }

  const applicantSkillsMap = new Map<string, { proficiency: number; years: number }>();
  for (const s of applicant.skills) {
    applicantSkillsMap.set(s.name.toLowerCase().trim(), s);
  }

  let totalWeight = 0;
  let earnedScore = 0;
  const matchedItems: string[] = [];
  const missingItems: string[] = [];
  const missingMustHave: string[] = [];
  const missingNiceToHave: string[] = [];

  for (const reqSkill of job.requiredSkills) {
    const skillNameLower = reqSkill.name.toLowerCase().trim();
    const isMustHave = reqSkill.priority === 'MUST_HAVE';
    // Must-have skills carry 1.5x the base weight
    const baseWeight = typeof reqSkill.weight === 'number' ? reqSkill.weight : 1.0;
    const skillWeight = baseWeight * (isMustHave ? 1.5 : 1.0);
    totalWeight += skillWeight;

    // Check exact match or substring match in candidate's skills
    let applicantSkill = applicantSkillsMap.get(skillNameLower);
    if (!applicantSkill) {
      for (const [candSkillName, val] of applicantSkillsMap.entries()) {
        if (candSkillName.includes(skillNameLower) || skillNameLower.includes(candSkillName)) {
          applicantSkill = val;
          break;
        }
      }
    }

    if (applicantSkill) {
      let skillMatchRatio = 1.0;

      // Check proficiency scaling if minimum proficiency is specified (1 to 5)
      const minProf = reqSkill.minProficiency || 1;
      if (applicantSkill.proficiency < minProf) {
        skillMatchRatio = Math.max(0.5, applicantSkill.proficiency / minProf);
      }

      earnedScore += skillWeight * skillMatchRatio;
      matchedItems.push(reqSkill.name);
    } else {
      missingItems.push(reqSkill.name);
      if (isMustHave) {
        missingMustHave.push(reqSkill.name);
      } else {
        missingNiceToHave.push(reqSkill.name);
      }
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
      missingMustHave,
      missingNiceToHave,
      mustHaveCount: job.requiredSkills.filter((s) => s.priority === 'MUST_HAVE').length,
    },
  };
}
