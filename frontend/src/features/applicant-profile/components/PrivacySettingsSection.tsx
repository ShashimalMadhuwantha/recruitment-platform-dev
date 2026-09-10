import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import type { ProfileVisibility, ProfileVisibilitySettings, UpdateApplicantProfileDto } from '../types';

interface PrivacySettingsSectionProps {
  settings?: ProfileVisibilitySettings | null;
  onUpdate: (data: UpdateApplicantProfileDto) => Promise<any>;
  isLoading: boolean;
}

export const PrivacySettingsSection: React.FC<PrivacySettingsSectionProps> = ({
  settings,
  onUpdate,
  isLoading,
}) => {
  const [visibility, setVisibility] = useState<ProfileVisibility>(
    settings?.visibility || 'PUBLIC'
  );
  const [allowContact, setAllowContact] = useState(
    settings?.allowRecruiterContact ?? true
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate({
      visibilitySettings: {
        visibility,
        allowRecruiterContact: allowContact,
      },
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const options: Array<{
    value: ProfileVisibility;
    title: string;
    description: string;
    icon: string;
  }> = [
    {
      value: 'PUBLIC',
      title: 'Public to Verified Employers',
      description: 'Your full profile and qualifications are searchable by verified recruiters and hiring teams.',
      icon: '🌐',
    },
    {
      value: 'ANONYMOUS',
      title: 'Anonymous / Blind Mode',
      description: 'Your contact information and company names are redacted until an interview request is confirmed.',
      icon: '🛡️',
    },
    {
      value: 'PRIVATE',
      title: 'Private (Applied Jobs Only)',
      description: 'Only companies and vacancies you explicitly submit an application to can see your profile.',
      icon: '🔒',
    },
  ];

  return (
    <Card className="p-6 bg-surface border border-border-default space-y-6">
      <div className="border-b border-border-default pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-brand-900">Profile Privacy & Visibility</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Control how recruiters discover your profile and prevent unauthorized solicitation.
          </p>
        </div>
        {savedSuccess && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            ✓ Privacy updated
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          {options.map((opt) => (
            <label
              key={opt.value}
              className={`p-4 rounded-xl border flex items-start gap-4 cursor-pointer transition-all ${
                visibility === opt.value
                  ? 'border-brand-600 bg-brand-50/40 ring-1 ring-brand-600'
                  : 'border-border-default bg-surface hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="profileVisibility"
                value={opt.value}
                checked={visibility === opt.value}
                onChange={() => setVisibility(opt.value)}
                className="mt-1 text-brand-600 focus:ring-brand-600"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{opt.icon}</span>
                  <span className="text-sm font-bold text-brand-900">{opt.title}</span>
                </div>
                <p className="text-xs text-text-secondary">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="p-4 bg-surface-muted rounded-xl border border-border-default flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-text-primary">Recruiter Direct Inquiries</p>
            <p className="text-xs text-text-secondary">
              Allow verified hiring managers to message you with matching vacancies.
            </p>
          </div>
          <input
            type="checkbox"
            checked={allowContact}
            onChange={(e) => setAllowContact(e.target.checked)}
            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-600 border-border-default"
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Privacy Settings'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
