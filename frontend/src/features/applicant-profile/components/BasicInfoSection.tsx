import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import type { ApplicantProfileDto, UpdateApplicantProfileDto } from '../types';

interface BasicInfoSectionProps {
  profile: ApplicantProfileDto;
  onUpdate: (data: UpdateApplicantProfileDto) => Promise<any>;
  isLoading: boolean;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ profile, onUpdate, isLoading }) => {
  const [formData, setFormData] = useState<UpdateApplicantProfileDto>({
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    headline: profile.headline || '',
    summary: profile.summary || '',
    location: profile.location || '',
    phone: profile.phone || '',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdate(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      // Error handled by query hook
    }
  };

  return (
    <Card className="p-6 bg-surface border border-border-default space-y-6">
      <div className="flex items-center justify-between border-b border-border-default pb-4">
        <div>
          <h2 className="text-lg font-semibold text-brand-900">Personal & Contact Info</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            This information introduces you to employers and recruiters.
          </p>
        </div>
        {savedSuccess && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            ✓ Changes saved successfully
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="w-full space-y-1.5 text-left">
            <label htmlFor="firstName" className="block text-xs font-medium text-text-secondary">
              First Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface text-text-primary"
              placeholder="e.g. Jane"
            />
          </div>

          <div className="w-full space-y-1.5 text-left">
            <label htmlFor="lastName" className="block text-xs font-medium text-text-secondary">
              Last Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface text-text-primary"
              placeholder="e.g. Doe"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="w-full space-y-1.5 text-left">
            <label htmlFor="phone" className="block text-xs font-medium text-text-secondary">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface text-text-primary"
              placeholder="e.g. +1 (555) 019-2834"
            />
          </div>

          <div className="w-full space-y-1.5 text-left">
            <label htmlFor="location" className="block text-xs font-medium text-text-secondary">
              Current Location
            </label>
            <input
              id="location"
              type="text"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface text-text-primary"
              placeholder="e.g. San Francisco, CA or London, UK"
            />
          </div>
        </div>

        <div className="w-full space-y-1.5 text-left">
          <label htmlFor="headline" className="block text-xs font-medium text-text-secondary">
            Professional Headline
          </label>
          <input
            id="headline"
            type="text"
            value={formData.headline || ''}
            onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
            className="w-full px-3.5 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface text-text-primary"
            placeholder="e.g. Senior Full Stack Engineer | React, TypeScript & Node.js"
            maxLength={200}
          />
          <p className="text-[11px] text-text-muted">A concise summary of your current level and primary specialty</p>
        </div>

        <div className="w-full space-y-1.5 text-left">
          <label htmlFor="summary" className="block text-xs font-medium text-text-secondary">
            Professional Summary
          </label>
          <textarea
            id="summary"
            rows={4}
            value={formData.summary || ''}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            className="w-full px-3.5 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface resize-y text-text-primary"
            placeholder="Describe your technical background, domain expertise, and what roles you are interested in..."
          />
          <p className="text-[11px] text-text-muted">Highlight your key achievements, years of experience, and career trajectory</p>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Profile Changes'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
