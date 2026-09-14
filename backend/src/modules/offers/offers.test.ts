import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../../db/client';
import { offersService } from './offers.service';
import { notificationService } from '../notifications/notifications.service';
import { ApplicationStatus, JobStatus, EmploymentType, OfferStatus } from '@prisma/client';

describe('Epic 13: Offers & Hiring Unit Tests (FR-RC-24, FR-RC-25)', () => {
  let companyId: string;
  let recruiterUserId: string;
  let applicantUserId: string;
  let unauthorizedUserId: string;
  let jobId: string;
  let applicationId: string;
  let createdOfferId: string;

  beforeAll(async () => {
    // 1. Create company
    const company = await prisma.company.create({
      data: {
        name: `Offer Test Corp ${Date.now()}`,
        slug: `offer-corp-${Date.now()}`,
      },
    });
    companyId = company.id;

    // 2. Create recruiter user
    const recruiter = await prisma.user.create({
      data: {
        email: `recruiter-offer-${Date.now()}@example.com`,
        passwordHash: 'dummyhash',
        role: 'RECRUITER',
        status: 'ACTIVE',
        recruiterProfile: {
          create: {
            companyId,
            title: 'Lead Talent Partner',
            department: 'People Operations',
          },
        },
      },
    });
    recruiterUserId = recruiter.id;

    // 3. Create applicant user
    const applicant = await prisma.user.create({
      data: {
        email: `applicant-offer-${Date.now()}@example.com`,
        passwordHash: 'dummyhash',
        role: 'APPLICANT',
        status: 'ACTIVE',
        applicantProfile: {
          create: {
            firstName: 'Jordan',
            lastName: 'Candidate',
            phone: '+1 555-0199',
            location: 'Austin, TX',
          },
        },
      },
    });
    applicantUserId = applicant.id;

    // 4. Create unauthorized user
    const unauthorized = await prisma.user.create({
      data: {
        email: `unauthorized-offer-${Date.now()}@example.com`,
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
        title: 'Principal Distributed Systems Engineer',
        description: 'Lead architecture for global cloud platform.',
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
        status: ApplicationStatus.INTERVIEW,
      },
    });
    applicationId = application.id;
  });

  describe('1. Offer Generation & Draft Management (FR-RC-24)', () => {
    it('allows recruiter to create a draft job offer with compensation and start date', async () => {
      const startDate = new Date(Date.now() + 86400000 * 14).toISOString(); // 2 weeks out
      const expirationDate = new Date(Date.now() + 86400000 * 7).toISOString(); // 1 week to accept

      const offer = await offersService.createOrUpdateOffer(
        applicationId,
        recruiterUserId,
        'RECRUITER',
        {
          baseSalary: 185000,
          currency: 'USD',
          bonus: 25000,
          equity: '0.35% stock options (4-year vesting, 1-year cliff)',
          startDate,
          expirationDate,
          benefitsSummary: 'Comprehensive PPO health, 401(k) 6% match, unlimited PTO, and home office stipend.',
          notes: 'Candidate passed all rounds with Strong Hire recommendation.',
          autoSend: false,
        }
      );

      expect(offer.id).toBeDefined();
      expect(offer.baseSalary).toBe(185000);
      expect(offer.currency).toBe('USD');
      expect(offer.bonus).toBe(25000);
      expect(offer.equity).toContain('0.35%');
      expect(offer.status).toBe('DRAFT');
      expect(offer.offerLetterText).toContain('Principal Distributed Systems Engineer');
      expect(offer.offerLetterText).toContain('$185,000');

      createdOfferId = offer.id;

      // Draft offer should NOT be visible to applicant yet
      const applicantView = await offersService.getApplicationOffer(
        applicationId,
        applicantUserId,
        'APPLICANT'
      );
      expect(applicantView).toBeNull();
    });

    it('allows recruiter to update draft terms before official dispatch', async () => {
      const startDate = new Date(Date.now() + 86400000 * 14).toISOString();
      const expirationDate = new Date(Date.now() + 86400000 * 7).toISOString();

      const updated = await offersService.createOrUpdateOffer(
        applicationId,
        recruiterUserId,
        'RECRUITER',
        {
          baseSalary: 195000, // Counteroffer / revised salary
          currency: 'USD',
          bonus: 30000,
          equity: '0.40% stock options',
          startDate,
          expirationDate,
          autoSend: false,
        }
      );

      expect(updated.baseSalary).toBe(195000);
      expect(updated.bonus).toBe(30000);
      expect(updated.equity).toBe('0.40% stock options');
      expect(updated.status).toBe('DRAFT');
    });

    it('prohibits unauthorized users from creating offers', async () => {
      const startDate = new Date(Date.now() + 86400000 * 14).toISOString();
      const expirationDate = new Date(Date.now() + 86400000 * 7).toISOString();

      await expect(
        offersService.createOrUpdateOffer(
          applicationId,
          unauthorizedUserId,
          'APPLICANT',
          {
            baseSalary: 200000,
            currency: 'USD',
            startDate,
            expirationDate,
            autoSend: false,
          }
        )
      ).rejects.toThrow('You do not have access');
    });
  });

  describe('2. Offer Dispatch & Notifications (FR-RC-24)', () => {
    it('officially sends offer, advances candidate stage to OFFER, and notifies candidate', async () => {
      const sentOffer = await offersService.sendOffer(
        applicationId,
        recruiterUserId,
        'RECRUITER'
      );

      expect(sentOffer.status).toBe('SENT');
      expect(sentOffer.sentAt).toBeDefined();

      // Check application stage progressed to OFFER
      const updatedApp = await prisma.application.findUnique({
        where: { id: applicationId },
      });
      expect(updatedApp?.status).toBe('OFFER');

      // Check candidate received an in-app notification
      const { items } = await notificationService.getUserNotifications(applicantUserId);
      const offerNotification = items.find((n) => n.type === 'JOB_OFFER_RECEIVED');
      expect(offerNotification).toBeDefined();
      expect(offerNotification?.title).toContain('Official Job Offer Extended');

      // Candidate can now view the official sent offer
      const applicantView = await offersService.getApplicationOffer(
        applicationId,
        applicantUserId,
        'APPLICANT'
      );
      expect(applicantView).not.toBeNull();
      expect(applicantView?.status).toBe('SENT');
      expect(applicantView?.baseSalary).toBe(195000);
    });
  });

  describe('3. Candidate Acceptance & Decision (FR-RC-24)', () => {
    it('allows candidate to formally accept the job offer and notifies hiring team', async () => {
      const accepted = await offersService.respondToOffer(
        createdOfferId,
        applicantUserId,
        {
          action: 'ACCEPT',
          signedName: 'Jordan Candidate',
        }
      );

      expect(accepted.status).toBe('ACCEPTED');
      expect(accepted.respondedAt).toBeDefined();

      // Recruiter receives notification of acceptance
      const { items } = await notificationService.getUserNotifications(recruiterUserId);
      const acceptNotification = items.find((n) => n.type === 'OFFER_ACCEPTED');
      expect(acceptNotification).toBeDefined();
      expect(acceptNotification?.title).toContain('Offer Accepted');
    });

    it('prohibits modifying or responding to an already accepted offer', async () => {
      await expect(
        offersService.respondToOffer(createdOfferId, applicantUserId, {
          action: 'DECLINE',
        })
      ).rejects.toThrow('already been accepted');
    });
  });

  describe('4. Mark Candidate as Hired & Requisition Closing (FR-RC-25)', () => {
    it('marks candidate as HIRED and closes job vacancy as FILLED', async () => {
      const result = await offersService.markCandidateHired(
        applicationId,
        recruiterUserId,
        'RECRUITER',
        {
          closeRequisition: true,
          notes: 'Candidate signed and background check cleared.',
        }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe('HIRED');
      expect(result.requisitionClosed).toBe(true);
      expect(result.jobStatus).toBe('FILLED');

      // Verify in database
      const app = await prisma.application.findUnique({
        where: { id: applicationId },
      });
      expect(app?.status).toBe(ApplicationStatus.HIRED);

      const job = await prisma.jobVacancy.findUnique({
        where: { id: jobId },
      });
      expect(job?.status).toBe(JobStatus.FILLED);

      // Verify candidate celebration notification
      const { items } = await notificationService.getUserNotifications(applicantUserId);
      const hireNotification = items.find((n) => n.type === 'CANDIDATE_HIRED');
      expect(hireNotification).toBeDefined();
      expect(hireNotification?.title).toContain('Welcome to');
    });
  });
});
