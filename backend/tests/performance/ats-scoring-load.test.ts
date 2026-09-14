import { describe, it, expect } from 'vitest';
import { AtsScoringService } from '../../src/modules/ats-scoring/ats-scoring.service';
import type {
  ApplicantScoreInput,
  JobScoreInput,
} from '../../src/modules/ats-scoring/ats-scoring.types';

describe('Epic 16: Performance & Scalability Benchmarks (NFR-09, NFR-10)', () => {
  const targetJob: JobScoreInput = {
    jobTitle: 'Principal Distributed Systems Engineer',
    jobDescriptionText: `We are looking for a Principal Distributed Systems Engineer with extensive expertise in
    TypeScript, Node.js, Go, MySQL database optimization, Kubernetes, and high-throughput low-latency microservices.
    The ideal candidate will have 7+ years of building resilient cloud architectures, CI/CD pipelines, and
    scalable APIs. Experience with event streaming, Kafka, Redis, and observability is highly desirable.`,
    minExperienceYears: 6,
    maxExperienceYears: 12,
    requiredEducationLevel: "Bachelor's",
    requiredSkills: [
      { name: 'TypeScript', priority: 'MUST_HAVE', weight: 1.0, minProficiency: 4 },
      { name: 'Node.js', priority: 'MUST_HAVE', weight: 1.0, minProficiency: 4 },
      { name: 'MySQL', priority: 'MUST_HAVE', weight: 0.8, minProficiency: 3 },
      { name: 'Kubernetes', priority: 'NICE_TO_HAVE', weight: 0.6, minProficiency: 3 },
      { name: 'Go', priority: 'NICE_TO_HAVE', weight: 0.5, minProficiency: 3 },
    ],
    requiredCertifications: ['AWS Certified Solutions Architect'],
  };

  // Generate 100 heterogeneous applicant score inputs
  const sampleApplicants: ApplicantScoreInput[] = Array.from({ length: 100 }, (_, i) => {
    const isStrongCandidate = i % 3 === 0;
    const isMediumCandidate = i % 3 === 1;

    return {
      skills: isStrongCandidate
        ? [
            { name: 'TypeScript', proficiency: 5, years: 7 },
            { name: 'Node.js', proficiency: 5, years: 7 },
            { name: 'MySQL', proficiency: 4, years: 5 },
            { name: 'Kubernetes', proficiency: 4, years: 4 },
            { name: 'Go', proficiency: 3, years: 2 },
          ]
        : isMediumCandidate
        ? [
            { name: 'TypeScript', proficiency: 4, years: 4 },
            { name: 'Node.js', proficiency: 3, years: 3 },
            { name: 'React', proficiency: 5, years: 5 },
          ]
        : [
            { name: 'Python', proficiency: 3, years: 2 },
            { name: 'Django', proficiency: 3, years: 2 },
          ],
      totalExperienceYears: isStrongCandidate ? 8 : isMediumCandidate ? 4 : 1.5,
      pastJobTitles: isStrongCandidate
        ? ['Lead Distributed Engineer', 'Senior Software Engineer']
        : isMediumCandidate
        ? ['Full Stack Developer']
        : ['Junior Python Developer'],
      educationLevel: isStrongCandidate
        ? "Master's"
        : isMediumCandidate
        ? "Bachelor's"
        : 'High School',
      certifications: isStrongCandidate ? ['AWS Certified Solutions Architect'] : [],
      rawCvText: `Candidate ${i} resume summary. Experienced software engineer specializing in
      ${isStrongCandidate ? 'TypeScript, Node.js, distributed databases, Kubernetes and cloud architecture.' : 'frontend development and scripting.'}
      Built scalable cloud microservices, optimized SQL performance, and collaborated with global engineering teams.`,
    };
  });

  it('NFR-09, NFR-10: should score 100 concurrent applications with average latency < 30ms per candidate', async () => {
    const startTime = performance.now();

    // Run scoring asynchronously across all 100 applicants concurrently
    const scorePromises = sampleApplicants.map((applicant) =>
      Promise.resolve(AtsScoringService.calculateScore(applicant, targetJob))
    );

    const results = await Promise.all(scorePromises);
    const totalDurationMs = performance.now() - startTime;
    const avgDurationPerCandidateMs = totalDurationMs / sampleApplicants.length;

    console.log(`\n📊 [ATS Performance Benchmark Results]:`);
    console.log(`   • Total Candidates Evaluated: ${results.length}`);
    console.log(`   • Total Batch Duration:       ${totalDurationMs.toFixed(2)} ms`);
    console.log(`   • Average per Candidate:      ${avgDurationPerCandidateMs.toFixed(2)} ms`);

    // Verify each result is well-formed
    results.forEach((res) => {
      expect(res.overallScore).toBeGreaterThanOrEqual(0);
      expect(res.overallScore).toBeLessThanOrEqual(100);
      expect(res.skillsMatch).toBeDefined();
      expect(res.experienceMatch).toBeDefined();
      expect(res.educationMatch).toBeDefined();
      expect(res.semanticMatch).toBeDefined();
    });

    // NFR requirement: sub-200ms response time; target benchmark is < 30ms per applicant
    expect(avgDurationPerCandidateMs).toBeLessThan(30);
  });

  it('NFR-10: should execute batch weight recalculation under 50ms for 50 applicants', () => {
    const subset = sampleApplicants.slice(0, 50);
    const customWeights = {
      skillsWeight: 0.5,
      experienceWeight: 0.25,
      educationWeight: 0.1,
      semanticWeight: 0.1,
      certificationWeight: 0.05,
    };

    const startTime = performance.now();
    const recalculated = subset.map((applicant) =>
      AtsScoringService.calculateScore(applicant, targetJob, customWeights)
    );
    const durationMs = performance.now() - startTime;

    console.log(`   • 50 Applicants Batch Recalculation: ${durationMs.toFixed(2)} ms`);

    expect(recalculated).toHaveLength(50);
    expect(durationMs).toBeLessThan(50);
  });
});
