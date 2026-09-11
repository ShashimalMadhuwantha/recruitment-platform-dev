import { Request, Response, NextFunction } from 'express';
import { talentPoolService } from './talent-pool.service';

export class TalentPoolController {
  /**
   * GET /api/v1/talent-pool
   * Search talent directory (recruiter only)
   */
  async searchTalentPool(req: Request, res: Response, next: NextFunction) {
    try {
      const skillsQuery = req.query.skills;
      const skills = typeof skillsQuery === 'string' ? skillsQuery.split(',') : (skillsQuery as string[]);

      const result = await talentPoolService.searchTalentPool(
        req.user!.id,
        req.user!.role,
        {
          search: req.query.search as string,
          skills,
          location: req.query.location as string,
          minExperience: req.query.minExperience ? Number(req.query.minExperience) : undefined,
          page: req.query.page ? Number(req.query.page) : 1,
          limit: req.query.limit ? Number(req.query.limit) : 12,
        }
      );

      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }
}

export const talentPoolController = new TalentPoolController();
