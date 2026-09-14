import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db/client';
import { config } from '../../config';
import { MailService } from '../../services/mail.service';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../../middleware/error.middleware';
import {
  CompanyProfileDto,
  TeamDirectoryResponseDto,
  TeamMemberDto,
  TeamInvitationDto,
  PlanUsageDto,
  VerifyInvitationResponseDto,
  RecruiterPermissions,
} from '@recruitment-platform/shared';
import {
  UpdateCompanyProfileInput,
  InviteTeamMemberInput,
  UpdateTeamMemberInput,
  AcceptInvitationInput,
  RequestPlanUpgradeInput,
} from './company-team.types';

export class CompanyTeamService {
  /**
   * Helper: Hash plain invitation token using SHA-256
   */
  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // -------------------------------------------------------------
  // Company Profile & Employer Branding (FR-RC-01)
  // -------------------------------------------------------------

  /**
   * Retrieve company profile, branding, locations, and culture media
   */
  static async getCompanyProfile(companyId: string): Promise<CompanyProfileDto> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        plan: true,
      },
    });

    if (!company) {
      throw new NotFoundError('Company not found.');
    }

    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      industry: company.industry,
      size: company.size,
      logoUrl: company.logoUrl,
      coverPhotoUrl: company.coverPhotoUrl,
      website: company.website,
      description: company.description,
      locations: (company.locationsJson as any) || [],
      cultureMedia: (company.cultureMediaJson as any) || [],
      socialLinks: (company.socialLinksJson as any) || {},
      planId: company.planId,
      status: company.status,
      plan: company.plan as any,
    };
  }

  /**
   * Update company profile, branding, locations, culture media
   */
  static async updateCompanyProfile(
    companyId: string,
    input: UpdateCompanyProfileInput,
    actorUserId: string
  ): Promise<CompanyProfileDto> {
    const existing = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!existing) {
      throw new NotFoundError('Company not found.');
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: {
        ...(input.name ? { name: input.name } : {}),
        industry: input.industry !== undefined ? input.industry : existing.industry,
        size: input.size !== undefined ? input.size : existing.size,
        logoUrl: input.logoUrl !== undefined ? input.logoUrl : existing.logoUrl,
        coverPhotoUrl: input.coverPhotoUrl !== undefined ? input.coverPhotoUrl : existing.coverPhotoUrl,
        website: input.website !== undefined ? input.website : existing.website,
        description: input.description !== undefined ? input.description : existing.description,
        ...(input.locations ? { locationsJson: input.locations as any } : {}),
        ...(input.cultureMedia ? { cultureMediaJson: input.cultureMedia as any } : {}),
        ...(input.socialLinks ? { socialLinksJson: input.socialLinks as any } : {}),
      },
      include: {
        plan: true,
      },
    });

    // Record audit trail
    await prisma.auditLog.create({
      data: {
        actorId: actorUserId,
        action: 'UPDATE_COMPANY_PROFILE',
        targetType: 'COMPANY',
        targetId: companyId,
        detailsJson: {
          updatedFields: Object.keys(input),
          companyName: updated.name,
        },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      industry: updated.industry,
      size: updated.size,
      logoUrl: updated.logoUrl,
      coverPhotoUrl: updated.coverPhotoUrl,
      website: updated.website,
      description: updated.description,
      locations: (updated.locationsJson as any) || [],
      cultureMedia: (updated.cultureMediaJson as any) || [],
      socialLinks: (updated.socialLinksJson as any) || {},
      planId: updated.planId,
      status: updated.status,
      plan: updated.plan as any,
    };
  }

  // -------------------------------------------------------------
  // Subscription Plan & Resource Usage Dashboard (FR-RC-03, FR-SA-03)
  // -------------------------------------------------------------

  /**
   * Calculate real-time resource quota usage against company subscription plan
   */
  static async getPlanUsage(companyId: string): Promise<PlanUsageDto> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        plan: true,
      },
    });

    if (!company) {
      throw new NotFoundError('Company not found.');
    }

    // Default to Free Starter if no plan attached
    const plan = company.plan || {
      id: 'default-free',
      name: 'Free Starter',
      tier: 'FREE' as const,
      priceMonthly: 0,
      maxSeats: 2,
      maxJobPosts: 3,
      maxAtsScans: 50,
      featuresJson: {
        customScreeningQuestions: false,
        advancedAtsWeightOverride: false,
        analyticsExport: false,
      },
    };

    const now = new Date();

    // 1. Active Recruiters count
    const activeRecruiters = await prisma.recruiterProfile.count({
      where: { companyId },
    });

    // 2. Valid Pending Invitations count
    const pendingInvites = await prisma.teamInvitation.count({
      where: {
        companyId,
        status: 'PENDING',
        expiresAt: { gt: now },
      },
    });

    const occupiedSeats = activeRecruiters + pendingInvites;
    const maxSeats = plan.maxSeats;
    const isUnlimitedSeats = maxSeats >= 9999;
    const remainingSeats = isUnlimitedSeats ? 9999 : Math.max(0, maxSeats - occupiedSeats);
    const percentSeatsUsed = isUnlimitedSeats
      ? 0
      : Math.min(100, Math.round((occupiedSeats / Math.max(1, maxSeats)) * 100));
    const isSeatsAtCapacity = !isUnlimitedSeats && occupiedSeats >= maxSeats;

    // 3. Published Job Vacancies count
    const activeJobs = await prisma.jobVacancy.count({
      where: {
        companyId,
        status: 'PUBLISHED',
      },
    });

    const maxJobs = plan.maxJobPosts;
    const isUnlimitedJobs = maxJobs >= 9999;
    const remainingJobs = isUnlimitedJobs ? 9999 : Math.max(0, maxJobs - activeJobs);
    const percentJobsUsed = isUnlimitedJobs
      ? 0
      : Math.min(100, Math.round((activeJobs / Math.max(1, maxJobs)) * 100));
    const isJobsAtCapacity = !isUnlimitedJobs && activeJobs >= maxJobs;

    // 4. Monthly ATS Scans count (calendar month)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const scansUsed = await prisma.aTSScore.count({
      where: {
        application: {
          job: { companyId },
        },
        computedAt: { gte: startOfMonth },
      },
    });

    const maxScans = plan.maxAtsScans;
    const isUnlimitedScans = maxScans >= 99999;
    const remainingScans = isUnlimitedScans ? 99999 : Math.max(0, maxScans - scansUsed);
    const percentScansUsed = isUnlimitedScans
      ? 0
      : Math.min(100, Math.round((scansUsed / Math.max(1, maxScans)) * 100));
    const isScansAtCapacity = !isUnlimitedScans && scansUsed >= maxScans;

    const features = (plan.featuresJson as Record<string, boolean>) || {
      customScreeningQuestions: plan.tier !== 'FREE',
      advancedAtsWeightOverride: plan.tier !== 'FREE',
      analyticsExport: plan.tier !== 'FREE',
    };

    return {
      plan: {
        id: plan.id,
        name: plan.name,
        tier: plan.tier,
        priceMonthly: Number(plan.priceMonthly),
        maxSeats: plan.maxSeats,
        maxJobPosts: plan.maxJobPosts,
        maxAtsScans: plan.maxAtsScans,
        features,
      },
      usage: {
        seats: {
          activeRecruiters,
          pendingInvites,
          occupiedSeats,
          maxSeats,
          remainingSeats,
          percentUsed: percentSeatsUsed,
          isAtCapacity: isSeatsAtCapacity,
        },
        jobPosts: {
          activeJobs,
          maxJobPosts: maxJobs,
          remainingJobs,
          percentUsed: percentJobsUsed,
          isAtCapacity: isJobsAtCapacity,
        },
        atsScans: {
          scansUsed,
          maxAtsScans: maxScans,
          remainingScans,
          percentUsed: percentScansUsed,
          isAtCapacity: isScansAtCapacity,
        },
      },
    };
  }

  /**
   * Submit an upgrade request to Super Admin
   */
  static async requestPlanUpgrade(
    companyId: string,
    input: RequestPlanUpgradeInput,
    actorUserId: string
  ): Promise<{ message: string }> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { plan: true },
    });

    if (!company) {
      throw new NotFoundError('Company not found.');
    }

    const superAdmins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN', status: 'ACTIVE' },
      select: { id: true, email: true },
    });

    // Create in-app notification for all Super Admins
    for (const admin of superAdmins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'SYSTEM_ALERT',
          title: `Plan Upgrade Requested: ${company.name}`,
          message: `${company.name} (current plan: ${company.plan?.name || 'Free'}) requested an upgrade to ${input.requestedTier} tier.${input.note ? ` Note: "${input.note}"` : ''}`,
          link: `/admin/companies/${company.id}`,
        },
      });
    }

    // Record audit trail
    await prisma.auditLog.create({
      data: {
        actorId: actorUserId,
        action: 'REQUEST_PLAN_UPGRADE',
        targetType: 'COMPANY',
        targetId: companyId,
        detailsJson: {
          companyName: company.name,
          currentTier: company.plan?.tier || 'FREE',
          requestedTier: input.requestedTier,
          note: input.note,
        },
      },
    });

    return {
      message: `Upgrade request to ${input.requestedTier} tier submitted successfully. Our platform team has been notified.`,
    };
  }

  // -------------------------------------------------------------
  // Team Member & Invitation Management (FR-RC-02)
  // -------------------------------------------------------------

  /**
   * List all active team members and pending invitations for a company
   */
  static async listTeamDirectory(companyId: string): Promise<TeamDirectoryResponseDto> {
    const [members, invitations] = await Promise.all([
      prisma.recruiterProfile.findMany({
        where: { companyId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              status: true,
              applicantProfile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.teamInvitation.findMany({
        where: {
          companyId,
          status: 'PENDING',
        },
        include: {
          invitedBy: {
            select: {
              email: true,
              applicantProfile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const formattedMembers: TeamMemberDto[] = members.map((m) => {
      const name = m.user.applicantProfile
        ? `${m.user.applicantProfile.firstName} ${m.user.applicantProfile.lastName}`
        : m.user.email.split('@')[0];

      return {
        id: m.id,
        userId: m.userId,
        fullName: name,
        email: m.user.email,
        title: m.title,
        department: m.department,
        subRole: m.subRole,
        permissions: (m.permissions as any) || null,
        createdAt: m.createdAt.toISOString(),
      };
    });

    const now = new Date();
    const formattedInvitations: TeamInvitationDto[] = invitations.map((inv) => {
      const inviterName = inv.invitedBy?.applicantProfile
        ? `${inv.invitedBy.applicantProfile.firstName} ${inv.invitedBy.applicantProfile.lastName}`
        : inv.invitedBy?.email || 'Admin';

      return {
        id: inv.id,
        email: inv.email,
        subRole: inv.subRole,
        permissions: (inv.permissions as any) || null,
        status: inv.status,
        invitedById: inv.invitedById,
        invitedByName: inviterName,
        expiresAt: inv.expiresAt.toISOString(),
        createdAt: inv.createdAt.toISOString(),
        isExpired: inv.expiresAt < now,
      };
    });

    return {
      members: formattedMembers,
      pendingInvitations: formattedInvitations,
    };
  }

  /**
   * Invite a new team member with pre-assigned sub-role and permissions
   * Strictly enforces subscription plan seat capacity
   */
  static async inviteTeamMember(
    companyId: string,
    input: InviteTeamMemberInput,
    actorUserId: string
  ): Promise<TeamInvitationDto> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { plan: true },
    });

    if (!company) {
      throw new NotFoundError('Company not found.');
    }

    const planMaxSeats = company.plan?.maxSeats ?? 2;
    const now = new Date();

    // 1. Calculate active recruiters + valid pending invitations
    const [activeRecruiters, pendingInvites] = await Promise.all([
      prisma.recruiterProfile.count({ where: { companyId } }),
      prisma.teamInvitation.count({
        where: {
          companyId,
          status: 'PENDING',
          expiresAt: { gt: now },
        },
      }),
    ]);

    const occupiedSeats = activeRecruiters + pendingInvites;

    // Hard Seat Quota Check
    if (planMaxSeats < 9999 && occupiedSeats >= planMaxSeats) {
      throw new ForbiddenError(
        `Subscription seat limit reached (${occupiedSeats}/${planMaxSeats} seats used). Upgrade to a higher subscription tier to invite more team members.`
      );
    }

    // 2. Check if user with this email is already a member of this company
    const existingRecruiter = await prisma.user.findFirst({
      where: {
        email: input.email,
        recruiterProfile: { companyId },
      },
    });

    if (existingRecruiter) {
      throw new BadRequestError('A recruiter with this email address is already part of your team.');
    }

    // 3. Check if there is already an active pending invitation for this email
    const existingPendingInvite = await prisma.teamInvitation.findFirst({
      where: {
        companyId,
        email: input.email,
        status: 'PENDING',
        expiresAt: { gt: now },
      },
    });

    if (existingPendingInvite) {
      throw new BadRequestError(
        'An active invitation has already been sent to this email. You can resend the invitation from the pending list.'
      );
    }

    // 4. Generate cryptographically secure random token (32 bytes = 64 hex chars)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.teamInvitation.create({
      data: {
        companyId,
        email: input.email,
        subRole: input.subRole,
        permissions: (input.permissions as any) || undefined,
        tokenHash,
        status: 'PENDING',
        invitedById: actorUserId,
        expiresAt,
      },
      include: {
        invitedBy: {
          select: {
            email: true,
            applicantProfile: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    // 5. Send invitation email
    const inviterName = invitation.invitedBy?.applicantProfile
      ? `${invitation.invitedBy.applicantProfile.firstName} ${invitation.invitedBy.applicantProfile.lastName}`
      : invitation.invitedBy?.email;

    setImmediate(async () => {
      try {
        await MailService.sendTeamInvitationEmail(
          input.email,
          company.name,
          input.subRole,
          rawToken,
          inviterName
        );
      } catch (err) {
        console.error('Failed to dispatch team invitation email:', err);
      }
    });

    // 6. Record audit log
    await prisma.auditLog.create({
      data: {
        actorId: actorUserId,
        action: 'INVITE_TEAM_MEMBER',
        targetType: 'TEAM_INVITATION',
        targetId: invitation.id,
        detailsJson: {
          invitedEmail: input.email,
          subRole: input.subRole,
          companyName: company.name,
        },
      },
    });

    return {
      id: invitation.id,
      email: invitation.email,
      subRole: invitation.subRole,
      permissions: (invitation.permissions as any) || null,
      status: invitation.status,
      invitedById: invitation.invitedById,
      invitedByName: inviterName,
      expiresAt: invitation.expiresAt.toISOString(),
      createdAt: invitation.createdAt.toISOString(),
      isExpired: false,
    };
  }

  /**
   * Revoke an active pending invitation
   * Immediately releases the reserved seat license
   */
  static async revokeInvitation(
    companyId: string,
    invitationId: string,
    actorUserId: string
  ): Promise<{ message: string }> {
    const invitation = await prisma.teamInvitation.findFirst({
      where: { id: invitationId, companyId },
    });

    if (!invitation) {
      throw new NotFoundError('Invitation not found.');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestError(`Cannot revoke invitation with status '${invitation.status}'.`);
    }

    await prisma.teamInvitation.update({
      where: { id: invitationId },
      data: { status: 'REVOKED' },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actorUserId,
        action: 'REVOKE_TEAM_INVITATION',
        targetType: 'TEAM_INVITATION',
        targetId: invitationId,
        detailsJson: {
          revokedEmail: invitation.email,
        },
      },
    });

    return { message: 'Invitation revoked successfully. The reserved seat has been released.' };
  }

  /**
   * Resend an invitation with a refreshed 7-day token
   */
  static async resendInvitation(
    companyId: string,
    invitationId: string,
    actorUserId: string
  ): Promise<TeamInvitationDto> {
    const invitation = await prisma.teamInvitation.findFirst({
      where: { id: invitationId, companyId },
      include: {
        company: true,
        invitedBy: {
          select: {
            email: true,
            applicantProfile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundError('Invitation not found.');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const updated = await prisma.teamInvitation.update({
      where: { id: invitationId },
      data: {
        tokenHash,
        status: 'PENDING',
        expiresAt,
      },
    });

    const inviterName = invitation.invitedBy?.applicantProfile
      ? `${invitation.invitedBy.applicantProfile.firstName} ${invitation.invitedBy.applicantProfile.lastName}`
      : invitation.invitedBy?.email;

    setImmediate(async () => {
      try {
        await MailService.sendTeamInvitationEmail(
          invitation.email,
          invitation.company.name,
          invitation.subRole,
          rawToken,
          inviterName
        );
      } catch (err) {
        console.error('Failed to resend team invitation email:', err);
      }
    });

    return {
      id: updated.id,
      email: updated.email,
      subRole: updated.subRole,
      permissions: (updated.permissions as any) || null,
      status: updated.status,
      invitedById: updated.invitedById,
      invitedByName: inviterName,
      expiresAt: updated.expiresAt.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      isExpired: false,
    };
  }

  /**
   * Public verification of an invitation token for the onboarding page
   */
  static async verifyInvitationToken(token: string): Promise<VerifyInvitationResponseDto> {
    const tokenHash = this.hashToken(token);
    const invitation = await prisma.teamInvitation.findUnique({
      where: { tokenHash },
      include: {
        company: {
          select: { name: true, logoUrl: true },
        },
      },
    });

    if (!invitation) {
      throw new BadRequestError('Invalid or unrecognized invitation token.');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestError(`This invitation is no longer active (status: ${invitation.status.toLowerCase()}).`);
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestError('This invitation link has expired. Please contact your hiring manager for a new invite.');
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    return {
      valid: true,
      email: invitation.email,
      companyName: invitation.company.name,
      companyLogoUrl: invitation.company.logoUrl,
      subRole: invitation.subRole,
      isExistingUser: Boolean(existingUser),
    };
  }

  /**
   * Accept an invitation and provision the recruiter account
   */
  static async acceptInvitation(input: AcceptInvitationInput): Promise<{
    user: any;
    token: string;
    message: string;
  }> {
    const tokenHash = this.hashToken(input.token);
    const invitation = await prisma.teamInvitation.findUnique({
      where: { tokenHash },
      include: {
        company: true,
      },
    });

    if (!invitation || invitation.status !== 'PENDING') {
      throw new BadRequestError('Invalid or already used invitation.');
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestError('This invitation has expired.');
    }

    let user = await prisma.user.findUnique({
      where: { email: invitation.email },
      include: { recruiterProfile: true },
    });

    if (!user) {
      if (!input.password) {
        throw new BadRequestError('Password is required for new accounts.');
      }
      const passwordHash = await bcrypt.hash(input.password, 10);

      // Create new user, recruiter profile, and applicant profile in transaction
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: invitation.email,
            passwordHash,
            role: 'RECRUITER',
            status: 'ACTIVE',
            recruiterProfile: {
              create: {
                companyId: invitation.companyId,
                subRole: invitation.subRole,
                permissions: invitation.permissions as any,
              },
            },
            applicantProfile: {
              create: {
                firstName: input.firstName || 'Team',
                lastName: input.lastName || 'Member',
              },
            },
          },
          include: { recruiterProfile: true },
        });

        await tx.teamInvitation.update({
          where: { id: invitation.id },
          data: {
            status: 'ACCEPTED',
            acceptedAt: new Date(),
          },
        });

        return newUser;
      });
    } else {
      // Existing platform user - link or update recruiter profile
      user = await prisma.$transaction(async (tx) => {
        if (user!.recruiterProfile) {
          await tx.recruiterProfile.update({
            where: { id: user!.recruiterProfile.id },
            data: {
              companyId: invitation.companyId,
              subRole: invitation.subRole,
              permissions: invitation.permissions as any,
            },
          });
        } else {
          await tx.recruiterProfile.create({
            data: {
              userId: user!.id,
              companyId: invitation.companyId,
              subRole: invitation.subRole,
              permissions: invitation.permissions as any,
            },
          });
        }

        if (user!.role !== 'SUPER_ADMIN') {
          await tx.user.update({
            where: { id: user!.id },
            data: { role: 'RECRUITER' },
          });
        }

        await tx.teamInvitation.update({
          where: { id: invitation.id },
          data: {
            status: 'ACCEPTED',
            acceptedAt: new Date(),
          },
        });

        return tx.user.findUniqueOrThrow({
          where: { id: user!.id },
          include: { recruiterProfile: true },
        });
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        companyId: invitation.companyId,
        recruiterSubRole: invitation.subRole,
        recruiterPermissions: invitation.permissions,
      },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: invitation.companyId,
        recruiterSubRole: invitation.subRole,
      },
      token,
      message: `Welcome to ${invitation.company.name}! Your account has been activated.`,
    };
  }

  /**
   * Update recruiter sub-role, department, title, and permissions
   */
  static async updateMemberRole(
    companyId: string,
    memberId: string,
    input: UpdateTeamMemberInput,
    actorUserId: string
  ): Promise<TeamMemberDto> {
    const member = await prisma.recruiterProfile.findFirst({
      where: { id: memberId, companyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            applicantProfile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundError('Team member not found.');
    }

    // Prevent demoting the last Company Admin
    if (member.subRole === 'COMPANY_ADMIN' && input.subRole && input.subRole !== 'COMPANY_ADMIN') {
      const adminCount = await prisma.recruiterProfile.count({
        where: { companyId, subRole: 'COMPANY_ADMIN' },
      });

      if (adminCount <= 1) {
        throw new BadRequestError(
          'Cannot demote the sole Company Administrator. Please assign another administrator before changing this role.'
        );
      }
    }

    const updated = await prisma.recruiterProfile.update({
      where: { id: memberId },
      data: {
        ...(input.subRole ? { subRole: input.subRole } : {}),
        department: input.department !== undefined ? input.department : member.department,
        title: input.title !== undefined ? input.title : member.title,
        ...(input.permissions !== undefined ? { permissions: input.permissions as any } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            applicantProfile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actorUserId,
        action: 'UPDATE_TEAM_MEMBER_ROLE',
        targetType: 'RECRUITER_PROFILE',
        targetId: memberId,
        detailsJson: {
          memberEmail: updated.user.email,
          previousSubRole: member.subRole,
          newSubRole: updated.subRole,
        },
      },
    });

    const name = updated.user.applicantProfile
      ? `${updated.user.applicantProfile.firstName} ${updated.user.applicantProfile.lastName}`
      : updated.user.email.split('@')[0];

    return {
      id: updated.id,
      userId: updated.userId,
      fullName: name,
      email: updated.user.email,
      title: updated.title,
      department: updated.department,
      subRole: updated.subRole,
      permissions: (updated.permissions as any) || null,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  /**
   * Remove or offboard a team member, reassigning requisitions and releasing the seat
   */
  static async removeTeamMember(
    companyId: string,
    memberId: string,
    successorUserId: string | undefined,
    actorUserId: string
  ): Promise<{ message: string; reassignedJobsCount: number }> {
    const member = await prisma.recruiterProfile.findFirst({
      where: { id: memberId, companyId },
      include: { user: true },
    });

    if (!member) {
      throw new NotFoundError('Team member not found.');
    }

    // Guard: Cannot delete self if sole Company Admin
    if (member.subRole === 'COMPANY_ADMIN') {
      const adminCount = await prisma.recruiterProfile.count({
        where: { companyId, subRole: 'COMPANY_ADMIN' },
      });
      if (adminCount <= 1) {
        throw new BadRequestError(
          'Cannot remove the only Company Administrator. Assign another administrator first.'
        );
      }
    }

    let reassignedJobsCount = 0;

    // Handle requisition reassignment if successor specified
    if (successorUserId) {
      const successor = await prisma.recruiterProfile.findFirst({
        where: { userId: successorUserId, companyId },
      });

      if (!successor) {
        throw new BadRequestError('Designated successor recruiter was not found in this company.');
      }

      // Reassign open job vacancies created by this user
      const updateResult = await prisma.jobVacancy.updateMany({
        where: {
          companyId,
          createdById: member.userId,
        },
        data: {
          createdById: successorUserId,
        },
      });

      reassignedJobsCount = updateResult.count;

      // Reassign future scheduled interviews
      await prisma.interviewSchedule.updateMany({
        where: {
          interviewerId: member.userId,
          scheduledAt: { gte: new Date() },
        },
        data: {
          interviewerId: successorUserId,
        },
      });
    }

    // Delete recruiter profile (releases seat license)
    await prisma.recruiterProfile.delete({
      where: { id: memberId },
    });

    // Revoke user refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId: member.userId },
    });

    // Record audit trail
    await prisma.auditLog.create({
      data: {
        actorId: actorUserId,
        action: 'REMOVE_TEAM_MEMBER',
        targetType: 'RECRUITER_PROFILE',
        targetId: memberId,
        detailsJson: {
          removedUserEmail: member.user.email,
          successorUserId: successorUserId || null,
          reassignedJobsCount,
        },
      },
    });

    return {
      message: 'Team member removed successfully. The subscription seat license has been released.',
      reassignedJobsCount,
    };
  }
}
