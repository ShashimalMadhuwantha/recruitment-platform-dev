import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ScoreBadge } from '../../../components/ui/ScoreBadge';
import { useApplicantProfile } from '../../applicant-profile/hooks';
import { useSubmitApplication } from '../hooks';
import type { PublicJobDetailDto, ScreeningAnswerItem } from '@recruitment-platform/shared';
import {
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Upload,
} from 'lucide-react';

interface ApplyJobModalProps {
  job: PublicJobDetailDto;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ApplyJobModal: React.FC<ApplyJobModalProps> = ({
  job,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { data: profile, isLoading: isLoadingProfile } = useApplicantProfile();
  const submitMutation = useSubmitApplication();

  const [step, setStep] = useState<number>(1);
  const [selectedCvId, setSelectedCvId] = useState<string>('');
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize selected CV from primary CV if available
  React.useEffect(() => {
    if (profile?.cvs && profile.cvs.length > 0 && !selectedCvId) {
      const primary = profile.cvs.find((c: any) => c.isPrimary) || profile.cvs[0];
      setSelectedCvId(primary.id);
    }
  }, [profile, selectedCvId]);

  if (!isOpen) return null;

  const cvs = profile?.cvs || [];
  const questions = job.screeningQuestions || [];
  const hasQuestions = questions.length > 0;
  const totalSteps = hasQuestions ? 3 : 2;

  const handleAnswerChange = (questionId: string, answer: string) => {
    setScreeningAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
    setValidationError(null);
  };

  const handleNext = () => {
    setValidationError(null);

    // Step 1 validation: Resume selection
    if (step === 1) {
      if (cvs.length === 0) {
        setValidationError('Please upload a resume to your profile before submitting an application.');
        return;
      }
      if (!selectedCvId) {
        setValidationError('Please select a resume to attach to this application.');
        return;
      }
      setStep(hasQuestions ? 2 : 3);
      return;
    }

    // Step 2 validation: Screening questions
    if (step === 2 && hasQuestions) {
      for (const q of questions) {
        if (q.isKnockout && !screeningAnswers[q.id]) {
          setValidationError(`Please answer the required question: "${q.question}"`);
          return;
        }
      }
      setStep(3);
      return;
    }
  };

  const handleBack = () => {
    setValidationError(null);
    if (step === 3) {
      setStep(hasQuestions ? 2 : 1);
    } else if (step === 2) {
      setStep(1);
    }
  };

  const handleSubmit = async () => {
    setValidationError(null);

    const formattedAnswers: ScreeningAnswerItem[] = questions.map((q) => ({
      questionId: q.id,
      question: q.question,
      answer: screeningAnswers[q.id] || '',
    }));

    try {
      await submitMutation.mutateAsync({
        jobId: job.id,
        cvId: selectedCvId || undefined,
        coverLetter: coverLetter.trim() || undefined,
        screeningAnswers: formattedAnswers.length > 0 ? formattedAnswers : undefined,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setValidationError(err?.response?.data?.message || err?.message || 'Failed to submit application.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border-default rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-border-default">
          <div>
            <span className="text-[11px] font-semibold text-brand-600 uppercase tracking-wider">
              Submit Application
            </span>
            <h2 className="text-lg font-bold text-brand-900 mt-0.5">{job.title}</h2>
            <p className="text-xs text-text-secondary">{job.companyName} • {job.location || 'Remote'}</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-surface-muted transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator (Only if not submitted) */}
        {!submitMutation.isSuccess && (
          <div className="flex items-center justify-between px-2 text-xs font-semibold">
            <span className={step === 1 ? 'text-brand-600' : 'text-text-muted'}>
              1. Select Resume
            </span>
            {hasQuestions && (
              <span className={step === 2 ? 'text-brand-600' : 'text-text-muted'}>
                2. Screening Questions
              </span>
            )}
            <span className={step === 3 ? 'text-brand-600' : 'text-text-muted'}>
              {hasQuestions ? '3.' : '2.'} Review & Submit
            </span>
          </div>
        )}

        {/* Validation Alert */}
        {validationError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Step 1: Resume Selection */}
        {step === 1 && !submitMutation.isSuccess && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Choose Resume to Attach:
              </label>
              <p className="text-xs text-text-secondary mb-3">
                The attached resume will be parsed and evaluated by our deterministic ATS algorithm.
              </p>

              {isLoadingProfile ? (
                <div className="py-6 text-center text-xs text-text-secondary">Loading profile resumes...</div>
              ) : cvs.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2 text-center">
                  <p className="text-xs text-amber-800 font-medium">No resumes found in your profile.</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/applicant/profile?tab=resume')}
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Upload Resume Now
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {cvs.map((cv: any) => (
                    <label
                      key={cv.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                        selectedCvId === cv.id
                          ? 'border-brand-600 bg-brand-50/50'
                          : 'border-border-default hover:border-brand-300 bg-surface'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="cvSelect"
                          value={cv.id}
                          checked={selectedCvId === cv.id}
                          onChange={() => setSelectedCvId(cv.id)}
                          className="text-brand-600 focus:ring-brand-500"
                        />
                        <div>
                          <p className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-brand-600" />
                            {cv.fileName}
                            {cv.isPrimary && (
                              <span className="text-[10px] font-semibold bg-brand-100 text-brand-700 px-1.5 py-0.2 rounded">
                                Primary
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-text-secondary">
                            {(cv.fileSize / 1024).toFixed(0)} KB • Uploaded {new Date(cv.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Screening Questions */}
        {step === 2 && hasQuestions && !submitMutation.isSuccess && (
          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
            <p className="text-xs text-text-secondary">
              Please answer the employer's screening questions. Questions with a knockout flag are critical qualification criteria.
            </p>

            {questions.map((q, idx) => (
              <div key={q.id || idx} className="p-3.5 bg-surface-muted rounded-lg border border-border-default space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-text-primary">
                    {idx + 1}. {q.question}
                  </span>
                  {q.isKnockout && (
                    <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      Knockout
                    </span>
                  )}
                </div>

                {(q.type as string) === 'YES_NO' || (q.type as string) === 'boolean' ? (
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value="YES"
                        checked={
                          screeningAnswers[q.id]?.toUpperCase() === 'YES' ||
                          screeningAnswers[q.id]?.toLowerCase() === 'true'
                        }
                        onChange={() => handleAnswerChange(q.id, 'true')}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value="NO"
                        checked={
                          screeningAnswers[q.id]?.toUpperCase() === 'NO' ||
                          screeningAnswers[q.id]?.toLowerCase() === 'false'
                        }
                        onChange={() => handleAnswerChange(q.id, 'false')}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      No
                    </label>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={screeningAnswers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder="Enter your response..."
                    className="w-full text-xs px-3 py-2 rounded-lg border border-border-default focus:ring-2 focus:ring-brand-600 focus:outline-none"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step 3: Review & Cover Letter */}
        {step === 3 && !submitMutation.isSuccess && (
          <div className="space-y-4">
            <div>
              <label htmlFor="coverLetter" className="block text-xs font-semibold text-text-primary mb-1">
                Cover Letter (Optional)
              </label>
              <textarea
                id="coverLetter"
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Explain why you are an ideal fit for this role, key technical accomplishments, or availability..."
                className="w-full text-xs p-3 rounded-lg border border-border-default focus:ring-2 focus:ring-brand-600 focus:outline-none resize-none"
              />
            </div>

            <Card dense className="bg-surface-muted border-border-default text-xs space-y-1.5">
              <p className="font-semibold text-text-primary">Application Summary:</p>
              <p className="text-text-secondary">
                • Attached Resume: {cvs.find((c: any) => c.id === selectedCvId)?.fileName || 'Selected CV'}
              </p>
              {hasQuestions && (
                <p className="text-text-secondary">
                  • Screening Questions Answered: {Object.keys(screeningAnswers).length} of {questions.length}
                </p>
              )}
              <p className="text-[11px] text-brand-600 font-medium pt-1">
                ✓ Automated ATS match scoring will be computed deterministically upon submission.
              </p>
            </Card>
          </div>
        )}

        {/* Step 4: Success State */}
        {submitMutation.isSuccess && (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-text-primary">
                {submitMutation.data.knockoutFailed
                  ? 'Application Received (Review Pending)'
                  : 'Application Successfully Submitted!'}
              </h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                {submitMutation.data.message}
              </p>
            </div>

            {submitMutation.data.overallScore !== null && submitMutation.data.overallScore !== undefined && (
              <div className="inline-flex items-center gap-2 p-3 bg-surface-muted border border-border-default rounded-lg">
                <span className="text-xs font-semibold text-text-primary">Initial ATS Match Score:</span>
                <ScoreBadge score={submitMutation.data.overallScore} size="md" />
              </div>
            )}

            <div className="pt-3 flex items-center justify-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  navigate('/applicant/dashboard');
                }}
              >
                Go to Application Dashboard
              </Button>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}

        {/* Modal Navigation Buttons */}
        {!submitMutation.isSuccess && (
          <div className="flex items-center justify-between pt-4 border-t border-border-default">
            {step > 1 ? (
              <Button variant="secondary" size="sm" onClick={handleBack}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < (hasQuestions ? 3 : 2) ? (
              <Button variant="primary" size="sm" onClick={handleNext}>
                Next
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                isLoading={submitMutation.isPending}
              >
                Submit Application
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplyJobModal;
