import { Request, Response, NextFunction } from 'express';
import { offersService } from './offers.service';
import {
  createOfferSchema,
  respondOfferSchema,
  hireCandidateSchema,
} from './offers.types';

export class OffersController {
  static async getApplicationOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = req.params;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;

      const offer = await offersService.getApplicationOffer(applicationId, userId, userRole);
      return res.status(200).json({
        success: true,
        data: offer,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createOrUpdateOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = req.params;
      const recruiterId = (req as any).user.id;
      const recruiterRole = (req as any).user.role;

      const validated = createOfferSchema.parse(req.body);
      const offer = await offersService.createOrUpdateOffer(
        applicationId,
        recruiterId,
        recruiterRole,
        validated
      );

      return res.status(200).json({
        success: true,
        data: offer,
        message: 'Offer draft saved successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  static async sendOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const targetId = req.params.applicationId || req.params.offerId;
      const recruiterId = (req as any).user.id;
      const recruiterRole = (req as any).user.role;

      const offer = await offersService.sendOffer(targetId, recruiterId, recruiterRole);
      return res.status(200).json({
        success: true,
        data: offer,
        message: 'Offer officially extended to candidate.',
      });
    } catch (err) {
      next(err);
    }
  }

  static async respondToOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const { offerId } = req.params;
      const applicantUserId = (req as any).user.id;

      const validated = respondOfferSchema.parse(req.body);
      const offer = await offersService.respondToOffer(offerId, applicantUserId, validated);

      return res.status(200).json({
        success: true,
        data: offer,
        message:
          validated.action === 'ACCEPT'
            ? 'Congratulations! You have accepted the job offer.'
            : 'You have declined the job offer.',
      });
    } catch (err) {
      next(err);
    }
  }

  static async markCandidateHired(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = req.params;
      const recruiterId = (req as any).user.id;
      const recruiterRole = (req as any).user.role;

      const validated = hireCandidateSchema.parse(req.body);
      const result = await offersService.markCandidateHired(
        applicationId,
        recruiterId,
        recruiterRole,
        validated
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
