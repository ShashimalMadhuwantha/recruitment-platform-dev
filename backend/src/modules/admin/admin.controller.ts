import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import {
  companyListQuerySchema,
  companyStatusUpdateSchema,
  assignPlanSchema,
  userListQuerySchema,
  userStatusUpdateSchema,
  impersonateUserSchema,
} from './admin.types';

export class AdminController {
  /**
   * Get Platform KPIs & Overview Stats
   */
  static async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.getPlatformStats();
      return res.status(200).json({ data: stats, error: null });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List Companies
   */
  static async listCompanies(req: Request, res: Response, next: NextFunction) {
    try {
      const query = companyListQuerySchema.parse(req.query);
      const result = await AdminService.listCompanies(query);
      return res.status(200).json({ data: result, error: null });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Company Details
   */
  static async getCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await AdminService.getCompanyDetails(req.params.id);
      return res.status(200).json({ data: company, error: null });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Company Status (Approve / Reject / Suspend)
   */
  static async updateCompanyStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const input = companyStatusUpdateSchema.parse(req.body);
      const actorId = req.user!.id;
      const result = await AdminService.updateCompanyStatus(req.params.id, actorId, input);
      return res.status(200).json({ data: result, error: null });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List Subscription Plans
   */
  static async listPlans(_req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await AdminService.listSubscriptionPlans();
      return res.status(200).json({ data: plans, error: null });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign Subscription Plan to Company
   */
  static async assignPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const input = assignPlanSchema.parse(req.body);
      const actorId = req.user!.id;
      const result = await AdminService.assignCompanyPlan(req.params.id, actorId, input);
      return res.status(200).json({ data: result, error: null });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Global User Directory
   */
  static async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const query = userListQuerySchema.parse(req.query);
      const result = await AdminService.listUsers(query);
      return res.status(200).json({ data: result, error: null });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update User Status (Suspend / Ban / Reinstate)
   */
  static async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const input = userStatusUpdateSchema.parse(req.body);
      const actorId = req.user!.id;
      const result = await AdminService.updateUserStatus(req.params.id, actorId, input);
      return res.status(200).json({ data: result, error: null });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Super Admin Impersonation
   */
  static async impersonateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = impersonateUserSchema.parse(req.body || {});
      const adminActorId = req.user!.id;
      const result = await AdminService.generateImpersonationToken(
        req.params.userId,
        adminActorId,
        reason
      );
      return res.status(200).json({ data: result, error: null });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List Audit Logs
   */
  static async listAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10)) : 1;
      const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10))) : 20;
      const result = await AdminService.listAuditLogs(page, limit);
      return res.status(200).json({ data: result, error: null });
    } catch (error) {
      next(error);
    }
  }
}
