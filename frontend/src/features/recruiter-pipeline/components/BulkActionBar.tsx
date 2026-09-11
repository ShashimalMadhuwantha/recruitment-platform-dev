import React, { useState, useRef, useEffect } from 'react';
import {
  PipelineCandidateDto,
  ApplicationStatus,
  KANBAN_STAGES,
} from '../types';
import {
  CheckSquare,
  Download,
  GitCompare,
  ChevronUp,
  X,
} from 'lucide-react';

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
  const [isStageMenuOpen, setIsStageMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const count = selectedCandidates.length;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsStageMenuOpen(false);
      }
    };
    if (isStageMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStageMenuOpen]);

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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-brand-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-brand-700/80 flex items-center gap-3.5 flex-wrap animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Selection Pill */}
      <div className="flex items-center gap-2 text-xs font-semibold pr-3 border-r border-brand-700/80">
        <CheckSquare className="w-4 h-4 text-brand-300" />
        <span>
          {count} candidate{count === 1 ? '' : 's'} selected
        </span>
      </div>

      {/* Bulk Stage Selector Popover */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsStageMenuOpen((prev) => !prev)}
          disabled={isBulkMoving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-800 text-white border border-brand-600/70 hover:bg-brand-700 hover:border-brand-500 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400"
          aria-haspopup="true"
          aria-expanded={isStageMenuOpen}
        >
          <span>Move to Stage</span>
          <ChevronUp
            className={`w-3.5 h-3.5 text-brand-300 transition-transform duration-150 ${
              isStageMenuOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isStageMenuOpen && (
          <div className="absolute bottom-full mb-2 left-0 w-48 bg-surface text-text-primary rounded-xl shadow-2xl border border-border-default py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            <p className="px-3 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border-default">
              Select Target Stage
            </p>
            <div className="py-1 space-y-0.5">
              {KANBAN_STAGES.map((s) => (
                <button
                  key={s.status}
                  type="button"
                  onClick={() => {
                    onBulkMoveStage(s.status);
                    setIsStageMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-surface-muted hover:text-brand-600 flex items-center justify-between transition-colors font-medium cursor-pointer"
                >
                  <span>{s.label}</span>
                  <span
                    className={`w-2 h-2 rounded-full border ${s.accentColor} bg-current`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Side-by-side compare button */}
      <button
        type="button"
        disabled={!canCompare}
        onClick={onOpenCompare}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
          canCompare
            ? 'bg-brand-800 text-white border-brand-600 hover:bg-brand-700 cursor-pointer shadow-xs'
            : 'bg-white/5 text-white/40 border-white/10 cursor-not-allowed'
        }`}
        title={
          canCompare
            ? 'Compare selected candidates side-by-side'
            : 'Select 2 to 4 candidates to compare'
        }
      >
        <GitCompare
          className={`w-3.5 h-3.5 ${canCompare ? 'text-brand-300' : 'text-white/30'}`}
        />
        <span>Compare {count >= 2 && count <= 4 ? `(${count})` : ''}</span>
      </button>

      {/* Export CSV button */}
      <button
        type="button"
        onClick={handleExportCsv}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-100 hover:text-white hover:bg-brand-800 transition-colors"
      >
        <Download className="w-3.5 h-3.5 text-brand-300" />
        <span>Export CSV</span>
      </button>

      {/* Clear selection button */}
      <button
        type="button"
        onClick={onClearSelection}
        className="p-1.5 rounded-lg text-brand-300 hover:text-white hover:bg-brand-800 transition-colors ml-0.5"
        title="Deselect all candidates"
        aria-label="Deselect all candidates"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
