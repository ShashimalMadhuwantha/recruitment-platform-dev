import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Briefcase,
  MapPin,
  Users,
  Calendar,
  Globe,
} from 'lucide-react';
import {
  useCompanyProfile,
  useCompanyJobs,
  useToggleCompanyFollow,
} from '../../features/company-discovery/hooks';
import { CompanyHeroBanner } from '../../features/company-discovery/components/CompanyHeroBanner';
import { CompanyCultureGallery } from '../../features/company-discovery/components/CompanyCultureGallery';
import { CompanyLocationsList } from '../../features/company-discovery/components/CompanyLocationsList';
import { CompanyActiveJobsList } from '../../features/company-discovery/components/CompanyActiveJobsList';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../app/providers';

export const CompanyPublicProfilePage: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'locations'>('overview');

  const {
    data: company,
    isLoading: isProfileLoading,
    error: profileError,
  } = useCompanyProfile(idOrSlug || '');

  const {
    data: jobsData,
    isLoading: isJobsLoading,
  } = useCompanyJobs(idOrSlug || '');

  const toggleFollowMutation = useToggleCompanyFollow();

  if (isProfileLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Spinner size="lg" />
        <p className="text-xs font-medium text-text-secondary">Loading employer profile...</p>
      </div>
    );
  }

  if (profileError || !company) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center space-y-4">
        <Building2 className="w-12 h-12 text-text-muted mx-auto" />
        <h2 className="text-xl font-bold text-brand-900">Employer Profile Not Found</h2>
        <p className="text-xs text-text-secondary">
          The requested company could not be found or is not currently active on the platform.
        </p>
        <Link
          to="/companies"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Employer Directory
        </Link>
      </div>
    );
  }

  const jobsList = jobsData?.jobs || [];
  const hqLocation =
    company.locations.find((l) => l.isHQ) || company.locations[0];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Navigation */}
      <div>
        <Link
          to="/companies"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to all employers</span>
        </Link>
      </div>

      {/* Hero Banner Component */}
      <CompanyHeroBanner
        company={company}
        onToggleFollow={
          user && user.role === 'APPLICANT'
            ? () => toggleFollowMutation.mutate(company.id)
            : undefined
        }
        isFollowLoading={toggleFollowMutation.isPending}
      />

      {/* Section Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border-default pb-px overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-default'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Overview & Culture</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('jobs')}
          className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'jobs'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-default'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Open Roles</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'jobs'
                ? 'bg-brand-50 text-brand-700'
                : 'bg-surface-muted text-text-muted'
            }`}
          >
            {jobsList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('locations')}
          className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'locations'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-default'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Offices & Hubs</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'locations'
                ? 'bg-brand-50 text-brand-700'
                : 'bg-surface-muted text-text-muted'
            }`}
          >
            {company.locations.length}
          </span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-surface rounded-2xl border border-border-default p-4 text-center">
              <Briefcase className="w-5 h-5 text-brand-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-brand-900">{company.activeJobCount}</p>
              <p className="text-[11px] font-medium text-text-secondary">Open Positions</p>
            </div>

            <div className="bg-surface rounded-2xl border border-border-default p-4 text-center">
              <Users className="w-5 h-5 text-rose-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-brand-900">{company.followerCount}</p>
              <p className="text-[11px] font-medium text-text-secondary">Community Followers</p>
            </div>

            <div className="bg-surface rounded-2xl border border-border-default p-4 text-center">
              <MapPin className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-brand-900 truncate">
                {hqLocation ? hqLocation.city : 'Remote'}
              </p>
              <p className="text-[11px] font-medium text-text-secondary">Global Headquarters</p>
            </div>

            <div className="bg-surface rounded-2xl border border-border-default p-4 text-center">
              <Calendar className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-brand-900">
                {new Date(company.createdAt).getFullYear()}
              </p>
              <p className="text-[11px] font-medium text-text-secondary">Platform Partner Since</p>
            </div>
          </div>

          {/* Culture Media Gallery */}
          <CompanyCultureGallery
            media={company.cultureMedia}
            companyName={company.name}
          />

          {/* Social Presence Links */}
          {company.socialLinks && Object.values(company.socialLinks).some(Boolean) && (
            <div className="bg-surface rounded-2xl border border-border-default p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Connect with {company.name}
              </h4>
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                {company.socialLinks.linkedin && (
                  <a
                    href={company.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-default bg-surface hover:bg-surface-hover text-text-primary transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    LinkedIn
                  </a>
                )}
                {company.socialLinks.twitter && (
                  <a
                    href={company.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-default bg-surface hover:bg-surface-hover text-text-primary transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-sky-500" />
                    Twitter / X
                  </a>
                )}
                {company.socialLinks.github && (
                  <a
                    href={company.socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-default bg-surface hover:bg-surface-hover text-text-primary transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-slate-800" />
                    GitHub
                  </a>
                )}
                {company.socialLinks.glassdoor && (
                  <a
                    href={company.socialLinks.glassdoor}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-default bg-surface hover:bg-surface-hover text-text-primary transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    Glassdoor
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'jobs' && (
        <div>
          {isJobsLoading ? (
            <div className="py-12 flex justify-center">
              <Spinner size="md" />
            </div>
          ) : (
            <CompanyActiveJobsList
              jobs={jobsList}
              companyName={company.name}
            />
          )}
        </div>
      )}

      {activeTab === 'locations' && (
        <CompanyLocationsList
          locations={company.locations}
          companyName={company.name}
        />
      )}
    </div>
  );
};

export default CompanyPublicProfilePage;
