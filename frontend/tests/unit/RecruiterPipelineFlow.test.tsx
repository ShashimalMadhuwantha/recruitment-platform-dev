import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RecruiterPipelinePage } from '../../src/pages/recruiter/RecruiterPipelinePage';
import { TalentPoolPage } from '../../src/pages/recruiter/TalentPoolPage';
import * as JobHooksModule from '../../src/features/job-vacancy/hooks';
import * as PipelineHooksModule from '../../src/features/recruiter-pipeline/hooks';
import * as AuthModule from '../../src/app/providers';

// Mock auth provider
vi.mock('../../src/app/providers', async () => {
  const actual = await vi.importActual('../../src/app/providers');
  return {
    ...actual,
    useAuth: () => ({
      user: {
        id: 'recruiter-123',
        email: 'recruiter@techcorp.com',
        role: 'RECRUITER',
      },
    }),
  };
});

const renderWithProviders = (ui: React.ReactElement, initialRoute = '/') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Frontend Recruiter Candidate Pipeline & Talent Sourcing Flow (FR-RC-10 to FR-RC-16)', () => {
  const mockJobs = [
    {
      id: 'job-1',
      title: 'Senior Full Stack Engineer',
      status: 'PUBLISHED',
      applicationsCount: 3,
    },
    {
      id: 'job-2',
      title: 'Frontend React Specialist',
      status: 'PUBLISHED',
      applicationsCount: 0,
    },
  ];

  const mockCandidates = [
    {
      id: 'app-1',
      applicantId: 'prof-1',
      jobId: 'job-1',
      jobTitle: 'Senior Full Stack Engineer',
      fullName: 'Alice Walker',
      email: 'alice@example.com',
      phone: '+1 555-0199',
      headline: 'Senior React & Node Developer',
      location: 'San Francisco, CA',
      status: 'APPLIED',
      appliedAt: '2026-03-10T10:00:00Z',
      cvFileName: 'Alice_Walker_CV.pdf',
      cvFileUrl: 'http://localhost:5000/files/alice.pdf',
      atsScore: {
        overallScore: 88,
        scoreBand: 'HIGH',
        skillsScore: 92,
        experienceScore: 85,
        educationScore: 90,
        semanticTfidfScore: 82,
        certificationScore: 0,
        manualOverrideScore: null,
        topMatchingTerms: ['React', 'TypeScript', 'Node.js'],
      },
      averageRating: 4.5,
      notesCount: 2,
      mustHaveSkillsCount: 3,
      matchedMustHaveSkillsCount: 3,
      screeningAnswers: [
        { questionId: 'q1', question: 'Years of React?', answer: '5 years' },
      ],
    },
    {
      id: 'app-2',
      applicantId: 'prof-2',
      jobId: 'job-1',
      jobTitle: 'Senior Full Stack Engineer',
      fullName: 'Bob Martinez',
      email: 'bob@example.com',
      headline: 'Frontend Engineer',
      location: 'Austin, TX',
      status: 'SCREENING',
      appliedAt: '2026-03-09T14:30:00Z',
      atsScore: {
        overallScore: 65,
        scoreBand: 'MID',
        skillsScore: 60,
        experienceScore: 70,
        educationScore: 65,
        semanticTfidfScore: 65,
        certificationScore: 0,
        manualOverrideScore: null,
      },
      averageRating: null,
      notesCount: 0,
      mustHaveSkillsCount: 3,
      matchedMustHaveSkillsCount: 2,
    },
    {
      id: 'app-3',
      applicantId: 'prof-3',
      jobId: 'job-1',
      jobTitle: 'Senior Full Stack Engineer',
      fullName: 'Charlie Green',
      email: 'charlie@example.com',
      headline: 'Junior Web Developer',
      location: 'Remote',
      status: 'SHORTLISTED',
      appliedAt: '2026-03-08T09:15:00Z',
      atsScore: {
        overallScore: 42,
        scoreBand: 'LOW',
        skillsScore: 40,
        experienceScore: 40,
        educationScore: 50,
        semanticTfidfScore: 38,
        certificationScore: 0,
        manualOverrideScore: null,
      },
      averageRating: null,
      notesCount: 0,
      mustHaveSkillsCount: 3,
      matchedMustHaveSkillsCount: 1,
    },
  ];

  const mockNotes = [
    {
      id: 'note-1',
      applicationId: 'app-1',
      authorId: 'recruiter-123',
      authorName: 'Recruiter Alex',
      authorEmail: 'alex@techcorp.com',
      content: 'Solid background in React and architecture.',
      rating: 5,
      createdAt: '2026-03-10T12:00:00Z',
      updatedAt: '2026-03-10T12:00:00Z',
    },
  ];

  const mockTalentPoolCandidates = [
    {
      id: 'prof-10',
      fullName: 'Dana White',
      email: 'dana@example.com',
      headline: 'Lead Cloud Architect',
      location: 'Seattle, WA',
      summary: '10+ years designing enterprise distributed systems.',
      skills: [{ name: 'AWS' }, { name: 'Kubernetes' }, { name: 'Node.js' }],
      experienceYears: 10,
      isBlind: false,
      cvUrl: 'http://localhost:5000/files/dana.pdf',
      profileVisibility: 'PUBLIC',
    },
    {
      id: 'prof-11',
      fullName: 'Candidate #A1B2C3',
      headline: 'Senior React Developer',
      location: 'Remote',
      summary: 'Frontend specialist building accessible UIs.',
      skills: [{ name: 'React' }, { name: 'TypeScript' }],
      experienceYears: 6,
      isBlind: true,
      profileVisibility: 'BLIND',
    },
  ];

  const mockMoveStage = vi.fn().mockResolvedValue({ success: true });
  const mockBulkMove = vi.fn().mockResolvedValue({ success: true, updatedCount: 2 });
  const mockAddNote = vi.fn().mockResolvedValue(mockNotes[0]);
  const mockDeleteNote = vi.fn().mockResolvedValue({ success: true });
  const mockCompare = vi.fn().mockResolvedValue({
    jobId: 'job-1',
    jobTitle: 'Senior Full Stack Engineer',
    candidates: [
      {
        applicationId: 'app-1',
        candidateName: 'Alice Walker',
        headline: 'Senior React & Node Developer',
        currentStage: 'APPLIED',
        appliedAt: '2026-03-10T10:00:00Z',
        overallScore: 88,
        scoreBand: 'HIGH',
        subScores: {
          skillsScore: 92,
          experienceScore: 85,
          educationScore: 90,
          semanticTfidfScore: 82,
        },
        skills: [
          { name: 'React', isMatched: true, priority: 'MUST_HAVE' },
          { name: 'TypeScript', isMatched: true, priority: 'MUST_HAVE' },
          { name: 'Node.js', isMatched: true, priority: 'MUST_HAVE' },
        ],
        yearsOfExperience: 5.5,
        educationSummary: 'BSc Computer Science (NYU)',
        averageTeamRating: 4.5,
        notesCount: 2,
      },
      {
        applicationId: 'app-2',
        candidateName: 'Bob Martinez',
        headline: 'Frontend Engineer',
        currentStage: 'SCREENING',
        appliedAt: '2026-03-09T14:30:00Z',
        overallScore: 65,
        scoreBand: 'MID',
        subScores: {
          skillsScore: 60,
          experienceScore: 70,
          educationScore: 65,
          semanticTfidfScore: 65,
        },
        skills: [
          { name: 'React', isMatched: true, priority: 'MUST_HAVE' },
          { name: 'TypeScript', isMatched: false, priority: 'MUST_HAVE' },
          { name: 'Node.js', isMatched: true, priority: 'MUST_HAVE' },
        ],
        yearsOfExperience: 3.0,
        educationSummary: 'BSc Software Engineering (UT Austin)',
        averageTeamRating: null,
        notesCount: 0,
      },
    ],
  });

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(JobHooksModule, 'useCompanyJobs').mockReturnValue({
      data: { items: mockJobs, total: 2 },
      isLoading: false,
    } as any);

    vi.spyOn(PipelineHooksModule, 'usePipelineApplications').mockReturnValue({
      data: mockCandidates,
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(PipelineHooksModule, 'useMoveCandidateStage').mockReturnValue({
      mutateAsync: mockMoveStage,
      isPending: false,
    } as any);

    vi.spyOn(PipelineHooksModule, 'useBulkMoveCandidates').mockReturnValue({
      mutateAsync: mockBulkMove,
      isPending: false,
    } as any);

    vi.spyOn(PipelineHooksModule, 'useCandidateNotes').mockReturnValue({
      data: mockNotes,
      isLoading: false,
    } as any);

    vi.spyOn(PipelineHooksModule, 'useAddCandidateNote').mockReturnValue({
      mutateAsync: mockAddNote,
      isPending: false,
    } as any);

    vi.spyOn(PipelineHooksModule, 'useDeleteCandidateNote').mockReturnValue({
      mutateAsync: mockDeleteNote,
      isPending: false,
    } as any);

    vi.spyOn(PipelineHooksModule, 'useCompareCandidates').mockReturnValue({
      mutate: mockCompare,
      data: null,
      isPending: false,
    } as any);

    vi.spyOn(PipelineHooksModule, 'useTalentPool').mockReturnValue({
      data: {
        candidates: mockTalentPoolCandidates,
        total: 2,
        page: 1,
        totalPages: 1,
      },
      isLoading: false,
    } as any);
  });

  it('1. Renders RecruiterPipelinePage with 7 Kanban stages and candidate cards', async () => {
    renderWithProviders(<RecruiterPipelinePage />);

    expect(screen.getByRole('heading', { name: 'Senior Full Stack Engineer' })).toBeInTheDocument();
    expect(screen.getByText(/Candidates in Pipeline/i)).toBeInTheDocument();

    // Verify Kanban stage headers exist
    expect(screen.getAllByText('Applied').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Screening').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Shortlisted').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Interview').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Offer').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Hired').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Rejected').length).toBeGreaterThanOrEqual(1);

    // Verify candidate names and ATS match scores
    expect(screen.getByText('Alice Walker')).toBeInTheDocument();
    expect(screen.getByText('Bob Martinez')).toBeInTheDocument();
    expect(screen.getByText('Charlie Green')).toBeInTheDocument();

    // Verify must-have skill match count
    expect(screen.getByText('3/3 Skills')).toBeInTheDocument();
    expect(screen.getByText('2/3 Skills')).toBeInTheDocument();
  });

  it('2. Switches view mode from Kanban to Table view', async () => {
    renderWithProviders(<RecruiterPipelinePage />);

    const tableModeBtn = screen.getByRole('button', { name: /Table/i });
    fireEvent.click(tableModeBtn);

    // Verify table headers are rendered
    expect(screen.getByText('Candidate')).toBeInTheDocument();
    expect(screen.getByText('ATS Match Score')).toBeInTheDocument();
    expect(screen.getByText('Must-Have Skills')).toBeInTheDocument();
    expect(screen.getByText('Pipeline Stage')).toBeInTheDocument();
    expect(screen.getByText('Team Rating')).toBeInTheDocument();
  });

  it('3. Selects multiple candidates and triggers bulk action bar', async () => {
    renderWithProviders(<RecruiterPipelinePage />);

    const checkboxes = screen.getAllByRole('checkbox');
    // Select first two candidates
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    // Floating action bar appears
    expect(screen.getByText(/2 candidates selected/i)).toBeInTheDocument();
    expect(screen.getByText(/Compare \(2\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Export CSV/i)).toBeInTheDocument();
  });

  it('4. Opens CandidateDetailDrawer and submits internal team note with star rating', async () => {
    renderWithProviders(<RecruiterPipelinePage />);

    const detailButtons = screen.getAllByText(/Details & Notes/i);
    fireEvent.click(detailButtons[0]);

    // Drawer opens showing candidate info and notes
    expect(screen.getByText('Candidate Contact Details')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Internal Team Notes \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText('Solid background in React and architecture.')).toBeInTheDocument();

    // Add note
    const textarea = screen.getByPlaceholderText(/Add private evaluation notes/i);
    fireEvent.change(textarea, { target: { value: 'Strong culture fit.' } });

    // Click 5-star rating button
    const starBtn = screen.getByLabelText('Rate 5 star');
    fireEvent.click(starBtn);

    const postBtn = screen.getByRole('button', { name: /Post Internal Note/i });
    fireEvent.click(postBtn);

    expect(mockAddNote).toHaveBeenCalledWith({
      applicationId: 'app-1',
      dto: {
        content: 'Strong culture fit.',
        rating: 5,
      },
    });
  });

  it('5. Renders TalentPoolPage with blind profiles masked for candidate privacy', async () => {
    renderWithProviders(<TalentPoolPage />);

    expect(screen.getByText('Talent Pool Sourcing')).toBeInTheDocument();
    expect(screen.getByText(/Found.*candidate profile/i)).toBeInTheDocument();

    // Public candidate (Dana White)
    expect(screen.getByText('Dana White')).toBeInTheDocument();
    expect(screen.getByText('Lead Cloud Architect')).toBeInTheDocument();
    expect(screen.getByText('Download CV')).toBeInTheDocument();

    // Blind candidate (Identity protected)
    expect(screen.getByText('Candidate #A1B2C3')).toBeInTheDocument();
    expect(screen.getByText('Blind Profile')).toBeInTheDocument();
    expect(screen.getByText('CV masked for privacy')).toBeInTheDocument();
  });
});
