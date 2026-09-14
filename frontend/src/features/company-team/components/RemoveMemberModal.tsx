import React, { useState } from 'react';
import {
  X,
  UserMinus,
  AlertTriangle,
  Briefcase,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useRemoveMember } from '../hooks';
import type { TeamMemberDto } from '../types';

interface RemoveMemberModalProps {
  member: TeamMemberDto | null;
  isOpen: boolean;
  onClose: () => void;
  availableSuccessors: TeamMemberDto[];
}

export const RemoveMemberModal: React.FC<RemoveMemberModalProps> = ({
  member,
  isOpen,
  onClose,
  availableSuccessors,
}) => {
  const [successorId, setSuccessorId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const removeMutation = useRemoveMember();

  if (!isOpen || !member) return null;

  const eligibleSuccessors = availableSuccessors.filter((m) => m.id !== member.id);

  const handleConfirm = async () => {
    setErrorMsg(null);

    try {
      await removeMutation.mutateAsync({
        id: member.id,
        data: {
          transferRequisitionsToUserId: successorId ? successorId : undefined,
        },
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Failed to remove team member'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-2xl border border-border-default overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border-default bg-rose-50/40 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
              <UserMinus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                Remove Team Member
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Revoke platform access and release seat quota
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          <p className="text-xs text-text-secondary leading-relaxed">
            Are you sure you want to remove <strong className="text-text-primary">{member.fullName}</strong> ({member.email}) from your organization?
          </p>

          <div className="p-3.5 rounded-xl bg-surface-muted border border-border-default space-y-2 text-xs text-text-secondary">
            <div className="flex items-center gap-2 text-text-primary font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Consequences of removal:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-text-muted text-[11px]">
              <li>The user's active session will be invalidated immediately.</li>
              <li>1 recruiter seat will be returned to your company's subscription plan.</li>
              <li>Historical audit logs and interview scorecards written by this user are preserved.</li>
            </ul>
          </div>

          {/* Job Reassignment Picker */}
          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
              <Briefcase className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Transfer Active Requisitions
              </span>
            </div>
            <p className="text-[11px] text-text-secondary">
              Select another team member to transfer ownership of any active requisitions created by this recruiter:
            </p>

            {eligibleSuccessors.length > 0 ? (
              <select
                value={successorId}
                onChange={(e) => setSuccessorId(e.target.value)}
                className="w-full h-9 px-3 bg-surface rounded-xl border border-border-default text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              >
                <option value="">Select a successor recruiter...</option>
                {eligibleSuccessors.map((colleague) => (
                  <option key={colleague.userId} value={colleague.userId}>
                    {colleague.fullName} ({colleague.email}) — {colleague.subRole}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-[11px] text-amber-700 italic">
                No other recruiters available. Requisitions will remain in company inventory without an active owner.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={removeMutation.isPending}
              onClick={handleConfirm}
              className="gap-1.5"
            >
              <UserMinus className="w-3.5 h-3.5" />
              <span>Confirm & Remove</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoveMemberModal;
