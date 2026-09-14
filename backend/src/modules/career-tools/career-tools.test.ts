import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../../db/client';
import { careerToolsService } from './career-tools.service';
import { JobStatus, EmploymentType } from '@prisma/client';

describe('Epic 13: Career Tools & CV Diagnostics Unit Tests (FR-AP-22, FR-AP-23, FR-AP-24)', () => {
  let applicantUserId: string;
  let applicantProfileId: string;
  let companyId: string;
  let recruiterUserId: string;
  let skillReactId: string;
  let skillNodeId: string;
  let skillDockerId: string;
  let skillAwsId: string;

  beforeAll(async () => {
    // 1. Create company
    const company = await prisma.company.create({
      data: {
        name: `Career Corp ${Date.now()}`,
        slug: `career-corp-${Date.now()}`,
      },
    });
    companyId = company.id;

    // 2. Create recruiter
    const recruiter = await prisma.user.create({
      data: {
        email: `recruiter-career-${Date.now()}@example.com`,
        passwordHash: 'dummyhash',
        role: 'RECRUITER',
        status: 'ACTIVE',
        recruiterProfile: {
          create: {
            companyId,
            title: 'Technical Recruiter',
          },
        },
      },
    });
    recruiterUserId = recruiter.id;

    // 3. Resolve or create test skills
    const sReact = await prisma.skill.upsert({
      where: { name: 'React' },
      update: {},
      create: { name: 'React', category: 'Frontend' },
    });
    skillReactId = sReact.id;

    const sNode = await prisma.skill.upsert({
      where: { name: 'Node.js' },
      update: {},
      create: { name: 'Node.js', category: 'Backend' },
    });
    skillNodeId = sNode.id;

    const sDocker = await prisma.skill.upsert({
      where: { name: 'Docker' },
      update: {},
      create: { name: 'Docker', category: 'DevOps' },
    });
    skillDockerId = sDocker.id;

    const sAws = await prisma.skill.upsert({
      where: { name: 'AWS' },
      update: {},
      create: { name: 'AWS', category: 'Cloud' },
    });
    skillAwsId = sAws.id;

    // 4. Create applicant user with partial profile
    const applicant = await prisma.user.create({
      data: {
        email: `candidate-career-${Date.now()}@example.com`,
        passwordHash: 'dummyhash',
        role: 'APPLICANT',
        status: 'ACTIVE',
        applicantProfile: {
          create: {
            firstName: 'Taylor',
            lastName: 'Swiftdev',
            phone: '+1 555-0188',
            location: 'Seattle, WA',
            headline: 'Frontend Engineer | React Specialist',
            summary:
              'Passionate software engineer with 4+ years of hands-on experience architecting scalable React web applications, designing intuitive user interfaces, and optimizing client-side performance.',
            applicantSkills: {
              create: [
                { skillId: skillReactId, proficiency: 5, yearsExperience: 4 },
                { skillId: skillNodeId, proficiency: 4, yearsExperience: 3 },
              ],
            },
            workExperiences: {
              create: [
                {
                  companyName: 'CloudScale Inc',
                  title: 'Frontend Developer',
                  startDate: new Date('2021-01-01'),
                  endDate: new Date('2023-12-31'),
                  description:
                    'Architected modern micro-frontend dashboards. Spearheaded migration to Vite which reduced build time by 45%. Optimized state management to support 250k daily active users.',
                },
              ],
            },
            educations: {
              create: [
                {
                  institution: 'University of Washington',
                  degree: 'Bachelor of Science',
                  fieldOfStudy: 'Computer Science',
                  startDate: new Date('2016-09-01'),
                  endDate: new Date('2020-06-01'),
                },
              ],
            },
          },
        },
      },
      include: { applicantProfile: true },
    });
    applicantUserId = applicant.id;
    applicantProfileId = applicant.applicantProfile!.id;

    // 5. Create jobs requiring Docker and AWS (missing from applicant profile)
    const job1 = await prisma.jobVacancy.create({
      data: {
        companyId,
        createdById: recruiterUserId,
        title: 'Full Stack Cloud Engineer',
        description: 'Building modern cloud microservices.',
        status: JobStatus.PUBLISHED,
        employmentType: EmploymentType.FULL_TIME,
        jobRequiredSkills: {
          create: [
            { skillId: skillReactId, priority: 'MUST_HAVE', weight: 0.3 },
            { skillId: skillDockerId, priority: 'MUST_HAVE', weight: 0.4 },
            { skillId: skillAwsId, priority: 'NICE_TO_HAVE', weight: 0.3 },
          ],
        },
      },
    });

    const job2 = await prisma.jobVacancy.create({
      data: {
        companyId,
        createdById: recruiterUserId,
        title: 'DevOps & React Platform Engineer',
        description: 'Platform infrastructure and frontends.',
        status: JobStatus.PUBLISHED,
        employmentType: EmploymentType.FULL_TIME,
        jobRequiredSkills: {
          create: [
            { skillId: skillReactId, priority: 'MUST_HAVE', weight: 0.3 },
            { skillId: skillDockerId, priority: 'MUST_HAVE', weight: 0.4 },
          ],
        },
      },
    });

    // 6. Applicant applies to Job 1 and saves Job 2
    await prisma.application.create({
      data: {
        applicantId: applicantProfileId,
        jobId: job1.id,
      },
    });

    await prisma.savedJob.create({
      data: {
        applicantId: applicantProfileId,
        jobId: job2.id,
      },
    });
  });

  describe('1. CV Health-Check Diagnostic Engine (FR-AP-24)', () => {
    it('runs comprehensive diagnostic check and evaluates section completeness, verbs, and metrics', async () => {
      const result = await careerToolsService.runCvHealthCheck(applicantUserId);

      expect(result.healthScore).toBeGreaterThanOrEqual(70);
      expect(result.grade).toBeDefined();
      expect(result.wordCount).toBeGreaterThan(50);
      expect(result.actionVerbCount).toBeGreaterThanOrEqual(2); // 'architected', 'spearheaded', 'optimized'
      expect(result.quantifiableMetricsCount).toBeGreaterThanOrEqual(2); // '45%', '250k'

      // Check section completeness flags
      expect(result.sectionChecks.contactInfo).toBe(true);
      expect(result.sectionChecks.summary).toBe(true);
      expect(result.sectionChecks.experience).toBe(true);
      expect(result.sectionChecks.education).toBe(true);

      // Issues should contain at least 1 passed check
      expect(result.passedChecksCount).toBeGreaterThanOrEqual(3);
      expect(result.topKeywords.length).toBeGreaterThan(0);
    });
  });

  describe('2. "Improve My Profile" Market Aggregation (FR-AP-23)', () => {
    it('analyzes applied/saved vacancies, detects missing skills (Docker, AWS), and ranks recommendations', async () => {
      const suggestions = await careerToolsService.getProfileImprovementSuggestions(applicantUserId);

      expect(suggestions.overallReadinessScore).toBeGreaterThanOrEqual(50);
      expect(suggestions.targetJobsAnalyzedCount).toBe(2);

      // Docker appears in BOTH jobs (100% demand) and candidate does not have it
      const dockerGap = suggestions.topMissingSkills.find((s) => s.name === 'Docker');
      expect(dockerGap).toBeDefined();
      expect(dockerGap?.frequency).toBe(2);
      expect(dockerGap?.priority).toBe('HIGH');

      // AWS appears in 1 job and candidate does not have it
      const awsGap = suggestions.topMissingSkills.find((s) => s.name === 'AWS');
      expect(awsGap).toBeDefined();
      expect(awsGap?.frequency).toBe(1);

      // Verify actionable suggestions list contains skill gap advice
      const skillSuggestion = suggestions.suggestions.find((s) => s.category === 'SKILL_GAP');
      expect(skillSuggestion).toBeDefined();
      expect(skillSuggestion?.title).toContain('Docker');
      expect(skillSuggestion?.actionType).toBe('ADD_SKILL');
    });
  });
});
