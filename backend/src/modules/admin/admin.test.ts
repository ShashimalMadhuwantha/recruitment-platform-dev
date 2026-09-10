import { describe, it, expect, beforeAll } from 'vitest';
import { AdminService } from './admin.service';
import { prisma } from '../../db/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

describe('AdminService Unit & Integration Tests (Epic 2)', () => {
  let adminUserId: string;
  let testRecruiterUserId: string;
  let testApplicantUserId: string;
  let testCompanyId: string;
  let testPlanId: string;

  beforeAll(async () => {
    // 1. Ensure Super Admin exists
    const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'superadmin-epic2-test@ats.local' },
      update: {},
      create: {
        email: 'superadmin-epic2-test@ats.local',
        passwordHash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });
    adminUserId = admin.id;

    // 2. Ensure test Subscription Plan exists
    const plan = await prisma.subscriptionPlan.upsert({
      where: { name: 'Epic 2 Test Pro' },
      update: {},
      create: {
        name: 'Epic 2 Test Pro',
        tier: 'PRO',
        maxJobPosts: 25,
        maxSeats: 10,
        maxAtsScans: 500,
        priceMonthly: 99.00,
      },
    });
    testPlanId = plan.id;

    // 3. Create test Company & Recruiter
    const company = await prisma.company.create({
      data: {
        name: `Epic2 Test Corp ${Date.now()}`,
        slug: `epic2-test-corp-${Date.now()}`,
        industry: 'Software & Technology',
        size: '51-200',
        status: 'PENDING_APPROVAL',
      },
    });
    testCompanyId = company.id;

    const recruiterUser = await prisma.user.create({
      data: {
        email: `recruiter-epic2-${Date.now()}@example.com`,
        passwordHash,
        role: 'RECRUITER',
        status: 'PENDING_APPROVAL',
        recruiterProfile: {
          create: {
            companyId: company.id,
            subRole: 'COMPANY_ADMIN',
          },
        },
      },
    });
    testRecruiterUserId = recruiterUser.id;

    // 4. Create test Applicant
    const applicantUser = await prisma.user.create({
      data: {
        email: `applicant-epic2-${Date.now()}@example.com`,
        passwordHash,
        role: 'APPLICANT',
        status: 'ACTIVE',
        applicantProfile: {
          create: {
            firstName: 'Epic2',
            lastName: 'Applicant',
          },
        },
      },
    });
    testApplicantUserId = applicantUser.id;
  });

  it('1. Retrieves accurate platform KPIs and statistics', async () => {
    const stats = await AdminService.getPlatformStats();
    expect(stats.totalUsers).toBeGreaterThan(0);
    expect(stats.totalRecruiters).toBeGreaterThan(0);
    expect(stats.totalApplicants).toBeGreaterThan(0);
    expect(typeof stats.pendingCompaniesCount).toBe('number');
    expect(typeof stats.activeCompaniesCount).toBe('number');
  });

  it('2. Lists companies with filtering and pagination', async () => {
    const result = await AdminService.listCompanies({
      page: 1,
      limit: 10,
      status: 'PENDING_APPROVAL',
    });

    expect(result.items).toBeDefined();
    expect(result.total).toBeGreaterThan(0);
    const found = result.items.find((c: any) => c.id === testCompanyId);
    expect(found).toBeDefined();
    expect(found.status).toBe('PENDING_APPROVAL');
  });

  it('3. Approves a pending company and automatically activates its pending recruiter users', async () => {
    const updated = await AdminService.updateCompanyStatus(testCompanyId, adminUserId, {
      status: 'ACTIVE',
      notes: 'Company documents verified',
    });

    expect(updated.status).toBe('ACTIVE');

    // Verify recruiter user status is now ACTIVE
    const recruiterUser = await prisma.user.findUnique({
      where: { id: testRecruiterUserId },
    });
    expect(recruiterUser?.status).toBe('ACTIVE');

    // Verify AuditLog was recorded
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'COMPANY_STATUS_UPDATE',
        targetId: testCompanyId,
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditLog).toBeDefined();
    expect(auditLog?.actorId).toBe(adminUserId);
  });

  it('4. Assigns a subscription plan to a company', async () => {
    const updated = await AdminService.assignCompanyPlan(testCompanyId, adminUserId, {
      planId: testPlanId,
    });

    expect(updated.planId).toBe(testPlanId);
    expect(updated.plan).toBeDefined();
    expect(updated.plan.name).toBe('Epic 2 Test Pro');
  });

  it('5. Queries the global user directory with role and search filters', async () => {
    const result = await AdminService.listUsers({
      page: 1,
      limit: 10,
      role: 'RECRUITER',
    });

    expect(result.items).toBeDefined();
    const found = result.items.find((u: any) => u.id === testRecruiterUserId);
    expect(found).toBeDefined();
    expect(found.role).toBe('RECRUITER');
  });

  it('6. Suspends and reinstates a user account with audit trail', async () => {
    // Suspend
    const suspended = await AdminService.updateUserStatus(testApplicantUserId, adminUserId, {
      status: 'SUSPENDED',
      reason: 'Violated terms of service test',
    });
    expect(suspended.status).toBe('SUSPENDED');

    // Reinstate
    const reinstated = await AdminService.updateUserStatus(testApplicantUserId, adminUserId, {
      status: 'ACTIVE',
      reason: 'Issue resolved after appeal',
    });
    expect(reinstated.status).toBe('ACTIVE');

    // Verify audit logs
    const logs = await prisma.auditLog.findMany({
      where: {
        action: 'USER_STATUS_UPDATE',
        targetId: testApplicantUserId,
      },
    });
    expect(logs.length).toBeGreaterThanOrEqual(2);
  });

  it('7. Generates a scoped impersonation token for support inspection', async () => {
    const impersonationResult = await AdminService.generateImpersonationToken(
      testApplicantUserId,
      adminUserId,
      'Investigating application upload issue'
    );

    expect(impersonationResult.accessToken).toBeDefined();
    expect(impersonationResult.user.id).toBe(testApplicantUserId);
    expect(impersonationResult.user.isImpersonating).toBe(true);
    expect(impersonationResult.impersonatorId).toBe(adminUserId);

    // Verify JWT payload
    const decoded: any = jwt.verify(impersonationResult.accessToken, config.JWT_SECRET);
    expect(decoded.userId).toBe(testApplicantUserId);
    expect(decoded.isImpersonating).toBe(true);
    expect(decoded.impersonatorId).toBe(adminUserId);
  });
});
