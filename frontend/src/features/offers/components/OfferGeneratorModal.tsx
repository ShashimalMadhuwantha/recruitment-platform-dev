import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Save,
  DollarSign,
  Calendar,
  Gift,
  Award,
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useCreateOrUpdateOffer, useSendOffer } from '../hooks';
import type { JobOfferDto, CreateOfferDto } from '../types';

interface OfferGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName?: string;
  existingOffer?: JobOfferDto | null;
  onOfferCreated?: (offer: JobOfferDto) => void;
}

export const OfferGeneratorModal: React.FC<OfferGeneratorModalProps> = ({
  isOpen,
  onClose,
  applicationId,
  candidateName,
  candidateEmail,
  jobTitle,
  companyName = 'Our Company',
  existingOffer,
  onOfferCreated,
}) => {
  const [baseSalary, setBaseSalary] = useState<number>(120000);
  const [currency, setCurrency] = useState<string>('USD');
  const [bonus, setBonus] = useState<number | undefined>(undefined);
  const [equity, setEquity] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [expirationDate, setExpirationDate] = useState<string>('');
  const [benefitsSummary, setBenefitsSummary] = useState<string>(
    'Comprehensive Medical, Dental & Vision coverage (100% employer paid), 401(k) with 4% company match, Unlimited PTO policy, $2,500 annual professional development budget, and remote home workstation stipend.'
  );
  const [notes, setNotes] = useState<string>('');
  const [offerLetterText, setOfferLetterText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'details' | 'preview'>('details');
  const [formError, setFormError] = useState<string | null>(null);

  const createOfferMutation = useCreateOrUpdateOffer();
  const sendOfferMutation = useSendOffer();

  // Initialize dates and existing offer data
  useEffect(() => {
    if (existingOffer) {
      setBaseSalary(existingOffer.baseSalary);
      setCurrency(existingOffer.currency || 'USD');
      setBonus(existingOffer.bonus ? Number(existingOffer.bonus) : undefined);
      setEquity(existingOffer.equity || '');
      setStartDate(
        existingOffer.startDate ? existingOffer.startDate.split('T')[0] : ''
      );
      setExpirationDate(
        existingOffer.expirationDate ? existingOffer.expirationDate.split('T')[0] : ''
      );
      setBenefitsSummary(existingOffer.benefitsSummary || '');
      setNotes(existingOffer.notes || '');
      setOfferLetterText(existingOffer.offerLetterText || '');
    } else {
      // Default start date: 3 weeks from now
      const start = new Date();
      start.setDate(start.getDate() + 21);
      setStartDate(start.toISOString().split('T')[0]);

      // Default expiration date: 7 days from now
      const exp = new Date();
      exp.setDate(exp.getDate() + 7);
      setExpirationDate(exp.toISOString().split('T')[0]);
    }
  }, [existingOffer, isOpen]);

  // Regenerate draft letter template if user hasn't heavily customized it
  const generateTemplateLetter = () => {
    const formattedSalary = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(baseSalary || 0);

    const bonusClause = bonus
      ? `\n- **Target Performance Bonus:** ${new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency || 'USD',
          maximumFractionDigits: 0,
        }).format(bonus)} annualized, subject to company and individual KPIs.`
      : '';

    const equityClause = equity ? `\n- **Equity Incentive:** ${equity}` : '';

    return `# Formal Employment Offer

**Date:** ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

**To:** ${candidateName}  
**Email:** ${candidateEmail}  

Dear ${candidateName},

On behalf of **${companyName}**, we are thrilled to extend an official offer of employment for the position of **${jobTitle}**. We were thoroughly impressed by your background, technical depth, and collaborative approach throughout our evaluation process.

### Compensation & Key Terms
- **Position Title:** ${jobTitle}
- **Base Annual Compensation:** ${formattedSalary} (${currency}) per annum, payable in regular semi-monthly payroll cycles.${bonusClause}${equityClause}
- **Target Start Date:** ${startDate ? new Date(startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'To be confirmed'}
- **Offer Valid Until:** ${expirationDate ? new Date(expirationDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '7 days from receipt'}

### Benefits & Perks
${benefitsSummary}

### Acceptance of Offer
This offer is contingent upon verification of reference checks and statutory right-to-work documentation. To accept this position, please sign and submit your acceptance through the candidate recruitment portal before the offer validity expiration date.

We are very excited about the impact you will bring to our team!

Sincerely,  
**The Hiring Team at ${companyName}**
`;
  };

  const handlePreviewTabClick = () => {
    if (!offerLetterText.trim()) {
      setOfferLetterText(generateTemplateLetter());
    }
    setActiveTab('preview');
  };

  const handleSave = async (autoSend: boolean) => {
    setFormError(null);
    if (!baseSalary || baseSalary <= 0) {
      setFormError('Please provide a valid annual base salary.');
      return;
    }
    if (!startDate) {
      setFormError('Please select an expected start date.');
      return;
    }
    if (!expirationDate) {
      setFormError('Please specify the offer expiration date.');
      return;
    }

    const finalLetterText = offerLetterText.trim() || generateTemplateLetter();

    const payload: CreateOfferDto = {
      baseSalary: Number(baseSalary),
      currency,
      bonus: bonus ? Number(bonus) : undefined,
      equity: equity.trim() || undefined,
      startDate: new Date(startDate).toISOString(),
      expirationDate: new Date(expirationDate).toISOString(),
      offerLetterText: finalLetterText,
      benefitsSummary: benefitsSummary.trim() || undefined,
      notes: notes.trim() || undefined,
      autoSend,
    };

    try {
      const savedOffer = await createOfferMutation.mutateAsync({
        applicationId,
        data: payload,
      });

      if (autoSend && savedOffer.id && savedOffer.status === 'DRAFT') {
        await sendOfferMutation.mutateAsync(savedOffer.id);
      }

      onOfferCreated?.(savedOffer);
      onClose();
    } catch (err: any) {
      setFormError(
        err.response?.data?.message || err.message || 'Failed to generate employment offer.'
      );
    }
  };

  if (!isOpen) return null;

  const isSentOrAccepted = Boolean(
    existingOffer && ['SENT', 'ACCEPTED', 'DECLINED'].includes(existingOffer.status)
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-surface rounded-2xl shadow-2xl border border-border-default flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border-default bg-surface-muted flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-600" />
              <h2 className="text-base font-bold text-text-primary">
                {existingOffer ? 'Manage Employment Offer' : 'Generate Formal Job Offer'}
              </h2>
              {existingOffer && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    existingOffer.status === 'ACCEPTED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : existingOffer.status === 'SENT'
                      ? 'bg-blue-50 text-blue-700 border-blue-300'
                      : existingOffer.status === 'DECLINED'
                      ? 'bg-rose-50 text-rose-700 border-rose-300'
                      : 'bg-amber-50 text-amber-700 border-amber-300'
                  }`}
                >
                  Status: {existingOffer.status}
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary">
              Candidate: <strong className="text-text-primary">{candidateName}</strong> ({candidateEmail}) • Requisition: <strong className="text-text-primary">{jobTitle}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 border-b border-border-default flex gap-6 bg-surface">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`py-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'details'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Compensation & Terms
          </button>
          <button
            type="button"
            onClick={handlePreviewTabClick}
            className={`py-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Offer Letter Preview & Markdown</span>
          </button>
        </div>

        {formError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'details' ? (
            <div className="space-y-4">
              {/* Compensation Group */}
              <div className="p-4 rounded-xl border border-border-default bg-surface-muted/40 space-y-4">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-brand-600" />
                  <span>Compensation Package</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      disabled={isSentOrAccepted}
                      className="w-full text-xs rounded-lg px-3 py-2 border border-border-default bg-surface text-text-primary focus:ring-2 focus:ring-brand-600"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="AUD">AUD ($)</option>
                      <option value="SGD">SGD ($)</option>
                      <option value="LKR">LKR (Rs)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Base Salary (Annual) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={baseSalary}
                        onChange={(e) => setBaseSalary(Number(e.target.value))}
                        disabled={isSentOrAccepted}
                        className="w-full text-xs rounded-lg px-3 py-2 border border-border-default bg-surface text-text-primary focus:ring-2 focus:ring-brand-600"
                        placeholder="e.g. 135000"
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-text-primary mb-1 flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5 text-brand-600" />
                      <span>Bonus (Annual)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={bonus ?? ''}
                      onChange={(e) =>
                        setBonus(e.target.value ? Number(e.target.value) : undefined)
                      }
                      disabled={isSentOrAccepted}
                      className="w-full text-xs rounded-lg px-3 py-2 border border-border-default bg-surface text-text-primary focus:ring-2 focus:ring-brand-600"
                      placeholder="e.g. 15000"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-text-primary mb-1 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-brand-600" />
                      <span>Equity / Options</span>
                    </label>
                    <input
                      type="text"
                      value={equity}
                      onChange={(e) => setEquity(e.target.value)}
                      disabled={isSentOrAccepted}
                      className="w-full text-xs rounded-lg px-3 py-2 border border-border-default bg-surface text-text-primary focus:ring-2 focus:ring-brand-600"
                      placeholder="e.g. 10,000 ISO shares (4-year vesting, 1-year cliff)"
                    />
                  </div>
                </div>
              </div>

              {/* Schedule Dates */}
              <div className="p-4 rounded-xl border border-border-default bg-surface-muted/40 space-y-4">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  <span>Timeline & Expiration</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Target Start Date *
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      disabled={isSentOrAccepted}
                      className="w-full text-xs rounded-lg px-3 py-2 border border-border-default bg-surface text-text-primary focus:ring-2 focus:ring-brand-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-brand-600" />
                      <span>Offer Expiration Date *</span>
                    </label>
                    <input
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      disabled={isSentOrAccepted}
                      className="w-full text-xs rounded-lg px-3 py-2 border border-border-default bg-surface text-text-primary focus:ring-2 focus:ring-brand-600"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Benefits & Internal Notes */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Benefits & Perks Summary
                  </label>
                  <textarea
                    rows={3}
                    value={benefitsSummary}
                    onChange={(e) => setBenefitsSummary(e.target.value)}
                    disabled={isSentOrAccepted}
                    className="w-full text-xs rounded-lg p-3 border border-border-default bg-surface text-text-primary focus:ring-2 focus:ring-brand-600"
                    placeholder="Describe medical coverage, 401(k), PTO, wellness stipends..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Internal Hiring Team Notes (Private)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs rounded-lg p-3 border border-border-default bg-surface text-text-primary focus:ring-2 focus:ring-brand-600"
                    placeholder="Optional notes for internal tracking (e.g. approved by VP of Engineering)..."
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-secondary">
                  Review and customize the Markdown offer letter sent to the candidate.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOfferLetterText(generateTemplateLetter())}
                  className="text-xs gap-1 text-brand-600 border-brand-200"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Reset to Template</span>
                </Button>
              </div>

              <textarea
                rows={16}
                value={offerLetterText}
                onChange={(e) => setOfferLetterText(e.target.value)}
                disabled={isSentOrAccepted}
                className="w-full font-mono text-xs rounded-xl p-4 border border-border-default bg-surface text-text-primary focus:ring-2 focus:ring-brand-600 leading-relaxed"
                placeholder="Offer letter content in markdown..."
              />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-border-default bg-surface-muted flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-text-secondary flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
            <span>Sending will notify candidate via email & in-app inbox</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>

            {!isSentOrAccepted && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={createOfferMutation.isPending}
                  onClick={() => handleSave(false)}
                  className="gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Draft</span>
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={createOfferMutation.isPending || sendOfferMutation.isPending}
                  onClick={() => handleSave(true)}
                  className="gap-1.5 bg-brand-600 hover:bg-brand-700 text-white"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Official Offer</span>
                </Button>
              </>
            )}

            {existingOffer?.status === 'DRAFT' && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={sendOfferMutation.isPending}
                onClick={async () => {
                  await sendOfferMutation.mutateAsync(existingOffer.id);
                  onClose();
                }}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Draft to Candidate</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
