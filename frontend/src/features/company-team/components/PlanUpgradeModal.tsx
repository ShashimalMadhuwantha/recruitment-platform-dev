import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, Shield, Zap, Building2, Send, Check } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useRequestPlanUpgrade } from '../hooks';
import type { PlanTier, PlanUsageDto } from '../types';

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsage?: PlanUsageDto;
}

export const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({
  isOpen,
  onClose,
  currentUsage,
}) => {
  const [selectedTier, setSelectedTier] = useState<PlanTier>(
    currentUsage?.plan?.tier === 'FREE' ? 'PRO' : 'ENTERPRISE'
  );
  const [requestedSeats, setRequestedSeats] = useState<number>(
    selectedTier === 'ENTERPRISE' ? 25 : 10
  );
  const [message, setMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const upgradeMutation = useRequestPlanUpgrade();

  if (!isOpen) return null;

  const handleSelectTier = (tier: PlanTier) => {
    setSelectedTier(tier);
    if (tier === 'PRO') setRequestedSeats(10);
    else if (tier === 'ENTERPRISE') setRequestedSeats(50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      await upgradeMutation.mutateAsync({
        requestedTier: selectedTier,
        note: message.trim() || undefined,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to submit plan upgrade request');
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setErrorMsg(null);
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-surface rounded-2xl shadow-2xl border border-border-default overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border-default bg-surface-muted flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-brand-50 text-brand-600 border border-brand-200">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-text-primary tracking-tight">
                Upgrade Organization Subscription
              </h2>
            </div>
            <p className="text-xs text-text-secondary">
              Scale your hiring capacity with additional recruiter seats, automated ATS pipelines, and priority moderation.
            </p>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-text-primary">
                Upgrade Request Dispatched
              </h3>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                Your request to upgrade to the <strong>{selectedTier} Tier</strong> has been sent to our Platform Administrators. We will review your account and adjust your seat quotas shortly.
              </p>
            </div>
            <div className="pt-4">
              <Button variant="primary" size="sm" onClick={handleResetAndClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {errorMsg}
              </div>
            )}

            {/* Plan Tier Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* PRO Tier Card */}
              <div
                onClick={() => handleSelectTier('PRO')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedTier === 'PRO'
                    ? 'border-brand-600 ring-2 ring-brand-500/20 bg-brand-50/20 shadow-xs'
                    : 'border-border-default bg-surface hover:bg-surface-muted/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-brand-600" />
                    <h3 className="text-sm font-bold text-text-primary">PRO Tier</h3>
                  </div>
                  {selectedTier === 'PRO' && (
                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary mb-3">
                  Ideal for scaling recruitment agencies and expanding internal talent teams.
                </p>
                <ul className="text-xs text-text-muted space-y-1.5">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong>10 Recruiter Seats</strong></span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>25 Active Job Postings</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>1,000 ATS Scans / mo</span>
                  </li>
                </ul>
              </div>

              {/* ENTERPRISE Tier Card */}
              <div
                onClick={() => handleSelectTier('ENTERPRISE')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedTier === 'ENTERPRISE'
                    ? 'border-purple-600 ring-2 ring-purple-500/20 bg-purple-50/20 shadow-xs'
                    : 'border-border-default bg-surface hover:bg-surface-muted/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <h3 className="text-sm font-bold text-text-primary">ENTERPRISE</h3>
                  </div>
                  {selectedTier === 'ENTERPRISE' && (
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary mb-3">
                  Uncapped recruitment volume, custom role permissions, and bespoke integrations.
                </p>
                <ul className="text-xs text-text-muted space-y-1.5">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span><strong>100+ Seats (Custom)</strong></span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>Unlimited Active Jobs</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>Unlimited ATS Scans</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Requested Seats Input */}
            <div className="space-y-1.5">
              <label htmlFor="req-seats" className="block text-xs font-semibold text-text-primary">
                Desired Team Seats Quota
              </label>
              <input
                id="req-seats"
                type="number"
                min={1}
                max={500}
                value={requestedSeats}
                onChange={(e) => setRequestedSeats(parseInt(e.target.value, 10) || 1)}
                className="w-full h-10 px-3.5 bg-surface rounded-xl border border-border-default text-sm text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              />
              <p className="text-[11px] text-text-muted">
                {selectedTier === 'PRO'
                  ? 'Standard Pro tier includes 10 seats.'
                  : 'Specify the approximate number of recruiter & interviewer seats required.'}
              </p>
            </div>

            {/* Optional Note Message */}
            <div className="space-y-1.5">
              <label htmlFor="upgrade-notes" className="block text-xs font-semibold text-text-primary">
                Additional Request Notes (Optional)
              </label>
              <textarea
                id="upgrade-notes"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="E.g., Anticipated hiring ramp for engineering & product departments in Q3..."
                className="w-full p-3 bg-surface rounded-xl border border-border-default text-sm text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 resize-none placeholder:text-text-muted"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" size="sm" onClick={handleResetAndClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={upgradeMutation.isPending}
                className="gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Upgrade Request</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PlanUpgradeModal;
