import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../../db/client';
import { communicationService } from './communication.service';
import { notificationService } from '../notifications/notifications.service';
import { pipelineManagementService } from '../application-pipeline/pipeline-management.service';
import { ApplicationStatus, JobStatus, EmploymentType } from '@prisma/client';

describe('Epic 12: Communication, Scheduling & Notifications Unit Tests', () => {
  let companyId: string;
  let recruiterUserId: string;
  let applicantUserId: string;
  let unauthorizedUserId: string;
  let jobId: string;
  let applicationId: string;
  let createdInterviewId: string;

  beforeAll(async () => {
    // 1. Create company
    const company = await prisma.company.create({
      data: {
        name: `Communication Test Corp ${Date.now()}`,
        slug: `comm-corp-${Date.now()}`,
      },
    });
    companyId = company.id;

    // 2. Create recruiter user
    const recruiter = await prisma.user.create({
      data: {
        email: `recruiter-comm-${Date.now()}@example.com`,
        passwordHash: 'dummyhash',
        role: 'RECRUITER',
        status: 'ACTIVE',
        recruiterProfile: {
          create: {
            companyId,
            title: 'Senior Recruiter',
            department: 'Talent Acquisition',
          },
        },
      },
    });
    recruiterUserId = recruiter.id;

    // 3. Create applicant user
    const applicant = await prisma.user.create({
      data: {
        email: `applicant-comm-${Date.now()}@example.com`,
        passwordHash: 'dummyhash',
        role: 'APPLICANT',
        status: 'ACTIVE',
        applicantProfile: {
          create: {
            firstName: 'Alex',
            lastName: 'Candidate',
          },
        },
      },
    });
    applicantUserId = applicant.id;

    // 4. Create unauthorized applicant
    const unauthorized = await prisma.user.create({
      data: {
        email: `unauthorized-${Date.now()}@example.com`,
        passwordHash: 'dummyhash',
        role: 'APPLICANT',
        status: 'ACTIVE',
        applicantProfile: {
          create: {
            firstName: 'Stranger',
            lastName: 'Danger',
          },
        },
      },
    });
    unauthorizedUserId = unauthorized.id;

    // 5. Create job vacancy
    const job = await prisma.jobVacancy.create({
      data: {
        companyId,
        createdById: recruiterUserId,
        title: 'Senior Frontend Engineer',
        description: 'Building modern interfaces with React and TypeScript.',
        status: JobStatus.PUBLISHED,
        employmentType: EmploymentType.FULL_TIME,
      },
    });
    jobId = job.id;

    // 6. Create application
    const applicantProfile = await prisma.applicantProfile.findUnique({
      where: { userId: applicantUserId },
    });

    const application = await prisma.application.create({
      data: {
        applicantId: applicantProfile!.id,
        jobId,
        status: ApplicationStatus.APPLIED,
      },
    });
    applicationId = application.id;
  });

  describe('1. In-App Messaging System (FR-RC-17, FR-AP-25)', () => {
    it('allows recruiter to send a message to the applicant within application context', async () => {
      const msg = await communicationService.sendMessage(
        applicationId,
        recruiterUserId,
        'RECRUITER',
        { body: 'Hello Alex, we were impressed by your profile and would love to connect.' }
      );

      expect(msg.id).toBeDefined();
      expect(msg.applicationId).toBe(applicationId);
      expect(msg.senderId).toBe(recruiterUserId);
      expect(msg.receiverId).toBe(applicantUserId);
      expect(msg.body).toContain('impressed by your profile');
      expect(msg.isRead).toBe(false);
    });

    it('allows applicant to reply to recruiter within application context', async () => {
      const msg = await communicationService.sendMessage(
        applicationId,
        applicantUserId,
        'APPLICANT',
        { body: 'Thank you Sarah, I am very excited about this opportunity!' }
      );

      expect(msg.id).toBeDefined();
      expect(msg.senderId).toBe(applicantUserId);
      expect(msg.receiverId).toBe(recruiterUserId);
      expect(msg.body).toContain('very excited');
    });

    it('fetches chronological message thread and marks incoming messages as read', async () => {
      const messages = await communicationService.getMessages(
        applicationId,
        applicantUserId,
        'APPLICANT'
      );

      expect(messages.length).toBeGreaterThanOrEqual(2);
      expect(messages[0].body).toContain('Hello Alex');
      // The recruiter message was directed to applicant, so fetching by applicant should have marked it as read
      const recruiterMsg = messages.find((m) => m.senderId === recruiterUserId);
      expect(recruiterMsg?.isRead).toBe(true);
    });

    it('denies access to message thread for an unauthorized user', async () => {
      await expect(
        communicationService.getMessages(applicationId, unauthorizedUserId, 'APPLICANT')
      ).rejects.toThrow('You do not have access');

      await expect(
        communicationService.sendMessage(applicationId, unauthorizedUserId, 'APPLICANT', {
          body: 'Intruder message',
        })
      ).rejects.toThrow('You do not have access');
    });
  });

  describe('2. Interview Scheduling & Video Call Links (FR-RC-18, FR-RC-19, FR-AP-26)', () => {
    it('allows recruiter to schedule an interview with auto-generated video call link', async () => {
      const scheduledTime = new Date(Date.now() + 86400000 * 2).toISOString(); // 2 days from now

      const interview = await communicationService.scheduleInterview(
        applicationId,
        recruiterUserId,
        'RECRUITER',
        {
          title: 'Round 1: Technical & System Architecture',
          interviewType: 'VIDEO',
          scheduledAt: scheduledTime,
          durationMins: 60,
          timezone: 'America/New_York',
          notes: 'Please be prepared to discuss distributed caching and React performance.',
        }
      );

      expect(interview.id).toBeDefined();
      expect(interview.title).toBe('Round 1: Technical & System Architecture');
      expect(interview.interviewType).toBe('VIDEO');
      expect(interview.durationMins).toBe(60);
      expect(interview.videoLink).toMatch(/^https:\/\/meet\.jit\.si\/ats-interview-/);
      expect(interview.status).toBe('SCHEDULED');

      createdInterviewId = interview.id;

      // Check application progressed to INTERVIEW stage
      const updatedApp = await prisma.application.findUnique({
        where: { id: applicationId },
      });
      expect(updatedApp?.status).toBe('INTERVIEW');
    });

    it('allows applicant and recruiter to view scheduled interviews', async () => {
      const interviews = await communicationService.getApplicationInterviews(
        applicationId,
        applicantUserId,
        'APPLICANT'
      );

      expect(interviews.length).toBeGreaterThanOrEqual(1);
      expect(interviews[0].id).toBe(createdInterviewId);
      expect(interviews[0].candidateName).toContain('Alex');
    });

    it('generates standard RFC 5545 .ics iCalendar file for scheduled interview', async () => {
      const ics = await communicationService.generateIcsCalendar(
        createdInterviewId,
        applicantUserId,
        'APPLICANT'
      );

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain(`UID:${createdInterviewId}@recruitment-ats.com`);
      expect(ics).toContain('Round 1: Technical');
      expect(ics).toContain('END:VEVENT');
      expect(ics).toContain('END:VCALENDAR');
    });

    it('allows updating interview status', async () => {
      const updated = await communicationService.updateInterviewStatus(
        createdInterviewId,
        recruiterUserId,
        'RECRUITER',
        {
          status: 'RESCHEDULED',
          notes: 'Moved due to interviewer conflict.',
        }
      );

      expect(updated.status).toBe('RESCHEDULED');
    });
  });

  describe('3. Structured Interview Feedback Scorecard (FR-RC-20)', () => {
    it('allows interviewer to submit structured scorecard and recommendation', async () => {
      const feedback = await communicationService.submitInterviewFeedback(
        createdInterviewId,
        recruiterUserId,
        'RECRUITER',
        {
          scorecard: {
            technicalCompetency: 5,
            communication: 4,
            problemSolving: 5,
            experienceAlignment: 4,
            culturalFit: 5,
          },
          recommendation: 'STRONG_HIRE',
          notes: 'Candidate demonstrated exceptional architectural insight and clear communication.',
        }
      );

      expect(feedback.id).toBeDefined();
      expect(feedback.recommendation).toBe('STRONG_HIRE');
      expect(feedback.scorecardJson?.overallAverage).toBe(4.6);
      expect(feedback.notes).toContain('exceptional architectural insight');

      // Interview status should now be marked as COMPLETED
      const interview = await prisma.interviewSchedule.findUnique({
        where: { id: createdInterviewId },
      });
      expect(interview?.status).toBe('COMPLETED');
    });

    it('prohibits applicant from submitting feedback scorecards', async () => {
      await expect(
        communicationService.submitInterviewFeedback(
          createdInterviewId,
          applicantUserId,
          'APPLICANT',
          {
            scorecard: {
              technicalCompetency: 5,
              communication: 5,
              problemSolving: 5,
              experienceAlignment: 5,
              culturalFit: 5,
            },
            recommendation: 'STRONG_HIRE',
          }
        )
      ).rejects.toThrow('Applicants cannot submit interview scorecards');
    });
  });

  describe('4. Notifications & Event Dispatch (FR-AP-27)', () => {
    it('records in-app notifications for the applicant', async () => {
      const { items, unreadCount } = await notificationService.getUserNotifications(applicantUserId);

      expect(items.length).toBeGreaterThanOrEqual(1);
      expect(unreadCount).toBeGreaterThanOrEqual(1);

      const unread = await notificationService.getUnreadCount(applicantUserId);
      expect(unread).toBe(unreadCount);
    });

    it('marks notification as read', async () => {
      const { items } = await notificationService.getUserNotifications(applicantUserId, { unreadOnly: true });
      expect(items.length).toBeGreaterThanOrEqual(1);

      await notificationService.markAsRead(items[0].id, applicantUserId);

      const updatedCount = await notificationService.getUnreadCount(applicantUserId);
      expect(updatedCount).toBe(items.length - 1);
    });

    it('marks all notifications as read', async () => {
      await notificationService.markAllAsRead(applicantUserId);
      const remainingUnread = await notificationService.getUnreadCount(applicantUserId);
      expect(remainingUnread).toBe(0);
    });

    it('dispatches notification when candidate stage progresses in pipeline', async () => {
      const targetStage = await prisma.pipelineStage.findFirst({
        where: { jobId, name: 'OFFER' },
      });

      // Move candidate stage via pipeline management
      await pipelineManagementService.moveCandidateStage(
        applicationId,
        recruiterUserId,
        'RECRUITER',
        { stage: ApplicationStatus.OFFER, notes: 'Offer prepared.' }
      );

      // Check applicant received an APPLICATION_STATUS_CHANGED notification
      const { items } = await notificationService.getUserNotifications(applicantUserId);
      const stageNotification = items.find((n) => n.type === 'APPLICATION_STATUS_CHANGED');
      expect(stageNotification).toBeDefined();
      expect(stageNotification?.title).toContain('Application Status Update');
    });
  });
});
