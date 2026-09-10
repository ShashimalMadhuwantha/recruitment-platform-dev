import jwt from 'jsonwebtoken';
import { prisma } from '../../db/client';
import { config } from '../../config';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../middleware/error.middleware';
import {
  CompanyListQueryInput,
  CompanyStatusUpdateInput,
  AssignPlanInput,
  UserListQueryInput,
  UserStatusUpdateInput,
} from './admin.types';
import {
  AdminPlatformStats,
  PaginatedResult,
  CompanyStatus,
  UserStatus,
  UserRole,
} from '@recruitment-platform/shared';

export class AdminService {
  /**
   * 1. Get Platform Statistics (FR-SA-19)
   */
  static async getPlatformStats(): Promise<AdminPlatformStats> {
    const [
      totalUsers,
      totalApplicants,
      totalRecruiters,
      pendingCompaniesCount,
      activeCompaniesCount,
      totalJobsCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'APPLICANT' } }),
      prisma.user.count({ where: { role: 'RECRUITER' } }),
      prisma.company.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.company.count({ where: { status: 'ACTIVE' } }),
      prisma.jobVacancy.count(),
    ]);

    return {
      totalUsers,
      totalApplicants,
      totalRecruiters,
      pendingCompaniesCount,
      activeCompaniesCount,
      totalJobsCount,
    };
  }

  /**
   * 2. List Companies with filters & pagination (FR-SA-01)
   */
  static async listCompanies(input: CompanyListQueryInput): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search, status } = input;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { industry: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          plan: true,
          _count: {
            select: {
              recruiters: true,
              jobVacancies: true,
            },
          },
        },
      }),
      prisma.company.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * 3. Get Company Details with Team & Jobs (FR-SA-01)
   */
  static async getCompanyDetails(companyId: string): Promise<any> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        plan: true,
        recruiters: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
        jobVacancies: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            location: true,
            employmentType: true,
            createdAt: true,
            _count: {
              select: { applications: true },
            },
          },
        },
      },
    });

    if (!company) throw new NotFoundError('Company not found');
    return company;
  }

  /**
   * 4. Update Company Status / Approval Workflow (FR-SA-01)
   */
  static async updateCompanyStatus(
    companyId: string,
    actorId: string,
    input: CompanyStatusUpdateInput
  ): Promise<any> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        recruiters: {
          include: { user: true },
        },
      },
    });

    if (!company) throw new NotFoundError('Company not found');

    const updatedCompany = await prisma.$transaction(async (tx) => {
      // 1. Update company status
      const updated = await tx.company.update({
        where: { id: companyId },
        data: {
          status: input.status as CompanyStatus,
        },
        include: { plan: true },
      });

      // 2. If approved, automatically activate any pending recruiter accounts for this company
      if (input.status === 'ACTIVE') {
        const recruiterUserIds = company.recruiters
          .filter((r) => r.user.status === 'PENDING_APPROVAL')
          .map((r) => r.userId);

        if (recruiterUserIds.length > 0) {
          await tx.user.updateMany({
            where: { id: { in: recruiterUserIds } },
            data: { status: 'ACTIVE' },
          });
        }
      }

      // 3. Record Audit Log
      await tx.auditLog.create({
        data: {
          actorId,
          action: 'COMPANY_STATUS_UPDATE',
          targetType: 'Company',
          targetId: companyId,
          detailsJson: {
            previousStatus: company.status,
            newStatus: input.status,
            notes: input.notes || null,
          },
        },
      });

      return updated;
    });

    return updatedCompany;
  }

  /**
   * 5. List Subscription Plans (FR-SA-02)
   */
  static async listSubscriptionPlans(): Promise<any[]> {
    return prisma.subscriptionPlan.findMany({
      orderBy: { priceMonthly: 'asc' },
    });
  }

  /**
   * 6. Assign Subscription Plan to Company (FR-SA-02)
   */
  static async assignCompanyPlan(
    companyId: string,
    actorId: string,
    input: AssignPlanInput
  ): Promise<any> {
    const [company, plan] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId } }),
      prisma.subscriptionPlan.findUnique({ where: { id: input.planId } }),
    ]);

    if (!company) throw new NotFoundError('Company not found');
    if (!plan) throw new NotFoundError('Subscription plan not found');

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.company.update({
        where: { id: companyId },
        data: { planId: plan.id },
        include: { plan: true },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'COMPANY_PLAN_ASSIGN',
          targetType: 'Company',
          targetId: companyId,
          detailsJson: {
            planId: plan.id,
            planName: plan.name,
            tier: plan.tier,
          },
        },
      });

      return res;
    });

    return updated;
  }

  /**
   * 7. Global User Directory (FR-SA-04)
   */
  static async listUsers(input: UserListQueryInput): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search, role, status, companyId } = input;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (companyId) {
      where.recruiterProfile = { companyId };
    }
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { applicantProfile: { firstName: { contains: search } } },
        { applicantProfile: { lastName: { contains: search } } },
        { recruiterProfile: { company: { name: { contains: search } } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          mfaEnabled: true,
          createdAt: true,
          applicantProfile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              headline: true,
              phone: true,
            },
          },
          recruiterProfile: {
            select: {
              id: true,
              subRole: true,
              company: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                },
              },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * 8. Update User Status / Suspend / Ban / Reinstate (FR-SA-05)
   */
  static async updateUserStatus(
    userId: string,
    actorId: string,
    input: UserStatusUpdateInput
  ): Promise<any> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    if (user.role === 'SUPER_ADMIN' && user.id === actorId && input.status !== 'ACTIVE') {
      throw new ForbiddenError('Super Admins cannot suspend or ban their own account');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.user.update({
        where: { id: userId },
        data: { status: input.status as UserStatus },
      });

      // If suspended or banned, immediately revoke all active refresh tokens for this user
      if (input.status === 'SUSPENDED' || input.status === 'BANNED') {
        await tx.refreshToken.updateMany({
          where: { userId },
          data: { revokedAt: new Date() },
        });
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          actorId,
          action: 'USER_STATUS_UPDATE',
          targetType: 'User',
          targetId: userId,
          detailsJson: {
            previousStatus: user.status,
            newStatus: input.status,
            reason: input.reason,
          },
        },
      });

      return res;
    });

    return {
      id: updated.id,
      email: updated.email,
      role: updated.role,
      status: updated.status,
    };
  }

  /**
   * 9. Super Admin Impersonation with Audit Logging (FR-SA-03)
   */
  static async generateImpersonationToken(
    targetUserId: string,
    adminActorId: string,
    reason?: string
  ): Promise<{ accessToken: string; user: any; impersonatorId: string }> {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        applicantProfile: true,
        recruiterProfile: { include: { company: true } },
      },
    });

    if (!targetUser) throw new NotFoundError('Target user not found');
    if (targetUser.role === 'SUPER_ADMIN') {
      throw new BadRequestError('Cannot impersonate another Super Admin account');
    }

    // 1. Record Audit Log for impersonation
    await prisma.auditLog.create({
      data: {
        actorId: adminActorId,
        action: 'ADMIN_IMPERSONATE_USER',
        targetType: 'User',
        targetId: targetUserId,
        detailsJson: {
          targetEmail: targetUser.email,
          targetRole: targetUser.role,
          reason: reason || 'Super Admin tenant inspection / support',
        },
      },
    });

    // 2. Issue a 1-hour scoped JWT with isImpersonating flag
    const accessToken = jwt.sign(
      {
        userId: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
        status: targetUser.status,
        companyId: targetUser.recruiterProfile?.companyId || null,
        recruiterSubRole: targetUser.recruiterProfile?.subRole || null,
        isImpersonating: true,
        impersonatorId: adminActorId,
      },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return {
      accessToken,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
        status: targetUser.status,
        mfaEnabled: targetUser.mfaEnabled,
        companyId: targetUser.recruiterProfile?.companyId || null,
        recruiterSubRole: targetUser.recruiterProfile?.subRole || null,
        isImpersonating: true,
        impersonatorId: adminActorId,
      },
      impersonatorId: adminActorId,
    };
  }

  /**
   * 10. List Audit Logs (FR-SA-12)
   */
  static async listAuditLogs(page = 1, limit = 15): Promise<PaginatedResult<any>> {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.auditLog.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
