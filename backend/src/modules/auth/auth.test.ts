import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { prisma } from '../../db/client';

describe('AuthService Comprehensive Unit & Integration Tests', () => {
  const testEmail = `test-applicant-${Date.now()}@example.com`;
  const recruiterEmail = `test-recruiter-${Date.now()}@example.com`;
  const password = 'StrongPassword123!';

  it('1. Registers an applicant and creates linked ApplicantProfile', async () => {
    const result = await AuthService.registerApplicant({
      email: testEmail,
      password,
      firstName: 'Jane',
      lastName: 'Doe',
      headline: 'Frontend Engineer',
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe(testEmail.toLowerCase());
    expect(result.user.role).toBe('APPLICANT');
    expect(result.user.firstName).toBe('Jane');
    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
  });

  it('2. Prevents duplicate registration with the same email', async () => {
    await expect(
      AuthService.registerApplicant({
        email: testEmail,
        password,
        firstName: 'Jane',
        lastName: 'Doe',
      })
    ).rejects.toThrow(/already exists/i);
  });

  it('3. Registers a recruiter and creates pending tenant Company', async () => {
    const result = await AuthService.registerRecruiter({
      email: recruiterEmail,
      password,
      firstName: 'Mark',
      lastName: 'Recruiter',
      companyName: 'Acme Hiring Corp',
      subRole: 'COMPANY_ADMIN',
    });

    expect(result.user).toBeDefined();
    expect(result.user.role).toBe('RECRUITER');
    expect(result.user.companyId).toBeDefined();
    expect(result.user.recruiterSubRole).toBe('COMPANY_ADMIN');
    expect(result.user.status).toBe('PENDING_APPROVAL');
  });

  it('4. Successfully logs in with valid credentials', async () => {
    const result = await AuthService.login({
      email: testEmail,
      password,
    });

    expect(result.requiresMfa).toBeFalsy();
    if (!result.requiresMfa) {
      expect(result.user.email).toBe(testEmail.toLowerCase());
      expect(result.tokens.accessToken).toBeDefined();
    }
  });

  it('5. Rejects login with invalid password', async () => {
    await expect(
      AuthService.login({
        email: testEmail,
        password: 'WrongPassword999!',
      })
    ).rejects.toThrow(/invalid email or password/i);
  });

  it('6. Rotates refresh token on silent refresh', async () => {
    const loginRes = await AuthService.login({ email: testEmail, password });
    if (loginRes.requiresMfa) return;

    const initialRefreshToken = loginRes.tokens.refreshToken;

    const refreshedTokens = await AuthService.refreshTokens(initialRefreshToken);
    expect(refreshedTokens.accessToken).toBeDefined();
    expect(refreshedTokens.refreshToken).toBeDefined();
    expect(refreshedTokens.refreshToken).not.toBe(initialRefreshToken);

    // Reusing old refresh token should be rejected
    await expect(AuthService.refreshTokens(initialRefreshToken)).rejects.toThrow(
      /expired or been revoked/i
    );
  });

  it('7. Handles password reset request and password update', async () => {
    const { resetToken } = await AuthService.requestPasswordReset(testEmail);
    expect(resetToken).toBeDefined();

    const newPassword = 'NewSecretPassword456!';
    await AuthService.resetPassword({
      token: resetToken,
      newPassword,
    });

    // Logging in with new password succeeds
    const newLogin = await AuthService.login({
      email: testEmail,
      password: newPassword,
    });
    expect(newLogin.requiresMfa).toBeFalsy();
  });

  it('8. Sets up and verifies MFA for a user', async () => {
    const user = await prisma.user.findUnique({ where: { email: testEmail.toLowerCase() } });
    expect(user).toBeDefined();

    const mfaSetup = await AuthService.setupMfa(user!.id);
    expect(mfaSetup.secret).toBeDefined();
    expect(mfaSetup.otpAuthUrl).toContain('otpauth://totp/');
    expect(mfaSetup.backupCodes.length).toBe(6);

    const verified = await AuthService.verifyAndEnableMfa(user!.id, '123456');
    expect(verified).toBe(true);
  });

  it('9. Handles Google and LinkedIn OAuth login/upsert', async () => {
    const googleRes = await AuthService.handleOAuthCallback({
      provider: 'google',
      email: `google-user-${Date.now()}@example.com`,
      firstName: 'Google',
      lastName: 'Applicant',
      role: 'APPLICANT',
    });

    expect(googleRes.user.role).toBe('APPLICANT');
    expect(googleRes.tokens.accessToken).toBeDefined();

    const linkedinRes = await AuthService.handleOAuthCallback({
      provider: 'linkedin',
      email: `linkedin-recruiter-${Date.now()}@example.com`,
      firstName: 'LinkedIn',
      lastName: 'Recruiter',
      role: 'RECRUITER',
    });

    expect(linkedinRes.user.role).toBe('RECRUITER');
    expect(linkedinRes.tokens.accessToken).toBeDefined();
  });
});
