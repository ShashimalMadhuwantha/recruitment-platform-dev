import { prisma } from '../../db/client';

export const STANDARD_NOTIFICATION_TEMPLATES = [
  {
    name: 'Candidate Application Received',
    code: 'APP_RECEIVED',
    channel: 'EMAIL' as const,
    subject: 'Application Received: {{job_title}} at {{company_name}}',
    body: 'Hi {{candidate_name}},\n\nThank you for applying for {{job_title}} at {{company_name}}. We have received your application and resume. Our hiring team will review your qualifications and reach out with next steps.\n\nBest regards,\nThe {{company_name}} Recruitment Team',
    variablesJson: ['candidate_name', 'job_title', 'company_name', 'portal_url'],
    isActive: true,
  },
  {
    name: 'Application Status Stage Update',
    code: 'APP_STAGE_UPDATE',
    channel: 'EMAIL' as const,
    subject: 'Update on your application for {{job_title}}',
    body: 'Dear {{candidate_name}},\n\nYour application status for {{job_title}} at {{company_name}} has been updated to: {{stage_name}}.\n\nYou can track your application status anytime at {{portal_url}}.\n\nSincerely,\n{{company_name}} Hiring Team',
    variablesJson: ['candidate_name', 'job_title', 'company_name', 'stage_name', 'portal_url'],
    isActive: true,
  },
  {
    name: 'Interview Invitation',
    code: 'INTERVIEW_INVITE',
    channel: 'EMAIL' as const,
    subject: 'Interview Invitation: {{job_title}} with {{company_name}}',
    body: 'Hi {{candidate_name}},\n\nWe are pleased to invite you for an interview for the {{job_title}} position.\n\nInterview Details:\nDate & Time: {{interview_time}}\nType: {{interview_type}}\nLink / Location: {{meeting_link}}\n\nPlease let us know if you have any questions.\n\nBest regards,\n{{recruiter_name}}',
    variablesJson: ['candidate_name', 'job_title', 'company_name', 'interview_time', 'interview_type', 'meeting_link', 'recruiter_name'],
    isActive: true,
  },
  {
    name: 'Company Account Approved Notice',
    code: 'COMPANY_APPROVED',
    channel: 'EMAIL' as const,
    subject: 'Welcome to ATS Platform - Your Company Account is Approved!',
    body: 'Hello {{admin_name}},\n\nCongratulations! Your company account for {{company_name}} has been approved by the platform administrators.\n\nYou can now log in, post jobs, configure hiring workflows, and screen applicants.\n\nLogin URL: {{portal_url}}/login\n\nWelcome aboard,\nThe Platform Admin Team',
    variablesJson: ['admin_name', 'company_name', 'portal_url'],
    isActive: true,
  },
  {
    name: 'Official Job Offer Extended',
    code: 'JOB_OFFER_RECEIVED',
    channel: 'EMAIL' as const,
    subject: 'Official Job Offer: {{job_title}} at {{company_name}}',
    body: 'Dear {{candidate_name}},\n\nCongratulations! We are delighted to extend an official offer of employment for the position of {{job_title}} with {{company_name}}.\n\nOffer Summary:\n• Position: {{job_title}}\n• Starting Base Salary: {{base_salary}} ({{currency}})\n• Projected Start Date: {{start_date}}\n• Offer Expiration Date: {{expiration_date}}\n\nPlease log in to your candidate portal to review the complete offer terms, benefits package, and submit your formal acceptance:\n{{portal_url}}\n\nWe are excited about the prospect of you joining our team!\n\nWarm regards,\n{{recruiter_name}}\n{{company_name}} Recruitment Team',
    variablesJson: ['candidate_name', 'job_title', 'company_name', 'base_salary', 'currency', 'start_date', 'expiration_date', 'recruiter_name', 'portal_url'],
    isActive: true,
  },
  {
    name: 'Candidate Accepted Job Offer',
    code: 'OFFER_ACCEPTED',
    channel: 'EMAIL' as const,
    subject: 'Offer Accepted: {{candidate_name}} - {{job_title}}',
    body: 'Hello {{recruiter_name}},\n\nGreat news! {{candidate_name}} has officially accepted the employment offer for {{job_title}} at {{company_name}}.\n\nOffer Details:\n• Candidate: {{candidate_name}}\n• Position: {{job_title}}\n• Projected Start Date: {{start_date}}\n\nYou can review the signed acceptance and finalize onboarding workflows in the candidate pipeline:\n{{portal_url}}\n\nBest regards,\nRecruitATS Notification Service',
    variablesJson: ['recruiter_name', 'candidate_name', 'job_title', 'company_name', 'start_date', 'portal_url'],
    isActive: true,
  },
  {
    name: 'Candidate Declined Job Offer',
    code: 'OFFER_DECLINED',
    channel: 'EMAIL' as const,
    subject: 'Offer Declined: {{candidate_name}} - {{job_title}}',
    body: 'Hello {{recruiter_name}},\n\n{{candidate_name}} has declined the employment offer for {{job_title}} at {{company_name}}.\n\nDecline Reason / Feedback:\n"{{decline_reason}}"\n\nYou can review the application history and manage other active pipeline candidates here:\n{{portal_url}}\n\nBest regards,\nRecruitATS Notification Service',
    variablesJson: ['recruiter_name', 'candidate_name', 'job_title', 'company_name', 'decline_reason', 'portal_url'],
    isActive: true,
  },
  {
    name: 'Welcome to the Team - Candidate Hired',
    code: 'CANDIDATE_HIRED',
    channel: 'EMAIL' as const,
    subject: 'Welcome to {{company_name}}! Congratulations on your new role',
    body: 'Dear {{candidate_name}},\n\nCongratulations and welcome to {{company_name}}!\n\nWe are thrilled to officially welcome you aboard as our new {{job_title}}. Your hiring process has been successfully completed.\n\nKey Details:\n• Position: {{job_title}}\n• Organization: {{company_name}}\n• Start Date: {{start_date}}\n\nOur team will follow up with onboarding instructions, orientation schedules, and workspace setup details. You can view your candidate portal anytime at:\n{{portal_url}}\n\nCongratulations once again on your new role!\n\nWarmest regards,\nThe {{company_name}} Team',
    variablesJson: ['candidate_name', 'job_title', 'company_name', 'start_date', 'portal_url'],
    isActive: true,
  },
];

export async function ensureStandardNotificationTemplates() {
  for (const template of STANDARD_NOTIFICATION_TEMPLATES) {
    await prisma.notificationTemplate.upsert({
      where: { code: template.code },
      update: {
        name: template.name,
        variablesJson: template.variablesJson,
      },
      create: {
        name: template.name,
        code: template.code,
        channel: template.channel,
        subject: template.subject,
        body: template.body,
        variablesJson: template.variablesJson,
        isActive: template.isActive,
      },
    });
  }
}
