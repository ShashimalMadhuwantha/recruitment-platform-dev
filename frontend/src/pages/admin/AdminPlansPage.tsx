import React from 'react';
import { useSubscriptionPlans } from '../../features/admin/hooks';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';

export const AdminPlansPage: React.FC = () => {
  const { data: plans, isLoading, error } = useSubscriptionPlans();

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'ENTERPRISE':
        return 'success';
      case 'PRO':
        return 'primary';
      case 'FREE':
      default:
        return 'neutral';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Subscription Plans & Resource Quotas
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Review subscription tiers, platform usage limits, and active company allocations.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          Failed to load subscription plans.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans?.map((plan) => {
            const isEnterprise = plan.tier === 'ENTERPRISE';
            const isPro = plan.tier === 'PRO';

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col justify-between ${
                  isEnterprise
                    ? 'border-2 border-brand-500 shadow-md ring-1 ring-brand-500/20'
                    : isPro
                    ? 'border-border-focus'
                    : ''
                }`}
              >
                <div>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <h3 className="text-xl font-bold text-text-primary">{plan.name}</h3>
                      <p className="text-xs text-text-secondary mt-1">{plan.description}</p>
                    </div>
                    <Badge variant={getTierBadgeVariant(plan.tier)}>{plan.tier}</Badge>
                  </CardHeader>

                  <CardContent className="space-y-6 pt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-text-primary">
                        ${plan.priceMonthly}
                      </span>
                      <span className="text-xs text-text-secondary">/ month</span>
                    </div>

                    <div className="space-y-3 border-t border-border-default pt-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Resource Quotas
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center py-1 border-b border-border-subtle">
                          <span className="text-text-secondary">Active Job Postings</span>
                          <span className="font-semibold text-text-primary">
                            {plan.maxJobPosts === 9999 ? 'Unlimited' : plan.maxJobPosts}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-border-subtle">
                          <span className="text-text-secondary">Recruiter Team Seats</span>
                          <span className="font-semibold text-text-primary">
                            {plan.maxSeats === 9999 ? 'Unlimited' : plan.maxSeats}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-border-subtle">
                          <span className="text-text-secondary">Monthly ATS Scans</span>
                          <span className="font-semibold text-text-primary">
                            {(plan.maxAtsScans ?? (plan as any).maxAtsScansMonthly) === 9999
                              ? 'Unlimited'
                              : `${((plan.maxAtsScans ?? (plan as any).maxAtsScansMonthly) || 0).toLocaleString()} / mo`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-border-default pt-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Features Included
                      </h4>
                      <ul className="text-xs text-text-secondary space-y-1.5 list-disc list-inside">
                        {plan.tier === 'FREE' && (
                          <>
                            <li>Standard applicant tracking</li>
                            <li>Email application notices</li>
                            <li>Community support</li>
                          </>
                        )}
                        {plan.tier === 'PRO' && (
                          <>
                            <li>Full ATS scoring & keyword parser</li>
                            <li>Automated status transition emails</li>
                            <li>Custom candidate tags & notes</li>
                            <li>Priority email support</li>
                          </>
                        )}
                        {plan.tier === 'ENTERPRISE' && (
                          <>
                            <li>AI Deep Candidate Matching & Scoring</li>
                            <li>Multi-tenant custom branded portal</li>
                            <li>Dedicated Account Manager & SLA</li>
                            <li>Unlimited ATS Resume Scans</li>
                            <li>Custom API Webhooks & Integrations</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </div>

                <div className="p-6 pt-0 border-t border-border-subtle mt-4">
                  <div className="text-xs text-text-muted text-center pt-2">
                    Managed by Super Admin. Assigned per tenant.
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminPlansPage;
