import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RecruiterJobsPage } from '../../src/pages/recruiter/RecruiterJobsPage';
import { JobCreationWizardPage } from '../../src/pages/recruiter/JobCreationWizardPage';
import * as JobHooksModule from '../../src/features/job-vacancy/hooks';
import * as ConfigHooksModule from '../../src/features/system-config/hooks';

const renderWithProviders = (ui: React.ReactElement, initialRoute = '/') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Frontend Recruiter Job Vacancy Flow (Epic 5)', () => {
  const mockJobs = [
    {
      id: 'job-101',
      title: 'Senior Full Stack Engineer',
      department: 'Engineering',
      location: 'Remote',
      employmentType: 'FULL_TIME',
      status: 'PUBLISHED',
      applicationsCount: 14,
      screeningCount: 8,
      interviewCount: 3,
      offerCount: 1,
      hiredCount: 0,
      createdAt: '2026-03-01T10:00:00Z',
      updatedAt: '2026-03-01T10:00:00Z',
    },
    {
      id: 'job-102',
      title: 'Product Designer',
      department: 'Design',
      location: 'New York, NY',
      employmentType: 'FULL_TIME',
      status: 'DRAFT',
      applicationsCount: 0,
      screeningCount: 0,
      interviewCount: 0,
      offerCount: 0,
      hiredCount: 0,
      createdAt: '2026-03-02T10:00:00Z',
      updatedAt: '2026-03-02T10:00:00Z',
    },
  ];

  const mockSkillsTaxonomy = [
    { id: 'sk-1', name: 'React', category: 'Frontend', verified: true, aliases: [] },
    { id: 'sk-2', name: 'TypeScript', category: 'Frontend', verified: true, aliases: [] },
    { id: 'sk-3', name: 'Node.js', category: 'Backend', verified: true, aliases: [] },
    { id: 'sk-4', name: 'SQL', category: 'Database', verified: true, aliases: [] },
  ];

  const mockAtsWeights = {
    current: {
      id: 'w-def',
      skillsWeight: 0.40,
      experienceWeight: 0.25,
      educationWeight: 0.15,
      semanticWeight: 0.15,
      certificationWeight: 0.05,
      isDefault: true,
      createdAt: '2026-03-01T00:00:00Z',
    },
    presets: [
      {
        id: 'eng',
        name: 'Engineering Preset',
        description: 'Focus on technical skills',
        weights: {
          skillsWeight: 0.50,
          experienceWeight: 0.25,
          educationWeight: 0.10,
          semanticWeight: 0.10,
          certificationWeight: 0.05,
        },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(JobHooksModule, 'useCompanyJobs').mockReturnValue({
      data: {
        items: mockJobs,
        total: 2,
        page: 1,
        limit: 50,
        publishedCount: 1,
        draftCount: 1,
        closedCount: 0,
      },
      isLoading: false,
    } as any);

    vi.spyOn(JobHooksModule, 'useUpdateJobStatus').mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);

    vi.spyOn(JobHooksModule, 'useCloneJob').mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: 'job-103' }),
      isPending: false,
    } as any);

    vi.spyOn(JobHooksModule, 'useDeleteJob').mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);

    vi.spyOn(ConfigHooksModule, 'useSkillsTaxonomy').mockReturnValue({
      data: mockSkillsTaxonomy,
      isLoading: false,
    } as any);

    vi.spyOn(ConfigHooksModule, 'useAtsWeights').mockReturnValue({
      data: mockAtsWeights,
      isLoading: false,
    } as any);

    vi.spyOn(JobHooksModule, 'useCreateJob').mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: 'job-new-1', status: 'PUBLISHED' }),
      isPending: false,
    } as any);

    vi.spyOn(JobHooksModule, 'useUpdateJob').mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: 'job-101', status: 'PUBLISHED' }),
      isPending: false,
    } as any);

    vi.spyOn(JobHooksModule, 'useJobDetails').mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);

    vi.spyOn(JobHooksModule, 'useCheckCompliance').mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({
        hasViolations: false,
        canPublish: true,
        violations: [],
      }),
      isPending: false,
    } as any);
  });

  describe('RecruiterJobsPage Dashboard', () => {
    it('renders job vacancies listing with stats and applicant counts', () => {
      renderWithProviders(<RecruiterJobsPage />);

      expect(screen.getByText('Job Vacancy Management')).toBeInTheDocument();
      expect(screen.getByText('Senior Full Stack Engineer')).toBeInTheDocument();
      expect(screen.getByText('Product Designer')).toBeInTheDocument();
      expect(screen.getByText(/14 Candidates/i)).toBeInTheDocument();
      expect(screen.getByText('Remote')).toBeInTheDocument();
    });

    it('filters vacancies by status tabs', () => {
      renderWithProviders(<RecruiterJobsPage />);

      const draftTab = screen.getByRole('button', { name: /^Draft$/i });
      fireEvent.click(draftTab);

      expect(JobHooksModule.useCompanyJobs).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'DRAFT' })
      );
    });

    it('opens share link modal with public URL when Share is clicked', () => {
      renderWithProviders(<RecruiterJobsPage />);

      const shareButtons = screen.getAllByTitle('Share Link');
      fireEvent.click(shareButtons[0]);

      expect(screen.getByText('Public Candidate Application Link')).toBeInTheDocument();
      expect(screen.getByDisplayValue(/\/jobs\/job-101/)).toBeInTheDocument();
    });

    it('triggers status change to PAUSED when Pause button is clicked', async () => {
      const mockUpdateStatus = vi.fn().mockResolvedValue({});
      vi.spyOn(JobHooksModule, 'useUpdateJobStatus').mockReturnValue({
        mutateAsync: mockUpdateStatus,
        isPending: false,
      } as any);

      renderWithProviders(<RecruiterJobsPage />);

      const pauseButton = screen.getByTitle('Pause Vacancy');
      fireEvent.click(pauseButton);

      await waitFor(() => {
        expect(mockUpdateStatus).toHaveBeenCalledWith({
          id: 'job-101',
          status: 'PAUSED',
        });
      });
    });

    it('triggers clone action when Duplicate button is clicked', async () => {
      const mockClone = vi.fn().mockResolvedValue({ id: 'job-cloned' });
      vi.spyOn(JobHooksModule, 'useCloneJob').mockReturnValue({
        mutateAsync: mockClone,
        isPending: false,
      } as any);

      renderWithProviders(<RecruiterJobsPage />);

      const cloneButtons = screen.getAllByTitle('Duplicate Vacancy');
      fireEvent.click(cloneButtons[0]);

      await waitFor(() => {
        expect(mockClone).toHaveBeenCalledWith('job-101');
      });
    });
  });

  describe('JobCreationWizardPage Multi-step Wizard', () => {
    it('renders Step 1 (Role Overview) by default with basic fields and disabled Next button initially', () => {
      renderWithProviders(<JobCreationWizardPage />);

      expect(screen.getByText('Role Details & Overview')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e.g. Senior Full Stack Engineer/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Describe role responsibilities/i)).toBeInTheDocument();

      const nextButton = screen.getByRole('button', { name: /Continue to Requirements/i });
      expect(nextButton).toBeDisabled();
    });

    it('navigates through steps when valid inputs are provided', async () => {
      renderWithProviders(<JobCreationWizardPage />);

      // Fill Step 1
      const titleInput = screen.getByPlaceholderText(/e.g. Senior Full Stack Engineer/i);
      fireEvent.change(titleInput, { target: { value: 'Staff Backend Architect' } });

      const descInput = screen.getByPlaceholderText(/Describe role responsibilities/i);
      fireEvent.change(descInput, { target: { value: 'Comprehensive role description with high expectations and modern stack.' } });

      const nextButton = screen.getByRole('button', { name: /Continue to Requirements/i });
      expect(nextButton).not.toBeDisabled();
      fireEvent.click(nextButton);

      // Step 2 should now be visible
      expect(screen.getByText('Requirements & Skills Taxonomy')).toBeInTheDocument();

      // Add a skill from taxonomy selector
      const skillSelect = screen.getByLabelText(/Select a skill from master taxonomy/i);
      fireEvent.change(skillSelect, { target: { value: 'sk-1' } });

      // React should now be in the selected skills list
      expect(screen.getAllByText('React').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Must Have')).toBeInTheDocument();

      // Continue to Step 3
      const step2NextBtn = screen.getByRole('button', { name: /Continue to ATS Weights/i });
      fireEvent.click(step2NextBtn);

      // Step 3 should now be visible
      expect(screen.getByText('ATS Scoring Weights & Application Screening')).toBeInTheDocument();
      expect(screen.getByText(/Customize ATS Sub-Score Weights for This Role/i)).toBeInTheDocument();

      // Continue to Step 4
      const step3NextBtn = screen.getByRole('button', { name: /Review & Publish/i });
      fireEvent.click(step3NextBtn);

      // Step 4 Review & Compliance Check
      expect(screen.getByText('Review & Pre-Publish Compliance Verification')).toBeInTheDocument();
      expect(screen.getByText('Staff Backend Architect')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Save as Draft/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Publish Vacancy/i })).toBeInTheDocument();
    });

    it('detects discriminatory keywords during compliance scan and blocks publishing', async () => {
      const mockComplianceCheck = vi.fn().mockResolvedValue({
        hasViolations: true,
        canPublish: false,
        violations: [
          {
            keyword: 'recent graduate',
            category: 'AGE',
            severity: 'BLOCK',
            explanation: 'Age-discriminatory phrasing.',
          },
        ],
      });

      vi.spyOn(JobHooksModule, 'useCheckCompliance').mockReturnValue({
        mutateAsync: mockComplianceCheck,
        isPending: false,
      } as any);

      renderWithProviders(<JobCreationWizardPage />);

      // Fill Step 1
      fireEvent.change(screen.getByPlaceholderText(/e.g. Senior Full Stack Engineer/i), {
        target: { value: 'Junior Developer' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Describe role responsibilities/i), {
        target: { value: 'We are seeking an energetic recent graduate to join our fast-paced squad.' },
      });

      // Jump directly to Step 4 via top navigation tabs
      const step4Tab = screen.getByRole('button', { name: /4\. Compliance & Publish/i });
      fireEvent.click(step4Tab);

      await waitFor(() => {
        expect(mockComplianceCheck).toHaveBeenCalled();
        expect(
          screen.getByText(/Prohibited Discriminatory Language Detected/i)
        ).toBeInTheDocument();
        expect(screen.getByText(/"recent graduate" \(BLOCK\)/i)).toBeInTheDocument();
      });

      // Publish button should be disabled when canPublish is false
      const publishBtn = screen.getByRole('button', { name: /Publish Vacancy/i });
      expect(publishBtn).toBeDisabled();
    });

    it('submits job as draft when Save as Draft button is clicked on Step 4', async () => {
      const mockCreate = vi.fn().mockResolvedValue({ id: 'job-999', status: 'DRAFT' });
      vi.spyOn(JobHooksModule, 'useCreateJob').mockReturnValue({
        mutateAsync: mockCreate,
        isPending: false,
      } as any);

      renderWithProviders(<JobCreationWizardPage />);

      fireEvent.change(screen.getByPlaceholderText(/e.g. Senior Full Stack Engineer/i), {
        target: { value: 'Draft QA Engineer' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Describe role responsibilities/i), {
        target: { value: 'Draft test role description with valid length.' },
      });

      // Go to Step 4 via tab
      const step4Tab = screen.getByRole('button', { name: /4\. Compliance & Publish/i });
      fireEvent.click(step4Tab);

      const draftBtn = screen.getByRole('button', { name: /Save as Draft/i });
      fireEvent.click(draftBtn);

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Draft QA Engineer',
            status: 'DRAFT',
          })
        );
      });
    });

    it('publishes job vacancy when Publish Vacancy button is clicked on Step 4', async () => {
      const mockCreate = vi.fn().mockResolvedValue({ id: 'job-888', status: 'PUBLISHED' });
      vi.spyOn(JobHooksModule, 'useCreateJob').mockReturnValue({
        mutateAsync: mockCreate,
        isPending: false,
      } as any);

      renderWithProviders(<JobCreationWizardPage />);

      fireEvent.change(screen.getByPlaceholderText(/e.g. Senior Full Stack Engineer/i), {
        target: { value: 'Published DevOps Engineer' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Describe role responsibilities/i), {
        target: { value: 'Published role description with valid length.' },
      });

      // Go to Step 4 via tab
      const step4Tab = screen.getByRole('button', { name: /4\. Compliance & Publish/i });
      fireEvent.click(step4Tab);

      await waitFor(() => {
        const publishBtn = screen.getByRole('button', { name: /Publish Vacancy/i });
        expect(publishBtn).not.toBeDisabled();
        fireEvent.click(publishBtn);
      });

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Published DevOps Engineer',
            status: 'PUBLISHED',
          })
        );
      });
    });
  });
});
