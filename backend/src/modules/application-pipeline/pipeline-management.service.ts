import { prisma } from '../../db/client';
import { ApplicationStatus, ScoreBand } from '@prisma/client';
import {
  MoveCandidateStageDto,
  BulkMoveCandidateStageDto,
  CreateCandidateNoteDto,
  CandidateNoteDto,
  PipelineCandidateDto,
  CandidateComparisonResponseDto,
  CandidateComparisonItemDto,
} from '@recruitment-platform/shared';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '../../middleware/error.middleware';
import { notificationService } from '../notifications/notifications.service';

const STAGE_ORDER_MAP: Record<ApplicationStatus, number> = {
  APPLIED: 1,
  SCREENING: 2,
  SHORTLISTED: 3,
  INTERVIEW: 4,
  OFFER: 5,
  HIRED: 6,
  REJECTED: 7,
  WITHDRAWN: 8,
};

const STAGE_NAME_MAP: Record<ApplicationStatus, string> = {
  APPLIED: 'Applied',
  SCREENING: 'Screening',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

export class PipelineManagementService {
  /**
   * Helper: verify recruiter has company access to job or is super admin
   */
  private async verifyRecruiterJobAccess(jobId: string, userId: string, userRole: string) {
    const job = await prisma.jobVacancy.findUnique({
      where: { id: jobId },
      include: {
        company: true,
        jobRequiredSkills: { include: { skill: true } },
      },
    });

    if (!job) {
      throw new NotFoundError('Job vacancy not found.');
    }

    if (userRole !== 'SUPER_ADMIN') {
      const recruiterProfile = await prisma.recruiterProfile.findUnique({
        where: { userId },
      });
      if (!recruiterProfile || recruiterProfile.companyId !== job.companyId) {
        throw new ForbiddenError('You do not have permission to manage applications for this job.');
      }
    }

    return job;
  }

  /**
   * Helper: get or create PipelineStage for a job
   */
  private async getOrCreateStage(jobId: string, status: ApplicationStatus) {
    const stageName = STAGE_NAME_MAP[status] || status;
    const stageOrder = STAGE_ORDER_MAP[status] || 1;

    let stage = await prisma.pipelineStage.findFirst({
      where: {
        OR: [
          { jobId, name: stageName },
          { jobId: null, name: stageName, isSystemStage: true },
        ],
      },
    });

    if (!stage) {
      stage = await prisma.pipelineStage.create({
        data: {
          jobId,
          name: stageName,
          stageOrder,
          isSystemStage: false,
        },
      });
    }

    return stage;
  }

  /**
   * FR-RC-10: Get job applications with full filtering, sorting, notes & ATS scores
   */
  async getJobApplicationsWithFilters(
    jobId: string,
    userId: string,
    userRole: string,
    query: {
      search?: string;
      status?: string;
      scoreBand?: string;
      sortBy?: 'overallScore' | 'appliedAt' | 'fullName' | 'rating';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<PipelineCandidateDto[]> {
    const job = await this.verifyRecruiterJobAccess(jobId, userId, userRole);

    const mustHaveSkills = job.jobRequiredSkills
      .filter((s) => s.priority === 'MUST_HAVE')
      .map((s) => s.skill.name.toLowerCase());

    const applications = await prisma.application.findMany({
      where: { jobId },
      include: {
        applicant: {
          include: {
            user: { select: { id: true, email: true } },
            applicantSkills: { include: { skill: true } },
            workExperiences: true,
            educations: true,
          },
        },
        atsScore: true,
        cv: true,
        candidateNotes: {
          include: {
            author: {
              select: {
                id: true,
                email: true,
                recruiterProfile: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        jobOffer: true,
      },
    });

    const now = new Date();

    const candidates: PipelineCandidateDto[] = applications.map((app) => {
      const atsScoreRecord = app.atsScore;
      const effectiveScore = atsScoreRecord?.manualOverrideScore
        ? Number(atsScoreRecord.manualOverrideScore)
        : atsScoreRecord?.overallScore
        ? Number(atsScoreRecord.overallScore)
        : 0;

      // Calculate rating average
      const ratedNotes = app.candidateNotes.filter((n) => n.rating != null && n.rating > 0);
      const averageRating =
        ratedNotes.length > 0
          ? Math.round(
              (ratedNotes.reduce((sum, n) => sum + (n.rating || 0), 0) / ratedNotes.length) * 10
            ) / 10
          : null;

      const lastNote =
        app.candidateNotes.length > 0
          ? {
              authorName:
                app.candidateNotes[0].author.email.split('@')[0] || 'Recruiter',
              content: app.candidateNotes[0].content,
              createdAt: app.candidateNotes[0].createdAt.toISOString(),
            }
          : null;

      // Count matched must-have skills
      const candidateSkillNames = app.applicant.applicantSkills.map((s) =>
        s.skill.name.toLowerCase()
      );
      const matchedMustHaveCount = mustHaveSkills.filter((reqSkill) =>
        candidateSkillNames.some((cSkill) => cSkill.includes(reqSkill) || reqSkill.includes(cSkill))
      ).length;

      // Screening answers parser
      let screeningAnswers: any[] = [];
      if (app.screeningAnswersJson) {
        try {
          screeningAnswers =
            typeof app.screeningAnswersJson === 'string'
              ? JSON.parse(app.screeningAnswersJson)
              : (app.screeningAnswersJson as any);
        } catch {
          screeningAnswers = [];
        }
      }

      let topMatchingTerms: string[] = [];
      if (atsScoreRecord?.topMatchingTermsJson) {
        try {
          topMatchingTerms =
            typeof atsScoreRecord.topMatchingTermsJson === 'string'
              ? JSON.parse(atsScoreRecord.topMatchingTermsJson)
              : (atsScoreRecord.topMatchingTermsJson as any);
        } catch {
          topMatchingTerms = [];
        }
      }

      return {
        id: app.id,
        applicantId: app.applicant.id,
        jobId: job.id,
        jobTitle: job.title,
        fullName: `${app.applicant.firstName} ${app.applicant.lastName}`.trim() || 'Candidate',
        email: app.applicant.user.email,
        phone: app.applicant.phone || undefined,
        headline: app.applicant.headline || undefined,
        location: app.applicant.location || undefined,
        status: app.status,
        appliedAt: app.appliedAt.toISOString(),
        cvId: app.cvId || app.cv?.id || undefined,
        cvFileName: app.cv?.fileName || undefined,
        cvFileUrl: app.cv ? `/api/v1/applicant/resume/${app.cv.id}/download` : undefined,
        atsScore: atsScoreRecord
          ? {
              overallScore: effectiveScore,
              scoreBand: atsScoreRecord.scoreBand,
              skillsScore: Number(atsScoreRecord.skillsScore || 0),
              experienceScore: Number(atsScoreRecord.experienceScore || 0),
              educationScore: Number(atsScoreRecord.educationScore || 0),
              semanticTfidfScore: Number(atsScoreRecord.semanticTfidfScore || 0),
              certificationScore: Number(atsScoreRecord.certificationScore || 0),
              manualOverrideScore: atsScoreRecord.manualOverrideScore
                ? Number(atsScoreRecord.manualOverrideScore)
                : null,
              overrideReason: atsScoreRecord.overrideReason || null,
              topMatchingTerms,
            }
          : null,
        averageRating,
        notesCount: app.candidateNotes.length,
        lastNote,
        screeningAnswers,
        mustHaveSkillsCount: mustHaveSkills.length,
        matchedMustHaveSkillsCount: matchedMustHaveCount,
        jobOffer: app.jobOffer
          ? {
              id: app.jobOffer.id,
              applicationId: app.jobOffer.applicationId,
              jobId: job.id,
              jobTitle: job.title,
              companyId: job.companyId,
              companyName: '',
              candidateId: app.applicant.id,
              candidateName: `${app.applicant.firstName} ${app.applicant.lastName}`.trim(),
              candidateEmail: app.applicant.user.email,
              createdById: app.jobOffer.createdById,
              baseSalary: Number(app.jobOffer.baseSalary),
              currency: app.jobOffer.currency,
              bonus: app.jobOffer.bonus ? Number(app.jobOffer.bonus) : null,
              equity: app.jobOffer.equity,
              startDate: app.jobOffer.startDate.toISOString(),
              expirationDate: app.jobOffer.expirationDate.toISOString(),
              offerLetterText: app.jobOffer.offerLetterText,
              benefitsSummary: app.jobOffer.benefitsSummary,
              notes: app.jobOffer.notes,
              status: (app.jobOffer.status === 'SENT' && now > new Date(app.jobOffer.expirationDate)
                ? 'EXPIRED'
                : app.jobOffer.status) as any,
              declinedReason: app.jobOffer.declinedReason,
              sentAt: app.jobOffer.sentAt ? app.jobOffer.sentAt.toISOString() : null,
              respondedAt: app.jobOffer.respondedAt ? app.jobOffer.respondedAt.toISOString() : null,
              createdAt: app.jobOffer.createdAt.toISOString(),
              updatedAt: app.jobOffer.updatedAt.toISOString(),
            }
          : null,
      };
    });

    // Apply filtering
    let filtered = candidates;

    if (query.search) {
      const s = query.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.fullName.toLowerCase().includes(s) ||
          c.email.toLowerCase().includes(s) ||
          (c.headline && c.headline.toLowerCase().includes(s)) ||
          (c.location && c.location.toLowerCase().includes(s))
      );
    }

    if (query.status) {
      const statuses = query.status.split(',').map((st) => st.trim());
      filtered = filtered.filter((c) => statuses.includes(c.status));
    }

    if (query.scoreBand) {
      filtered = filtered.filter((c) => c.atsScore?.scoreBand === query.scoreBand);
    }

    // Apply sorting
    const sortBy = query.sortBy || 'appliedAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    filtered.sort((a, b) => {
      if (sortBy === 'overallScore') {
        const scoreA = a.atsScore?.overallScore ?? -1;
        const scoreB = b.atsScore?.overallScore ?? -1;
        return (scoreA - scoreB) * sortOrder;
      }
      if (sortBy === 'fullName') {
        return a.fullName.localeCompare(b.fullName) * sortOrder;
      }
      if (sortBy === 'rating') {
        const ratingA = a.averageRating ?? -1;
        const ratingB = b.averageRating ?? -1;
        return (ratingA - ratingB) * sortOrder;
      }
      // default: appliedAt
      return (new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime()) * sortOrder;
    });

    return filtered;
  }

  /**
   * FR-RC-12: Interactive Kanban Stage Movement with Audit Trail
   */
  async moveCandidateStage(
    applicationId: string,
    userId: string,
    userRole: string,
    dto: MoveCandidateStageDto
  ) {
    if (!dto.stage || !Object.values(ApplicationStatus).includes(dto.stage)) {
      throw new BadRequestError(`Invalid application status: ${dto.stage}`);
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true, applicant: true },
    });

    if (!application) {
      throw new NotFoundError('Application not found.');
    }

    await this.verifyRecruiterJobAccess(application.jobId, userId, userRole);

    const targetStage = await this.getOrCreateStage(application.jobId, dto.stage);

    // Run stage update and audit logging transaction
    const [updatedApplication, pipelineEntry] = await prisma.$transaction([
      prisma.application.update({
        where: { id: applicationId },
        data: { status: dto.stage },
      }),
      prisma.candidatePipeline.create({
        data: {
          applicationId,
          stageId: targetStage.id,
          notes: dto.notes || `Moved candidate to ${targetStage.name}`,
          movedById: userId,
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: userId,
          action: 'APPLICATION_STAGE_CHANGED',
          targetType: 'APPLICATION',
          targetId: applicationId,
          detailsJson: {
            fromStage: application.status,
            toStage: dto.stage,
            stageName: targetStage.name,
            notes: dto.notes,
          },
        },
      }),
    ]);

    // Notify candidate of status change (FR-AP-27)
    try {
      await notificationService.createNotification(
        application.applicant.userId,
        'APPLICATION_STATUS_CHANGED',
        `Application Status Update: ${targetStage.name}`,
        `Your application for ${application.job.title} has progressed to ${targetStage.name}.`,
        `/applicant/dashboard`,
        { applicationId, fromStage: application.status, toStage: dto.stage }
      );
    } catch (err) {
      console.error('Failed to create status notification:', err);
    }

    return {
      success: true,
      applicationId: updatedApplication.id,
      status: updatedApplication.status,
      stageName: targetStage.name,
      movedAt: pipelineEntry.movedAt.toISOString(),
      notes: pipelineEntry.notes,
    };
  }

  /**
   * FR-RC-14: Bulk Stage Movement
   */
  async bulkMoveCandidateStage(
    userId: string,
    userRole: string,
    dto: BulkMoveCandidateStageDto
  ) {
    if (!dto.stage || !Object.values(ApplicationStatus).includes(dto.stage)) {
      throw new BadRequestError(`Invalid application status: ${dto.stage}`);
    }

    if (!dto.applicationIds || dto.applicationIds.length === 0) {
      throw new BadRequestError('At least one applicationId must be provided.');
    }

    // Verify applications exist and recruiter has access
    const applications = await prisma.application.findMany({
      where: { id: { in: dto.applicationIds } },
      include: { job: true, applicant: true },
    });

    if (applications.length === 0) {
      throw new NotFoundError('No valid applications found.');
    }

    // Check recruiter access for all jobs involved
    const jobIds = Array.from(new Set(applications.map((a) => a.jobId)));
    for (const jId of jobIds) {
      await this.verifyRecruiterJobAccess(jId, userId, userRole);
    }

    // Resolve or create stages for each job
    const jobStageMap = new Map<string, string>();
    for (const jId of jobIds) {
      const stage = await this.getOrCreateStage(jId, dto.stage);
      jobStageMap.set(jId, stage.id);
    }

    const validAppIds = applications.map((a) => a.id);

    // Update in transaction
    await prisma.$transaction(async (tx) => {
      // Bulk update application status
      await tx.application.updateMany({
        where: { id: { in: validAppIds } },
        data: { status: dto.stage },
      });

      // Create pipeline entry for each
      for (const app of applications) {
        const stageId = jobStageMap.get(app.jobId)!;
        await tx.candidatePipeline.create({
          data: {
            applicationId: app.id,
            stageId,
            notes: dto.notes || `Bulk moved to ${dto.stage}`,
            movedById: userId,
          },
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          actorId: userId,
          action: 'BULK_STAGE_CHANGED',
          targetType: 'APPLICATION',
          targetId: validAppIds.join(','),
          detailsJson: {
            applicationCount: validAppIds.length,
            toStage: dto.stage,
            notes: dto.notes,
          },
        },
      });
    });

    for (const app of applications) {
      try {
        await notificationService.createNotification(
          app.applicant.userId,
          'APPLICATION_STATUS_CHANGED',
          `Application Status Update: ${dto.stage}`,
          `Your application for ${app.job.title} has progressed to ${dto.stage}.`,
          `/applicant/dashboard`,
          { applicationId: app.id, toStage: dto.stage }
        );
      } catch (err) {
        console.error('Failed to create bulk status notification:', err);
      }
    }

    return {
      success: true,
      updatedCount: validAppIds.length,
      stage: dto.stage,
      message: `Successfully moved ${validAppIds.length} candidate(s) to ${dto.stage}.`,
    };
  }

  /**
   * FR-RC-15: Add Candidate Note & Star Rating
   */
  async addCandidateNote(
    applicationId: string,
    userId: string,
    userRole: string,
    dto: CreateCandidateNoteDto
  ): Promise<CandidateNoteDto> {
    if (!dto.content || dto.content.trim() === '') {
      throw new BadRequestError('Note content cannot be empty.');
    }

    if (dto.rating !== undefined && (dto.rating < 1 || dto.rating > 5 || !Number.isInteger(dto.rating))) {
      throw new BadRequestError('Rating must be an integer between 1 and 5.');
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });

    if (!application) {
      throw new NotFoundError('Application not found.');
    }

    await this.verifyRecruiterJobAccess(application.jobId, userId, userRole);

    const note = await prisma.candidateNote.create({
      data: {
        applicationId,
        authorId: userId,
        content: dto.content.trim(),
        rating: dto.rating || null,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            recruiterProfile: true,
          },
        },
      },
    });

    return {
      id: note.id,
      applicationId: note.applicationId,
      authorId: note.authorId,
      authorName: note.author.email.split('@')[0] || 'Recruiter',
      authorEmail: note.author.email,
      content: note.content,
      rating: note.rating,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    };
  }

  /**
   * FR-RC-15: Get All Candidate Notes for an Application
   */
  async getCandidateNotes(
    applicationId: string,
    userId: string,
    userRole: string
  ): Promise<CandidateNoteDto[]> {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });

    if (!application) {
      throw new NotFoundError('Application not found.');
    }

    await this.verifyRecruiterJobAccess(application.jobId, userId, userRole);

    const notes = await prisma.candidateNote.findMany({
      where: { applicationId },
      include: {
        author: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return notes.map((n) => ({
      id: n.id,
      applicationId: n.applicationId,
      authorId: n.authorId,
      authorName: n.author.email.split('@')[0] || 'Recruiter',
      authorEmail: n.author.email,
      content: n.content,
      rating: n.rating,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    }));
  }

  /**
   * FR-RC-15: Delete Candidate Note
   */
  async deleteCandidateNote(
    noteId: string,
    userId: string,
    userRole: string
  ): Promise<{ success: boolean; message: string }> {
    const note = await prisma.candidateNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundError('Note not found.');
    }

    if (userRole !== 'SUPER_ADMIN' && note.authorId !== userId) {
      throw new ForbiddenError('You can only delete notes you created.');
    }

    await prisma.candidateNote.delete({
      where: { id: noteId },
    });

    return { success: true, message: 'Candidate note deleted successfully.' };
  }

  /**
   * FR-RC-16: Side-by-Side Candidate Comparison Matrix (2 to 4 candidates)
   */
  async compareCandidates(
    applicationIds: string[],
    userId: string,
    userRole: string
  ): Promise<CandidateComparisonResponseDto> {
    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length < 2 || applicationIds.length > 4) {
      throw new BadRequestError('Side-by-side comparison requires between 2 and 4 candidate applications.');
    }

    const applications = await prisma.application.findMany({
      where: { id: { in: applicationIds } },
      include: {
        job: {
          include: {
            jobRequiredSkills: { include: { skill: true } },
          },
        },
        applicant: {
          include: {
            user: { select: { id: true, email: true } },
            applicantSkills: { include: { skill: true } },
            workExperiences: true,
            educations: true,
          },
        },
        atsScore: true,
        candidateNotes: true,
      },
    });

    if (applications.length < 2) {
      throw new NotFoundError('Could not find enough valid applications for comparison.');
    }

    // Verify all applications belong to the same job (or recruiter's authorized jobs)
    const primaryJob = applications[0].job;
    for (const app of applications) {
      await this.verifyRecruiterJobAccess(app.jobId, userId, userRole);
    }

    const requiredSkills = primaryJob.jobRequiredSkills;

    const candidateItems: CandidateComparisonItemDto[] = applications.map((app) => {
      const ats = app.atsScore;
      const effectiveScore = ats?.manualOverrideScore
        ? Number(ats.manualOverrideScore)
        : ats?.overallScore
        ? Number(ats.overallScore)
        : 0;

      // Map skills with matched status
      const candidateSkillNames = app.applicant.applicantSkills.map((s) =>
        s.skill.name.toLowerCase()
      );

      const skillsComparison = requiredSkills.map((req) => {
        const isMatched = candidateSkillNames.some(
          (cName) => cName.includes(req.skill.name.toLowerCase()) || req.skill.name.toLowerCase().includes(cName)
        );
        return {
          name: req.skill.name,
          isMatched,
          priority: req.priority,
        };
      });

      // Calculate total experience in years
      let totalExperienceYears = 0;
      for (const exp of app.applicant.workExperiences) {
        const start = exp.startDate ? new Date(exp.startDate).getTime() : 0;
        const end = exp.endDate ? new Date(exp.endDate).getTime() : Date.now();
        if (start > 0 && end > start) {
          totalExperienceYears += (end - start) / (1000 * 60 * 60 * 24 * 365.25);
        }
      }

      // Format education summary
      const highestEdu = app.applicant.educations[0];
      const educationSummary = highestEdu
        ? `${highestEdu.degree}${highestEdu.fieldOfStudy ? ` in ${highestEdu.fieldOfStudy}` : ''} (${highestEdu.institution})`
        : 'Not specified';

      // Team ratings
      const ratedNotes = app.candidateNotes.filter((n) => n.rating != null && n.rating > 0);
      const averageRating =
        ratedNotes.length > 0
          ? Math.round(
              (ratedNotes.reduce((sum, n) => sum + (n.rating || 0), 0) / ratedNotes.length) * 10
            ) / 10
          : null;

      return {
        applicationId: app.id,
        candidateName: `${app.applicant.firstName} ${app.applicant.lastName}`.trim() || 'Candidate',
        candidateEmail: app.applicant.user.email,
        headline: app.applicant.headline || undefined,
        currentStage: app.status,
        appliedAt: app.appliedAt.toISOString(),
        overallScore: effectiveScore,
        manualOverrideScore: ats?.manualOverrideScore ? Number(ats.manualOverrideScore) : null,
        scoreBand: ats?.scoreBand || ScoreBand.MID,
        subScores: ats
          ? {
              skillsScore: Number(ats.skillsScore || 0),
              experienceScore: Number(ats.experienceScore || 0),
              educationScore: Number(ats.educationScore || 0),
              semanticTfidfScore: Number(ats.semanticTfidfScore || 0),
              certificationScore: Number(ats.certificationScore || 0),
            }
          : undefined,
        skills: skillsComparison,
        yearsOfExperience: Math.round(totalExperienceYears * 10) / 10,
        educationSummary,
        averageTeamRating: averageRating,
        notesCount: app.candidateNotes.length,
      };
    });

    return {
      jobId: primaryJob.id,
      jobTitle: primaryJob.title,
      candidates: candidateItems,
    };
  }
}

export const pipelineManagementService = new PipelineManagementService();
