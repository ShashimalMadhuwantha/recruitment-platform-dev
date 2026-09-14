import { describe, it, expect, beforeAll } from 'vitest';
import { JobVacancyService } from './job-vacancy.service';
import { prisma } from '../../db/client';
import bcrypt from 'bcrypt';
import { JobStatus, EmploymentType, SkillPriority } from '@prisma/client';

describe('JobVacancyService Unit & Integration Tests (Epic 5)', () => {
  let jobVacancyService: JobVacancyService;
  let recruiterUserId: string;
  let companyId: string;
  let testSkillId1: string;
  let testSkillId2: string;
  let createdJobId: string;

  beforeAll(async () => {
    jobVacancyService = new JobVacancyService();
    const passwordHash = await bcrypt.hash('RecruiterPass123!', 10);

    // 1. Create a company with Free plan (max 3 jobs)
    const freePlan = await prisma.subscriptionPlan.findFirst({
      where: { tier: 'FREE' },
    });

    const company = await prisma.company.create({
      data: {
        name: `Acme Staffing ${Date.now()}`,
        slug: `acme-staffing-${Date.now()}`,
        status: 'ACTIVE',
        planId: freePlan?.id,
      },
    });
    companyId = company.id;

    // 2. Create Recruiter user associated with company
    const recruiter = await prisma.user.create({
      data: {
        email: `recruiter-vacancies-${Date.now()}@example.com`,
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
    recruiterUserId = recruiter.id;

    // 3. Ensure test skills exist
    const skill1 = await prisma.skill.upsert({
      where: { name: 'React' },
      update: {},
      create: { name: 'React', category: 'Frontend' },
    });
    testSkillId1 = skill1.id;

    const skill2 = await prisma.skill.upsert({
      where: { name: 'Node.js' },
      update: {},
      create: { name: 'Node.js', category: 'Backend' },
    });
    testSkillId2 = skill2.id;
  });

  describe('1. Discriminatory Keyword Auto-Check & Compliance', () => {
    it('should detect banned keywords with BLOCK severity', async () => {
      const result = await jobVacancyService.checkCompliance(
        'Junior React Developer',
        'We are seeking a recent graduate only for our fast paced startup.'
      );

      expect(result.hasViolations).toBe(true);
      expect(result.canPublish).toBe(false);
      expect(result.violations.some((v) => v.keyword === 'recent graduate only')).toBe(true);
    });

    it('should pass compliance when text is clean', async () => {
      const result = await jobVacancyService.checkCompliance(
        'Staff Software Engineer',
        'We are looking for an experienced full stack engineer with strong system design skills.'
      );

      expect(result.hasViolations).toBe(false);
      expect(result.canPublish).toBe(true);
    });

    it('should detect banned keywords when present in requirementsSummary', async () => {
      const result = await jobVacancyService.checkCompliance(
        'Staff Engineer',
        'Looking for senior engineering leadership.',
        'Requires recent graduate only.'
      );

      expect(result.hasViolations).toBe(true);
      expect(result.canPublish).toBe(false);
      expect(result.violations.some((v) => v.keyword === 'recent graduate only')).toBe(true);
    });
  });

  describe('2. Multi-Step Job Creation & Publishing Wizard', () => {
    it('should create a job vacancy as DRAFT with requirements and required skills', async () => {
      const job = await jobVacancyService.createJobVacancy(
        {
          title: 'Full Stack Engineer (React/Node)',
          description: 'Build enterprise platforms with modern tech stack and high scale.',
          requirementsSummary: 'Minimum 3 years of hands-on full stack experience required.',
          location: 'San Francisco, CA (Hybrid)',
          employmentType: EmploymentType.FULL_TIME,
          salaryMin: 120000,
          salaryMax: 160000,
          status: JobStatus.DRAFT,
          requirements: {
            minExperienceYears: 3,
            maxExperienceYears: 7,
            educationLevel: 'Bachelor',
            requiredCertifications: ['AWS Certified Developer'],
          },
          requiredSkills: [
            {
              skillId: testSkillId1,
              priority: SkillPriority.MUST_HAVE,
              weight: 1.5,
              minProficiency: 4,
            },
            {
              skillId: testSkillId2,
              priority: SkillPriority.MUST_HAVE,
              weight: 1.0,
              minProficiency: 3,
            },
          ],
          screeningQuestions: [
            {
              id: 'q1',
              question: 'Are you legally authorized to work in the United States?',
              type: 'YES_NO',
              isKnockout: true,
              requiredAnswer: 'YES',
            },
          ],
          atsWeightOverrides: {
            skillsWeight: 0.50,
            experienceWeight: 0.20,
            educationWeight: 0.10,
            semanticWeight: 0.15,
            certificationWeight: 0.05,
          },
        },
        recruiterUserId,
        'RECRUITER'
      );

      expect(job.id).toBeDefined();
      expect(job.title).toBe('Full Stack Engineer (React/Node)');
      expect(job.status).toBe(JobStatus.DRAFT);
      expect(job.jobRequirement).toBeDefined();
      expect(Number(job.jobRequirement?.minExperienceYears)).toBe(3);
      expect(job.jobRequiredSkills).toHaveLength(2);
      expect(job.scoreWeightConfigs).toHaveLength(1);
      expect(Number(job.scoreWeightConfigs?.[0].skillsWeight)).toBe(0.50);

      createdJobId = job.id;
    });

    it('should reject publishing a job if it contains BLOCK discriminatory keywords', async () => {
      await expect(
        jobVacancyService.createJobVacancy(
          {
            title: 'Frontend Developer',
            description: 'Must be young and energetic developer.',
            status: JobStatus.PUBLISHED,
          },
          recruiterUserId,
          'RECRUITER'
        )
      ).rejects.toThrow('prohibited discriminatory keywords');
    });

    it('should reject publishing a job if requirementsSummary contains BLOCK keywords', async () => {
      await expect(
        jobVacancyService.createJobVacancy(
          {
            title: 'Backend Developer',
            description: 'Building modern microservices.',
            requirementsSummary: 'Seeking young and energetic talent.',
            status: JobStatus.PUBLISHED,
          },
          recruiterUserId,
          'RECRUITER'
        )
      ).rejects.toThrow('prohibited discriminatory keywords');
    });

    it('should reject edits to an already published job if edit introduces BLOCK keywords in description or requirementsSummary', async () => {
      // First publish a valid job
      const cleanJob = await jobVacancyService.createJobVacancy(
        {
          title: 'Clean Published Job',
          description: 'Valid clean description for published position.',
          status: JobStatus.PUBLISHED,
        },
        recruiterUserId,
        'RECRUITER'
      );
      expect(cleanJob.status).toBe(JobStatus.PUBLISHED);

      // Attempt edit with BLOCK keyword in description
      await expect(
        jobVacancyService.updateJobVacancy(
          cleanJob.id,
          {
            description: 'Updated to require young and energetic developer.',
          },
          recruiterUserId,
          'RECRUITER'
        )
      ).rejects.toThrow('prohibited discriminatory keywords');

      // Attempt edit with BLOCK keyword in requirementsSummary
      await expect(
        jobVacancyService.updateJobVacancy(
          cleanJob.id,
          {
            requirementsSummary: 'Must be recent graduate only.',
          },
          recruiterUserId,
          'RECRUITER'
        )
      ).rejects.toThrow('prohibited discriminatory keywords');
    });
  });

  describe('3. Job Lifecycle & Status Transitions', () => {
    it('should publish a valid draft job vacancy', async () => {
      const updated = await jobVacancyService.updateJobStatus(
        createdJobId,
        JobStatus.PUBLISHED,
        recruiterUserId,
        'RECRUITER'
      );

      expect(updated.status).toBe(JobStatus.PUBLISHED);
    });

    it('should pause an active job vacancy', async () => {
      const updated = await jobVacancyService.updateJobStatus(
        createdJobId,
        JobStatus.PAUSED,
        recruiterUserId,
        'RECRUITER'
      );

      expect(updated.status).toBe(JobStatus.PAUSED);
    });

    it('should reactivate and close a vacancy', async () => {
      await jobVacancyService.updateJobStatus(
        createdJobId,
        JobStatus.PUBLISHED,
        recruiterUserId,
        'RECRUITER'
      );

      const closed = await jobVacancyService.updateJobStatus(
        createdJobId,
        JobStatus.CLOSED,
        recruiterUserId,
        'RECRUITER'
      );

      expect(closed.status).toBe(JobStatus.CLOSED);
    });
  });

  describe('4. Vacancy Duplication & Cloning', () => {
    it('should clone an existing vacancy into a new DRAFT copy with requirements and skills intact', async () => {
      const cloned = await jobVacancyService.cloneJobVacancy(
        createdJobId,
        recruiterUserId,
        'RECRUITER'
      );

      expect(cloned.id).not.toBe(createdJobId);
      expect(cloned.title).toBe('Copy of Full Stack Engineer (React/Node)');
      expect(cloned.status).toBe(JobStatus.DRAFT);
      expect(cloned.jobRequiredSkills).toHaveLength(2);
      expect(cloned.jobRequirement).toBeDefined();
    });
  });

  describe('5. Recruiter Job Listing & Metrics', () => {
    it('should list jobs for the recruiter company with application metrics', async () => {
      const result = await jobVacancyService.listCompanyJobs(recruiterUserId, 'RECRUITER', {
        page: 1,
        limit: 10,
      });

      expect(result.items.length).toBeGreaterThanOrEqual(2);
      expect(result.items[0].applicationsCount).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(2);
    });
  });
});
