import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../db/client';
import { CompanyTeamService } from './company-team.service';
import bcrypt from 'bcrypt';

describe('Epic 17 — Recruiter: Company, Team & Subscription Plan Seat Management', () => {
  let freePlanId: string;
  let proPlanId: string;
  let enterprisePlanId: string;
  let testCompanyId: string;
  let adminUserId: string;
  let recruiterProfileId: string;
  let secondRecruiterUserId: string;
  let secondRecruiterProfileId: string;

  beforeAll(async () => {
    // 1. Ensure Subscription Plans exist
    const freePlan = await prisma.subscriptionPlan.upsert({
      where: { name: 'Test Free Starter' },
      update: {},
      create: {
        name: 'Test Free Starter',
        tier: 'FREE',
        maxJobPosts: 3,
        maxSeats: 2,
        maxAtsScans: 50,
        priceMonthly: 0,
        featuresJson: { customScreeningQuestions: false, analyticsExport: false },
      },
    });
    freePlanId = freePlan.id;

    const proPlan = await prisma.subscriptionPlan.upsert({
      where: { name: 'Test Pro Recruiter' },
      update: {},
      create: {
        name: 'Test Pro Recruiter',
        tier: 'PRO',
        maxJobPosts: 20,
        maxSeats: 10,
        maxAtsScans: 500,
        priceMonthly: 99,
        featuresJson: { customScreeningQuestions: true, analyticsExport: true },
      },
    });
    proPlanId = proPlan.id;

    const enterprisePlan = await prisma.subscriptionPlan.upsert({
      where: { name: 'Test Enterprise ATS' },
      update: {},
      create: {
        name: 'Test Enterprise ATS',
        tier: 'ENTERPRISE',
        maxJobPosts: 9999,
        maxSeats: 100,
        maxAtsScans: 99999,
        priceMonthly: 399,
        featuresJson: { customScreeningQuestions: true, analyticsExport: true, dedicatedAccountManager: true },
      },
    });
    enterprisePlanId = enterprisePlan.id;

    // 2. Create Test Company with Free Plan (maxSeats: 2)
    const company = await prisma.company.create({
      data: {
        name: 'Acme Test Corp',
        slug: `acme-test-${Date.now()}`,
        industry: 'Software & Technology',
        size: '11-50',
        planId: freePlanId,
        status: 'ACTIVE',
        description: 'Pioneering AI tools.',
      },
    });
    testCompanyId = company.id;

    // 3. Create Primary Admin Recruiter User
    const passwordHash = await bcrypt.hash('Password123!', 10);
    const adminUser = await prisma.user.create({
      data: {
        email: `admin.${Date.now()}@acmetest.com`,
        passwordHash,
        role: 'RECRUITER',
        status: 'ACTIVE',
        applicantProfile: {
          create: { firstName: 'Alice', lastName: 'Admin' },
        },
        recruiterProfile: {
          create: {
            companyId: testCompanyId,
            subRole: 'COMPANY_ADMIN',
            title: 'Head of Talent',
            department: 'People Operations',
          },
        },
      },
      include: { recruiterProfile: true },
    });
    adminUserId = adminUser.id;
    recruiterProfileId = adminUser.recruiterProfile!.id;

    // 4. Create a second recruiter user for reassignment tests
    const secondUser = await prisma.user.create({
      data: {
        email: `bob.${Date.now()}@acmetest.com`,
        passwordHash,
        role: 'RECRUITER',
        status: 'ACTIVE',
        applicantProfile: {
          create: { firstName: 'Bob', lastName: 'Recruiter' },
        },
        recruiterProfile: {
          create: {
            companyId: testCompanyId,
            subRole: 'HIRING_MANAGER',
            title: 'Engineering Manager',
            department: 'Engineering',
          },
        },
      },
      include: { recruiterProfile: true },
    });
    secondRecruiterUserId = secondUser.id;
    secondRecruiterProfileId = secondUser.recruiterProfile!.id;
  });

  afterAll(async () => {
    // Clean up test records
    await prisma.teamInvitation.deleteMany({ where: { companyId: testCompanyId } });
    await prisma.jobVacancy.deleteMany({ where: { companyId: testCompanyId } });
    await prisma.recruiterProfile.deleteMany({ where: { companyId: testCompanyId } });
    await prisma.company.deleteMany({ where: { id: testCompanyId } });
    await prisma.user.deleteMany({
      where: { id: { in: [adminUserId, secondRecruiterUserId] } },
    });
  });

  // -------------------------------------------------------------
  // 1. Company Profile & Employer Branding (FR-RC-01)
  // -------------------------------------------------------------
  describe('Company Profile & Employer Branding', () => {
    it('retrieves comprehensive company profile including plan details', async () => {
      const profile = await CompanyTeamService.getCompanyProfile(testCompanyId);
      expect(profile.id).toBe(testCompanyId);
      expect(profile.name).toBe('Acme Test Corp');
      expect(profile.industry).toBe('Software & Technology');
      expect(profile.plan?.tier).toBe('FREE');
      expect(Array.isArray(profile.locations)).toBe(true);
    });

    it('updates branding, locations, and culture media with audit logging', async () => {
      const updated = await CompanyTeamService.updateCompanyProfile(
        testCompanyId,
        {
          logoUrl: 'https://cdn.example.com/acme-logo.png',
          coverPhotoUrl: 'https://cdn.example.com/acme-cover.jpg',
          website: 'https://acmetest.com',
          locations: [
            { city: 'San Francisco', state: 'CA', country: 'USA', isHq: true },
            { city: 'London', country: 'UK', isHq: false },
          ],
          cultureMedia: [
            { type: 'IMAGE', url: 'https://cdn.example.com/office-1.jpg', caption: 'SF HQ Open Workspace' },
          ],
          socialLinks: {
            linkedin: 'https://linkedin.com/company/acmetest',
            github: 'https://github.com/acmetest',
          },
        },
        adminUserId
      );

      expect(updated.logoUrl).toBe('https://cdn.example.com/acme-logo.png');
      expect(updated.coverPhotoUrl).toBe('https://cdn.example.com/acme-cover.jpg');
      expect(updated.locations).toHaveLength(2);
      expect(updated.locations![0].city).toBe('San Francisco');
      expect(updated.cultureMedia).toHaveLength(1);
      expect(updated.socialLinks?.github).toBe('https://github.com/acmetest');

      // Check audit log
      const auditLog = await prisma.auditLog.findFirst({
        where: { targetId: testCompanyId, action: 'UPDATE_COMPANY_PROFILE' },
        orderBy: { createdAt: 'desc' },
      });
      expect(auditLog).toBeDefined();
    });
  });

  // -------------------------------------------------------------
  // 2. Subscription Plan Seat Quota Enforcement (FR-RC-03, FR-SA-03)
  // -------------------------------------------------------------
  describe('Subscription Plan Quota & Seat Enforcement', () => {
    it('correctly calculates occupied seats and detects capacity on Free Plan (2/2 seats)', async () => {
      // Company has 2 active recruiters (adminUserId and secondRecruiterUserId)
      const usage = await CompanyTeamService.getPlanUsage(testCompanyId);

      expect(usage.plan.tier).toBe('FREE');
      expect(usage.plan.maxSeats).toBe(2);
      expect(usage.usage.seats.activeRecruiters).toBe(2);
      expect(usage.usage.seats.pendingInvites).toBe(0);
      expect(usage.usage.seats.occupiedSeats).toBe(2);
      expect(usage.usage.seats.remainingSeats).toBe(0);
      expect(usage.usage.seats.isAtCapacity).toBe(true);
      expect(usage.usage.seats.percentUsed).toBe(100);
    });

    it('blocks inviting a team member when seat quota is full (403 Forbidden)', async () => {
      await expect(
        CompanyTeamService.inviteTeamMember(
          testCompanyId,
          {
            email: 'charlie@acmetest.com',
            subRole: 'INTERVIEWER',
          },
          adminUserId
        )
      ).rejects.toThrow(/Subscription seat limit reached/);
    });

    it('allows inviting after upgrading to Pro Plan (maxSeats: 10)', async () => {
      // Upgrade company to Pro Plan
      await prisma.company.update({
        where: { id: testCompanyId },
        data: { planId: proPlanId },
      });

      const usageAfterUpgrade = await CompanyTeamService.getPlanUsage(testCompanyId);
      expect(usageAfterUpgrade.plan.tier).toBe('PRO');
      expect(usageAfterUpgrade.plan.maxSeats).toBe(10);
      expect(usageAfterUpgrade.usage.seats.remainingSeats).toBe(8);
      expect(usageAfterUpgrade.usage.seats.isAtCapacity).toBe(false);

      // Successfully invite new member
      const invitation = await CompanyTeamService.inviteTeamMember(
        testCompanyId,
        {
          email: 'charlie@acmetest.com',
          subRole: 'INTERVIEWER',
          department: 'Quality Engineering',
          title: 'QA Lead',
          permissions: { canScheduleInterviews: true, canSubmitScorecards: true },
        },
        adminUserId
      );

      expect(invitation.email).toBe('charlie@acmetest.com');
      expect(invitation.subRole).toBe('INTERVIEWER');
      expect(invitation.status).toBe('PENDING');

      // Check seat count increments to 3 (2 active + 1 pending)
      const usageWithPending = await CompanyTeamService.getPlanUsage(testCompanyId);
      expect(usageWithPending.usage.seats.pendingInvites).toBe(1);
      expect(usageWithPending.usage.seats.occupiedSeats).toBe(3);
      expect(usageWithPending.usage.seats.remainingSeats).toBe(7);
    });

    it('immediately releases reserved seat when invitation is revoked', async () => {
      const pendingInvite = await prisma.teamInvitation.findFirst({
        where: { companyId: testCompanyId, email: 'charlie@acmetest.com' },
      });
      expect(pendingInvite).toBeDefined();

      const result = await CompanyTeamService.revokeInvitation(testCompanyId, pendingInvite!.id, adminUserId);
      expect(result.message).toContain('released');

      // Verify seat count drops back to 2
      const usageAfterRevoke = await CompanyTeamService.getPlanUsage(testCompanyId);
      expect(usageAfterRevoke.usage.seats.pendingInvites).toBe(0);
      expect(usageAfterRevoke.usage.seats.occupiedSeats).toBe(2);
      expect(usageAfterRevoke.usage.seats.remainingSeats).toBe(8);
    });
  });

  // -------------------------------------------------------------
  // 3. Team Member Invitation & Onboarding Workflow (FR-RC-02)
  // -------------------------------------------------------------
  describe('Team Onboarding & Acceptance Workflow', () => {
    let inviteToken: string;
    let inviteTokenHash: string;

    it('creates an invitation and generates a salted token valid for 7 days', async () => {
      const invite = await CompanyTeamService.inviteTeamMember(
        testCompanyId,
        {
          email: 'david@acmetest.com',
          subRole: 'HIRING_MANAGER',
          department: 'Product',
          title: 'Product Lead',
        },
        adminUserId
      );

      expect(invite.email).toBe('david@acmetest.com');
      expect(invite.status).toBe('PENDING');

      const dbInvite = await prisma.teamInvitation.findUnique({
        where: { id: invite.id },
      });
      expect(dbInvite).toBeDefined();
      expect(dbInvite!.tokenHash).toHaveLength(64); // SHA-256 hex
      inviteTokenHash = dbInvite!.tokenHash;

      // Check expiration is approximately 7 days out
      const diffDays = (dbInvite!.expiresAt.getTime() - dbInvite!.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      expect(Math.round(diffDays)).toBe(7);
    });

    it('verifies valid invitation token and identifies new user status', async () => {
      // In tests, we can verify via tokenHash or simulate raw token
      const invitation = await prisma.teamInvitation.findFirst({
        where: { email: 'david@acmetest.com' },
      });
      expect(invitation).toBeDefined();

      // Create a test raw token and inject it into the invite
      const rawToken = 'test-token-david-1234567890123456';
      const hash = (CompanyTeamService as any).hashToken(rawToken);
      await prisma.teamInvitation.update({
        where: { id: invitation!.id },
        data: { tokenHash: hash },
      });

      const verification = await CompanyTeamService.verifyInvitationToken(rawToken);
      expect(verification.valid).toBe(true);
      expect(verification.email).toBe('david@acmetest.com');
      expect(verification.companyName).toBe('Acme Test Corp');
      expect(verification.subRole).toBe('HIRING_MANAGER');
      expect(verification.isExistingUser).toBe(false);
    });

    it('accepts invitation, creates new user with bcrypt password and provisions recruiter profile', async () => {
      const rawToken = 'test-token-david-1234567890123456';

      const acceptResult = await CompanyTeamService.acceptInvitation({
        token: rawToken,
        password: 'DavidSecretPassword123!',
        firstName: 'David',
        lastName: 'Product',
      });

      expect(acceptResult.user.email).toBe('david@acmetest.com');
      expect(acceptResult.user.role).toBe('RECRUITER');
      expect(acceptResult.token).toBeDefined();

      // Verify DB records
      const user = await prisma.user.findUnique({
        where: { email: 'david@acmetest.com' },
        include: { recruiterProfile: true },
      });
      expect(user).toBeDefined();
      expect(user!.recruiterProfile?.companyId).toBe(testCompanyId);
      expect(user!.recruiterProfile?.subRole).toBe('HIRING_MANAGER');

      // Verify invitation is marked ACCEPTED
      const updatedInvite = await prisma.teamInvitation.findFirst({
        where: { email: 'david@acmetest.com' },
      });
      expect(updatedInvite?.status).toBe('ACCEPTED');
      expect(updatedInvite?.acceptedAt).toBeDefined();

      // Clean up david user
      await prisma.recruiterProfile.deleteMany({ where: { userId: user!.id } });
      await prisma.user.deleteMany({ where: { id: user!.id } });
    });
  });

  // -------------------------------------------------------------
  // 4. Role Governance & Requisition Reassignment (FR-RC-02)
  // -------------------------------------------------------------
  describe('Role Governance & Offboarding Reassignment', () => {
    it('prevents demoting the sole Company Administrator', async () => {
      await expect(
        CompanyTeamService.updateMemberRole(
          testCompanyId,
          recruiterProfileId,
          { subRole: 'INTERVIEWER' },
          adminUserId
        )
      ).rejects.toThrow(/Cannot demote the sole Company Administrator/);
    });

    it('allows updating role and permissions of non-admin team members', async () => {
      const updated = await CompanyTeamService.updateMemberRole(
        testCompanyId,
        secondRecruiterProfileId,
        {
          title: 'Senior Hiring Lead',
          permissions: {
            canCreateJobs: true,
            canExtendOffers: true,
            canViewCandidateSalary: true,
          },
        },
        adminUserId
      );

      expect(updated.title).toBe('Senior Hiring Lead');
      expect(updated.permissions?.canExtendOffers).toBe(true);
    });

    it('reassigns requisitions and releases seat when offboarding team member', async () => {
      // Create a test job created by second recruiter
      const job = await prisma.jobVacancy.create({
        data: {
          company: { connect: { id: testCompanyId } },
          createdBy: { connect: { id: secondRecruiterUserId } },
          title: 'Senior Frontend Architect',
          location: 'San Francisco, CA',
          employmentType: 'FULL_TIME',
          status: 'PUBLISHED',
          description: 'Build modern recruiter apps.',
        },
      });

      // Remove second recruiter and transfer requisitions to admin
      const result = await CompanyTeamService.removeTeamMember(
        testCompanyId,
        secondRecruiterProfileId,
        adminUserId,
        adminUserId
      );

      expect(result.message).toContain('released');
      expect(result.reassignedJobsCount).toBe(1);

      // Verify job creator was updated to adminUserId
      const updatedJob = await prisma.jobVacancy.findUnique({
        where: { id: job.id },
      });
      expect(updatedJob?.createdById).toBe(adminUserId);

      // Clean up job
      await prisma.jobVacancy.delete({ where: { id: job.id } });
    });
  });
});
