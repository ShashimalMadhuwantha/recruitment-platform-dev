import { Request, Response, NextFunction } from 'express';
import { CompanyDiscoveryService } from './company-discovery.service';
import { companyDiscoveryQuerySchema } from './company-discovery.types';
import { BadRequestError } from '../../middleware/error.middleware';

export class CompanyDiscoveryController {
  /**
   * Search and filter companies in public directory (FR-AP-31)
   */
  static async searchCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedQuery = companyDiscoveryQuerySchema.parse(req.query);
      const currentUserId = req.user?.id;
      const result = await CompanyDiscoveryService.searchCompanies(parsedQuery, currentUserId);
      res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get public employer profile (FR-AP-32)
   */
  static async getCompanyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idOrSlug } = req.params;
      if (!idOrSlug) {
        throw new BadRequestError('Company identifier (id or slug) is required.');
      }
      const currentUserId = req.user?.id;
      const company = await CompanyDiscoveryService.getCompanyBySlugOrId(idOrSlug, currentUserId);
      res.status(200).json({ data: company, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get active job vacancies for company with predicted ATS score (FR-AP-33)
   */
  static async getCompanyJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idOrSlug } = req.params;
      if (!idOrSlug) {
        throw new BadRequestError('Company identifier (id or slug) is required.');
      }
      const currentUserId = req.user?.id;
      const result = await CompanyDiscoveryService.getCompanyJobs(idOrSlug, currentUserId);
      res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Toggle follow/unfollow company (FR-AP-35)
   */
  static async toggleFollow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        throw new BadRequestError('Company ID is required.');
      }
      const applicantUserId = req.user?.id;
      if (!applicantUserId) {
        throw new BadRequestError('User is not authenticated.');
      }
      const result = await CompanyDiscoveryService.toggleFollowCompany(applicantUserId, id);
      res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get companies followed by current applicant (FR-AP-35)
   */
  static async getFollowedCompanies(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const applicantUserId = req.user?.id;
      if (!applicantUserId) {
        throw new BadRequestError('User is not authenticated.');
      }
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 12;

      const result = await CompanyDiscoveryService.getFollowedCompanies(applicantUserId, page, limit);
      res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }
}
