import { z } from 'zod';

export const createOfferSchema = z.object({
  baseSalary: z.number().positive('Base salary must be positive'),
  currency: z.string().min(1).default('USD'),
  bonus: z.number().nonnegative().optional(),
  equity: z.string().trim().optional(),
  startDate: z.string().datetime({ message: 'Invalid start date format' }),
  expirationDate: z.string().datetime({ message: 'Invalid expiration date format' }),
  offerLetterText: z.string().trim().optional(),
  benefitsSummary: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  autoSend: z.boolean().default(false),
});

export type CreateOfferInput = z.infer<typeof createOfferSchema>;

export const respondOfferSchema = z.object({
  action: z.enum(['ACCEPT', 'DECLINE']),
  declinedReason: z.string().trim().optional(),
  signedName: z.string().trim().optional(),
});

export type RespondOfferInput = z.infer<typeof respondOfferSchema>;

export const hireCandidateSchema = z.object({
  closeRequisition: z.boolean().default(false),
  hireDate: z.string().datetime().optional(),
  notes: z.string().trim().optional(),
});

export type HireCandidateInput = z.infer<typeof hireCandidateSchema>;
