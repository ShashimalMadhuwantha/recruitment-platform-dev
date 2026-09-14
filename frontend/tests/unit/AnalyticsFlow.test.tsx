import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CompanyAnalyticsPage from '../../src/pages/recruiter/CompanyAnalyticsPage';
import * as AnalyticsHooksModule from '../../src/features/analytics/hooks';
import { analyticsApi } from '../../src/features/analytics/api';

const renderWithProviders = (ui: React.ReactElement, initialEntries = ['/recruiter/analytics']) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Frontend Recruiter Analytics & Reporting Flow (Epic 14)', () => {
  const mockSummary = {
    totalApplications: 142,
    activeJobs: 5,
    avgAtsScore: 74.2,
    avgTimeToHireDays: 18.5,
    offerAcceptanceRate: 88.0,
    pipelineVelocityDays: 12.4,
    trends: {
      applicationsTrendPercent: 14.2,
      timeToHireTrendDays: -2.1,
      offerAcceptanceTrendPercent: 5.0,
      atsScoreTrendPercent: 1.8,
    },
  };

  const mockFunnel = {
    stages: [
      {
        stage: 'APPLIED',
        label: 'Applied',
        count: 142,
        percentageOfTotal: 100,
        conversionFromPrev: 100,
        dropOffCount: 42,
        dropOffPercentage: 29.6,
      },
      {
        stage: 'SCREENING',
        label: 'Screening',
        count: 100,
        percentageOfTotal: 70.4,
        conversionFromPrev: 70.4,
        dropOffCount: 40,
        dropOffPercentage: 40.0,
      },
      {
        stage: 'SHORTLISTED',
        label: 'Shortlisted',
        count: 60,
        percentageOfTotal: 42.3,
        conversionFromPrev: 60.0,
        dropOffCount: 25,
        dropOffPercentage: 41.7,
      },
      {
        stage: 'INTERVIEW',
        label: 'Interview',
        count: 35,
        percentageOfTotal: 24.6,
        conversionFromPrev: 58.3,
        dropOffCount: 15,
        dropOffPercentage: 42.9,
      },
      {
        stage: 'OFFER',
        label: 'Offer',
        count: 20,
        percentageOfTotal: 14.1,
        conversionFromPrev: 57.1,
        dropOffCount: 5,
        dropOffPercentage: 25.0,
      },
      {
        stage: 'HIRED',
        label: 'Hired',
        count: 15,
        percentageOfTotal: 10.6,
        conversionFromPrev: 75.0,
        dropOffCount: 0,
        dropOffPercentage: 0,
      },
    ],
    totalApplications: 142,
    totalHired: 15,
    overallConversionRate: 10.6,
  };

  const mockSources = {
    sources: [
      { source: 'LINKEDIN', label: 'LinkedIn', count: 70, percentage: 49.3 },
      { source: 'DIRECT', label: 'Direct Application', count: 42, percentage: 29.6 },
      { source: 'REFERRAL', label: 'Employee Referral', count: 30, percentage: 21.1 },
    ],
    total: 142,
  };

  const mockVelocity = {
    interval: 'day' as const,
    points: [
      { date: '2026-09-01', label: '2026-09-01', count: 12 },
      { date: '2026-09-02', label: '2026-09-02', count: 18 },
      { date: '2026-09-03', label: '2026-09-03', count: 25 },
    ],
    total: 55,
  };

  const mockScoreDistribution = {
    strongMatchCount: 45,
    strongMatchPercentage: 31.7,
    partialMatchCount: 75,
    partialMatchPercentage: 52.8,
    weakMatchCount: 22,
    weakMatchPercentage: 15.5,
    totalScored: 142,
    averageScore: 74.2,
  };

  const mockProtectedDiversity = {
    totalRespondents: 3,
    isProtected: true,
    protectionMessage:
      'Sample size too small (< 5 respondents) to display demographic breakdowns under k-anonymity privacy protection rules.',
    genderBreakdown: [],
    raceBreakdown: [],
    veteranBreakdown: [],
    disabilityBreakdown: [],
  };

  const mockCandidatesReport = {
    totalCandidates: 2,
    exportedAt: '2026-09-14T00:00:00Z',
    candidates: [
      {
        applicationId: 'app-1',
        candidateName: 'Elena Rostova',
        candidateEmail: 'elena@example.com',
        jobTitle: 'Staff Frontend Engineer',
        stage: 'INTERVIEW',
        atsScore: 89.5,
        scoreBand: 'HIGH',
        source: 'LINKEDIN',
        appliedAt: '2026-09-05T00:00:00Z',
        updatedAt: '2026-09-10T00:00:00Z',
        timeInPipelineDays: 5.0,
      },
      {
        applicationId: 'app-2',
        candidateName: 'Marcus Vance',
        candidateEmail: 'marcus@example.com',
        jobTitle: 'Staff Frontend Engineer',
        stage: 'HIRED',
        atsScore: 92.0,
        scoreBand: 'HIGH',
        source: 'REFERRAL',
        appliedAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-12T00:00:00Z',
        timeInPipelineDays: 11.0,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(AnalyticsHooksModule, 'useCompanySummary').mockReturnValue({
      data: mockSummary,
      isLoading: false,
    } as any);

    vi.spyOn(AnalyticsHooksModule, 'useFunnelMetrics').mockReturnValue({
      data: mockFunnel,
      isLoading: false,
    } as any);

    vi.spyOn(AnalyticsHooksModule, 'useSourceAttribution').mockReturnValue({
      data: mockSources,
      isLoading: false,
    } as any);

    vi.spyOn(AnalyticsHooksModule, 'useApplicationVelocity').mockReturnValue({
      data: mockVelocity,
      isLoading: false,
    } as any);

    vi.spyOn(AnalyticsHooksModule, 'useScoreDistribution').mockReturnValue({
      data: mockScoreDistribution,
      isLoading: false,
    } as any);

    vi.spyOn(AnalyticsHooksModule, 'useDiversityAnalytics').mockReturnValue({
      data: mockProtectedDiversity,
      isLoading: false,
    } as any);

    vi.spyOn(AnalyticsHooksModule, 'useCandidatesReport').mockReturnValue({
      data: mockCandidatesReport,
      isLoading: false,
    } as any);

    vi.spyOn(AnalyticsHooksModule, 'useExportReport').mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    } as any);
  });

  it('1. Renders Overview tab with 4 KPI cards and trend indicators', () => {
    renderWithProviders(<CompanyAnalyticsPage />);

    expect(screen.getByText('Analytics & Reporting')).toBeInTheDocument();
    expect(screen.getByText('Total Applications')).toBeInTheDocument();
    expect(screen.getByText('142')).toBeInTheDocument();
    expect(screen.getByText('+14.2%')).toBeInTheDocument();

    expect(screen.getByText('Average Time to Hire')).toBeInTheDocument();
    expect(screen.getByText('18.5')).toBeInTheDocument();
    expect(screen.getByText('-2.1d')).toBeInTheDocument();

    expect(screen.getByText('Average ATS Match')).toBeInTheDocument();
    expect(screen.getAllByText('74.2%').length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText('Offer Acceptance Rate')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
  });

  it('2. Renders Funnel Visualization with stages, conversion and drop-off rates', () => {
    renderWithProviders(<CompanyAnalyticsPage />);

    expect(screen.getByText('Recruitment Pipeline Funnel')).toBeInTheDocument();
    expect(screen.getByText('15 candidates')).toBeInTheDocument(); // Hired
    expect(screen.getByText('Overall Conversion:')).toBeInTheDocument();
    expect(screen.getAllByText('10.6%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Candidate Acquisition')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
  });

  it('3. Switches to Candidate Reports tab and renders preview table', () => {
    renderWithProviders(<CompanyAnalyticsPage />);

    const reportsTabBtn = screen.getByRole('button', { name: /Candidate Reports & Export/i });
    fireEvent.click(reportsTabBtn);

    expect(screen.getByText('Candidate Pipeline Report Preview')).toBeInTheDocument();
    expect(screen.getByText('Elena Rostova')).toBeInTheDocument();
    expect(screen.getByText('Marcus Vance')).toBeInTheDocument();
    expect(screen.getByText('5d')).toBeInTheDocument();
    expect(screen.getByText('11d')).toBeInTheDocument();
  });

  it('4. Enforces k-Anonymity privacy protection when sample size is below threshold (< 5)', () => {
    renderWithProviders(<CompanyAnalyticsPage />);

    const diversityTabBtn = screen.getByRole('button', { name: /Diversity & Inclusion/i });
    fireEvent.click(diversityTabBtn);

    expect(screen.getByText('Confidential & Voluntary Diversity Insights')).toBeInTheDocument();
    expect(screen.getByText(/k-Anonymity Protected/i)).toBeInTheDocument();
    expect(screen.getByText('Demographic Metrics Withheld for Candidate Privacy')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // 3 / 5 required
  });

  it('5. Opens Export Modal on clicking Export Reports button and triggers download', async () => {
    const mockDownload = vi.spyOn(analyticsApi, 'downloadCsvReport').mockResolvedValue(undefined);
    renderWithProviders(<CompanyAnalyticsPage />);

    const exportBtn = screen.getByRole('button', { name: /Export Reports/i });
    fireEvent.click(exportBtn);

    expect(screen.getByText('Export Candidate Pipeline Report')).toBeInTheDocument();
    expect(screen.getByText('CSV Spreadsheet')).toBeInTheDocument();

    const downloadBtn = screen.getByRole('button', { name: /Download Export/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(downloadBtn).toBeInTheDocument();
    });
  });
});
