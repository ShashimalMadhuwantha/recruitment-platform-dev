import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { JobSearchPage } from '../../src/pages/applicant/JobSearchPage';
import { JobDetailPage } from '../../src/pages/applicant/JobDetailPage';
import { ApplicantDashboardPage } from '../../src/pages/applicant/ApplicantDashboardPage';
import { ApplyJobModal } from '../../src/features/application/components/ApplyJobModal';
import * as JobSearchHooks from '../../src/features/job-search/hooks';
import * as ApplicationHooks from '../../src/features/application/hooks';
import * as ProfileHooks from '../../src/features/applicant-profile/hooks';
import * as AtsScoringHooks from '../../src/features/ats-scoring/hooks';
import type { PublicJobListItem, PublicJobDetailDto, ApplicantApplicationListItem, SavedJobDto } from '@recruitment-platform/shared';

const mockJobs: PublicJobListItem[] = [
  {
    id: 'job-1',
    companyId: 'comp-1',
    companyName: 'Acme Technologies',
    companyIndustry: 'Software',
    title: 'Senior Full-Stack Engineer',
    location: 'Remote',
    employmentType: 'REMOTE',
    salaryMin: 90000,
    salaryMax: 130000,
    deadline: '2026-12-31T00:00:00.000Z',
    createdAt: '2026-09-01T00:00:00.000Z',
    requiredSkills: [
      { id: 'sk-1', name: 'TypeScript', priority: 'MUST_HAVE', minProficiency: 4 },
      { id: 'sk-2', name: 'React', priority: 'MUST_HAVE', minProficiency: 3 },
    ],
    isSaved: false,
    hasApplied: false,
  },
  {
    id: 'job-2',
    companyId: 'comp-2',
    companyName: 'Global Cloud Systems',
    companyIndustry: 'Cloud Computing',
    title: 'Backend Node.js Developer',
    location: 'New York, USA',
    employmentType: 'FULL_TIME',
    salaryMin: 110000,
    salaryMax: 140000,
    deadline: null,
    createdAt: '2026-09-05T00:00:00.000Z',
    requiredSkills: [
      { id: 'sk-3', name: 'Node.js', priority: 'MUST_HAVE', minProficiency: 4 },
      { id: 'sk-4', name: 'MySQL', priority: 'NICE_TO_HAVE', minProficiency: 3 },
    ],
    isSaved: true,
    hasApplied: true,
  },
];

const mockJobDetail: PublicJobDetailDto = {
  id: 'job-1',
  companyId: 'comp-1',
  companyName: 'Acme Technologies',
  companyIndustry: 'Software',
  title: 'Senior Full-Stack Engineer',
  description: 'We are looking for a Senior Full-Stack Engineer experienced in TypeScript and React.\n\nYou will build mission-critical features.',
  requirementsSummary: '3+ years with modern React & Node.js architecture.',
  location: 'Remote',
  employmentType: 'REMOTE',
  salaryMin: 90000,
  salaryMax: 130000,
  deadline: '2026-12-31T00:00:00.000Z',
  createdAt: '2026-09-01T00:00:00.000Z',
  requirements: {
    minExperienceYears: 3,
    maxExperienceYears: 6,
    educationLevel: "Bachelor's Degree",
    requiredCertifications: [],
  },
  requiredSkills: [
    { id: 'sk-1', name: 'TypeScript', priority: 'MUST_HAVE', minProficiency: 4, weight: 1.0 },
    { id: 'sk-2', name: 'React', priority: 'MUST_HAVE', minProficiency: 3, weight: 1.0 },
  ],
  screeningQuestions: [
    {
      id: 'q-1',
      question: 'Do you have at least 3 years of commercial React experience?',
      type: 'YES_NO',
      isKnockout: true,
      requiredAnswer: 'YES',
    },
  ],
  isSaved: false,
  hasApplied: false,
};

const mockApplications: ApplicantApplicationListItem[] = [
  {
    id: 'app-1',
    jobId: 'job-1',
    jobTitle: 'Senior Full-Stack Engineer',
    companyName: 'Acme Technologies',
    location: 'Remote',
    employmentType: 'REMOTE',
    status: 'APPLIED',
    appliedAt: '2026-09-08T10:00:00.000Z',
    cvFileName: 'FullStack_Resume_v1.pdf',
    overallScore: 88,
    scoreBand: 'HIGH',
    canWithdraw: true,
  },
  {
    id: 'app-2',
    jobId: 'job-2',
    jobTitle: 'Backend Node.js Developer',
    companyName: 'Global Cloud Systems',
    location: 'New York, USA',
    employmentType: 'FULL_TIME',
    status: 'SCREENING',
    appliedAt: '2026-09-06T14:00:00.000Z',
    cvFileName: 'Backend_CV.pdf',
    overallScore: 65,
    scoreBand: 'MID',
    canWithdraw: true,
  },
];

const mockSavedJobs: SavedJobDto[] = [
  {
    id: 'save-1',
    jobId: 'job-2',
    jobTitle: 'Backend Node.js Developer',
    companyName: 'Global Cloud Systems',
    location: 'New York, USA',
    employmentType: 'FULL_TIME',
    salaryMin: 110000,
    salaryMax: 140000,
    deadline: null,
    savedAt: '2026-09-07T12:00:00.000Z',
  },
];

const mockProfile: any = {
  id: 'prof-1',
  userId: 'user-1',
  firstName: 'Alex',
  lastName: 'Applicant',
  completeness: { score: 90 },
  cvs: [
    { id: 'cv-1', fileName: 'FullStack_Resume_v1.pdf', fileSize: 104800, isPrimary: true, createdAt: '2026-09-01T00:00:00.000Z' },
    { id: 'cv-2', fileName: 'Frontend_Specialist.pdf', fileSize: 98000, isPrimary: false, createdAt: '2026-09-02T00:00:00.000Z' },
  ],
};

const renderWithProviders = (ui: React.ReactElement, initialEntries = ['/']) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Job Search & Application Flow (Epic 8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(JobSearchHooks, 'useJobSearch').mockReturnValue({
      data: {
        items: mockJobs,
        total: 2,
        page: 1,
        limit: 12,
        totalPages: 1,
      },
      isLoading: false,
    } as any);

    vi.spyOn(JobSearchHooks, 'usePublicJobDetails').mockReturnValue({
      data: mockJobDetail,
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(JobSearchHooks, 'useSavedJobs').mockReturnValue({
      data: mockSavedJobs,
      isLoading: false,
    } as any);

    vi.spyOn(JobSearchHooks, 'useToggleSaveJob').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    vi.spyOn(ApplicationHooks, 'useMyApplications').mockReturnValue({
      data: mockApplications,
      isLoading: false,
    } as any);

    vi.spyOn(ApplicationHooks, 'useWithdrawApplication').mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ success: true }),
      isPending: false,
    } as any);

    vi.spyOn(ProfileHooks, 'useApplicantProfile').mockReturnValue({
      data: mockProfile,
      isLoading: false,
    } as any);

    vi.spyOn(AtsScoringHooks, 'usePreApplyMatchPreview').mockReturnValue({
      data: {
        overallScore: 88,
        scoreBand: 'HIGH',
        bandLabel: 'Strong match',
        breakdown: {} as any,
        missingCriticalSkills: [],
        missingNiceToHaveSkills: [],
        experienceGap: 0,
        educationMet: true,
        recommendations: [],
      },
      isLoading: false,
    } as any);
  });

  // --- 1. JobSearchPage ---
  describe('JobSearchPage', () => {
    it('renders search bar, filters, and published job cards', () => {
      renderWithProviders(<JobSearchPage />);

      expect(screen.getByText('Explore Open Vacancies')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Search by job title/i)).toBeInTheDocument();
      expect(screen.getByText('Remote Only Positions')).toBeInTheDocument();

      // Check job cards
      expect(screen.getByText('Senior Full-Stack Engineer')).toBeInTheDocument();
      expect(screen.getByText('Backend Node.js Developer')).toBeInTheDocument();
      expect(screen.getByText('Acme Technologies')).toBeInTheDocument();
      expect(screen.getByText('Global Cloud Systems')).toBeInTheDocument();
    });

    it('triggers toggle bookmark button on a job card', () => {
      const toggleMock = vi.fn();
      vi.spyOn(JobSearchHooks, 'useToggleSaveJob').mockReturnValue({
        mutate: toggleMock,
        isPending: false,
      } as any);

      renderWithProviders(<JobSearchPage />);
      const bookmarkButtons = screen.getAllByTitle(/Bookmark job|Remove bookmark/i);
      expect(bookmarkButtons.length).toBeGreaterThan(0);

      fireEvent.click(bookmarkButtons[0]);
      expect(toggleMock).toHaveBeenCalledWith('job-1');
    });
  });

  // --- 2. JobDetailPage ---
  describe('JobDetailPage', () => {
    it('renders full vacancy details, skills, and action CTAs', () => {
      renderWithProviders(
        <Routes>
          <Route path="/jobs/:id" element={<JobDetailPage />} />
        </Routes>,
        ['/jobs/job-1']
      );

      expect(screen.getByText('Acme Technologies • Software')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1, name: 'Senior Full-Stack Engineer' })).toBeInTheDocument();
      expect(screen.getByText(/We are looking for a Senior Full-Stack Engineer/i)).toBeInTheDocument();
      expect(screen.getByText('Technical Taxonomy & Required Skills')).toBeInTheDocument();

      // Buttons
      expect(screen.getAllByText('Preview ATS Match').length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: 'Apply for This Vacancy' })).toBeInTheDocument();
    });
  });

  // --- 3. ApplyJobModal ---
  describe('ApplyJobModal', () => {
    it('navigates through CV selection and screening questions to submit', async () => {
      const submitMock = vi.fn().mockResolvedValue({
        applicationId: 'new-app-1',
        status: 'APPLIED',
        knockoutFailed: false,
        overallScore: 85,
        scoreBand: 'HIGH',
        message: 'Application submitted successfully.',
      });

      vi.spyOn(ApplicationHooks, 'useSubmitApplication').mockReturnValue({
        mutateAsync: submitMock,
        isPending: false,
        isSuccess: false,
        data: undefined,
      } as any);

      renderWithProviders(
        <ApplyJobModal
          job={mockJobDetail}
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      // Step 1: Select Resume
      expect(screen.getByText('1. Select Resume')).toBeInTheDocument();
      expect(screen.getByText('FullStack_Resume_v1.pdf')).toBeInTheDocument();

      // Click Next to go to Step 2 (Screening questions)
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));

      // Step 2: Screening questions
      expect(screen.getByText(/Do you have at least 3 years of commercial React experience/i)).toBeInTheDocument();
      expect(screen.getByText('Knockout')).toBeInTheDocument();

      // Select Yes
      fireEvent.click(screen.getByLabelText('Yes'));

      // Click Next to Step 3 (Review & Cover letter)
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));

      expect(screen.getByLabelText(/Cover Letter/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Submit Application/i })).toBeInTheDocument();

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /Submit Application/i }));
      await waitFor(() => {
        expect(submitMock).toHaveBeenCalled();
      });
    });
  });

  // --- 4. ApplicantDashboardPage ---
  describe('ApplicantDashboardPage', () => {
    it('renders real submitted applications with live status badges', () => {
      renderWithProviders(<ApplicantDashboardPage />);

      expect(screen.getByText('Applicant Dashboard')).toBeInTheDocument();
      expect(screen.getByText('My Applications (2)')).toBeInTheDocument();
      expect(screen.getByText('Senior Full-Stack Engineer')).toBeInTheDocument();
      expect(screen.getByText('Backend Node.js Developer')).toBeInTheDocument();
    });

    it('opens withdrawal modal and submits withdrawal request', async () => {
      const withdrawMock = vi.fn().mockResolvedValue({ success: true });
      vi.spyOn(ApplicationHooks, 'useWithdrawApplication').mockReturnValue({
        mutateAsync: withdrawMock,
        isPending: false,
      } as any);

      renderWithProviders(<ApplicantDashboardPage />);

      const withdrawButtons = screen.getAllByRole('button', { name: 'Withdraw' });
      fireEvent.click(withdrawButtons[0]);

      expect(screen.getByText('Withdraw Application?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Confirm Withdrawal' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Confirm Withdrawal' }));

      await waitFor(() => {
        expect(withdrawMock).toHaveBeenCalledWith({
          id: 'app-1',
          reason: undefined,
        });
      });
    });

    it('switches to Saved Jobs tab and displays bookmarked vacancies', () => {
      renderWithProviders(<ApplicantDashboardPage />);

      fireEvent.click(screen.getByText('Saved Jobs (1)'));
      expect(screen.getByText('Bookmarked Vacancies')).toBeInTheDocument();
      expect(screen.getByText('Backend Node.js Developer')).toBeInTheDocument();
      expect(screen.getByText('Global Cloud Systems • New York, USA • Saved on 9/7/2026')).toBeInTheDocument();
    });
  });
});
