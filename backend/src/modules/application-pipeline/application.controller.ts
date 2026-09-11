import { Request, Response, NextFunction } from 'express';
import { ApplicationService } from './application.service';

const applicationService = new ApplicationService();

export class ApplicationController {
  /**
   * POST /api/v1/applications
   * Submit an application
   */
  async submitApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await applicationService.submitApplication(req.body, req.user!.id);
      return res.status(201).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/applications/my-applications
   * List authenticated applicant's applications
   */
  async getMyApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await applicationService.getMyApplications(req.user!.id);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/applications/:id
   * Get single application details
   */
  async getApplicationById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await applicationService.getApplicationById(
        req.params.id,
        req.user!.id,
        req.user!.role
      );
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/applications/:id/withdraw
   * Withdraw an active application
   */
  async withdrawApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await applicationService.withdrawApplication(
        req.params.id,
        req.user!.id,
        req.body?.reason
      );
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }
}

export default new ApplicationController();
