import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcrypt';
import { prisma } from '../../db/client';
import { ApplicantPrivacyService } from './applicant-privacy.service';
import { talentPoolService } from '../talent-pool/talent-pool.service';

describe('Epic 15 — Applicant: Account, Privacy, Notification Preferences & GDPR Compliance', () => {
  let applicantUserId: string;
  let applicantProfileId: string;
  let blockedCompanyId: string;
  let otherCompanyId: string;
  let recruiterUserId: string;
  let otherRecruiterUserId: string;

  beforeAll(async () => {
    // 1. Create blocked company
    const blockedCompany = await prisma.company.create({
      data: {
        name: `Blocked Corp ${Date.now()}`,
        slug: `blocked-corp-${Date.now()}`,
        industry: 'Defense & Aerospace',
        size: '1000+',
        description: 'Defense contractor enterprise.',
        status: 'ACTIVE',
      },
    });
    blockedCompanyId = blockedCompany.id;

    // 2. Create another company
    const otherCompany = await prisma.company.create({
      data: {
        name: `Open Tech ${Date.now()}`,
        slug: `open-tech-${Date.now()}`,
        industry: 'Software',
        size: '50-200',
        description: 'Collaborative open source tech startup.',
        status: 'ACTIVE',
      },
    });
    otherCompanyId = otherCompany.id;

    // 3. Create applicant user with known password
    const passwordHash = await bcrypt.hash('ApplicantSecurePass123!', 10);
    const applicantUser = await prisma.user.create({
      data: {
        email: `privacy.applicant.${Date.now()}@example.com`,
        passwordHash,
        role: 'APPLICANT',
        status: 'ACTIVE',
      },
    });
    applicantUserId = applicantUser.id;

    // 4. Create applicant profile
    const profile = await prisma.applicantProfile.create({
      data: {
        userId: applicantUserId,
        firstName: 'Jane',
        lastName: 'PrivacyTester',
        headline: 'Senior Privacy & Compliance Engineer',
        summary: 'Expert in GDPR, data governance, and secure distributed architectures.',
        location: 'Berlin, Germany',
        visibilitySettings: { visibility: 'PUBLIC', isSearchable: true },
      },
    });
    applicantProfileId = profile.id;

    // Add skill for talent pool search
    const skill = await prisma.skill.upsert({
      where: { name: 'GDPR Compliance' },
      update: {},
      create: { name: 'GDPR Compliance', category: 'Compliance' },
    });
    await prisma.applicantSkill.create({
      data: {
        applicantId: applicantProfileId,
        skillId: skill.id,
        proficiency: 5,
        yearsExperience: 6,
      },
    });

    // 5. Create recruiters for both companies
    const recPasswordHash = await bcrypt.hash('RecruiterPass123!', 10);
    const recruiterUser = await prisma.user.create({
      data: {
        email: `recruiter.blocked.${Date.now()}@example.com`,
        passwordHash: recPasswordHash,
        role: 'RECRUITER',
        status: 'ACTIVE',
      },
    });
    recruiterUserId = recruiterUser.id;
    await prisma.recruiterProfile.create({
      data: {
        userId: recruiterUserId,
        companyId: blockedCompanyId,
        subRole: 'COMPANY_ADMIN',
      },
    });

    const otherRecruiterUser = await prisma.user.create({
      data: {
        email: `recruiter.other.${Date.now()}@example.com`,
        passwordHash: recPasswordHash,
        role: 'RECRUITER',
        status: 'ACTIVE',
      },
    });
    otherRecruiterUserId = otherRecruiterUser.id;
    await prisma.recruiterProfile.create({
      data: {
        userId: otherRecruiterUserId,
        companyId: otherCompanyId,
        subRole: 'COMPANY_ADMIN',
      },
    });
  });

  afterAll(async () => {
    // Cleanup created test records
    await prisma.companyBlock.deleteMany({ where: { applicantId: applicantUserId } });
    await prisma.userNotificationPreference.deleteMany({ where: { userId: applicantUserId } });
    await prisma.gdprRequest.deleteMany({ where: { userId: applicantUserId } });
    await prisma.auditLog.deleteMany({ where: { actorId: applicantUserId } });
    await prisma.applicantSkill.deleteMany({ where: { applicantId: applicantProfileId } });
    await prisma.applicantProfile.deleteMany({ where: { id: applicantProfileId } });
    await prisma.recruiterProfile.deleteMany({
      where: { userId: { in: [recruiterUserId, otherRecruiterUserId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [applicantUserId, recruiterUserId, otherRecruiterUserId] } },
    });
    await prisma.company.deleteMany({
      where: { id: { in: [blockedCompanyId, otherCompanyId] } },
    });
  });

  it('FR-AP-28: should return default notification preferences for an applicant', async () => {
    const preferences = await ApplicantPrivacyService.getPreferences(applicantUserId);

    expect(preferences.userId).toBe(applicantUserId);
    expect(preferences.applicationStatusEmail).toBe(true);
    expect(preferences.applicationStatusInApp).toBe(true);
    expect(preferences.interviewInvitesEmail).toBe(true);
    expect(preferences.messagesEmail).toBe(true);
    expect(preferences.followedCompanyJobEmail).toBe(true);
    expect(preferences.jobAlertsEmail).toBe(false);
    expect(preferences.jobAlertsInApp).toBe(true);
  });

  it('FR-AP-28: should update applicant notification preferences', async () => {
    const updated = await ApplicantPrivacyService.updatePreferences(applicantUserId, {
      applicationStatusEmail: false,
      jobAlertsEmail: true,
      messagesEmail: false,
    });

    expect(updated.applicationStatusEmail).toBe(false);
    expect(updated.jobAlertsEmail).toBe(true);
    expect(updated.messagesEmail).toBe(false);
    // Unchanged preferences should retain their defaults
    expect(updated.interviewInvitesEmail).toBe(true);
    expect(updated.interviewInvitesInApp).toBe(true);

    const reloaded = await ApplicantPrivacyService.getPreferences(applicantUserId);
    expect(reloaded.applicationStatusEmail).toBe(false);
    expect(reloaded.jobAlertsEmail).toBe(true);
  });

  it('FR-AP-30: should block an employer and synchronize with visibility settings', async () => {
    const blocked = await ApplicantPrivacyService.blockCompany(
      applicantUserId,
      blockedCompanyId,
      'Current employer, conceal profile'
    );

    expect(blocked.companyId).toBe(blockedCompanyId);
    expect(blocked.companyName).toContain('Blocked Corp');
    expect(blocked.reason).toBe('Current employer, conceal profile');

    const list = await ApplicantPrivacyService.getBlockedCompanies(applicantUserId);
    expect(list).toHaveLength(1);
    expect(list[0].companyId).toBe(blockedCompanyId);

    // Profile visibilitySettings should have hideFromCompanies updated
    const profile = await prisma.applicantProfile.findUnique({
      where: { id: applicantProfileId },
    });
    const settings: any = profile?.visibilitySettings;
    expect(settings.hideFromCompanies).toContain(blockedCompanyId);
  });

  it('FR-RC-11, FR-AP-10: should conceal candidate from talent pool search for blocked company recruiter', async () => {
    // 1. Recruiter from blocked company searches talent pool
    const blockedSearchResult = await talentPoolService.searchTalentPool(
      recruiterUserId,
      'RECRUITER',
      { search: 'Jane' }
    );
    // Candidate MUST be concealed
    expect(blockedSearchResult.candidates.some((c) => c.id === applicantProfileId)).toBe(false);

    // 2. Recruiter from other company searches talent pool
    const otherSearchResult = await talentPoolService.searchTalentPool(
      otherRecruiterUserId,
      'RECRUITER',
      { search: 'Jane' }
    );
    // Candidate MUST be visible
    expect(otherSearchResult.candidates.some((c) => c.id === applicantProfileId)).toBe(true);
  });

  it('FR-AP-30: should unblock an employer and restore visibility', async () => {
    const res = await ApplicantPrivacyService.unblockCompany(applicantUserId, blockedCompanyId);
    expect(res.success).toBe(true);
    expect(res.companyId).toBe(blockedCompanyId);

    const list = await ApplicantPrivacyService.getBlockedCompanies(applicantUserId);
    expect(list.some((b) => b.companyId === blockedCompanyId)).toBe(false);

    // Now recruiter from previously blocked company should be able to find candidate
    const postUnblockSearch = await talentPoolService.searchTalentPool(
      recruiterUserId,
      'RECRUITER',
      { search: 'Jane' }
    );
    expect(postUnblockSearch.candidates.some((c) => c.id === applicantProfileId)).toBe(true);
  });

  it('FR-AP-29: should export comprehensive personal data archive (GDPR Data Portability)', async () => {
    const exportPackage = await ApplicantPrivacyService.exportPersonalData(applicantUserId);

    expect(exportPackage.exportedAt).toBeDefined();
    expect(exportPackage.user.id).toBe(applicantUserId);
    expect(exportPackage.user.email).toContain('privacy.applicant');
    expect(exportPackage.profile?.firstName).toBe('Jane');
    expect(exportPackage.profile?.lastName).toBe('PrivacyTester');
    expect(exportPackage.skills).toHaveLength(1);
    expect(exportPackage.skills[0].skill.name).toBe('GDPR Compliance');
    expect(exportPackage.notificationPreferences).not.toBeNull();

    // Verify audit log entry
    const audit = await prisma.auditLog.findFirst({
      where: {
        actorId: applicantUserId,
        action: 'GDPR_DATA_EXPORT',
      },
    });
    expect(audit).not.toBeNull();
  });

  it('FR-AP-29, UC-14: should reject account erasure request if password is incorrect', async () => {
    await expect(
      ApplicantPrivacyService.requestAccountErasure(
        applicantUserId,
        'WrongPassword123!',
        'Testing deletion error'
      )
    ).rejects.toThrow('Incorrect password');
  });

  it('FR-AP-29, UC-14: should successfully register GDPR account erasure request with valid password', async () => {
    const erasure = await ApplicantPrivacyService.requestAccountErasure(
      applicantUserId,
      'ApplicantSecurePass123!',
      'Moving to another country and deleting account.'
    );

    expect(erasure.requestId).toBeDefined();
    expect(erasure.status).toBe('SUBMITTED');
    expect(erasure.slaDeadline).toBeDefined();

    // Verify statutory SLA deadline is roughly 30 days in future
    const deadline = new Date(erasure.slaDeadline).getTime();
    const now = Date.now();
    const diffDays = Math.round((deadline - now) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeGreaterThanOrEqual(29);
    expect(diffDays).toBeLessThanOrEqual(31);

    // Verify GDPR request is recorded in database
    const dbRecord = await prisma.gdprRequest.findUnique({
      where: { id: erasure.requestId },
    });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord?.requestType).toBe('ERASURE');
    expect(dbRecord?.userId).toBe(applicantUserId);

    // Verify audit log
    const audit = await prisma.auditLog.findFirst({
      where: {
        actorId: applicantUserId,
        action: 'GDPR_ERASURE_REQUEST',
      },
    });
    expect(audit).not.toBeNull();
  });
});
