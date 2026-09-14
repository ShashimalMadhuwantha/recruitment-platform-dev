import { Request, Response, NextFunction } from 'express';
import { ApplicantPrivacyService } from './applicant-privacy.service';
import {
  updateNotificationPreferencesSchema,
  blockCompanySchema,
  requestAccountErasureSchema,
} from './applicant-privacy.types';
import { UnauthorizedError } from '../../middleware/error.middleware';

export class ApplicantPrivacyController {
  /**
   * Get applicant notification preferences (FR-AP-28)
   */
  static async getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError('Authentication required');
      }
      const data = await ApplicantPrivacyService.getPreferences(req.user.id);
      res.status(200).json({ data, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update applicant notification preferences (FR-AP-28)
   */
  static async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError('Authentication required');
      }
      const input = updateNotificationPreferencesSchema.parse(req.body);
      const data = await ApplicantPrivacyService.updatePreferences(req.user.id, input);
      res.status(200).json({ data, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get blocked companies list for applicant (FR-AP-30)
   */
  static async getBlockedCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError('Authentication required');
      }
      const data = await ApplicantPrivacyService.getBlockedCompanies(req.user.id);
      res.status(200).json({ data, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Block a company (FR-AP-30)
   */
  static async blockCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError('Authentication required');
      }
      const input = blockCompanySchema.parse(req.body);
      const data = await ApplicantPrivacyService.blockCompany(
        req.user.id,
        input.companyId,
        input.reason
      );
      res.status(201).json({ data, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Unblock a company (FR-AP-30)
   */
  static async unblockCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError('Authentication required');
      }
      const { companyId } = req.params;
      const data = await ApplicantPrivacyService.unblockCompany(req.user.id, companyId);
      res.status(200).json({ data, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Export all personal applicant data (GDPR Portability FR-AP-29)
   */
  static async exportPersonalData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError('Authentication required');
      }
      const data = await ApplicantPrivacyService.exportPersonalData(req.user.id);

      if (req.query.download === 'true') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="applicant-data-${req.user.id}.json"`
        );
        res.send(JSON.stringify(data, null, 2));
        return;
      }

      res.status(200).json({ data, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Request account erasure / deletion (GDPR Right to Erasure FR-AP-29, UC-14)
   */
  static async requestAccountErasure(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError('Authentication required');
      }
      const input = requestAccountErasureSchema.parse(req.body);
      const data = await ApplicantPrivacyService.requestAccountErasure(
        req.user.id,
        input.password,
        input.reason
      );
      res.status(201).json({ data, error: null });
    } catch (err) {
      next(err);
    }
  }
}
