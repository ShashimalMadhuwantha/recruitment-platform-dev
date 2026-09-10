import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ScoreBreakdown } from '../../src/components/shared/ScoreBreakdown';
import { PreApplyMatchPreviewDrawer } from '../../src/features/ats-scoring/components/PreApplyMatchPreviewDrawer';
import { CandidateScoreAnalysisModal } from '../../src/features/ats-scoring/components/CandidateScoreAnalysisModal';
import * as AtsHooksModule from '../../src/features/ats-scoring/hooks';
import type {
  PreApplyMatchPreviewDto,
  AtsScoreDetailDto,
  AtsScoreBreakdown,
} from '@recruitment-platform/shared';

const mockBreakdown: AtsScoreBreakdown = {
  overallScore: 84,
  scoreBand: 'HIGH',
  bandLabel: 'Strong match',
  computedAt: '2026-09-10T12:00:00.000Z',
  skillsMatch: {
    score: 90,
    weight: 40,
    weightedScore: 36,
    matchedItems: ['React', 'TypeScript', 'Node.js'],
    missingItems: ['GraphQL'],
  },
  experienceMatch: {
    score: 80,
    weight: 25,
    weightedScore: 20,
    details: {
      applicantExperienceYears: 5,
      requiredExperienceYears: 4,
    },
  },
  educationMatch: {
    score: 85,
    weight: 15,
    weightedScore: 12.75,
    details: {
      applicantEducationLevel: 'Master of Science',
      requiredEducationLevel: 'Bachelor',
    },
  },
  semanticMatch: {
    score: 78,
    weight: 15,
    weightedScore: 11.7,
  },
  certificationMatch: {
    score: 70,
    weight: 5,
    weightedScore: 3.5,
    matchedItems: ['AWS Certified Solutions Architect'],
  },
  topMatchingTerms: ['react', 'typescript', 'architecture', 'api', 'docker'],
};

const mockPreviewData: PreApplyMatchPreviewDto = {
  jobId: 'job-101',
  jobTitle: 'Senior Full Stack Engineer',
  companyName: 'Tech Innovators Inc.',
  overallScore: 84,
  scoreBand: 'HIGH',
  bandLabel: 'Strong match',
  breakdown: mockBreakdown,
  missingCriticalSkills: ['GraphQL'],
  missingNiceToHaveSkills: [],
  experienceGap: 0,
  educationMet: true,
  recommendations: [
    'Your profile matches 3 out of 4 required core skills. Highlight experience with GraphQL to improve your score.',
    'Add relevant keywords such as: architecture, docker to your CV.',
  ],
};

const mockScoreDetailData: AtsScoreDetailDto = {
  id: 'score-rec-1',
  applicationId: 'app-999',
  overallScore: 84,
  scoreBand: 'HIGH',
  skillsScore: 90,
  experienceScore: 80,
  educationScore: 85,
  semanticTfidfScore: 78,
  certificationScore: 70,
  breakdown: mockBreakdown,
  topMatchingTerms: ['react', 'typescript', 'architecture', 'api', 'docker'],
  manualOverrideScore: null,
  overrideReason: null,
  computedAt: '2026-09-10T12:00:00.000Z',
  applicant: {
    id: 'applicant-user-1',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
  },
  job: {
    id: 'job-101',
    title: 'Senior Full Stack Engineer',
    companyName: 'Tech Innovators Inc.',
  },
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

describe('ATS Scoring Flow Unit Tests (Epic 7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ScoreBreakdown Component', () => {
    it('renders algorithmic breakdown across 5 sub-score dimensions with weights', () => {
      render(<ScoreBreakdown breakdown={mockBreakdown} />);

      expect(screen.getByText('ATS Score Breakdown')).toBeInTheDocument();
      expect(screen.getByText('84%')).toBeInTheDocument();

      // Check sub-scores
      expect(screen.getByText(/Skills Match/i)).toBeInTheDocument();
      expect(screen.getByText('(40% weight)')).toBeInTheDocument();
      expect(screen.getByText(/Experience Match/i)).toBeInTheDocument();
      expect(screen.getByText('(25% weight)')).toBeInTheDocument();
      expect(screen.getByText(/Education Match/i)).toBeInTheDocument();
      expect(screen.getAllByText('(15% weight)')).toHaveLength(2);
      expect(screen.getByText(/Semantic Similarity/i)).toBeInTheDocument();
      expect(screen.getByText(/Certifications/i)).toBeInTheDocument();
      expect(screen.getByText('(5% weight)')).toBeInTheDocument();

      // Check top matching terms
      expect(screen.getByText('architecture')).toBeInTheDocument();
      expect(screen.getByText('docker')).toBeInTheDocument();
    });

    it('renders manual override banner when manual override is provided', () => {
      render(
        <ScoreBreakdown
          breakdown={mockBreakdown}
          manualOverrideScore={92}
          overrideReason="Exceptional portfolio work and stellar architecture screen"
        />
      );

      expect(screen.getByText('⚡ Manual Override Active')).toBeInTheDocument();
      expect(screen.getByText('Calibrated Score: 92%')).toBeInTheDocument();
      expect(
        screen.getByText('Exceptional portfolio work and stellar architecture screen')
      ).toBeInTheDocument();
      // Overall effective badge should reflect calibrated score 92%
      expect(screen.getByText('92%')).toBeInTheDocument();
    });
  });

  describe('PreApplyMatchPreviewDrawer Component', () => {
    it('returns null when isOpen is false', () => {
      const queryClient = createTestQueryClient();
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <PreApplyMatchPreviewDrawer
            jobId="job-101"
            isOpen={false}
            onClose={vi.fn()}
          />
        </QueryClientProvider>
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders drawer with predicted score, missing skills warnings, and recommendations', () => {
      const queryClient = createTestQueryClient();

      vi.spyOn(AtsHooksModule, 'usePreApplyMatchPreview').mockReturnValue({
        data: mockPreviewData,
        isLoading: false,
        error: null,
      } as any);

      const handleClose = vi.fn();
      const handleProceed = vi.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <PreApplyMatchPreviewDrawer
            jobId="job-101"
            isOpen={true}
            onClose={handleClose}
            onProceedToApply={handleProceed}
          />
        </QueryClientProvider>
      );

      // Header info
      expect(screen.getByText('Match Preview')).toBeInTheDocument();
      expect(screen.getByText(/Senior Full Stack Engineer/i)).toBeInTheDocument();
      expect(screen.getByText(/Tech Innovators Inc\./i)).toBeInTheDocument();

      // Match score
      expect(screen.getByText('Predicted Match')).toBeInTheDocument();
      expect(screen.getAllByText('84%').length).toBeGreaterThan(0);

      // Recommendations
      expect(screen.getByText('💡 Match Improvement Suggestions')).toBeInTheDocument();
      expect(
        screen.getByText(/Highlight experience with GraphQL/i)
      ).toBeInTheDocument();

      // Missing critical skill
      expect(screen.getByText('Missing Must-Have Skills (1)')).toBeInTheDocument();
      expect(screen.getByText('⚠️ GraphQL')).toBeInTheDocument();

      // Matched skills
      expect(screen.getByText('Matched Skills (3)')).toBeInTheDocument();
      expect(screen.getByText('✓ React')).toBeInTheDocument();
      expect(screen.getByText('✓ TypeScript')).toBeInTheDocument();

      // Buttons
      const applyBtn = screen.getByRole('button', { name: /Proceed to Apply/i });
      fireEvent.click(applyBtn);
      expect(handleProceed).toHaveBeenCalledTimes(1);

      const closeBtn = screen.getByRole('button', { name: /Close match preview/i });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('renders loading indicator when fetching preview data', () => {
      const queryClient = createTestQueryClient();

      vi.spyOn(AtsHooksModule, 'usePreApplyMatchPreview').mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      render(
        <QueryClientProvider client={queryClient}>
          <PreApplyMatchPreviewDrawer
            jobId="job-101"
            isOpen={true}
            onClose={vi.fn()}
          />
        </QueryClientProvider>
      );

      expect(
        screen.getByText(/Computing ATS match against your profile/i)
      ).toBeInTheDocument();
    });
  });

  describe('CandidateScoreAnalysisModal Component', () => {
    it('returns null when isOpen is false', () => {
      const queryClient = createTestQueryClient();
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <CandidateScoreAnalysisModal
            applicationId="app-999"
            isOpen={false}
            onClose={vi.fn()}
          />
        </QueryClientProvider>
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders candidate ATS score details and evidence across dimensions', () => {
      const queryClient = createTestQueryClient();

      vi.spyOn(AtsHooksModule, 'useApplicationAtsScore').mockReturnValue({
        data: mockScoreDetailData,
        isLoading: false,
        error: null,
      } as any);

      vi.spyOn(AtsHooksModule, 'useOverrideAtsScore').mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      render(
        <QueryClientProvider client={queryClient}>
          <CandidateScoreAnalysisModal
            applicationId="app-999"
            isOpen={true}
            onClose={vi.fn()}
            candidateName="Jane Doe"
            jobTitle="Senior Full Stack Engineer"
          />
        </QueryClientProvider>
      );

      expect(screen.getByText('Candidate ATS Score Analysis')).toBeInTheDocument();
      expect(screen.getByText('HIGH Band')).toBeInTheDocument();
      expect(screen.getByText('1. Skills Match (40% weight)')).toBeInTheDocument();
      expect(
        screen.getByText('2. Experience Duration & Role Relevance (25% weight)')
      ).toBeInTheDocument();
      expect(screen.getByText('Applicant: 5 yrs • Required: 4 yrs')).toBeInTheDocument();
      expect(screen.getByText('3. Education Qualification (15% weight)')).toBeInTheDocument();
      expect(
        screen.getByText('4. TF-IDF Semantic Keyword Similarity (15% weight)')
      ).toBeInTheDocument();
      expect(screen.getByText('5. Certifications Match (5% weight)')).toBeInTheDocument();
    });

    it('allows recruiter to calibrate / override ATS score with justification reason', async () => {
      const queryClient = createTestQueryClient();

      const mutateAsyncMock = vi.fn().mockResolvedValue({});

      vi.spyOn(AtsHooksModule, 'useApplicationAtsScore').mockReturnValue({
        data: mockScoreDetailData,
        isLoading: false,
        error: null,
      } as any);

      vi.spyOn(AtsHooksModule, 'useOverrideAtsScore').mockReturnValue({
        mutateAsync: mutateAsyncMock,
        isPending: false,
      } as any);

      render(
        <QueryClientProvider client={queryClient}>
          <CandidateScoreAnalysisModal
            applicationId="app-999"
            isOpen={true}
            onClose={vi.fn()}
            candidateName="Jane Doe"
          />
        </QueryClientProvider>
      );

      // Click "Calibrate / Override ATS Score"
      const overrideBtn = screen.getByRole('button', { name: /Calibrate \/ Override ATS Score/i });
      fireEvent.click(overrideBtn);

      // Form appears
      expect(screen.getByText('Manual Score Calibration (Audit Logged)')).toBeInTheDocument();

      const scoreInput = screen.getByLabelText(/Adjusted Score/i);
      const reasonInput = screen.getByLabelText(/Mandatory Justification Reason/i);

      fireEvent.change(scoreInput, { target: { value: '95' } });
      fireEvent.change(reasonInput, {
        target: { value: 'Demonstrated superior system design and leadership expertise during interview' },
      });

      const submitBtn = screen.getByRole('button', { name: /Save Calibration/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mutateAsyncMock).toHaveBeenCalledWith({
          applicationId: 'app-999',
          data: {
            overrideScore: 95,
            reason: 'Demonstrated superior system design and leadership expertise during interview',
          },
        });
      });
    });

    it('renders active override banner if recruiter previously calibrated score', () => {
      const queryClient = createTestQueryClient();

      const overriddenData: AtsScoreDetailDto = {
        ...mockScoreDetailData,
        manualOverrideScore: 91,
        overrideReason: 'Exceptional open source track record verified',
      };

      vi.spyOn(AtsHooksModule, 'useApplicationAtsScore').mockReturnValue({
        data: overriddenData,
        isLoading: false,
        error: null,
      } as any);

      vi.spyOn(AtsHooksModule, 'useOverrideAtsScore').mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      render(
        <QueryClientProvider client={queryClient}>
          <CandidateScoreAnalysisModal
            applicationId="app-999"
            isOpen={true}
            onClose={vi.fn()}
          />
        </QueryClientProvider>
      );

      expect(screen.getByText('⚡ Score Manually Adjusted by Recruiter')).toBeInTheDocument();
      expect(screen.getByText('Override Score: 91%')).toBeInTheDocument();
      expect(screen.getByText(/Exceptional open source track record verified/i)).toBeInTheDocument();
      expect(screen.getByText(/Original Algorithmic Score: 84%/i)).toBeInTheDocument();
    });
  });
});
