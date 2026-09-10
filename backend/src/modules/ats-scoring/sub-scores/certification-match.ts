import { ApplicantScoreInput, JobScoreInput, SubScoreCalculationResult } from '../ats-scoring.types';

/**
 * Computes Certification Match (default weight ~5%)
 */
export function calculateCertificationMatch(
  applicant: ApplicantScoreInput,
  job: JobScoreInput
): SubScoreCalculationResult {
  const reqCerts = job.requiredCertifications || [];
  if (reqCerts.length === 0) {
    return {
      score: 1.0,
      matchedItems: [],
      missingItems: [],
      details: {
        note: 'No required certifications for this vacancy',
        totalRequired: 0,
        totalMatched: 0,
      },
    };
  }

  const applicantCerts = (applicant.certifications || []).map((c) => c.toLowerCase().trim());
  const matchedItems: string[] = [];
  const missingItems: string[] = [];

  for (const cert of reqCerts) {
    const certLower = cert.toLowerCase().trim();
    const isMatched = applicantCerts.some(
      (ac) => ac === certLower || ac.includes(certLower) || certLower.includes(ac)
    );
    if (isMatched) {
      matchedItems.push(cert);
    } else {
      missingItems.push(cert);
    }
  }

  const score = reqCerts.length > 0 ? matchedItems.length / reqCerts.length : 1.0;

  return {
    score: Math.round(score * 100) / 100,
    matchedItems,
    missingItems,
    details: {
      totalRequiredCerts: reqCerts.length,
      matchedCerts: matchedItems.length,
    },
  };
}
