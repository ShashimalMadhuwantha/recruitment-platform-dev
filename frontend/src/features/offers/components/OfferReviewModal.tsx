import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  XCircle,
  Printer,
  Calendar,
  DollarSign,
  Gift,
  Award,
  Clock,
  Building2,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useRespondOffer } from '../hooks';
import type { JobOfferDto } from '../types';

interface OfferReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: JobOfferDto | null;
  candidateName: string;
  onResponded?: (updatedOffer: JobOfferDto) => void;
}

export const OfferReviewModal: React.FC<OfferReviewModalProps> = ({
  isOpen,
  onClose,
  offer,
  candidateName,
  onResponded,
}) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [signatureName, setSignatureName] = useState(candidateName || '');
  const [declineReason, setDeclineReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const respondMutation = useRespondOffer();

  if (!isOpen || !offer) return null;

  const formattedSalary = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: offer.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(offer.baseSalary || 0);

  const formattedBonus = offer.bonus
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: offer.currency || 'USD',
        maximumFractionDigits: 0,
      }).format(offer.bonus)
    : null;

  const isExpired =
    offer.status === 'EXPIRED' ||
    (offer.status === 'SENT' && new Date() > new Date(offer.expirationDate));

  const canRespond = offer.status === 'SENT' && !isExpired;

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureName.trim()) {
      setErrorMsg('Please enter your full legal name as an electronic signature.');
      return;
    }

    try {
      const updated = await respondMutation.mutateAsync({
        offerId: offer.id,
        data: {
          action: 'ACCEPT',
          signedName: signatureName.trim(),
        },
      });
      setIsAccepting(false);
      onResponded?.(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to accept offer.');
    }
  };

  const handleDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await respondMutation.mutateAsync({
        offerId: offer.id,
        data: {
          action: 'DECLINE',
          declinedReason: declineReason.trim() || undefined,
        },
      });
      setIsDeclining(false);
      onResponded?.(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to decline offer.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-surface rounded-2xl shadow-2xl border border-border-default flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border-default bg-surface-muted flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-600" />
              <h2 className="text-base font-bold text-text-primary">
                Official Employment Offer
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  offer.status === 'ACCEPTED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : offer.status === 'DECLINED'
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : isExpired
                    ? 'bg-zinc-100 text-zinc-700 border-zinc-300'
                    : 'bg-blue-50 text-blue-700 border-blue-300'
                }`}
              >
                {isExpired ? 'EXPIRED' : offer.status}
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              Role: <strong className="text-text-primary">{offer.jobTitle}</strong> • Company: <strong className="text-text-primary">{offer.companyName}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
              title="Print / Save PDF"
              aria-label="Print offer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {errorMsg}
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Banners */}
          {offer.status === 'ACCEPTED' && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">You accepted this employment offer!</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Congratulations! The hiring team has been notified and will reach out with your onboarding details.
                </p>
              </div>
            </div>
          )}

          {offer.status === 'DECLINED' && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-3">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="font-bold">You formally declined this employment offer.</p>
                {offer.declinedReason && (
                  <p className="text-[11px] text-rose-700 mt-0.5 italic">
                    Reason: "{offer.declinedReason}"
                  </p>
                )}
              </div>
            </div>
          )}

          {isExpired && offer.status !== 'ACCEPTED' && offer.status !== 'DECLINED' && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold">This offer has expired.</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  The acceptance deadline ({new Date(offer.expirationDate).toLocaleDateString()}) has passed. Contact the recruiter if you wish to request an extension.
                </p>
              </div>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-border-default bg-surface-muted/60 space-y-1">
              <span className="text-[11px] font-semibold text-text-secondary flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-brand-600" />
                Base Salary
              </span>
              <p className="text-base font-bold text-text-primary">{formattedSalary}</p>
              <p className="text-[10px] text-text-muted">{offer.currency} / year</p>
            </div>

            <div className="p-3.5 rounded-xl border border-border-default bg-surface-muted/60 space-y-1">
              <span className="text-[11px] font-semibold text-text-secondary flex items-center gap-1">
                <Gift className="w-3.5 h-3.5 text-brand-600" />
                Bonus
              </span>
              <p className="text-base font-bold text-text-primary">
                {formattedBonus || '—'}
              </p>
              <p className="text-[10px] text-text-muted">Performance target</p>
            </div>

            <div className="p-3.5 rounded-xl border border-border-default bg-surface-muted/60 space-y-1">
              <span className="text-[11px] font-semibold text-text-secondary flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-brand-600" />
                Target Start
              </span>
              <p className="text-sm font-bold text-text-primary">
                {offer.startDate ? new Date(offer.startDate).toLocaleDateString() : 'TBD'}
              </p>
              <p className="text-[10px] text-text-muted">First working day</p>
            </div>

            <div className="p-3.5 rounded-xl border border-border-default bg-surface-muted/60 space-y-1">
              <span className="text-[11px] font-semibold text-text-secondary flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-brand-600" />
                Valid Until
              </span>
              <p className="text-sm font-bold text-text-primary">
                {offer.expirationDate
                  ? new Date(offer.expirationDate).toLocaleDateString()
                  : '—'}
              </p>
              <p className="text-[10px] text-text-muted">Response deadline</p>
            </div>
          </div>

          {/* Equity Clause if applicable */}
          {offer.equity && (
            <div className="p-3.5 rounded-xl border border-border-default bg-surface flex items-center gap-2.5">
              <Award className="w-4 h-4 text-brand-600 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-text-primary">Equity & Stock Options: </span>
                <span className="text-text-secondary">{offer.equity}</span>
              </div>
            </div>
          )}

          {/* Benefits Summary */}
          {offer.benefitsSummary && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Benefits & Perks
              </h3>
              <div className="p-3.5 rounded-xl border border-border-default bg-surface-muted text-xs text-text-secondary leading-relaxed">
                {offer.benefitsSummary}
              </div>
            </div>
          )}

          {/* Formal Letter Text */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-brand-600" />
              <span>Full Offer Letter</span>
            </h3>
            <div className="p-5 rounded-xl border border-border-default bg-surface text-xs text-text-primary leading-relaxed whitespace-pre-wrap font-mono">
              {offer.offerLetterText}
            </div>
          </div>

          {/* Acceptance Section Form */}
          {isAccepting && (
            <form
              onSubmit={handleAccept}
              className="p-5 rounded-xl border border-emerald-300 bg-emerald-50/50 space-y-3 animate-in fade-in"
            >
              <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                Confirm Formal Offer Acceptance
              </h4>
              <p className="text-xs text-emerald-800">
                By entering your full name below, you confirm your acceptance of the terms specified in this offer letter and authorize the onboarding process.
              </p>
              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">
                  Electronic Signature (Full Legal Name) *
                </label>
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  className="w-full text-xs rounded-lg px-3 py-2 border border-emerald-300 bg-surface text-text-primary focus:ring-2 focus:ring-emerald-600"
                  placeholder="e.g. Jane Doe"
                  required
                />
              </div>
              <div className="flex items-center gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAccepting(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={respondMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {respondMutation.isPending ? 'Submitting...' : 'Sign & Formally Accept'}
                </Button>
              </div>
            </form>
          )}

          {/* Decline Section Form */}
          {isDeclining && (
            <form
              onSubmit={handleDecline}
              className="p-5 rounded-xl border border-rose-300 bg-rose-50/50 space-y-3 animate-in fade-in"
            >
              <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                Decline Employment Offer
              </h4>
              <p className="text-xs text-rose-800">
                Are you sure you wish to decline this offer? This decision is final and will notify the hiring team.
              </p>
              <div>
                <label className="block text-xs font-semibold text-rose-900 mb-1">
                  Reason for Declining (Optional)
                </label>
                <textarea
                  rows={3}
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full text-xs rounded-lg p-3 border border-rose-300 bg-surface text-text-primary focus:ring-2 focus:ring-rose-600"
                  placeholder="e.g. Accepted another offer, compensation did not align, relocation constraints..."
                />
              </div>
              <div className="flex items-center gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeclining(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={respondMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {respondMutation.isPending ? 'Declining...' : 'Confirm Decline'}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border-default bg-surface-muted flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>

          {canRespond && !isAccepting && !isDeclining && (
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDeclining(true)}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Decline Offer
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setIsAccepting(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                Accept Offer
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
