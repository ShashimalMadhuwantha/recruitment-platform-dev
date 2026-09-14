import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  Sliders,
  UserMinus,
  Briefcase,
  Search,
  Lock,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { TeamMemberDto, RecruiterSubRole } from '../types';

interface TeamMembersTableProps {
  members: TeamMemberDto[];
  isLoading?: boolean;
  currentUserId?: string;
  onEditPermissions: (member: TeamMemberDto) => void;
  onRemoveMember: (member: TeamMemberDto) => void;
}

export const TeamMembersTable: React.FC<TeamMembersTableProps> = ({
  members,
  isLoading = false,
  currentUserId,
  onEditPermissions,
  onRemoveMember,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const getSubRoleBadge = (subRole?: RecruiterSubRole) => {
    switch (subRole) {
      case 'COMPANY_ADMIN':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            <ShieldCheck className="w-3 h-3" />
            <span>Company Admin</span>
          </span>
        );
      case 'HIRING_MANAGER':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Briefcase className="w-3 h-3" />
            <span>Hiring Manager</span>
          </span>
        );
      case 'INTERVIEWER':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <User className="w-3 h-3" />
            <span>Interviewer</span>
          </span>
        );
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const adminCount = members.filter((m) => m.subRole === 'COMPANY_ADMIN').length;

  const filteredMembers = members.filter((m) => {
    const q = searchTerm.toLowerCase();
    return (
      m.fullName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.department && m.department.toLowerCase().includes(q)) ||
      (m.title && m.title.toLowerCase().includes(q))
    );
  });

  if (isLoading) {
    return (
      <div className="bg-surface rounded-2xl border border-border-default p-8 text-center animate-pulse">
        <div className="h-6 w-40 bg-surface-hover rounded mx-auto mb-4" />
        <div className="space-y-3">
          <div className="h-12 bg-surface-hover rounded-xl" />
          <div className="h-12 bg-surface-hover rounded-xl" />
          <div className="h-12 bg-surface-hover rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-border-default shadow-xs overflow-hidden">
      {/* Search and Table Top Bar */}
      <div className="p-4 sm:p-5 border-b border-border-default bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h3 className="text-base font-bold text-text-primary tracking-tight">
            Active Team Directory
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-muted border border-border-default text-text-secondary">
            {members.length} {members.length === 1 ? 'Member' : 'Members'}
          </span>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-surface-muted/50 rounded-xl border border-border-default text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 placeholder:text-text-muted transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-muted border-b border-border-default text-text-secondary uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="py-3 px-5">Team Member</th>
              <th className="py-3 px-4">Sub-Role</th>
              <th className="py-3 px-4">Department & Title</th>
              <th className="py-3 px-4">Permissions</th>
              <th className="py-3 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-text-muted">
                  No team members match your filter criteria.
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => {
                const isSelf = member.userId === currentUserId || member.id === currentUserId;
                const isSoleAdmin = member.subRole === 'COMPANY_ADMIN' && adminCount <= 1;

                return (
                  <tr key={member.id} className="hover:bg-surface-hover/50 transition-colors">
                    {/* Member Profile */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
                          {getInitials(member.fullName)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text-primary truncate">
                              {member.fullName}
                            </span>
                            {isSelf && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-brand-50 text-brand-700 border border-brand-200">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-text-muted truncate block">
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Sub Role */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getSubRoleBadge(member.subRole)}
                    </td>

                    {/* Department & Title */}
                    <td className="py-3.5 px-4 text-text-secondary whitespace-nowrap">
                      <span className="font-medium text-text-primary block">
                        {member.title || 'Talent Specialist'}
                      </span>
                      <span className="text-[11px] text-text-muted block">
                        {member.department || 'Recruitment'}
                      </span>
                    </td>

                    {/* Permissions summary */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {member.subRole === 'COMPANY_ADMIN' ? (
                        <span className="text-[11px] font-medium text-purple-700 bg-purple-50/80 px-2 py-0.5 rounded border border-purple-200">
                          Full Access
                        </span>
                      ) : member.permissions ? (
                        <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-200">
                          Customized
                        </span>
                      ) : (
                        <span className="text-[11px] text-text-muted">Default</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditPermissions(member)}
                          className="h-8 px-2.5 text-xs text-text-secondary hover:text-text-primary gap-1"
                        >
                          <Sliders className="w-3.5 h-3.5 text-text-muted" />
                          <span>Role & Access</span>
                        </Button>

                        <button
                          type="button"
                          disabled={isSoleAdmin}
                          title={
                            isSoleAdmin
                              ? 'Sole company admin cannot be removed'
                              : 'Remove team member'
                          }
                          onClick={() => onRemoveMember(member)}
                          className={`p-1.5 rounded-lg text-text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors ${
                            isSoleAdmin ? 'opacity-30 cursor-not-allowed' : ''
                          }`}
                          aria-label="Remove member"
                        >
                          {isSoleAdmin ? (
                            <Lock className="w-4 h-4 text-text-muted" />
                          ) : (
                            <UserMinus className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamMembersTable;
