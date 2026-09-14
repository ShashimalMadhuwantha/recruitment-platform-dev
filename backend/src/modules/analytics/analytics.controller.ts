import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';
import {
  analyticsFilterQuerySchema,
  exportFilterQuerySchema,
  submitDiversitySurveySchema,
} from './analytics.types';
import { ForbiddenError, BadRequestError } from '../../middleware/error.middleware';
import { prisma } from '../../db/client';

export class AnalyticsController {
  /**
   * Helper to resolve the active companyId for the authenticated recruiter or super admin
   */
  private async resolveCompanyId(req: Request): Promise<string> {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    if (req.user.companyId) {
      return req.user.companyId;
    }

    // Super Admin can specify companyId via query
    if (req.user.role === 'SUPER_ADMIN' && req.query.companyId) {
      return String(req.query.companyId);
    }

    // Fallback: check recruiterProfile
    const profile = await prisma.recruiterProfile.findUnique({
      where: { userId: req.user.id },
      select: { companyId: true },
    });

    if (profile?.companyId) {
      return profile.companyId;
    }

    throw new ForbiddenError('User is not associated with an active company account');
  }

  getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = await this.resolveCompanyId(req);
      const query = analyticsFilterQuerySchema.parse(req.query);

      const summary = await analyticsService.getCompanySummary(companyId, query);
      res.status(200).json({ data: summary, error: null });
    } catch (err) {
      next(err);
    }
  };

  getFunnel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = await this.resolveCompanyId(req);
      const query = analyticsFilterQuerySchema.parse(req.query);

      const funnel = await analyticsService.getFunnelMetrics(companyId, query);
      res.status(200).json({ data: funnel, error: null });
    } catch (err) {
      next(err);
    }
  };

  getSources = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = await this.resolveCompanyId(req);
      const query = analyticsFilterQuerySchema.parse(req.query);

      const sources = await analyticsService.getSourceAttribution(companyId, query);
      res.status(200).json({ data: sources, error: null });
    } catch (err) {
      next(err);
    }
  };

  getVelocity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = await this.resolveCompanyId(req);
      const query = analyticsFilterQuerySchema.parse(req.query);

      const velocity = await analyticsService.getApplicationVelocity(companyId, query);
      res.status(200).json({ data: velocity, error: null });
    } catch (err) {
      next(err);
    }
  };

  getScoreDistribution = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = await this.resolveCompanyId(req);
      const query = analyticsFilterQuerySchema.parse(req.query);

      const distribution = await analyticsService.getScoreDistribution(companyId, query);
      res.status(200).json({ data: distribution, error: null });
    } catch (err) {
      next(err);
    }
  };

  getDiversity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = await this.resolveCompanyId(req);
      const jobId = req.query.jobId ? String(req.query.jobId) : undefined;

      const diversity = await analyticsService.getDiversityAnalytics(companyId, { jobId });
      res.status(200).json({ data: diversity, error: null });
    } catch (err) {
      next(err);
    }
  };

  exportReports = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = await this.resolveCompanyId(req);
      const query = exportFilterQuerySchema.parse(req.query);

      const reportData = await analyticsService.exportCandidateReports(companyId, query);

      if (query.format === 'csv') {
        const csvContent = analyticsService.generateCsvReport(reportData.candidates);
        const filename = `candidate-pipeline-export-${new Date().toISOString().substring(0, 10)}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.status(200).send(csvContent);
      }

      res.status(200).json({ data: reportData, error: null });
    } catch (err) {
      next(err);
    }
  };

  submitDiversitySurvey = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedBody = submitDiversitySurveySchema.safeParse(req.body);
      if (!parsedBody.success) {
        throw new BadRequestError('Invalid diversity survey payload', parsedBody.error.format());
      }

      const result = await analyticsService.submitDiversitySurvey(parsedBody.data);
      res.status(201).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  };
}

export const analyticsController = new AnalyticsController();
