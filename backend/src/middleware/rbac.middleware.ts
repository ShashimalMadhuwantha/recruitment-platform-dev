import { Request, Response, NextFunction } from 'express';
import { UserRole, RecruiterSubRole } from '@recruitment-platform/shared';
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
