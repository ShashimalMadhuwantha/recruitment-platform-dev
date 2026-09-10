import natural from 'natural';
import { ApplicantScoreInput, JobScoreInput, SubScoreCalculationResult } from '../ats-scoring.types';

const TfIdf = natural.TfIdf;

/**
 * Computes Semantic Text Match (~15% weight) using in-process TF-IDF and Cosine Similarity
 * per SRS §4.3.
 */
export function calculateSemanticMatch(
  applicant: ApplicantScoreInput,
  job: JobScoreInput
): SubScoreCalculationResult & { topMatchingTerms: string[] } {
  const applicantText = applicant.rawCvText || [
    applicant.skills.map((s) => s.name).join(' '),
    applicant.pastJobTitles.join(' '),
    applicant.educationLevel,
    applicant.fieldOfStudy || '',
  ].join(' ');

  const jobText = [
    job.jobTitle,
    job.jobDescriptionText,
    job.requiredSkills.map((s) => s.name).join(' '),
  ].join(' ');

  if (!applicantText.trim() || !jobText.trim()) {
    return {
      score: 0.5,
      topMatchingTerms: [],
      details: { note: 'Insufficient text for full semantic scoring' },
    };
  }

  const tfidf = new TfIdf();
  tfidf.addDocument(applicantText);
  tfidf.addDocument(jobText);

  // Extract applicant and job term vectors
  const applicantTerms: Record<string, number> = {};
  const jobTerms: Record<string, number> = {};

  tfidf.listTerms(0).forEach((item) => {
    applicantTerms[item.term] = item.tfidf;
  });

  tfidf.listTerms(1).forEach((item) => {
    jobTerms[item.term] = item.tfidf;
  });

  // Calculate Cosine Similarity
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  const sharedTerms: Array<{ term: string; weight: number }> = [];

  for (const [term, valA] of Object.entries(applicantTerms)) {
    normA += valA * valA;
    if (jobTerms[term]) {
      const valB = jobTerms[term];
      const product = valA * valB;
      dotProduct += product;
      sharedTerms.push({ term, weight: product });
    }
  }

  for (const valB of Object.values(jobTerms)) {
    normB += valB * valB;
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  const similarity = normA > 0 && normB > 0 ? dotProduct / (normA * normB) : 0;

  // Scale similarity smoothly into a 0 to 1 score
  const scaledScore = Math.min(1.0, similarity * 1.5);

  // Sort and pick top matching terms
  sharedTerms.sort((a, b) => b.weight - a.weight);
  const topMatchingTerms = sharedTerms.slice(0, 8).map((t) => t.term);

  return {
    score: Math.round(scaledScore * 100) / 100,
    topMatchingTerms,
    details: {
      rawCosineSimilarity: Math.round(similarity * 1000) / 1000,
      totalSharedTokens: sharedTerms.length,
    },
  };
}
