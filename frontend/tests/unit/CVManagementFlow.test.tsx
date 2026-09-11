import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CVManager } from '../../src/features/applicant-profile/components/CVManager';
import { CVBuilderModal } from '../../src/features/applicant-profile/components/CVBuilderModal';
import { CVVersionHistoryModal } from '../../src/features/applicant-profile/components/CVVersionHistoryModal';
import { SmartParseReviewModal } from '../../src/features/applicant-profile/components/SmartParseReviewModal';
import * as ProfileHooksModule from '../../src/features/applicant-profile/hooks';
import { applicantProfileApi } from '../../src/features/applicant-profile/api';
import type {
  ApplicantProfileDto,
  CVDto,
  CVVersionDto,
} from '../../src/features/applicant-profile/types';

const mockProfile: ApplicantProfileDto = {
  id: 'prof-123',
  userId: 'user-456',
  firstName: 'Alex',
  lastName: 'Turner',
  phone: '+1 555-0199',
  headline: 'Staff Full-Stack Architect & Cloud Specialist',
  summary: 'Architecting distributed platforms with React, Node.js, and TypeScript.',
  location: 'San Francisco, CA, USA',
  visibilitySettings: {
    visibility: 'PUBLIC',
    allowRecruiterContact: true,
  },
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
  completeness: {
    score: 95,
    personalInfo: true,
    workExperience: true,
    education: true,
    skills: true,
    resumeAttached: true,
    suggestions: [],
  },
  applicantSkills: [
    {
      id: 'askill-1',
      applicantId: 'prof-123',
      skillId: 's-1',
      proficiency: 5,
      yearsExperience: 6,
      skill: { id: 's-1', name: 'TypeScript', category: 'Languages' },
    },
    {
      id: 'askill-2',
      applicantId: 'prof-123',
      skillId: 's-2',
      proficiency: 5,
      yearsExperience: 5,
      skill: { id: 's-2', name: 'React', category: 'Frontend' },
    },
    {
      id: 'askill-3',
      applicantId: 'prof-123',
      skillId: 's-3',
      proficiency: 4,
      yearsExperience: 4,
      skill: { id: 's-3', name: 'Node.js', category: 'Backend' },
    },
  ],
  workExperiences: [
    {
      id: 'exp-1',
      applicantId: 'prof-123',
      companyName: 'Starlight Tech Inc.',
      title: 'Principal Software Engineer',
      startDate: '2021-04-01T00:00:00.000Z',
      isCurrent: true,
      description: 'Engineered high-throughput event processing pipelines.',
      skillsUsedJson: ['React', 'TypeScript', 'Node.js'],
    },
  ],
  educations: [
    {
      id: 'edu-1',
      applicantId: 'prof-123',
      institution: 'UC Berkeley',
      degree: 'B.S. in Electrical Engineering and Computer Sciences',
      fieldOfStudy: 'Computer Science',
      startDate: '2016-08-15T00:00:00.000Z',
      endDate: '2020-05-20T00:00:00.000Z',
      gpa: 3.85,
    },
  ],
  achievements: [],
  certifications: [
    {
      id: 'cert-1',
      applicantId: 'prof-123',
      name: 'AWS Certified Solutions Architect - Professional',
      issuer: 'Amazon Web Services',
      issueDate: '2023-01-15T00:00:00.000Z',
    },
  ],
  portfolios: [],
  cvs: [],
};

const mockResumes: CVDto[] = [
  {
    id: 'cv-1',
    applicantId: 'prof-123',
    fileRef: '/uploads/resumes/alex-fullstack.pdf',
    fileName: 'Alex_Turner_FullStack.pdf',
    fileSize: 185000,
    mimeType: 'application/pdf',
    isPrimary: true,
    versionLabel: 'Full-Stack Specialist CV',
    createdFrom: 'BUILDER',
    templateName: 'TECHNICAL_ATS',
    parsingStatus: 'COMPLETED',
    parsedJson: {
      contactInfo: { name: 'Alex Turner', email: 'alex@example.com' },
      detectedSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      workExperience: [
        {
          title: 'Principal Software Engineer',
          company: 'Starlight Tech Inc.',
          startDate: '2021',
          endDate: 'Present',
          description: 'Engineered high-throughput event processing pipelines.',
        },
      ],
      education: [
        {
          institution: 'UC Berkeley',
          degree: 'B.S. EECS',
        },
      ],
    },
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-09-10T12:00:00.000Z',
  },
  {
    id: 'cv-2',
    applicantId: 'prof-123',
    fileRef: '/uploads/resumes/alex-frontend.pdf',
    fileName: 'Alex_Turner_Frontend.pdf',
    fileSize: 220000,
    mimeType: 'application/pdf',
    isPrimary: false,
    versionLabel: 'Frontend UI/UX Specialist CV',
    createdFrom: 'UPLOAD',
    parsingStatus: 'COMPLETED',
    parsedJson: {
      contactInfo: { name: 'Alex Turner', email: 'alex@example.com' },
      detectedSkills: ['React', 'TypeScript', 'TailwindCSS', 'Next.js'],
      workExperience: [],
      education: [],
    },
    createdAt: '2026-09-08T09:00:00.000Z',
    updatedAt: '2026-09-08T09:00:00.000Z',
  },
];

const mockVersions: CVVersionDto[] = [
  {
    id: 'ver-2',
    cvId: 'cv-1',
    versionNumber: 2,
    versionLabel: 'Full-Stack Specialist CV (v2)',
    fileRef: '/uploads/resumes/alex-fullstack-v2.pdf',
    fileName: 'Alex_Turner_FullStack_v2.pdf',
    fileSize: 185000,
    mimeType: 'application/pdf',
    createdFrom: 'BUILDER',
    templateName: 'TECHNICAL_ATS',
    parsedJson: {
      contactInfo: { name: 'Alex Turner', email: 'alex@example.com' },
      detectedSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      workExperience: [],
      education: [],
    },
    createdAt: '2026-09-10T12:00:00.000Z',
  },
  {
    id: 'ver-1',
    cvId: 'cv-1',
    versionNumber: 1,
    versionLabel: 'Full-Stack Specialist CV (v1 Initial)',
    fileRef: '/uploads/resumes/alex-fullstack-v1.pdf',
    fileName: 'Alex_Turner_FullStack_v1.pdf',
    fileSize: 178000,
    mimeType: 'application/pdf',
    createdFrom: 'BUILDER',
    templateName: 'MODERN_CLEAN',
    parsedJson: {
      contactInfo: { name: 'Alex Turner', email: 'alex@example.com' },
      detectedSkills: ['TypeScript', 'React'],
      workExperience: [],
      education: [],
    },
    createdAt: '2026-09-10T10:00:00.000Z',
  },
];

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe('Frontend Epic 9: Applicant CV / Resume Management Flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(ProfileHooksModule, 'useApplicantProfile').mockReturnValue({
      data: mockProfile,
      isLoading: false,
    } as any);

    vi.spyOn(ProfileHooksModule, 'useResumes').mockReturnValue({
      data: mockResumes,
      isLoading: false,
    } as any);

    vi.spyOn(ProfileHooksModule, 'useCVVersions').mockReturnValue({
      data: mockVersions,
      isLoading: false,
    } as any);
  });

  it('1. CVManager renders all tailored CV versions with primary badges and keywords', () => {
    renderWithClient(<CVManager profile={mockProfile} resumes={mockResumes} />);

    // Header & Subtitle
    expect(screen.getByText('Applicant CV & Resume Management')).toBeInTheDocument();
    expect(screen.getByText(/Tailored CV Versions/)).toBeInTheDocument();

    // CV 1 (Built, Primary)
    expect(screen.getByText('Full-Stack Specialist CV')).toBeInTheDocument();
    expect(screen.getAllByText('Primary CV').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Technical ATS')).toBeInTheDocument();

    // CV 2 (Uploaded, Non-primary)
    expect(screen.getByText('Frontend UI/UX Specialist CV')).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();

    // Skills keywords preview
    expect(screen.getAllByText('TypeScript').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
  });

  it('2. CVManager supports inline version label editing', async () => {
    const updateLabelMock = vi.fn().mockResolvedValue({});
    vi.spyOn(ProfileHooksModule, 'useUpdateCVLabel').mockReturnValue({
      mutateAsync: updateLabelMock,
      isPending: false,
    } as any);

    renderWithClient(<CVManager profile={mockProfile} resumes={mockResumes} />);

    // Click edit pencil on first CV
    const editBtns = screen.getAllByTitle('Edit version label');
    fireEvent.click(editBtns[0]);

    // An input field should appear
    const input = screen.getByPlaceholderText(/e.g. Senior Frontend Specialist CV/i);
    expect(input).toBeInTheDocument();

    // Change label and save
    fireEvent.change(input, { target: { value: 'Staff Lead Architect CV' } });
    const saveBtn = screen.getByTitle('Save label');
    fireEvent.click(saveBtn);

    expect(updateLabelMock).toHaveBeenCalledWith({
      cvId: 'cv-1',
      versionLabel: 'Staff Lead Architect CV',
    });
  });

  it('3. CVBuilderModal allows selecting ATS templates, section toggles, and building PDF', async () => {
    const buildCvMock = vi.fn().mockResolvedValue({ id: 'cv-new' });
    vi.spyOn(ProfileHooksModule, 'useBuildCV').mockReturnValue({
      mutateAsync: buildCvMock,
      isPending: false,
    } as any);

    const onClose = vi.fn();

    renderWithClient(
      <CVBuilderModal
        profile={mockProfile}
        isOpen={true}
        onClose={onClose}
      />
    );

    // Modal Title & Templates
    expect(screen.getByText(/CV \/ Resume Builder/i)).toBeInTheDocument();
    expect(screen.getByText('Modern Clean')).toBeInTheDocument();
    expect(screen.getByText('Technical ATS')).toBeInTheDocument();
    expect(screen.getByText('Executive Classic')).toBeInTheDocument();

    // Select Technical ATS template
    fireEvent.click(screen.getByText('Technical ATS'));

    // Label input
    const labelInput = screen.getByDisplayValue('Full-Stack Specialist CV');
    fireEvent.change(labelInput, { target: { value: 'Platform Architect ATS CV' } });

    // Submit build button
    const generateBtn = screen.getByRole('button', { name: /Compile & Save CV Version/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(buildCvMock).toHaveBeenCalledWith(
        expect.objectContaining({
          template: 'TECHNICAL_ATS',
          versionLabel: 'Platform Architect ATS CV',
          includedSections: expect.objectContaining({
            skills: true,
            experience: true,
            education: true,
          }),
        })
      );
    });
  });

  it('4. CVVersionHistoryModal renders chronological versions and triggers restore rollback', async () => {
    const restoreMock = vi.fn().mockResolvedValue({});
    vi.spyOn(ProfileHooksModule, 'useRestoreCVVersion').mockReturnValue({
      mutateAsync: restoreMock,
      isPending: false,
    } as any);

    // Mock confirm dialog
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const onClose = vi.fn();

    renderWithClient(
      <CVVersionHistoryModal
        cv={mockResumes[0]}
        isOpen={true}
        onClose={onClose}
      />
    );

    // Timeline versions displayed
    expect(screen.getByText('CV Version History & Rollback')).toBeInTheDocument();
    expect(screen.getByText('Full-Stack Specialist CV (v2)')).toBeInTheDocument();
    expect(screen.getByText('Full-Stack Specialist CV (v1 Initial)')).toBeInTheDocument();
    expect(screen.getByText('Active Version')).toBeInTheDocument();

    // Click rollback on version 1
    const rollbackBtn = screen.getByRole('button', { name: /Rollback to this/i });
    fireEvent.click(rollbackBtn);

    await waitFor(() => {
      expect(restoreMock).toHaveBeenCalledWith({
        cvId: 'cv-1',
        versionId: 'ver-1',
      });
    });
  });

  it('5. SmartParseReviewModal allows selective entity confirmation before profile sync', async () => {
    const syncSelectiveMock = vi.fn().mockResolvedValue({
      success: true,
      message: 'Profile enriched with 3 skills!',
    });

    vi.spyOn(ProfileHooksModule, 'useSyncResumeSelective').mockReturnValue({
      mutateAsync: syncSelectiveMock,
      isPending: false,
    } as any);

    const onClose = vi.fn();

    renderWithClient(
      <SmartParseReviewModal
        cv={mockResumes[0]}
        isOpen={true}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Smart Resume Parse Verification')).toBeInTheDocument();
    expect(screen.getByText(/Detected Technical Skills/i)).toBeInTheDocument();

    // Toggle off one skill
    const skillChip = screen.getByText(/PostgreSQL/i);
    fireEvent.click(skillChip);

    // Submit selective sync
    const applyBtn = screen.getByRole('button', { name: /Confirm & Sync to Profile/i });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(syncSelectiveMock).toHaveBeenCalledWith({
        cvId: 'cv-1',
        data: expect.objectContaining({
          selectedSkillNames: expect.not.arrayContaining(['PostgreSQL']),
          importExperiences: true,
          importEducations: true,
        }),
      });
    });
  });
});
