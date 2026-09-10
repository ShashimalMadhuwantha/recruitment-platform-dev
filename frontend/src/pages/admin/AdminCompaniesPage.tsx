import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { StatusPill } from '../../components/ui/StatusPill';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  useAdminCompanies,
  useAdminCompany,
  useUpdateCompanyStatus,
  useSubscriptionPlans,
  useAssignCompanyPlan,
} from '../../features/admin/hooks';
import { CompanyStatus } from '@recruitment-platform/shared';
import { AdminCompany } from '../../features/admin/types';

export const AdminCompaniesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatusParam = searchParams.get('status') as CompanyStatus | null;

  const [statusFilter, setStatusFilter] = useState<CompanyStatus | 'ALL'>(
    currentStatusParam || 'ALL'
  );
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modal States
  const [selectedCompany, setSelectedCompany] = useState<AdminCompany | null>(null);
  const [detailCompanyId, setDetailCompanyId] = useState<string | null>(null);
  const [statusAction, setStatusAction] = useState<{
    company: AdminCompany;
    newStatus: CompanyStatus;
  } | null>(null);
  const [statusNotes, setStatusNotes] = useState('');
  const [planModalCompany, setPlanModalCompany] = useState<AdminCompany | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  // Queries & Mutations
  const { data: companiesData, isLoading } = useAdminCompanies({
    page,
    limit: 10,
    search: search || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });

  const { data: detailCompany } = useAdminCompany(detailCompanyId || undefined);
  const { data: plans } = useSubscriptionPlans();
  const updateStatusMutation = useUpdateCompanyStatus();
  const assignPlanMutation = useAssignCompanyPlan();

  const handleStatusTabChange = (status: CompanyStatus | 'ALL') => {
    setStatusFilter(status);
    setPage(1);
    if (status === 'ALL') {
      searchParams.delete('status');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ status });
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusAction) return;

    try {
      await updateStatusMutation.mutateAsync({
        id: statusAction.company.id,
        payload: {
          status: statusAction.newStatus,
          notes: statusNotes || undefined,
        },
      });
      setStatusAction(null);
      setStatusNotes('');
    } catch (err: any) {
      alert(err.message || 'Failed to update company status');
    }
  };

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planModalCompany || !selectedPlanId) return;

    try {
      await assignPlanMutation.mutateAsync({
        companyId: planModalCompany.id,
        payload: { planId: selectedPlanId },
      });
      setPlanModalCompany(null);
    } catch (err: any) {
      alert(err.message || 'Failed to assign subscription plan');
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Company & Tenant Management
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Review employer registration requests, assign plan tiers, and manage tenant accounts.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <Card className="p-4 border-border-default space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
            {(
              [
                { key: 'ALL', label: 'All Companies' },
                { key: 'PENDING_APPROVAL', label: 'Pending Approval' },
                { key: 'ACTIVE', label: 'Active' },
                { key: 'SUSPENDED', label: 'Suspended' },
                { key: 'REJECTED', label: 'Rejected' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleStatusTabChange(tab.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                  statusFilter === tab.key
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="w-full lg:w-72">
            <input
              type="text"
              placeholder="Search by company, industry..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 px-3 bg-surface rounded-md border border-border-default text-xs text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
            />
          </div>
        </div>
      </Card>

      {/* Companies Table */}
      <Card className="overflow-hidden border-border-default">
        {isLoading ? (
          <div className="p-12 text-center text-text-secondary text-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent mx-auto mb-3" />
            Loading companies...
          </div>
        ) : !companiesData || companiesData.items.length === 0 ? (
          <EmptyState
            title="No companies found"
            description={
              statusFilter === 'PENDING_APPROVAL'
                ? 'There are no employer registrations currently waiting for review.'
                : 'No companies match your search or filter criteria.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-surface-muted border-b border-border-default text-xs font-semibold text-text-secondary">
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Industry / Size</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Stats</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {companiesData.items.map((company) => (
                  <tr key={company.id} className="hover:bg-surface-muted/50 transition-colors">
                    {/* Name & Website */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-text-primary">{company.name}</div>
                      <div className="text-xs text-text-muted">
                        {company.website ? (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline text-brand-primary"
                          >
                            {company.website.replace(/^https?:\/\//, '')}
                          </a>
                        ) : (
                          `/${company.slug}`
                        )}
                      </div>
                    </td>

                    {/* Industry & Size */}
                    <td className="py-3 px-4 text-xs text-text-secondary">
                      <div>{company.industry || 'General Industry'}</div>
                      <div className="text-text-muted">{company.size || '11-50'} employees</div>
                    </td>

                    {/* Plan */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                        {company.plan?.name || 'Free Starter'}
                      </span>
                    </td>

                    {/* Stats */}
                    <td className="py-3 px-4 text-xs text-text-secondary">
                      <div>{company._count?.recruiters || 0} Team Seats</div>
                      <div className="text-text-muted">{company._count?.jobVacancies || 0} Jobs Posted</div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <StatusPill status={company.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {company.status === 'PENDING_APPROVAL' ? (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
                            onClick={() =>
                              setStatusAction({ company, newStatus: 'ACTIVE' })
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            className="h-8 text-xs"
                            onClick={() =>
                              setStatusAction({ company, newStatus: 'REJECTED' })
                            }
                          >
                            Reject
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs"
                            onClick={() => {
                              setPlanModalCompany(company);
                              setSelectedPlanId(company.planId || plans?.[0]?.id || '');
                            }}
                          >
                            Plan
                          </Button>
                          {company.status === 'ACTIVE' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs text-amber-700 hover:bg-amber-50"
                              onClick={() =>
                                setStatusAction({ company, newStatus: 'SUSPENDED' })
                              }
                            >
                              Suspend
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs text-emerald-700 hover:bg-emerald-50"
                              onClick={() =>
                                setStatusAction({ company, newStatus: 'ACTIVE' })
                              }
                            >
                              Activate
                            </Button>
                          )}
                        </>
                      )}

                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 text-xs"
                        onClick={() => setDetailCompanyId(company.id)}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {companiesData && companiesData.totalPages > 1 && (
          <div className="p-4 border-t border-border-default flex items-center justify-between text-xs text-text-secondary">
            <span>
              Showing page {companiesData.page} of {companiesData.totalPages} ({companiesData.total} total)
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
                disabled={page >= companiesData.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 1. Status Update Modal (Approve / Reject / Suspend) */}
      {statusAction && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6 space-y-4 bg-surface shadow-xl border-border-default">
            <h3 className="text-base font-bold text-text-primary">
              Confirm Status Change: {statusAction.newStatus}
            </h3>
            <p className="text-xs text-text-secondary">
              You are updating the status of{' '}
              <strong>{statusAction.company.name}</strong> to{' '}
              <span className="font-semibold">{statusAction.newStatus}</span>.
              {statusAction.newStatus === 'ACTIVE' &&
                ' Approving will automatically activate all pending recruiter accounts for this company.'}
            </p>

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <FormField
                id="statusNotes"
                label="Admin Notes / Reason (Optional)"
                placeholder="e.g. Verified business registry details"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
              />

              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setStatusAction(null);
                    setStatusNotes('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={statusAction.newStatus === 'REJECTED' ? 'danger' : 'primary'}
                  size="sm"
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? 'Updating...' : 'Confirm Update'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* 2. Assign Plan Modal */}
      {planModalCompany && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6 space-y-4 bg-surface shadow-xl border-border-default">
            <h3 className="text-base font-bold text-text-primary">
              Assign Subscription Plan
            </h3>
            <p className="text-xs text-text-secondary">
              Select the plan tier for <strong>{planModalCompany.name}</strong>:
            </p>

            <form onSubmit={handlePlanSubmit} className="space-y-4">
              <div className="space-y-2">
                {plans?.map((plan) => (
                  <label
                    key={plan.id}
                    className={`flex items-start justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedPlanId === plan.id
                        ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary'
                        : 'border-border-default hover:bg-surface-muted'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={selectedPlanId === plan.id}
                        onChange={() => setSelectedPlanId(plan.id)}
                        className="text-brand-primary focus:ring-brand-primary"
                      />
                      <div>
                        <div className="text-xs font-bold text-text-primary">{plan.name}</div>
                        <div className="text-[11px] text-text-muted">
                          {plan.maxJobPosts} jobs · {plan.maxSeats} seats · {plan.maxAtsScans} ATS scans
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-text-primary">
                      ${Number(plan.priceMonthly).toFixed(0)}/mo
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setPlanModalCompany(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={assignPlanMutation.isPending || !selectedPlanId}
                >
                  {assignPlanMutation.isPending ? 'Saving...' : 'Apply Plan'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* 3. Company Detail Drawer */}
      {detailCompanyId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-end z-50">
          <div className="w-full max-w-lg bg-surface h-full shadow-2xl p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border-default">
              <h3 className="text-lg font-bold text-text-primary">Company Profile Details</h3>
              <button
                onClick={() => setDetailCompanyId(null)}
                className="text-text-muted hover:text-text-primary font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            {detailCompany ? (
              <div className="space-y-6 text-sm">
                <div>
                  <h4 className="text-xl font-bold text-text-primary">{detailCompany.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusPill status={detailCompany.status} />
                    <span className="text-xs text-text-muted">
                      Plan: {detailCompany.plan?.name || 'Free Starter'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-text-muted block">Industry:</span>
                    <span className="font-medium text-text-primary">{detailCompany.industry || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block">Company Size:</span>
                    <span className="font-medium text-text-primary">{detailCompany.size || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-text-muted block">Website:</span>
                    {detailCompany.website ? (
                      <a
                        href={detailCompany.website}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-brand-primary hover:underline"
                      >
                        {detailCompany.website}
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </div>
                </div>

                {/* Recruiters Team */}
                <div className="space-y-2 pt-2 border-t border-border-default">
                  <h5 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Recruiter Team ({detailCompany.recruiters?.length || 0})
                  </h5>
                  <div className="space-y-2">
                    {detailCompany.recruiters?.map((r: any) => (
                      <div
                        key={r.id}
                        className="p-3 bg-surface-muted rounded-md flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-medium text-text-primary">{r.user?.email}</div>
                          <div className="text-[11px] text-text-muted">Role: {r.subRole}</div>
                        </div>
                        <StatusPill status={r.user?.status} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Jobs */}
                <div className="space-y-2 pt-2 border-t border-border-default">
                  <h5 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Recent Job Vacancies ({detailCompany.jobVacancies?.length || 0})
                  </h5>
                  <div className="space-y-2">
                    {detailCompany.jobVacancies?.map((job: any) => (
                      <div
                        key={job.id}
                        className="p-3 bg-surface-muted rounded-md flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-medium text-text-primary">{job.title}</div>
                          <div className="text-[11px] text-text-muted">
                            {job.location || 'Remote'} · {job._count?.applications || 0} applicants
                          </div>
                        </div>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {job.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-text-secondary text-sm">Loading details...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCompaniesPage;
