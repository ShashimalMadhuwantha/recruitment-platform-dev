import React, { useState } from 'react';
import { X, CheckCircle, UserCheck, Briefcase, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useHireCandidate } from '../hooks';

interface MarkHiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  onHired?: () => void;
}

export const MarkHiredModal: React.FC<MarkHiredModalProps> = ({
  isOpen,
  onClose,
  applicationId,
  candidateName,
  jobTitle,
  onHired,
}) => {
  const [closeRequisition, setCloseRequisition] = useState(true);
  const [hireDate, setHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hireMutation = useHireCandidate();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await hireMutation.mutateAsync({
        applicationId,
        data: {
          closeRequisition,
          hireDate: hireDate ? new Date(hireDate).toISOString() : undefined,
          notes: notes.trim() || undefined,
        },
      });
      onHired?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Failed to mark candidate as hired.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-2xl border border-border-default flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border-default bg-emerald-50/60 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-emerald-950">Mark as Hired</h2>
              <p className="text-xs text-emerald-800">Complete hiring process (FR-RC-25)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-800 hover:bg-emerald-100/50 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl border border-border-default bg-surface-muted/50 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{candidateName}</span>
            </div>
            <p className="text-xs text-text-secondary pl-5.5">
              Role: <span className="font-semibold text-text-primary">{jobTitle}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-brand-600" />
              <span>Official Hire Date</span>
            </label>
            <input
              type="date"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
              className="w-full text-xs rounded-lg px-3 py-2 border border-border-default bg-surface text-text-primary focus:ring-2 focus:ring-brand-600"
              required
            />
          </div>

          {/* Close Requisition Checkbox */}
          <div className="p-3.5 rounded-xl border border-border-default bg-surface-muted/30 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={closeRequisition}
                onChange={(e) => setCloseRequisition(e.target.checked)}
                className="mt-0.5 rounded border-border-default text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-semibold text-text-primary">
                  Close job requisition (Mark as FILLED)
                </span>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Automatically moves the job status to <strong>FILLED</strong> and removes it from public search boards.
                </p>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Internal Hiring Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs rounded-lg p-3 border border-border-default bg-surface text-text-primary focus:ring-2 focus:ring-brand-600"
              placeholder="e.g. Cleared background check, onboarding hardware shipped..."
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-default">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={hireMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{hireMutation.isPending ? 'Processing...' : 'Confirm Hire'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
