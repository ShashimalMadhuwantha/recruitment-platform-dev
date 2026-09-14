import React, { useState } from 'react';
import type { CandidateExportItemDto } from '@recruitment-platform/shared';
import { ScoreBadge } from '../../../components/ui/ScoreBadge';
import { Button } from '../../../components/ui/Button';

export interface CandidateReportsTabProps {
  candidates: CandidateExportItemDto[];
  totalCandidates: number;
  isLoading?: boolean;
  onExportClick: () => void;
}

export const CandidateReportsTab: React.FC<CandidateReportsTabProps> = ({
  candidates,
  totalCandidates,
  isLoading,
  onExportClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState('');

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      searchTerm === '' ||
      c.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStage = selectedStage === '' || c.stage === selectedStage;

    return matchesSearch && matchesStage;
  });

  return (
    <div className="bg-surface border border-border-default rounded-lg p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            Candidate Pipeline Report Preview
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Audit candidate flow, match scores, and time in pipeline across requisitions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={onExportClick} className="text-xs py-1.5 h-9">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Full Dataset
          </Button>
        </div>
      </div>

      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-surface border border-border-default rounded-lg px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="w-full text-xs bg-surface border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-600"
          >
            <option value="">All Stages</option>
            <option value="APPLIED">Applied</option>
            <option value="SCREENING">Screening</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="INTERVIEW">Interview</option>
            <option value="OFFER">Offer</option>
            <option value="HIRED">Hired</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="text-xs text-text-secondary ml-auto">
          Showing {filteredCandidates.length} of {totalCandidates} candidate{totalCandidates !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto border border-border-default rounded-lg">
        <table className="min-w-full divide-y divide-border-default text-xs text-left">
          <thead className="bg-surface-muted text-text-secondary font-medium">
            <tr>
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Job Requisition</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">ATS Score</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Applied Date</th>
              <th className="px-4 py-3 text-right">Pipeline Days</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default bg-surface">
            {isLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-3">
                    <div className="h-4 w-32 bg-surface-muted rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-28 bg-surface-muted rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-16 bg-surface-muted rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-12 bg-surface-muted rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-16 bg-surface-muted rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-20 bg-surface-muted rounded" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="h-4 w-10 bg-surface-muted rounded ml-auto" />
                  </td>
                </tr>
              ))
            ) : filteredCandidates.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                  No candidate records match the selected filters.
                </td>
              </tr>
            ) : (
              filteredCandidates.map((cand) => (
                <tr key={cand.applicationId} className="hover:bg-surface-muted transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-text-primary">{cand.candidateName}</div>
                    <div className="text-[11px] text-text-muted">{cand.candidateEmail}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {cand.jobTitle}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        cand.stage === 'HIRED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : cand.stage === 'OFFER'
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : cand.stage === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-surface-muted text-text-secondary border border-border-default'
                      }`}
                    >
                      {cand.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {cand.atsScore !== null ? (
                      <ScoreBadge score={cand.atsScore} size="sm" />
                    ) : (
                      <span className="text-text-muted italic">Unscored</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary font-medium">
                    {cand.source}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {cand.appliedAt.substring(0, 10)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-text-primary">
                    {cand.timeInPipelineDays}d
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
