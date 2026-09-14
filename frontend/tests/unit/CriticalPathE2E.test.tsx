import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApplyJobModal } from '../../src/features/application/components/ApplyJobModal';
import { InterviewSchedulerModal } from '../../src/features/communication/components/InterviewSchedulerModal';
import { OfferGeneratorModal } from '../../src/features/offers/components/OfferGeneratorModal';
import { OfferReviewModal } from '../../src/features/offers/components/OfferReviewModal';
import { MarkHiredModal } from '../../src/features/offers/components/MarkHiredModal';
import * as ApplicantProfileHooks from '../../src/features/applicant-profile/hooks';
import * as ApplicationHooks from '../../src/features/application/hooks';
import * as CommunicationHooks from '../../src/features/communication/hooks';
import * as OfferHooks from '../../src/features/offers/hooks';
import type { PublicJobDetailDto } from '@recruitment-platform/shared';
import type { JobOfferDto } from '../../src/features/offers/types';

const mockJob: PublicJobDetailDto = {
  id: 'job-e2e-100',
  companyId: 'comp-100',
  companyName: 'CloudScale Technologies',
  title: 'Staff Platform Engineer',
  description: 'Lead our core distributed systems and cloud platform reliability.',
  location: 'San Francisco, CA (Hybrid)',
  employmentType: 'FULL_TIME',
  salaryMin: 180000,
  salaryMax: 220000,
  deadline: '2026-12-31T00:00:00Z',
  createdAt: '2026-09-01T00:00:00Z',
  requiredSkills: [
    { id: 'sk-1', name: 'TypeScript', priority: 'MUST_HAVE', minProficiency: 4, weight: 40 },
    { id: 'sk-2', name: 'Kubernetes', priority: 'MUST_HAVE', minProficiency: 4, weight: 30 },
  ],
  screeningQuestions: [
    {
      id: 'q-1',
      question: 'Do you have 5+ years of production Kubernetes experience?',
      type: 'YES_NO',
      isKnockout: false,
    },
  ],
};

const mockApplicantProfile: any = {
  id: 'profile-e2e-1',
  firstName: 'Alex',
  lastName: 'Rivera',
  headline: 'Senior Cloud Platform Engineer',
  cvs: [
    {
      id: 'cv-e2e-1',
      fileName: 'alex-rivera-cloud-resume.pdf',
      isPrimary: true,
      createdAt: '2026-09-01T00:00:00Z',
    },
  ],
};

const mockOffer: JobOfferDto = {
  id: 'offer-e2e-1',
  applicationId: 'app-e2e-1',
  jobId: 'job-e2e-100',
  jobTitle: 'Staff Platform Engineer',
  companyId: 'comp-100',
  companyName: 'CloudScale Technologies',
  candidateId: 'applicant-1',
  candidateName: 'Alex Rivera',
  candidateEmail: 'alex.rivera@example.com',
  createdById: 'recruiter-1',
  baseSalary: 195000,
  currency: 'USD',
  bonus: 25000,
  equity: '0.15% Options (4-year vest)',
  startDate: '2026-10-15T00:00:00Z',
  expirationDate: '2026-10-01T00:00:00Z',
  offerLetterText: 'Congratulations Alex Rivera! We are thrilled to offer you the position of Staff Platform Engineer.',
  benefitsSummary: 'Comprehensive healthcare, 401(k) match, unlimited PTO.',
  status: 'SENT',
  sentAt: '2026-09-14T10:00:00Z',
  createdAt: '2026-09-14T09:00:00Z',
  updatedAt: '2026-09-14T09:00:00Z',
};

describe('Epic 16: End-to-End Critical Path Integration (Candidate-to-Hire Lifecycle)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('Step 1 & 2: Applicant applies to job with primary CV and answers screening questions', async () => {
    vi.spyOn(ApplicantProfileHooks, 'useApplicantProfile').mockReturnValue({
      data: mockApplicantProfile,
      isLoading: false,
    } as any);

    const submitMutateAsync = vi.fn().mockResolvedValue({
      id: 'app-e2e-1',
      jobId: mockJob.id,
      status: 'APPLIED',
      message: 'Application Submitted',
    });

    vi.spyOn(ApplicationHooks, 'useSubmitApplication').mockReturnValue({
      mutateAsync: submitMutateAsync,
      isPending: false,
      isSuccess: false,
    } as any);

    const handleSuccess = vi.fn();

    renderWithProviders(
      <ApplyJobModal
        job={mockJob}
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={handleSuccess}
      />
    );

    // Verify modal rendered with title
    expect(screen.getByText('Submit Application')).toBeInTheDocument();
    expect(screen.getByText('Staff Platform Engineer')).toBeInTheDocument();
    expect(screen.getByText('alex-rivera-cloud-resume.pdf')).toBeInTheDocument();

    // Advance to Step 2 (Screening Questions)
    const nextBtn = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextBtn);

    // Answer boolean screening question
    await waitFor(() => {
      expect(
        screen.getByText('1. Do you have 5+ years of production Kubernetes experience?')
      ).toBeInTheDocument();
    });

    const yesRadio = screen.getByLabelText(/yes/i);
    fireEvent.click(yesRadio);

    // Advance to Step 3 (Review & Submit)
    const reviewBtn = screen.getByRole('button', { name: /next/i });
    fireEvent.click(reviewBtn);

    // Submit Application
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /submit application/i })).toBeInTheDocument();
    });

    const finalSubmitBtn = screen.getByRole('button', { name: /submit application/i });
    fireEvent.click(finalSubmitBtn);

    await waitFor(() => {
      expect(submitMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: 'job-e2e-100',
          cvId: 'cv-e2e-1',
          screeningAnswers: expect.arrayContaining([
            expect.objectContaining({ questionId: 'q-1', answer: 'true' }),
          ]),
        })
      );
      expect(handleSuccess).toHaveBeenCalled();
    });
  });

  it('Step 3: Recruiter schedules candidate technical interview session', async () => {
    const scheduleMutateAsync = vi.fn().mockResolvedValue({
      id: 'interview-e2e-1',
      applicationId: 'app-e2e-1',
      title: 'Technical & System Architecture Round',
      status: 'SCHEDULED',
    });

    vi.spyOn(CommunicationHooks, 'useScheduleInterview').mockReturnValue({
      mutateAsync: scheduleMutateAsync,
      isPending: false,
    } as any);

    const handleClose = vi.fn();

    renderWithProviders(
      <InterviewSchedulerModal
        isOpen={true}
        onClose={handleClose}
        applicationId="app-e2e-1"
        candidateName="Alex Rivera"
        jobTitle="Staff Platform Engineer"
      />
    );

    expect(screen.getByText('Schedule Candidate Interview')).toBeInTheDocument();
    expect(screen.getByText(/Alex Rivera/i)).toBeInTheDocument();

    // Enter meeting link
    const linkInput = screen.getByPlaceholderText(/https:\/\/meet\.google\.com/i);
    fireEvent.change(linkInput, {
      target: { value: 'https://meet.google.com/abc-defg-hij' },
    });

    // Submit schedule form
    const submitBtn = screen.getByRole('button', { name: /schedule & notify candidate/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(scheduleMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Technical & System Architecture'),
          videoLink: 'https://meet.google.com/abc-defg-hij',
        })
      );
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('Step 4: Recruiter drafts and sends formal job offer', async () => {
    const createOfferMutateAsync = vi.fn().mockResolvedValue({
      ...mockOffer,
      status: 'DRAFT',
    });
    const sendOfferMutateAsync = vi.fn().mockResolvedValue({
      ...mockOffer,
      status: 'SENT',
    });

    vi.spyOn(OfferHooks, 'useCreateOrUpdateOffer').mockReturnValue({
      mutateAsync: createOfferMutateAsync,
      isPending: false,
    } as any);

    vi.spyOn(OfferHooks, 'useSendOffer').mockReturnValue({
      mutateAsync: sendOfferMutateAsync,
      isPending: false,
    } as any);

    const handleClose = vi.fn();

    renderWithProviders(
      <OfferGeneratorModal
        isOpen={true}
        onClose={handleClose}
        applicationId="app-e2e-1"
        candidateName="Alex Rivera"
        candidateEmail="alex.rivera@example.com"
        jobTitle="Staff Platform Engineer"
        companyName="CloudScale Technologies"
      />
    );

    expect(screen.getByText('Generate Formal Job Offer')).toBeInTheDocument();
    expect(screen.getByText('Alex Rivera')).toBeInTheDocument();

    // Send offer directly
    const sendBtn = screen.getByRole('button', { name: /send official offer/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(createOfferMutateAsync).toHaveBeenCalled();
      expect(sendOfferMutateAsync).toHaveBeenCalledWith('offer-e2e-1');
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('Step 5: Applicant reviews and formally accepts employment offer', async () => {
    const respondMutateAsync = vi.fn().mockResolvedValue({
      ...mockOffer,
      status: 'ACCEPTED',
    });

    vi.spyOn(OfferHooks, 'useRespondOffer').mockReturnValue({
      mutateAsync: respondMutateAsync,
      isPending: false,
    } as any);

    const handleOfferReviewClose = vi.fn();

    renderWithProviders(
      <OfferReviewModal
        isOpen={true}
        onClose={handleOfferReviewClose}
        offer={mockOffer}
        candidateName="Alex Rivera"
      />
    );

    expect(screen.getByText('Official Employment Offer')).toBeInTheDocument();
    expect(screen.getByText('$195,000')).toBeInTheDocument();

    // Applicant clicks Accept Offer
    const acceptBtn = screen.getByRole('button', { name: /accept offer/i });
    fireEvent.click(acceptBtn);

    // Applicant enters signature and formally accepts
    const signBtn = screen.getByRole('button', { name: /sign & formally accept/i });
    fireEvent.click(signBtn);

    await waitFor(() => {
      expect(respondMutateAsync).toHaveBeenCalledWith({
        offerId: 'offer-e2e-1',
        data: {
          action: 'ACCEPT',
          signedName: 'Alex Rivera',
        },
      });
      expect(handleOfferReviewClose).toHaveBeenCalled();
    });
  });

  it('Step 6: Recruiter confirms candidate hire and closes job requisition', async () => {
    const markHiredMutateAsync = vi.fn().mockResolvedValue({
      success: true,
      applicationId: 'app-e2e-1',
      jobStatus: 'FILLED',
    });

    vi.spyOn(OfferHooks, 'useHireCandidate').mockReturnValue({
      mutateAsync: markHiredMutateAsync,
      isPending: false,
    } as any);

    const handleHiredClose = vi.fn();

    renderWithProviders(
      <MarkHiredModal
        isOpen={true}
        onClose={handleHiredClose}
        applicationId="app-e2e-1"
        candidateName="Alex Rivera"
        jobTitle="Staff Platform Engineer"
      />
    );

    expect(screen.getByText('Mark as Hired')).toBeInTheDocument();
    expect(screen.getByText('Alex Rivera')).toBeInTheDocument();

    const confirmHiredBtn = screen.getByRole('button', { name: /confirm hire/i });
    fireEvent.click(confirmHiredBtn);

    await waitFor(() => {
      expect(markHiredMutateAsync).toHaveBeenCalledWith({
        applicationId: 'app-e2e-1',
        data: {
          closeRequisition: true,
          hireDate: expect.any(String),
          notes: undefined,
        },
      });
      expect(handleHiredClose).toHaveBeenCalled();
    });
  });
});
