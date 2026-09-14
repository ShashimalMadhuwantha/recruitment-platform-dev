import React from 'react';
import { Building2, Sparkles, ArrowLeft, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useCompanyProfile } from '../../features/company-team/hooks';
import { CompanyBrandingForm } from '../../features/company-team/components/CompanyBrandingForm';

export const CompanyProfilePage: React.FC = () => {
  const { data: profile, isLoading, error, refetch } = useCompanyProfile();

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <div className="h-44 bg-surface rounded-2xl animate-pulse border border-border-default" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-96 bg-surface rounded-2xl animate-pulse border border-border-default" />
          <div className="h-96 bg-surface rounded-2xl animate-pulse border border-border-default" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-surface rounded-2xl border border-border-default text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-text-primary">
          Unable to Load Company Profile
        </h2>
        <p className="text-xs text-text-secondary">
          We encountered an issue retrieving your employer branding details.
        </p>
        <Button variant="primary" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/recruiter/team"
              className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Team Settings</span>
            </Link>
            <span className="text-xs text-text-muted">/</span>
            <span className="text-xs font-semibold text-brand-600">Company Branding</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Employer Branding & Workplace Identity
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Configure your company bio, cover photos, multi-city office directory, and culture media displayed to job applicants.
          </p>
        </div>

        <Link to="/recruiter/team">
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Manage Team Seats</span>
          </Button>
        </Link>
      </div>

      {/* Main Branding Form */}
      <CompanyBrandingForm profile={profile} />
    </div>
  );
};

export default CompanyProfilePage;
