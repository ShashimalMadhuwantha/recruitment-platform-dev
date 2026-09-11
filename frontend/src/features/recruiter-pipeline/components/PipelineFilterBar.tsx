import React from 'react';
import { Search, LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react';
import { PipelineFilterState, ViewMode } from '../types';

interface PipelineFilterBarProps {
  filters: PipelineFilterState;
  onFilterChange: (updates: Partial<PipelineFilterState>) => void;
  onReset: () => void;
  totalCandidates: number;
}

export const PipelineFilterBar: React.FC<PipelineFilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  totalCandidates,
}) => {
  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.scoreBand) ||
    Boolean(filters.status) ||
    filters.sortBy !== 'appliedAt';

  return (
    <div className="bg-surface rounded-xl border border-border-default p-4 space-y-3 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search candidates by name, email, headline, or location..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full pl-9 pr-8 py-2 text-xs font-medium text-text-primary bg-surface-muted border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:bg-surface transition-all placeholder:text-text-muted"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Mode & Sort Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <SlidersHorizontal className="w-3.5 h-3.5 text-text-muted" />
            <span className="font-medium whitespace-nowrap">Sort:</span>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                onFilterChange({
                  sortBy: sortBy as any,
                  sortOrder: sortOrder as any,
                });
              }}
              className="text-xs font-medium text-text-primary bg-surface-muted border border-border-default rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              <option value="appliedAt-desc">Newest Applied</option>
              <option value="appliedAt-asc">Oldest Applied</option>
              <option value="overallScore-desc">ATS Score: High to Low</option>
              <option value="overallScore-asc">ATS Score: Low to High</option>
              <option value="rating-desc">Team Rating: High to Low</option>
              <option value="fullName-asc">Candidate Name (A-Z)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-surface-muted p-0.5 rounded-lg border border-border-default">
            <button
              type="button"
              onClick={() => onFilterChange({ viewMode: 'kanban' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                filters.viewMode === 'kanban'
                  ? 'bg-surface text-brand-600 shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ viewMode: 'table' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                filters.viewMode === 'table'
                  ? 'bg-surface text-brand-600 shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Table List View"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Score Band Filter Chips & Quick Stage Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border-default text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mr-1">
            ATS Score Band:
          </span>

          <button
            type="button"
            onClick={() => onFilterChange({ scoreBand: '' })}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              !filters.scoreBand
                ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                : 'bg-surface text-text-secondary border-border-default hover:bg-surface-hover'
            }`}
          >
            All Scores
          </button>

          <button
            type="button"
            onClick={() => onFilterChange({ scoreBand: 'HIGH' })}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              filters.scoreBand === 'HIGH'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Strong Match (≥ 75%)
          </button>

          <button
            type="button"
            onClick={() => onFilterChange({ scoreBand: 'MID' })}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              filters.scoreBand === 'MID'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Good Match (60–74%)
          </button>

          <button
            type="button"
            onClick={() => onFilterChange({ scoreBand: 'LOW' })}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              filters.scoreBand === 'LOW'
                ? 'bg-slate-600 text-white border-slate-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Partial / Weak (&lt; 60%)
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span>
            Showing <strong className="text-text-primary">{totalCandidates}</strong> candidate
            {totalCandidates === 1 ? '' : 's'}
          </span>
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 underline ml-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
