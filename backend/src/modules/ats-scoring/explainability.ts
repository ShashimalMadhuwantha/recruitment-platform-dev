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

export function formatAtsExplanation(breakdown: AtsScoreBreakdown): string {
  const { bandLabel, overallScore, topMatchingTerms } = breakdown;
  let summary = `Applicant achieved an ATS match score of ${overallScore}% (${bandLabel}).`;
  if (topMatchingTerms && topMatchingTerms.length > 0) {
    summary += ` Key matching terms: ${topMatchingTerms.slice(0, 5).join(', ')}.`;
  }
  return summary;
}
