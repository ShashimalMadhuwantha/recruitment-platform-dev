import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@recruitment-platform/shared';
import { ForbiddenError, UnauthorizedError } from './error.middleware';

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

export const requireSuperAdmin = requireRole('SUPER_ADMIN');
export const requireRecruiter = requireRole('RECRUITER');
export const requireApplicant = requireRole('APPLICANT');
