import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { UserRole, RecruiterSubRole } from '@recruitment-platform/shared';
import { useAuth } from '../../app/providers';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  allowedSubRoles?: RecruiterSubRole[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  allowedSubRoles,
  children,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-primary">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
          <p className="text-sm font-medium text-text-secondary">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check Role
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect user to their own role-based dashboard if they don't have access to this section
    if (user.role === 'APPLICANT') {
      return <Navigate to="/applicant/dashboard" replace />;
    }
    if (user.role === 'RECRUITER') {
      return <Navigate to="/recruiter/dashboard" replace />;
    }
    if (user.role === 'SUPER_ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/auth/login" replace />;
  }

  // Check Recruiter Sub-Role if applicable
  if (
    user.role === 'RECRUITER' &&
    allowedSubRoles &&
    allowedSubRoles.length > 0 &&
    (!user.recruiterSubRole || !allowedSubRoles.includes(user.recruiterSubRole))
  ) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-primary px-4 text-center">
        <div className="max-w-md rounded-lg border border-border-default bg-surface-card p-6 shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-text-primary">Access Restricted</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Your recruiter account does not have sufficient permissions to view this section ({allowedSubRoles.join(', ')} required).
          </p>
          <div className="mt-6">
            <a
              href="/recruiter/dashboard"
              className="inline-flex items-center justify-center rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary-hover"
            >
              Back to Recruiter Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
