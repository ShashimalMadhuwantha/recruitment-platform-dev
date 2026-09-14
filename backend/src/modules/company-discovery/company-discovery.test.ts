import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../db/client';
import { CompanyDiscoveryService } from './company-discovery.service';
import bcrypt from 'bcrypt';

describe('Epic 18 — Applicant: Company Discovery & Employer Profile Hub', () => {
  let testCompanyId: string;
  let testCompanySlug: string;
  let applicantUserId: string;
  let applicantProfileId: string;
  let testJobId: string;

  beforeAll(async () => {
    // 1. Create a test company with rich employer branding
    testCompanySlug = `discovery-corp-${Date.now()}`;
    const company = await prisma.company.create({
      data: {
        name: 'Discovery Technology Systems',
        slug: testCompanySlug,
        industry: 'Software Engineering',
        size: '51-200',
        website: 'https://discovery-tech.example.com',
        description: 'Building world-class developer tools and intelligence systems.',
        logoUrl: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=200',
        coverPhotoUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200',
        status: 'ACTIVE',
        locationsJson: [
          {
            id: 'loc-1',
            name: 'Global Headquarters',
            city: 'San Francisco',
            state: 'CA',
            country: 'United States',
            address: '500 Howard Street, Suite 400',
            isHQ: true,
          },
          {
            id: 'loc-2',
            name: 'European Engineering Center',
            city: 'London',
            country: 'United Kingdom',
            address: '10 Finsbury Square',
            isHQ: false,
          },
        ],
        cultureMediaJson: [
          {
            id: 'media-1',
            type: 'IMAGE',
            url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
            caption: 'Engineering team annual offsite hackathon',
            order: 0,
          },
        ],
        socialLinksJson: {
          linkedin: 'https://linkedin.com/company/discovery-tech',
          twitter: 'https://twitter.com/discovery_tech',
          github: 'https://github.com/discovery-tech',
        },
      },
    });
    testCompanyId = company.id;

    // 2. Create an applicant user and profile with skills & experience
    const passwordHash = await bcrypt.hash('TestApplicantPass123!', 10);
    const applicantUser = await prisma.user.create({
      data: {
        email: `applicant.discovery.${Date.now()}@example.com`,
        passwordHash,
        role: 'APPLICANT',
        status: 'ACTIVE',
      },
    });
    applicantUserId = applicantUser.id;

    const applicantProfile = await prisma.applicantProfile.create({
      data: {
        userId: applicantUserId,
        firstName: 'Alex',
        lastName: 'Developer',
        headline: 'Senior Full Stack Engineer',
        summary: 'Experienced React and Node.js TypeScript engineer.',
        location: 'San Francisco, CA',
      },
    });
    applicantProfileId = applicantProfile.id;

    // Create a skill and link to applicant
    const skill = await prisma.skill.upsert({
      where: { name: 'TypeScript' },
      update: {},
      create: { name: 'TypeScript', category: 'Programming' },
    });

    await prisma.applicantSkill.create({
      data: {
        applicantId: applicantProfileId,
        skillId: skill.id,
        proficiency: 4,
        yearsExperience: 5,
      },
    });

    // 3. Create a published job for this company
    const job = await prisma.jobVacancy.create({
      data: {
        companyId: testCompanyId,
        createdById: applicantUserId, // reuse user id as creator for test simplicity
        title: 'Senior TypeScript Architect',
        employmentType: 'FULL_TIME',
        location: 'San Francisco, CA',
        status: 'PUBLISHED',
        description: 'Lead TypeScript platform architecture and scalable APIs.',
        salaryMin: 150000,
        salaryMax: 190000,
      },
    });
    testJobId = job.id;

    await prisma.jobRequiredSkill.create({
      data: {
        jobId: testJobId,
        skillId: skill.id,
        priority: 'MUST_HAVE',
        weight: 1.0,
      },
    });
  });

  afterAll(async () => {
    // Cleanup created test records
    await prisma.companyFollow.deleteMany({
      where: {
        OR: [{ companyId: testCompanyId }, { applicantId: applicantUserId }],
      },
    });
    await prisma.jobRequiredSkill.deleteMany({
      where: { jobId: testJobId },
    });
    await prisma.jobVacancy.deleteMany({
      where: { companyId: testCompanyId },
    });
    await prisma.applicantSkill.deleteMany({
      where: { applicantId: applicantProfileId },
    });
    await prisma.applicantProfile.deleteMany({
      where: { id: applicantProfileId },
    });
    await prisma.user.deleteMany({
      where: { id: applicantUserId },
    });
    await prisma.company.deleteMany({
      where: { id: testCompanyId },
    });
  });

  it('FR-AP-31: should search companies in public directory by keyword and location', async () => {
    const searchRes = await CompanyDiscoveryService.searchCompanies({
      page: 1,
      limit: 10,
      keyword: 'Discovery Technology',
      location: 'San Francisco',
      sortBy: 'name',
      sortOrder: 'asc',
    });

    expect(searchRes.items.length).toBeGreaterThanOrEqual(1);
    const found = searchRes.items.find((c) => c.id === testCompanyId);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Discovery Technology Systems');
    expect(found?.headquarters).toContain('San Francisco');
    expect(found?.activeJobCount).toBeGreaterThanOrEqual(1);
  });

  it('FR-AP-32: should retrieve rich employer profile by slug and ID', async () => {
    const profile = await CompanyDiscoveryService.getCompanyBySlugOrId(testCompanySlug);

    expect(profile.id).toBe(testCompanyId);
    expect(profile.slug).toBe(testCompanySlug);
    expect(profile.name).toBe('Discovery Technology Systems');
    expect(profile.locations.length).toBe(2);
    expect(profile.locations[0].isHQ).toBe(true);
    expect(profile.cultureMedia.length).toBe(1);
    expect(profile.socialLinks.linkedin).toBe('https://linkedin.com/company/discovery-tech');
    expect(profile.activeJobCount).toBeGreaterThanOrEqual(1);
  });

  it('FR-AP-33: should retrieve active job vacancies with predicted ATS score for applicant', async () => {
    const jobsRes = await CompanyDiscoveryService.getCompanyJobs(testCompanyId, applicantUserId);

    expect(jobsRes.jobs.length).toBeGreaterThanOrEqual(1);
    const job = jobsRes.jobs.find((j) => j.id === testJobId);
    expect(job).toBeDefined();
    expect(job?.title).toBe('Senior TypeScript Architect');
    expect(job?.skills).toContain('TypeScript');
    // ATS predicted score should be calculated because applicant has TypeScript skill
    expect(job?.predictedAtsScore).not.toBeNull();
    expect(job?.predictedAtsScore).toBeGreaterThan(0);
    expect(job?.hasApplied).toBe(false);
  });

  it('FR-AP-35: should toggle follow and unfollow company and update follower counts', async () => {
    // 1. Initial follow
    const followRes = await CompanyDiscoveryService.toggleFollowCompany(
      applicantUserId,
      testCompanyId
    );
    expect(followRes.isFollowed).toBe(true);
    expect(followRes.followerCount).toBe(1);

    // Verify company profile reflects followed state
    const profileWithFollow = await CompanyDiscoveryService.getCompanyBySlugOrId(
      testCompanyId,
      applicantUserId
    );
    expect(profileWithFollow.isFollowedByMe).toBe(true);
    expect(profileWithFollow.followerCount).toBe(1);

    // Verify followed companies list
    const followedList = await CompanyDiscoveryService.getFollowedCompanies(applicantUserId);
    expect(followedList.items.some((c) => c.id === testCompanyId)).toBe(true);

    // 2. Unfollow
    const unfollowRes = await CompanyDiscoveryService.toggleFollowCompany(
      applicantUserId,
      testCompanyId
    );
    expect(unfollowRes.isFollowed).toBe(false);
    expect(unfollowRes.followerCount).toBe(0);

    // Verify company profile reflects unfollowed state
    const profileAfterUnfollow = await CompanyDiscoveryService.getCompanyBySlugOrId(
      testCompanyId,
      applicantUserId
    );
    expect(profileAfterUnfollow.isFollowedByMe).toBe(false);
    expect(profileAfterUnfollow.followerCount).toBe(0);
  });
});
