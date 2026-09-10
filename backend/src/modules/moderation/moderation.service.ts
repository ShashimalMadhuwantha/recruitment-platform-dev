import { prisma } from '../../db/client';
import { NotFoundError, BadRequestError } from '../../middleware/error.middleware';
import {
  ContentReportCreateInput,
  ContentReportResolveInput,
  ReportListQueryInput,
  BannedKeywordCreateInput,
  AuditLogQueryInput,
  GdprRequestProcessInput,
} from './moderation.types';
import {
  ContentReport,
  BannedKeyword,
  GdprRequest,
  ModerationStats,
  PaginatedResult,
  AuditLogEntry,
  ReportStatus,
  ReportTargetType,
  GdprRequestStatus,
  GdprRequestType,
} from '@recruitment-platform/shared';
import { BannedKeywordValidator } from './banned-keyword.validator';

export class ModerationService {
  /**
   * 1. Get Moderation Dashboard Metrics
   */
  static async getModerationStats(): Promise<ModerationStats> {
    const [
      pendingJobReports,
      pendingProfileReports,
      totalBannedKeywords,
      openGdprRequests,
    ] = await Promise.all([
      prisma.contentReport.count({
        where: { targetType: 'JOB_POSTING', status: 'PENDING' },
      }),
      prisma.contentReport.count({
        where: {
          targetType: { in: ['APPLICANT_PROFILE', 'CV'] },
          status: 'PENDING',
        },
      }),
      prisma.bannedKeyword.count({ where: { isActive: true } }),
      prisma.gdprRequest.count({
        where: { status: { in: ['SUBMITTED', 'PROCESSING'] } },
      }),
    ]);

    return {
      pendingJobReports,
      pendingProfileReports,
      totalBannedKeywords,
      openGdprRequests,
    };
  }

  /**
   * 2. Create Content Flag / Report
   */
  static async createContentReport(
    reporterId: string | null,
    input: ContentReportCreateInput
  ): Promise<any> {
    // If reporting a job posting, optionally set its status to FLAGGED
    if (input.targetType === 'JOB_POSTING') {
      const job = await prisma.jobVacancy.findUnique({ where: { id: input.targetId } });
      if (!job) throw new NotFoundError('Target job posting not found');
    } else if (input.targetType === 'APPLICANT_PROFILE') {
      const profile = await prisma.applicantProfile.findUnique({ where: { id: input.targetId } });
      if (!profile) throw new NotFoundError('Target applicant profile not found');
    }

    const report = await prisma.contentReport.create({
      data: {
        reporterId,
        targetType: input.targetType as ReportTargetType,
        targetId: input.targetId,
        reason: input.reason,
        description: input.description,
        status: 'PENDING',
      },
      include: {
        reporter: {
          select: { id: true, email: true, role: true },
        },
      },
    });

    return report;
  }

  /**
   * 3. List Moderation Reports with Enriched Target Details (FR-SA-09, FR-SA-10)
   */
  static async listReports(input: ReportListQueryInput): Promise<PaginatedResult<ContentReport>> {
    const { page = 1, limit = 10, targetType, status, search } = input;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (targetType) where.targetType = targetType;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { reason: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.contentReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: { id: true, email: true, role: true },
          },
        },
      }),
      prisma.contentReport.count({ where }),
    ]);

    // Enrich items with target entity summaries
    const enrichedItems: ContentReport[] = await Promise.all(
      items.map(async (rep) => {
        let targetDetails: any = null;

        if (rep.targetType === 'JOB_POSTING') {
          const job = await prisma.jobVacancy.findUnique({
            where: { id: rep.targetId },
            include: { company: { select: { name: true } } },
          });
          if (job) {
            targetDetails = {
              title: job.title,
              companyName: job.company.name,
              status: job.status,
              description: job.description.substring(0, 200),
            };
          }
        } else if (rep.targetType === 'APPLICANT_PROFILE') {
          const profile = await prisma.applicantProfile.findUnique({
            where: { id: rep.targetId },
            include: { user: { select: { email: true, status: true } } },
          });
          if (profile) {
            targetDetails = {
              name: `${profile.firstName} ${profile.lastName}`,
              email: profile.user.email,
              status: profile.user.status,
              description: profile.headline || profile.summary?.substring(0, 200),
            };
          }
        }

        return {
          id: rep.id,
          reporterId: rep.reporterId,
          targetType: rep.targetType as ReportTargetType,
          targetId: rep.targetId,
          reason: rep.reason,
          description: rep.description,
          status: rep.status as ReportStatus,
          resolutionAction: rep.resolutionAction,
          resolutionNotes: rep.resolutionNotes,
          resolvedById: rep.resolvedById,
          resolvedAt: rep.resolvedAt ? rep.resolvedAt.toISOString() : null,
          createdAt: rep.createdAt.toISOString(),
          updatedAt: rep.updatedAt.toISOString(),
          reporter: rep.reporter as any,
          targetDetails,
        };
      })
    );

    return {
      items: enrichedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * 4. Resolve Moderation Report (FR-SA-09, FR-SA-10)
   */
  static async resolveReport(
    reportId: string,
    moderatorId: string,
    input: ContentReportResolveInput
  ): Promise<any> {
    const report = await prisma.contentReport.findUnique({
      where: { id: reportId },
    });

    if (!report) throw new NotFoundError('Moderation report not found');

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Apply target entity modification based on action
      if (report.targetType === 'JOB_POSTING') {
        if (input.action === 'TAKEDOWN') {
          await tx.jobVacancy.update({
            where: { id: report.targetId },
            data: { status: 'FLAGGED' },
          });
        } else if (input.action === 'RESTORE') {
          await tx.jobVacancy.update({
            where: { id: report.targetId },
            data: { status: 'PUBLISHED' },
          });
        }
      } else if (report.targetType === 'APPLICANT_PROFILE') {
        const profile = await tx.applicantProfile.findUnique({
          where: { id: report.targetId },
        });
        if (profile && input.action === 'SUSPEND_PROFILE') {
          await tx.user.update({
            where: { id: profile.userId },
            data: { status: 'SUSPENDED' },
          });
          await tx.refreshToken.updateMany({
            where: { userId: profile.userId },
            data: { revokedAt: new Date() },
          });
        }
      }

      // 2. Update report status
      const nextStatus = input.action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED';
      const resolved = await tx.contentReport.update({
        where: { id: reportId },
        data: {
          status: nextStatus as ReportStatus,
          resolutionAction: input.action,
          resolutionNotes: input.notes,
          resolvedById: moderatorId,
          resolvedAt: new Date(),
        },
      });

      // 3. Record Audit Log Entry
      await tx.auditLog.create({
        data: {
          actorId: moderatorId,
          action: 'MODERATION_REPORT_RESOLVE',
          targetType: report.targetType,
          targetId: report.targetId,
          detailsJson: {
            reportId,
            action: input.action,
            notes: input.notes,
            previousStatus: report.status,
          },
        },
      });

      return resolved;
    });

    return updated;
  }

  /**
   * 5. Banned Keywords Management (FR-SA-11)
   */
  static async listBannedKeywords(): Promise<BannedKeyword[]> {
    const list = await prisma.bannedKeyword.findMany({
      orderBy: [{ category: 'asc' }, { keyword: 'asc' }],
    });

    return list.map((item) => ({
      id: item.id,
      keyword: item.keyword,
      category: item.category,
      severity: item.severity,
      isActive: item.isActive,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));
  }

  static async createBannedKeyword(input: BannedKeywordCreateInput): Promise<BannedKeyword> {
    const existing = await prisma.bannedKeyword.findUnique({
      where: { keyword: input.keyword.toLowerCase().trim() },
    });

    if (existing) {
      throw new BadRequestError('Banned keyword already exists in dictionary');
    }

    const created = await prisma.bannedKeyword.create({
      data: {
        keyword: input.keyword.toLowerCase().trim(),
        category: input.category,
        severity: input.severity,
        isActive: true,
      },
    });

    return {
      id: created.id,
      keyword: created.keyword,
      category: created.category,
      severity: created.severity,
      isActive: created.isActive,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  static async deleteBannedKeyword(id: string): Promise<{ success: boolean }> {
    const item = await prisma.bannedKeyword.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('Banned keyword not found');

    await prisma.bannedKeyword.delete({ where: { id } });
    return { success: true };
  }

  static async testTextKeywords(text: string) {
    return BannedKeywordValidator.validateText(text);
  }

  /**
   * 6. Immutable Platform Audit Log Viewer (FR-SA-12)
   */
  static async listAuditLogs(input: AuditLogQueryInput): Promise<PaginatedResult<AuditLogEntry>> {
    const { page = 1, limit = 15, action, actorId, targetType, startDate, endDate, search } = input;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (action) where.action = { contains: action };
    if (actorId) where.actorId = actorId;
    if (targetType) where.targetType = targetType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { action: { contains: search } },
        { targetType: { contains: search } },
        { targetId: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, email: true, role: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const formatted: AuditLogEntry[] = items.map((log) => ({
      id: log.id,
      actorId: log.actorId,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      detailsJson: log.detailsJson as any,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt.toISOString(),
      actor: log.actor as any,
    }));

    return {
      items: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * 7. GDPR & Data Privacy Request Handler (FR-SA-13)
   */
  static async listGdprRequests(status?: string): Promise<GdprRequest[]> {
    const where: any = {};
    if (status) where.status = status;

    const list = await prisma.gdprRequest.findMany({
      where,
      orderBy: { slaDeadline: 'asc' },
      include: {
        user: {
          select: { id: true, email: true, role: true, status: true },
        },
      },
    });

    return list.map((req) => ({
      id: req.id,
      userId: req.userId,
      requestType: req.requestType as GdprRequestType,
      status: req.status as GdprRequestStatus,
      slaDeadline: req.slaDeadline.toISOString(),
      detailsJson: req.detailsJson as any,
      rejectionReason: req.rejectionReason,
      completedAt: req.completedAt ? req.completedAt.toISOString() : null,
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
      user: req.user as any,
    }));
  }

  static async createGdprRequest(userId: string, requestType: GdprRequestType): Promise<GdprRequest> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    // 30 days SLA deadline per GDPR
    const slaDeadline = new Date();
    slaDeadline.setDate(slaDeadline.getDate() + 30);

    const created = await prisma.gdprRequest.create({
      data: {
        userId,
        requestType,
        status: 'SUBMITTED',
        slaDeadline,
      },
      include: {
        user: {
          select: { id: true, email: true, role: true, status: true },
        },
      },
    });

    return {
      id: created.id,
      userId: created.userId,
      requestType: created.requestType as GdprRequestType,
      status: created.status as GdprRequestStatus,
      slaDeadline: created.slaDeadline.toISOString(),
      detailsJson: created.detailsJson as any,
      rejectionReason: created.rejectionReason,
      completedAt: created.completedAt ? created.completedAt.toISOString() : null,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
      user: created.user as any,
    };
  }

  static async processGdprRequest(
    requestId: string,
    moderatorId: string,
    input: GdprRequestProcessInput
  ): Promise<any> {
    const request = await prisma.gdprRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) throw new NotFoundError('GDPR request not found');

    const updated = await prisma.$transaction(async (tx) => {
      let exportPayload: any = null;

      if (input.status === 'COMPLETED') {
        if (request.requestType === 'DATA_EXPORT') {
          // Generate full structured data archive for subject access request
          const [userProfile, applications, cvs, messages] = await Promise.all([
            tx.applicantProfile.findUnique({
              where: { userId: request.userId },
              include: {
                educations: true,
                workExperiences: true,
                certifications: true,
                achievements: true,
                applicantSkills: { include: { skill: true } },
              },
            }),
            tx.application.findMany({
              where: { applicantId: request.userId },
              include: { job: { select: { title: true, company: { select: { name: true } } } } },
            }),
            tx.cV.findMany({ where: { applicantId: request.userId } }),
            tx.message.findMany({
              where: { OR: [{ senderId: request.userId }, { receiverId: request.userId }] },
            }),
          ]);

          exportPayload = {
            exportGeneratedAt: new Date().toISOString(),
            userAccount: {
              id: request.user.id,
              email: request.user.email,
              role: request.user.role,
              createdAt: request.user.createdAt,
            },
            profile: userProfile,
            applications,
            cvMetadata: cvs.map((c) => ({ fileName: c.fileName, fileSize: c.fileSize, createdAt: c.createdAt })),
            messagesCount: messages.length,
          };
        } else if (request.requestType === 'ERASURE') {
          // Anonymize user personal identifiable info per GDPR Right to be Forgotten
          const randomHash = `anonymized_${Date.now()}`;
          await tx.user.update({
            where: { id: request.userId },
            data: {
              email: `${randomHash}@anonymized.local`,
              status: 'BANNED',
              googleId: null,
              linkedinId: null,
            },
          });

          await tx.applicantProfile.updateMany({
            where: { userId: request.userId },
            data: {
              firstName: 'Anonymized',
              lastName: 'User',
              phone: null,
              summary: 'Erased per GDPR Right to be Forgotten',
              headline: null,
            },
          });

          await tx.refreshToken.updateMany({
            where: { userId: request.userId },
            data: { revokedAt: new Date() },
          });
        }
      }

      const res = await tx.gdprRequest.update({
        where: { id: requestId },
        data: {
          status: input.status as GdprRequestStatus,
          rejectionReason: input.rejectionReason || null,
          detailsJson: exportPayload || request.detailsJson,
          completedAt: input.status === 'COMPLETED' ? new Date() : null,
        },
      });

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          actorId: moderatorId,
          action: 'GDPR_REQUEST_PROCESSED',
          targetType: 'GdprRequest',
          targetId: requestId,
          detailsJson: {
            requestType: request.requestType,
            status: input.status,
            targetUserId: request.userId,
          },
        },
      });

      return res;
    });

    return updated;
  }
}
