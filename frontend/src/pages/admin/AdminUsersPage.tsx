import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { StatusPill } from '../../components/ui/StatusPill';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  useAdminUsers,
  useUpdateUserStatus,
  useImpersonateUser,
} from '../../features/admin/hooks';
import { UserRole, UserStatus } from '@recruitment-platform/shared';
import { AdminUser } from '../../features/admin/types';

export const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  // Modal States
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [newStatus, setNewStatus] = useState<UserStatus>('SUSPENDED');
  const [statusReason, setStatusReason] = useState('');
  const [impersonateTarget, setImpersonateTarget] = useState<AdminUser | null>(null);

  // Queries & Mutations
  const { data: usersData, isLoading } = useAdminUsers({
    page,
    limit: 10,
    search: search || undefined,
    role: roleFilter === 'ALL' ? undefined : roleFilter,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });

  const updateStatusMutation = useUpdateUserStatus();
  const impersonateMutation = useImpersonateUser();

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !statusReason.trim()) return;

    try {
      await updateStatusMutation.mutateAsync({
        userId: selectedUser.id,
        payload: {
          status: newStatus,
          reason: statusReason.trim(),
        },
      });
      setSelectedUser(null);
      setStatusReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const handleImpersonateSubmit = async () => {
    if (!impersonateTarget) return;

    try {
      const result = await impersonateMutation.mutateAsync({
        userId: impersonateTarget.id,
        reason: 'Super Admin support investigation',
      });

      setImpersonateTarget(null);

      // Redirect to user's perspective
      if (result.user.role === 'RECRUITER') {
        navigate('/recruiter/dashboard');
      } else {
        navigate('/applicant/dashboard');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to impersonate user');
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Global User Directory
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Search, inspect, and manage permissions and account status for all platform users.
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <Card className="p-4 border-border-default space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Search Users
            </label>
            <input
              type="text"
              placeholder="Search by name, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 px-3 bg-surface rounded-md border border-border-default text-xs text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
            />
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Filter by Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as any);
                setPage(1);
              }}
              className="w-full h-9 px-3 bg-surface rounded-md border border-border-default text-xs text-text-primary focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="APPLICANT">Job Seeker / Applicant</option>
              <option value="RECRUITER">Employer / Recruiter</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="w-full h-9 px-3 bg-surface rounded-md border border-border-default text-xs text-text-primary focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="BANNED">Banned</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden border-border-default">
        {isLoading ? (
          <div className="p-12 text-center text-text-secondary text-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent mx-auto mb-3" />
            Loading users directory...
          </div>
        ) : !usersData || usersData.items.length === 0 ? (
          <EmptyState
            title="No users found"
            description="No user accounts match your search or filter parameters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-surface-muted border-b border-border-default text-xs font-semibold text-text-secondary">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role / Organization</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {usersData.items.map((user) => {
                  const fullName =
                    user.applicantProfile
                      ? `${user.applicantProfile.firstName} ${user.applicantProfile.lastName}`
                      : user.email.split('@')[0];

                  return (
                    <tr key={user.id} className="hover:bg-surface-muted/50 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-text-primary">{fullName}</div>
                        <div className="text-xs text-text-muted">{user.email}</div>
                      </td>

                      {/* Role / Org */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-medium ${
                              user.role === 'SUPER_ADMIN'
                                ? 'bg-slate-100 text-slate-800 font-bold'
                                : user.role === 'RECRUITER'
                                ? 'bg-teal-50 text-teal-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {user.role}
                          </span>
                        </div>
                        {user.recruiterProfile?.company && (
                          <div className="text-xs text-text-muted mt-0.5">
                            {user.recruiterProfile.company.name} ({user.recruiterProfile.subRole})
                          </div>
                        )}
                        {user.applicantProfile?.headline && (
                          <div className="text-xs text-text-muted mt-0.5 truncate max-w-[200px]">
                            {user.applicantProfile.headline}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <StatusPill status={user.status} />
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4 text-xs text-text-secondary">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {user.role !== 'SUPER_ADMIN' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs text-brand-primary"
                              onClick={() => setImpersonateTarget(user)}
                            >
                              Impersonate
                            </Button>

                            {user.status === 'ACTIVE' ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs text-amber-700 hover:bg-amber-50"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setNewStatus('SUSPENDED');
                                }}
                              >
                                Suspend
                              </Button>
                            ) : user.status === 'SUSPENDED' || user.status === 'BANNED' ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs text-emerald-700 hover:bg-emerald-50"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setNewStatus('ACTIVE');
                                }}
                              >
                                Reinstate
                              </Button>
                            ) : null}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {usersData && usersData.totalPages > 1 && (
          <div className="p-4 border-t border-border-default flex items-center justify-between text-xs text-text-secondary">
            <span>
              Showing page {usersData.page} of {usersData.totalPages} ({usersData.total} users)
            </span>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={page >= usersData.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 1. Suspend / Ban / Reinstate Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6 space-y-4 bg-surface shadow-xl border-border-default">
            <h3 className="text-base font-bold text-text-primary">
              Confirm Account Status: {newStatus}
            </h3>
            <p className="text-xs text-text-secondary">
              You are changing the account status of{' '}
              <strong>{selectedUser.email}</strong> to{' '}
              <span className="font-semibold">{newStatus}</span>.
            </p>

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-text-secondary">
                  Target Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as UserStatus)}
                  className="w-full h-9 px-3 bg-surface rounded-md border border-border-default text-xs text-text-primary focus:border-brand-primary outline-none"
                >
                  <option value="ACTIVE">Active (Reinstate)</option>
                  <option value="SUSPENDED">Suspended (Temporary Lockout)</option>
                  <option value="BANNED">Banned (Permanent Restriction)</option>
                </select>
              </div>

              <FormField
                id="statusReason"
                label="Audit Reason (Mandatory)"
                placeholder="e.g. Inappropriate job posting content / Terms violation"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                required
              />

              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedUser(null);
                    setStatusReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={newStatus === 'ACTIVE' ? 'primary' : 'danger'}
                  size="sm"
                  disabled={updateStatusMutation.isPending || !statusReason.trim()}
                >
                  {updateStatusMutation.isPending ? 'Saving...' : 'Apply Status'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* 2. Impersonation Confirmation Modal */}
      {impersonateTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6 space-y-4 bg-surface shadow-xl border-border-default">
            <div className="flex items-center space-x-2 text-amber-600">
              <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-base font-bold text-text-primary">
                Confirm Admin Impersonation
              </h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              You are about to enter <strong>Impersonation Mode</strong> as{' '}
              <span className="font-semibold text-text-primary">{impersonateTarget.email}</span> (
              {impersonateTarget.role}).
              <br />
              <br />
              All actions taken while impersonating are recorded in the platform <strong>Audit Log</strong>. A top banner will allow you to return to Super Admin mode at any time.
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setImpersonateTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="bg-amber-600 hover:bg-amber-700"
                onClick={handleImpersonateSubmit}
                disabled={impersonateMutation.isPending}
              >
                {impersonateMutation.isPending ? 'Connecting...' : 'Proceed with Impersonation'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
