import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../../db/client';
import { notificationService } from './notifications.service';
import { ensureStandardNotificationTemplates } from '../system-config/seed-templates';

describe('Notification Service & Admin Email Templates', () => {
  beforeAll(async () => {
    // Ensure standard templates are in database
    await ensureStandardNotificationTemplates();
  });

  describe('1. Offer and Hire Template Rendering', () => {
    it('renders JOB_OFFER_RECEIVED template with dynamic compensation tokens', async () => {
      const rendered = await notificationService.renderTemplate('JOB_OFFER_RECEIVED', {
        candidate_name: 'Jessica Alba',
        job_title: 'Principal Distributed Systems Architect',
        company_name: 'Apex Cloud Systems',
        base_salary: '$210,000',
        currency: 'USD',
        start_date: 'November 1, 2026',
        expiration_date: 'October 15, 2026',
        recruiter_name: 'Michael Scott',
        portal_url: 'https://recruitats.example.com/applicant/dashboard',
      });

      expect(rendered).not.toBeNull();
      expect(rendered?.subject).toBe('Official Job Offer: Principal Distributed Systems Architect at Apex Cloud Systems');
      expect(rendered?.body).toContain('Dear Jessica Alba');
      expect(rendered?.body).toContain('Starting Base Salary: $210,000 (USD)');
      expect(rendered?.body).toContain('Projected Start Date: November 1, 2026');
      expect(rendered?.body).toContain('Offer Expiration Date: October 15, 2026');
      expect(rendered?.body).toContain('Michael Scott');
    });

    it('renders OFFER_ACCEPTED template for recruiter notification', async () => {
      const rendered = await notificationService.renderTemplate('OFFER_ACCEPTED', {
        recruiter_name: 'Pam Beesly',
        candidate_name: 'Jim Halpert',
        job_title: 'Senior Account Executive',
        company_name: 'Dunder Mifflin',
        start_date: 'October 10, 2026',
        portal_url: 'https://recruitats.example.com/recruiter/pipeline',
      });

      expect(rendered).not.toBeNull();
      expect(rendered?.subject).toBe('Offer Accepted: Jim Halpert - Senior Account Executive');
      expect(rendered?.body).toContain('Hello Pam Beesly');
      expect(rendered?.body).toContain('Jim Halpert has officially accepted');
      expect(rendered?.body).toContain('October 10, 2026');
    });

    it('renders OFFER_DECLINED template with candidate feedback', async () => {
      const rendered = await notificationService.renderTemplate('OFFER_DECLINED', {
        recruiter_name: 'David Wallace',
        candidate_name: 'Dwight Schrute',
        job_title: 'Regional Manager',
        company_name: 'Dunder Mifflin',
        decline_reason: 'Pursuing independent farm venture.',
        portal_url: 'https://recruitats.example.com/recruiter/pipeline',
      });

      expect(rendered).not.toBeNull();
      expect(rendered?.subject).toBe('Offer Declined: Dwight Schrute - Regional Manager');
      expect(rendered?.body).toContain('Pursuing independent farm venture.');
    });

    it('renders CANDIDATE_HIRED welcome email template', async () => {
      const rendered = await notificationService.renderTemplate('CANDIDATE_HIRED', {
        candidate_name: 'Ryan Howard',
        job_title: 'Junior Analyst',
        company_name: 'Scranton Tech',
        start_date: 'November 15, 2026',
        portal_url: 'https://recruitats.example.com/applicant/dashboard',
      });

      expect(rendered).not.toBeNull();
      expect(rendered?.subject).toBe('Welcome to Scranton Tech! Congratulations on your new role');
      expect(rendered?.body).toContain('Dear Ryan Howard');
      expect(rendered?.body).toContain('welcome you aboard as our new Junior Analyst');
    });
  });

  describe('2. Dynamic Admin Customization', () => {
    it('uses updated copy when an admin edits the template in the database', async () => {
      const testCode = `TEST_TEMPLATE_${Date.now()}`;
      await prisma.notificationTemplate.create({
        data: {
          code: testCode,
          name: 'Custom Offer Template',
          channel: 'EMAIL',
          subject: 'Initial: {{candidate_name}}',
          body: 'Hello {{candidate_name}}, welcome to {{company_name}}!',
          isActive: true,
        },
      });

      // Render original
      const r1 = await notificationService.renderTemplate(testCode, {
        candidate_name: 'Alice',
        company_name: 'Wonderland Inc.',
      });
      expect(r1?.subject).toBe('Initial: Alice');

      // Update template in DB
      await prisma.notificationTemplate.update({
        where: { code: testCode },
        data: {
          subject: 'Updated: {{candidate_name}} at {{company_name}}',
          body: 'Custom greeting for {{candidate_name}}.',
        },
      });

      // Render again
      const r2 = await notificationService.renderTemplate(testCode, {
        candidate_name: 'Alice',
        company_name: 'Wonderland Inc.',
      });
      expect(r2?.subject).toBe('Updated: Alice at Wonderland Inc.');
      expect(r2?.body).toBe('Custom greeting for Alice.');
    });

    it('returns null and falls back if template is inactive or non-existent', async () => {
      const inactiveCode = `INACTIVE_${Date.now()}`;
      await prisma.notificationTemplate.create({
        data: {
          code: inactiveCode,
          name: 'Disabled Template',
          channel: 'EMAIL',
          subject: 'Disabled',
          body: 'Disabled',
          isActive: false,
        },
      });

      const res = await notificationService.renderTemplate(inactiveCode, { candidate_name: 'Bob' });
      expect(res).toBeNull();
    });
  });
});
