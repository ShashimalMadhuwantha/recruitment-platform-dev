import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../db/client';
import { pipelineManagementService } from './pipeline-management.service';
import { talentPoolService } from '../talent-pool/talent-pool.service';
import { ApplicationStatus, ScoreBand } from '@prisma/client';

describe('PipelineManagement & TalentPool Comprehensive Unit Tests', () => {
  let companyId: string;
  let recruiterUserId: string;
  let otherRecruiterUserId: string;
  let applicant1UserId: string;
  let applicant2UserId: string;
  let blindApplicantUserId: string;
  let privateApplicantUserId: string;
  let jobId: string;
  let skillReactId: string;
  let skillNodeId: string;
  let app1Id: string;
  let app2Id: string;

  beforeAll(async () => {
    // 1. Create company
    const company = await prisma.company.create({
      data: {
        name: `Test Pipeline Corp ${Date.now()}`,
        slug: `pipeline-corp-${Date.now()}`,
      },
    });
    companyId = company.id;

    // 2. Create recruiter user
    const recruiterUser = await prisma.user.create({
      data: {
        email: `recruiter-${Date.now()}@pipelinecorp.com`,
        passwordHash: 'dummyhash',
        role: 'RECRUITER',
        status: 'ACTIVE',
        recruiterProfile: {
          create: {
            companyId,
          },
        },
      },
    });
    recruiterUserId = recruiterUser.id;

    const otherRecruiterUser = await prisma.user.create({
      data: {
        email: `other-recruiter-${Date.now()}@othercorp.com`,
        passwordHash: 'dummyhash',
        role: 'RECRUITER',
        status: 'ACTIVE',
        recruiterProfile: {
          create: {
            companyId,
          },
        },
      },
    });
    otherRecruiterUserId = otherRecruiterUser.id;

    // 3. Create skills
    const s1 = await prisma.skill.create({
      data: { name: `React_${Date.now()}`, category: 'Frontend' },
    });
    skillReactId = s1.id;

    const s2 = await prisma.skill.create({
      data: { name: `Node_${Date.now()}`, category: 'Backend' },
    });
    skillNodeId = s2.id;

    // 4. Create Job Vacancy
    const job = await prisma.jobVacancy.create({
      data: {
        companyId,
        createdById: recruiterUserId,
        title: 'Full Stack Engineer',
        description: 'Building modern apps',
        status: 'PUBLISHED',
        jobRequiredSkills: {
          create: [
            {
              skillId: skillReactId,
              priority: 'MUST_HAVE' as any,
              minProficiency: 3,
              weight: 0.6,
            },
            {
              skillId: skillNodeId,
              priority: 'NICE_TO_HAVE' as any,
              minProficiency: 3,
              weight: 0.4,
            },
          ],
        },
      },
    });
    jobId = job.id;

    // 5. Create applicant 1 (Public)
    const app1User = await prisma.user.create({
      data: {
        email: `applicant1-${Date.now()}@example.com`,
        passwordHash: 'dummyhash',
        role: 'APPLICANT',
        status: 'ACTIVE',
        applicantProfile: {
          create: {
            firstName: 'Alice',
            lastName: 'Walker',
            headline: 'Senior React Developer',
            location: 'New York, NY',
            visibilitySettings: { visibility: 'PUBLIC', isSearchable: true },
            applicantSkills: {
              create: [
                { skillId: skillReactId, proficiency: 4, yearsExperience: 5 },
                { skillId: skillNodeId, proficiency: 3, yearsExperience: 3 },
              ],
            },
            educations: {
              create: [
                {
                  institution: 'NYU',
                  degree: 'BSc Computer Science',
                  fieldOfStudy: 'Engineering',
                },
              ],
            },
            workExperiences: {
              create: [
                {
                  companyName: 'Tech Co',
                  title: 'Senior Dev',
                  startDate: new Date('2020-01-01'),
                  endDate: new Date('2024-01-01'),
                },
              ],
            },
          },
        },
      },
      include: { applicantProfile: true },
    });
    applicant1UserId = app1User.id;

    // 6. Create applicant 2 (Public)
    const app2User = await prisma.user.create({
      data: {
        email: `applicant2-${Date.now()}@example.com`,
        passwordHash: 'dummyhash',
        role: 'APPLICANT',
        status: 'ACTIVE',
        applicantProfile: {
          create: {
            firstName: 'Bob',
            lastName: 'Smith',
            headline: 'Junior Backend Developer',
            location: 'Austin, TX',
            visibilitySettings: { visibility: 'PUBLIC', isSearchable: true },
            applicantSkills: {
              create: [{ skillId: skillNodeId, proficiency: 2, yearsExperience: 1 }],
            },
          },
        },
      },
      include: { applicantProfile: true },
    });
    applicant2UserId = app2User.id;

    // 7. Create Blind Applicant
    const blindUser = await prisma.user.create({
      data: {
        email: `blind-${Date.now()}@example.com`,
        passwordHash: 'dummyhash',
        role: 'APPLICANT',
        status: 'ACTIVE',
        applicantProfile: {
          create: {
            firstName: 'Secret',
            lastName: 'Candidate',
            headline: 'Lead Architect',
            location: 'Remote',
            visibilitySettings: { visibility: 'BLIND', isSearchable: true },
            applicantSkills: {
              create: [{ skillId: skillReactId, proficiency: 5, yearsExperience: 8 }],
            },
          },
        },
      },
    });
    blindApplicantUserId = blindUser.id;

    // 8. Create Private Applicant
    const privateUser = await prisma.user.create({
      data: {
        email: `private-${Date.now()}@example.com`,
        passwordHash: 'dummyhash',
        role: 'APPLICANT',
        status: 'ACTIVE',
        applicantProfile: {
          create: {
            firstName: 'Private',
            lastName: 'Hidden',
            headline: 'Stealth Dev',
            visibilitySettings: { visibility: 'PRIVATE', isSearchable: false },
          },
        },
      },
    });
    privateApplicantUserId = privateUser.id;

    // 9. Create Applications for Job
    const appRecord1 = await prisma.application.create({
      data: {
        jobId,
        applicantId: app1User.applicantProfile!.id,
        status: ApplicationStatus.APPLIED,
        atsScore: {
          create: {
            overallScore: 88,
            scoreBand: ScoreBand.HIGH,
            skillsScore: 90,
            experienceScore: 85,
            educationScore: 90,
            semanticTfidfScore: 80,
            certificationScore: 0,
            topMatchingTermsJson: JSON.stringify(['React', 'Node']),
          },
        },
      },
    });
    app1Id = appRecord1.id;

    const appRecord2 = await prisma.application.create({
      data: {
        jobId,
        applicantId: app2User.applicantProfile!.id,
        status: ApplicationStatus.APPLIED,
        atsScore: {
          create: {
            overallScore: 45,
            scoreBand: ScoreBand.LOW,
            skillsScore: 40,
            experienceScore: 30,
            educationScore: 50,
            semanticTfidfScore: 40,
            certificationScore: 0,
          },
        },
      },
    });
    app2Id = appRecord2.id;
  });

  afterAll(async () => {
    // Clean up
    const appIds = [app1Id, app2Id].filter(Boolean);
    if (appIds.length > 0) {
      await prisma.candidateNote.deleteMany({ where: { applicationId: { in: appIds } } });
      await prisma.candidatePipeline.deleteMany({ where: { applicationId: { in: appIds } } });
      await prisma.aTSScore.deleteMany({ where: { applicationId: { in: appIds } } });
      await prisma.application.deleteMany({ where: { id: { in: appIds } } });
    }
    if (jobId) {
      await prisma.jobRequiredSkill.deleteMany({ where: { jobId } });
      await prisma.pipelineStage.deleteMany({ where: { jobId } });
      await prisma.jobVacancy.deleteMany({ where: { id: jobId } });
    }
    const skillIds = [skillReactId, skillNodeId].filter(Boolean);
    if (skillIds.length > 0) {
      await prisma.applicantSkill.deleteMany({ where: { skillId: { in: skillIds } } });
      await prisma.skill.deleteMany({ where: { id: { in: skillIds } } });
    }
    const appUserIds = [applicant1UserId, applicant2UserId].filter(Boolean);
    if (appUserIds.length > 0) {
      await prisma.education.deleteMany({ where: { applicant: { userId: { in: appUserIds } } } });
      await prisma.workExperience.deleteMany({ where: { applicant: { userId: { in: appUserIds } } } });
    }
    const allProfileUserIds = [applicant1UserId, applicant2UserId, blindApplicantUserId, privateApplicantUserId].filter(Boolean);
    if (allProfileUserIds.length > 0) {
      await prisma.applicantProfile.deleteMany({
        where: { userId: { in: allProfileUserIds } },
      });
    }
    const recruiterIds = [recruiterUserId, otherRecruiterUserId].filter(Boolean);
    if (recruiterIds.length > 0) {
      await prisma.recruiterProfile.deleteMany({ where: { userId: { in: recruiterIds } } });
    }
    const allUserIds = [
      recruiterUserId,
      otherRecruiterUserId,
      applicant1UserId,
      applicant2UserId,
      blindApplicantUserId,
      privateApplicantUserId,
    ].filter(Boolean);
    if (allUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: allUserIds } } });
    }
    if (companyId) {
      await prisma.company.deleteMany({ where: { id: companyId } });
    }
  });

  it('FR-RC-10: should list applications with ATS scores, filters, and sorting', async () => {
    // Fetch all applications
    const candidates = await pipelineManagementService.getJobApplicationsWithFilters(
      jobId,
      recruiterUserId,
      'RECRUITER'
    );

    expect(candidates.length).toBe(2);
    expect(candidates[0].jobId).toBe(jobId);

    // High score candidate (Alice) has matched must-have skill
    const alice = candidates.find((c) => c.fullName === 'Alice Walker');
    expect(alice).toBeDefined();
    expect(alice?.atsScore?.overallScore).toBe(88);
    expect(alice?.atsScore?.scoreBand).toBe(ScoreBand.HIGH);
    expect(alice?.matchedMustHaveSkillsCount).toBe(1);

    // Filter by scoreBand: HIGH
    const highCandidates = await pipelineManagementService.getJobApplicationsWithFilters(
      jobId,
      recruiterUserId,
      'RECRUITER',
      { scoreBand: ScoreBand.HIGH }
    );
    expect(highCandidates.length).toBe(1);
    expect(highCandidates[0].fullName).toBe('Alice Walker');

    // Filter by search: "Bob"
    const bobCandidates = await pipelineManagementService.getJobApplicationsWithFilters(
      jobId,
      recruiterUserId,
      'RECRUITER',
      { search: 'Bob' }
    );
    expect(bobCandidates.length).toBe(1);
    expect(bobCandidates[0].fullName).toBe('Bob Smith');
  });

  it('FR-RC-12: should move candidate stage and create pipeline audit trail', async () => {
    const moveResult = await pipelineManagementService.moveCandidateStage(
      app1Id,
      recruiterUserId,
      'RECRUITER',
      {
        stage: ApplicationStatus.SHORTLISTED,
        notes: 'Passed screening, advancing to interview stage',
      }
    );

    expect(moveResult.success).toBe(true);
    expect(moveResult.status).toBe(ApplicationStatus.SHORTLISTED);
    expect(moveResult.stageName).toBe('Shortlisted');

    // Verify DB update
    const updatedApp = await prisma.application.findUnique({ where: { id: app1Id } });
    expect(updatedApp?.status).toBe(ApplicationStatus.SHORTLISTED);

    const pipelineHistory = await prisma.candidatePipeline.findMany({
      where: { applicationId: app1Id },
    });
    expect(pipelineHistory.length).toBeGreaterThanOrEqual(1);
    expect(pipelineHistory[0].notes).toContain('Passed screening');
  });

  it('FR-RC-14: should bulk move multiple candidates', async () => {
    const bulkResult = await pipelineManagementService.bulkMoveCandidateStage(
      recruiterUserId,
      'RECRUITER',
      {
        applicationIds: [app1Id, app2Id],
        stage: ApplicationStatus.INTERVIEW,
        notes: 'Bulk invite to technical interview',
      }
    );

    expect(bulkResult.success).toBe(true);
    expect(bulkResult.updatedCount).toBe(2);
    expect(bulkResult.stage).toBe(ApplicationStatus.INTERVIEW);

    const apps = await prisma.application.findMany({ where: { id: { in: [app1Id, app2Id] } } });
    expect(apps.every((a) => a.status === ApplicationStatus.INTERVIEW)).toBe(true);
  });

  it('FR-RC-15: should support adding, viewing, and deleting internal candidate notes and ratings', async () => {
    // 1. Add Note with 5-star rating
    const note = await pipelineManagementService.addCandidateNote(
      app1Id,
      recruiterUserId,
      'RECRUITER',
      {
        content: 'Impressive live coding challenge and system design knowledge.',
        rating: 5,
      }
    );

    expect(note.id).toBeDefined();
    expect(note.rating).toBe(5);
    expect(note.content).toContain('Impressive live coding');

    // 2. Fetch notes
    const notes = await pipelineManagementService.getCandidateNotes(
      app1Id,
      recruiterUserId,
      'RECRUITER'
    );
    expect(notes.length).toBe(1);
    expect(notes[0].rating).toBe(5);

    // 3. Delete note
    const delResult = await pipelineManagementService.deleteCandidateNote(
      note.id,
      recruiterUserId,
      'RECRUITER'
    );
    expect(delResult.success).toBe(true);

    const notesAfterDel = await pipelineManagementService.getCandidateNotes(
      app1Id,
      recruiterUserId,
      'RECRUITER'
    );
    expect(notesAfterDel.length).toBe(0);
  });

  it('FR-RC-16: should generate side-by-side comparison matrix for 2 candidates', async () => {
    const comparison = await pipelineManagementService.compareCandidates(
      [app1Id, app2Id],
      recruiterUserId,
      'RECRUITER'
    );

    expect(comparison.jobId).toBe(jobId);
    expect(comparison.candidates.length).toBe(2);

    const candidate1 = comparison.candidates.find((c) => c.applicationId === app1Id);
    const candidate2 = comparison.candidates.find((c) => c.applicationId === app2Id);

    expect(candidate1).toBeDefined();
    expect(candidate2).toBeDefined();

    // Alice has React skill matched
    const reactMatch = candidate1?.skills.find((s) => s.name.startsWith('React_'));
    expect(reactMatch?.isMatched).toBe(true);
    expect(candidate1?.yearsOfExperience).toBeGreaterThanOrEqual(3.5);
    expect(candidate1?.educationSummary).toContain('NYU');

    // Bob has low score
    expect(candidate2?.overallScore).toBe(45);
  });

  it('FR-RC-11: should search talent pool respecting candidate visibility settings (PUBLIC vs BLIND vs PRIVATE)', async () => {
    // 1. Search all candidates in talent pool
    const result = await talentPoolService.searchTalentPool(
      recruiterUserId,
      'RECRUITER',
      { limit: 50 }
    );

    // Should include Alice, Bob, and Blind candidate. Must NOT include Private candidate!
    const candidateIds = result.candidates.map((c) => c.id);
    const names = result.candidates.map((c) => c.fullName);

    // Verify private candidate is excluded
    expect(names.some((n) => n.includes('Private Hidden'))).toBe(false);

    // Verify blind candidate is masked
    const blind = result.candidates.find((c) => c.isBlind);
    expect(blind).toBeDefined();
    expect(blind?.fullName).toMatch(/^Candidate #[A-Z0-9]+/);
    expect(blind?.email).toBeUndefined();
    expect(blind?.phone).toBeUndefined();

    // 2. Filter by search "Walker"
    const aliceSearch = await talentPoolService.searchTalentPool(
      recruiterUserId,
      'RECRUITER',
      { search: 'Walker' }
    );
    expect(aliceSearch.candidates.length).toBe(1);
    expect(aliceSearch.candidates[0].fullName).toBe('Alice Walker');
  });
});
