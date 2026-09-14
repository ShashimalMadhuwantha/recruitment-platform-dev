import { Request, Response, NextFunction } from 'express';
import { CompanyTeamService } from './company-team.service';
import {
  updateCompanyProfileSchema,
  inviteTeamMemberSchema,
  updateTeamMemberSchema,
  removeTeamMemberSchema,
  acceptInvitationSchema,
  requestPlanUpgradeSchema,
} from './company-team.types';
import { BadRequestError } from '../../middleware/error.middleware';

export class CompanyTeamController {
  // -------------------------------------------------------------
  // Company Profile & Branding
  // -------------------------------------------------------------

  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        throw new BadRequestError('User is not associated with any company.');
      }

      const profile = await CompanyTeamService.getCompanyProfile(companyId);
      res.status(200).json({ data: profile, error: null });
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        throw new BadRequestError('User is not associated with any company.');
      }

      const validated = updateCompanyProfileSchema.parse(req.body);
      const updated = await CompanyTeamService.updateCompanyProfile(companyId, validated, req.user!.id);
      res.status(200).json({ data: updated, error: null });
    } catch (err) {
      next(err);
    }
  }

  // -------------------------------------------------------------
  // Subscription Plan Usage & Upgrades
  // -------------------------------------------------------------

  static async getPlanUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        throw new BadRequestError('User is not associated with any company.');
      }

      const usage = await CompanyTeamService.getPlanUsage(companyId);
      res.status(200).json({ data: usage, error: null });
    } catch (err) {
      next(err);
    }
  }

  static async requestPlanUpgrade(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        throw new BadRequestError('User is not associated with any company.');
      }

      const validated = requestPlanUpgradeSchema.parse(req.body);
      const result = await CompanyTeamService.requestPlanUpgrade(companyId, validated, req.user!.id);
      res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  // -------------------------------------------------------------
  // Team Directory & Invitations
  // -------------------------------------------------------------

  static async listTeamDirectory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        throw new BadRequestError('User is not associated with any company.');
      }

      const directory = await CompanyTeamService.listTeamDirectory(companyId);
      res.status(200).json({ data: directory, error: null });
    } catch (err) {
      next(err);
    }
  }

  static async inviteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        throw new BadRequestError('User is not associated with any company.');
      }

      const validated = inviteTeamMemberSchema.parse(req.body);
      const invitation = await CompanyTeamService.inviteTeamMember(companyId, validated, req.user!.id);
      res.status(201).json({ data: invitation, error: null });
    } catch (err) {
      next(err);
    }
  }

  static async revokeInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        throw new BadRequestError('User is not associated with any company.');
      }

      const result = await CompanyTeamService.revokeInvitation(companyId, req.params.id, req.user!.id);
      res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  static async resendInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        throw new BadRequestError('User is not associated with any company.');
      }

      const invitation = await CompanyTeamService.resendInvitation(companyId, req.params.id, req.user!.id);
      res.status(200).json({ data: invitation, error: null });
    } catch (err) {
      next(err);
    }
  }

  static async verifyInvitationToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.query.token as string;
      if (!token) {
        throw new BadRequestError('Token parameter is required.');
      }

      const result = await CompanyTeamService.verifyInvitationToken(token);
      res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  static async acceptInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = acceptInvitationSchema.parse(req.body);
      const result = await CompanyTeamService.acceptInvitation(validated);
      res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  static async updateMemberRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        throw new BadRequestError('User is not associated with any company.');
      }

      const validated = updateTeamMemberSchema.parse(req.body);
      const member = await CompanyTeamService.updateMemberRole(companyId, req.params.id, validated, req.user!.id);
      res.status(200).json({ data: member, error: null });
    } catch (err) {
      next(err);
    }
  }

  static async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        throw new BadRequestError('User is not associated with any company.');
      }

      const validated = removeTeamMemberSchema.parse(req.body);
      const result = await CompanyTeamService.removeTeamMember(
        companyId,
        req.params.id,
        validated.transferRequisitionsToUserId,
        req.user!.id
      );
      res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }
}
