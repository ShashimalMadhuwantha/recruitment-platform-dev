import { AtsScoreBreakdown, ScoreBand } from '@recruitment-platform/shared';

export function determineScoreBand(score: number): {
  band: ScoreBand;
  label: 'Strong match' | 'Partial match' | 'Weak match';
} {
  if (score >= 80) {
    return { band: 'HIGH', label: 'Strong match' };
  } else if (score >= 50) {
    return { band: 'MID', label: 'Partial match' };
  } else {
    return { band: 'LOW', label: 'Weak match' };
  }
}

export function generateScoreRecommendations(params: {
  breakdown: AtsScoreBreakdown;
  missingCriticalSkills?: string[];
  experienceGap?: number;
  educationMet?: boolean;
}): string[] {
  const { breakdown, missingCriticalSkills = [], experienceGap = 0, educationMet = true } = params;
  const recommendations: string[] = [];

  // 1. Critical Skill Recommendations
  if (missingCriticalSkills.length > 0) {
    const topMissing = missingCriticalSkills.slice(0, 3).join(', ');
    const potentialBoost = Math.min(25, missingCriticalSkills.length * 8);
    recommendations.push(
      `Add must-have skills (${topMissing}) to your profile or highlight them in your CV to boost your match by up to +${potentialBoost}%.`
    );
  }

  // 2. Experience Recommendations
  if (experienceGap < 0) {
    recommendations.push(
      `Role requests ${Math.abs(experienceGap)} additional year(s) of relevant experience. Emphasize senior project ownership and high-impact accomplishments.`
    );
  }

  // 3. Education Recommendations
  if (!educationMet) {
    recommendations.push(
      `Highlight equivalent technical industry experience or accredited certifications to offset the formal degree benchmark.`
    );
  }

  // 4. Semantic alignment recommendation
  if (breakdown.semanticMatch.score < 60) {
    recommendations.push(
      `Tailor your CV summary and role bullet points to incorporate relevant industry phrasing and technical terms from the job description.`
    );
  }

  // Fallback if score is high
  if (recommendations.length === 0) {
    recommendations.push(
      `Strong profile alignment across skills, experience, and domain background. You are well-positioned for this role.`
    );
  }

  return recommendations;
}

export function formatAtsExplanation(breakdown: AtsScoreBreakdown): string {
  const { bandLabel, overallScore, topMatchingTerms } = breakdown;
  let summary = `Applicant achieved an ATS match score of ${overallScore}% (${bandLabel}).`;
  if (topMatchingTerms && topMatchingTerms.length > 0) {
    summary += ` Key matching terms: ${topMatchingTerms.slice(0, 5).join(', ')}.`;
  }
  return summary;
}
