import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers';

export const ImpersonationBanner: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  if (!user || !user.isImpersonating) {
    return null;
  }

  const handleExitImpersonation = () => {
    const originalAccess = sessionStorage.getItem('admin_original_access');
    const originalRefresh = sessionStorage.getItem('admin_original_refresh');
    const originalUser = sessionStorage.getItem('admin_original_user');

    if (originalAccess && originalRefresh && originalUser) {
      try {
        const parsedAdmin = JSON.parse(originalUser);
        login(originalAccess, originalRefresh, parsedAdmin);
        sessionStorage.removeItem('admin_original_access');
        sessionStorage.removeItem('admin_original_refresh');
        sessionStorage.removeItem('admin_original_user');
        navigate('/admin/dashboard', { replace: true });
        return;
      } catch (e) {
        console.error('Failed to restore admin session', e);
      }
    }

    // Fallback if sessionStorage was cleared: go to login
    navigate('/auth/login', { replace: true });
  };

  return (
    <div
      data-testid="impersonation-banner"
      className="bg-amber-500 text-slate-900 px-4 py-2.5 flex items-center justify-between text-xs font-medium shadow-md sticky top-0 z-50 border-b border-amber-600"
    >
      <div className="flex items-center space-x-2">
        <svg
          className="w-4 h-4 text-slate-900 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span>
          <strong>Admin Impersonation Mode:</strong> Currently viewing the platform as{' '}
          <span className="font-bold underline">{user.email}</span> ({user.role})
        </span>
      </div>

      <button
        onClick={handleExitImpersonation}
        className="bg-slate-900 text-white hover:bg-slate-800 px-3 py-1 rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
      >
        Exit Impersonation
      </button>
    </div>
  );
};

export default ImpersonationBanner;
