import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useJobSearch, useToggleSaveJob } from '../../features/job-search/hooks';
import type { JobSearchFilters, EmploymentType } from '@recruitment-platform/shared';
import {
  Search,
  MapPin,
  Briefcase,
  DollarSign,
  Bookmark,
  Filter,
  X,
  ChevronRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const JobSearchPage: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>('');
  const [minSalary, setMinSalary] = useState<number | ''>('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [page, setPage] = useState(1);

  // Active filters query object
  const activeFilters: JobSearchFilters = {
    keyword: keyword.trim() || undefined,
    location: location.trim() || undefined,
    employmentType: employmentType || undefined,
    minSalary: minSalary !== '' ? Number(minSalary) : undefined,
    remoteOnly: remoteOnly || undefined,
    page,
    limit: 12,
  };

  const { data, isLoading } = useJobSearch(activeFilters);
  const toggleSaveMutation = useToggleSaveJob();

  const handleResetFilters = () => {
    setKeyword('');
    setLocation('');
    setEmploymentType('');
    setMinSalary('');
    setRemoteOnly(false);
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    keyword || location || employmentType || minSalary !== '' || remoteOnly
  );

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-8">
      {/* Hero Header & Search Bar */}
      <div className="bg-surface rounded-xl border border-border-default p-6 sm:p-8 shadow-sm space-y-6">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
            Job Board & Discovery
          </span>
          <h1 className="text-3xl font-bold text-brand-900 tracking-tight mt-1">
            Explore Open Vacancies
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1.5 leading-relaxed">
            Find roles matching your technical taxonomy profile. Check your deterministic ATS match prediction before applying.
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
              placeholder="Search by job title, skill (e.g. React, TypeScript), or company..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-default text-xs focus:ring-2 focus:ring-brand-600 focus:outline-none bg-surface-muted"
            />
          </div>

          <div className="sm:col-span-4 relative">
            <MapPin className="w-4 h-4 text-text-muted absolute left-3.5 top-3" />
            <input
              type="text"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setPage(1);
              }}
              placeholder="City, country or Remote..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-default text-xs focus:ring-2 focus:ring-brand-600 focus:outline-none bg-surface-muted"
            />
          </div>

          <div className="sm:col-span-2">
            <Button
              variant="primary"
              className="w-full h-full py-2.5 text-xs font-semibold"
              onClick={() => setPage(1)}
            >
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Filters Sidebar + Vacancy Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Filter Sidebar */}
        <div className="lg:col-span-1 bg-surface border border-border-default rounded-xl p-5 space-y-6 sticky top-20 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border-default">
            <span className="text-xs font-bold text-text-primary flex items-center gap-2">
              <Filter className="w-4 h-4 text-brand-600" />
              Filter Vacancies
            </span>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>

          {/* Remote Only Toggle */}
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-text-primary">
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => {
                  setRemoteOnly(e.target.checked);
                  setPage(1);
                }}
                className="rounded border-border-default text-brand-600 focus:ring-brand-500 w-4 h-4"
              />
              Remote Only Positions
            </label>
          </div>

          {/* Employment Type */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-primary block">
              Employment Type
            </label>
            <select
              value={employmentType}
              onChange={(e) => {
                setEmploymentType(e.target.value as any);
                setPage(1);
              }}
              className="w-full text-xs p-2.5 rounded-lg border border-border-default bg-surface focus:ring-2 focus:ring-brand-600 focus:outline-none"
            >
              <option value="">All Employment Types</option>
              <option value="FULL_TIME">Full-Time</option>
              <option value="PART_TIME">Part-Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="REMOTE">Remote</option>
              <option value="INTERNSHIP">Internship</option>
            </select>
          </div>

          {/* Minimum Salary Slider/Options */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-primary block">
              Minimum Salary ($ USD)
            </label>
            <div className="space-y-1.5">
              {[
                { label: 'Any Salary', value: '' },
                { label: '$60,000+ / yr', value: 60000 },
                { label: '$80,000+ / yr', value: 80000 },
                { label: '$100,000+ / yr', value: 100000 },
                { label: '$120,000+ / yr', value: 120000 },
              ].map((tier) => (
                <label key={tier.label} className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                  <input
                    type="radio"
                    name="salaryFilter"
                    checked={minSalary === tier.value}
                    onChange={() => {
                      setMinSalary(tier.value as any);
                      setPage(1);
                    }}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  {tier.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Vacancies Grid */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>
              Showing <strong className="text-text-primary">{data?.items.length || 0}</strong> of{' '}
              <strong className="text-text-primary">{data?.total || 0}</strong> published roles
            </span>
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-xs text-text-secondary">
              Searching vacancies...
            </div>
          ) : data?.items.length === 0 ? (
            <div className="py-16 text-center bg-surface rounded-xl border border-border-default space-y-3 p-6">
              <Briefcase className="w-10 h-10 text-text-muted mx-auto" />
              <h3 className="text-base font-bold text-text-primary">No matching job vacancies found</h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                Try clearing some of your search terms or filters to see more results.
              </p>
              {hasActiveFilters && (
                <div className="pt-2">
                  <Button variant="secondary" size="sm" onClick={handleResetFilters}>
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data?.items.map((job) => (
                <Card
                  key={job.id}
                  className="hover:border-brand-600/50 hover:shadow-md transition-all flex flex-col justify-between p-5 space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top Row: Company & Bookmark */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Link
                          to={`/companies/${job.companyId}`}
                          className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-200 hover:border-brand-400 flex items-center justify-center font-bold text-brand-700 text-sm shrink-0 transition"
                          title={`View ${job.companyName} profile`}
                        >
                          {job.companyName.charAt(0)}
                        </Link>
                        <div>
                          <Link
                            to={`/companies/${job.companyId}`}
                            className="text-xs font-semibold text-text-secondary hover:text-brand-600 transition block line-clamp-1"
                          >
                            {job.companyName}
                          </Link>
                          <Link
                            to={`/jobs/${job.id}`}
                            className="text-sm font-bold text-brand-900 hover:text-brand-600 transition line-clamp-1"
                          >
                            {job.title}
                          </Link>
                        </div>
                      </div>

                      {/* Bookmark Toggle */}
                      <button
                        onClick={() => toggleSaveMutation.mutate(job.id)}
                        disabled={toggleSaveMutation.isPending}
                        className={`p-1.5 rounded-lg border transition ${
                          job.isSaved
                            ? 'bg-amber-50 border-amber-300 text-amber-600'
                            : 'bg-surface hover:bg-surface-muted border-border-default text-text-muted hover:text-text-primary'
                        }`}
                        title={job.isSaved ? 'Remove bookmark' : 'Bookmark job'}
                      >
                        <Bookmark className={`w-4 h-4 ${job.isSaved ? 'fill-amber-600' : ''}`} />
                      </button>
                    </div>

                    {/* Metadata Pills */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-secondary">
                      <span className="inline-flex items-center gap-1 bg-surface-muted px-2 py-0.5 rounded border border-border-default">
                        <MapPin className="w-3 h-3 text-text-muted" />
                        {job.location || 'Remote'}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-surface-muted px-2 py-0.5 rounded border border-border-default">
                        <Briefcase className="w-3 h-3 text-text-muted" />
                        {job.employmentType.replace('_', ' ')}
                      </span>
                      {job.salaryMin && job.salaryMax && (
                        <span className="inline-flex items-center gap-1 bg-surface-muted px-2 py-0.5 rounded border border-border-default font-medium text-text-primary">
                          <DollarSign className="w-3 h-3 text-emerald-600" />
                          ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Required Skills Chips */}
                    {job.requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.requiredSkills.slice(0, 4).map((s) => (
                          <span
                            key={s.id}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                              s.priority === 'MUST_HAVE'
                                ? 'bg-brand-50 text-brand-700 border-brand-200'
                                : 'bg-surface-muted text-text-secondary border-border-default'
                            }`}
                          >
                            {s.name}
                          </span>
                        ))}
                        {job.requiredSkills.length > 4 && (
                          <span className="text-[10px] text-text-muted self-center">
                            +{job.requiredSkills.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom Row: Actions */}
                  <div className="pt-3 border-t border-border-default flex items-center justify-between text-xs">
                    <span className="text-[11px] text-text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      {job.hasApplied ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Applied
                        </span>
                      ) : (
                        <Link to={`/jobs/${job.id}`}>
                          <Button variant="secondary" size="sm" className="text-xs">
                            View & Apply
                            <ChevronRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs text-text-secondary px-2">
                Page {page} of {data.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobSearchPage;
