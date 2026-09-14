import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationPreferencesForm } from '../../src/features/applicant-privacy/components/NotificationPreferencesForm';
import { BlockedCompaniesManager } from '../../src/features/applicant-privacy/components/BlockedCompaniesManager';
import { GdprDataExportCard } from '../../src/features/applicant-privacy/components/GdprDataExportCard';
import { AccountDeletionModal } from '../../src/features/applicant-privacy/components/AccountDeletionModal';
import { ApplicantSettingsPage } from '../../src/pages/applicant/ApplicantSettingsPage';
import * as PrivacyHooks from '../../src/features/applicant-privacy/hooks';
import * as AuthContext from '../../src/app/providers';
import { companyDiscoveryApi } from '../../src/features/company-discovery/api';
import type {
  NotificationPreferenceDto,
  BlockedCompanyDto,
} from '../../src/features/applicant-privacy/types';

const mockPreferences: NotificationPreferenceDto = {
  userId: 'applicant-1',
  applicationStatusEmail: true,
  applicationStatusInApp: true,
  interviewInvitesEmail: true,
  interviewInvitesInApp: true,
  messagesEmail: true,
  messagesInApp: true,
  followedCompanyJobEmail: true,
  followedCompanyJobInApp: true,
  jobAlertsEmail: false,
  jobAlertsInApp: true,
  updatedAt: '2026-09-14T10:00:00Z',
};

const mockBlockedCompanies: BlockedCompanyDto[] = [
  {
    id: 'block-1',
    companyId: 'comp-blocked-1',
    companyName: 'Previous Employer Inc',
    companySlug: 'previous-employer',
    companyLogoUrl: null,
    companyIndustry: 'Finance & Banking',
    reason: 'Current employer confidentiality',
    blockedAt: '2026-09-10T12:00:00Z',
  },
];

describe('Epic 15 — Applicant: Account, Privacy, Notification Preferences & GDPR Compliance', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
      },
    });
    vi.clearAllMocks();

    // Default mock user
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: {
        id: 'applicant-1',
        email: 'applicant@example.com',
        role: 'APPLICANT',
        status: 'ACTIVE',
        mfaEnabled: false,
      },
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    // Default hooks mocks
    vi.spyOn(PrivacyHooks, 'useNotificationPreferences').mockReturnValue({
      data: mockPreferences,
      isLoading: false,
      isError: false,
    } as any);

    vi.spyOn(PrivacyHooks, 'useBlockedCompanies').mockReturnValue({
      data: mockBlockedCompanies,
      isLoading: false,
      isError: false,
    } as any);
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('FR-AP-28: NotificationPreferencesForm displays categories and triggers channel toggles', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({
      ...mockPreferences,
      jobAlertsEmail: true,
    });
    vi.spyOn(PrivacyHooks, 'useUpdateNotificationPreferences').mockReturnValue({
      mutateAsync,
      isPending: false,
      isError: false,
    } as any);

    renderWithProviders(<NotificationPreferencesForm />);

    expect(screen.getByText('Notification & Communication Preferences')).toBeInTheDocument();
    expect(screen.getByText('Application Status Updates')).toBeInTheDocument();
    expect(screen.getByText('Interview Invitations & Scheduling')).toBeInTheDocument();
    expect(screen.getByText('Recruiter Direct Messages')).toBeInTheDocument();
    expect(screen.getByText('Followed Company Vacancies')).toBeInTheDocument();
    expect(screen.getByText('Smart Job Recommendations & Alerts')).toBeInTheDocument();

    // Find switches
    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBe(10); // 5 categories * 2 channels

    // Click on job alerts email toggle (currently false)
    fireEvent.click(switches[8]); // 5th category, 1st switch (Email)

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        jobAlertsEmail: true,
      });
    });
  });

  it('FR-AP-30: BlockedCompaniesManager displays blocked list and triggers unblock', async () => {
    const unblockMutateAsync = vi.fn().mockResolvedValue({ success: true, companyId: 'comp-blocked-1' });
    vi.spyOn(PrivacyHooks, 'useUnblockCompany').mockReturnValue({
      mutateAsync: unblockMutateAsync,
      isPending: false,
    } as any);

    vi.spyOn(PrivacyHooks, 'useBlockCompany').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderWithProviders(<BlockedCompaniesManager />);

    expect(screen.getByText('Employer Visibility Shield & Blocklist')).toBeInTheDocument();
    expect(screen.getByText('Previous Employer Inc')).toBeInTheDocument();
    expect(screen.getByText('Current employer confidentiality')).toBeInTheDocument();

    // Click Unblock
    const unblockBtn = screen.getByRole('button', { name: /unblock/i });
    fireEvent.click(unblockBtn);

    await waitFor(() => {
      expect(unblockMutateAsync).toHaveBeenCalledWith('comp-blocked-1');
    });
  });

  it('FR-AP-30: BlockedCompaniesManager allows selecting company from autocomplete and blocking', async () => {
    const blockMutateAsync = vi.fn().mockResolvedValue({
      id: 'block-2',
      companyId: 'comp-99',
      companyName: 'New Corp',
      blockedAt: new Date().toISOString(),
    });
    vi.spyOn(PrivacyHooks, 'useBlockCompany').mockReturnValue({
      mutateAsync: blockMutateAsync,
      isPending: false,
    } as any);
    vi.spyOn(PrivacyHooks, 'useUnblockCompany').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.spyOn(companyDiscoveryApi, 'searchCompanies').mockResolvedValue({
      items: [
        {
          id: 'comp-99',
          name: 'Target Block Corp',
          slug: 'target-block',
          industry: 'Defense',
          size: '500+',
          logoUrl: null,
          coverPhotoUrl: null,
          website: null,
          description: null,
          headquarters: 'DC',
          activeJobCount: 0,
          followerCount: 0,
          isFollowedByMe: false,
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 6,
      totalPages: 1,
    });

    renderWithProviders(<BlockedCompaniesManager />);

    const searchInput = screen.getByPlaceholderText(/type company name/i);
    fireEvent.change(searchInput, { target: { value: 'Target' } });

    // Wait for autocomplete to appear
    await waitFor(() => {
      expect(screen.getByText('Target Block Corp')).toBeInTheDocument();
    });

    // Select autocomplete company
    fireEvent.click(screen.getByText('Target Block Corp'));

    // Fill reason
    const reasonInput = screen.getByPlaceholderText(/current employer/i);
    fireEvent.change(reasonInput, { target: { value: 'Non-compete clause' } });

    // Submit block
    const blockBtn = screen.getByRole('button', { name: /block employer/i });
    fireEvent.click(blockBtn);

    await waitFor(() => {
      expect(blockMutateAsync).toHaveBeenCalledWith({
        companyId: 'comp-99',
        reason: 'Non-compete clause',
      });
    });
  });

  it('FR-AP-29: GdprDataExportCard initiates data archive download', async () => {
    const exportMutateAsync = vi.fn().mockResolvedValue({
      exportedAt: new Date().toISOString(),
      user: { id: 'applicant-1' },
    });
    vi.spyOn(PrivacyHooks, 'useExportPersonalData').mockReturnValue({
      mutateAsync: exportMutateAsync,
      isPending: false,
      isError: false,
    } as any);

    renderWithProviders(<GdprDataExportCard />);

    expect(
      screen.getByText('Personal Data Portability & Archive (GDPR Art. 20)')
    ).toBeInTheDocument();
    expect(screen.getByText(/Applicant Profile & Contact Details/i)).toBeInTheDocument();

    const downloadBtn = screen.getByRole('button', { name: /download personal data/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(exportMutateAsync).toHaveBeenCalled();
    });
  });

  it('FR-AP-29, UC-14: AccountDeletionModal requires password and acknowledgment before requesting erasure', async () => {
    const erasureMutateAsync = vi.fn().mockResolvedValue({
      requestId: 'req-gdpr-12345',
      status: 'SUBMITTED',
      slaDeadline: '2026-10-14T00:00:00Z',
      message: 'Your account erasure request has been registered.',
    });
    vi.spyOn(PrivacyHooks, 'useRequestAccountErasure').mockReturnValue({
      mutateAsync: erasureMutateAsync,
      isPending: false,
    } as any);

    const handleClose = vi.fn();

    renderWithProviders(<AccountDeletionModal isOpen={true} onClose={handleClose} />);

    expect(screen.getByText('Right to Erasure (Account Deletion)')).toBeInTheDocument();
    expect(screen.getByText(/Permanent & Irreversible/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /request account erasure/i });
    expect(submitBtn).toBeDisabled();

    // Fill password and check acknowledgment
    const passwordInput = screen.getByPlaceholderText(/enter your account password/i);
    fireEvent.change(passwordInput, { target: { value: 'MySecretPass123!' } });

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(submitBtn).not.toBeDisabled();

    // Submit erasure request
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(erasureMutateAsync).toHaveBeenCalledWith({
        password: 'MySecretPass123!',
        reason: undefined,
        confirmAcknowledgment: true,
      });
    });

    // Verification of confirmation view
    await waitFor(() => {
      expect(screen.getByText('Erasure Request Registered')).toBeInTheDocument();
      expect(screen.getByText('req-gdpr-12345')).toBeInTheDocument();
      expect(screen.getByText('SUBMITTED')).toBeInTheDocument();
    });
  });

  it('ApplicantSettingsPage switches tabs between notifications, blocked employers, and GDPR', () => {
    renderWithProviders(<ApplicantSettingsPage />);

    expect(screen.getByText('Account, Privacy & Settings')).toBeInTheDocument();
    // Default tab is notifications
    expect(screen.getByText('Notification & Communication Preferences')).toBeInTheDocument();

    // Switch to Blocked Employers
    const blockedTabBtn = screen.getByRole('button', { name: /blocked employers/i });
    fireEvent.click(blockedTabBtn);
    expect(screen.getByText('Employer Visibility Shield & Blocklist')).toBeInTheDocument();

    // Switch to Data Portability & GDPR
    const gdprTabBtn = screen.getByRole('button', { name: /data portability & gdpr/i });
    fireEvent.click(gdprTabBtn);
    expect(
      screen.getByText('Personal Data Portability & Archive (GDPR Art. 20)')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Danger Zone: Right to Erasure (Account Deletion)')
    ).toBeInTheDocument();
  });
});
