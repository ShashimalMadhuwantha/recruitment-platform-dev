import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import {
  registerApplicantSchema,
  registerRecruiterSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  mfaVerifySchema,
  oauthCallbackSchema,
} from './auth.types';

export class AuthController {
  /**
   * Register Applicant
   */
  static async registerApplicant(req: Request, res: Response, next: NextFunction) {
    try {
      const input = registerApplicantSchema.parse(req.body);
      const result = await AuthService.registerApplicant(input);
      return res.status(201).json({
        data: result,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register Recruiter + Company
   */
  static async registerRecruiter(req: Request, res: Response, next: NextFunction) {
    try {
      const input = registerRecruiterSchema.parse(req.body);
      const result = await AuthService.registerRecruiter(input);
      return res.status(201).json({
        data: result,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const input = loginSchema.parse(req.body);
      const result = await AuthService.login(input);
      return res.status(200).json({
        data: result,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh Token
   */
  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);
      const tokens = await AuthService.refreshTokens(refreshToken);
      return res.status(200).json({
        data: { tokens },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout
   */
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body || {};
      await AuthService.logout(refreshToken);
      return res.status(200).json({
        data: { message: 'Logged out successfully' },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request Password Reset
   */
  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const result = await AuthService.requestPasswordReset(email);
      return res.status(200).json({
        data: {
          message: 'Password reset link sent to your email',
          // Include token in response in development/test for easy verification
          ...(process.env.NODE_ENV !== 'production' && { resetToken: result.resetToken }),
        },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirm Password Reset
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const input = resetPasswordSchema.parse(req.body);
      await AuthService.resetPassword(input);
      return res.status(200).json({
        data: { message: 'Password reset successfully. You can now log in with your new password.' },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Setup MFA
   */
  static async setupMfa(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await AuthService.setupMfa(userId);
      return res.status(200).json({
        data: result,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify and Enable MFA
   */
  static async verifyMfa(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { code } = mfaVerifySchema.parse(req.body);
      await AuthService.verifyAndEnableMfa(userId, code);
      return res.status(200).json({
        data: { message: 'MFA enabled successfully' },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Complete MFA Login Challenge
   */
  static async challengeMfa(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, tempToken } = mfaVerifySchema.parse(req.body);
      if (!tempToken) {
        return res.status(400).json({
          data: null,
          error: { code: 'BAD_REQUEST', message: 'tempToken is required for MFA challenge' },
        });
      }
      const result = await AuthService.completeMfaChallenge(tempToken, code);
      return res.status(200).json({
        data: result,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * OAuth Callback (Google / LinkedIn)
   */
  static async oauthCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const input = oauthCallbackSchema.parse({
        ...req.query,
        ...req.body,
        provider: req.params.provider,
      });
      const result = await AuthService.handleOAuthCallback(input);

      // If browser GET request, redirect directly to React /auth/callback page
      if (req.method === 'GET' && !req.xhr && !req.headers.accept?.includes('application/json')) {
        const queryParams = new URLSearchParams({
          token: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          role: result.user.role,
          userId: result.user.id,
          email: result.user.email,
        });

        return res.redirect(`/auth/callback?${queryParams.toString()}`);
      }

      return res.status(200).json({
        data: result,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Current Authenticated User (GET /me)
   */
  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getCurrentUser(req.user!.id);
      return res.status(200).json({
        data: { user },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }
}
