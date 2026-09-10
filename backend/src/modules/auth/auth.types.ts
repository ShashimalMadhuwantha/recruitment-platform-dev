import { z } from 'zod';

export type UserRole = 'SUPER_ADMIN' | 'RECRUITER' | 'APPLICANT';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['SUPER_ADMIN', 'RECRUITER', 'APPLICANT']).default('APPLICANT'),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  companyName: z.string().min(2, 'Company name is required for recruiters').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export interface AuthResponseData {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
  token: string;
}
