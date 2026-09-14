import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../../db/client';
import { analyticsService } from './analytics.service';
import { JobStatus, ApplicationStatus, ScoreBand, OfferStatus } from '@prisma/client';

describe('Epic 14: Analytics & Reporting Unit Tests (FR-RC-21, FR-RC-22, FR-RC-23)', () => {
  let companyId: string;
  let emptyCompanyId: string;
  let jobId: string;
  let applicantUser1Id: string;
  let applicantUser2Id: string;
  let applicantUser3Id: string;
  let recruiterUserId: string;

  beforeAll(async () => {
    // 1. Create company with data
    const company = await prisma.company.create({
      data: {
        name: `Analytics Corp ${Date.now()}`,
        slug: `analytics-corp-${Date.now()}`,
        status: 'ACTIVE',
      },
    });
    companyId = company.id;

    // 2. Create empty company for zero-state edge tests
    const emptyCompany = await prisma.company.create({
      data: {
        name: `Empty Analytics Corp ${Date.now()}`,
        slug: `empty-analytics-${Date.now()}`,
        status: 'ACTIVE',
      },
    });
    emptyCompanyId = emptyCompany.id;

    // 3. Create recruiter
    const recruiter = await prisma.user.create({
      data: {
        email: `recruiter-analytics-${Date.now()}@example.com`,
        passwordHash: 'dummyhash',
        role: 'RECRUITER',
        status: 'ACTIVE',
        recruiterProfile: {
          create: {
            companyId,
            title: 'Talent Lead',
          },
        },
      },
    });
    recruiterUserId = recruiter.id;

    // 4. Create published job
    const job = await prisma.jobVacancy.create({
      data: {
        companyId,
        createdById: recruiterUserId,
        title: 'Staff Fullstack Architect',
        description: 'Lead engineering initiatives',
        status: JobStatus.PUBLISHED,
      },
    });
    jobId = job.id;

    // 5. Create applicant profiles
    const createApplicant = async (firstName: string, lastName: string, email: string) => {
      const u = await prisma.user.create({
        data: {
          email,
          passwordHash: 'dummyhash',
          role: 'APPLICANT',
          status: 'ACTIVE',
          applicantProfile: {
            create: {
              firstName,
              lastName,
            },
          },
        },
        include: { applicantProfile: true },
      });
      return u;
    };

    const user1 = await createApplicant('Alice', 'Engineer', `alice-analytics-${Date.now()}@test.com`);
    const user2 = await createApplicant('Bob', 'Architect', `bob-analytics-${Date.now()}@test.com`);
    const user3 = await createApplicant('Charlie', 'Developer', `charlie-analytics-${Date.now()}@test.com`);
    applicantUser1Id = user1.id;
    applicantUser2Id = user2.id;
    applicantUser3Id = user3.id;

    // 6. Create pipeline stages for job
    const stageApplied = await prisma.pipelineStage.create({
      data: { jobId, name: 'APPLIED', stageOrder: 1, isSystemStage: true },
    });
    const stageInterview = await prisma.pipelineStage.create({
      data: { jobId, name: 'INTERVIEW', stageOrder: 2, isSystemStage: false },
    });
    const stageHired = await prisma.pipelineStage.create({
      data: { jobId, name: 'HIRED', stageOrder: 3, isSystemStage: true },
    });

    // 7. Create applications:
    // App 1: Applied 10 days ago, hired 2 days ago (8 days time-to-hire), High ATS Score 88.5, Source LINKEDIN
    const app1Date = new Date(Date.now() - 10 * 86400000);
    const app1HiredDate = new Date(Date.now() - 2 * 86400000);
    const app1 = await prisma.application.create({
      data: {
        applicantId: user1.applicantProfile!.id,
        jobId,
        status: ApplicationStatus.HIRED,
        source: 'LINKEDIN',
        appliedAt: app1Date,
        updatedAt: app1HiredDate,
        atsScore: {
          create: {
            overallScore: 88.5,
            scoreBand: ScoreBand.HIGH,
            skillsScore: 90,
            experienceScore: 85,
            educationScore: 90,
            semanticTfidfScore: 85,
            certificationScore: 90,
          },
        },
        candidatePipelines: {
          create: [
            { stageId: stageApplied.id, movedAt: app1Date },
            { stageId: stageHired.id, movedAt: app1HiredDate },
          ],
        },
        jobOffer: {
          create: {
            createdById: recruiterUserId,
            baseSalary: 160000,
            currency: 'USD',
            startDate: new Date(Date.now() + 14 * 86400000),
            expirationDate: new Date(Date.now() + 7 * 86400000),
            status: OfferStatus.ACCEPTED,
          },
        },
      },
    });

    // App 2: Applied 5 days ago, in Interview stage, Mid ATS Score 72.0, Source REFERRAL
    const app2Date = new Date(Date.now() - 5 * 86400000);
    await prisma.application.create({
      data: {
        applicantId: user2.applicantProfile!.id,
        jobId,
        status: ApplicationStatus.INTERVIEW,
        source: 'REFERRAL',
        appliedAt: app2Date,
        atsScore: {
          create: {
            overallScore: 72.0,
            scoreBand: ScoreBand.MID,
            skillsScore: 75,
            experienceScore: 70,
            educationScore: 70,
            semanticTfidfScore: 70,
            certificationScore: 75,
          },
        },
        candidatePipelines: {
          create: [
            { stageId: stageApplied.id, movedAt: app2Date },
            { stageId: stageInterview.id, movedAt: new Date(Date.now() - 3 * 86400000) },
          ],
        },
      },
    });

    // App 3: Applied 3 days ago, in Applied stage, Low ATS Score 45.0, Source DIRECT
    const app3Date = new Date(Date.now() - 3 * 86400000);
    await prisma.application.create({
      data: {
        applicantId: user3.applicantProfile!.id,
        jobId,
        status: ApplicationStatus.APPLIED,
        source: 'DIRECT',
        appliedAt: app3Date,
        atsScore: {
          create: {
            overallScore: 45.0,
            scoreBand: ScoreBand.LOW,
            skillsScore: 40,
            experienceScore: 50,
            educationScore: 45,
            semanticTfidfScore: 45,
            certificationScore: 45,
          },
        },
        candidatePipelines: {
          create: [{ stageId: stageApplied.id, movedAt: app3Date }],
        },
      },
    });
  });

  describe('1. Summary & Executive KPI Calculations (FR-RC-21)', () => {
    it('accurately computes total applications, active jobs, average ATS score, and time-to-hire', async () => {
      const summary = await analyticsService.getCompanySummary(companyId, {});

      expect(summary.totalApplications).toBe(3);
      expect(summary.activeJobs).toBe(1);
      // Avg ATS Score: (88.5 + 72.0 + 45.0) / 3 = 68.5
      expect(summary.avgAtsScore).toBe(68.5);
      // Time to hire: candidate 1 took 8 days
      expect(summary.avgTimeToHireDays).toBe(8);
      // Offer acceptance rate: 1 offer extended, 1 accepted = 100%
      expect(summary.offerAcceptanceRate).toBe(100);
      expect(summary.pipelineVelocityDays).toBeGreaterThan(0);
      expect(summary.trends).toBeDefined();
    });

    it('handles empty company without NaN or divide-by-zero errors', async () => {
      const summary = await analyticsService.getCompanySummary(emptyCompanyId, {});

      expect(summary.totalApplications).toBe(0);
      expect(summary.activeJobs).toBe(0);
      expect(summary.avgAtsScore).toBe(0);
      expect(summary.avgTimeToHireDays).toBe(0);
      expect(summary.offerAcceptanceRate).toBe(0);
      expect(summary.pipelineVelocityDays).toBe(0);
      expect(summary.trends.applicationsTrendPercent).toBe(0);
    });
  });

  describe('2. Funnel Conversion & Drop-off Rates (FR-RC-21)', () => {
    it('generates stage-by-stage progression and conversion percentages', async () => {
      const funnel = await analyticsService.getFunnelMetrics(companyId, {});

      expect(funnel.totalApplications).toBe(3);
      expect(funnel.stages.length).toBe(6);

      const appliedStage = funnel.stages.find((s) => s.stage === 'APPLIED');
      const interviewStage = funnel.stages.find((s) => s.stage === 'INTERVIEW');
      const hiredStage = funnel.stages.find((s) => s.stage === 'HIRED');

      expect(appliedStage?.count).toBe(3);
      expect(appliedStage?.percentageOfTotal).toBe(100);

      // Alice (Hired) and Bob (Interview) both reached Interview stage
      expect(interviewStage?.count).toBe(2);
      expect(interviewStage?.percentageOfTotal).toBeCloseTo(66.7, 1);

      // Alice reached Hired stage
      expect(hiredStage?.count).toBe(1);
      expect(hiredStage?.percentageOfTotal).toBeCloseTo(33.3, 1);
      expect(funnel.totalHired).toBe(1);
      expect(funnel.overallConversionRate).toBeCloseTo(33.3, 1);
    });
  });

  describe('3. Candidate Sourcing & Velocity Trends (FR-RC-21)', () => {
    it('aggregates candidate acquisition by source', async () => {
      const sources = await analyticsService.getSourceAttribution(companyId, {});

      expect(sources.total).toBe(3);
      expect(sources.sources.length).toBe(3);

      const linkedin = sources.sources.find((s) => s.source === 'LINKEDIN');
      const referral = sources.sources.find((s) => s.source === 'REFERRAL');
      const direct = sources.sources.find((s) => s.source === 'DIRECT');

      expect(linkedin?.count).toBe(1);
      expect(referral?.count).toBe(1);
      expect(direct?.count).toBe(1);
      expect(linkedin?.percentage).toBeCloseTo(33.3, 1);
    });

    it('calculates daily application velocity points', async () => {
      const velocity = await analyticsService.getApplicationVelocity(companyId, { interval: 'day' });

      expect(velocity.total).toBe(3);
      expect(velocity.points.length).toBeGreaterThanOrEqual(1);
      expect(velocity.interval).toBe('day');
    });
  });

  describe('4. ATS Score Distribution (FR-RC-21)', () => {
    it('categorizes scores across Strong, Partial, and Weak bands', async () => {
      const distribution = await analyticsService.getScoreDistribution(companyId, {});

      expect(distribution.totalScored).toBe(3);
      expect(distribution.strongMatchCount).toBe(1); // Alice 88.5
      expect(distribution.partialMatchCount).toBe(1); // Bob 72.0
      expect(distribution.weakMatchCount).toBe(1); // Charlie 45.0
      expect(distribution.strongMatchPercentage).toBeCloseTo(33.3, 1);
      expect(distribution.partialMatchPercentage).toBeCloseTo(33.3, 1);
      expect(distribution.weakMatchPercentage).toBeCloseTo(33.3, 1);
      expect(distribution.averageScore).toBe(68.5);
    });
  });

  describe('5. Diversity & Inclusion Analytics with k-Anonymity (k >= 5) (FR-RC-23)', () => {
    it('enforces privacy protection when sample size is below threshold (N < 5)', async () => {
      // Create 3 responses (< 5)
      await analyticsService.submitDiversitySurvey({
        companyId,
        gender: 'Female',
        raceEthnicity: 'Asian',
        optedIn: true,
      });
      await analyticsService.submitDiversitySurvey({
        companyId,
        gender: 'Male',
        raceEthnicity: 'White',
        optedIn: true,
      });
      await analyticsService.submitDiversitySurvey({
        companyId,
        gender: 'Non-Binary',
        raceEthnicity: 'Hispanic/Latino',
        optedIn: true,
      });

      const diversity = await analyticsService.getDiversityAnalytics(companyId, {});

      expect(diversity.totalRespondents).toBe(3);
      expect(diversity.isProtected).toBe(true);
      expect(diversity.protectionMessage).toContain('k-anonymity');
      expect(diversity.genderBreakdown.length).toBe(0);
      expect(diversity.raceBreakdown.length).toBe(0);
    });

    it('reveals aggregated demographic breakdowns once sample size meets k >= 5', async () => {
      // Add 2 more responses to reach 5
      await analyticsService.submitDiversitySurvey({
        companyId,
        gender: 'Female',
        raceEthnicity: 'Asian',
        veteranStatus: 'Veteran',
        optedIn: true,
      });
      await analyticsService.submitDiversitySurvey({
        companyId,
        gender: 'Male',
        raceEthnicity: 'Black/African American',
        disabilityStatus: 'No',
        optedIn: true,
      });

      const diversity = await analyticsService.getDiversityAnalytics(companyId, {});

      expect(diversity.totalRespondents).toBe(5);
      expect(diversity.isProtected).toBe(false);
      expect(diversity.genderBreakdown.length).toBeGreaterThan(0);

      // Check Female count: 2 out of 5 = 40%
      const femaleGroup = diversity.genderBreakdown.find((g) => g.category === 'Female');
      expect(femaleGroup?.count).toBe(2);
      expect(femaleGroup?.percentage).toBe(40);
    });
  });

  describe('6. Reports & CSV Export Engine with Formula Escaping (FR-RC-22)', () => {
    it('exports candidate pipeline report with granular filters and calculates pipeline days', async () => {
      const report = await analyticsService.exportCandidateReports(companyId, {
        format: 'json',
      });

      expect(report.totalCandidates).toBe(3);
      expect(report.candidates[0].candidateName).toBeDefined();
      expect(report.candidates[0].timeInPipelineDays).toBeGreaterThanOrEqual(0);
    });

    it('generates sanitized CSV formatting with injection formula protection', () => {
      const mockCandidates = [
        {
          applicationId: 'app-1',
          candidateName: '=SUM(1,2)', // Formula injection attempt
          candidateEmail: 'attacker@example.com',
          jobTitle: 'Software Engineer',
          stage: 'APPLIED',
          atsScore: 85,
          scoreBand: 'HIGH',
          source: 'DIRECT',
          appliedAt: '2026-09-01T10:00:00Z',
          updatedAt: '2026-09-02T10:00:00Z',
          timeInPipelineDays: 1.0,
        },
      ];

      const csv = analyticsService.generateCsvReport(mockCandidates);

      expect(csv).toContain('Application ID,Candidate Name,Candidate Email');
      // Must escape formula starting with '=' with a single quote "'"
      expect(csv).toContain("\"'=SUM(1,2)\"");
      expect(csv).toContain('"85%"');
    });
  });
});
