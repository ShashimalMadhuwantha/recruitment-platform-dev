import {
  AdminPlatformStats,
  CompanyStatus,
  UserRole,
  UserStatus,
  RecruiterSubRole,
  SubscriptionPlan,
  PaginatedResult,
} from '@recruitment-platform/shared';

export type { AdminPlatformStats, SubscriptionPlan, PaginatedResult };

export interface AdminCompany {
  id: string;
  name: string;
  slug: string;
  industry?: string | null;
  size?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  description?: string | null;
  status: CompanyStatus;
  planId?: string | null;
  plan?: SubscriptionPlan | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    recruiters: number;
    jobVacancies: number;
  };
  recruiters?: Array<{
    id: string;
    subRole: RecruiterSubRole;
    user: {
      id: string;
      email: string;
      status: UserStatus;
      createdAt: string;
    };
  }>;
  jobVacancies?: Array<{
    id: string;
    title: string;
    status: string;
    location?: string | null;
    employmentType: string;
    createdAt: string;
    _count?: {
      applications: number;
    };
  }>;
}

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  mfaEnabled: boolean;
  createdAt: string;
  applicantProfile?: {
    id: string;
    firstName: string;
    lastName: string;
    headline?: string | null;
    phone?: string | null;
  } | null;
  recruiterProfile?: {
    id: string;
    subRole: RecruiterSubRole;
    company?: {
      id: string;
      name: string;
      status: CompanyStatus;
    } | null;
  } | null;
}

export interface CompanyFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CompanyStatus;
}

export interface UserFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  companyId?: string;
}

export interface UpdateCompanyStatusPayload {
  status: CompanyStatus;
  notes?: string;
}

export interface UpdateUserStatusPayload {
  status: UserStatus;
  reason: string;
}

export interface AssignPlanPayload {
  planId: string;
}

export interface ImpersonationResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    mfaEnabled?: boolean;
    companyId?: string | null;
    recruiterSubRole?: RecruiterSubRole | null;
    isImpersonating: boolean;
    impersonatorId: string;
  };
  impersonatorId: string;
}
