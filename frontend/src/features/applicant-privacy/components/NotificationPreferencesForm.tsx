import React, { useState } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Calendar,
  MessageSquare,
  Building2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '../hooks';
import type { UpdateNotificationPreferenceDto } from '../types';

interface PreferenceItemConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  emailKey: keyof UpdateNotificationPreferenceDto;
  inAppKey: keyof UpdateNotificationPreferenceDto;
}

const PREFERENCE_CATEGORIES: PreferenceItemConfig[] = [
  {
    id: 'application-status',
    title: 'Application Status Updates',
    description:
      'Get notified immediately when your application advances, enters screening, gets shortlisted, or receives a hiring decision.',
    icon: Briefcase,
    emailKey: 'applicationStatusEmail',
    inAppKey: 'applicationStatusInApp',
  },
  {
    id: 'interview-invites',
    title: 'Interview Invitations & Scheduling',
    description:
      'Receive instant alerts when a hiring team schedules an interview, suggests time slots, or requests a reschedule.',
    icon: Calendar,
    emailKey: 'interviewInvitesEmail',
    inAppKey: 'interviewInvitesInApp',
  },
  {
    id: 'recruiter-messages',
    title: 'Recruiter Direct Messages',
    description:
      'Stay updated when hiring managers and talent partners send inquiries or follow-ups regarding your candidacies.',
    icon: MessageSquare,
    emailKey: 'messagesEmail',
    inAppKey: 'messagesInApp',
  },
  {
    id: 'followed-company-jobs',
    title: 'Followed Company Vacancies',
    description:
      'Be the first to know when employers on your watchlist publish new job vacancies matching your background.',
    icon: Building2,
    emailKey: 'followedCompanyJobEmail',
    inAppKey: 'followedCompanyJobInApp',
  },
  {
    id: 'job-alerts',
    title: 'Smart Job Recommendations & Alerts',
    description:
      'Receive periodic algorithmic digests of open positions that strongly match your skills, experience, and preferences.',
    icon: Sparkles,
    emailKey: 'jobAlertsEmail',
    inAppKey: 'jobAlertsInApp',
  },
];

export const NotificationPreferencesForm: React.FC = () => {
  const { data: preferences, isLoading, isError } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleToggle = async (key: keyof UpdateNotificationPreferenceDto, currentValue: boolean) => {
    try {
      setSuccessMessage(null);
      await updateMutation.mutateAsync({
        [key]: !currentValue,
      });
      setSuccessMessage('Notification preferences updated.');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch {
      // Error handled by query/mutation state
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading your notification preferences...</p>
      </div>
    );
  }

  if (isError || !preferences) {
    return (
      <div className="bg-white rounded-xl border border-rose-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 text-rose-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            Failed to load notification preferences. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
            <Bell className="w-5 h-5 text-blue-600" />
            <span>Notification & Communication Preferences</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Choose exactly how and where you want to receive notifications across email and in-app feeds.
          </p>
        </div>

        {/* Global channels legend & status */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" /> Email
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-slate-400" /> In-App
          </span>
        </div>
      </div>

      {/* Success alert */}
      {successMessage && (
        <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs font-medium text-emerald-800 transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Mutation Error */}
      {updateMutation.isError && (
        <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs font-medium text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>Failed to save preference change. Please try again.</span>
        </div>
      )}

      {/* Preferences Table / List */}
      <div className="divide-y divide-slate-100">
        {PREFERENCE_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const emailVal = Boolean(preferences[cat.emailKey]);
          const inAppVal = Boolean(preferences[cat.inAppKey]);

          return (
            <div
              key={cat.id}
              className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/40 transition-colors"
            >
              {/* Category Info */}
              <div className="flex items-start gap-3.5 max-w-xl">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0 mt-0.5">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{cat.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{cat.description}</p>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-8 pl-12 md:pl-0 flex-shrink-0">
                {/* Email Channel Toggle */}
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Email
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={emailVal}
                    disabled={updateMutation.isPending}
                    onClick={() => handleToggle(cat.emailKey, emailVal)}
                    className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      emailVal ? 'bg-blue-600' : 'bg-slate-300'
                    } ${updateMutation.isPending ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        emailVal ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* In-App Channel Toggle */}
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                    In-App
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={inAppVal}
                    disabled={updateMutation.isPending}
                    onClick={() => handleToggle(cat.inAppKey, inAppVal)}
                    className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      inAppVal ? 'bg-blue-600' : 'bg-slate-300'
                    } ${updateMutation.isPending ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        inAppVal ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Changes are saved automatically when toggled.</span>
        <span>Last modified: {new Date(preferences.updatedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
};
