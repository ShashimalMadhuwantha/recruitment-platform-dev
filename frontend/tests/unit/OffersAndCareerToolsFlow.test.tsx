import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OfferGeneratorModal } from '../../src/features/offers/components/OfferGeneratorModal';
import { OfferReviewModal } from '../../src/features/offers/components/OfferReviewModal';
import { MarkHiredModal } from '../../src/features/offers/components/MarkHiredModal';
import { CvHealthCheckModal } from '../../src/features/career-tools/components/CvHealthCheckModal';
import { ProfileImprovementDrawer } from '../../src/features/career-tools/components/ProfileImprovementDrawer';
import { ApplicationScoreBreakdownModal } from '../../src/features/career-tools/components/ApplicationScoreBreakdownModal';
import * as OfferHooksModule from '../../src/features/offers/hooks';
import * as CareerHooksModule from '../../src/features/career-tools/hooks';
import type { JobOfferDto } from '../../src/features/offers/types';
import type {
  CvHealthCheckResultDto,
  ProfileImprovementResponseDto,
} from '../../src/features/career-tools/types';

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

describe('Epic 13: Offers, Hiring & Applicant Career Tools (FR-RC-24, FR-RC-25, FR-AP-22 to FR-AP-24)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Recruiter Offer Generator & Markdown Preview (FR-RC-24)', () => {
    it('renders compensation inputs and switches to offer letter preview tab', () => {
      vi.spyOn(OfferHooksModule, 'useCreateOrUpdateOffer').mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      vi.spyOn(OfferHooksModule, 'useSendOffer').mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      renderWithProviders(
        <OfferGeneratorModal
          isOpen={true}
          onClose={vi.fn()}
          applicationId="app-101"
          candidateName="Jordan Belfort"
          candidateEmail="jordan@example.com"
          jobTitle="Senior Software Engineer"
          companyName="Acme Tech"
        />
      );

      // Verify modal headers and fields
      expect(screen.getByText('Generate Formal Job Offer')).toBeInTheDocument();
      expect(screen.getByText('Base Salary (Annual) *')).toBeInTheDocument();
      expect(screen.getByText('Compensation Package')).toBeInTheDocument();

      // Switch to Markdown Preview tab
      const previewTab = screen.getByText(/Offer Letter Preview/i);
      fireEvent.click(previewTab);

      expect(screen.getByText(/Reset to Template/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/Formal Employment Offer/i)).toBeInTheDocument();
    });

    it('submits offer creation payload on Send Official Offer', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        id: 'offer-1',
        applicationId: 'app-101',
        status: 'SENT',
        baseSalary: 140000,
      });

      vi.spyOn(OfferHooksModule, 'useCreateOrUpdateOffer').mockReturnValue({
        mutateAsync: mockCreate,
        isPending: false,
      } as any);

      vi.spyOn(OfferHooksModule, 'useSendOffer').mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      const handleClose = vi.fn();

      renderWithProviders(
        <OfferGeneratorModal
          isOpen={true}
          onClose={handleClose}
          applicationId="app-101"
          candidateName="Jordan Belfort"
          candidateEmail="jordan@example.com"
          jobTitle="Senior Software Engineer"
          companyName="Acme Tech"
        />
      );

      const sendButton = screen.getByRole('button', { name: /Send Official Offer/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalled();
      });
    });
  });

  describe('2. Applicant Offer Review & Formal Acceptance (FR-RC-24)', () => {
    const mockOffer: JobOfferDto = {
      id: 'offer-99',
      applicationId: 'app-101',
      jobId: 'job-5',
      jobTitle: 'Principal Distributed Systems Engineer',
      companyId: 'comp-1',
      companyName: 'CloudScale Inc',
      candidateId: 'cand-1',
      candidateName: 'Alex Mercer',
      candidateEmail: 'alex@example.com',
      createdById: 'rec-1',
      baseSalary: 165000,
      currency: 'USD',
      bonus: 20000,
      equity: '15,000 ISO Options (4-year vesting)',
      startDate: new Date('2026-10-15').toISOString(),
      expirationDate: new Date('2026-11-01').toISOString(),
      offerLetterText: '# Formal Offer\nWelcome to CloudScale Inc!',
      benefitsSummary: 'Comprehensive healthcare and unlimited PTO.',
      status: 'SENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('displays compensation breakdown and opens signature input for formal acceptance', async () => {
      const mockRespond = vi.fn().mockResolvedValue({ ...mockOffer, status: 'ACCEPTED' });
      vi.spyOn(OfferHooksModule, 'useRespondOffer').mockReturnValue({
        mutateAsync: mockRespond,
        isPending: false,
      } as any);

      renderWithProviders(
        <OfferReviewModal
          isOpen={true}
          onClose={vi.fn()}
          offer={mockOffer}
          candidateName="Alex Mercer"
        />
      );

      // Check salary and bonus display
      expect(screen.getByText('$165,000')).toBeInTheDocument();
      expect(screen.getByText('$20,000')).toBeInTheDocument();
      expect(screen.getByText(/15,000 ISO Options/i)).toBeInTheDocument();
      expect(screen.getByText('Comprehensive healthcare and unlimited PTO.')).toBeInTheDocument();

      // Click Accept Offer button
      const acceptBtn = screen.getByRole('button', { name: /Accept Offer/i });
      fireEvent.click(acceptBtn);

      expect(screen.getByText(/Confirm Formal Offer Acceptance/i)).toBeInTheDocument();
      const submitSignatureBtn = screen.getByRole('button', { name: /Sign & Formally Accept/i });
      fireEvent.click(submitSignatureBtn);

      await waitFor(() => {
        expect(mockRespond).toHaveBeenCalledWith({
          offerId: 'offer-99',
          data: {
            action: 'ACCEPT',
            signedName: 'Alex Mercer',
          },
        });
      });
    });
  });

  describe('3. Recruiter Mark as Hired & Close Requisition (FR-RC-25)', () => {
    it('renders candidate information and submits hiring action with requisition close', async () => {
      const mockHire = vi.fn().mockResolvedValue({
        success: true,
        message: 'Hired successfully',
        requisitionClosed: true,
      });

      vi.spyOn(OfferHooksModule, 'useHireCandidate').mockReturnValue({
        mutateAsync: mockHire,
        isPending: false,
      } as any);

      const handleHired = vi.fn();

      renderWithProviders(
        <MarkHiredModal
          isOpen={true}
          onClose={vi.fn()}
          applicationId="app-101"
          candidateName="Jordan Belfort"
          jobTitle="Senior Software Engineer"
          onHired={handleHired}
        />
      );

      expect(screen.getByText('Mark as Hired')).toBeInTheDocument();
      expect(screen.getByText('Close job requisition (Mark as FILLED)')).toBeInTheDocument();

      const confirmBtn = screen.getByRole('button', { name: /Confirm Hire/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockHire).toHaveBeenCalledWith({
          applicationId: 'app-101',
          data: expect.objectContaining({
            closeRequisition: true,
          }),
        });
      });
    });
  });

  describe('4. Applicant CV Health Diagnostic (FR-AP-24)', () => {
    const mockHealthCheck: CvHealthCheckResultDto = {
      healthScore: 86,
      grade: 'EXCELLENT',
      wordCount: 480,
      actionVerbCount: 18,
      quantifiableMetricsCount: 7,
      bulletPointsCount: 14,
      sectionChecks: {
        contactInfo: true,
        summary: true,
        experience: true,
        education: true,
        skills: true,
      },
      topKeywords: [
        { word: 'react', count: 8, densityPercent: 3.2 },
        { word: 'typescript', count: 6, densityPercent: 2.5 },
      ],
      issues: [
        {
          id: 'metric-check',
          category: 'IMPACT_METRICS',
          severity: 'PASSED',
          title: 'Strong Quantifiable Achievements',
          description: 'Found 7 quantifiable metrics.',
          recommendation: 'Maintain continuous data-backed results.',
        },
        {
          id: 'word-count',
          category: 'CONTENT_QUALITY',
          severity: 'SUGGESTION',
          title: 'Word Count Optimization',
          description: 'Profile contains 480 words.',
          recommendation: 'Target between 400 and 800 words for optimal density.',
        },
      ],
      passedChecksCount: 5,
      criticalIssuesCount: 0,
      warningsCount: 0,
      analyzedAt: new Date().toISOString(),
    };

    it('renders overall health score, grade, metric stats, and diagnostic findings', () => {
      vi.spyOn(CareerHooksModule, 'useCvHealthCheck').mockReturnValue({
        data: mockHealthCheck,
        isLoading: false,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      renderWithProviders(
        <CvHealthCheckModal isOpen={true} onClose={vi.fn()} />
      );

      expect(screen.getByText('86')).toBeInTheDocument();
      expect(screen.getByText('Grade: EXCELLENT')).toBeInTheDocument();
      expect(screen.getByText('480')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument();
      expect(screen.getByText('Strong Quantifiable Achievements')).toBeInTheDocument();
    });
  });

  describe('5. Applicant Career Insights & Skill Gap Drawer (FR-AP-23)', () => {
    const mockImprovement: ProfileImprovementResponseDto = {
      overallReadinessScore: 78,
      targetJobsAnalyzedCount: 12,
      topMissingSkills: [
        { name: 'Docker', frequency: 9, priority: 'HIGH' },
        { name: 'Kubernetes', frequency: 7, priority: 'HIGH' },
        { name: 'GraphQL', frequency: 4, priority: 'MEDIUM' },
      ],
      suggestions: [
        {
          id: 'sug-1',
          category: 'SKILL_GAP',
          priority: 'HIGH',
          title: 'Add Containerization to Profile',
          description: '75% of your target roles require Docker knowledge.',
          actionLabel: 'Add Docker to Skills',
          actionType: 'ADD_SKILL',
        },
      ],
      generatedAt: new Date().toISOString(),
    };

    it('renders market competitiveness score, missing demanded skills, and action advice', () => {
      vi.spyOn(CareerHooksModule, 'useProfileImprovement').mockReturnValue({
        data: mockImprovement,
        isLoading: false,
      } as any);

      renderWithProviders(
        <ProfileImprovementDrawer isOpen={true} onClose={vi.fn()} />
      );

      expect(screen.getByText('78%')).toBeInTheDocument();
      expect(screen.getByText('Docker')).toBeInTheDocument();
      expect(screen.getByText(/75% of target jobs/i)).toBeInTheDocument();
      expect(screen.getByText('Add Containerization to Profile')).toBeInTheDocument();
      expect(screen.getByText('Add Docker to Skills')).toBeInTheDocument();
    });
  });

  describe('6. Applicant Post-Apply Score Feedback Modal (FR-AP-22)', () => {
    it('renders ATS match score and component score breakdown', () => {
      const mockApplication: any = {
        id: 'app-1',
        jobId: 'job-1',
        jobTitle: 'Senior Cloud Engineer',
        companyName: 'CloudScale Inc',
        status: 'INTERVIEW',
        overallScore: 84,
        appliedAt: new Date().toISOString(),
        canWithdraw: true,
      };

      renderWithProviders(
        <ApplicationScoreBreakdownModal
          isOpen={true}
          onClose={vi.fn()}
          application={mockApplication}
        />
      );

      expect(screen.getByText('84% ATS Match')).toBeInTheDocument();
      expect(screen.getByText('Skills Match')).toBeInTheDocument();
      expect(screen.getByText('Experience Match')).toBeInTheDocument();
      expect(screen.getByText('Education Match')).toBeInTheDocument();
      expect(screen.getByText('Matched Competencies')).toBeInTheDocument();
      expect(screen.getByText('Identified Skill Gaps')).toBeInTheDocument();
    });
  });
});
