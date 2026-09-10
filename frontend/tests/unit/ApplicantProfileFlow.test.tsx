import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApplicantProfilePage } from '../../src/pages/applicant/ApplicantProfilePage';
import { CompletenessMeter } from '../../src/features/applicant-profile/components/CompletenessMeter';
import { ResumeUploader } from '../../src/features/applicant-profile/components/ResumeUploader';
import { BlindRecruitmentPreviewModal } from '../../src/features/applicant-profile/components/BlindRecruitmentPreviewModal';
import * as ProfileHooksModule from '../../src/features/applicant-profile/hooks';
import type { ApplicantProfileDto, AnonymizedProfileDto } from '../../src/features/applicant-profile/types';

const mockProfile: ApplicantProfileDto = {
  id: 'prof-123',
  userId: 'user-456',
  firstName: 'Jane',
  lastName: 'Doe',
  phone: '+1 555-0199',
  headline: 'Senior Full Stack Software Architect',
  summary: 'Passionate software engineer with 7+ years experience.',
  location: 'San Francisco, CA, USA',
  visibilitySettings: {
    visibility: 'PUBLIC',
    allowRecruiterContact: true,
  },
  completeness: {
    score: 85,
    personalInfo: true,
    workExperience: true,
    education: true,
    skills: true,
    resumeAttached: false,
    suggestions: ['Upload your CV / resume document (+15%)'],
  },
  applicantSkills: [
    {
      id: 'askill-1',
      applicantId: 'prof-123',
      skillId: 'skill-1',
      proficiency: 5,
      yearsExperience: 4,
      skill: { id: 'skill-1', name: 'TypeScript', category: 'Programming Languages' },
    },
    {
      id: 'askill-2',
      applicantId: 'prof-123',
      skillId: 'skill-2',
      proficiency: 4,
      yearsExperience: 3,
      skill: { id: 'skill-2', name: 'React', category: 'Frontend' },
    },
  ],
  educations: [
    {
      id: 'edu-1',
      applicantId: 'prof-123',
      institution: 'Stanford University',
      degree: 'Master of Science',
      fieldOfStudy: 'Computer Science',
      startDate: '2018-09-01T00:00:00.000Z',
      endDate: '2020-06-15T00:00:00.000Z',
      gpa: 3.9,
    },
  ],
  workExperiences: [
    {
      id: 'exp-1',
      applicantId: 'prof-123',
      companyName: 'Acme Cloud Systems',
      title: 'Lead Architect',
      startDate: '2021-03-01T00:00:00.000Z',
      isCurrent: true,
      description: 'Architecting high-scale distributed systems.',
      skillsUsedJson: ['TypeScript', 'Node.js', 'React'],
    },
  ],
  achievements: [],
  certifications: [
    {
      id: 'cert-1',
      applicantId: 'prof-123',
      name: 'AWS Certified Solutions Architect',
      issuer: 'Amazon Web Services',
      issueDate: '2023-05-10T00:00:00.000Z',
      credentialUrl: 'https://aws.amazon.com/verification/12345',
    },
  ],
  portfolios: [
    {
      id: 'port-1',
      applicantId: 'prof-123',
      type: 'GITHUB',
      url: 'https://github.com/janedoe',
    },
  ],
  cvs: [
    {
      id: 'cv-1',
      applicantId: 'prof-123',
      fileRef: '/uploads/resumes/cv1.pdf',
      fileName: 'Jane_Doe_CV.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf',
      parsingStatus: 'COMPLETED',
      versionLabel: 'v1',
      isPrimary: true,
      createdAt: '2026-03-01T10:00:00.000Z',
      parsedJson: {
        contactInfo: { email: 'jane.doe@example.com', phone: '+1 555-0199' },
        detectedSkills: ['TypeScript', 'React', 'Node.js'],
        workExperience: [{ title: 'Lead Architect', company: 'Acme Cloud Systems' }],
        education: [{ degree: 'Master of Science', institution: 'Stanford University' }],
      },
      parsedText: 'Jane Doe Resume Plain Text',
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
};

const mockAnonymizedProfile: AnonymizedProfileDto = {
  applicantId: 'prof-123',
  candidatePseudonym: 'Candidate #PROF1234',
  headline: 'Senior Full Stack Software Architect',
  summary: 'Passionate software engineer with 7+ years experience.',
  generalLocation: 'California Region',
  skills: [
    { name: 'TypeScript', category: 'Programming Languages', proficiency: 5, yearsExperience: 4 },
    { name: 'React', category: 'Frontend', proficiency: 4, yearsExperience: 3 },
  ],
  anonymizedExperiences: [
    {
      id: 'exp-1',
      title: 'Lead Architect',
      generalizedCompany: '[Enterprise Technology Organization]',
      startDate: '2021-03-01',
      isCurrent: true,
      description: 'Architecting high-scale distributed systems.',
      skillsUsed: ['TypeScript', 'Node.js'],
    },
  ],
  anonymizedEducations: [
    {
      id: 'edu-1',
      degree: 'Master of Science',
      fieldOfStudy: 'Computer Science',
      institutionTier: '[Accredited Higher Education Institution]',
      endDate: '2020-06-15',
    },
  ],
  certifications: [
    {
      name: 'AWS Certified Solutions Architect',
      issuer: 'Amazon Web Services',
      issueDate: '2023-05-10',
    },
  ],
  completenessScore: 85,
  blindRecruitmentNotice: 'Protected PII has been redacted to enforce anti-bias standards.',
};

const renderWithProviders = (ui: React.ReactElement, initialRoute = '/applicant/profile') => {
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

describe('Frontend Applicant Profile & Resume Flow (Epic 6)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(ProfileHooksModule, 'useApplicantProfile').mockReturnValue({
      data: mockProfile,
      isLoading: false,
      isError: false,
    } as any);

    vi.spyOn(ProfileHooksModule, 'useTaxonomySkills').mockReturnValue({
      data: [
        { id: 'skill-1', name: 'TypeScript', category: 'Programming Languages' },
        { id: 'skill-2', name: 'React', category: 'Frontend' },
        { id: 'skill-3', name: 'Python', category: 'Programming Languages' },
      ],
      isLoading: false,
    } as any);

    vi.spyOn(ProfileHooksModule, 'useResumes').mockReturnValue({
      data: mockProfile.cvs,
      isLoading: false,
    } as any);

    vi.spyOn(ProfileHooksModule, 'useAnonymizedPreview').mockReturnValue({
      data: mockAnonymizedProfile,
      isLoading: false,
    } as any);

    vi.spyOn(ProfileHooksModule, 'useUpdateProfile').mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);

    vi.spyOn(ProfileHooksModule, 'useAddExperience').mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);

    vi.spyOn(ProfileHooksModule, 'useAddEducation').mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);

    vi.spyOn(ProfileHooksModule, 'useAddSkill').mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);

    vi.spyOn(ProfileHooksModule, 'useUploadResume').mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);

    vi.spyOn(ProfileHooksModule, 'useApplyResumeToProfile').mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ success: true }),
      isPending: false,
    } as any);
  });

  it('1. Renders profile header and completeness meter with readiness breakdown', () => {
    renderWithProviders(<ApplicantProfilePage />);

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Senior Full Stack Software Architect')).toBeInTheDocument();
    expect(screen.getByText('Profile Completeness')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('Strong Profile')).toBeInTheDocument();
    expect(screen.getByText(/Upload your CV \/ resume document/)).toBeInTheDocument();
  });

  it('2. Navigates between profile builder tabs (Basic, Experience, Education, Skills, Resume)', () => {
    renderWithProviders(<ApplicantProfilePage />);

    // Click Work Experience tab
    const expTabs = screen.getAllByRole('button', { name: /Work Experience/i });
    fireEvent.click(expTabs[expTabs.length - 1]);
    expect(screen.getByText('Acme Cloud Systems')).toBeInTheDocument();
    expect(screen.getByText('Lead Architect')).toBeInTheDocument();

    // Click Skills tab
    const skillsTabs = screen.getAllByRole('button', { name: /Skills/i });
    fireEvent.click(skillsTabs[skillsTabs.length - 1]);
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('3. CompletenessMeter triggers tab navigation and blind preview modal', () => {
    const onBlindPreview = vi.fn();
    const onNavigateTab = vi.fn();

    render(
      <CompletenessMeter
        completeness={mockProfile.completeness}
        onOpenBlindPreview={onBlindPreview}
        onNavigateTab={onNavigateTab}
      />
    );

    const blindBtn = screen.getByRole('button', { name: /Blind Recruitment Preview/i });
    fireEvent.click(blindBtn);
    expect(onBlindPreview).toHaveBeenCalled();

    const eduPill = screen.getByText('Education History');
    fireEvent.click(eduPill);
    expect(onNavigateTab).toHaveBeenCalledWith('education');
  });

  it('4. ResumeUploader displays uploaded documents, primary badge, and opens parsed entities drawer', async () => {
    const onUpload = vi.fn().mockResolvedValue({});
    const onDelete = vi.fn().mockResolvedValue({});
    const onSetPrimary = vi.fn().mockResolvedValue({});
    const onApply = vi.fn().mockResolvedValue({});

    render(
      <ResumeUploader
        resumes={mockProfile.cvs}
        onUpload={onUpload}
        onDelete={onDelete}
        onSetPrimary={onSetPrimary}
        onApplyToProfile={onApply}
        isUploading={false}
      />
    );

    expect(screen.getByText('Jane_Doe_CV.pdf')).toBeInTheDocument();
    expect(screen.getByText('Primary CV')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();

    // Click View Parsed Data
    const viewBtn = screen.getByRole('button', { name: /View Parsed Data/i });
    fireEvent.click(viewBtn);

    expect(screen.getByText('Parsed Resume Entities')).toBeInTheDocument();
    expect(screen.getByText('jane.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('✓ TypeScript')).toBeInTheDocument();

    // Click Apply Parsed Data to Profile
    const applyBtn = screen.getByRole('button', { name: /Apply Parsed Data to Profile/i });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledWith('cv-1');
    });
  });

  it('5. BlindRecruitmentPreviewModal redacts PII and displays anti-bias protections', () => {
    const onClose = vi.fn();
    render(
      <BlindRecruitmentPreviewModal
        isOpen={true}
        onClose={onClose}
        anonymizedProfile={mockAnonymizedProfile}
        isLoading={false}
      />
    );

    expect(screen.getByText('Candidate #PROF1234')).toBeInTheDocument();
    expect(screen.getByText(/Anti-Bias Anonymization Enabled/i)).toBeInTheDocument();
    expect(screen.getByText('[Enterprise Technology Organization]')).toBeInTheDocument();
    expect(screen.getByText('[Accredited Higher Education Institution]')).toBeInTheDocument();

    // PII should be redacted
    expect(screen.queryByText('jane.doe@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText('+1 555-0199')).not.toBeInTheDocument();

    // Close modal
    const closeBtn = screen.getByRole('button', { name: /Close Preview/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
