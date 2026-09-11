import React from 'react';
import {
  PipelineCandidateDto,
  ApplicationStatus,
  KANBAN_STAGES,
} from '../types';
import { CheckSquare, Download, GitCompare, ArrowRight, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface BulkActionBarProps {
  selectedCandidates: PipelineCandidateDto[];
  onClearSelection: () => void;
  onBulkMoveStage: (stage: ApplicationStatus) => void;
  onOpenCompare: () => void;
  isBulkMoving?: boolean;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCandidates,
  onClearSelection,
  onBulkMoveStage,
  onOpenCompare,
  isBulkMoving,
}) => {
  const count = selectedCandidates.length;
  if (count === 0) return null;

  const canCompare = count >= 2 && count <= 4;

  const handleExportCsv = () => {
    const headers = [
      'Application ID',
      'Candidate Name',
      'Email',
      'Headline',
      'Location',
      'Current Stage',
      'ATS Score',
      'Score Band',
      'Team Rating',
      'Applied Date',
    ];

    const rows = selectedCandidates.map((c) => [
      c.id,
      `"${c.fullName.replace(/"/g, '""')}"`,
      c.email,
      `"${(c.headline || '').replace(/"/g, '""')}"`,
      `"${(c.location || '').replace(/"/g, '""')}"`,
      c.status,
      c.atsScore?.overallScore ?? 0,
      c.atsScore?.scoreBand ?? 'N/A',
      c.averageRating ?? 'N/A',
      c.appliedAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `candidate_pipeline_export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-brand-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-brand-700/80 flex items-center gap-4 flex-wrap animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Selection Pill */}
      <div className="flex items-center gap-2 text-xs font-semibold pr-3 border-r border-brand-700">
        <CheckSquare className="w-4 h-4 text-brand-300" />
        <span>
          {count} candidate{count === 1 ? '' : 's'} selected
        </span>
      </div>

      {/* Bulk Stage Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-brand-200 font-medium">Move to:</span>
        <select
          onChange={(e) => {
            if (e.target.value) {
              onBulkMoveStage(e.target.value as ApplicationStatus);
              e.target.value = '';
            }
          }}
          defaultValue=""
          disabled={isBulkMoving}
          className="text-xs font-semibold bg-brand-800 text-white border border-brand-600 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400 cursor-pointer"
        >
          <option value="" disabled>
            Select Stage...
          </option>
          {KANBAN_STAGES.map((s) => (
            <option key={s.status} value={s.status}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Side-by-side compare button */}
      <Button
        variant="outline"
        size="sm"
        disabled={!canCompare}
        onClick={onOpenCompare}
        className={`text-xs gap-1.5 border-brand-600 text-white hover:bg-brand-800 ${
          !canCompare ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title={
          canCompare
            ? 'Compare selected candidates side-by-side'
            : 'Select 2 to 4 candidates to compare'
        }
      >
        <GitCompare className="w-3.5 h-3.5 text-brand-300" />
        <span>Compare {count >= 2 && count <= 4 ? `(${count})` : ''}</span>
      </Button>

      {/* Export CSV button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleExportCsv}
        className="text-xs text-brand-100 hover:text-white hover:bg-brand-800 gap-1.5"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Export CSV</span>
      </Button>

      {/* Clear selection button */}
      <button
        type="button"
        onClick={onClearSelection}
        className="p-1 rounded-full text-brand-300 hover:text-white hover:bg-brand-800 transition-colors ml-1"
        title="Deselect all"
        aria-label="Deselect all candidates"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
