import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError } from './error.middleware';
import { AuthenticatedUser, UserRole, UserStatus } from '@recruitment-platform/shared';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticateToken = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return next(new UnauthorizedError('Missing authentication token'));
  }

  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as {
      userId: string;
      email: string;
      role: UserRole;
      status: UserStatus;
      companyId?: string | null;
    };

    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      status: payload.status,
      companyId: payload.companyId,
    };

    next();
  } catch {
    return next(new UnauthorizedError('Invalid or expired authentication token'));
  }
};
