import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../../db/client';
import { config } from '../../config';
import { BadRequestError, ConflictError, UnauthorizedError } from '../../middleware/error.middleware';
import { RegisterInput, LoginInput, AuthResponseData } from './auth.types';
import { UserRole, UserStatus } from '@prisma/client';

export class AuthService {
  static async register(input: RegisterInput): Promise<AuthResponseData> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('An account with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        role: input.role as UserRole,
        status: input.role === 'RECRUITER' ? UserStatus.PENDING_APPROVAL : UserStatus.ACTIVE,
        ...(input.role === 'APPLICANT' && {
          applicantProfile: {
            create: {
              firstName: input.firstName || '',
              lastName: input.lastName || '',
            },
          },
        }),
      },
    });

    const signOptions: SignOptions = {
      expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    };

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      config.JWT_SECRET,
      signOptions
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  static async login(input: LoginInput): Promise<AuthResponseData> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: { recruiterProfile: true },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
      throw new BadRequestError('Your account has been deactivated. Please contact support.');
    }

    const signOptions: SignOptions = {
      expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    };

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        companyId: user.recruiterProfile?.companyId || null,
      },
      config.JWT_SECRET,
      signOptions
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }
}
