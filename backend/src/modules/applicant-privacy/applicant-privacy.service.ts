import bcrypt from 'bcrypt';
import { prisma } from '../../db/client';
import {
  NotificationPreferenceDto,
  UpdateNotificationPreferenceDto,
  BlockedCompanyDto,
  GdprExportDataDto,
  GdprErasureResponseDto,
} from '@recruitment-platform/shared';
import { BadRequestError, NotFoundError } from '../../middleware/error.middleware';

export class ApplicantPrivacyService {
  /**
   * FR-AP-28: Retrieve applicant notification preferences
   */
  static async getPreferences(userId: string): Promise<NotificationPreferenceDto> {
    const pref = await prisma.userNotificationPreference.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        applicationStatusEmail: true,
        applicationStatusInApp: true,
        interviewInvitesEmail: true,
        interviewInvitesInApp: true,
        messagesEmail: true,
        messagesInApp: true,
        followedCompanyJobEmail: true,
        followedCompanyJobInApp: true,
        jobAlertsEmail: false,
        jobAlertsInApp: true,
      },
    });

    return {
      userId: pref.userId,
      applicationStatusEmail: pref.applicationStatusEmail,
      applicationStatusInApp: pref.applicationStatusInApp,
      interviewInvitesEmail: pref.interviewInvitesEmail,
      interviewInvitesInApp: pref.interviewInvitesInApp,
      messagesEmail: pref.messagesEmail,
      messagesInApp: pref.messagesInApp,
      followedCompanyJobEmail: pref.followedCompanyJobEmail,
      followedCompanyJobInApp: pref.followedCompanyJobInApp,
      jobAlertsEmail: pref.jobAlertsEmail,
      jobAlertsInApp: pref.jobAlertsInApp,
      updatedAt: pref.updatedAt.toISOString(),
    };
  }

  /**
   * FR-AP-28: Update applicant notification preferences
   */
  static async updatePreferences(
    userId: string,
    input: UpdateNotificationPreferenceDto
  ): Promise<NotificationPreferenceDto> {
    const pref = await prisma.userNotificationPreference.upsert({
      where: { userId },
      update: {
        ...input,
      },
      create: {
        userId,
        applicationStatusEmail: input.applicationStatusEmail ?? true,
        applicationStatusInApp: input.applicationStatusInApp ?? true,
        interviewInvitesEmail: input.interviewInvitesEmail ?? true,
        interviewInvitesInApp: input.interviewInvitesInApp ?? true,
        messagesEmail: input.messagesEmail ?? true,
        messagesInApp: input.messagesInApp ?? true,
        followedCompanyJobEmail: input.followedCompanyJobEmail ?? true,
        followedCompanyJobInApp: input.followedCompanyJobInApp ?? true,
        jobAlertsEmail: input.jobAlertsEmail ?? false,
        jobAlertsInApp: input.jobAlertsInApp ?? true,
      },
    });

    return {
      userId: pref.userId,
      applicationStatusEmail: pref.applicationStatusEmail,
      applicationStatusInApp: pref.applicationStatusInApp,
      interviewInvitesEmail: pref.interviewInvitesEmail,
      interviewInvitesInApp: pref.interviewInvitesInApp,
      messagesEmail: pref.messagesEmail,
      messagesInApp: pref.messagesInApp,
      followedCompanyJobEmail: pref.followedCompanyJobEmail,
      followedCompanyJobInApp: pref.followedCompanyJobInApp,
      jobAlertsEmail: pref.jobAlertsEmail,
      jobAlertsInApp: pref.jobAlertsInApp,
      updatedAt: pref.updatedAt.toISOString(),
    };
  }

  /**
   * FR-AP-30: Retrieve blocked companies list for applicant
   */
  static async getBlockedCompanies(applicantUserId: string): Promise<BlockedCompanyDto[]> {
    const blocks = await prisma.companyBlock.findMany({
      where: { applicantId: applicantUserId },
      include: { company: true },
      orderBy: { createdAt: 'desc' },
    });

    return blocks.map((b: any) => ({
      id: b.id,
      companyId: b.companyId,
      companyName: b.company.name,
      companySlug: b.company.slug,
      companyLogoUrl: b.company.logoUrl,
      companyIndustry: b.company.industry,
      reason: b.reason,
      blockedAt: b.createdAt.toISOString(),
    }));
  }

  /**
   * FR-AP-30: Block a company by ID
   */
  static async blockCompany(
    applicantUserId: string,
    companyId: string,
    reason?: string
  ): Promise<BlockedCompanyDto> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundError('Company not found.');
    }

    const block = await prisma.companyBlock.upsert({
      where: {
        unique_applicant_company_block: {
          applicantId: applicantUserId,
          companyId,
        },
      },
      update: { reason },
      create: {
        applicantId: applicantUserId,
        companyId,
        reason,
      },
      include: { company: true },
    });

    // Also synchronize profile visibilitySettings.hideFromCompanies
    const profile = await prisma.applicantProfile.findUnique({
      where: { userId: applicantUserId },
    });

    if (profile) {
      let settings: any = profile.visibilitySettings || { visibility: 'PUBLIC' };
      if (typeof settings === 'string') {
        try {
          settings = JSON.parse(settings);
        } catch {
          settings = { visibility: 'PUBLIC' };
        }
      }
      const currentHidden: string[] = Array.isArray(settings.hideFromCompanies)
        ? settings.hideFromCompanies
        : [];

      if (!currentHidden.includes(companyId)) {
        settings.hideFromCompanies = [...currentHidden, companyId];
        await prisma.applicantProfile.update({
          where: { id: profile.id },
          data: { visibilitySettings: settings },
        });
      }
    }

    return {
      id: block.id,
      companyId: block.companyId,
      companyName: block.company.name,
      companySlug: block.company.slug,
      companyLogoUrl: block.company.logoUrl,
      companyIndustry: block.company.industry,
      reason: block.reason,
      blockedAt: block.createdAt.toISOString(),
    };
  }

  /**
   * FR-AP-30: Unblock a company
   */
  static async unblockCompany(
    applicantUserId: string,
    companyId: string
  ): Promise<{ success: boolean; companyId: string }> {
    await prisma.companyBlock.deleteMany({
      where: {
        applicantId: applicantUserId,
        companyId,
      },
    });

    // Synchronize removal from profile visibilitySettings
    const profile = await prisma.applicantProfile.findUnique({
      where: { userId: applicantUserId },
    });

    if (profile && profile.visibilitySettings) {
      let settings: any = profile.visibilitySettings;
      if (typeof settings === 'string') {
        try {
          settings = JSON.parse(settings);
        } catch {
          settings = {};
        }
      }
      if (Array.isArray(settings.hideFromCompanies)) {
        settings.hideFromCompanies = settings.hideFromCompanies.filter(
          (id: string) => id !== companyId
        );
        await prisma.applicantProfile.update({
          where: { id: profile.id },
          data: { visibilitySettings: settings },
        });
      }
    }

    return {
      success: true,
      companyId,
    };
  }

  /**
   * FR-AP-29: Export complete personal data archive (GDPR Data Portability)
   */
  static async exportPersonalData(applicantUserId: string): Promise<GdprExportDataDto> {
    const user = await prisma.user.findUnique({
      where: { id: applicantUserId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User record not found.');
    }

    const profile = await prisma.applicantProfile.findUnique({
      where: { userId: applicantUserId },
      include: {
        applicantSkills: { include: { skill: true } },
        educations: true,
        workExperiences: true,
        achievements: true,
        certifications: true,
        portfolios: true,
        cvs: {
          include: {
            versions: true,
          },
        },
        applications: {
          include: {
            job: {
              include: {
                company: true,
              },
            },
            atsScore: true,
          },
        },
        savedJobs: {
          include: {
            job: {
              include: {
                company: true,
              },
            },
          },
        },
      },
    });

    const followedCompanies = await prisma.companyFollow.findMany({
      where: { applicantId: applicantUserId },
      include: { company: true },
    });

    const blockedCompanies = await prisma.companyBlock.findMany({
      where: { applicantId: applicantUserId },
      include: { company: true },
    });

    const notificationPreferences = await prisma.userNotificationPreference.findUnique({
      where: { userId: applicantUserId },
    });

    // Record GDPR export in audit log
    await prisma.auditLog.create({
      data: {
        actorId: applicantUserId,
        action: 'GDPR_DATA_EXPORT',
        targetType: 'APPLICANT_PROFILE',
        targetId: profile?.id || applicantUserId,
        detailsJson: {
          timestamp: new Date().toISOString(),
          ipRequested: 'privacy-center',
        },
      },
    });

    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
      },
      profile: profile
        ? {
            id: profile.id,
            firstName: profile.firstName,
            lastName: profile.lastName,
            headline: profile.headline,
            summary: profile.summary,
            phone: profile.phone,
            location: profile.location,
            visibilitySettings: profile.visibilitySettings,
            createdAt: profile.createdAt.toISOString(),
            updatedAt: profile.updatedAt.toISOString(),
          }
        : null,
      skills: profile?.applicantSkills || [],
      education: profile?.educations || [],
      workExperience: profile?.workExperiences || [],
      achievements: profile?.achievements || [],
      certifications: profile?.certifications || [],
      portfolios: profile?.portfolios || [],
      cvs: profile?.cvs || [],
      applications: profile?.applications || [],
      savedJobs: profile?.savedJobs || [],
      followedCompanies: followedCompanies.map((f: any) => ({
        companyId: f.companyId,
        companyName: f.company.name,
        followedAt: f.createdAt.toISOString(),
      })),
      blockedCompanies: blockedCompanies.map((b: any) => ({
        companyId: b.companyId,
        companyName: b.company.name,
        reason: b.reason,
        blockedAt: b.createdAt.toISOString(),
      })),
      notificationPreferences: notificationPreferences || null,
    };
  }

  /**
   * FR-AP-29, UC-14: Request account erasure / deletion (GDPR Right to Erasure)
   */
  static async requestAccountErasure(
    applicantUserId: string,
    passwordConfirm: string,
    reason?: string
  ): Promise<GdprErasureResponseDto> {
    const user = await prisma.user.findUnique({
      where: { id: applicantUserId },
    });

    if (!user) {
      throw new NotFoundError('User record not found.');
    }

    const isPasswordValid = await bcrypt.compare(passwordConfirm, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestError('Incorrect password. Deletion request requires valid password confirmation.');
    }

    const slaDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30-day GDPR statutory window

    const gdprRequest = await prisma.gdprRequest.create({
      data: {
        userId: applicantUserId,
        requestType: 'ERASURE',
        status: 'SUBMITTED',
        slaDeadline,
        detailsJson: {
          reason: reason || 'Self-service account deletion initiated from privacy portal',
          initiatedAt: new Date().toISOString(),
        },
      },
    });

    // Record in immutable audit log
    await prisma.auditLog.create({
      data: {
        actorId: applicantUserId,
        action: 'GDPR_ERASURE_REQUEST',
        targetType: 'USER',
        targetId: applicantUserId,
        detailsJson: {
          requestId: gdprRequest.id,
          slaDeadline: slaDeadline.toISOString(),
        },
      },
    });

    return {
      requestId: gdprRequest.id,
      status: gdprRequest.status,
      slaDeadline: slaDeadline.toISOString(),
      message:
        'Your account erasure request has been registered and will be executed in compliance with data privacy regulations within 30 days.',
    };
  }
}
