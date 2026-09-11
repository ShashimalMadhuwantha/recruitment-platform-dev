import { Request, Response, NextFunction } from 'express';
import { JobSearchService } from './job-search.service';
import type { JobSearchFilters } from '@recruitment-platform/shared';

const jobSearchService = new JobSearchService();

export class JobSearchController {
  /**
   * GET /api/v1/jobs
   * Public (with optional auth context) job search & discovery
   */
  async searchJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: JobSearchFilters = {
        keyword: req.query.keyword as string | undefined,
        location: req.query.location as string | undefined,
        employmentType: req.query.employmentType as any,
        minSalary: req.query.minSalary ? Number(req.query.minSalary) : undefined,
        maxSalary: req.query.maxSalary ? Number(req.query.maxSalary) : undefined,
        remoteOnly: req.query.remoteOnly === 'true' || req.query.remoteOnly === '1',
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 12,
      };

      const result = await jobSearchService.searchPublishedJobs(filters, req.user?.id);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/jobs/:id
   * Public (with optional auth context) job details
   */
  async getJobDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await jobSearchService.getPublishedJobDetails(req.params.id, req.user?.id);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/jobs/:id/save
   * Bookmark / save a vacancy
   */
  async toggleSaveJob(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await jobSearchService.toggleSaveJob(req.params.id, req.user!.id);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/jobs/:id/save
   * Remove a vacancy from bookmarks
   */
  async unsaveJob(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await jobSearchService.unsaveJob(req.params.id, req.user!.id);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/jobs/saved
   * Get applicant's bookmarked vacancies
   */
  async getSavedJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await jobSearchService.getSavedJobs(req.user!.id);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }
}

export default new JobSearchController();
