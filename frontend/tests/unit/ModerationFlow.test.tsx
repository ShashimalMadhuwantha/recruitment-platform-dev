import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminModerationPage } from '../../src/pages/admin/AdminModerationPage';
import * as ModerationHooksModule from '../../src/features/moderation/hooks';

const renderWithProviders = (ui: React.ReactElement, initialEntries = ['/']) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Frontend Moderation & Compliance Flow (Epic 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(ModerationHooksModule, 'useModerationStats').mockReturnValue({
      data: {
        pendingJobReports: 3,
        pendingProfileReports: 1,
        totalBannedKeywords: 12,
        openGdprRequests: 2,
      },
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(ModerationHooksModule, 'useContentReports').mockReturnValue({
      data: {
        items: [
          {
            id: 'rep-job-1',
            targetType: 'JOB_POSTING',
            targetId: 'job-123',
            reason: 'Discriminatory age criteria',
            description: 'Requires candidates to be recent graduates under 25',
            status: 'PENDING',
            createdAt: '2026-03-01T00:00:00Z',
            updatedAt: '2026-03-01T00:00:00Z',
            reporter: { id: 'u-1', email: 'applicant@test.com', role: 'APPLICANT' },
            targetDetails: {
              title: 'Frontend Developer (Young Only)',
              companyName: 'Acme Corp',
              status: 'PUBLISHED',
            },
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(ModerationHooksModule, 'useBannedKeywords').mockReturnValue({
      data: [
        {
          id: 'kw-1',
          keyword: 'young and energetic',
          category: 'DISCRIMINATION',
          severity: 'BLOCK',
          isActive: true,
          createdAt: '2026-03-01T00:00:00Z',
          updatedAt: '2026-03-01T00:00:00Z',
        },
      ],
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(ModerationHooksModule, 'useAuditLogs').mockReturnValue({
      data: {
        items: [
          {
            id: 'audit-1',
            action: 'MODERATION_REPORT_RESOLVE',
            targetType: 'JOB_POSTING',
            targetId: 'job-123',
            createdAt: '2026-03-01T12:00:00Z',
            actor: { id: 'admin-1', email: 'admin@ats.local', role: 'SUPER_ADMIN' },
            detailsJson: { action: 'TAKEDOWN' },
          },
        ],
        total: 1,
        page: 1,
        limit: 15,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(ModerationHooksModule, 'useGdprRequests').mockReturnValue({
      data: [
        {
          id: 'gdpr-1',
          userId: 'user-app-1',
          requestType: 'DATA_EXPORT',
          status: 'SUBMITTED',
          slaDeadline: '2026-03-31T00:00:00Z',
          createdAt: '2026-03-01T00:00:00Z',
          updatedAt: '2026-03-01T00:00:00Z',
          user: { id: 'user-app-1', email: 'applicant@gdpr.com', role: 'APPLICANT', status: 'ACTIVE' },
        },
      ],
      isLoading: false,
      error: null,
    } as any);
  });

  it('1. Renders Moderation Center with KPI metrics and Flagged Jobs tab', () => {
    renderWithProviders(<AdminModerationPage />);

    expect(screen.getByText('Moderation & Compliance Center')).toBeInTheDocument();
    expect(screen.getAllByText('Flagged Jobs').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Reported Profiles').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Banned Keywords & Anti-Discrimination' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Platform Audit Logs' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'GDPR Privacy Requests' })).toBeInTheDocument();

    // Verify Flagged Job row
    expect(screen.getByText('Frontend Developer (Young Only)')).toBeInTheDocument();
    expect(screen.getByText('Discriminatory age criteria')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Take Down/i })).toBeInTheDocument();
  });

  it('2. Navigates to Banned Keywords tab and displays prohibited taxonomy', () => {
    renderWithProviders(<AdminModerationPage />);

    const keywordsTab = screen.getByRole('button', { name: 'Banned Keywords & Anti-Discrimination' });
    fireEvent.click(keywordsTab);

    expect(screen.getByText('Add Prohibited / Discriminatory Term')).toBeInTheDocument();
    expect(screen.getByText('young and energetic')).toBeInTheDocument();
    expect(screen.getByText('Live Anti-Bias Validator')).toBeInTheDocument();
  });

  it('3. Navigates to Audit Logs tab and displays audit events', () => {
    renderWithProviders(<AdminModerationPage />);

    const auditTab = screen.getByRole('button', { name: 'Platform Audit Logs' });
    fireEvent.click(auditTab);

    expect(screen.getByPlaceholderText(/Search action or target ID/i)).toBeInTheDocument();
    expect(screen.getByText('MODERATION_REPORT_RESOLVE')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Inspect JSON/i })).toBeInTheDocument();
  });

  it('4. Navigates to GDPR tab and displays subject access requests', () => {
    renderWithProviders(<AdminModerationPage />);

    const gdprTab = screen.getByRole('button', { name: 'GDPR Privacy Requests' });
    fireEvent.click(gdprTab);

    expect(screen.getByText('GDPR & Data Subject Requests')).toBeInTheDocument();
    expect(screen.getByText('applicant@gdpr.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fulfill Request/i })).toBeInTheDocument();
  });
});
