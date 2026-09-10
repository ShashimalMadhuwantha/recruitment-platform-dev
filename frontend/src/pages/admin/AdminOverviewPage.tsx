import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAdminStats } from '../../features/admin/hooks';

export const AdminOverviewPage: React.FC = () => {
  const { data: stats, isLoading, error } = useAdminStats();

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Super Admin Governance</h1>
          <p className="text-xs text-text-secondary mt-1">
            Platform-wide metrics, tenant management, and user access oversight.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/admin/companies">
            <Button variant="secondary" size="sm">
              Manage Companies
            </Button>
          </Link>
          <Link to="/admin/users">
            <Button variant="primary" size="sm">
              User Directory
            </Button>
          </Link>
        </div>
      </div>

      {/* Pending Approvals Alert Banner (if any) */}
      {stats && stats.pendingCompaniesCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-900">
                {stats.pendingCompaniesCount} Company {stats.pendingCompaniesCount === 1 ? 'Registration' : 'Registrations'} Pending Review
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                New employer accounts are waiting for Super Admin verification and onboarding approval.
              </p>
            </div>
          </div>
          <Link to="/admin/companies?status=PENDING_APPROVAL">
            <Button variant="primary" size="sm" className="bg-amber-600 hover:bg-amber-700 shrink-0">
              Review Pending &rarr;
            </Button>
          </Link>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-border-default space-y-2">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-medium uppercase tracking-wider">Total Users</span>
            <svg className="w-4 h-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {isLoading ? '...' : stats?.totalUsers || 0}
          </div>
          <p className="text-xs text-text-muted">
            {stats ? `${stats.totalApplicants} applicants · ${stats.totalRecruiters} recruiters` : 'Loading...'}
          </p>
        </Card>

        <Card className="p-5 border-border-default space-y-2">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-medium uppercase tracking-wider">Active Companies</span>
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {isLoading ? '...' : stats?.activeCompaniesCount || 0}
          </div>
          <p className="text-xs text-emerald-600 font-medium">
            {stats?.pendingCompaniesCount || 0} awaiting approval
          </p>
        </Card>

        <Card className="p-5 border-border-default space-y-2">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-medium uppercase tracking-wider">Job Postings</span>
            <svg className="w-4 h-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {isLoading ? '...' : stats?.totalJobsCount || 0}
          </div>
          <p className="text-xs text-text-muted">Across all active employers</p>
        </Card>

        <Card className="p-5 border-border-default space-y-2">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-medium uppercase tracking-wider">Registered Candidates</span>
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {isLoading ? '...' : stats?.totalApplicants || 0}
          </div>
          <p className="text-xs text-text-muted">Active job seekers</p>
        </Card>
      </div>

      {/* Navigation Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-4 hover:border-brand-primary transition-colors">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary">Company / Tenant Directory</h3>
            <p className="text-xs text-text-secondary mt-1">
              Review and approve pending employer onboarding requests, manage subscription plans, and inspect recruiter teams.
            </p>
          </div>
          <Link to="/admin/companies" className="inline-block text-xs font-semibold text-brand-primary hover:underline">
            Manage Companies &rarr;
          </Link>
        </Card>

        <Card className="p-6 space-y-4 hover:border-brand-primary transition-colors">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary">Global User Directory</h3>
            <p className="text-xs text-text-secondary mt-1">
              Search all candidates and recruiters, suspend/ban rule violators with audit reasons, and perform support impersonations.
            </p>
          </div>
          <Link to="/admin/users" className="inline-block text-xs font-semibold text-brand-primary hover:underline">
            Browse Users &rarr;
          </Link>
        </Card>

        <Card className="p-6 space-y-4 hover:border-brand-primary transition-colors">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary">Subscription Plans & Quotas</h3>
            <p className="text-xs text-text-secondary mt-1">
              Configure Free, Pro, and Enterprise tiers with custom limits for active jobs, team seats, and ATS monthly scans.
            </p>
          </div>
          <Link to="/admin/plans" className="inline-block text-xs font-semibold text-brand-primary hover:underline">
            View Plans &rarr;
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
