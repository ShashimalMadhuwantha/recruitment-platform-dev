import rateLimit from 'express-rate-limit';
import { config } from '../config';

/**
 * General API limiter ceiling
 */
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

/**
 * Strict authentication limiter (prevents credential stuffing and brute-force)
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.NODE_ENV === 'development' ? 5000 : 20, // max 20 attempts per IP in production
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

/**
 * ATS scoring & resume parsing computational rate limiter (NFR-09, NFR-10)
 */
export const atsScoringRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: config.NODE_ENV === 'development' ? 5000 : 60, // max 60 calculations per minute
  skip: () => config.NODE_ENV === 'development',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    data: null,
    error: {
      code: 'ATS_RATE_LIMIT_EXCEEDED',
      message: 'ATS scoring calculation rate limit exceeded, please slow down your requests.',
    },
  },
});

/**
 * Public search query rate limiter (prevents scraping of jobs and directory)
 */
export const publicSearchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: config.NODE_ENV === 'development' ? 5000 : 120, // max 120 searches per minute
  skip: () => config.NODE_ENV === 'development',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    data: null,
    error: {
      code: 'SEARCH_RATE_LIMIT_EXCEEDED',
      message: 'Search query rate limit exceeded, please try again in a few seconds.',
    },
  },
});
