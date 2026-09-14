import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Briefcase,
  User,
  Check,
  Lock,
  Save,
  Sliders,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useUpdateMemberRole } from '../hooks';
import type { TeamMemberDto, RecruiterSubRole, RecruiterPermissions } from '../types';

interface RolePermissionsDrawerProps {
  member: TeamMemberDto | null;
  isOpen: boolean;
  onClose: () => void;
  totalCompanyAdmins: number;
}

const DEFAULT_SUBROLE_PERMISSIONS: Record<RecruiterSubRole, RecruiterPermissions> = {
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

export const RolePermissionsDrawer: React.FC<RolePermissionsDrawerProps> = ({
  member,
  isOpen,
  onClose,
  totalCompanyAdmins,
}) => {
  const [subRole, setSubRole] = useState<RecruiterSubRole>('HIRING_MANAGER');
  const [department, setDepartment] = useState('');
  const [title, setTitle] = useState('');
  const [permissions, setPermissions] = useState<RecruiterPermissions>(
    DEFAULT_SUBROLE_PERMISSIONS.HIRING_MANAGER
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const updateMutation = useUpdateMemberRole();

  useEffect(() => {
    if (member) {
      setSubRole(member.subRole);
      setDepartment(member.department || '');
      setTitle(member.title || '');
      const existing = member.permissions
        ? { ...DEFAULT_SUBROLE_PERMISSIONS[member.subRole], ...member.permissions }
        : DEFAULT_SUBROLE_PERMISSIONS[member.subRole];
      setPermissions(existing);
      setErrorMsg(null);
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const isSoleAdmin = member.subRole === 'COMPANY_ADMIN' && totalCompanyAdmins <= 1;

  const handleRoleChange = (newRole: RecruiterSubRole) => {
    if (isSoleAdmin && newRole !== 'COMPANY_ADMIN') {
      setErrorMsg('Cannot demote the sole Company Admin. Promote another member to Admin first.');
      return;
    }
    setErrorMsg(null);
    setSubRole(newRole);
    setPermissions(DEFAULT_SUBROLE_PERMISSIONS[newRole]);
  };

  const handleTogglePermission = (key: keyof RecruiterPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      await updateMutation.mutateAsync({
        id: member.id,
        data: {
          subRole,
          department: department.trim() || undefined,
          title: title.trim() || undefined,
          permissions: subRole === 'COMPANY_ADMIN' ? undefined : permissions,
        },
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Failed to update member permissions'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-2xs flex justify-end">
      <div className="w-full max-w-lg bg-surface h-full shadow-2xl border-l border-border-default flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-border-default flex items-start justify-between bg-surface-muted">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand-600" />
              <h2 className="text-base font-bold text-text-primary">
                Member Roles & Permissions
              </h2>
            </div>
            <p className="text-xs text-text-secondary">
              Configure access tiers and functional privileges for <strong>{member.fullName}</strong>.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors shrink-0"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          {isSoleAdmin && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Sole Company Administrator</span>
              </div>
              <p className="text-[11px] text-amber-700">
                This member is the only designated Company Admin. To change this role, first assign another team member as Company Admin.
              </p>
            </div>
          )}

          {/* Sub Role Tier Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-text-primary">
              Select Primary Sub-Role
            </label>
            <div className="space-y-2">
              {/* Company Admin */}
              <div
                onClick={() => handleRoleChange('COMPANY_ADMIN')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  subRole === 'COMPANY_ADMIN'
                    ? 'border-purple-600 bg-purple-50/20 ring-1 ring-purple-600'
                    : 'border-border-default bg-surface hover:bg-surface-muted/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-bold text-text-primary">Company Admin</h4>
                  </div>
                  {subRole === 'COMPANY_ADMIN' && (
                    <Check className="w-4 h-4 text-purple-600" />
                  )}
                </div>
                <p className="text-[11px] text-text-secondary">
                  Complete authority over tenant branding, member invitations, subscription upgrades, all job requisitions, and data exports.
                </p>
              </div>

              {/* Hiring Manager */}
              <div
                onClick={() => handleRoleChange('HIRING_MANAGER')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  subRole === 'HIRING_MANAGER'
                    ? 'border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600'
                    : 'border-border-default bg-surface hover:bg-surface-muted/50'
                } ${isSoleAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-text-primary">Hiring Manager</h4>
                  </div>
                  {subRole === 'HIRING_MANAGER' && (
                    <Check className="w-4 h-4 text-indigo-600" />
                  )}
                </div>
                <p className="text-[11px] text-text-secondary">
                  Create and manage departmental requisitions, review candidates, progress ATS pipeline stages, and initiate hiring offers.
                </p>
              </div>

              {/* Interviewer */}
              <div
                onClick={() => handleRoleChange('INTERVIEWER')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  subRole === 'INTERVIEWER'
                    ? 'border-emerald-600 bg-emerald-50/20 ring-1 ring-emerald-600'
                    : 'border-border-default bg-surface hover:bg-surface-muted/50'
                } ${isSoleAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-text-primary">Interviewer</h4>
                  </div>
                  {subRole === 'INTERVIEWER' && (
                    <Check className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <p className="text-[11px] text-text-secondary">
                  Conduct interviews, fill structured evaluation scorecards, view candidate resumes, and contribute hiring feedback.
                </p>
              </div>
            </div>
          </div>

          {/* Department & Title Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="edit-dept" className="block text-xs font-semibold text-text-primary">
                Department
              </label>
              <input
                id="edit-dept"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="E.g. Product"
                className="w-full h-9 px-3 bg-surface rounded-xl border border-border-default text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="edit-title" className="block text-xs font-semibold text-text-primary">
                Job Title
              </label>
              <input
                id="edit-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g. Lead Recruiter"
                className="w-full h-9 px-3 bg-surface rounded-xl border border-border-default text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              />
            </div>
          </div>

          {/* Granular Permission Toggles (for non-Company Admin) */}
          {subRole !== 'COMPANY_ADMIN' ? (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider text-[11px]">
                Functional Permissions
              </h4>
              <div className="p-4 rounded-xl border border-border-default bg-surface-muted/30 space-y-3 text-xs">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-semibold text-text-primary block">Create Job Requisitions</span>
                    <span className="text-[11px] text-text-muted">Allow posting new job openings</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions.canCreateJobs}
                    onChange={() => handleTogglePermission('canCreateJobs')}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-border-default/60">
                  <div>
                    <span className="font-semibold text-text-primary block">Edit Job Openings</span>
                    <span className="text-[11px] text-text-muted">Update job specifications and requirements</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions.canEditJobs}
                    onChange={() => handleTogglePermission('canEditJobs')}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-border-default/60">
                  <div>
                    <span className="font-semibold text-text-primary block">Advance Pipeline & Stages</span>
                    <span className="text-[11px] text-text-muted">Move candidates through recruitment stages</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions.canAdvancePipeline}
                    onChange={() => handleTogglePermission('canAdvancePipeline')}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-border-default/60">
                  <div>
                    <span className="font-semibold text-text-primary block">Schedule Interviews</span>
                    <span className="text-[11px] text-text-muted">Schedule candidate calls and rounds</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions.canScheduleInterviews}
                    onChange={() => handleTogglePermission('canScheduleInterviews')}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-border-default/60">
                  <div>
                    <span className="font-semibold text-text-primary block">Submit Interview Scorecards</span>
                    <span className="text-[11px] text-text-muted">Record candidate ratings and feedback</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions.canSubmitScorecards}
                    onChange={() => handleTogglePermission('canSubmitScorecards')}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-border-default/60">
                  <div>
                    <span className="font-semibold text-text-primary block">Extend Job Offers</span>
                    <span className="text-[11px] text-text-muted">Generate and send offer packages</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions.canExtendOffers}
                    onChange={() => handleTogglePermission('canExtendOffers')}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-border-default/60">
                  <div>
                    <span className="font-semibold text-text-primary block">Team Member Management</span>
                    <span className="text-[11px] text-text-muted">Allow inviting and managing other team members</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions.canManageTeam}
                    onChange={() => handleTogglePermission('canManageTeam')}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200 text-xs text-purple-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>All Privileges Granted</span>
              </span>
              <p className="text-[11px] text-purple-800">
                Company Admins possess unconditional access to all platform features and do not require individual toggles.
              </p>
            </div>
          )}

          {/* Drawer Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border-default">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={updateMutation.isPending}
              className="gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RolePermissionsDrawer;
