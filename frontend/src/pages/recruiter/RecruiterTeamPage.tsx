import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  RotateCw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../app/providers';
import {
  usePlanUsage,
  useTeamDirectory,
  useResendInvite,
  useRevokeInvite,
} from '../../features/company-team/hooks';
import { PlanUsageCard } from '../../features/company-team/components/PlanUsageCard';
import { PlanUpgradeModal } from '../../features/company-team/components/PlanUpgradeModal';
import { TeamMembersTable } from '../../features/company-team/components/TeamMembersTable';
import { PendingInvitationsTable } from '../../features/company-team/components/PendingInvitationsTable';
import { InviteMemberModal } from '../../features/company-team/components/InviteMemberModal';
import { RolePermissionsDrawer } from '../../features/company-team/components/RolePermissionsDrawer';
import { RemoveMemberModal } from '../../features/company-team/components/RemoveMemberModal';
import type { TeamMemberDto } from '../../features/company-team/types';

export const RecruiterTeamPage: React.FC = () => {
  const { user } = useAuth();

  // Data Queries
  const { data: planUsage, isLoading: isPlanLoading } = usePlanUsage();
  const {
    data: directoryData,
    isLoading: isDirectoryLoading,
    refetch: refetchDirectory,
  } = useTeamDirectory();

  // Mutations
  const resendInviteMutation = useResendInvite();
  const revokeInviteMutation = useRevokeInvite();

  // Modal / Drawer States
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMemberDto | null>(null);
  const [removingMember, setRemovingMember] = useState<TeamMemberDto | null>(null);

  // Active Tab: 'members' | 'invitations'
  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');

  const members = directoryData?.members || [];
  const invitations = directoryData?.pendingInvitations || [];
  const totalCompanyAdmins = members.filter((m) => m.subRole === 'COMPANY_ADMIN').length;

  const isUnlimitedSeats = planUsage ? planUsage.usage.seats.maxSeats >= 9999 : false;
  const isSeatExhausted = planUsage && !isUnlimitedSeats && planUsage.usage.seats.isAtCapacity;

  const handleResend = async (id: string) => {
    await resendInviteMutation.mutateAsync(id);
  };

  const handleRevoke = async (id: string) => {
    await revokeInviteMutation.mutateAsync(id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Team Members & Seat Management
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Govern organizational roles, invite talent colleagues, and maintain subscription seat compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchDirectory()}
            className="text-xs gap-1.5"
            title="Refresh Directory"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsInviteModalOpen(true)}
            disabled={Boolean(isSeatExhausted)}
            className="text-xs font-semibold gap-1.5 shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Team Member</span>
          </Button>
        </div>
      </div>

      {/* Subscription Plan & Quota Card */}
      <PlanUsageCard
        usage={planUsage}
        isLoading={isPlanLoading}
        onUpgradeClick={() => setIsUpgradeModalOpen(true)}
      />

      {/* Tabs Navigation */}
      <div className="border-b border-border-default flex items-center justify-between">
        <div className="flex items-center gap-8 -mb-px">
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Active Team Members</span>
            <span
              className={`text-xs px-2 py-0.2 rounded-full ${
                activeTab === 'members'
                  ? 'bg-brand-50 text-brand-700 font-bold'
                  : 'bg-surface-muted text-text-muted'
              }`}
            >
              {members.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invitations')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'invitations'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Pending Invitations</span>
            {invitations.length > 0 && (
              <span
                className={`text-xs px-2 py-0.2 rounded-full ${
                  activeTab === 'invitations'
                    ? 'bg-amber-50 text-amber-800 font-bold'
                    : 'bg-surface-muted text-text-muted'
                }`}
              >
                {invitations.length}
              </span>
            )}
          </button>
        </div>

        {/* Sub-Role Reference Legend */}
        <div className="hidden lg:flex items-center gap-4 text-[11px] text-text-muted pb-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Company Admin</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>Hiring Manager</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Interviewer</span>
          </span>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'members' ? (
        <TeamMembersTable
          members={members}
          isLoading={isDirectoryLoading}
          currentUserId={user?.id}
          onEditPermissions={(member) => setEditingMember(member)}
          onRemoveMember={(member) => setRemovingMember(member)}
        />
      ) : (
        <PendingInvitationsTable
          invitations={invitations}
          isLoading={isDirectoryLoading}
          onResend={handleResend}
          onRevoke={handleRevoke}
        />
      )}

      {/* Modals & Drawers */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        planUsage={planUsage}
        onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
      />

      <PlanUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        currentUsage={planUsage}
      />

      <RolePermissionsDrawer
        member={editingMember}
        isOpen={Boolean(editingMember)}
        onClose={() => setEditingMember(null)}
        totalCompanyAdmins={totalCompanyAdmins}
      />

      <RemoveMemberModal
        member={removingMember}
        isOpen={Boolean(removingMember)}
        onClose={() => setRemovingMember(null)}
        availableSuccessors={members}
      />
    </div>
  );
};

export default RecruiterTeamPage;
