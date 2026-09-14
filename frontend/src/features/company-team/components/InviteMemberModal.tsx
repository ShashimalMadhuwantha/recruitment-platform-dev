import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Mail,
  ShieldCheck,
  Briefcase,
  User,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useInviteMember } from '../hooks';
import type {
  RecruiterSubRole,
  RecruiterPermissions,
  PlanUsageDto,
  InviteTeamMemberDto,
} from '../types';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  planUsage?: PlanUsageDto;
  onOpenUpgradeModal?: () => void;
}

const DEFAULT_PERMISSIONS: Record<RecruiterSubRole, RecruiterPermissions> = {
  COMPANY_ADMIN: {
    canCreateJobs: true,
    canEditJobs: true,
    canDeleteJobs: true,
    canViewCandidateSalary: true,
    canAdvancePipeline: true,
    canScheduleInterviews: true,
    canSubmitScorecards: true,
    canExtendOffers: true,
    canManageTeam: true,
    canViewAnalytics: true,
    canManageCompanyProfile: true,
  },
  HIRING_MANAGER: {
    canCreateJobs: true,
    canEditJobs: true,
    canDeleteJobs: false,
    canViewCandidateSalary: true,
    canAdvancePipeline: true,
    canScheduleInterviews: true,
    canSubmitScorecards: true,
    canExtendOffers: true,
    canManageTeam: false,
    canViewAnalytics: true,
    canManageCompanyProfile: false,
  },
  INTERVIEWER: {
    canCreateJobs: false,
    canEditJobs: false,
    canDeleteJobs: false,
    canViewCandidateSalary: false,
    canAdvancePipeline: false,
    canScheduleInterviews: true,
    canSubmitScorecards: true,
    canExtendOffers: false,
    canManageTeam: false,
    canViewAnalytics: false,
    canManageCompanyProfile: false,
  },
};

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  planUsage,
  onOpenUpgradeModal,
}) => {
  const [email, setEmail] = useState('');
  const [subRole, setSubRole] = useState<RecruiterSubRole>('HIRING_MANAGER');
  const [department, setDepartment] = useState('');
  const [title, setTitle] = useState('');
  const [permissions, setPermissions] = useState<RecruiterPermissions>(
    DEFAULT_PERMISSIONS.HIRING_MANAGER
  );
  const [showAdvancedPermissions, setShowAdvancedPermissions] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inviteMutation = useInviteMember();

  // Reset default permissions when role changes
  const handleRoleChange = (newRole: RecruiterSubRole) => {
    setSubRole(newRole);
    setPermissions(DEFAULT_PERMISSIONS[newRole]);
  };

  const isUnlimitedSeats = planUsage ? planUsage.usage.seats.maxSeats >= 9999 : false;
  const isSeatExhausted = planUsage && !isUnlimitedSeats && planUsage.usage.seats.isAtCapacity;

  if (!isOpen) return null;

  const handleTogglePermission = (key: keyof RecruiterPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please provide a valid corporate email address.');
      return;
    }

    const payload: InviteTeamMemberDto = {
      email: email.trim().toLowerCase(),
      subRole,
      department: department.trim() || undefined,
      title: title.trim() || undefined,
      permissions: subRole === 'COMPANY_ADMIN' ? undefined : permissions,
    };

    try {
      await inviteMutation.mutateAsync(payload);
      handleClose();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Failed to send team invitation'
      );
    }
  };

  const handleClose = () => {
    setEmail('');
    setDepartment('');
    setTitle('');
    setSubRole('HIRING_MANAGER');
    setPermissions(DEFAULT_PERMISSIONS.HIRING_MANAGER);
    setShowAdvancedPermissions(false);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-surface rounded-2xl shadow-2xl border border-border-default overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border-default bg-surface-muted flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-brand-50 text-brand-600 border border-brand-200">
                <UserPlus className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-text-primary tracking-tight">
                Invite Team Member
              </h2>
            </div>
            <p className="text-xs text-text-secondary">
              Send a 7-day secure onboarding link to add a colleague to your hiring organization.
            </p>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seat Health Banner */}
        {planUsage && (
          <div
            className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between border-b ${
              isSeatExhausted
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-brand-50/50 border-brand-100 text-brand-900'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {isSeatExhausted ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              )}
              <span>
                {isUnlimitedSeats ? (
                  <strong>Unlimited Team Seats (Enterprise)</strong>
                ) : (
                  <>
                    <strong>
                      {planUsage.usage.seats.remainingSeats} of {planUsage.usage.seats.maxSeats} seats available
                    </strong>{' '}
                    ({planUsage.usage.seats.occupiedSeats} in use)
                  </>
                )}
              </span>
            </div>

            {isSeatExhausted && onOpenUpgradeModal && (
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onOpenUpgradeModal();
                }}
                className="text-xs font-bold text-rose-700 hover:text-rose-900 underline"
              >
                Upgrade Plan
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Email Address */}
          <div className="space-y-1.5">
            <label htmlFor="invite-email" className="block text-xs font-semibold text-text-primary">
              Colleague Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="invite-email"
                type="email"
                required
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 pl-9 pr-3.5 bg-surface rounded-xl border border-border-default text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 placeholder:text-text-muted"
              />
            </div>
          </div>

          {/* Sub-Role Selector Cards */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-text-primary">
              Recruiter Sub-Role & Access Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Company Admin */}
              <div
                onClick={() => handleRoleChange('COMPANY_ADMIN')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  subRole === 'COMPANY_ADMIN'
                    ? 'border-purple-600 bg-purple-50/30 ring-1 ring-purple-600'
                    : 'border-border-default bg-surface hover:bg-surface-muted/60'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>Admin</span>
                </div>
                <p className="text-[11px] text-text-secondary leading-snug">
                  Full control: team, billing, all jobs & ATS settings.
                </p>
              </div>

              {/* Hiring Manager */}
              <div
                onClick={() => handleRoleChange('HIRING_MANAGER')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  subRole === 'HIRING_MANAGER'
                    ? 'border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600'
                    : 'border-border-default bg-surface hover:bg-surface-muted/60'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary mb-1">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Manager</span>
                </div>
                <p className="text-[11px] text-text-secondary leading-snug">
                  Create requisitions, progress stages, & hire.
                </p>
              </div>

              {/* Interviewer */}
              <div
                onClick={() => handleRoleChange('INTERVIEWER')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  subRole === 'INTERVIEWER'
                    ? 'border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-600'
                    : 'border-border-default bg-surface hover:bg-surface-muted/60'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary mb-1">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Interviewer</span>
                </div>
                <p className="text-[11px] text-text-secondary leading-snug">
                  Fill scorecards, view candidates, & add notes.
                </p>
              </div>
            </div>
          </div>

          {/* Department & Job Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="invite-dept" className="block text-xs font-semibold text-text-primary">
                Department
              </label>
              <input
                id="invite-dept"
                type="text"
                placeholder="E.g. Engineering, Sales"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-9 px-3 bg-surface rounded-xl border border-border-default text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 placeholder:text-text-muted"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="invite-title" className="block text-xs font-semibold text-text-primary">
                Job Title
              </label>
              <input
                id="invite-title"
                type="text"
                placeholder="E.g. Senior Talent Partner"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-9 px-3 bg-surface rounded-xl border border-border-default text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 placeholder:text-text-muted"
              />
            </div>
          </div>

          {/* Advanced Fine-grained Permissions Accordion (only for non-admin) */}
          {subRole !== 'COMPANY_ADMIN' && (
            <div className="border border-border-default rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvancedPermissions(!showAdvancedPermissions)}
                className="w-full p-3 bg-surface-muted/40 hover:bg-surface-muted flex items-center justify-between text-xs font-semibold text-text-secondary transition-colors"
              >
                <span>Customize Fine-Grained Permissions</span>
                {showAdvancedPermissions ? (
                  <ChevronUp className="w-4 h-4 text-text-muted" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-text-muted" />
                )}
              </button>

              {showAdvancedPermissions && (
                <div className="p-3.5 bg-surface space-y-2.5 divide-y divide-border-default/50 text-xs">
                  <label className="flex items-center justify-between pt-1 cursor-pointer">
                    <span className="text-text-primary">Create Job Requisitions</span>
                    <input
                      type="checkbox"
                      checked={permissions.canCreateJobs}
                      onChange={() => handleTogglePermission('canCreateJobs')}
                      className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between pt-2 cursor-pointer">
                    <span className="text-text-primary">Edit Job Openings</span>
                    <input
                      type="checkbox"
                      checked={permissions.canEditJobs}
                      onChange={() => handleTogglePermission('canEditJobs')}
                      className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between pt-2 cursor-pointer">
                    <span className="text-text-primary">Advance Pipeline & Stages</span>
                    <input
                      type="checkbox"
                      checked={permissions.canAdvancePipeline}
                      onChange={() => handleTogglePermission('canAdvancePipeline')}
                      className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between pt-2 cursor-pointer">
                    <span className="text-text-primary">Schedule Interviews</span>
                    <input
                      type="checkbox"
                      checked={permissions.canScheduleInterviews}
                      onChange={() => handleTogglePermission('canScheduleInterviews')}
                      className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between pt-2 cursor-pointer">
                    <span className="text-text-primary">Submit Scorecards</span>
                    <input
                      type="checkbox"
                      checked={permissions.canSubmitScorecards}
                      onChange={() => handleTogglePermission('canSubmitScorecards')}
                      className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-border-default">
            <Button type="button" variant="outline" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={Boolean(isSeatExhausted)}
              isLoading={inviteMutation.isPending}
              className="gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Send Invitation</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteMemberModal;
