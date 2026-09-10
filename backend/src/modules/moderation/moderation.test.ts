import { describe, it, expect, beforeAll } from 'vitest';
import { ModerationService } from './moderation.service';
import { prisma } from '../../db/client';
import bcrypt from 'bcrypt';

describe('ModerationService Unit & Integration Tests (Epic 3)', () => {
  let adminUserId: string;
  let testRecruiterUserId: string;
  let testApplicantUserId: string;
  let testJobId: string;
  let testApplicantProfileId: string;
  let testReportId: string;
  let testGdprRequestId: string;

  beforeAll(async () => {
    // 1. Ensure Super Admin exists
    const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'moderator-epic3-admin@ats.local' },
      update: {},
      create: {
        email: 'moderator-epic3-admin@ats.local',
        passwordHash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });
    adminUserId = admin.id;

    // 2. Create test Company, Recruiter, and Job Vacancy
    const company = await prisma.company.create({
      data: {
        name: `Mod Test Corp ${Date.now()}`,
        slug: `mod-test-corp-${Date.now()}`,
        status: 'ACTIVE',
      },
    });

    const recruiter = await prisma.user.create({
      data: {
        email: `recruiter-mod-${Date.now()}@example.com`,
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
    testRecruiterUserId = recruiter.id;

    const job = await prisma.jobVacancy.create({
      data: {
        companyId: company.id,
        createdById: recruiter.id,
        title: 'Senior Frontend Engineer (Young Only)',
        description: 'We are looking for recent graduate only candidates for fast paced startup environment.',
        status: 'PUBLISHED',
      },
    });
    testJobId = job.id;

    // 3. Create test Applicant
    const applicant = await prisma.user.create({
      data: {
        email: `applicant-mod-${Date.now()}@example.com`,
        passwordHash,
        role: 'APPLICANT',
        status: 'ACTIVE',
        applicantProfile: {
          create: {
            firstName: 'Spammy',
            lastName: 'Candidate',
            headline: 'Get rich quick promoter',
            summary: 'Contact me for wire transfer opportunities',
          },
        },
      },
      include: { applicantProfile: true },
    });
    testApplicantUserId = applicant.id;
    testApplicantProfileId = applicant.applicantProfile!.id;
  });

  it('1. Retrieves accurate moderation metrics', async () => {
    const stats = await ModerationService.getModerationStats();
    expect(stats).toBeDefined();
    expect(typeof stats.pendingJobReports).toBe('number');
    expect(typeof stats.pendingProfileReports).toBe('number');
    expect(typeof stats.totalBannedKeywords).toBe('number');
    expect(typeof stats.openGdprRequests).toBe('number');
  });

  it('2. Creates a content report on a flagged job posting and lists reports', async () => {
    const report = await ModerationService.createContentReport(testApplicantUserId, {
      targetType: 'JOB_POSTING',
      targetId: testJobId,
      reason: 'Discriminatory age requirement',
      description: 'Job posting specifically asks for young recent graduates only.',
    });

    expect(report.id).toBeDefined();
    expect(report.status).toBe('PENDING');
    expect(report.targetType).toBe('JOB_POSTING');
    testReportId = report.id;

    const list = await ModerationService.listReports({
      targetType: 'JOB_POSTING',
      status: 'PENDING',
    });

    expect(list.items.length).toBeGreaterThan(0);
    const found = list.items.find((r) => r.id === testReportId);
    expect(found).toBeDefined();
    expect(found?.targetDetails?.title).toBe('Senior Frontend Engineer (Young Only)');
  });

  it('3. Resolves a flagged job report with TAKEDOWN action', async () => {
    const resolved = await ModerationService.resolveReport(testReportId, adminUserId, {
      action: 'TAKEDOWN',
      notes: 'Confirmed age discrimination violation. Takedown executed.',
    });

    expect(resolved.status).toBe('RESOLVED');
    expect(resolved.resolutionAction).toBe('TAKEDOWN');

    // Verify job status changed to FLAGGED
    const job = await prisma.jobVacancy.findUnique({ where: { id: testJobId } });
    expect(job?.status).toBe('FLAGGED');

    // Verify Audit Log
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'MODERATION_REPORT_RESOLVE',
        targetId: testJobId,
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditLog).toBeDefined();
    expect(auditLog?.actorId).toBe(adminUserId);
  });

  it('4. Reports and suspends a fraudulent candidate profile', async () => {
    const report = await ModerationService.createContentReport(testRecruiterUserId, {
      targetType: 'APPLICANT_PROFILE',
      targetId: testApplicantProfileId,
      reason: 'Spam and financial fraud',
      description: 'Candidate profile promotes financial scam in summary.',
    });

    const resolved = await ModerationService.resolveReport(report.id, adminUserId, {
      action: 'SUSPEND_PROFILE',
      notes: 'Confirmed fake profile violation. Suspending candidate account.',
    });

    expect(resolved.status).toBe('RESOLVED');

    // Verify applicant user status changed to SUSPENDED
    const user = await prisma.user.findUnique({ where: { id: testApplicantUserId } });
    expect(user?.status).toBe('SUSPENDED');
  });

  it('5. Manages banned keywords taxonomy and scans text for violations', async () => {
    const keyword = await ModerationService.createBannedKeyword({
      keyword: `test-discriminatory-term-${Date.now()}`,
      category: 'DISCRIMINATION',
      severity: 'BLOCK',
    });

    expect(keyword.id).toBeDefined();

    // Test text scanner
    const testResult = await ModerationService.testTextKeywords(
      `This position requires ${keyword.keyword} for consideration.`
    );

    expect(testResult.isValid).toBe(false);
    expect(testResult.hasBlockingViolations).toBe(true);
    expect(testResult.violations.length).toBeGreaterThan(0);

    // Clean up keyword
    await ModerationService.deleteBannedKeyword(keyword.id);
  });

  it('6. Filters and searches platform audit log entries', async () => {
    const logs = await ModerationService.listAuditLogs({
      action: 'MODERATION_REPORT_RESOLVE',
      page: 1,
      limit: 10,
    });

    expect(logs.items.length).toBeGreaterThan(0);
    expect(logs.items[0].action).toBe('MODERATION_REPORT_RESOLVE');
  });

  it('7. Handles GDPR Data Export and Account Erasure compliance workflows', async () => {
    // 1. Submit export request
    const exportReq = await ModerationService.createGdprRequest(testApplicantUserId, 'DATA_EXPORT');
    expect(exportReq.id).toBeDefined();
    expect(exportReq.status).toBe('SUBMITTED');
    testGdprRequestId = exportReq.id;

    // 2. Fulfill export request
    const processed = await ModerationService.processGdprRequest(testGdprRequestId, adminUserId, {
      status: 'COMPLETED',
    });

    expect(processed.status).toBe('COMPLETED');
    expect(processed.detailsJson).toBeDefined();
    expect(processed.detailsJson.userAccount.email).toBeDefined();

    // 3. Submit and execute erasure request
    const erasureReq = await ModerationService.createGdprRequest(testApplicantUserId, 'ERASURE');
    const completedErasure = await ModerationService.processGdprRequest(erasureReq.id, adminUserId, {
      status: 'COMPLETED',
    });

    expect(completedErasure.status).toBe('COMPLETED');

    // Verify user profile is anonymized
    const profile = await prisma.applicantProfile.findUnique({
      where: { id: testApplicantProfileId },
    });
    expect(profile?.firstName).toBe('Anonymized');
    expect(profile?.summary).toContain('Erased per GDPR');
  });
});
