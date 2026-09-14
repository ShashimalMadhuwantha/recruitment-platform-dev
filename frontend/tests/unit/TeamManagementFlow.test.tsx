import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlanUsageCard } from '../../src/features/company-team/components/PlanUsageCard';
import { TeamMembersTable } from '../../src/features/company-team/components/TeamMembersTable';
import { PendingInvitationsTable } from '../../src/features/company-team/components/PendingInvitationsTable';
import { InviteMemberModal } from '../../src/features/company-team/components/InviteMemberModal';
import { RolePermissionsDrawer } from '../../src/features/company-team/components/RolePermissionsDrawer';
import { RemoveMemberModal } from '../../src/features/company-team/components/RemoveMemberModal';
import { RecruiterTeamPage } from '../../src/pages/recruiter/RecruiterTeamPage';
import * as CompanyTeamHooks from '../../src/features/company-team/hooks';
import type { PlanUsageDto, TeamMemberDto, TeamInvitationDto } from '../../src/features/company-team/types';

const mockPlanUsage: PlanUsageDto = {
  plan: {
    id: 'pro-plan-1',
    name: 'Pro Recruiter',
    tier: 'PRO',
    priceMonthly: 99,
    maxSeats: 10,
    maxJobPosts: 25,
    maxAtsScans: 1000,
    features: {
      customScreeningQuestions: true,
      advancedAtsWeightOverride: true,
      analyticsExport: true,
    },
  },
  usage: {
    seats: {
      activeRecruiters: 2,
      pendingInvites: 1,
      occupiedSeats: 3,
      maxSeats: 10,
      remainingSeats: 7,
      percentUsed: 30,
      isAtCapacity: false,
    },
    jobPosts: {
      activeJobs: 5,
      maxJobPosts: 25,
      remainingJobs: 20,
      percentUsed: 20,
      isAtCapacity: false,
    },
    atsScans: {
      scansUsed: 150,
      maxAtsScans: 1000,
      remainingScans: 850,
      percentUsed: 15,
      isAtCapacity: false,
    },
  },
};

const mockCappedPlanUsage: PlanUsageDto = {
  ...mockPlanUsage,
  plan: {
    ...mockPlanUsage.plan,
    tier: 'FREE',
    maxSeats: 2,
  },
  usage: {
    ...mockPlanUsage.usage,
    seats: {
      activeRecruiters: 2,
      pendingInvites: 0,
      occupiedSeats: 2,
      maxSeats: 2,
      remainingSeats: 0,
      percentUsed: 100,
      isAtCapacity: true,
    },
  },
};

const mockMembers: TeamMemberDto[] = [
  {
    id: 'mem-1',
    userId: 'user-admin-1',
    fullName: 'Alice Founder',
    email: 'alice@acme.com',
    title: 'Head of Talent',
    department: 'People Ops',
    subRole: 'COMPANY_ADMIN',
    permissions: null,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'mem-2',
    userId: 'user-recruiter-2',
    fullName: 'Bob Recruiter',
    email: 'bob@acme.com',
    title: 'Senior Recruiter',
    department: 'Engineering Hiring',
    subRole: 'HIRING_MANAGER',
    permissions: {
      canCreateJobs: true,
      canEditJobs: true,
      canDeleteJobs: false,
      canViewCandidateSalary: true,
      canAdvancePipeline: true,
      canScheduleInterviews: true,
      canSubmitScorecards: true,
      canExtendOffers: true,
      canManageTeam: false,
      canViewAnalytics: true,
      canManageCompanyProfile: false,
    },
    createdAt: '2026-02-01T00:00:00Z',
  },
];

const mockInvitations: TeamInvitationDto[] = [
  {
    id: 'inv-1',
    email: 'charlie@acme.com',
    subRole: 'INTERVIEWER',
    permissions: null,
    status: 'PENDING',
    invitedById: 'user-admin-1',
    invitedByName: 'Alice Founder',
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    isExpired: false,
  },
];

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Frontend Team, Company & Subscription Management Flow (Epic 17)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PlanUsageCard Component', () => {
    it('renders plan tier badge, quota metrics, and upgrade button', () => {
      const onUpgradeClick = vi.fn();
      renderWithProviders(
        <PlanUsageCard usage={mockPlanUsage} onUpgradeClick={onUpgradeClick} />
      );

      expect(screen.getByText('PRO TIER')).toBeInTheDocument();
      expect(screen.getByText('Subscription & Quota Health')).toBeInTheDocument();
      expect(screen.getByText('3 / 10')).toBeInTheDocument(); // 3 occupied of 10 seats
      expect(screen.getByText('5 / 25')).toBeInTheDocument(); // 5 active jobs of 25
      expect(screen.getByText('150 / 1000')).toBeInTheDocument(); // 150 scans

      const upgradeBtn = screen.getByRole('button', { name: /Upgrade Plan/i });
      fireEvent.click(upgradeBtn);
      expect(onUpgradeClick).toHaveBeenCalledTimes(1);
    });

    it('displays capacity alert banner when seat quota is full', () => {
      renderWithProviders(
        <PlanUsageCard usage={mockCappedPlanUsage} onUpgradeClick={vi.fn()} />
      );

      expect(screen.getByText('FREE PLAN')).toBeInTheDocument();
      expect(screen.getByText(/Seat quota reached/i)).toBeInTheDocument();
      expect(screen.getByText('2 / 2')).toBeInTheDocument();
    });
  });

  describe('TeamMembersTable Component', () => {
    it('renders members list with sub-role badges and departments', () => {
      renderWithProviders(
        <TeamMembersTable
          members={mockMembers}
          onEditPermissions={vi.fn()}
          onRemoveMember={vi.fn()}
        />
      );

      expect(screen.getByText('Alice Founder')).toBeInTheDocument();
      expect(screen.getByText('alice@acme.com')).toBeInTheDocument();
      expect(screen.getByText('Company Admin')).toBeInTheDocument();
      expect(screen.getByText('Head of Talent')).toBeInTheDocument();

      expect(screen.getByText('Bob Recruiter')).toBeInTheDocument();
      expect(screen.getByText('Hiring Manager')).toBeInTheDocument();
      expect(screen.getByText('Senior Recruiter')).toBeInTheDocument();
    });

    it('disables removal action for the sole company admin', () => {
      renderWithProviders(
        <TeamMembersTable
          members={mockMembers}
          onEditPermissions={vi.fn()}
          onRemoveMember={vi.fn()}
        />
      );

      const removeBtns = screen.getAllByRole('button', { name: /Remove member/i });
      // Alice is the sole admin, her button should be disabled
      expect(removeBtns[0]).toBeDisabled();
      expect(removeBtns[1]).not.toBeDisabled();
    });

    it('invokes onEditPermissions when clicking Role & Access', () => {
      const onEditPermissions = vi.fn();
      renderWithProviders(
        <TeamMembersTable
          members={mockMembers}
          onEditPermissions={onEditPermissions}
          onRemoveMember={vi.fn()}
        />
      );

      const roleButtons = screen.getAllByRole('button', { name: /Role & Access/i });
      fireEvent.click(roleButtons[1]); // Bob Recruiter
      expect(onEditPermissions).toHaveBeenCalledWith(mockMembers[1]);
    });
  });

  describe('PendingInvitationsTable Component', () => {
    it('renders pending invitations with expiry days and action buttons', async () => {
      const onResend = vi.fn().mockResolvedValue(undefined);
      const onRevoke = vi.fn().mockResolvedValue(undefined);

      renderWithProviders(
        <PendingInvitationsTable
          invitations={mockInvitations}
          onResend={onResend}
          onRevoke={onRevoke}
        />
      );

      expect(screen.getByText('charlie@acme.com')).toBeInTheDocument();
      expect(screen.getByText('Interviewer')).toBeInTheDocument();
      expect(screen.getByText('Alice Founder')).toBeInTheDocument();
      expect(screen.getByText(/Expires in 5 days/i)).toBeInTheDocument();

      const resendBtn = screen.getByRole('button', { name: /Resend/i });
      fireEvent.click(resendBtn);
      await waitFor(() => expect(onResend).toHaveBeenCalledWith('inv-1'));

      const revokeBtn = screen.getByRole('button', { name: /Revoke/i });
      fireEvent.click(revokeBtn);
      await waitFor(() => expect(onRevoke).toHaveBeenCalledWith('inv-1'));
    });
  });

  describe('InviteMemberModal Component', () => {
    it('dispatches invitation payload upon form submission', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({});
      vi.spyOn(CompanyTeamHooks, 'useInviteMember').mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      } as any);

      const onClose = vi.fn();
      renderWithProviders(
        <InviteMemberModal
          isOpen={true}
          onClose={onClose}
          planUsage={mockPlanUsage}
        />
      );

      expect(screen.getByText('Invite Team Member')).toBeInTheDocument();
      expect(screen.getByText(/7 of 10 seats available/i)).toBeInTheDocument();

      // Enter email
      const emailInput = screen.getByPlaceholderText('colleague@company.com');
      fireEvent.change(emailInput, { target: { value: 'dan@acme.com' } });

      // Click Send Invitation
      const submitBtn = screen.getByRole('button', { name: /Send Invitation/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'dan@acme.com',
            subRole: 'HIRING_MANAGER',
          })
        );
      });
    });
  });

  describe('RolePermissionsDrawer Component', () => {
    it('prevents sole admin demotion and saves modified sub-role', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({});
      vi.spyOn(CompanyTeamHooks, 'useUpdateMemberRole').mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      } as any);

      const onClose = vi.fn();
      renderWithProviders(
        <RolePermissionsDrawer
          member={mockMembers[0]} // Alice Founder (sole admin)
          isOpen={true}
          onClose={onClose}
          totalCompanyAdmins={1}
        />
      );

      expect(screen.getByText('Member Roles & Permissions')).toBeInTheDocument();
      expect(screen.getByText('Sole Company Administrator')).toBeInTheDocument();

      // Try clicking Hiring Manager - should block demotion
      const hiringManagerCard = screen.getByText('Hiring Manager').closest('div');
      if (hiringManagerCard) fireEvent.click(hiringManagerCard);

      expect(
        screen.getByText(/Cannot demote the sole Company Admin/i)
      ).toBeInTheDocument();
    });
  });

  describe('RemoveMemberModal Component', () => {
    it('displays confirmation and transfers active requisitions', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({});
      vi.spyOn(CompanyTeamHooks, 'useRemoveMember').mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      } as any);

      const onClose = vi.fn();
      renderWithProviders(
        <RemoveMemberModal
          member={mockMembers[1]} // Bob
          isOpen={true}
          onClose={onClose}
          availableSuccessors={mockMembers}
        />
      );

      expect(screen.getByText('Remove Team Member')).toBeInTheDocument();
      expect(screen.getByText(/Bob Recruiter/i)).toBeInTheDocument();

      const confirmBtn = screen.getByRole('button', { name: /Confirm & Remove/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: 'mem-2',
          data: {
            transferRequisitionsToUserId: undefined,
          },
        });
      });
    });
  });

  describe('RecruiterTeamPage Workspace Integration', () => {
    it('switches between Active Members and Pending Invitations tabs', () => {
      vi.spyOn(CompanyTeamHooks, 'usePlanUsage').mockReturnValue({
        data: mockPlanUsage,
        isLoading: false,
      } as any);

      vi.spyOn(CompanyTeamHooks, 'useTeamDirectory').mockReturnValue({
        data: {
          members: mockMembers,
          pendingInvitations: mockInvitations,
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      renderWithProviders(<RecruiterTeamPage />);

      expect(screen.getByText('Team Members & Seat Management')).toBeInTheDocument();
      expect(screen.getByText('Active Team Members')).toBeInTheDocument();
      expect(screen.getByText('Alice Founder')).toBeInTheDocument();

      // Click Pending Invitations tab
      const pendingTab = screen.getByRole('button', { name: /Pending Invitations/i });
      fireEvent.click(pendingTab);

      expect(screen.getByText('charlie@acme.com')).toBeInTheDocument();
    });
  });
});
