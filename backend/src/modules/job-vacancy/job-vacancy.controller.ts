import { Request, Response, NextFunction } from 'express';
import { JobVacancyService } from './job-vacancy.service';
import {
  createJobVacancySchema,
  updateJobVacancySchema,
  updateJobStatusSchema,
  complianceCheckSchema,
} from './job-vacancy.types';
import { JobStatus } from '@prisma/client';

const jobVacancyService = new JobVacancyService();

export class JobVacancyController {
  async listJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, status, page, limit } = req.query;
      const result = await jobVacancyService.listCompanyJobs(req.user!.id, req.user!.role, {
        search: typeof search === 'string' ? search : undefined,
        status: typeof status === 'string' && Object.values(JobStatus).includes(status as JobStatus)
          ? (status as JobStatus)
          : undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
      });

      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async getJob(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await jobVacancyService.getJobDetails(req.params.id, req.user!.id, req.user!.role);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async createJob(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createJobVacancySchema.parse(req.body);
      const result = await jobVacancyService.createJobVacancy(validated as any, req.user!.id, req.user!.role);
      return res.status(201).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async updateJob(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateJobVacancySchema.parse(req.body);
      const result = await jobVacancyService.updateJobVacancy(req.params.id, validated as any, req.user!.id, req.user!.role);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateJobStatusSchema.parse(req.body);
      const result = await jobVacancyService.updateJobStatus(req.params.id, validated.status, req.user!.id, req.user!.role);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async cloneJob(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await jobVacancyService.cloneJobVacancy(req.params.id, req.user!.id, req.user!.role);
      return res.status(201).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async deleteJob(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await jobVacancyService.deleteJobVacancy(req.params.id, req.user!.id, req.user!.role);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async checkCompliance(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = complianceCheckSchema.parse(req.body);
      const result = await jobVacancyService.checkCompliance(validated.title, validated.description);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }
}
