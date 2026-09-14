import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { useExportReport } from '../hooks';
import type { AnalyticsFilterParams, ScoreBand } from '@recruitment-platform/shared';

export interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs?: Array<{ id: string; title: string }>;
  defaultJobId?: string;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  jobs = [],
  defaultJobId,
}) => {
  const [selectedJobId, setSelectedJobId] = useState<string>(defaultJobId || '');
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [selectedScoreBand, setSelectedScoreBand] = useState<ScoreBand | ''>('');
  const [dateRange, setDateRange] = useState<string>('30d');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

  const exportMutation = useExportReport();

  if (!isOpen) return null;

  const handleDownload = async () => {
    let startDate: string | undefined;
    const now = new Date();

    if (dateRange === '7d') {
      startDate = new Date(now.getTime() - 7 * 86400000).toISOString().substring(0, 10);
    } else if (dateRange === '30d') {
      startDate = new Date(now.getTime() - 30 * 86400000).toISOString().substring(0, 10);
    } else if (dateRange === '90d') {
      startDate = new Date(now.getTime() - 90 * 86400000).toISOString().substring(0, 10);
    }

    const filters: AnalyticsFilterParams = {
      ...(selectedJobId ? { jobId: selectedJobId } : {}),
      ...(selectedStage ? { stage: selectedStage } : {}),
      ...(selectedScoreBand ? { scoreBand: selectedScoreBand } : {}),
      ...(startDate ? { startDate } : {}),
    };

    try {
      await exportMutation.mutateAsync(filters);
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="bg-surface border border-border-default rounded-lg shadow-lg w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between pb-4 border-b border-border-default">
          <div>
            <h3 id="modal-title" className="text-lg font-semibold text-text-primary">
              Export Candidate Pipeline Report
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Download sanitized candidate lists, match scores, and stage metrics
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1 rounded-md transition-colors"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 py-4">
          {/* Job Requisition Filter */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Job Requisition
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full text-xs bg-surface border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              <option value="">All Requisitions (Company-wide)</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          {/* Pipeline Stage Filter */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Pipeline Stage
              </label>
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

            {/* ATS Score Band Filter */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                ATS Score Band
              </label>
              <select
                value={selectedScoreBand}
                onChange={(e) => setSelectedScoreBand(e.target.value as ScoreBand | '')}
                className="w-full text-xs bg-surface border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-600"
              >
                <option value="">All Score Bands</option>
                <option value="HIGH">Strong Match (≥ 80%)</option>
                <option value="MID">Partial Match (50% - 79%)</option>
                <option value="LOW">Weak Match (&lt; 50%)</option>
              </select>
            </div>
          </div>

          {/* Date Range Selection */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Time Range
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: '7d', label: 'Last 7 Days' },
                { id: '30d', label: 'Last 30 Days' },
                { id: '90d', label: 'Last 90 Days' },
                { id: 'all', label: 'All Time' },
              ].map((range) => (
                <button
                  key={range.id}
                  type="button"
                  onClick={() => setDateRange(range.id)}
                  className={`py-1.5 px-2 text-xs rounded-lg border font-medium transition-colors ${
                    dateRange === range.id
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-surface text-text-secondary border-border-default hover:bg-surface-muted'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format Options */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  exportFormat === 'csv'
                    ? 'border-brand-600 bg-blue-50/30'
                    : 'border-border-default bg-surface hover:bg-surface-muted'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={() => setExportFormat('csv')}
                  className="text-brand-600 focus:ring-brand-600"
                />
                <div>
                  <div className="text-xs font-semibold text-text-primary">CSV Spreadsheet</div>
                  <div className="text-[11px] text-text-secondary">Excel & Google Sheets compatible</div>
                </div>
              </label>

              <label
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  exportFormat === 'json'
                    ? 'border-brand-600 bg-blue-50/30'
                    : 'border-border-default bg-surface hover:bg-surface-muted'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={exportFormat === 'json'}
                  onChange={() => setExportFormat('json')}
                  className="text-brand-600 focus:ring-brand-600"
                />
                <div>
                  <div className="text-xs font-semibold text-text-primary">JSON Payload</div>
                  <div className="text-[11px] text-text-secondary">Raw structured data for audits</div>
                </div>
              </label>
            </div>
          </div>

          {/* Sanitization note */}
          <div className="bg-surface-muted border border-border-default rounded-lg p-3 text-[11px] text-text-secondary flex items-start gap-2">
            <svg className="w-4 h-4 text-text-muted shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              All exported files sanitize formula injection vectors (=, +, -, @) for spreadsheet security compliance.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-default">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleDownload}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? 'Generating Export...' : 'Download Export'}
          </Button>
        </div>
      </div>
    </div>
  );
};
