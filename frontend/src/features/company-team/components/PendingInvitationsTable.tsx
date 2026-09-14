import React, { useState } from 'react';
import {
  Mail,
  RotateCw,
  Trash2,
  Clock,
  ShieldCheck,
  Briefcase,
  User,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { TeamInvitationDto, RecruiterSubRole } from '../types';

interface PendingInvitationsTableProps {
  invitations: TeamInvitationDto[];
  isLoading?: boolean;
  onResend: (id: string) => Promise<void>;
  onRevoke: (id: string) => Promise<void>;
}

export const PendingInvitationsTable: React.FC<PendingInvitationsTableProps> = ({
  invitations,
  isLoading = false,
  onResend,
  onRevoke,
}) => {
  const [busyActionId, setBusyActionId] = useState<string | null>(null);

  const getSubRoleBadge = (subRole?: RecruiterSubRole) => {
    switch (subRole) {
      case 'COMPANY_ADMIN':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            <ShieldCheck className="w-3 h-3" />
            <span>Company Admin</span>
          </span>
        );
      case 'HIRING_MANAGER':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Briefcase className="w-3 h-3" />
            <span>Hiring Manager</span>
          </span>
        );
      case 'INTERVIEWER':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <User className="w-3 h-3" />
            <span>Interviewer</span>
          </span>
        );
    }
  };

  const getExpiryDetails = (expiresAt: string) => {
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs <= 0) {
      return {
        text: 'Expired',
        isExpired: true,
        className: 'text-rose-600 font-semibold',
      };
    }

    if (diffDays <= 1) {
      return {
        text: 'Expires today',
        isExpired: false,
        className: 'text-amber-700 font-semibold',
      };
    }

    return {
      text: `Expires in ${diffDays} days`,
      isExpired: false,
      className: 'text-text-secondary',
    };
  };

  const handleResend = async (id: string) => {
    setBusyActionId(`resend-${id}`);
    try {
      await onResend(id);
    } finally {
      setBusyActionId(null);
    }
  };

  const handleRevoke = async (id: string) => {
    setBusyActionId(`revoke-${id}`);
    try {
      await onRevoke(id);
    } finally {
      setBusyActionId(null);
    }
  };

  // Filter to pending or recently expired invitations
  const activeInvitations = invitations.filter(
    (inv) => inv.status === 'PENDING' || inv.status === 'EXPIRED'
  );

  if (isLoading) {
    return (
      <div className="bg-surface rounded-2xl border border-border-default p-6 animate-pulse">
        <div className="h-5 w-48 bg-surface-hover rounded mb-4" />
        <div className="space-y-3">
          <div className="h-10 bg-surface-hover rounded-xl" />
          <div className="h-10 bg-surface-hover rounded-xl" />
        </div>
      </div>
    );
  }

  if (activeInvitations.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-border-default p-8 text-center">
        <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center mx-auto mb-2.5">
          <Mail className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-bold text-text-primary">No Pending Invitations</h4>
        <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1">
          All team invitations have either been accepted or revoked. You can invite new recruiters whenever you have available plan seats.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-border-default shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-border-default bg-surface flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h3 className="text-base font-bold text-text-primary tracking-tight">
            Pending Invitations
          </h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
            {activeInvitations.length} Pending
          </span>
        </div>
        <p className="text-xs text-text-muted hidden sm:block">
          Each pending invitation reserves 1 seat in your subscription quota until revoked or accepted.
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-muted border-b border-border-default text-text-secondary uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="py-3 px-5">Candidate Email</th>
              <th className="py-3 px-4">Role Assigned</th>
              <th className="py-3 px-4">Invited By</th>
              <th className="py-3 px-4">Validity</th>
              <th className="py-3 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {activeInvitations.map((inv) => {
              const expiry = getExpiryDetails(inv.expiresAt);
              const isResending = busyActionId === `resend-${inv.id}`;
              const isRevoking = busyActionId === `revoke-${inv.id}`;

              return (
                <tr key={inv.id} className="hover:bg-surface-hover/50 transition-colors">
                  {/* Email */}
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-surface-muted border border-border-default flex items-center justify-center text-text-secondary shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-text-primary">{inv.email}</span>
                    </div>
                  </td>

                  {/* Sub Role */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getSubRoleBadge(inv.subRole)}
                  </td>

                  {/* Invited By */}
                  <td className="py-3.5 px-4 text-text-secondary whitespace-nowrap">
                    <span>{inv.invitedByName || 'Company Admin'}</span>
                  </td>

                  {/* Expiry */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-text-muted" />
                      <span className={expiry.className}>{expiry.text}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isResending || isRevoking}
                        onClick={() => handleResend(inv.id)}
                        className="h-7 px-2.5 text-xs gap-1"
                      >
                        <RotateCw
                          className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`}
                        />
                        <span>Resend</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isResending || isRevoking}
                        onClick={() => handleRevoke(inv.id)}
                        className="h-7 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        title="Revoke invitation to release seat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="sr-only">Revoke</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PendingInvitationsTable;
