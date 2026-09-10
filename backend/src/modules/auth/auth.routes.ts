import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { authRateLimiter } from '../../middleware/rate-limit.middleware';

export const authRouter = Router();

// Registration
authRouter.post('/register/applicant', authRateLimiter, AuthController.registerApplicant);
authRouter.post('/register/recruiter', authRateLimiter, AuthController.registerRecruiter);
authRouter.post('/register', authRateLimiter, AuthController.registerApplicant); // backward-compatible alias

// Authentication & Session
authRouter.post('/login', authRateLimiter, AuthController.login);
authRouter.post('/login/mfa', authRateLimiter, AuthController.challengeMfa);
authRouter.post('/refresh', AuthController.refresh);
authRouter.post('/logout', AuthController.logout);

// Password Recovery
authRouter.post('/forgot-password', authRateLimiter, AuthController.forgotPassword);
authRouter.post('/reset-password', authRateLimiter, AuthController.resetPassword);

// Multi-Factor Authentication (Authenticated)
authRouter.post('/mfa/setup', authenticateToken, AuthController.setupMfa);
authRouter.post('/mfa/verify', authenticateToken, AuthController.verifyMfa);

// OAuth2 Endpoints
authRouter.get('/:provider(google|linkedin)', (req, res) => {
  const role = req.query.role || 'APPLICANT';
  const provider = req.params.provider;
  const callbackUrl = `/api/v1/auth/${provider}/callback?code=mock-oauth-code&provider=${provider}&role=${role}`;

  // If requested via JSON/XHR, return data envelope
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(200).json({
      data: {
        authUrl: callbackUrl,
      },
      error: null,
    });
  }

  // Otherwise direct browser to callback initiation
  return res.redirect(callbackUrl);
});
authRouter.get('/:provider(google|linkedin)/callback', AuthController.oauthCallback);
authRouter.post('/:provider(google|linkedin)/callback', AuthController.oauthCallback);

// Profile
authRouter.get('/me', authenticateToken, AuthController.me);

export default authRouter;
