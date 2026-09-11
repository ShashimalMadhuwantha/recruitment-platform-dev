import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApplicationService } from './application.service';
import { JobSearchService } from '../job-search/job-search.service';
import { prisma } from '../../db/client';
import * as bcrypt from 'bcrypt';
import crypto from 'crypto';
import { ApplicationStatus, JobStatus, EmploymentType } from '@prisma/client';

describe('Job Search & Applicant Application Flow (Epic 8)', () => {
  const applicationService = new ApplicationService();
  const jobSearchService = new JobSearchService();

  let testCompanyId: string;
  let testRecruiterId: string;
  let testApplicantUserId: string;
  let testApplicantProfileId: string;
  let testCvId: string;
  let testJobId1: string;
  let testJobId2: string;
  let testKnockoutJobId: string;

  beforeAll(async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('SecurePassword123!', salt);
    const runId = crypto.randomBytes(4).toString('hex');

    // 1. Create company & recruiter
    const company = await prisma.company.create({
      data: {
        name: `Epic8 Tech Corp ${runId}`,
        slug: `epic8-${runId}`,
        website: `https://epic8-${runId}.com`,
        status: 'ACTIVE',
        industry: 'Technology',
      },
    });
    testCompanyId = company.id;

    const recruiterUser = await prisma.user.create({
      data: {
        email: `recruiter.epic8.${runId}@test.com`,
        passwordHash,
        role: 'RECRUITER',
        status: 'ACTIVE',
      },
    });
    testRecruiterId = recruiterUser.id;

    await prisma.recruiterProfile.create({
      data: {
        userId: recruiterUser.id,
        companyId: company.id,
        title: 'Lead Talent Partner',
      },
    });

    // 2. Create applicant user & profile
    const applicantUser = await prisma.user.create({
      data: {
        email: `applicant.epic8.${runId}@test.com`,
        passwordHash,
        role: 'APPLICANT',
        status: 'ACTIVE',
      },
    });
    testApplicantUserId = applicantUser.id;

    const applicantProfile = await prisma.applicantProfile.create({
      data: {
        userId: applicantUser.id,
        firstName: 'Epic8',
        lastName: 'Applicant',
        headline: 'Full-Stack Software Engineer',
        summary: 'Specialized in TypeScript, React, and Node.js microservices.',
        location: 'Colombo, Sri Lanka',
      },
    });
    testApplicantProfileId = applicantProfile.id;

    // Attach primary CV
    const cv = await prisma.cV.create({
      data: {
        applicantId: applicantProfile.id,
        fileRef: `uploads/resumes/epic8-${runId}.pdf`,
        fileName: 'Epic8_Software_Resume.pdf',
        fileSize: 102400,
        mimeType: 'application/pdf',
        isPrimary: true,
        parsedText: 'Experienced Full Stack Engineer specialized in TypeScript, React, Node.js and SQL databases.',
      },
    });
    testCvId = cv.id;

    // Attach skills
    const skillTs = await prisma.skill.upsert({
      where: { name: `TypeScript-${runId}` },
      create: { name: `TypeScript-${runId}`, category: 'Programming' },
      update: {},
    });
    const skillReact = await prisma.skill.upsert({
      where: { name: `React-${runId}` },
      create: { name: `React-${runId}`, category: 'Frontend' },
      update: {},
    });

    await prisma.applicantSkill.createMany({
      data: [
        { applicantId: applicantProfile.id, skillId: skillTs.id, proficiency: 4, yearsExperience: 3 },
        { applicantId: applicantProfile.id, skillId: skillReact.id, proficiency: 5, yearsExperience: 4 },
      ],
    });

    // 3. Create published job vacancies
    const job1 = await prisma.jobVacancy.create({
      data: {
        companyId: company.id,
        createdById: recruiterUser.id,
        title: `Senior Full-Stack TypeScript Engineer ${runId}`,
        description: 'Lead modern cloud and web applications development with React and TypeScript.',
        requirementsSummary: '3+ years experience with React, TypeScript, Node.js.',
        location: 'Remote, Global',
        employmentType: EmploymentType.REMOTE,
        salaryMin: 80000,
        salaryMax: 120000,
        status: JobStatus.PUBLISHED,
        jobRequiredSkills: {
          create: [
            { skillId: skillTs.id, priority: 'MUST_HAVE', weight: 1.0, minProficiency: 3 },
            { skillId: skillReact.id, priority: 'MUST_HAVE', weight: 1.0, minProficiency: 3 },
          ],
        },
      },
    });
    testJobId1 = job1.id;

    const job2 = await prisma.jobVacancy.create({
      data: {
        companyId: company.id,
        createdById: recruiterUser.id,
        title: `Backend Node.js Architect ${runId}`,
        description: 'Design distributed backend architectures with Node.js and SQL.',
        location: 'New York, USA',
        employmentType: EmploymentType.FULL_TIME,
        salaryMin: 110000,
        salaryMax: 150000,
        status: JobStatus.PUBLISHED,
      },
    });
    testJobId2 = job2.id;

    // Job with knockout screening question
    const knockoutJob = await prisma.jobVacancy.create({
      data: {
        companyId: company.id,
        createdById: recruiterUser.id,
        title: `US Work Authorized Engineer ${runId}`,
        description: 'Requires valid US work authorization.',
        location: 'San Francisco, USA',
        employmentType: EmploymentType.FULL_TIME,
        status: JobStatus.PUBLISHED,
        screeningQuestionsJson: [
          {
            id: 'q-work-auth',
            question: 'Are you legally authorized to work in the United States without sponsorship?',
            type: 'YES_NO',
            isKnockout: true,
            requiredAnswer: 'YES',
          },
        ],
      },
    });
    testKnockoutJobId = knockoutJob.id;
  });

  afterAll(async () => {
    // Cleanup created entities
    if (testApplicantProfileId) {
      await prisma.savedJob.deleteMany({ where: { applicantId: testApplicantProfileId } });
      await prisma.aTSScore.deleteMany({ where: { application: { applicantId: testApplicantProfileId } } });
      await prisma.candidatePipeline.deleteMany({ where: { application: { applicantId: testApplicantProfileId } } });
      await prisma.application.deleteMany({ where: { applicantId: testApplicantProfileId } });
      await prisma.cV.deleteMany({ where: { applicantId: testApplicantProfileId } });
      await prisma.applicantSkill.deleteMany({ where: { applicantId: testApplicantProfileId } });
      await prisma.applicantProfile.deleteMany({ where: { id: testApplicantProfileId } });
    }

    const jobIds = [testJobId1, testJobId2, testKnockoutJobId].filter((id): id is string => Boolean(id));
    if (jobIds.length > 0) {
      await prisma.jobRequiredSkill.deleteMany({ where: { jobId: { in: jobIds } } });
      await prisma.jobVacancy.deleteMany({ where: { id: { in: jobIds } } });
    }

    if (testRecruiterId) {
      await prisma.recruiterProfile.deleteMany({ where: { userId: testRecruiterId } });
    }
    const userIds = [testApplicantUserId, testRecruiterId].filter((id): id is string => Boolean(id));
    if (userIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    if (testCompanyId) {
      await prisma.company.deleteMany({ where: { id: testCompanyId } });
    }
  });

  // --- 1. Job Search & Filters ---
  describe('JobSearchService (FR-AP-16, FR-AP-17)', () => {
    it('1. searches published jobs with keyword filter', async () => {
      const result = await jobSearchService.searchPublishedJobs({
        keyword: 'Senior Full-Stack TypeScript',
      });

      expect(result.items.length).toBeGreaterThan(0);
      const found = result.items.find((j) => j.id === testJobId1);
      expect(found).toBeDefined();
      expect(found?.title).toContain('Senior Full-Stack TypeScript');
      expect(found?.companyName).toContain('Epic8 Tech Corp');
    });

    it('2. filters jobs by employment type and remote-only', async () => {
      const result = await jobSearchService.searchPublishedJobs({
        employmentType: 'REMOTE' as any,
        remoteOnly: true,
      });

      const found = result.items.find((j) => j.id === testJobId1);
      expect(found).toBeDefined();
      expect(found?.employmentType).toBe('REMOTE');
    });

    it('3. returns full published job details', async () => {
      const details = await jobSearchService.getPublishedJobDetails(testJobId1, testApplicantUserId);

      expect(details.id).toBe(testJobId1);
      expect(details.requiredSkills.length).toBe(2);
      expect(details.companyName).toBeDefined();
      expect(details.isSaved).toBe(false);
      expect(details.hasApplied).toBe(false);
    });

    it('4. toggles job bookmark (save & unsave)', async () => {
      // 1. Save
      const saveRes = await jobSearchService.toggleSaveJob(testJobId1, testApplicantUserId);
      expect(saveRes.isSaved).toBe(true);

      const savedList = await jobSearchService.getSavedJobs(testApplicantUserId);
      expect(savedList.some((s) => s.jobId === testJobId1)).toBe(true);

      // 2. Unsave
      const unsaveRes = await jobSearchService.toggleSaveJob(testJobId1, testApplicantUserId);
      expect(unsaveRes.isSaved).toBe(false);

      const savedListAfter = await jobSearchService.getSavedJobs(testApplicantUserId);
      expect(savedListAfter.some((s) => s.jobId === testJobId1)).toBe(false);
    });
  });

  // --- 2. Application Submission & Knockout Logic ---
  describe('ApplicationService (FR-AP-19, FR-AP-20, FR-AP-21)', () => {
    let submittedAppId: string;

    it('1. submits an application successfully with attached CV and computes ATS score', async () => {
      const res = await applicationService.submitApplication(
        {
          jobId: testJobId1,
          cvId: testCvId,
          coverLetter: 'I am excited to apply for this Full-Stack TypeScript position!',
        },
        testApplicantUserId
      );

      expect(res.applicationId).toBeDefined();
      expect(res.status).toBe(ApplicationStatus.APPLIED);
      expect(res.knockoutFailed).toBe(false);
      expect(res.overallScore).toBeGreaterThanOrEqual(0);
      expect(res.scoreBand).toBeDefined();
      submittedAppId = res.applicationId;

      // Verify DB record
      const dbApp = await prisma.application.findUnique({
        where: { id: res.applicationId },
        include: { atsScore: true, candidatePipelines: true },
      });
      expect(dbApp).toBeDefined();
      expect(dbApp?.status).toBe(ApplicationStatus.APPLIED);
      expect(dbApp?.atsScore).toBeDefined();
      expect(dbApp?.candidatePipelines.length).toBeGreaterThan(0);
    });

    it('2. prevents duplicate applications to the same job', async () => {
      await expect(
        applicationService.submitApplication(
          {
            jobId: testJobId1,
            cvId: testCvId,
          },
          testApplicantUserId
        )
      ).rejects.toThrow('You have already submitted an application for this job vacancy.');
    });

    it('3. routes application to REJECTED if knockout question criteria are not met', async () => {
      const res = await applicationService.submitApplication(
        {
          jobId: testKnockoutJobId,
          screeningAnswers: [
            {
              questionId: 'q-work-auth',
              question: 'Are you legally authorized to work in the United States without sponsorship?',
              answer: 'NO', // Required is YES
            },
          ],
        },
        testApplicantUserId
      );

      expect(res.status).toBe(ApplicationStatus.REJECTED);
      expect(res.knockoutFailed).toBe(true);

      const dbApp = await prisma.application.findUnique({
        where: { id: res.applicationId },
        include: { candidatePipelines: true },
      });
      expect(dbApp?.status).toBe(ApplicationStatus.REJECTED);
      expect(dbApp?.candidatePipelines[0].notes).toContain('knockout criteria');
    });

    it('4. retrieves applicant applications with live status and ATS score badges', async () => {
      const list = await applicationService.getMyApplications(testApplicantUserId);

      expect(list.length).toBeGreaterThanOrEqual(2);
      const app1 = list.find((a) => a.jobId === testJobId1);
      expect(app1).toBeDefined();
      expect(app1?.status).toBe(ApplicationStatus.APPLIED);
      expect(app1?.overallScore).toBeDefined();
      expect(app1?.canWithdraw).toBe(true);
    });

    it('5. withdraws an active application successfully', async () => {
      const withdrawRes = await applicationService.withdrawApplication(
        submittedAppId,
        testApplicantUserId,
        'Found another opportunity.'
      );

      expect(withdrawRes.success).toBe(true);
      expect(withdrawRes.status).toBe(ApplicationStatus.WITHDRAWN);

      const dbApp = await prisma.application.findUnique({
        where: { id: submittedAppId },
      });
      expect(dbApp?.status).toBe(ApplicationStatus.WITHDRAWN);
      expect(dbApp?.withdrawnAt).toBeDefined();
    });

    it('6. prevents withdrawing an already withdrawn application', async () => {
      await expect(
        applicationService.withdrawApplication(submittedAppId, testApplicantUserId)
      ).rejects.toThrow('already marked as withdrawn');
    });
  });
});
