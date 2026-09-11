import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { useBuildCV } from '../hooks';
import type { ApplicantProfileDto, CVTemplateType } from '../types';
import {
  Sparkles,
  Layers,
  Check,
  X,
  FileDown,
  Printer,
  Eye,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Wrench,
  Award,
} from 'lucide-react';

export interface CVBuilderModalProps {
  profile: ApplicantProfileDto;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CVBuilderModal: React.FC<CVBuilderModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const buildMutation = useBuildCV();

  const [template, setTemplate] = useState<CVTemplateType>('MODERN_CLEAN');
  const [versionLabel, setVersionLabel] = useState<string>('Full-Stack Specialist CV');
  const [customHeadline, setCustomHeadline] = useState<string>(profile.headline || '');
  const [customSummary, setCustomSummary] = useState<string>(profile.summary || '');
  const [makePrimary, setMakePrimary] = useState<boolean>(false);

  const [includeSummary, setIncludeSummary] = useState<boolean>(true);
  const [includeSkills, setIncludeSkills] = useState<boolean>(true);
  const [includeExperience, setIncludeExperience] = useState<boolean>(true);
  const [includeEducation, setIncludeEducation] = useState<boolean>(true);
  const [includeCertifications, setIncludeCertifications] = useState<boolean>(true);

  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [selectedExperienceIds, setSelectedExperienceIds] = useState<string[]>([]);
  const [selectedEducationIds, setSelectedEducationIds] = useState<string[]>([]);

  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setCustomHeadline(profile.headline || 'Software Engineer');
      setCustomSummary(profile.summary || '');
      setSelectedSkillIds(profile.applicantSkills?.map((s) => s.id) || []);
      setSelectedExperienceIds(profile.workExperiences?.map((e) => e.id) || []);
      setSelectedEducationIds(profile.educations?.map((ed) => ed.id) || []);
    }
  }, [profile]);

  if (!isOpen) return null;

  const toggleSkill = (id: string) => {
    setSelectedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleExperience = (id: string) => {
    setSelectedExperienceIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleEducation = (id: string) => {
    setSelectedEducationIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    setErrorMessage(null);
    setSaveSuccess(null);

    if (!versionLabel.trim()) {
      setErrorMessage('Please specify a version label (e.g., "Frontend Specialist CV").');
      return;
    }

    try {
      await buildMutation.mutateAsync({
        template,
        versionLabel: versionLabel.trim(),
        customHeadline: customHeadline.trim(),
        customSummary: customSummary.trim(),
        includedSections: {
          summary: includeSummary,
          skills: includeSkills,
          experience: includeExperience,
          education: includeEducation,
          certifications: includeCertifications,
        },
        selectedSkillIds,
        selectedExperienceIds,
        selectedEducationIds,
        makePrimary,
      });

      setSaveSuccess('Polished CV successfully compiled and saved to your CV library!');
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1600);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error?.message || 'Failed to generate CV.');
    }
  };

  const filteredSkills = profile.applicantSkills?.filter((s) => selectedSkillIds.includes(s.id)) || [];
  const filteredExperiences = profile.workExperiences?.filter((e) => selectedExperienceIds.includes(e.id)) || [];
  const filteredEducations = profile.educations?.filter((ed) => selectedEducationIds.includes(ed.id)) || [];

  return (
    <div className="fixed inset-0 z-50 bg-brand-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface rounded-xl border border-border-default shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-border-default flex items-center justify-between bg-surface-muted/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-brand-50 border border-brand-200 text-brand-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-brand-900">CV / Resume Builder & Tailoring Engine</h3>
              <p className="text-xs text-text-secondary">
                Generate polished, ATS-optimized PDF resumes directly from your structured profile.
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

        {/* Builder Content Area (Two Columns: Controls on Left, Live Preview on Right) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel: Configuration Controls */}
          <div className="w-full md:w-1/2 p-6 overflow-y-auto space-y-6 border-r border-border-default">
            {saveSuccess && (
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccess}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-lg bg-danger/10 border border-danger/20 text-danger flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Template Selector Cards */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-600" />
                <span>1. Select Template Theme</span>
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {/* Modern Clean */}
                <button
                  type="button"
                  onClick={() => setTemplate('MODERN_CLEAN')}
                  className={`p-3 rounded-lg border text-left transition-all relative ${
                    template === 'MODERN_CLEAN'
                      ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-600/30'
                      : 'border-border-default hover:border-border-default bg-surface'
                  }`}
                >
                  <div className="w-full h-1.5 bg-brand-600 rounded-full mb-2" />
                  <p className="text-xs font-semibold text-text-primary">Modern Clean</p>
                  <p className="text-[10px] text-text-secondary mt-0.5">Two-column accent header, contemporary typography.</p>
                </button>

                {/* Technical ATS */}
                <button
                  type="button"
                  onClick={() => setTemplate('TECHNICAL_ATS')}
                  className={`p-3 rounded-lg border text-left transition-all relative ${
                    template === 'TECHNICAL_ATS'
                      ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-600/30'
                      : 'border-border-default hover:border-border-default bg-surface'
                  }`}
                >
                  <div className="w-full h-1.5 bg-slate-800 rounded-full mb-2" />
                  <p className="text-xs font-semibold text-text-primary">Technical ATS</p>
                  <p className="text-[10px] text-text-secondary mt-0.5">High-contrast, linear single-column, bot-optimized.</p>
                </button>

                {/* Executive Classic */}
                <button
                  type="button"
                  onClick={() => setTemplate('EXECUTIVE_CLASSIC')}
                  className={`p-3 rounded-lg border text-left transition-all relative ${
                    template === 'EXECUTIVE_CLASSIC'
                      ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-600/30'
                      : 'border-border-default hover:border-border-default bg-surface'
                  }`}
                >
                  <div className="w-full h-1.5 bg-brand-900 rounded-full mb-2" />
                  <p className="text-xs font-semibold text-text-primary">Executive Classic</p>
                  <p className="text-[10px] text-text-secondary mt-0.5">Centered header, formal serif, traditional layout.</p>
                </button>
              </div>
            </div>

            {/* Version Label & Headline */}
            <div className="space-y-3.5 p-4 rounded-lg bg-surface-muted/60 border border-border-default">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">
                  Tailored Version Label <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={versionLabel}
                  onChange={(e) => setVersionLabel(e.target.value)}
                  placeholder="e.g. Frontend Specialist CV, Lead Architect CV"
                  className="w-full text-xs px-3 py-2 bg-surface border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">
                  Target Role Headline
                </label>
                <input
                  type="text"
                  value={customHeadline}
                  onChange={(e) => setCustomHeadline(e.target.value)}
                  placeholder="e.g. Senior Full-Stack Engineer — React & Node.js"
                  className="w-full text-xs px-3 py-2 bg-surface border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">
                  Professional Summary
                </label>
                <textarea
                  rows={2}
                  value={customSummary}
                  onChange={(e) => setCustomSummary(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-surface border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={makePrimary}
                  onChange={(e) => setMakePrimary(e.target.checked)}
                  className="rounded border-border-default text-brand-600 focus:ring-brand-600"
                />
                <span className="text-xs font-medium text-text-primary">Set as Primary CV for job applications</span>
              </label>
            </div>

            {/* Section Toggles & Item Selection */}
            <div className="space-y-4">
              <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <span>2. Choose Included Sections & Skills</span>
              </label>

              {/* Skills Checklist */}
              {profile.applicantSkills && profile.applicantSkills.length > 0 && (
                <div className="p-3.5 rounded-lg border border-border-default bg-surface space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-semibold text-brand-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeSkills}
                        onChange={(e) => setIncludeSkills(e.target.checked)}
                        className="rounded border-border-default text-brand-600 focus:ring-brand-600"
                      />
                      <Wrench className="w-3.5 h-3.5 text-brand-600" />
                      <span>Technical Skills ({selectedSkillIds.length}/{profile.applicantSkills.length})</span>
                    </label>
                  </div>

                  {includeSkills && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {profile.applicantSkills.map((s) => {
                        const checked = selectedSkillIds.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleSkill(s.id)}
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition ${
                              checked
                                ? 'bg-brand-50 border-brand-600 text-brand-900'
                                : 'bg-surface border-border-default text-text-muted hover:border-border-default'
                            }`}
                          >
                            {checked ? '✓ ' : ''}{s.skill?.name || 'Skill'}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Work Experience Checklist */}
              {profile.workExperiences && profile.workExperiences.length > 0 && (
                <div className="p-3.5 rounded-lg border border-border-default bg-surface space-y-2.5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-brand-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeExperience}
                      onChange={(e) => setIncludeExperience(e.target.checked)}
                      className="rounded border-border-default text-brand-600 focus:ring-brand-600"
                    />
                    <Briefcase className="w-3.5 h-3.5 text-brand-600" />
                    <span>Work Experience ({selectedExperienceIds.length} Selected)</span>
                  </label>

                  {includeExperience && (
                    <div className="space-y-1.5 pt-1">
                      {profile.workExperiences.map((e) => (
                        <label key={e.id} className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer hover:text-text-primary">
                          <input
                            type="checkbox"
                            checked={selectedExperienceIds.includes(e.id)}
                            onChange={() => toggleExperience(e.id)}
                            className="rounded border-border-default text-brand-600 focus:ring-brand-600"
                          />
                          <span className="font-medium text-text-primary">{e.title}</span>
                          <span>• {e.companyName}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Education Checklist */}
              {profile.educations && profile.educations.length > 0 && (
                <div className="p-3.5 rounded-lg border border-border-default bg-surface space-y-2.5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-brand-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeEducation}
                      onChange={(e) => setIncludeEducation(e.target.checked)}
                      className="rounded border-border-default text-brand-600 focus:ring-brand-600"
                    />
                    <GraduationCap className="w-3.5 h-3.5 text-brand-600" />
                    <span>Education ({selectedEducationIds.length} Selected)</span>
                  </label>

                  {includeEducation && (
                    <div className="space-y-1.5 pt-1">
                      {profile.educations.map((ed) => (
                        <label key={ed.id} className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer hover:text-text-primary">
                          <input
                            type="checkbox"
                            checked={selectedEducationIds.includes(ed.id)}
                            onChange={() => toggleEducation(ed.id)}
                            className="rounded border-border-default text-brand-600 focus:ring-brand-600"
                          />
                          <span className="font-medium text-text-primary">{ed.degree}</span>
                          <span>• {ed.institution}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Live A4 Simulation Preview */}
          <div className="w-full md:w-1/2 p-6 bg-surface-muted/70 overflow-y-auto flex flex-col items-center">
            <div className="flex items-center justify-between w-full max-w-md pb-3 text-xs text-text-secondary">
              <span className="flex items-center gap-1 font-medium">
                <Eye className="w-3.5 h-3.5 text-brand-600" /> Live Canvas Preview
              </span>
              <span className="text-[11px] text-text-muted">A4 Paper Simulation</span>
            </div>

            {/* A4 Paper Canvas */}
            <div
              className={`w-full max-w-md bg-white border border-border-default rounded-sm shadow-md p-6 text-text-primary text-[11px] space-y-3.5 transition-all ${
                template === 'EXECUTIVE_CLASSIC' ? 'font-serif' : 'font-sans'
              }`}
            >
              {/* Header Rendering */}
              {template === 'MODERN_CLEAN' && (
                <div className="border-b border-border-default pb-3">
                  <div className="h-1 bg-brand-600 rounded-full mb-2 w-full" />
                  <h1 className="text-base font-bold text-brand-900">{profile.firstName} {profile.lastName}</h1>
                  <p className="text-xs font-semibold text-brand-600 mt-0.5">{customHeadline}</p>
                  <p className="text-[10px] text-text-secondary mt-1">
                    {[profile.user?.email, profile.phone, profile.location].filter(Boolean).join(' • ')}
                  </p>
                </div>
              )}

              {template === 'TECHNICAL_ATS' && (
                <div className="border-b-2 border-text-primary pb-2 font-mono">
                  <h1 className="text-sm font-bold tracking-wide">{profile.firstName?.toUpperCase()} {profile.lastName?.toUpperCase()}</h1>
                  <p className="text-[11px] font-semibold text-text-primary mt-0.5">{customHeadline}</p>
                  <p className="text-[10px] text-text-secondary mt-0.5">
                    {[profile.user?.email, profile.phone, profile.location].filter(Boolean).join(' | ')}
                  </p>
                </div>
              )}

              {template === 'EXECUTIVE_CLASSIC' && (
                <div className="text-center border-b border-brand-900 pb-3">
                  <h1 className="text-base font-bold text-brand-900">{profile.firstName} {profile.lastName}</h1>
                  <p className="text-xs italic text-text-secondary mt-0.5">{customHeadline}</p>
                  <p className="text-[10px] text-text-muted mt-1">
                    {[profile.user?.email, profile.phone, profile.location].filter(Boolean).join(' • ')}
                  </p>
                </div>
              )}

              {/* Summary */}
              {includeSummary && customSummary && (
                <div className="space-y-1">
                  <h2 className="text-[10px] font-bold text-brand-900 uppercase tracking-wider">Professional Summary</h2>
                  <p className="text-[10px] text-text-secondary leading-relaxed line-clamp-3">
                    {customSummary}
                  </p>
                </div>
              )}

              {/* Skills */}
              {includeSkills && filteredSkills.length > 0 && (
                <div className="space-y-1">
                  <h2 className="text-[10px] font-bold text-brand-900 uppercase tracking-wider">Technical Skills</h2>
                  <p className="text-[10px] text-text-secondary leading-normal">
                    {filteredSkills.map((s) => s.skill?.name || 'Skill').join(' • ')}
                  </p>
                </div>
              )}

              {/* Work Experience */}
              {includeExperience && filteredExperiences.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-[10px] font-bold text-brand-900 uppercase tracking-wider">Experience</h2>
                  {filteredExperiences.map((exp) => (
                    <div key={exp.id} className="space-y-0.5">
                      <div className="flex justify-between font-semibold text-[10.5px]">
                        <span>{exp.title}</span>
                        <span className="text-[9px] text-text-muted">
                          {exp.startDate ? new Date(exp.startDate).getFullYear() : ''} - {exp.isCurrent ? 'Present' : exp.endDate ? new Date(exp.endDate).getFullYear() : ''}
                        </span>
                      </div>
                      <p className="text-brand-700 text-[10px]">{exp.companyName}</p>
                      {exp.description && (
                        <p className="text-text-secondary text-[9.5px] line-clamp-2">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Education */}
              {includeEducation && filteredEducations.length > 0 && (
                <div className="space-y-1.5">
                  <h2 className="text-[10px] font-bold text-brand-900 uppercase tracking-wider">Education</h2>
                  {filteredEducations.map((edu) => (
                    <div key={edu.id} className="flex justify-between text-[10px]">
                      <div>
                        <span className="font-semibold">{edu.degree}</span>
                        <span className="text-text-secondary"> • {edu.institution}</span>
                      </div>
                      <span className="text-[9px] text-text-muted">
                        {edu.endDate ? new Date(edu.endDate).getFullYear() : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-border-default flex items-center justify-between bg-surface-muted/40">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={buildMutation.isPending}>
            Cancel
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
              className="flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Preview</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerate}
              disabled={buildMutation.isPending}
              className="flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              <span>{buildMutation.isPending ? 'Generating PDF...' : 'Compile & Save CV Version'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVBuilderModal;
