import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Heart, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useCompanyDirectory,
  useFollowedCompanies,
  useToggleCompanyFollow,
} from '../../features/company-discovery/hooks';
import type { CompanyDiscoveryFilterState } from '../../features/company-discovery/types';
import { CompanyDirectoryCard } from '../../features/company-discovery/components/CompanyDirectoryCard';
import { CompanyFilterBar } from '../../features/company-discovery/components/CompanyFilterBar';
import { useAuth } from '../../app/providers';
import { Spinner } from '../../components/ui/Spinner';

export const CompanyDirectoryPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'following' && user ? 'following' : 'all';
  const [activeTab, setActiveTab] = useState<'all' | 'following'>(initialTab);

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<CompanyDiscoveryFilterState>({
    keyword: '',
    industry: '',
    location: '',
    size: '',
    hasActiveJobs: false,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Query directory
  const {
    data: directoryData,
    isLoading: isDirectoryLoading,
    isFetching: isDirectoryFetching,
  } = useCompanyDirectory({
    page,
    limit: 12,
    keyword: filters.keyword || undefined,
    industry: filters.industry || undefined,
    location: filters.location || undefined,
    size: filters.size || undefined,
    hasActiveJobs: filters.hasActiveJobs || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  // Query followed companies (if authenticated applicant)
  const {
    data: followedData,
    isLoading: isFollowedLoading,
  } = useFollowedCompanies(page, 12);

  const toggleFollowMutation = useToggleCompanyFollow();

  const handleFilterChange = (updated: Partial<CompanyDiscoveryFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      keyword: '',
      industry: '',
      location: '',
      size: '',
      hasActiveJobs: false,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setPage(1);
  };

  const handleTabChange = (tab: 'all' | 'following') => {
    setActiveTab(tab);
    setPage(1);
    if (tab === 'following') {
      setSearchParams({ tab: 'following' });
    } else {
      setSearchParams({});
    }
  };

  const currentData = activeTab === 'following' ? followedData : directoryData;
  const isLoading = activeTab === 'following' ? isFollowedLoading : isDirectoryLoading;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-default/80 pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-xs font-semibold text-brand-700">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Employer Discovery & Culture Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-900 tracking-tight">
            Explore Great Companies
          </h1>
          <p className="text-sm text-text-secondary max-w-2xl leading-relaxed">
            Discover verified companies, view team culture media, explore open requisitions, and
            check predicted ATS match scores before applying.
          </p>
        </div>

        {/* Tab Switcher (Visible to authenticated applicants) */}
        {user && user.role === 'APPLICANT' && (
          <div className="inline-flex items-center p-1 rounded-xl bg-surface border border-border-default shadow-xs shrink-0">
            <button
              type="button"
              onClick={() => handleTabChange('all')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>All Employers</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('following')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'following'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  activeTab === 'following' ? 'fill-white' : 'text-rose-500'
                }`}
              />
              <span>Following</span>
              {followedData && followedData.total > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === 'following'
                      ? 'bg-brand-700 text-white'
                      : 'bg-surface-muted text-text-secondary'
                  }`}
                >
                  {followedData.total}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Filter Bar (Only shown in 'all' tab) */}
      {activeTab === 'all' && (
        <CompanyFilterBar
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          totalResults={directoryData?.total || 0}
        />
      )}

      {/* Directory Content */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" />
          <p className="text-xs font-medium text-text-secondary">Loading employers...</p>
        </div>
      ) : currentData && currentData.items.length > 0 ? (
        <div className="space-y-8">
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${
              isDirectoryFetching ? 'opacity-70 transition-opacity' : ''
            }`}
          >
            {currentData.items.map((company) => (
              <CompanyDirectoryCard
                key={company.id}
                company={company}
                onToggleFollow={
                  user && user.role === 'APPLICANT'
                    ? (companyId) => toggleFollowMutation.mutate(companyId)
                    : undefined
                }
                isFollowLoading={toggleFollowMutation.isPending}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {currentData.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border-default/80 pt-6">
              <span className="text-xs text-text-secondary">
                Page <span className="font-semibold text-text-primary">{page}</span> of{' '}
                <span className="font-semibold text-text-primary">{currentData.totalPages}</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border-default bg-surface text-xs font-medium text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:pointer-events-none transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(currentData.totalPages, p + 1))}
                  disabled={page >= currentData.totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border-default bg-surface text-xs font-medium text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:pointer-events-none transition-all"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border-default p-12 text-center space-y-3 shadow-xs">
          <Building2 className="w-10 h-10 text-text-muted mx-auto" />
          <h3 className="text-base font-bold text-brand-900">
            {activeTab === 'following'
              ? "You aren't following any companies yet"
              : 'No companies match your search criteria'}
          </h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            {activeTab === 'following'
              ? 'Browse the employer directory and click the follow button on any company card to receive requisition alerts and updates.'
              : 'Try clearing some filters or searching with a different keyword or location.'}
          </p>
          {activeTab === 'all' && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-2 inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-all shadow-xs"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanyDirectoryPage;
