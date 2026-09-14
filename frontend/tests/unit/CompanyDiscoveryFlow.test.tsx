import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CompanyDirectoryCard } from '../../src/features/company-discovery/components/CompanyDirectoryCard';
import { CompanyFilterBar } from '../../src/features/company-discovery/components/CompanyFilterBar';
import { CompanyHeroBanner } from '../../src/features/company-discovery/components/CompanyHeroBanner';
import { CompanyCultureGallery } from '../../src/features/company-discovery/components/CompanyCultureGallery';
import { CompanyLocationsList } from '../../src/features/company-discovery/components/CompanyLocationsList';
import { CompanyActiveJobsList } from '../../src/features/company-discovery/components/CompanyActiveJobsList';
import { CompanyDirectoryPage } from '../../src/pages/applicant/CompanyDirectoryPage';
import * as CompanyDiscoveryHooks from '../../src/features/company-discovery/hooks';
import * as AuthContext from '../../src/app/providers';
import type {
  PublicCompanySummaryDto,
  PublicCompanyDetailDto,
  PublicCompanyJobItemDto,
  PublicCompanyCultureMedia,
  PublicCompanyOfficeLocation,
} from '../../src/features/company-discovery/types';

// Mock company summary
const mockCompanySummary: PublicCompanySummaryDto = {
  id: 'comp-123',
  name: 'Acme Systems',
  slug: 'acme-systems',
  industry: 'Software & Cloud',
  size: '51-200',
  logoUrl: 'https://example.com/logo.png',
  coverPhotoUrl: 'https://example.com/cover.jpg',
  website: 'https://acme.example.com',
  description: 'Engineering resilient cloud applications.',
  headquarters: 'San Francisco, CA, United States',
  activeJobCount: 3,
  followerCount: 42,
  isFollowedByMe: false,
  createdAt: '2026-01-01T00:00:00Z',
};

// Mock company detail
const mockCompanyDetail: PublicCompanyDetailDto = {
  ...mockCompanySummary,
  locations: [
    {
      id: 'loc-1',
      name: 'Global HQ',
      isHQ: true,
      address: '100 Market St',
      city: 'San Francisco',
      state: 'CA',
      country: 'United States',
    },
    {
      id: 'loc-2',
      name: 'EU Tech Hub',
      isHQ: false,
      address: '20 King William St',
      city: 'London',
      country: 'United Kingdom',
    },
  ],
  cultureMedia: [
    {
      id: 'media-1',
      type: 'IMAGE',
      url: 'https://example.com/culture1.jpg',
      caption: 'Team sprint retro and celebration',
      order: 0,
    },
    {
      id: 'media-2',
      type: 'VIDEO',
      url: 'https://example.com/culture2.mp4',
      caption: 'Annual engineering demo day',
      order: 1,
    },
  ],
  socialLinks: {
    linkedin: 'https://linkedin.com/company/acme-systems',
    twitter: 'https://twitter.com/acme_systems',
    github: 'https://github.com/acme-systems',
  },
};

// Mock active jobs
const mockCompanyJobs: PublicCompanyJobItemDto[] = [
  {
    id: 'job-1',
    title: 'Senior Frontend Architect',
    department: 'Web Engineering',
    employmentType: 'FULL_TIME',
    workplaceType: 'HYBRID',
    location: 'San Francisco, CA',
    experienceLevel: '5+ yrs',
    salaryMin: 160000,
    salaryMax: 195000,
    salaryCurrency: 'USD',
    skills: ['React', 'TypeScript', 'Tailwind CSS'],
    createdAt: '2026-09-01T00:00:00Z',
    predictedAtsScore: 94,
    hasApplied: false,
  },
  {
    id: 'job-2',
    title: 'Backend Systems Engineer',
    department: 'Platform',
    employmentType: 'FULL_TIME',
    workplaceType: 'REMOTE',
    location: 'Remote',
    experienceLevel: '3+ yrs',
    salaryMin: 140000,
    salaryMax: 170000,
    salaryCurrency: 'USD',
    skills: ['Node.js', 'Express', 'MySQL'],
    createdAt: '2026-09-05T00:00:00Z',
    predictedAtsScore: 78,
    hasApplied: true,
  },
];

describe('Epic 18 — Applicant: Company Discovery & Employer Profile Hub (Frontend Flows)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();

    // Default mock user as authenticated applicant
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: {
        id: 'applicant-1',
        email: 'applicant@example.com',
        role: 'APPLICANT',
        status: 'ACTIVE',
        mfaEnabled: false,
      },
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('FR-AP-31: CompanyDirectoryCard displays company branding, openings, and follow status', () => {
    const handleToggleFollow = vi.fn();

    renderWithProviders(
      <CompanyDirectoryCard
        company={mockCompanySummary}
        onToggleFollow={handleToggleFollow}
      />
    );

    // Verify company name and badge
    expect(screen.getByText('Acme Systems')).toBeInTheDocument();
    expect(screen.getByText('Software & Cloud')).toBeInTheDocument();
    expect(screen.getByText('San Francisco, CA, United States')).toBeInTheDocument();
    expect(screen.getByText(/3 openings/i)).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();

    // Click follow toggle
    const followBtn = screen.getByTitle('Follow employer');
    fireEvent.click(followBtn);
    expect(handleToggleFollow).toHaveBeenCalledWith('comp-123');
  });

  it('FR-AP-31: CompanyFilterBar handles keyword, location, industry, and hiring filters', () => {
    const handleChange = vi.fn();
    const handleReset = vi.fn();

    renderWithProviders(
      <CompanyFilterBar
        filters={{
          keyword: '',
          industry: '',
          location: '',
          size: '',
          hasActiveJobs: false,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }}
        onChange={handleChange}
        onReset={handleReset}
        totalResults={1}
      />
    );

    // Keyword search input
    const keywordInput = screen.getByPlaceholderText(/Search company name/i);
    fireEvent.change(keywordInput, { target: { value: 'Fintech' } });
    expect(handleChange).toHaveBeenCalledWith({ keyword: 'Fintech' });

    // Location input
    const locationInput = screen.getByPlaceholderText(/City, region, or country/i);
    fireEvent.change(locationInput, { target: { value: 'London' } });
    expect(handleChange).toHaveBeenCalledWith({ location: 'London' });

    // Hiring now checkbox
    const hiringToggle = screen.getByRole('checkbox');
    fireEvent.click(hiringToggle);
    expect(handleChange).toHaveBeenCalledWith({ hasActiveJobs: true });
  });

  it('FR-AP-32: CompanyHeroBanner renders employer information, follow action, and share link', async () => {
    const handleToggleFollow = vi.fn();

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    renderWithProviders(
      <CompanyHeroBanner
        company={mockCompanyDetail}
        onToggleFollow={handleToggleFollow}
      />
    );

    expect(screen.getByRole('heading', { name: 'Acme Systems', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('51-200 employees')).toBeInTheDocument();
    expect(screen.getByText('Visit Website →')).toBeInTheDocument();
    expect(screen.getByText('Engineering resilient cloud applications.')).toBeInTheDocument();

    // Click follow
    const followBtn = screen.getByRole('button', { name: /Follow/i });
    fireEvent.click(followBtn);
    expect(handleToggleFollow).toHaveBeenCalled();

    // Click share button
    const shareBtn = screen.getByRole('button', { name: /Share/i });
    fireEvent.click(shareBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('FR-AP-32: CompanyCultureGallery displays images, video badges, and opens lightbox', () => {
    renderWithProviders(
      <CompanyCultureGallery
        media={mockCompanyDetail.cultureMedia}
        companyName="Acme Systems"
      />
    );

    expect(screen.getByText('Life & Culture at Acme Systems')).toBeInTheDocument();
    expect(screen.getByText('Team sprint retro and celebration')).toBeInTheDocument();

    // Click item to open lightbox modal
    const mediaCard = screen.getByText('Team sprint retro and celebration').closest('div');
    fireEvent.click(mediaCard!);

    // Lightbox modal counter and close button
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    const closeBtn = screen.getByTitle('Close (Esc)');
    fireEvent.click(closeBtn);
    expect(screen.queryByText('1 / 2')).not.toBeInTheDocument();
  });

  it('FR-AP-32: CompanyLocationsList displays office hubs and distinguishes Headquarters', () => {
    renderWithProviders(
      <CompanyLocationsList
        locations={mockCompanyDetail.locations}
        companyName="Acme Systems"
      />
    );

    expect(screen.getByText('Office Hubs & Locations')).toBeInTheDocument();
    expect(screen.getByText('Global HQ')).toBeInTheDocument();
    expect(screen.getByText('EU Tech Hub')).toBeInTheDocument();
    expect(screen.getByText('HQ')).toBeInTheDocument(); // Green HQ badge
  });

  it('FR-AP-33: CompanyActiveJobsList shows predicted ATS scores, applied badges, and apply triggers', () => {
    renderWithProviders(
      <CompanyActiveJobsList
        jobs={mockCompanyJobs}
        companyName="Acme Systems"
      />
    );

    // Verify job titles
    expect(screen.getByText('Senior Frontend Architect')).toBeInTheDocument();
    expect(screen.getByText('Backend Systems Engineer')).toBeInTheDocument();

    // Verify predicted ATS match score badge (94%)
    expect(screen.getByText('94%')).toBeInTheDocument();

    // Verify applied badge on second job
    expect(screen.getByText('Applied')).toBeInTheDocument();

    // Verify Apply Now and View Application buttons
    expect(screen.getByText('Apply Now')).toBeInTheDocument();
    expect(screen.getByText('View Application')).toBeInTheDocument();
  });

  it('FR-AP-35: CompanyDirectoryPage renders directory and supports Following tab', async () => {
    vi.spyOn(CompanyDiscoveryHooks, 'useCompanyDirectory').mockReturnValue({
      data: {
        items: [mockCompanySummary],
        total: 1,
        page: 1,
        limit: 12,
        totalPages: 1,
      },
      isLoading: false,
      isFetching: false,
    } as any);

    vi.spyOn(CompanyDiscoveryHooks, 'useFollowedCompanies').mockReturnValue({
      data: {
        items: [{ ...mockCompanySummary, isFollowedByMe: true }],
        total: 1,
        page: 1,
        limit: 12,
        totalPages: 1,
      },
      isLoading: false,
    } as any);

    vi.spyOn(CompanyDiscoveryHooks, 'useToggleCompanyFollow').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    renderWithProviders(<CompanyDirectoryPage />);

    expect(screen.getByText('Explore Great Companies')).toBeInTheDocument();
    expect(screen.getByText('Acme Systems')).toBeInTheDocument();

    // Switch to Following tab
    const followingTab = screen.getByRole('button', { name: /Following/i });
    fireEvent.click(followingTab);

    // Following tab should show followed companies
    expect(screen.getByText('Acme Systems')).toBeInTheDocument();
  });
});
