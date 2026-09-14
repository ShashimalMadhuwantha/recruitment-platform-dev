import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRole } from '@recruitment-platform/shared';
import { Button } from '../ui/Button';

import { NotificationBell } from './NotificationBell';

export interface HeaderProps {
  userRole?: UserRole;
  userEmail?: string;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ userRole, userEmail, onLogout }) => {
  const navigate = useNavigate();

  const getRoleAccent = (role?: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-role-admin text-white';
      case 'RECRUITER':
        return 'bg-role-recruiter text-white';
      case 'APPLICANT':
        return 'bg-role-applicant text-white';
      default:
        return 'bg-brand-600 text-white';
    }
  };

  return (
    <header className="h-16 bg-surface border-b border-border-default px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-lg">
            A
          </div>
          <span className="font-semibold text-lg text-brand-900 tracking-tight">
            ATS Platform
          </span>
        </Link>

        {userRole && (
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getRoleAccent(userRole)}`}
          >
            {userRole.replace('_', ' ')}
          </span>
        )}

        {userRole === 'SUPER_ADMIN' && (
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              to="/admin/dashboard"
              className="px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              Overview
            </Link>
            <Link
              to="/admin/companies"
              className="px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              Companies
            </Link>
            <Link
              to="/admin/users"
              className="px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              Users
            </Link>
            <Link
              to="/admin/plans"
              className="px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              Plans
            </Link>
            <Link
              to="/admin/moderation"
              className="px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              Moderation
            </Link>
            <Link
              to="/admin/config"
              className="px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              Configuration
            </Link>
          </nav>
        )}

        {userRole === 'RECRUITER' && (
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              to="/recruiter/jobs"
              className="px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              Job Vacancies
            </Link>
            <Link
              to="/recruiter/jobs/new"
              className="px-3 py-1.5 rounded-md text-brand-600 hover:text-brand-700 hover:bg-brand-50 font-semibold transition-colors"
            >
              + Post Job
            </Link>
            <Link
              to="/recruiter/pipeline"
              className="px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              Pipeline
            </Link>
            <Link
              to="/recruiter/talent-pool"
              className="px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              Talent Pool
            </Link>
            <Link
              to="/recruiter/analytics"
              className="px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              Analytics
            </Link>
          </nav>
        )}

        {userRole === 'APPLICANT' && (
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              to="/jobs"
              className="px-3 py-1.5 rounded-md text-brand-600 hover:text-brand-700 hover:bg-brand-50 font-semibold transition-colors"
            >
              Find Jobs
            </Link>
            <Link
              to="/applicant/dashboard"
              className="px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/applicant/profile"
              className="px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              My Profile
            </Link>
            <Link
              to="/applicant/profile?tab=resume"
              className="px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              Resume / CV
            </Link>
          </nav>
        )}
      </div>

      <div className="flex items-center gap-3">
        {userEmail ? (
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="text-xs text-text-secondary">{userEmail}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout || (() => navigate('/auth/login'))}
            >
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth/login')}>
              Sign In
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/auth/register')}>
              Get Started
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
