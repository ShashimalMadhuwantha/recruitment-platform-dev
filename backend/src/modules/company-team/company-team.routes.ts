import { Router } from 'express';
import { CompanyTeamController } from './company-team.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireRecruiter, requireCompanyAdmin } from '../../middleware/rbac.middleware';

export const companyRouter = Router();
export const teamRouter = Router();

// -------------------------------------------------------------
// Company Profile & Plan Quota Routes (/api/v1/company)
// -------------------------------------------------------------

companyRouter.get('/profile', authenticateToken, requireRecruiter, CompanyTeamController.getProfile);
companyRouter.patch('/profile', authenticateToken, requireCompanyAdmin, CompanyTeamController.updateProfile);
companyRouter.get('/plan-usage', authenticateToken, requireRecruiter, CompanyTeamController.getPlanUsage);
companyRouter.post('/request-upgrade', authenticateToken, requireCompanyAdmin, CompanyTeamController.requestPlanUpgrade);

// -------------------------------------------------------------
// Team & Invitation Routes (/api/v1/team)
// -------------------------------------------------------------

// Public token verification & onboarding
teamRouter.get('/invite/verify', CompanyTeamController.verifyInvitationToken);
teamRouter.post('/accept-invite', CompanyTeamController.acceptInvitation);

// Authenticated team governance
teamRouter.get('/', authenticateToken, requireRecruiter, CompanyTeamController.listTeamDirectory);
teamRouter.post('/invite', authenticateToken, requireCompanyAdmin, CompanyTeamController.inviteMember);
teamRouter.delete('/invite/:id', authenticateToken, requireCompanyAdmin, CompanyTeamController.revokeInvitation);
teamRouter.post('/invite/:id/resend', authenticateToken, requireCompanyAdmin, CompanyTeamController.resendInvitation);
teamRouter.patch('/members/:id', authenticateToken, requireCompanyAdmin, CompanyTeamController.updateMemberRole);
teamRouter.delete('/members/:id', authenticateToken, requireCompanyAdmin, CompanyTeamController.removeMember);

export default { companyRouter, teamRouter };
