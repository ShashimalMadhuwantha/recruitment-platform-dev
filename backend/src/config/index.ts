import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from current working directory, backend folder, and root folder
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.string().transform((val) => parseInt(val, 10)).default('900000'),
  RATE_LIMIT_MAX: z.string().transform((val) => parseInt(val, 10)).default('100'),
  ADMIN_INITIAL_EMAIL: z.string().email().default('admin@atsplatform.local'),
  ADMIN_INITIAL_PASSWORD: z.string().default('AdminSecurePassword123!'),
  // SMTP / Gmail Settings (Optional in dev, required to dispatch real emails)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform((val) => parseInt(val, 10)).optional(),
  SMTP_SECURE: z.string().transform((val) => val === 'true').optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('RecruitATS <noreply@recruitats.com>'),
});

const parseEnv = () => {
  if (process.env.NODE_ENV === 'test') {
    return {
      NODE_ENV: 'test' as const,
      PORT: 5000,
      FRONTEND_URL: 'http://localhost:5173',
      DATABASE_URL: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/recruitment_ats_test_db',
      JWT_SECRET: process.env.JWT_SECRET || 'test-secret-key-1234567890123456',
      JWT_EXPIRES_IN: '1d',
      CORS_ORIGIN: 'http://localhost:5173',
      RATE_LIMIT_WINDOW_MS: 900000,
      RATE_LIMIT_MAX: 1000,
      ADMIN_INITIAL_EMAIL: 'admin@atsplatform.local',
      ADMIN_INITIAL_PASSWORD: 'AdminSecurePassword123!',
      SMTP_FROM: 'RecruitATS <noreply@recruitats.com>',
    };
  }

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.format());
    throw new Error('Environment configuration validation failed');
  }
  return result.data;
};

export const config = parseEnv();
export default config;
