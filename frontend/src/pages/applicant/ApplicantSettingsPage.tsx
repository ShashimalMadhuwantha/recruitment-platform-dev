import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bell,
  ShieldAlert,
  FileJson,
  AlertTriangle,
  Settings,
  Shield,
} from 'lucide-react';
import { NotificationPreferencesForm } from '../../features/applicant-privacy/components/NotificationPreferencesForm';
import { BlockedCompaniesManager } from '../../features/applicant-privacy/components/BlockedCompaniesManager';
import { GdprDataExportCard } from '../../features/applicant-privacy/components/GdprDataExportCard';
import { AccountDeletionModal } from '../../features/applicant-privacy/components/AccountDeletionModal';

type SettingsTab = 'notifications' | 'privacy' | 'gdpr';

export const ApplicantSettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get('tab') as SettingsTab) || 'notifications';

  const [activeTab, setActiveTab] = useState<SettingsTab>(
    ['notifications', 'privacy', 'gdpr'].includes(currentTab) ? currentTab : 'notifications'
  );
  const [isDeletionModalOpen, setIsDeletionModalOpen] = useState(false);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Header Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 text-slate-900 font-bold text-2xl tracking-tight">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Settings className="w-6 h-6" />
                </div>
                <span>Account, Privacy & Settings</span>
              </div>
              <p className="text-sm text-slate-500 mt-1.5 max-w-2xl">
                Configure your communication channels, manage employer search concealment, and exercise your GDPR data portability and erasure rights.
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mt-8 border-b border-slate-200 -mb-px overflow-x-auto">
            <button
              type="button"
              onClick={() => handleTabChange('notifications')}
              className={`pb-3.5 px-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'notifications'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notification Preferences</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('privacy')}
              className={`pb-3.5 px-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'privacy'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Blocked Employers</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('gdpr')}
              className={`pb-3.5 px-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'gdpr'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <FileJson className="w-4 h-4" />
              <span>Data Portability & GDPR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {activeTab === 'notifications' && (
          <div className="animate-fadeIn">
            <NotificationPreferencesForm />
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="animate-fadeIn">
            <BlockedCompaniesManager />
          </div>
        )}

        {activeTab === 'gdpr' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Portability Download Card */}
            <GdprDataExportCard />

            {/* Danger Zone: Account Erasure */}
            <div className="bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-rose-100 bg-rose-50/40 flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-900 font-semibold text-base">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <span>Danger Zone: Right to Erasure (Account Deletion)</span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                  GDPR Art. 17
                </span>
              </div>

              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="max-w-xl">
                    <h4 className="text-sm font-semibold text-slate-900">
                      Permanently Delete Account and Personal Data
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Once initiated, your profile, resumes, skills, applications, and saved preferences will be queued for permanent deletion in compliance with statutory GDPR timelines (within 30 days). This action is irreversible.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDeletionModalOpen(true)}
                    className="self-start md:self-center px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Request Account Erasure</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Account Deletion Modal */}
      <AccountDeletionModal
        isOpen={isDeletionModalOpen}
        onClose={() => setIsDeletionModalOpen(false)}
      />
    </div>
  );
};
