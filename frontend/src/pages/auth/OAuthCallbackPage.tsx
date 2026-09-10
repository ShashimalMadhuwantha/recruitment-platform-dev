import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../app/providers';
import { UserRole } from '@recruitment-platform/shared';

export const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const role = (searchParams.get('role') as UserRole) || 'APPLICANT';
    const email = searchParams.get('email') || 'user@example.com';
    const userId = searchParams.get('userId') || 'oauth-user-id';

    if (token && refreshToken) {
      const user = {
        id: userId,
        email,
        role,
        status: 'ACTIVE' as const,
        mfaEnabled: false,
      };

      login(token, refreshToken, user);

      if (role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === 'RECRUITER') {
        navigate('/recruiter/dashboard', { replace: true });
      } else {
        navigate('/applicant/dashboard', { replace: true });
      }
    } else {
      navigate('/auth/login', { replace: true });
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-primary">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
        <p className="text-sm font-medium text-text-secondary">Signing you in, please wait...</p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
