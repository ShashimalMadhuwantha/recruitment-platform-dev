import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AtsScoringService } from './ats-scoring.service';
import { calculateSkillsMatch } from './sub-scores/skills-match';
import { calculateExperienceMatch } from './sub-scores/experience-match';
import { calculateEducationMatch } from './sub-scores/education-match';
import { calculateSemanticMatch } from './sub-scores/semantic-match';
import { calculateCertificationMatch } from './sub-scores/certification-match';
import { AntiBiasSanitizer } from './anti-bias.sanitizer';
import { ApplicantScoreInput, JobScoreInput } from './ats-scoring.types';
import { prisma } from '../../db/client';
import * as bcrypt from 'bcrypt';
import crypto from 'crypto';

describe('ATS Scoring Engine Comprehensive Unit & Integration Tests (Epic 7)', () => {
  let testCompanyId: string;
  let testRecruiterId: string;
  let testApplicantUserId: string;
  let testApplicantProfileId: string;
  let testJobId: string;
  let testApplicationId: string;

  const mockApplicant: ApplicantScoreInput = {
    skills: [
      { name: 'TypeScript', proficiency: 5, years: 4 },
      { name: 'React', proficiency: 4, years: 3 },
      { name: 'Node.js', proficiency: 4, years: 3 },
      { name: 'MySQL', proficiency: 3, years: 2 },
    ],
    totalExperienceYears: 4.5,
    pastJobTitles: ['Senior Frontend Developer', 'Full Stack Engineer'],
    educationLevel: "Bachelor's Degree",
    fieldOfStudy: 'Computer Science',
    certifications: ['AWS Certified Developer', 'Scrum Master'],
    rawCvText:
      'Experienced Full Stack Engineer specialized in building robust TypeScript and React web applications with Node.js and MySQL.',
  };

  const mockJob: JobScoreInput = {
    jobTitle: 'Senior Full Stack TypeScript Developer',
    jobDescriptionText:
      'We are looking for a Senior Full Stack TypeScript Developer experienced in React, Node.js, and relational database systems (MySQL).',
    requiredSkills: [
      { name: 'TypeScript', priority: 'MUST_HAVE', weight: 1.0, minProficiency: 4 },
      { name: 'React', priority: 'MUST_HAVE', weight: 1.0, minProficiency: 3 },
      { name: 'Node.js', priority: 'MUST_HAVE', weight: 1.0, minProficiency: 3 },
      { name: 'MySQL', priority: 'NICE_TO_HAVE', weight: 0.8, minProficiency: 2 },
      { name: 'GraphQL', priority: 'NICE_TO_HAVE', weight: 0.5, minProficiency: 2 },
    ],
    minExperienceYears: 3,
    maxExperienceYears: 6,
    requiredEducationLevel: "Bachelor's",
    requiredCertifications: ['AWS Certified Developer'],
  };

  beforeAll(async () => {
    // Setup test company, recruiter, applicant, job, and application for integration testing
    const suffix = crypto.randomUUID().slice(0, 8);
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const company = await prisma.company.create({
      data: {
        name: `ATS Test Org ${suffix}`,
        slug: `ats-test-org-${suffix}`,
        status: 'ACTIVE',
      },
    });
    testCompanyId = company.id;

    const recruiter = await prisma.user.create({
      data: {
        email: `recruiter-${suffix}@example.com`,
        passwordHash,
        role: 'RECRUITER',
        status: 'ACTIVE',
        recruiterProfile: {
          create: {
            companyId: company.id,
            subRole: 'COMPANY_ADMIN',
          },
        },
      },
    });
    testRecruiterId = recruiter.id;

    const applicantUser = await prisma.user.create({
      data: {
        email: `applicant-${suffix}@example.com`,
        passwordHash,
        role: 'APPLICANT',
        status: 'ACTIVE',
      },
    });
    testApplicantUserId = applicantUser.id;

    const applicantProfile = await prisma.applicantProfile.create({
      data: {
        userId: applicantUser.id,
        firstName: 'Test',
        lastName: 'Candidate',
        headline: 'Full Stack Engineer',
        summary: 'Passionate software engineer building web apps with TypeScript and React.',
        location: 'San Francisco, CA',
      },
    });
    testApplicantProfileId = applicantProfile.id;

    // Create a master skill and link to applicant
    const skillTs = await prisma.skill.upsert({
      where: { name: 'TypeScript' },
      update: {},
      create: { name: 'TypeScript', category: 'Programming Languages' },
    });

    await prisma.applicantSkill.create({
      data: {
        applicantId: applicantProfile.id,
        skillId: skillTs.id,
        proficiency: 4,
        yearsExperience: 3.5,
      },
    });

    await prisma.workExperience.create({
      data: {
        applicantId: applicantProfile.id,
        companyName: 'Tech Corp',
        title: 'Full Stack Engineer',
        startDate: new Date('2021-01-01'),
        endDate: new Date('2024-01-01'),
        isCurrent: false,
        description: 'Built microservices and client apps.',
      },
    });

    await prisma.education.create({
      data: {
        applicantId: applicantProfile.id,
        institution: 'Tech University',
        degree: "Bachelor's in Computer Science",
        fieldOfStudy: 'Computer Science',
        startDate: new Date('2017-09-01'),
        endDate: new Date('2021-06-01'),
      },
    });

    // Create Job Vacancy
    const job = await prisma.jobVacancy.create({
      data: {
        companyId: company.id,
        createdById: recruiter.id,
        title: 'Senior TypeScript Developer',
        description: 'Building high scale applications with TypeScript and React.',
        status: 'PUBLISHED',
        jobRequiredSkills: {
          create: [
            {
              skillId: skillTs.id,
              priority: 'MUST_HAVE',
              weight: 1.0,
              minProficiency: 3,
            },
          ],
        },
        jobRequirement: {
          create: {
            minExperienceYears: 2.0,
            educationLevel: "Bachelor's",
            requiredCertifications: ['AWS Certified Developer'],
          },
        },
      },
    });
    testJobId = job.id;

    // Create Application
    const application = await prisma.application.create({
      data: {
        applicantId: applicantProfile.id,
        jobId: job.id,
        status: 'APPLIED',
      },
    });
    testApplicationId = application.id;
  });

  afterAll(async () => {
    // Cleanup created test records
    await prisma.auditLog.deleteMany({ where: { actorId: testRecruiterId } });
    await prisma.aTSScore.deleteMany({ where: { applicationId: testApplicationId } });
    await prisma.application.deleteMany({ where: { id: testApplicationId } });
    await prisma.jobRequirement.deleteMany({ where: { jobId: testJobId } });
    await prisma.jobRequiredSkill.deleteMany({ where: { jobId: testJobId } });
    await prisma.jobVacancy.deleteMany({ where: { id: testJobId } });
    await prisma.applicantSkill.deleteMany({ where: { applicantId: testApplicantProfileId } });
    await prisma.workExperience.deleteMany({ where: { applicantId: testApplicantProfileId } });
    await prisma.education.deleteMany({ where: { applicantId: testApplicantProfileId } });
    await prisma.applicantProfile.deleteMany({ where: { id: testApplicantProfileId } });
    const userIds = [testRecruiterId, testApplicantUserId].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.recruiterProfile.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    if (testCompanyId) {
      await prisma.company.deleteMany({ where: { id: testCompanyId } });
    }
  });

  // 1. Skills Match Sub-score Tests
  it('1. Calculates skills match with must-have vs nice-to-have weights and proficiency scaling', () => {
    const result = calculateSkillsMatch(mockApplicant, mockJob);
    expect(result.score).toBeGreaterThan(0.7);
    expect(result.matchedItems).toContain('TypeScript');
    expect(result.matchedItems).toContain('React');
    expect(result.missingItems).toContain('GraphQL');
    expect(result.details?.missingNiceToHave).toContain('GraphQL');
  });

  it('2. Handles zero applicant skills and zero required skills edge cases cleanly', () => {
    // 0 required skills -> full score
    const emptyJob: JobScoreInput = { ...mockJob, requiredSkills: [] };
    const resEmptyJob = calculateSkillsMatch(mockApplicant, emptyJob);
    expect(resEmptyJob.score).toBe(1.0);

    // 0 applicant skills -> 0 score
    const emptyApplicant: ApplicantScoreInput = { ...mockApplicant, skills: [] };
    const resEmptyApplicant = calculateSkillsMatch(emptyApplicant, mockJob);
    expect(resEmptyApplicant.score).toBe(0.0);
    expect(resEmptyApplicant.missingItems?.length).toBe(mockJob.requiredSkills.length);
  });

  // 2. Experience Match Sub-score Tests
  it('3. Calculates experience match with duration ratio and title relevance', () => {
    const result = calculateExperienceMatch(mockApplicant, mockJob);
    expect(result.score).toBeGreaterThanOrEqual(0.8);
    expect(result.details?.applicantExperienceYears).toBe(4.5);
    expect(result.details?.experienceGap).toBe(0);
    expect(result.details?.titleRelevance).toBeGreaterThanOrEqual(0.8);
  });

  it('4. Calculates experience deficit correctly when applicant has less than required experience', () => {
    const juniorApplicant: ApplicantScoreInput = { ...mockApplicant, totalExperienceYears: 1.5 };
    const result = calculateExperienceMatch(juniorApplicant, mockJob);
    expect(result.score).toBeLessThan(0.8);
    expect(result.details?.experienceGap).toBe(-1.5);
  });

  // 3. Education Match Sub-score Tests
  it('5. Evaluates education level hierarchy accurately (Bachelors >= Bachelors)', () => {
    const result = calculateEducationMatch(mockApplicant, mockJob);
    expect(result.score).toBe(1.0);
    expect(result.details?.educationMet).toBe(true);
  });

  it('6. Penalizes when applicant education rank is below job requirement', () => {
    const highSchoolApplicant: ApplicantScoreInput = { ...mockApplicant, educationLevel: 'High School Diploma' };
    const masterJob: JobScoreInput = { ...mockJob, requiredEducationLevel: "Master's Degree" };
    const result = calculateEducationMatch(highSchoolApplicant, masterJob);
    expect(result.score).toBeLessThan(0.7);
    expect(result.details?.educationMet).toBe(false);
  });

  // 4. Semantic Match & Anti-Bias Exclusion Tests (FR-ATS-09)
  it('7. Excludes protected-class demographic signals via AntiBiasSanitizer (FR-ATS-09)', () => {
    const biasedText =
      'He is a 24 years old male born in 2002, married with 2 children. Nationality: US citizen. Experienced TypeScript developer.';
    const sanitized = AntiBiasSanitizer.sanitizeText(biasedText);

    expect(sanitized.toLowerCase()).not.toContain('he is');
    expect(sanitized.toLowerCase()).not.toContain('24 years old');
    expect(sanitized.toLowerCase()).not.toContain('born in');
    expect(sanitized.toLowerCase()).not.toContain('married');
    expect(sanitized.toLowerCase()).toContain('experienced typescript developer');
  });

  it('8. Computes TF-IDF semantic cosine similarity and extracts top matching terms', () => {
    const result = calculateSemanticMatch(mockApplicant, mockJob);
    expect(result.score).toBeGreaterThan(0.3);
    expect(result.topMatchingTerms.length).toBeGreaterThan(0);
    expect(result.details?.antiBiasSanitizationApplied).toBe(true);
  });

  // 5. Certification Match Sub-score Tests
  it('9. Matches certifications with exact and alias support', () => {
    const result = calculateCertificationMatch(mockApplicant, mockJob);
    expect(result.score).toBe(1.0);
    expect(result.matchedItems).toContain('AWS Certified Developer');
  });

  // 6. Overall Weighted Score Calculation & Band Assignment
  it('10. Aggregates all 5 sub-scores into overall score (0-100) and assigns correct ScoreBand', () => {
    const breakdown = AtsScoringService.calculateScore(mockApplicant, mockJob);
    expect(breakdown.overallScore).toBeGreaterThanOrEqual(70);
    expect(['HIGH', 'MID']).toContain(breakdown.scoreBand);
    expect(breakdown.skillsMatch.weight).toBe(40);
    expect(breakdown.experienceMatch.weight).toBe(25);
    expect(breakdown.educationMatch.weight).toBe(15);
    expect(breakdown.semanticMatch.weight).toBe(15);
    expect(breakdown.certificationMatch.weight).toBe(5);
  });

  // 7. On-demand Pre-Apply Match Preview (FR-ATS-02)
  it('11. Generates on-demand pre-apply match preview with recommendations for applicant', async () => {
    const preview = await AtsScoringService.previewJobMatch(testApplicantUserId, testJobId);
    expect(preview.jobId).toBe(testJobId);
    expect(preview.jobTitle).toContain('TypeScript');
    expect(preview.companyName).toContain('ATS Test Org');
    expect(preview.overallScore).toBeGreaterThanOrEqual(0);
    expect(preview.breakdown).toBeDefined();
    expect(Array.isArray(preview.recommendations)).toBe(true);
    expect(preview.recommendations.length).toBeGreaterThan(0);
  });

  // 8. Application Scoring & Recruiter Override with Audit Log (FR-ATS-06, FR-ATS-10)
  it('12. Scores application, persists ATSScore, and handles recruiter override with AuditLog entry', async () => {
    // 1. Initial application score
    const breakdown = await AtsScoringService.scoreApplication(testApplicationId);
    expect(breakdown.overallScore).toBeGreaterThan(0);

    const savedScore = await prisma.aTSScore.findUnique({
      where: { applicationId: testApplicationId },
    });
    expect(savedScore).toBeDefined();
    expect(Number(savedScore?.overallScore)).toBe(breakdown.overallScore);

    // 2. Recruiter overrides score
    const overrideResult = await AtsScoringService.overrideScore({
      applicationId: testApplicationId,
      recruiterUserId: testRecruiterId,
      overrideScore: 95,
      reason: 'Exceptional open-source portfolio and strong architectural interview performance',
    });

    expect(overrideResult.manualOverrideScore).toBe(95);
    expect(overrideResult.overrideReason).toContain('open-source portfolio');
    expect(overrideResult.overrideById).toBe(testRecruiterId);

    // 3. Verify AuditLog was recorded
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        actorId: testRecruiterId,
        action: 'OVERRIDE_ATS_SCORE',
        targetId: testApplicationId,
      },
    });
    expect(auditLog).toBeDefined();
    expect((auditLog?.detailsJson as any)?.manualOverrideScore).toBe(95);
  });

  // 9. Batch Re-scoring (FR-ATS-08)
  it('13. Executes batch re-scoring of all applications for a job vacancy', async () => {
    const rescoreResult = await AtsScoringService.batchRescoreJobApplications(testJobId);
    expect(rescoreResult.jobId).toBe(testJobId);
    expect(rescoreResult.totalApplications).toBeGreaterThanOrEqual(1);
    expect(rescoreResult.updatedScoresCount).toBe(rescoreResult.totalApplications);
    expect(rescoreResult.durationMs).toBeGreaterThanOrEqual(0);
  });
});
