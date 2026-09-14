import { PrismaClient, UserRole } from '@prisma/client';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../middleware/error.middleware';
import { notificationService } from '../notifications/notifications.service';
import type {
  SendMessageInput,
  CreateInterviewInput,
  UpdateInterviewStatusInput,
  SubmitFeedbackInput,
} from './communication.types';
import type {
  ApplicationMessageDto,
  InterviewScheduleDto,
  InterviewFeedbackDto,
} from '@recruitment-platform/shared';
import crypto from 'crypto';

const prisma = new PrismaClient();

function formatUserName(user: {
  email: string;
  applicantProfile?: { firstName: string; lastName: string } | null;
  recruiterProfile?: { title?: string | null; department?: string | null } | null;
}): string {
  if (user.applicantProfile) {
    return `${user.applicantProfile.firstName} ${user.applicantProfile.lastName}`.trim();
  }
  if (user.recruiterProfile?.title) {
    return `${user.recruiterProfile.title} (${user.email.split('@')[0]})`;
  }
  return user.email.split('@')[0] || user.email;
}

function formatInterviewerName(user: {
  email: string;
  recruiterProfile?: { title?: string | null; department?: string | null } | null;
}): string {
  if (user.recruiterProfile?.title) {
    return `${user.recruiterProfile.title} (${user.email.split('@')[0]})`;
  }
  return user.email.split('@')[0] || user.email;
}

export class CommunicationService {
  /**
   * Helper: Validate application access and resolve candidate & recruiter parties
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
      });
      if (recruiterProfile?.companyId === application.job.companyId) {
        isCompanyRecruiter = true;
      }
    }

    const isSuperAdmin = userRole === 'SUPER_ADMIN';

    if (!isApplicant && !isCompanyRecruiter && !isSuperAdmin) {
      throw new ForbiddenError('You do not have access to this application conversation.');
    }

    return {
      application,
      isApplicant,
      isCompanyRecruiter,
      isSuperAdmin,
    };
  }

  /**
   * Send an in-app message within an application conversation
   */
  async sendMessage(
    applicationId: string,
    senderId: string,
    senderRole: string,
    data: SendMessageInput
  ): Promise<ApplicationMessageDto> {
    const { application, isApplicant } = await this.validateApplicationAccess(
      applicationId,
      senderId,
      senderRole
    );

    let receiverId: string;

    if (isApplicant) {
      // Message from applicant to recruiter: find company recruiter or job creator
      const jobCreator = await prisma.jobVacancy.findUnique({
        where: { id: application.jobId },
        select: { createdById: true },
      });
      if (jobCreator?.createdById) {
        receiverId = jobCreator.createdById;
      } else {
        // Fallback to first recruiter in company
        const firstRecruiter = await prisma.recruiterProfile.findFirst({
          where: { companyId: application.job.companyId },
          select: { userId: true },
        });
        if (!firstRecruiter) {
          throw new BadRequestError('No hiring team representative found for this job.');
        }
        receiverId = firstRecruiter.userId;
      }
    } else {
      // Message from recruiter/admin to applicant
      receiverId = application.applicant.userId;
    }

    const message = await prisma.applicationMessage.create({
      data: {
        applicationId,
        senderId,
        receiverId,
        body: data.body.trim(),
        isRead: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
            applicantProfile: { select: { firstName: true, lastName: true } },
            recruiterProfile: { select: { title: true, department: true } },
          },
        },
      },
    });

    const senderName = formatUserName(message.sender);

    // Trigger in-app notification to receiver
    const notificationLink = isApplicant
      ? `/recruiter/pipeline`
      : `/applicant/dashboard`;

    await notificationService.createNotification(
      receiverId,
      'NEW_MESSAGE',
      `New Message from ${senderName}`,
      `"${data.body.trim().slice(0, 100)}${data.body.length > 100 ? '...' : ''}" for ${application.job.title}`,
      notificationLink,
      { applicationId, messageId: message.id }
    );

    return {
      id: message.id,
      applicationId: message.applicationId,
      senderId: message.senderId,
      senderName,
      senderRole: message.sender.role as UserRole,
      receiverId: message.receiverId,
      body: message.body,
      isRead: message.isRead,
      readAt: message.readAt?.toISOString() || null,
      createdAt: message.createdAt.toISOString(),
    };
  }

  /**
   * Get chronological message thread and mark received messages as read
   */
  async getMessages(
    applicationId: string,
    userId: string,
    userRole: string
  ): Promise<ApplicationMessageDto[]> {
    await this.validateApplicationAccess(applicationId, userId, userRole);

    // Mark unread messages directed to this user as read
    await prisma.applicationMessage.updateMany({
      where: {
        applicationId,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    const messages = await prisma.applicationMessage.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
            applicantProfile: { select: { firstName: true, lastName: true } },
            recruiterProfile: { select: { title: true, department: true } },
          },
        },
      },
    });

    return messages.map((m) => {
      const senderName = formatUserName(m.sender);

      return {
        id: m.id,
        applicationId: m.applicationId,
        senderId: m.senderId,
        senderName,
        senderRole: m.sender.role as UserRole,
        receiverId: m.receiverId,
        body: m.body,
        isRead: m.isRead,
        readAt: m.readAt ? m.readAt.toISOString() : null,
        createdAt: m.createdAt.toISOString(),
      };
    });
  }

  /**
   * Schedule an interview for a candidate
   */
  async scheduleInterview(
    applicationId: string,
    recruiterId: string,
    recruiterRole: string,
    data: CreateInterviewInput
  ): Promise<InterviewScheduleDto> {
    const { application, isApplicant } = await this.validateApplicationAccess(
      applicationId,
      recruiterId,
      recruiterRole
    );

    if (isApplicant) {
      throw new ForbiddenError('Only recruiters or administrators can schedule interviews.');
    }

    // Auto-generate video meeting link if format is VIDEO and none was specified
    let finalVideoLink = data.videoLink?.trim() || null;
    if (data.interviewType === 'VIDEO' && !finalVideoLink) {
      const meetingCode = crypto.randomBytes(6).toString('hex');
      finalVideoLink = `https://meet.jit.si/ats-interview-${meetingCode}`;
    }

    const scheduledDate = new Date(data.scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      throw new BadRequestError('Invalid scheduled date/time provided.');
    }

    const interview = await prisma.interviewSchedule.create({
      data: {
        applicationId,
        interviewerId: recruiterId,
        title: data.title?.trim() || 'Interview',
        interviewType: data.interviewType || 'VIDEO',
        scheduledAt: scheduledDate,
        durationMins: data.durationMins || 45,
        timezone: data.timezone || 'UTC',
        videoLink: finalVideoLink,
        location: data.location?.trim() || null,
        status: 'SCHEDULED',
        notes: data.notes?.trim() || null,
      },
      include: {
        interviewer: {
          select: {
            id: true,
            email: true,
            recruiterProfile: { select: { title: true, department: true } },
          },
        },
      },
    });

    // Update application stage to INTERVIEW if currently in earlier stage
    if (
      application.status === 'APPLIED' ||
      application.status === 'SCREENING' ||
      application.status === 'SHORTLISTED'
    ) {
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: 'INTERVIEW' },
      });

      // Find or create pipeline stage for INTERVIEW
      const interviewStage = await prisma.pipelineStage.findFirst({
        where: { jobId: application.jobId, name: 'INTERVIEW' },
      });
      if (interviewStage) {
        await prisma.candidatePipeline.create({
          data: {
            applicationId,
            stageId: interviewStage.id,
            movedById: recruiterId,
            notes: `Interview scheduled for ${scheduledDate.toLocaleDateString()}`,
          },
        });
      }
    }

    const candidateName = `${application.applicant.firstName} ${application.applicant.lastName}`.trim();
    const interviewerName = formatInterviewerName(interview.interviewer);
    const formattedInterviewTime = `${scheduledDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })} at ${scheduledDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })} (${interview.timezone || 'UTC'})`;
    const meetingLink = interview.videoLink || interview.location || 'See candidate portal for meeting details';

    // Send notifications to candidate & interviewer with dynamic template variables
    await notificationService.createNotification(
      application.applicant.userId,
      'INTERVIEW_SCHEDULED',
      `Interview Scheduled: ${interview.title}`,
      `Your interview for ${application.job.title} has been scheduled for ${formattedInterviewTime} (${interview.durationMins} mins).`,
      `/applicant/dashboard`,
      {
        interviewId: interview.id,
        applicationId,
        candidate_name: candidateName,
        job_title: application.job.title,
        company_name: application.job.company.name,
        interview_time: formattedInterviewTime,
        interview_type: interview.interviewType,
        meeting_link: meetingLink,
        recruiter_name: interviewerName,
      }
    );

    return {
      id: interview.id,
      applicationId: interview.applicationId,
      candidateName,
      jobTitle: application.job.title,
      interviewerId: interview.interviewerId,
      interviewerName,
      title: interview.title,
      interviewType: interview.interviewType as any,
      scheduledAt: interview.scheduledAt.toISOString(),
      durationMins: interview.durationMins,
      timezone: interview.timezone,
      videoLink: interview.videoLink,
      location: interview.location,
      status: interview.status as any,
      notes: interview.notes,
      hasFeedback: false,
      createdAt: interview.createdAt.toISOString(),
      updatedAt: interview.updatedAt.toISOString(),
      feedbacks: [],
    };
  }

  /**
   * Get interviews for an application
   */
  async getApplicationInterviews(
    applicationId: string,
    userId: string,
    userRole: string
  ): Promise<InterviewScheduleDto[]> {
    const { application } = await this.validateApplicationAccess(applicationId, userId, userRole);

    const interviews = await prisma.interviewSchedule.findMany({
      where: { applicationId },
      orderBy: { scheduledAt: 'desc' },
      include: {
        interviewer: {
          select: {
            id: true,
            email: true,
            recruiterProfile: { select: { title: true, department: true } },
          },
        },
        interviewFeedbacks: {
          include: {
            interviewer: {
              select: {
                id: true,
                email: true,
                recruiterProfile: { select: { title: true, department: true } },
              },
            },
          },
        },
      },
    });

    const candidateName = `${application.applicant.firstName} ${application.applicant.lastName}`;

    return interviews.map((item) => {
      const interviewerName = formatInterviewerName(item.interviewer);

      return {
        id: item.id,
        applicationId: item.applicationId,
        candidateName,
        jobTitle: application.job.title,
        interviewerId: item.interviewerId,
        interviewerName,
        title: item.title,
        interviewType: item.interviewType as any,
        scheduledAt: item.scheduledAt.toISOString(),
        durationMins: item.durationMins,
        timezone: item.timezone,
        videoLink: item.videoLink,
        location: item.location,
        status: item.status as any,
        notes: item.notes,
        hasFeedback: item.interviewFeedbacks.length > 0,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        feedbacks:
          userRole === 'APPLICANT'
            ? [] // Feedbacks are confidential to recruiters
            : item.interviewFeedbacks.map((f) => ({
                id: f.id,
                interviewId: f.interviewId,
                interviewerId: f.interviewerId,
                interviewerName: formatInterviewerName(f.interviewer),
                scorecardJson: f.scorecardJson as any,
                recommendation: f.recommendation as any,
                notes: f.notes,
                submittedAt: f.submittedAt.toISOString(),
                updatedAt: f.updatedAt.toISOString(),
              })),
      };
    });
  }

  /**
   * Update interview status (e.g. CANCELLED, COMPLETED)
   */
  async updateInterviewStatus(
    interviewId: string,
    userId: string,
    userRole: string,
    data: UpdateInterviewStatusInput
  ): Promise<InterviewScheduleDto> {
    const existing = await prisma.interviewSchedule.findUnique({
      where: { id: interviewId },
    });
    if (!existing) {
      throw new NotFoundError('Interview not found.');
    }

    const { application } = await this.validateApplicationAccess(
      existing.applicationId,
      userId,
      userRole
    );

    const updated = await prisma.interviewSchedule.update({
      where: { id: interviewId },
      data: {
        status: data.status,
        ...(data.notes ? { notes: data.notes } : {}),
      },
      include: {
        interviewer: {
          select: {
            id: true,
            email: true,
            recruiterProfile: { select: { title: true, department: true } },
          },
        },
      },
    });

    // Notify other party
    const targetUserId =
      userId === application.applicant.userId
        ? existing.interviewerId
        : application.applicant.userId;

    await notificationService.createNotification(
      targetUserId,
      data.status === 'CANCELLED' ? 'INTERVIEW_CANCELLED' : 'INTERVIEW_SCHEDULED',
      `Interview ${data.status.toLowerCase()}: ${existing.title}`,
      `The interview for ${application.job.title} scheduled for ${existing.scheduledAt.toLocaleDateString()} has been marked as ${data.status}.`,
      `/applicant/dashboard`,
      { interviewId }
    );

    const candidateName = `${application.applicant.firstName} ${application.applicant.lastName}`;
    const interviewerName = formatInterviewerName(updated.interviewer);

    return {
      id: updated.id,
      applicationId: updated.applicationId,
      candidateName,
      jobTitle: application.job.title,
      interviewerId: updated.interviewerId,
      interviewerName,
      title: updated.title,
      interviewType: updated.interviewType as any,
      scheduledAt: updated.scheduledAt.toISOString(),
      durationMins: updated.durationMins,
      timezone: updated.timezone,
      videoLink: updated.videoLink,
      location: updated.location,
      status: updated.status as any,
      notes: updated.notes,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Submit structured interview scorecard and recommendation
   */
  async submitInterviewFeedback(
    interviewId: string,
    interviewerId: string,
    userRole: string,
    data: SubmitFeedbackInput
  ): Promise<InterviewFeedbackDto> {
    if (userRole === 'APPLICANT') {
      throw new ForbiddenError('Applicants cannot submit interview scorecards.');
    }

    const interview = await prisma.interviewSchedule.findUnique({
      where: { id: interviewId },
      include: {
        application: {
          include: {
            applicant: true,
            job: true,
          },
        },
      },
    });

    if (!interview) {
      throw new NotFoundError('Interview not found.');
    }

    const sc = data.scorecard;
    const computedAverage =
      sc.overallAverage != null
        ? sc.overallAverage
        : Number(
            (
              (sc.technicalCompetency +
                sc.communication +
                sc.problemSolving +
                sc.experienceAlignment +
                sc.culturalFit) /
              5
            ).toFixed(2)
          );

    const scorecardWithAverage = {
      ...sc,
      overallAverage: computedAverage,
    };

    const feedback = await prisma.interviewFeedback.upsert({
      where: {
        interviewId_interviewerId: {
          interviewId,
          interviewerId,
        },
      },
      create: {
        interviewId,
        interviewerId,
        scorecardJson: scorecardWithAverage,
        recommendation: data.recommendation,
        notes: data.notes?.trim() || null,
      },
      update: {
        scorecardJson: scorecardWithAverage,
        recommendation: data.recommendation,
        notes: data.notes?.trim() || null,
        submittedAt: new Date(),
      },
      include: {
        interviewer: {
          select: {
            id: true,
            email: true,
            recruiterProfile: { select: { title: true, department: true } },
          },
        },
      },
    });

    // Mark interview as COMPLETED if it was scheduled
    await prisma.interviewSchedule.update({
      where: { id: interviewId },
      data: { status: 'COMPLETED' },
    });

    const interviewerName = formatInterviewerName(feedback.interviewer);

    return {
      id: feedback.id,
      interviewId: feedback.interviewId,
      interviewerId: feedback.interviewerId,
      interviewerName,
      scorecardJson: scorecardWithAverage,
      recommendation: feedback.recommendation as any,
      notes: feedback.notes,
      submittedAt: feedback.submittedAt.toISOString(),
      updatedAt: feedback.updatedAt.toISOString(),
    };
  }

  /**
   * Generate RFC 5545 standard .ics file buffer for calendar imports
   */
  async generateIcsCalendar(interviewId: string, userId: string, userRole: string): Promise<string> {
    const interview = await prisma.interviewSchedule.findUnique({
      where: { id: interviewId },
      include: {
        application: {
          include: {
            applicant: true,
            job: {
              include: { company: true },
            },
          },
        },
        interviewer: {
          include: { recruiterProfile: true },
        },
      },
    });

    if (!interview) {
      throw new NotFoundError('Interview not found.');
    }

    await this.validateApplicationAccess(interview.applicationId, userId, userRole);

    const startDate = new Date(interview.scheduledAt);
    const endDate = new Date(startDate.getTime() + interview.durationMins * 60 * 1000);

    const formatDateIcs = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const candidateName = `${interview.application.applicant.firstName} ${interview.application.applicant.lastName}`;
    const companyName = interview.application.job.company.name;
    const roleTitle = interview.application.job.title;

    const summary = `${interview.title}: ${candidateName} & ${companyName} (${roleTitle})`;
    const description = [
      `Interview for position: ${roleTitle} at ${companyName}`,
      `Candidate: ${candidateName}`,
      interview.videoLink ? `Meeting Video Link: ${interview.videoLink}` : '',
      interview.location ? `Location: ${interview.location}` : '',
      interview.notes ? `Preparation Notes:\n${interview.notes}` : '',
    ]
      .filter(Boolean)
      .join('\\n');

    const icsString = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Recruitment ATS Platform//Interview Scheduler//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${interview.id}@recruitment-ats.com`,
      `DTSTAMP:${formatDateIcs(new Date())}`,
      `DTSTART:${formatDateIcs(startDate)}`,
      `DTEND:${formatDateIcs(endDate)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      interview.videoLink ? `URL;VALUE=URI:${interview.videoLink}` : '',
      interview.location ? `LOCATION:${interview.location}` : '',
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder: Upcoming Interview in 15 minutes',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ]
      .filter(Boolean)
      .join('\r\n');

    return icsString;
  }
}

export const communicationService = new CommunicationService();
