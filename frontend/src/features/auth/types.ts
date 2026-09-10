import { UserRole, RecruiterSubRole, UserStatus } from '@recruitment-platform/shared';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  mfaEnabled: boolean;
  companyId?: string | null;
  recruiterSubRole?: RecruiterSubRole | null;
  applicantProfileId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  isImpersonating?: boolean;
  impersonatorId?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export interface AuthResponseData {
  user: AuthUser;
  tokens: AuthTokens;
  requiresMfa?: boolean;
  tempToken?: string;
}

export interface RegisterApplicantPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  headline?: string;
}

export interface RegisterRecruiterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  companyIndustry?: string;
  companySize?: string;
  companyWebsite?: string;
  subRole?: RecruiterSubRole;
}
