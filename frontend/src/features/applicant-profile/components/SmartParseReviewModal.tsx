import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { useSyncResumeSelective } from '../hooks';
import type { CVDto } from '../types';
import {
  CheckCircle2,
  Sparkles,
  Briefcase,
  GraduationCap,
  Wrench,
  FileText,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';

export interface SmartParseReviewModalProps {
  cv: CVDto | null;
  isOpen: boolean;
  onClose: () => void;
  onSyncSuccess?: () => void;
}

export const SmartParseReviewModal: React.FC<SmartParseReviewModalProps> = ({
  cv,
  isOpen,
  onClose,
  onSyncSuccess,
}) => {
  const syncMutation = useSyncResumeSelective();

  const [updateHeadline, setUpdateHeadline] = useState(true);
  const [updateSummary, setUpdateSummary] = useState(true);
  const [importExperiences, setImportExperiences] = useState(true);
  const [importEducations, setImportEducations] = useState(true);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const parsed = cv?.parsedJson;
  const detectedSkills = parsed?.detectedSkills || [];
  const detectedExperiences = parsed?.workExperience || [];
  const detectedEducations = parsed?.education || [];

  useEffect(() => {
    if (cv && detectedSkills.length > 0) {
      setSelectedSkills(detectedSkills);
    }
    setSyncStatus(null);
    setErrorMessage(null);
  }, [cv]);

  if (!isOpen || !cv) return null;

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const selectAllSkills = () => setSelectedSkills(detectedSkills);
  const deselectAllSkills = () => setSelectedSkills([]);

  const handleSync = async () => {
    setErrorMessage(null);
    setSyncStatus(null);
    try {
      const res = await syncMutation.mutateAsync({
        cvId: cv.id,
        data: {
          updateHeadline,
          updateSummary,
          selectedSkillNames: selectedSkills,
          importExperiences,
          importEducations,
        },
      });
      setSyncStatus(res.message || 'Profile successfully enriched!');
      if (onSyncSuccess) onSyncSuccess();
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error?.message || 'Failed to sync parsed data.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-brand-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface rounded-xl border border-border-default shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-surface-muted/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-brand-50 border border-brand-200 text-brand-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-brand-900">Smart Resume Parse Verification</h3>
              <p className="text-xs text-text-secondary">
                Verify and selectively import extracted entities from <span className="font-medium text-brand-700">{cv.fileName}</span> into your profile.
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
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {syncStatus && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncStatus}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-danger/10 border border-danger/20 text-danger flex items-center gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Headline & Summary */}
          <div className="p-4 rounded-lg bg-surface border border-border-default space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-900 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 text-brand-600" />
              <span>Basic Headline & Summary</span>
            </div>

            {parsed?.workExperience?.[0]?.title && (
              <label className="flex items-start gap-3 p-2 rounded hover:bg-surface-muted cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={updateHeadline}
                  onChange={(e) => setUpdateHeadline(e.target.checked)}
                  className="mt-0.5 rounded border-border-default text-brand-600 focus:ring-brand-600"
                />
                <div className="text-xs">
                  <span className="font-medium text-text-primary">Set headline to: </span>
                  <span className="text-brand-700 font-semibold">{parsed.workExperience[0].title}</span>
                </div>
              </label>
            )}

            {parsed?.summary && (
              <label className="flex items-start gap-3 p-2 rounded hover:bg-surface-muted cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={updateSummary}
                  onChange={(e) => setUpdateSummary(e.target.checked)}
                  className="mt-0.5 rounded border-border-default text-brand-600 focus:ring-brand-600"
                />
                <div className="text-xs">
                  <span className="font-medium text-text-primary">Import Professional Summary:</span>
                  <p className="text-text-secondary mt-0.5 line-clamp-2 italic">"{parsed.summary}"</p>
                </div>
              </label>
            )}
          </div>

          {/* Section 2: Detected Skills */}
          {detectedSkills.length > 0 && (
            <div className="p-4 rounded-lg bg-surface border border-border-default space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-900 uppercase tracking-wider">
                  <Wrench className="w-3.5 h-3.5 text-brand-600" />
                  <span>Detected Technical Skills ({selectedSkills.length}/{detectedSkills.length})</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={selectAllSkills}
                    className="text-brand-600 hover:underline font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-text-muted">•</span>
                  <button
                    type="button"
                    onClick={deselectAllSkills}
                    className="text-text-secondary hover:underline"
                  >
                    Deselect
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {detectedSkills.map((skill) => {
                  const isChecked = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                        isChecked
                          ? 'bg-brand-50 border-brand-600 text-brand-900 shadow-xs'
                          : 'bg-surface border-border-default text-text-muted hover:border-border-default'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[9px] ${isChecked ? 'bg-brand-600 text-white' : 'border border-border-default'}`}>
                        {isChecked ? <Check className="w-2.5 h-2.5" /> : null}
                      </span>
                      <span>{skill}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: Work Experience */}
          {detectedExperiences.length > 0 && (
            <div className="p-4 rounded-lg bg-surface border border-border-default space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-900 uppercase tracking-wider">
                  <Briefcase className="w-3.5 h-3.5 text-brand-600" />
                  <span>Work Experience ({detectedExperiences.length} Roles Found)</span>
                </div>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importExperiences}
                    onChange={(e) => setImportExperiences(e.target.checked)}
                    className="rounded border-border-default text-brand-600 focus:ring-brand-600"
                  />
                  <span className="font-medium text-text-secondary">Import Roles</span>
                </label>
              </div>

              {importExperiences && (
                <div className="space-y-2 pt-1">
                  {detectedExperiences.map((exp: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded bg-surface-muted/60 border border-border-default text-xs space-y-0.5">
                      <p className="font-semibold text-text-primary">{exp.title || 'Role Title'}</p>
                      <p className="text-brand-700">{exp.company || 'Company'}</p>
                      {exp.description && (
                        <p className="text-text-secondary line-clamp-2 pt-1">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section 4: Education */}
          {detectedEducations.length > 0 && (
            <div className="p-4 rounded-lg bg-surface border border-border-default space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-900 uppercase tracking-wider">
                  <GraduationCap className="w-3.5 h-3.5 text-brand-600" />
                  <span>Education ({detectedEducations.length} Degrees Found)</span>
                </div>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importEducations}
                    onChange={(e) => setImportEducations(e.target.checked)}
                    className="rounded border-border-default text-brand-600 focus:ring-brand-600"
                  />
                  <span className="font-medium text-text-secondary">Import Education</span>
                </label>
              </div>

              {importEducations && (
                <div className="space-y-2 pt-1">
                  {detectedEducations.map((edu: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded bg-surface-muted/60 border border-border-default text-xs">
                      <p className="font-semibold text-text-primary">
                        {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                      </p>
                      <p className="text-text-secondary">{edu.institution}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border-default flex items-center justify-between bg-surface-muted/40">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={syncMutation.isPending}>
            Keep CV Only (Skip Import)
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSync}
            disabled={syncMutation.isPending}
            className="flex items-center gap-2"
          >
            {syncMutation.isPending ? 'Syncing to Profile...' : 'Confirm & Sync to Profile'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SmartParseReviewModal;
