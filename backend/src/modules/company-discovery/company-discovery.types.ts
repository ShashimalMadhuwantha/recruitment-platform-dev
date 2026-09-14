import { z } from 'zod';

export const companyDiscoveryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
  keyword: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  size: z.string().optional(),
  hasActiveJobs: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => {
      if (typeof val === 'string') {
        return val.toLowerCase() === 'true';
      }
      return Boolean(val);
    }),
  sortBy: z.enum(['name', 'activeJobs', 'followers', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CompanyDiscoveryQuery = z.infer<typeof companyDiscoveryQuerySchema>;

export const companyFollowToggleSchema = z.object({
  companyId: z.string().uuid('Company ID must be a valid UUID'),
});

export type CompanyFollowToggleInput = z.infer<typeof companyFollowToggleSchema>;
