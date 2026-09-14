import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { useRequestAccountErasure } from '../hooks';
import type { GdprErasureResponseDto } from '../types';

interface AccountDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountDeletionModal: React.FC<AccountDeletionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [acknowledgment, setAcknowledgment] = useState(false);
  const [result, setResult] = useState<GdprErasureResponseDto | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const erasureMutation = useRequestAccountErasure();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !acknowledgment) return;

    try {
      setErrorText(null);
      const res = await erasureMutation.mutateAsync({
        password,
        reason: reason.trim() || undefined,
        confirmAcknowledgment: acknowledgment,
      });
      setResult(res);
    } catch (err: any) {
      setErrorText(
        err?.response?.data?.error?.message ||
          'Failed to register erasure request. Please verify your password and try again.'
      );
    }
  };

  const handleModalClose = () => {
    setPassword('');
    setReason('');
    setAcknowledgment(false);
    setResult(null);
    setErrorText(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="deletion-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
          <div className="flex items-center gap-2.5 text-rose-800 font-semibold text-base">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span id="deletion-modal-title">Right to Erasure (Account Deletion)</span>
          </div>
          <button
            type="button"
            onClick={handleModalClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {result ? (
            /* Success confirmation display */
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-900">
                    Erasure Request Registered
                  </h4>
                  <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                    {result.message}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2 text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Request Reference ID:</span>
                  <span className="font-mono font-medium text-slate-900">{result.requestId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Status:</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-medium rounded-full text-[11px]">
                    {result.status}
                  </span>
                </div>
                <div className="flex justify-between py-1 items-center">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Statutory SLA Deadline:
                  </span>
                  <span className="font-semibold text-slate-900">
                    {new Date(result.slaDeadline).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-500 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <span>
                  In accordance with GDPR Article 17, our compliance team will systematically purge all identified database records and notify you via email when complete.
                </span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Form view */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Warning Callout */}
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 leading-relaxed">
                <span className="font-bold">Permanent & Irreversible:</span> Requesting erasure under GDPR Article 17 permanently purges your account credentials, CV files, work history, skill verifications, and active job applications.
              </div>

              {errorText && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs font-medium text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{errorText}</span>
                </div>
              )}

              {/* Password Confirmation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Current Password <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="Enter your account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Optional Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Leaving <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Tell us why you are requesting account erasure..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>

              {/* Acknowledgment Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acknowledgment}
                    onChange={(e) => setAcknowledgment(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 leading-snug">
                    I acknowledge that this action will initiate an account erasure workflow under GDPR. All associated records will be permanently removed within 30 days.
                  </span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!password || !acknowledgment || erasureMutation.isPending}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {erasureMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                  <span>Request Account Erasure</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
