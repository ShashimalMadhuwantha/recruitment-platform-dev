import React from 'react';
import { Button } from '../../../components/ui/Button';
import type { AnonymizedProfileDto } from '../types';

interface BlindRecruitmentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  anonymizedProfile?: AnonymizedProfileDto;
  isLoading: boolean;
}

export const BlindRecruitmentPreviewModal: React.FC<BlindRecruitmentPreviewModalProps> = ({
  isOpen,
  onClose,
  anonymizedProfile,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl border border-border-default shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-6 border-b border-border-default bg-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-lg font-bold">Blind Recruitment Recruiter View</h2>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Simulates how hiring managers and recruiters see your profile during anonymized early-screening stages.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {isLoading || !anonymizedProfile ? (
            <div className="py-12 text-center text-sm text-text-secondary">
              Generating anonymized profile view...
            </div>
          ) : (
            <>
              {/* Compliance Info Banner */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                <span className="text-blue-600 text-lg">🛡️</span>
                <div className="text-xs text-blue-900 space-y-1">
                  <p className="font-bold">Anti-Bias Anonymization Enabled</p>
                  <p>{anonymizedProfile.blindRecruitmentNotice}</p>
                </div>
              </div>

              {/* Candidate Identity Card */}
              <div className="p-5 rounded-xl border border-border-default bg-surface-muted flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-brand-900">
                      {anonymizedProfile.candidatePseudonym}
                    </span>
                    <span className="text-[10px] uppercase font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full">
                      Blind Mode
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-text-primary mt-0.5">
                    {anonymizedProfile.headline}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    Region: {anonymizedProfile.generalLocation || 'General Location Redacted'}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-text-secondary block">ATS Readiness</span>
                  <span className="text-xl font-bold text-emerald-600">
                    {anonymizedProfile.completenessScore}%
                  </span>
                </div>
              </div>

              {/* Redacted Contact Notice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-100 rounded-lg border text-xs text-slate-600">
                  <span className="font-bold block text-slate-500">Email Address:</span>
                  <span className="font-mono text-slate-400 select-none">[REDACTED UNTIL INTERVIEW]</span>
                </div>
                <div className="p-3 bg-slate-100 rounded-lg border text-xs text-slate-600">
                  <span className="font-bold block text-slate-500">Phone Number:</span>
                  <span className="font-mono text-slate-400 select-none">[REDACTED UNTIL INTERVIEW]</span>
                </div>
              </div>

              {/* Skills (Objective Merit) */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-900">
                  Verified Skills & Competencies ({anonymizedProfile.skills.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {anonymizedProfile.skills.map((s, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1.5 bg-surface border border-border-default rounded-lg text-xs font-medium flex items-center gap-2"
                    >
                      <span className="font-bold text-brand-900">{s.name}</span>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
                        Lvl {s.proficiency}/5
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generalized Work Experiences */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-900">
                  Career Experience History (Generalized)
                </h3>
                <div className="space-y-3">
                  {anonymizedProfile.anonymizedExperiences.map((exp) => (
                    <div key={exp.id} className="p-4 rounded-xl border border-border-default bg-surface space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-brand-900">{exp.title}</span>
                        <span className="text-xs text-text-muted">
                          {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate || 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-text-secondary font-mono">
                        {exp.generalizedCompany}
                      </p>
                      {exp.description && (
                        <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Generalized Educations */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-900">
                  Academic Qualifications (Tiered)
                </h3>
                <div className="space-y-2">
                  {anonymizedProfile.anonymizedEducations.map((edu) => (
                    <div key={edu.id} className="p-3 bg-surface rounded-lg border border-border-default text-xs space-y-0.5">
                      <p className="font-bold text-text-primary">{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</p>
                      <p className="text-text-secondary font-mono text-[11px]">{edu.institutionTier}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border-default bg-surface-muted flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  );
};
