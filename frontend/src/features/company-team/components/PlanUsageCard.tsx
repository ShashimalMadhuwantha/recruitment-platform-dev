import React from 'react';
import { ShieldCheck, Users, Briefcase, Zap, ArrowUpRight, Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { PlanUsageDto } from '../types';

interface PlanUsageCardProps {
  usage?: PlanUsageDto;
  isLoading?: boolean;
  onUpgradeClick: () => void;
}

export const PlanUsageCard: React.FC<PlanUsageCardProps> = ({
  usage,
  isLoading = false,
  onUpgradeClick,
}) => {
  if (isLoading) {
    return (
      <div className="bg-surface rounded-2xl border border-border-default p-6 animate-pulse">
        <div className="h-6 w-48 bg-surface-hover rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-20 bg-surface-hover rounded-xl" />
          <div className="h-20 bg-surface-hover rounded-xl" />
          <div className="h-20 bg-surface-hover rounded-xl" />
        </div>
      </div>
    );
  }

  if (!usage) return null;

  const { plan, usage: stats } = usage;
  const isUnlimitedSeats = stats.seats.maxSeats >= 9999;
  const isUnlimitedJobs = stats.jobPosts.maxJobPosts >= 9999;
  const isUnlimitedScans = stats.atsScans.maxAtsScans >= 9999;

  const getProgressColor = (percent: number, isUnlimited: boolean) => {
    if (isUnlimited) return 'bg-indigo-600';
    if (percent >= 100) return 'bg-rose-600';
    if (percent >= 75) return 'bg-amber-500';
    return 'bg-indigo-600';
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'ENTERPRISE':
        return {
          label: 'ENTERPRISE',
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-500/20',
        };
      case 'PRO':
        return {
          label: 'PRO TIER',
          badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-500/20',
        };
      case 'FREE':
      default:
        return {
          label: 'FREE PLAN',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20',
        };
    }
  };

  const tier = getTierBadge(plan.tier);
  const isSeatCapped = stats.seats.isAtCapacity;

  return (
    <div className="bg-surface rounded-2xl border border-border-default shadow-xs overflow-hidden">
      {/* Top Banner Header */}
      <div className="p-6 border-b border-border-default bg-gradient-to-r from-surface via-surface to-surface-muted flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 shadow-2xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-text-primary tracking-tight">
                Subscription & Quota Health
              </h2>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${tier.badgeClass}`}>
                {tier.label}
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Manage your company seat allocation, requisition caps, and automated ATS parsing limits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {plan.tier !== 'ENTERPRISE' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={onUpgradeClick}
              className="font-medium gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upgrade Plan</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onUpgradeClick}
              className="text-xs font-medium gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-purple-600" />
              <span>Custom Enterprise Quotas</span>
            </Button>
          )}
        </div>
      </div>

      {/* Seat Cap Warning Notice if at capacity */}
      {isSeatCapped && (
        <div className="px-6 py-3 bg-amber-50/80 border-b border-amber-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Seat quota reached ({stats.seats.occupiedSeats}/{stats.seats.maxSeats}).</strong> Additional recruiter invites will be locked until existing seats are released or the plan is upgraded.
            </span>
          </div>
          <button
            onClick={onUpgradeClick}
            className="text-xs font-bold text-amber-800 hover:text-amber-900 underline shrink-0"
          >
            Upgrade to Pro/Enterprise
          </button>
        </div>
      )}

      {/* Quota Progress Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-surface">
        {/* Recruiter Seats */}
        <div className="p-4 rounded-xl border border-border-default bg-surface-muted/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
              <Users className="w-4 h-4 text-brand-600" />
              <span>Team Seats</span>
            </div>
            <span className="text-xs font-bold text-text-primary">
              {stats.seats.occupiedSeats} / {isUnlimitedSeats ? '∞ Unlimited' : stats.seats.maxSeats}
            </span>
          </div>

          <div className="h-2 w-full bg-border-default/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(stats.seats.percentUsed, isUnlimitedSeats)}`}
              style={{ width: `${Math.min(100, stats.seats.percentUsed)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-text-muted pt-0.5">
            <span>{stats.seats.activeRecruiters} active • {stats.seats.pendingInvites} pending</span>
            <span className={stats.seats.remainingSeats <= 0 && !isUnlimitedSeats ? 'text-rose-600 font-bold' : ''}>
              {isUnlimitedSeats ? 'Unlimited' : `${stats.seats.remainingSeats} remaining`}
            </span>
          </div>
        </div>

        {/* Active Job Requisitions */}
        <div className="p-4 rounded-xl border border-border-default bg-surface-muted/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
              <Briefcase className="w-4 h-4 text-brand-600" />
              <span>Job Openings</span>
            </div>
            <span className="text-xs font-bold text-text-primary">
              {stats.jobPosts.activeJobs} / {isUnlimitedJobs ? '∞ Unlimited' : stats.jobPosts.maxJobPosts}
            </span>
          </div>

          <div className="h-2 w-full bg-border-default/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(stats.jobPosts.percentUsed, isUnlimitedJobs)}`}
              style={{ width: `${Math.min(100, stats.jobPosts.percentUsed)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-text-muted pt-0.5">
            <span>Published openings</span>
            <span className={stats.jobPosts.remainingJobs <= 0 && !isUnlimitedJobs ? 'text-rose-600 font-bold' : ''}>
              {isUnlimitedJobs ? 'Unlimited' : `${stats.jobPosts.remainingJobs} remaining`}
            </span>
          </div>
        </div>

        {/* ATS Resume Scans */}
        <div className="p-4 rounded-xl border border-border-default bg-surface-muted/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
              <Zap className="w-4 h-4 text-brand-600" />
              <span>ATS Resume Scans</span>
            </div>
            <span className="text-xs font-bold text-text-primary">
              {stats.atsScans.scansUsed} / {isUnlimitedScans ? '∞ Unlimited' : stats.atsScans.maxAtsScans}
            </span>
          </div>

          <div className="h-2 w-full bg-border-default/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(stats.atsScans.percentUsed, isUnlimitedScans)}`}
              style={{ width: `${Math.min(100, stats.atsScans.percentUsed)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-text-muted pt-0.5">
            <span>Automated parsing</span>
            <span className={stats.atsScans.remainingScans <= 0 && !isUnlimitedScans ? 'text-rose-600 font-bold' : ''}>
              {isUnlimitedScans ? 'Unlimited' : `${stats.atsScans.remainingScans} scans left`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanUsageCard;
