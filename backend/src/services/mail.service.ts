import nodemailer from 'nodemailer';
import { config } from '../config';

export class MailService {
  private static transporter = (config.SMTP_HOST || config.SMTP_USER)
    ? nodemailer.createTransport({
        host: config.SMTP_HOST || 'smtp.gmail.com',
        port: config.SMTP_PORT || 465,
        secure: config.SMTP_SECURE !== undefined ? config.SMTP_SECURE : true,
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS?.replace(/\s+/g, '') || config.SMTP_PASS,
        },
      })
    : null;

  /**
   * Sends a Password Reset Email with a secure link
   */
  static async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${config.FRONTEND_URL}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(to)}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
            .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
            .header { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
            .content { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
            .button-wrapper { text-align: center; margin: 28px 0; }
            .button { display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 600; color: #ffffff !important; background-color: #2563eb; border-radius: 6px; text-decoration: none; }
            .footer { font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }
            .link-fallback { font-size: 12px; color: #64748b; word-break: break-all; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">Password Reset Request</div>
            <div class="content">
              Hello,<br><br>
              We received a request to reset the password associated with your account (<strong>${to}</strong>). Click the button below to set a new password:
            </div>
            <div class="button-wrapper">
              <a href="${resetUrl}" class="button" target="_blank">Reset Password</a>
            </div>
            <div class="content">
              This link is valid for <strong>60 minutes</strong>. If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.
            </div>
            <div class="link-fallback">
              Button not working? Copy and paste this URL into your browser:<br>
              <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
            </div>
            <div class="footer">
              RecruitATS Platform &bull; Automated System Email
            </div>
          </div>
        </body>
      </html>
    `;

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: config.SMTP_FROM,
          to,
          subject: 'Reset Your RecruitATS Password',
          html: htmlContent,
          text: `You requested a password reset. Reset your password here: ${resetUrl}`,
        });
        console.log(`📧 [MailService] ✅ Password reset email dispatched to: ${to} (MessageId: ${info.messageId})`);
        return true;
      } catch (error: any) {
        console.error(`📧 [MailService] ❌ Failed to send reset email to ${to}:`, error.message || error);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 [MailService Fallback - Local Dev] Password Reset link:');
        console.log(`🔗 Target: ${to}`);
        console.log(`🔗 Link:   ${resetUrl}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return false;
      }
    } else {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 [MailService] SMTP not configured in .env. Password Reset link:');
      console.log(`🔗 Target: ${to}`);
      console.log(`🔗 Link:   ${resetUrl}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return false;
    }
  }

  /**
   * Sends a general notification email (stage change, interview, message)
   */
  static async sendNotificationEmail(
    to: string,
    subject: string,
    title: string,
    message: string,
    actionUrl?: string,
    actionText?: string
  ): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
            .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
            .header { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 16px; }
            .content { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; white-space: pre-line; }
            .button-wrapper { text-align: center; margin: 28px 0; }
            .button { display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 600; color: #ffffff !important; background-color: #2563eb; border-radius: 6px; text-decoration: none; }
            .footer { font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">${title}</div>
            <div class="content">${message}</div>
            ${
              actionUrl
                ? `<div class="button-wrapper">
                    <a href="${actionUrl}" class="button" target="_blank">${actionText || 'View in Platform'}</a>
                   </div>`
                : ''
            }
            <div class="footer">
              RecruitATS Platform &bull; Notification Service
            </div>
          </div>
        </body>
      </html>
    `;

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: config.SMTP_FROM,
          to,
          subject,
          html: htmlContent,
          text: `${title}\n\n${message}\n\n${actionUrl || ''}`,
        });
        console.log(`📧 [MailService] ✅ Notification email dispatched to: ${to} | Subject: ${subject} (MessageId: ${info.messageId})`);
        return true;
      } catch (error: any) {
        console.error(`📧 [MailService] ❌ Failed to send notification email via SMTP to ${to}:`, error.message || error);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📧 [MailService Fallback - Local Dev Delivery] Email to: ${to}`);
        console.log(`📌 Subject: ${subject}`);
        console.log(`📝 Message: ${message}`);
        if (actionUrl) console.log(`🔗 Link:    ${actionUrl}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return false;
      }
    } else {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📧 [MailService] Notification Email to: ${to}`);
      console.log(`📌 Subject: ${subject}`);
      console.log(`📝 Message: ${message}`);
      if (actionUrl) console.log(`🔗 Link:    ${actionUrl}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return false;
    }
  }

  /**
   * Sends a Team Member Invitation Email with a secure acceptance link
   */
  static async sendTeamInvitationEmail(
    to: string,
    companyName: string,
    subRole: string,
    token: string,
    inviterName?: string
  ): Promise<boolean> {
    const inviteUrl = `${config.FRONTEND_URL}/invite/accept?token=${token}`;
    const readableRole = subRole.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    const subject = `Invitation to join ${companyName} on RecruitATS`;
    const title = `Join ${companyName}'s Hiring Team`;
    const inviterText = inviterName ? `<strong>${inviterName}</strong> has invited you` : `You have been invited`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
            .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
            .header { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
            .content { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
            .badge { display: inline-block; background-color: #e0e7ff; color: #3730a3; font-weight: 600; font-size: 12px; padding: 4px 10px; border-radius: 9999px; margin-top: 4px; }
            .button-wrapper { text-align: center; margin: 28px 0; }
            .button { display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 600; color: #ffffff !important; background-color: #2563eb; border-radius: 6px; text-decoration: none; }
            .footer { font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }
            .link-fallback { font-size: 12px; color: #64748b; word-break: break-all; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">${title}</div>
            <div class="content">
              Hello,<br><br>
              ${inviterText} to join <strong>${companyName}</strong> on the RecruitATS Platform as a:
              <br>
              <span class="badge">${readableRole}</span>
              <br><br>
              As part of the hiring team, you can collaborate on candidate evaluations, track applicant pipelines, and manage requisitions.
            </div>
            <div class="button-wrapper">
              <a href="${inviteUrl}" class="button" target="_blank">Accept Invitation</a>
            </div>
            <div class="content">
              This invitation link is valid for <strong>7 days</strong>.
            </div>
            <div class="link-fallback">
              Button not working? Copy and paste this URL into your browser:<br>
              <a href="${inviteUrl}" style="color: #2563eb;">${inviteUrl}</a>
            </div>
            <div class="footer">
              RecruitATS Platform &bull; Team Management System
            </div>
          </div>
        </body>
      </html>
    `;

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: config.SMTP_FROM,
          to,
          subject,
          html: htmlContent,
          text: `${title}\n\n${inviterText} to join ${companyName} as a ${readableRole}.\n\nAccept link: ${inviteUrl}`,
        });
        console.log(`📧 [MailService] ✅ Team invitation email dispatched to: ${to} | Company: ${companyName} (MessageId: ${info.messageId})`);
        return true;
      } catch (error: any) {
        console.error(`📧 [MailService] ❌ Failed to send team invitation email via SMTP to ${to}:`, error.message || error);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📧 [MailService Fallback - Local Dev Delivery] Team Invite to: ${to}`);
        console.log(`📌 Company: ${companyName} | Role: ${readableRole}`);
        console.log(`🔗 Accept URL: ${inviteUrl}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return false;
      }
    } else {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📧 [MailService Mock] Team Invite to: ${to}`);
      console.log(`📌 Company: ${companyName} | Role: ${readableRole}`);
      console.log(`🔗 Accept URL: ${inviteUrl}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return false;
    }
  }
}

