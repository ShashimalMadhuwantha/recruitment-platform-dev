import { Request, Response, NextFunction } from 'express';
import { ModerationService } from './moderation.service';
import {
  ContentReportCreateSchema,
  ContentReportResolveSchema,
  ReportListQuerySchema,
  BannedKeywordCreateSchema,
  BannedKeywordTestSchema,
  AuditLogQuerySchema,
  GdprRequestCreateSchema,
  GdprRequestProcessSchema,
} from './moderation.types';

export class ModerationController {
  /**
   * 1. Get Moderation Stats
   */
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await ModerationService.getModerationStats();
      res.json({ data: stats, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 2. Create Content Report
   */
  static async createReport(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = ContentReportCreateSchema.parse(req.body);
      const reporterId = req.user?.id || null;
      const report = await ModerationService.createContentReport(reporterId, parsed);
      res.status(201).json({ data: report, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 3. List Reports
   */
  static async listReports(req: Request, res: Response, next: NextFunction) {
    try {
      const query = ReportListQuerySchema.parse(req.query);
      const reports = await ModerationService.listReports(query);
      res.json({ data: reports, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 4. Resolve Report
   */
  static async resolveReport(req: Request, res: Response, next: NextFunction) {
    try {
      const reportId = req.params.id;
      const parsed = ContentReportResolveSchema.parse(req.body);
      const moderatorId = req.user!.id;
      const resolved = await ModerationService.resolveReport(reportId, moderatorId, parsed);
      res.json({ data: resolved, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 5. Banned Keywords
   */
  static async listBannedKeywords(req: Request, res: Response, next: NextFunction) {
    try {
      const keywords = await ModerationService.listBannedKeywords();
      res.json({ data: keywords, error: null });
    } catch (err) {
      next(err);
    }
  }

  static async createBannedKeyword(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = BannedKeywordCreateSchema.parse(req.body);
      const keyword = await ModerationService.createBannedKeyword(parsed);
      res.status(201).json({ data: keyword, error: null });
    } catch (err) {
      next(err);
    }
  }

  static async deleteBannedKeyword(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const result = await ModerationService.deleteBannedKeyword(id);
      res.json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  static async testKeywords(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = BannedKeywordTestSchema.parse(req.body);
      const result = await ModerationService.testTextKeywords(parsed.text);
      res.json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 6. Audit Log System
   */
  static async listAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const query = AuditLogQuerySchema.parse(req.query);
      const logs = await ModerationService.listAuditLogs(query);
      res.json({ data: logs, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 7. GDPR Compliance
   */
  static async listGdprRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string | undefined;
      const list = await ModerationService.listGdprRequests(status);
      res.json({ data: list, error: null });
    } catch (err) {
      next(err);
    }
  }

  static async createGdprRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = GdprRequestCreateSchema.parse(req.body);
      const userId = req.user!.id;
      const request = await ModerationService.createGdprRequest(userId, parsed.requestType);
      res.status(201).json({ data: request, error: null });
    } catch (err) {
      next(err);
    }
  }

  static async processGdprRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const requestId = req.params.id;
      const parsed = GdprRequestProcessSchema.parse(req.body);
      const moderatorId = req.user!.id;
      const result = await ModerationService.processGdprRequest(requestId, moderatorId, parsed);
      res.json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }
}
