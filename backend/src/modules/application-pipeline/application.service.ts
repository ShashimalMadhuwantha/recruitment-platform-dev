import { PrismaClient, ApplicationStatus, Prisma } from '@prisma/client';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '../../middleware/error.middleware';
import { AtsScoringService } from '../ats-scoring/ats-scoring.service';
import type {
  SubmitApplicationDto,
  ApplicantApplicationListItem,
  ScreeningQuestion,
} from '@recruitment-platform/shared';

const prisma = new PrismaClient();

export class ApplicationService {
  /**
   * Submit an application for a published job vacancy (FR-AP-19, FR-AP-20)
   */
  async submitApplication(dto: SubmitApplicationDto, userId: string) {
    if (!dto.jobId) {
      throw new BadRequestError('Job vacancy ID is required.');
    }

    // 1. Resolve applicant profile
    const applicant = await prisma.applicantProfile.findUnique({
      where: { userId },
      include: {
        cvs: true,
      },
    });

    if (!applicant) {
      throw new BadRequestError('Applicant profile must be created before applying for jobs.');
    }

    // 2. Validate job vacancy
    const job = await prisma.jobVacancy.findUnique({
      where: { id: dto.jobId },
      include: {
        company: true,
        pipelineStages: {
          orderBy: { stageOrder: 'asc' },
        },
      },
    });

    if (!job) {
      throw new NotFoundError('Job vacancy not found.');
    }

    if (job.status !== 'PUBLISHED') {
      throw new BadRequestError('This job vacancy is not currently accepting applications.');
    }

    if (job.deadline && new Date(job.deadline) < new Date()) {
      throw new BadRequestError('The application deadline for this job vacancy has expired.');
    }

    // 3. Prevent duplicate applications
    const existingApplication = await prisma.application.findUnique({
      where: {
        applicantId_jobId: {
          applicantId: applicant.id,
          jobId: dto.jobId,
        },
      },
    });

    if (existingApplication) {
      throw new BadRequestError('You have already submitted an application for this job vacancy.');
    }

    // 4. Resolve attached CV
    let selectedCvId: string | null = null;
    if (dto.cvId) {
      const foundCv = applicant.cvs.find((c) => c.id === dto.cvId);
      if (!foundCv) {
        throw new BadRequestError('The selected CV does not belong to your applicant profile.');
      }
      selectedCvId = foundCv.id;
    } else {
      const primaryCv = applicant.cvs.find((c) => c.isPrimary) || applicant.cvs[0];
      if (primaryCv) {
        selectedCvId = primaryCv.id;
      }
    }

    // 5. Evaluate Screening Questions & Knockout Criteria (FR-AP-19)
    let initialStatus: ApplicationStatus = ApplicationStatus.APPLIED;
    let knockoutFailed = false;
    let knockoutReason = '';

    const questions = (job.screeningQuestionsJson as unknown as ScreeningQuestion[]) || [];
    if (dto.screeningAnswers && dto.screeningAnswers.length > 0) {
      for (const q of questions) {
        if (q.isKnockout && q.requiredAnswer !== undefined && q.requiredAnswer !== null) {
          const submitted = dto.screeningAnswers.find(
            (a) => a.questionId === q.id || a.question.trim().toLowerCase() === q.question.trim().toLowerCase()
          );

          if (submitted) {
            const reqNormalized = String(q.requiredAnswer).trim().toLowerCase();
            const ansNormalized = String(submitted.answer).trim().toLowerCase();

            if (reqNormalized !== ansNormalized) {
              knockoutFailed = true;
              knockoutReason = `Knockout requirement not met for: "${q.question}". Expected "${q.requiredAnswer}", received "${submitted.answer}".`;
              initialStatus = ApplicationStatus.REJECTED;
              break;
            }
          } else {
            // Missing required knockout question answer
            knockoutFailed = true;
            knockoutReason = `Required screening question was not answered: "${q.question}".`;
            initialStatus = ApplicationStatus.REJECTED;
            break;
          }
        }
      }
    }

    // 6. Resolve initial pipeline stage
    let initialStageId: string | null = null;
    if (job.pipelineStages && job.pipelineStages.length > 0) {
      const appliedStage = job.pipelineStages.find(
        (s) => s.name.toLowerCase() === 'applied'
      );
      initialStageId = appliedStage ? appliedStage.id : job.pipelineStages[0].id;
    } else {
      // Find or create default system stage for this job
      const systemStage = await prisma.pipelineStage.findFirst({
        where: {
          OR: [{ jobId: job.id }, { isSystemStage: true }],
        },
        orderBy: { stageOrder: 'asc' },
      });
      if (systemStage) {
        initialStageId = systemStage.id;
      }
    }

    // 7. Atomic application creation
    const application = await prisma.$transaction(async (tx) => {
      const app = await tx.application.create({
        data: {
          applicantId: applicant.id,
          jobId: job.id,
          cvId: selectedCvId,
          status: initialStatus,
          coverLetter: dto.coverLetter || null,
          screeningAnswersJson: dto.screeningAnswers
            ? (dto.screeningAnswers as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
        include: {
          job: {
            include: { company: true },
          },
          cv: true,
        },
      });

      if (initialStageId) {
        await tx.candidatePipeline.create({
          data: {
            applicationId: app.id,
            stageId: initialStageId,
            notes: knockoutFailed
              ? `Application automatically routed to Rejected due to knockout criteria: ${knockoutReason}`
              : 'Application submitted by candidate.',
          },
        });
      }

      return app;
    });

    // 8. Trigger ATS scoring engine to compute and persist score
    try {
      await AtsScoringService.scoreApplication(application.id);
    } catch (err) {
      console.error(`[AtsScoring] Score computation failed for application ${application.id}:`, err);
    }

    // Retrieve computed score
    const savedScore = await prisma.aTSScore.findUnique({
      where: { applicationId: application.id },
    });

    return {
      applicationId: application.id,
      jobTitle: job.title,
      companyName: job.company.name,
      status: application.status,
      knockoutFailed,
      overallScore: savedScore ? Number(savedScore.overallScore) : null,
      scoreBand: savedScore ? savedScore.scoreBand : null,
      message: knockoutFailed
        ? 'Application submitted, but did not meet one or more prerequisite knockout criteria.'
        : 'Application submitted successfully.',
    };
  }

  /**
   * Retrieve all applications submitted by the authenticated applicant
   */
  async getMyApplications(userId: string): Promise<ApplicantApplicationListItem[]> {
    const applicant = await prisma.applicantProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!applicant) {
      return [];
    }

    const applications = await prisma.application.findMany({
      where: { applicantId: applicant.id },
      orderBy: { appliedAt: 'desc' },
      include: {
        job: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              },
            },
          },
        },
        cv: {
          select: {
            fileName: true,
          },
        },
        atsScore: {
          select: {
            overallScore: true,
            scoreBand: true,
            manualOverrideScore: true,
          },
        },
      },
    });

    return applications.map((app) => {
      const effectiveScore = app.atsScore?.manualOverrideScore
        ? Number(app.atsScore.manualOverrideScore)
        : app.atsScore?.overallScore
        ? Number(app.atsScore.overallScore)
        : null;

      const terminalStatuses = [
        ApplicationStatus.HIRED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.WITHDRAWN,
      ];

      return {
        id: app.id,
        jobId: app.job.id,
        jobTitle: app.job.title,
        companyName: app.job.company.name,
        companyLogoUrl: app.job.company.logoUrl,
        location: app.job.location,
        employmentType: app.job.employmentType,
        status: app.status,
        appliedAt: app.appliedAt.toISOString(),
        withdrawnAt: app.withdrawnAt ? app.withdrawnAt.toISOString() : null,
        cvFileName: app.cv?.fileName || null,
        overallScore: effectiveScore,
        scoreBand: app.atsScore?.scoreBand || null,
        canWithdraw: !terminalStatuses.includes(app.status),
      };
    });
  }

  /**
   * Get single application details with status timeline, screening answers, and score
   */
  async getApplicationById(applicationId: string, userId: string, userRole: string) {
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
            company: true,
            jobRequiredSkills: { include: { skill: true } },
          },
        },
        cv: true,
        atsScore: true,
        candidatePipelines: {
          include: { stage: true },
          orderBy: { movedAt: 'asc' },
        },
      },
    });

    if (!application) {
      throw new NotFoundError('Application not found.');
    }

    // Role check: Only applicant owner, recruiter of the company, or super admin can view
    if (
      userRole !== 'SUPER_ADMIN' &&
      userRole !== 'RECRUITER' &&
      application.applicant.userId !== userId
    ) {
      throw new ForbiddenError('You do not have permission to view this application.');
    }

    return application;
  }

  /**
   * Withdraw an active application (FR-AP-20)
   */
  async withdrawApplication(applicationId: string, userId: string, reason?: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        applicant: true,
      },
    });

    if (!application) {
      throw new NotFoundError('Application not found.');
    }

    if (application.applicant.userId !== userId) {
      throw new ForbiddenError('You can only withdraw your own applications.');
    }

    const terminalStatuses = [
      ApplicationStatus.HIRED,
      ApplicationStatus.REJECTED,
      ApplicationStatus.WITHDRAWN,
    ];

    if (terminalStatuses.includes(application.status)) {
      throw new BadRequestError(
        `Application cannot be withdrawn as it is already marked as ${application.status.toLowerCase()}.`
      );
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatus.WITHDRAWN,
        withdrawnAt: new Date(),
      },
    });

    // Add note to candidate pipeline
    const latestPipeline = await prisma.candidatePipeline.findFirst({
      where: { applicationId },
      orderBy: { movedAt: 'desc' },
    });

    if (latestPipeline) {
      await prisma.candidatePipeline.create({
        data: {
          applicationId,
          stageId: latestPipeline.stageId,
          notes: `Candidate withdrew application.${reason ? ` Reason: ${reason}` : ''}`,
        },
      });
    }

    return {
      success: true,
      applicationId: updated.id,
      status: updated.status,
      withdrawnAt: updated.withdrawnAt?.toISOString(),
      message: 'Application has been successfully withdrawn.',
    };
  }
}

export default new ApplicationService();
