import { Request, Response, NextFunction } from 'express';
import { careerToolsService } from './career-tools.service';

export class CareerToolsController {
  static async runCvHealthCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const cvId = req.query.cvId ? String(req.query.cvId) : undefined;

      const result = await careerToolsService.runCvHealthCheck(userId, cvId);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getProfileSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;

      const result = await careerToolsService.getProfileImprovementSuggestions(userId);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
