import React from 'react';
import { Search, MapPin, Building2, SlidersHorizontal, RotateCcw, Briefcase } from 'lucide-react';
import type { CompanyDiscoveryFilterState } from '../types';

interface CompanyFilterBarProps {
  filters: CompanyDiscoveryFilterState;
  onChange: (updated: Partial<CompanyDiscoveryFilterState>) => void;
  onReset: () => void;
  totalResults: number;
}

const INDUSTRY_OPTIONS = [
  'All Industries',
  'Software & Technology',
  'Fintech & Financial Services',
  'Healthcare & Biotechnology',
  'E-Commerce & Retail',
  'Artificial Intelligence & Data',
  'Consulting & Professional Services',
  'Media & Entertainment',
  'Education & EdTech',
];

const SIZE_OPTIONS = [
  { label: 'All Sizes', value: '' },
  { label: '1-10 employees', value: '1-10' },
  { label: '11-50 employees', value: '11-50' },
  { label: '51-200 employees', value: '51-200' },
  { label: '201-500 employees', value: '201-500' },
  { label: '501-1000 employees', value: '501-1000' },
  { label: '1000+ employees', value: '1000+' },
];

export const CompanyFilterBar: React.FC<CompanyFilterBarProps> = ({
  filters,
  onChange,
  onReset,
  totalResults,
}) => {
  const isFiltered =
    Boolean(filters.keyword) ||
    Boolean(filters.industry) ||
    Boolean(filters.location) ||
    Boolean(filters.size) ||
    filters.hasActiveJobs;

  return (
    <div className="bg-surface border border-border-default rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
      {/* Search inputs row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Keyword Search */}
        <div className="relative md:col-span-6">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) => onChange({ keyword: e.target.value })}
            placeholder="Search company name, mission or keywords..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-default bg-surface-muted/50 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-surface transition-all"
          />
        </div>

        {/* Location Search */}
        <div className="relative md:col-span-6">
          <MapPin className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.location}
            onChange={(e) => onChange({ location: e.target.value })}
            placeholder="City, region, or country (e.g. London, San Francisco)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-default bg-surface-muted/50 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-surface transition-all"
          />
        </div>
      </div>

      {/* Dropdown Filters & Toggles Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border-default/60">
        <div className="flex flex-wrap items-center gap-3">
          {/* Industry Filter */}
          <div className="relative inline-flex items-center">
            <Building2 className="w-4 h-4 text-text-muted absolute left-3 pointer-events-none" />
            <select
              value={filters.industry}
              onChange={(e) =>
                onChange({ industry: e.target.value === 'All Industries' ? '' : e.target.value })
              }
              className="pl-9 pr-8 py-1.5 rounded-xl border border-border-default bg-surface text-xs font-medium text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all cursor-pointer appearance-none"
            >
              {INDUSTRY_OPTIONS.map((ind) => (
                <option key={ind} value={ind === 'All Industries' ? '' : ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* Size Filter */}
          <select
            value={filters.size}
            onChange={(e) => onChange({ size: e.target.value })}
            className="px-3 py-1.5 rounded-xl border border-border-default bg-surface text-xs font-medium text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all cursor-pointer"
          >
            {SIZE_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Has Active Openings Toggle */}
          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border-default bg-surface hover:bg-surface-hover/50 cursor-pointer text-xs font-medium text-text-secondary select-none transition-all">
            <input
              type="checkbox"
              checked={filters.hasActiveJobs}
              onChange={(e) => onChange({ hasActiveJobs: e.target.checked })}
              className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5 cursor-pointer"
            />
            <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hiring now only</span>
          </label>

          {/* Reset Action */}
          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset filters
            </button>
          )}
        </div>

        {/* Sort & Count Controls */}
        <div className="flex items-center gap-3 ml-auto text-xs text-text-secondary">
          <span className="font-semibold text-text-primary">
            {totalResults} {totalResults === 1 ? 'company' : 'companies'}
          </span>

          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-text-muted" />
            <select
              value={filters.sortBy}
              onChange={(e) =>
                onChange({
                  sortBy: e.target.value as 'name' | 'activeJobs' | 'followers' | 'createdAt',
                })
              }
              className="px-2.5 py-1.5 rounded-xl border border-border-default bg-surface text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all cursor-pointer"
            >
              <option value="createdAt">Recently Added</option>
              <option value="activeJobs">Most Open Roles</option>
              <option value="followers">Most Followed</option>
              <option value="name">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
