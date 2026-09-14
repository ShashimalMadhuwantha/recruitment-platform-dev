import { JobStatus, ApplicationStatus, OfferStatus } from '@prisma/client';
import { prisma } from '../../db/client';
import { config } from '../../config';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../middleware/error.middleware';
import { notificationService } from '../notifications/notifications.service';
import type {
  CreateOfferInput,
  RespondOfferInput,
  HireCandidateInput,
} from './offers.types';
import type { JobOfferDto } from '@recruitment-platform/shared';

export class OffersService {
  /**
   * Helper: Validate application access and company association
   */
  async validateApplicationAccess(applicationId: string, userId: string, userRole: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        applicant: {
          include: {
            user: { select: { id: true, email: true } },
          },
        },
        job: {
          include: {
            company: { select: { id: true, name: true } },
          },
        },
        jobOffer: true,
      },
    });

    if (!application) {
      throw new NotFoundError('Application not found.');
    }

    const isApplicant = application.applicant.userId === userId;
    let isCompanyRecruiter = false;

    if (userRole === 'RECRUITER') {
      const recruiterProfile = await prisma.recruiterProfile.findUnique({
        where: { userId },
        select: { companyId: true },
      });
      if (recruiterProfile?.companyId === application.job.companyId) {
        isCompanyRecruiter = true;
      }
    }

    const isSuperAdmin = userRole === 'SUPER_ADMIN';

    if (!isApplicant && !isCompanyRecruiter && !isSuperAdmin) {
      throw new ForbiddenError('You do not have access to this application offer.');
    }

    return {
      application,
      isApplicant,
      isCompanyRecruiter,
      isSuperAdmin,
    };
  }

  /**
   * Generate default markdown offer letter text
   */
  private generateDefaultOfferLetter(params: {
    candidateName: string;
    jobTitle: string;
    companyName: string;
    baseSalary: number;
    currency: string;
    bonus?: number | null;
    equity?: string | null;
    startDate: Date;
    expirationDate: Date;
    benefitsSummary?: string | null;
  }): string {
    const formattedSalary = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: params.currency,
      maximumFractionDigits: 0,
    }).format(params.baseSalary);

    return [
      `# Employment Offer: ${params.jobTitle}`,
      `**Company:** ${params.companyName}`,
      `**Candidate:** ${params.candidateName}`,
      `**Date of Issuance:** ${new Date().toLocaleDateString()}`,
      `\nDear ${params.candidateName},`,
      `\nWe are delighted to extend an official offer of employment for the position of **${params.jobTitle}** at **${params.companyName}**. We were thoroughly impressed by your interviews and achievements, and believe your skills will make a tremendous impact on our team.`,
      `\n### Summary of Compensation & Terms`,
      `- **Position:** ${params.jobTitle}`,
      `- **Annual Base Salary:** ${formattedSalary} (${params.currency})`,
      params.bonus ? `- **Performance Bonus / Signing Bonus:** ${params.bonus} (${params.currency})` : '',
      params.equity ? `- **Equity / Stock Options:** ${params.equity}` : '',
      `- **Proposed Start Date:** ${params.startDate.toLocaleDateString()}`,
      `- **Offer Expiration Date:** ${params.expirationDate.toLocaleDateString()}`,
      `\n### Benefits & Perks`,
      params.benefitsSummary
        ? params.benefitsSummary
        : `Comprehensive healthcare coverage (medical, dental, vision), 401(k) matching, flexible paid time off, and continuous learning stipends.`,
      `\n### Acceptance`,
      `To accept this offer, please review and submit your acceptance via the ATS portal by **${params.expirationDate.toLocaleDateString()}**.`,
      `\nWe look forward to welcoming you to ${params.companyName}!`,
      `\nSincerely,\n**Hiring Team, ${params.companyName}**`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  /**
   * Create or update a draft offer (FR-RC-24)
   */
  async createOrUpdateOffer(
    applicationId: string,
    recruiterId: string,
    recruiterRole: string,
    data: CreateOfferInput
  ): Promise<JobOfferDto> {
    const { application, isCompanyRecruiter, isSuperAdmin } =
      await this.validateApplicationAccess(applicationId, recruiterId, recruiterRole);

    if (!isCompanyRecruiter && !isSuperAdmin) {
      throw new ForbiddenError('Only company recruiters or administrators can create job offers.');
    }

    const startDate = new Date(data.startDate);
    const expirationDate = new Date(data.expirationDate);

    if (expirationDate <= new Date()) {
      throw new BadRequestError('Offer expiration date must be in the future.');
    }

    const candidateName = `${application.applicant.firstName} ${application.applicant.lastName}`.trim();

    const offerLetterText =
      data.offerLetterText?.trim() ||
      this.generateDefaultOfferLetter({
        candidateName,
        jobTitle: application.job.title,
        companyName: application.job.company.name,
        baseSalary: data.baseSalary,
        currency: data.currency || 'USD',
        bonus: data.bonus,
        equity: data.equity,
        startDate,
        expirationDate,
        benefitsSummary: data.benefitsSummary,
      });

    const initialStatus = data.autoSend ? OfferStatus.SENT : OfferStatus.DRAFT;
    const sentAt = data.autoSend ? new Date() : null;

    const offer = await prisma.jobOffer.upsert({
      where: { applicationId },
      create: {
        applicationId,
        createdById: recruiterId,
        baseSalary: data.baseSalary,
        currency: data.currency || 'USD',
        bonus: data.bonus || null,
        equity: data.equity?.trim() || null,
        startDate,
        expirationDate,
        offerLetterText,
        benefitsSummary: data.benefitsSummary?.trim() || null,
        notes: data.notes?.trim() || null,
        status: initialStatus,
        sentAt,
      },
      update: {
        baseSalary: data.baseSalary,
        currency: data.currency || 'USD',
        bonus: data.bonus || null,
        equity: data.equity?.trim() || null,
        startDate,
        expirationDate,
        offerLetterText,
        benefitsSummary: data.benefitsSummary?.trim() || null,
        notes: data.notes?.trim() || null,
        ...(data.autoSend ? { status: OfferStatus.SENT, sentAt: new Date() } : {}),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            recruiterProfile: { select: { title: true } },
          },
        },
      },
    });

    // If autoSend is enabled, progress application status to OFFER
    if (data.autoSend) {
      await this.sendOffer(applicationId, recruiterId, recruiterRole);
    }

    return this.mapToDto(offer, application, candidateName);
  }

  /**
   * Send official offer to candidate (FR-RC-24)
   */
  async sendOffer(
    targetId: string,
    recruiterId: string,
    recruiterRole: string
  ): Promise<JobOfferDto> {
    let offer = await prisma.jobOffer.findUnique({
      where: { applicationId: targetId },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            recruiterProfile: { select: { title: true } },
          },
        },
      },
    });

    if (!offer) {
      offer = await prisma.jobOffer.findUnique({
        where: { id: targetId },
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              recruiterProfile: { select: { title: true } },
            },
          },
        },
      });
    }

    if (!offer) {
      throw new NotFoundError('No offer found. Please create an offer draft first.');
    }

    const { application, isCompanyRecruiter, isSuperAdmin } =
      await this.validateApplicationAccess(offer.applicationId, recruiterId, recruiterRole);

    if (!isCompanyRecruiter && !isSuperAdmin) {
      throw new ForbiddenError('Only company recruiters or administrators can send job offers.');
    }

    // Update offer status
    const updatedOffer = await prisma.jobOffer.update({
      where: { id: offer.id },
      data: {
        status: OfferStatus.SENT,
        sentAt: new Date(),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            recruiterProfile: { select: { title: true } },
          },
        },
      },
    });

    // Progress application to OFFER status
    await prisma.application.update({
      where: { id: offer.applicationId },
      data: { status: ApplicationStatus.OFFER },
    });

    // Create candidate pipeline stage record
    const offerStage = await prisma.pipelineStage.findFirst({
      where: { jobId: application.jobId, name: 'OFFER' },
    });
    if (offerStage) {
      await prisma.candidatePipeline.create({
        data: {
          applicationId: offer.applicationId,
          stageId: offerStage.id,
          movedById: recruiterId,
          notes: `Official offer extended with base salary ${new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: offer.currency,
          }).format(Number(offer.baseSalary))}`,
        },
      });
    }

    const candidateName = `${application.applicant.firstName} ${application.applicant.lastName}`.trim();
    const formattedSalary = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: offer.currency || 'USD',
    }).format(Number(offer.baseSalary));
    const formattedStartDate = new Date(offer.startDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedExpirationDate = new Date(offer.expirationDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const recruiterName =
      updatedOffer.createdBy?.recruiterProfile?.title ||
      updatedOffer.createdBy?.email.split('@')[0] ||
      'Recruitment Team';
    const portalUrl = `${config.FRONTEND_URL}/applicant/dashboard`;

    // Notify candidate with dynamic template variables
    await notificationService.createNotification(
      application.applicant.userId,
      'JOB_OFFER_RECEIVED',
      `Official Job Offer Extended: ${application.job.title}`,
      `Congratulations ${candidateName}! ${application.job.company.name} has extended you an official job offer for ${application.job.title}. Please review the terms and respond.`,
      `/applicant/dashboard`,
      {
        applicationId: offer.applicationId,
        offerId: offer.id,
        candidate_name: candidateName,
        job_title: application.job.title,
        company_name: application.job.company.name,
        base_salary: formattedSalary,
        currency: offer.currency || 'USD',
        start_date: formattedStartDate,
        expiration_date: formattedExpirationDate,
        recruiter_name: recruiterName,
        portal_url: portalUrl,
      }
    );

    return this.mapToDto(updatedOffer, application, candidateName);
  }

  /**
   * Fetch offer details for an application
   */
  async getApplicationOffer(
    applicationId: string,
    userId: string,
    userRole: string
  ): Promise<JobOfferDto | null> {
    const { application, isApplicant } = await this.validateApplicationAccess(
      applicationId,
      userId,
      userRole
    );

    const offer = await prisma.jobOffer.findUnique({
      where: { applicationId },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            recruiterProfile: { select: { title: true } },
          },
        },
      },
    });

    if (!offer) {
      return null;
    }

    // If applicant, do not expose draft offers until officially sent
    if (isApplicant && offer.status === OfferStatus.DRAFT) {
      return null;
    }

    // Check expiration: if SENT and past expirationDate, update to EXPIRED
    if (offer.status === OfferStatus.SENT && new Date() > offer.expirationDate) {
      const expired = await prisma.jobOffer.update({
        where: { id: offer.id },
        data: { status: OfferStatus.EXPIRED },
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              recruiterProfile: { select: { title: true } },
            },
          },
        },
      });
      const candidateName = `${application.applicant.firstName} ${application.applicant.lastName}`.trim();
      return this.mapToDto(expired, application, candidateName);
    }

    const candidateName = `${application.applicant.firstName} ${application.applicant.lastName}`.trim();
    return this.mapToDto(offer, application, candidateName);
  }

  /**
   * Candidate responds to an offer (ACCEPT or DECLINE)
   */
  async respondToOffer(
    offerId: string,
    applicantUserId: string,
    data: RespondOfferInput
  ): Promise<JobOfferDto> {
    const offer = await prisma.jobOffer.findUnique({
      where: { id: offerId },
      include: {
        application: {
          include: {
            applicant: true,
            job: {
              include: { company: true },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            recruiterProfile: { select: { title: true } },
          },
        },
      },
    });

    if (!offer) {
      throw new NotFoundError('Job offer not found.');
    }

    if (offer.application.applicant.userId !== applicantUserId) {
      throw new ForbiddenError('You can only respond to your own job offers.');
    }

    if (offer.status === OfferStatus.DRAFT) {
      throw new BadRequestError('This offer has not yet been extended.');
    }

    if (offer.status === OfferStatus.ACCEPTED || offer.status === OfferStatus.DECLINED) {
      throw new BadRequestError(`This offer has already been ${offer.status.toLowerCase()}.`);
    }

    // Check expiration
    if (new Date() > offer.expirationDate) {
      await prisma.jobOffer.update({
        where: { id: offer.id },
        data: { status: OfferStatus.EXPIRED },
      });
      throw new BadRequestError('This offer has expired. Please contact the hiring team.');
    }

    const targetStatus =
      data.action === 'ACCEPT' ? OfferStatus.ACCEPTED : OfferStatus.DECLINED;

    const updatedOffer = await prisma.jobOffer.update({
      where: { id: offer.id },
      data: {
        status: targetStatus,
        declinedReason: data.action === 'DECLINE' ? data.declinedReason?.trim() || 'Candidate declined' : null,
        respondedAt: new Date(),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            recruiterProfile: { select: { title: true } },
          },
        },
      },
    });

    const candidateName = `${offer.application.applicant.firstName} ${offer.application.applicant.lastName}`.trim();

    // If candidate declined, update application status to REJECTED or leave in OFFER with note
    if (data.action === 'DECLINE') {
      await prisma.application.update({
        where: { id: offer.applicationId },
        data: { status: ApplicationStatus.REJECTED },
      });
    }

    // Send in-app notification to the recruiter who created the offer
    const notificationType = data.action === 'ACCEPT' ? 'OFFER_ACCEPTED' : 'OFFER_DECLINED';
    const notificationTitle =
      data.action === 'ACCEPT'
        ? `Offer Accepted by ${candidateName}!`
        : `Offer Declined by ${candidateName}`;
    const notificationMessage =
      data.action === 'ACCEPT'
        ? `${candidateName} has formally accepted the employment offer for ${offer.application.job.title}.`
        : `${candidateName} declined the offer for ${offer.application.job.title}.${
            data.declinedReason ? ` Reason: "${data.declinedReason}"` : ''
          }`;

    const formattedStartDate = new Date(offer.startDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const recruiterName =
      offer.createdBy?.recruiterProfile?.title ||
      offer.createdBy?.email.split('@')[0] ||
      'Recruiter';
    const declineReason = data.declinedReason?.trim() || 'Candidate declined without specific feedback.';
    const portalUrl = `${config.FRONTEND_URL}/recruiter/pipeline`;

    await notificationService.createNotification(
      offer.createdById,
      notificationType,
      notificationTitle,
      notificationMessage,
      `/recruiter/pipeline`,
      {
        offerId: offer.id,
        applicationId: offer.applicationId,
        recruiter_name: recruiterName,
        candidate_name: candidateName,
        job_title: offer.application.job.title,
        company_name: offer.application.job.company.name,
        start_date: formattedStartDate,
        decline_reason: declineReason,
        portal_url: portalUrl,
      }
    );

    return this.mapToDto(updatedOffer, offer.application, candidateName);
  }

  /**
   * Mark candidate as hired & close requisition (FR-RC-25)
   */
  async markCandidateHired(
    applicationId: string,
    recruiterId: string,
    recruiterRole: string,
    data: HireCandidateInput
  ) {
    const { application, isCompanyRecruiter, isSuperAdmin } =
      await this.validateApplicationAccess(applicationId, recruiterId, recruiterRole);

    if (!isCompanyRecruiter && !isSuperAdmin) {
      throw new ForbiddenError('Only recruiters or administrators can finalize hiring.');
    }

    // 1. Update application status to HIRED
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.HIRED },
    });

    // 2. Record in pipeline history
    const hiredStage = await prisma.pipelineStage.findFirst({
      where: { jobId: application.jobId, name: 'HIRED' },
    });
    if (hiredStage) {
      await prisma.candidatePipeline.create({
        data: {
          applicationId,
          stageId: hiredStage.id,
          movedById: recruiterId,
          notes: data.notes || 'Candidate successfully hired.',
        },
      });
    }

    // 3. Close requisition if requested (set job to FILLED)
    let requisitionClosed = false;
    if (data.closeRequisition) {
      await prisma.jobVacancy.update({
        where: { id: application.jobId },
        data: { status: JobStatus.FILLED },
      });
      requisitionClosed = true;
    }

    const candidateName = `${application.applicant.firstName} ${application.applicant.lastName}`.trim();

    // Retrieve start date from accepted offer if available
    const existingOffer = await prisma.jobOffer.findUnique({
      where: { applicationId },
      select: { startDate: true },
    });
    const formattedStartDate = existingOffer?.startDate
      ? new Date(existingOffer.startDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'To be confirmed by hiring manager';
    const portalUrl = `${config.FRONTEND_URL}/applicant/dashboard`;

    // 4. Notify candidate referencing admin email template
    await notificationService.createNotification(
      application.applicant.userId,
      'CANDIDATE_HIRED',
      `Welcome to ${application.job.company.name}!`,
      `Congratulations ${candidateName}! Your hiring process for ${application.job.title} is now complete.`,
      `/applicant/dashboard`,
      {
        applicationId,
        candidate_name: candidateName,
        job_title: application.job.title,
        company_name: application.job.company.name,
        start_date: formattedStartDate,
        portal_url: portalUrl,
      }
    );

    return {
      success: true,
      applicationId: updatedApplication.id,
      status: updatedApplication.status,
      requisitionClosed,
      jobStatus: requisitionClosed ? 'FILLED' : application.job.status,
      message: `Candidate ${candidateName} has been marked as HIRED.${
        requisitionClosed ? ' Job vacancy has been closed as FILLED.' : ''
      }`,
    };
  }

  /**
   * Helper DTO mapper
   */
  private mapToDto(offer: any, application: any, candidateName: string): JobOfferDto {
    const creatorName = offer.createdBy?.recruiterProfile?.title
      ? `${offer.createdBy.recruiterProfile.title} (${offer.createdBy.email.split('@')[0]})`
      : offer.createdBy?.email.split('@')[0] || 'Recruiter';

    return {
      id: offer.id,
      applicationId: offer.applicationId,
      jobId: application.jobId,
      jobTitle: application.job.title,
      companyName: application.job.company.name,
      candidateId: application.applicantId,
      candidateName,
      candidateEmail: application.applicant.user?.email || '',
      createdById: offer.createdById,
      creatorName,
      baseSalary: Number(offer.baseSalary),
      currency: offer.currency,
      bonus: offer.bonus !== null ? Number(offer.bonus) : null,
      equity: offer.equity,
      startDate: offer.startDate.toISOString(),
      expirationDate: offer.expirationDate.toISOString(),
      offerLetterText: offer.offerLetterText,
      benefitsSummary: offer.benefitsSummary,
      notes: offer.notes,
      status: offer.status as OfferStatus,
      declinedReason: offer.declinedReason,
      sentAt: offer.sentAt ? offer.sentAt.toISOString() : null,
      respondedAt: offer.respondedAt ? offer.respondedAt.toISOString() : null,
      createdAt: offer.createdAt.toISOString(),
      updatedAt: offer.updatedAt.toISOString(),
    };
  }
}

export const offersService = new OffersService();
