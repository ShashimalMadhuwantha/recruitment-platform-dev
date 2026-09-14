import React, { useState } from 'react';
import {
  useCompanySummary,
  useFunnelMetrics,
  useSourceAttribution,
  useApplicationVelocity,
  useScoreDistribution,
  useDiversityAnalytics,
  useCandidatesReport,
} from '../../features/analytics/hooks';
import { jobVacancyApi } from '../../features/job-vacancy/api';
import { useQuery } from '@tanstack/react-query';
import { KpiMetricCard } from '../../features/analytics/components/KpiMetricCard';
import { FunnelChart } from '../../features/analytics/components/FunnelChart';
import { VelocityChart } from '../../features/analytics/components/VelocityChart';
import { SourceAttributionCard } from '../../features/analytics/components/SourceAttributionCard';
import { ScoreDistributionCard } from '../../features/analytics/components/ScoreDistributionCard';
import { ExportReportModal } from '../../features/analytics/components/ExportReportModal';
import { DiversityAnalyticsTab } from '../../features/analytics/components/DiversityAnalyticsTab';
import { CandidateReportsTab } from '../../features/analytics/components/CandidateReportsTab';
import { Button } from '../../components/ui/Button';
import type { AnalyticsFilterParams } from '@recruitment-platform/shared';

export const CompanyAnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'diversity'>('overview');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [velocityInterval, setVelocityInterval] = useState<'day' | 'week' | 'month'>('day');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Calculate start date based on range filter
  const getFilterParams = (): AnalyticsFilterParams => {
    const params: AnalyticsFilterParams = {};
    if (selectedJobId) params.jobId = selectedJobId;

    const now = new Date();
    if (dateRange === '7d') {
      params.startDate = new Date(now.getTime() - 7 * 86400000).toISOString().substring(0, 10);
    } else if (dateRange === '30d') {
      params.startDate = new Date(now.getTime() - 30 * 86400000).toISOString().substring(0, 10);
    } else if (dateRange === '90d') {
      params.startDate = new Date(now.getTime() - 90 * 86400000).toISOString().substring(0, 10);
    }

    return params;
  };

  const filterParams = getFilterParams();

  // Load available jobs for filter dropdown
  const { data: jobsData } = useQuery({
    queryKey: ['jobs', 'recruiter-list'],
    queryFn: () => jobVacancyApi.listJobs({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const jobsList = jobsData?.items || [];

  // Analytics queries
  const { data: summary, isLoading: isSummaryLoading } = useCompanySummary(filterParams);
  const { data: funnel, isLoading: isFunnelLoading } = useFunnelMetrics(filterParams);
  const { data: sources, isLoading: isSourcesLoading } = useSourceAttribution(filterParams);
  const { data: velocity, isLoading: isVelocityLoading } = useApplicationVelocity({
    ...filterParams,
    interval: velocityInterval,
  });
  const { data: distribution, isLoading: isDistributionLoading } = useScoreDistribution(filterParams);
  const { data: diversity, isLoading: isDiversityLoading } = useDiversityAnalytics(
    selectedJobId || undefined
  );
  const { data: candidatesReport, isLoading: isCandidatesLoading } = useCandidatesReport(filterParams);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            Analytics & Reporting
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Real-time pipeline conversion, candidate velocity, sourcing channels, and compliance exports
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => setIsExportModalOpen(true)}
            className="text-xs py-2 h-9"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Reports
          </Button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="bg-surface border border-border-default rounded-lg p-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Requisition Dropdown */}
          <div className="w-full sm:w-64">
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full text-xs bg-surface border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-600 font-medium"
            >
              <option value="">All Requisitions (Company-wide)</option>
              {jobsList.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Filter Pills */}
          <div className="inline-flex rounded-lg border border-border-default p-0.5 bg-surface-muted">
            {[
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' },
              { id: 'all', label: 'All Time' },
            ].map((range) => (
              <button
                key={range.id}
                type="button"
                onClick={() => setDateRange(range.id as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  dateRange === range.id
                    ? 'bg-surface text-text-primary shadow-sm border border-border-default'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b md:border-b-0 border-border-default w-full md:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-brand-900 text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
            }`}
          >
            Overview & Funnel
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-brand-900 text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
            }`}
          >
            Candidate Reports & Export
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('diversity')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'diversity'
                ? 'bg-brand-900 text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
            }`}
          >
            Diversity & Inclusion
          </button>
        </div>
      </div>

      {/* Tab 1: Overview & Funnel */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiMetricCard
              title="Total Applications"
              value={summary?.totalApplications ?? 0}
              trend={
                summary?.trends
                  ? { value: summary.trends.applicationsTrendPercent, unit: '%' }
                  : undefined
              }
              subtitle="Active requisition volume"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />

            <KpiMetricCard
              title="Average Time to Hire"
              value={summary?.avgTimeToHireDays ?? 0}
              unit="days"
              trend={
                summary?.trends
                  ? {
                      value: summary.trends.timeToHireTrendDays,
                      unit: 'd',
                      isPositiveGood: false,
                    }
                  : undefined
              }
              subtitle="From applied to hired status"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            <KpiMetricCard
              title="Average ATS Match"
              value={summary ? `${summary.avgAtsScore}%` : '0%'}
              trend={
                summary?.trends
                  ? { value: summary.trends.atsScoreTrendPercent, unit: '%' }
                  : undefined
              }
              subtitle="Semantic qualification score"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />

            <KpiMetricCard
              title="Offer Acceptance Rate"
              value={summary ? `${summary.offerAcceptanceRate}%` : '0%'}
              trend={
                summary?.trends
                  ? { value: summary.trends.offerAcceptanceTrendPercent, unit: '%' }
                  : undefined
              }
              subtitle="Accepted vs extended offers"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>

          {/* Interactive Funnel Visualization */}
          <FunnelChart
            stages={funnel?.stages || []}
            totalApplications={funnel?.totalApplications || 0}
            totalHired={funnel?.totalHired || 0}
            overallConversionRate={funnel?.overallConversionRate || 0}
            isLoading={isFunnelLoading}
          />

          {/* 2-Column Analytics Grid: Velocity & Score Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VelocityChart
              points={velocity?.points || []}
              interval={velocityInterval}
              onIntervalChange={setVelocityInterval}
              isLoading={isVelocityLoading}
            />

            <ScoreDistributionCard
              distribution={
                distribution || {
                  strongMatchCount: 0,
                  strongMatchPercentage: 0,
                  partialMatchCount: 0,
                  partialMatchPercentage: 0,
                  weakMatchCount: 0,
                  weakMatchPercentage: 0,
                  totalScored: 0,
                  averageScore: 0,
                }
              }
              isLoading={isDistributionLoading}
            />
          </div>

          {/* Candidate Source Attribution */}
          <SourceAttributionCard
            sources={sources?.sources || []}
            total={sources?.total || 0}
            isLoading={isSourcesLoading}
          />
        </div>
      )}

      {/* Tab 2: Candidate Reports & Export */}
      {activeTab === 'reports' && (
        <CandidateReportsTab
          candidates={candidatesReport?.candidates || []}
          totalCandidates={candidatesReport?.totalCandidates || 0}
          isLoading={isCandidatesLoading}
          onExportClick={() => setIsExportModalOpen(true)}
        />
      )}

      {/* Tab 3: Diversity & Inclusion */}
      {activeTab === 'diversity' && (
        <DiversityAnalyticsTab
          data={diversity}
          isLoading={isDiversityLoading}
        />
      )}

      {/* Export Configuration Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        jobs={jobsList}
        defaultJobId={selectedJobId}
      />
    </div>
  );
};

export default CompanyAnalyticsPage;
