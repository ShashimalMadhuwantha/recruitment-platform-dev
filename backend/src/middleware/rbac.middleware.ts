import { Request, Response, NextFunction } from 'express';
import { UserRole, RecruiterSubRole, RecruiterPermissions } from '@recruitment-platform/shared';
import { ForbiddenError, UnauthorizedError } from './error.middleware';

/**
 * Checks if the authenticated user has one of the allowed global roles
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `User role '${req.user.role}' does not have access to this resource`
        )
      );
    }

    next();
  };
};

/**
 * Checks if the authenticated recruiter has one of the allowed recruiter sub-roles
 * Super Admins automatically bypass recruiter sub-role restrictions
 */
export const requireRecruiterSubRole = (...allowedSubRoles: RecruiterSubRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    // Super Admin bypasses company sub-role constraints
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (req.user.role !== 'RECRUITER') {
      return next(new ForbiddenError('Recruiter access required'));
    }

    const userSubRole = req.user.recruiterSubRole;
    if (!userSubRole || !allowedSubRoles.includes(userSubRole)) {
      return next(
        new ForbiddenError(
          `Recruiter sub-role '${userSubRole || 'NONE'}' does not have permission for this action`
        )
      );
    }

    next();
  };
};

// Convenience helpers
export const requireSuperAdmin = requireRole('SUPER_ADMIN');
export const requireRecruiter = requireRole('RECRUITER', 'SUPER_ADMIN');
export const requireApplicant = requireRole('APPLICANT');
export const requireCompanyAdmin = requireRecruiterSubRole('COMPANY_ADMIN');
export const requireHiringManager = requireRecruiterSubRole('COMPANY_ADMIN', 'HIRING_MANAGER');

/**
 * Checks if the authenticated recruiter has a specific granular permission flag enabled,
 * or is a COMPANY_ADMIN / SUPER_ADMIN (which bypasses granular permission flags).
 */
export const requireRecruiterPermission = (permissionKey: keyof RecruiterPermissions) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (req.user.role !== 'RECRUITER') {
      return next(new ForbiddenError('Recruiter access required'));
    }

    // Company Admin has all recruiter permissions enabled by default
    if (req.user.recruiterSubRole === 'COMPANY_ADMIN') {
      return next();
    }

    const permissions = (req.user.recruiterPermissions as Partial<RecruiterPermissions> | undefined) || {};
    if (permissions[permissionKey] === true) {
      return next();
    }

    // Check subrole defaults if permission flag not explicitly overridden
    if (req.user.recruiterSubRole === 'HIRING_MANAGER') {
      const hiringManagerDefaults: (keyof RecruiterPermissions)[] = [
        'canCreateJobs',
        'canEditJobs',
        'canDeleteJobs',
        'canViewCandidateSalary',
        'canAdvancePipeline',
        'canScheduleInterviews',
        'canSubmitScorecards',
        'canExtendOffers',
        'canViewAnalytics',
      ];
      if (hiringManagerDefaults.includes(permissionKey) && permissions[permissionKey] !== false) {
        return next();
      }
    } else if (req.user.recruiterSubRole === 'INTERVIEWER') {
      const interviewerDefaults: (keyof RecruiterPermissions)[] = [
        'canScheduleInterviews',
        'canSubmitScorecards',
      ];
      if (interviewerDefaults.includes(permissionKey) && permissions[permissionKey] !== false) {
        return next();
      }
    }

    return next(
      new ForbiddenError(`Missing required permission: '${permissionKey}'`)
    );
  };
};

