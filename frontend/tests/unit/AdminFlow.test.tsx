import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminOverviewPage } from '../../src/pages/admin/AdminOverviewPage';
import { AdminCompaniesPage } from '../../src/pages/admin/AdminCompaniesPage';
import { AdminUsersPage } from '../../src/pages/admin/AdminUsersPage';
import { AdminPlansPage } from '../../src/pages/admin/AdminPlansPage';
import { ImpersonationBanner } from '../../src/components/shared/ImpersonationBanner';
import * as ProvidersModule from '../../src/app/providers';
import * as AdminHooksModule from '../../src/features/admin/hooks';

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

describe('Frontend Super Admin Flow & Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AdminOverviewPage', () => {
    it('renders platform stats and pending approval alerts', () => {
      vi.spyOn(AdminHooksModule, 'useAdminStats').mockReturnValue({
        data: {
          totalUsers: 142,
          totalApplicants: 110,
          totalRecruiters: 30,
          totalSuperAdmins: 2,
          activeCompaniesCount: 24,
          pendingCompaniesCount: 4,
          totalJobsCount: 86,
          totalApplicationsCount: 620,
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<AdminOverviewPage />);

      expect(screen.getByText('Super Admin Governance')).toBeInTheDocument();
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('142')).toBeInTheDocument();
      expect(screen.getByText('Active Companies')).toBeInTheDocument();
      expect(screen.getByText('24')).toBeInTheDocument();
      expect(screen.getByText(/4 Company Registrations Pending Review/i)).toBeInTheDocument();
    });
  });

  describe('AdminCompaniesPage', () => {
    it('renders company filter tabs and table data', () => {
      vi.spyOn(AdminHooksModule, 'useAdminCompanies').mockReturnValue({
        data: {
          items: [
            {
              id: 'comp-1',
              name: 'Acme Corp',
              slug: 'acme-corp',
              domain: 'acme.com',
              status: 'PENDING_APPROVAL',
              createdAt: '2026-03-01T00:00:00Z',
              updatedAt: '2026-03-01T00:00:00Z',
              plan: { id: 'plan-1', tier: 'FREE', name: 'Free Starter' },
              _count: { recruiters: 2, jobVacancies: 0 },
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

      renderWithProviders(<AdminCompaniesPage />);

      expect(screen.getByText('Company & Tenant Management')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Search by company, industry/i)).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getAllByText('Pending Approval').length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: /^Approve$/i })).toBeInTheDocument();
    });
  });

  describe('AdminUsersPage', () => {
    it('renders users list and impersonation trigger', () => {
      vi.spyOn(AdminHooksModule, 'useAdminUsers').mockReturnValue({
        data: {
          items: [
            {
              id: 'user-recruiter-1',
              email: 'recruiter@acme.com',
              role: 'RECRUITER',
              status: 'ACTIVE',
              mfaEnabled: false,
              createdAt: '2026-03-01T00:00:00Z',
              recruiterProfile: {
                id: 'rec-1',
                subRole: 'ADMIN',
                company: { id: 'comp-1', name: 'Acme Corp', status: 'ACTIVE' },
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

      renderWithProviders(<AdminUsersPage />);

      expect(screen.getByText('Global User Directory')).toBeInTheDocument();
      expect(screen.getByText('recruiter@acme.com')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Impersonate/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Suspend/i })).toBeInTheDocument();
    });
  });

  describe('AdminPlansPage', () => {
    it('renders subscription tiers and resource quotas', () => {
      vi.spyOn(AdminHooksModule, 'useSubscriptionPlans').mockReturnValue({
        data: [
          {
            id: 'plan-1',
            tier: 'FREE',
            name: 'Free Starter',
            description: 'Basic plan',
            priceMonthly: 0,
            maxJobPostings: 3,
            maxTeamSeats: 2,
            maxAtsScansMonthly: 50,
          },
          {
            id: 'plan-2',
            tier: 'PRO',
            name: 'Pro Recruiter',
            description: 'For growing teams',
            priceMonthly: 99,
            maxJobPostings: 25,
            maxTeamSeats: 10,
            maxAtsScansMonthly: 500,
          },
        ],
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<AdminPlansPage />);

      expect(screen.getByText('Subscription Plans & Resource Quotas')).toBeInTheDocument();
      expect(screen.getByText('Free Starter')).toBeInTheDocument();
      expect(screen.getByText('Pro Recruiter')).toBeInTheDocument();
      expect(screen.getByText('$99')).toBeInTheDocument();
    });
  });

  describe('ImpersonationBanner', () => {
    it('renders top warning banner when user is impersonating', () => {
      const mockLogin = vi.fn();
      vi.spyOn(ProvidersModule, 'useAuth').mockReturnValue({
        user: {
          id: 'user-recruiter-1',
          email: 'recruiter@acme.com',
          role: 'RECRUITER',
          status: 'ACTIVE',
          mfaEnabled: false,
          isImpersonating: true,
          impersonatorId: 'admin-super-1',
        },
        accessToken: 'impersonated-token',
        refreshToken: 'impersonated-token',
        isAuthenticated: true,
        isLoading: false,
        login: mockLogin,
        logout: vi.fn(),
        updateUser: vi.fn(),
      });

      renderWithProviders(<ImpersonationBanner />);

      expect(screen.getByText(/Admin Impersonation Mode:/i)).toBeInTheDocument();
      expect(screen.getByText('recruiter@acme.com')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Exit Impersonation/i })).toBeInTheDocument();
    });
  });
});
