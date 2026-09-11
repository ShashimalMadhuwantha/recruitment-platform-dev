import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const apiRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.NODE_ENV === 'development' ? 50000 : config.RATE_LIMIT_MAX,
  skip: () => config.NODE_ENV === 'development',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    data: null,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.NODE_ENV === 'development' ? 5000 : 20, // max 20 login/register attempts per IP in production
  skip: () => config.NODE_ENV === 'development',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    data: null,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.',
    },
  },
});

