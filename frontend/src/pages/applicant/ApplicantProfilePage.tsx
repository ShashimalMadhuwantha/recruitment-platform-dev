import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useApplicantProfile,
  useUpdateProfile,
  useAddExperience,
  useUpdateExperience,
  useDeleteExperience,
  useAddEducation,
  useUpdateEducation,
  useDeleteEducation,
  useAddSkill,
  useUpdateSkill,
  useDeleteSkill,
  useAddCertification,
  useDeleteCertification,
  useAddPortfolio,
  useDeletePortfolio,
  useResumes,
  useAnonymizedPreview,
  useTaxonomySkills,
} from '../../features/applicant-profile/hooks';
import { CompletenessMeter } from '../../features/applicant-profile/components/CompletenessMeter';
import { BasicInfoSection } from '../../features/applicant-profile/components/BasicInfoSection';
import { ExperienceSection } from '../../features/applicant-profile/components/ExperienceSection';
import { EducationSection } from '../../features/applicant-profile/components/EducationSection';
import { SkillsSection } from '../../features/applicant-profile/components/SkillsSection';
import { CertificationsSection } from '../../features/applicant-profile/components/CertificationsSection';
import { PortfolioSection } from '../../features/applicant-profile/components/PortfolioSection';
import { CVManager } from '../../features/applicant-profile/components/CVManager';
import { PrivacySettingsSection } from '../../features/applicant-profile/components/PrivacySettingsSection';
import { BlindRecruitmentPreviewModal } from '../../features/applicant-profile/components/BlindRecruitmentPreviewModal';
import { Button } from '../../components/ui/Button';
import type { ProfileTab } from '../../features/applicant-profile/types';

export const ApplicantProfilePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as ProfileTab) || 'basic';
  const [isBlindModalOpen, setIsBlindModalOpen] = useState(false);

  // Queries & Mutations
  const { data: profile, isLoading: isProfileLoading } = useApplicantProfile();
  const { data: masterSkills = [] } = useTaxonomySkills();
  const { data: resumes = [] } = useResumes();
  const { data: anonymizedPreview, isLoading: isAnonymizedLoading } = useAnonymizedPreview();

  const updateProfileMutation = useUpdateProfile();
  const addExpMutation = useAddExperience();
  const updateExpMutation = useUpdateExperience();
  const deleteExpMutation = useDeleteExperience();
  const addEduMutation = useAddEducation();
  const updateEduMutation = useUpdateEducation();
  const deleteEduMutation = useDeleteEducation();
  const addSkillMutation = useAddSkill();
  const updateSkillMutation = useUpdateSkill();
  const deleteSkillMutation = useDeleteSkill();
  const addCertMutation = useAddCertification();
  const deleteCertMutation = useDeleteCertification();
  const addPortfolioMutation = useAddPortfolio();
  const deletePortfolioMutation = useDeletePortfolio();

  const setTab = (tab: ProfileTab) => {
    setSearchParams({ tab });
  };

  if (isProfileLoading || !profile) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-12 text-center text-sm text-text-secondary">
        Loading applicant profile...
      </div>
    );
  }

  const tabs: Array<{ id: ProfileTab; label: string; count?: number }> = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'experience', label: 'Work Experience', count: profile.workExperiences?.length },
    { id: 'education', label: 'Education', count: profile.educations?.length },
    { id: 'skills', label: 'Skills', count: profile.applicantSkills?.length },
    { id: 'certifications', label: 'Certifications', count: profile.certifications?.length },
    { id: 'portfolio', label: 'Portfolio Links', count: profile.portfolios?.length },
    { id: 'resume', label: 'Resume / CV', count: resumes.length || profile.cvs?.length },
    { id: 'privacy', label: 'Privacy & Visibility' },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-brand-900">
              {profile.firstName} {profile.lastName}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-brand-100 text-brand-700">
              {profile.visibilitySettings?.visibility || 'PUBLIC'}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            {profile.headline || 'Add a professional headline to summarize your expertise'}
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsBlindModalOpen(true)}
          className="border-brand-600 text-brand-600 hover:bg-brand-50"
        >
          Preview Recruiter Blind View
        </Button>
      </div>

      {/* Profile Completeness Meter */}
      <CompletenessMeter
        completeness={profile.completeness}
        onOpenBlindPreview={() => setIsBlindModalOpen(true)}
        onNavigateTab={(tab) => setTab(tab as ProfileTab)}
      />

      {/* Tab Navigation */}
      <div className="border-b border-border-default flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 -mb-[1px] flex items-center gap-1.5 ${
                isActive
                  ? 'border-brand-600 text-brand-600 bg-surface'
                  : 'border-transparent text-text-secondary hover:text-brand-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'basic' && (
          <BasicInfoSection
            profile={profile}
            onUpdate={(data) => updateProfileMutation.mutateAsync(data)}
            isLoading={updateProfileMutation.isPending}
          />
        )}

        {activeTab === 'experience' && (
          <ExperienceSection
            experiences={profile.workExperiences}
            onAdd={(data) => addExpMutation.mutateAsync(data)}
            onUpdate={(id, data) => updateExpMutation.mutateAsync({ id, data })}
            onDelete={(id) => deleteExpMutation.mutateAsync(id)}
          />
        )}

        {activeTab === 'education' && (
          <EducationSection
            educations={profile.educations}
            onAdd={(data) => addEduMutation.mutateAsync(data)}
            onUpdate={(id, data) => updateEduMutation.mutateAsync({ id, data })}
            onDelete={(id) => deleteEduMutation.mutateAsync(id)}
          />
        )}

        {activeTab === 'skills' && (
          <SkillsSection
            skills={profile.applicantSkills}
            masterSkills={masterSkills}
            onAdd={(data) => addSkillMutation.mutateAsync(data)}
            onUpdate={(id, data) => updateSkillMutation.mutateAsync({ id, data })}
            onDelete={(id) => deleteSkillMutation.mutateAsync(id)}
          />
        )}

        {activeTab === 'certifications' && (
          <CertificationsSection
            certifications={profile.certifications}
            onAdd={(data) => addCertMutation.mutateAsync(data)}
            onDelete={(id) => deleteCertMutation.mutateAsync(id)}
          />
        )}

        {activeTab === 'portfolio' && (
          <PortfolioSection
            portfolios={profile.portfolios}
            onAdd={(data) => addPortfolioMutation.mutateAsync(data)}
            onDelete={(id) => deletePortfolioMutation.mutateAsync(id)}
          />
        )}

        {activeTab === 'resume' && (
          <CVManager
            profile={profile}
            resumes={resumes.length > 0 ? resumes : profile.cvs}
          />
        )}

        {activeTab === 'privacy' && (
          <PrivacySettingsSection
            settings={profile.visibilitySettings}
            onUpdate={(data) => updateProfileMutation.mutateAsync(data)}
            isLoading={updateProfileMutation.isPending}
          />
        )}
      </div>

      {/* Blind Recruitment Modal */}
      <BlindRecruitmentPreviewModal
        isOpen={isBlindModalOpen}
        onClose={() => setIsBlindModalOpen(false)}
        anonymizedProfile={anonymizedPreview}
        isLoading={isAnonymizedLoading}
      />
    </div>
  );
};

export default ApplicantProfilePage;
