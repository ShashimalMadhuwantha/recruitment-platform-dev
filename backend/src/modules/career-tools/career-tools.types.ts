import { z } from 'zod';

export const runCvHealthCheckSchema = z.object({
  cvId: z.string().uuid().optional(),
});

export type RunCvHealthCheckInput = z.infer<typeof runCvHealthCheckSchema>;
