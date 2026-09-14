import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Search,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { PublicCompanyJobItemDto } from '../types';
import { ScoreBadge } from '../../../components/ui/ScoreBadge';

interface CompanyActiveJobsListProps {
  jobs: PublicCompanyJobItemDto[];
  companyName: string;
}

export const CompanyActiveJobsList: React.FC<CompanyActiveJobsListProps> = ({
  jobs,
  companyName,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredJobs = jobs.filter((j) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      j.title.toLowerCase().includes(term) ||
      (j.location && j.location.toLowerCase().includes(term)) ||
      (j.department && j.department.toLowerCase().includes(term)) ||
      j.skills.some((s) => s.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-4">
      {/* Header & Internal Job Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-brand-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-brand-600" />
            <span>Open Requisitions at {companyName}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {jobs.length} {jobs.length === 1 ? 'position' : 'positions'}
            </span>
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Real-time ATS match prediction calculated against your applicant profile.
          </p>
        </div>

        {jobs.length > 2 && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter openings..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border-default bg-surface text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>
        )}
      </div>

      {/* Jobs Catalog */}
      {filteredJobs.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border-default p-8 text-center text-text-secondary space-y-2">
          <Briefcase className="w-8 h-8 text-text-muted mx-auto" />
          <p className="text-sm font-semibold text-text-primary">
            {searchTerm ? 'No matching positions found' : 'No active openings right now'}
          </p>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            {searchTerm
              ? 'Try adjusting your search keywords.'
              : `${companyName} is not currently hiring for any public roles. Follow them to receive alerts when new positions open.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="group bg-surface border border-border-default hover:border-brand-300 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Job Details */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/jobs/${job.id}`}
                    className="font-bold text-base text-brand-900 group-hover:text-brand-600 transition-colors"
                  >
                    {job.title}
                  </Link>

                  {job.hasApplied && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      Applied
                    </span>
                  )}
                </div>

                {/* Metadata Pills */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                  <span className="inline-flex items-center gap-1 bg-surface-muted px-2.5 py-0.5 rounded-md border border-border-default font-medium">
                    <MapPin className="w-3 h-3 text-text-muted" />
                    {job.location || 'Remote'}
                  </span>

                  <span className="inline-flex items-center gap-1 bg-surface-muted px-2.5 py-0.5 rounded-md border border-border-default font-medium">
                    <Briefcase className="w-3 h-3 text-text-muted" />
                    {job.employmentType.replace('_', ' ')}
                  </span>

                  {job.salaryMin && job.salaryMax && (
                    <span className="inline-flex items-center gap-1 bg-surface-muted px-2.5 py-0.5 rounded-md border border-border-default font-semibold text-emerald-700">
                      <DollarSign className="w-3 h-3" />
                      ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}{' '}
                      {job.salaryCurrency || 'USD'}
                    </span>
                  )}

                  {job.experienceLevel && (
                    <span className="bg-surface-muted px-2.5 py-0.5 rounded-md border border-border-default text-text-muted">
                      {job.experienceLevel}
                    </span>
                  )}
                </div>

                {/* Required Skills Chips */}
                {job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {job.skills.slice(0, 5).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-brand-50 text-brand-700 border border-brand-200"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 5 && (
                      <span className="px-1.5 py-0.5 text-[10px] text-text-muted font-medium">
                        +{job.skills.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Match Score & CTA Column */}
              <div className="flex items-center md:flex-col md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border-default/60">
                {/* Predicted Match Score Badge */}
                {typeof job.predictedAtsScore === 'number' ? (
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <ScoreBadge score={job.predictedAtsScore} size="sm" />
                  </div>
                ) : null}

                {/* Apply / View Button */}
                <Link
                  to={`/jobs/${job.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-all shadow-xs group-hover:scale-102"
                >
                  <span>{job.hasApplied ? 'View Application' : 'Apply Now'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
