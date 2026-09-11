import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { useCVVersions, useRestoreCVVersion } from '../hooks';
import type { CVDto, CVVersionDto } from '../types';
import {
  History,
  RotateCcw,
  FileText,
  Clock,
  Sparkles,
  UploadCloud,
  X,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface CVVersionHistoryModalProps {
  cv: CVDto | null;
  isOpen: boolean;
  onClose: () => void;
  onRestored?: () => void;
}

export const CVVersionHistoryModal: React.FC<CVVersionHistoryModalProps> = ({
  cv,
  isOpen,
  onClose,
  onRestored,
}) => {
  const { data: versions = [], isLoading } = useCVVersions(cv?.id, isOpen);
  const restoreMutation = useRestoreCVVersion();

  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);
  const [restoredMessage, setRestoredMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !cv) return null;

  const handleRestore = async (version: CVVersionDto) => {
    if (!confirm(`Are you sure you want to roll back to version "${version.versionLabel || `v${version.versionNumber}`}"? This will restore this file snapshot as your active CV.`)) {
      return;
    }

    setErrorMessage(null);
    setRestoredMessage(null);

    try {
      await restoreMutation.mutateAsync({
        cvId: cv.id,
        versionId: version.id,
      });
      setRestoredMessage(`Successfully rolled back to version "${version.versionLabel}"!`);
      if (onRestored) onRestored();
      setTimeout(() => {
        setRestoredMessage(null);
      }, 3000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error?.message || 'Failed to rollback to this version.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'BUILDER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
            <Sparkles className="w-3 h-3" /> Built with Template
          </span>
        );
      case 'RESTORE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <RotateCcw className="w-3 h-3" /> Restored Snapshot
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <UploadCloud className="w-3 h-3" /> Uploaded File
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-brand-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface rounded-xl border border-border-default shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-surface-muted/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-brand-50 border border-brand-200 text-brand-600">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-brand-900">CV Version History & Rollback</h3>
              <p className="text-xs text-text-secondary">
                Review revisions and restore earlier snapshots for <span className="font-medium text-brand-700">{cv.fileName}</span>.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-surface transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {restoredMessage && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{restoredMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-danger/10 border border-danger/20 text-danger flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 text-center text-xs text-text-secondary">
              Loading revision timeline...
            </div>
          ) : versions.length === 0 ? (
            <div className="py-10 text-center text-xs text-text-muted border border-dashed border-border-default rounded-lg">
              No previous version snapshots found.
            </div>
          ) : (
            <div className="relative border-l-2 border-border-default ml-4 pl-4 space-y-4 py-2">
              {versions.map((version, index) => {
                const isCurrentActive = index === 0;
                const isExpanded = expandedVersionId === version.id;

                return (
                  <div key={version.id} className="relative group">
                    {/* Timeline dot */}
                    <div
                      className={`absolute -left-[25px] top-3.5 w-4 h-4 rounded-full border-2 bg-surface transition-colors ${
                        isCurrentActive
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-border-default group-hover:border-brand-600'
                      }`}
                    />

                    <div className="p-4 rounded-lg bg-surface border border-border-default hover:border-brand-600/40 transition shadow-2xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-brand-900 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                            v{version.versionNumber}
                          </span>
                          <span className="text-sm font-semibold text-text-primary">
                            {version.versionLabel}
                          </span>
                          {isCurrentActive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                              Active Version
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {getSourceBadge(version.createdFrom)}
                          {!isCurrentActive && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleRestore(version)}
                              disabled={restoreMutation.isPending}
                              className="text-xs py-1 px-2.5 h-7 flex items-center gap-1.5"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Rollback to this</span>
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-text-secondary pt-1 border-t border-border-default/60">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-text-muted" />
                          {new Date(version.createdAt).toLocaleString()}
                        </span>
                        <span>•</span>
                        <span>{formatFileSize(version.fileSize)}</span>
                        <span>•</span>
                        <span className="font-mono text-[11px] truncate max-w-[200px]">{version.fileName}</span>
                      </div>

                      {/* Text preview toggle */}
                      {version.parsedText && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setExpandedVersionId(isExpanded ? null : version.id)}
                            className="text-xs text-brand-600 hover:underline flex items-center gap-1 font-medium"
                          >
                            <span>{isExpanded ? 'Hide text preview' : 'View extracted text snapshot'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          {isExpanded && (
                            <div className="mt-2 p-3 bg-surface-muted rounded border border-border-default text-xs font-mono text-text-secondary max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                              {version.parsedText}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-border-default flex items-center justify-end bg-surface-muted/40">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CVVersionHistoryModal;
