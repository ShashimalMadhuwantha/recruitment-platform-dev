import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../../src/pages/home/HomePage';
import { apiClient } from '../../src/lib/api-client';

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('HomePage Landing Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderHomePage = () => {
    return render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
  };

  it('renders hero headline, proof metrics, and main action buttons', () => {
    renderHomePage();

    // Check main value proposition
    expect(
      screen.getByRole('heading', {
        name: /hiring decisions backed by transparent match scoring, not black-box guesswork/i,
      })
    ).toBeInTheDocument();

    // Check proof badges
    expect(screen.getByText(/instant in-process scoring/i)).toBeInTheDocument();
    expect(screen.getByText(/protected class isolation/i)).toBeInTheDocument();
    expect(screen.getByText(/explainable tf-idf \+ sql/i)).toBeInTheDocument();

    // Check primary CTAs
    const exploreBtn = screen.getByRole('button', { name: /explore job vacancies/i });
    expect(exploreBtn).toBeInTheDocument();
    fireEvent.click(exploreBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/jobs');

    const recruiterBtn = screen.getByRole('button', { name: /start hiring as recruiter/i });
    expect(recruiterBtn).toBeInTheDocument();
    fireEvent.click(recruiterBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/auth/register');
  });

  it('allows switching job profiles in the interactive ATS simulator', () => {
    renderHomePage();

    // Initially Lead Full-Stack Engineer is active
    expect(screen.getByText(/Alex Chen/i)).toBeInTheDocument();
    expect(screen.getAllByText(/88%/i).length).toBeGreaterThan(0);

    // Switch to Senior Product Designer
    const designerTab = screen.getByRole('button', { name: /Senior Product Designer/i });
    fireEvent.click(designerTab);

    expect(screen.getByText(/Elena Rostova/i)).toBeInTheDocument();
    expect(screen.getAllByText(/92%/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Design Systems/i).length).toBeGreaterThan(0);

    // Switch to Cloud DevOps Architect
    const devopsTab = screen.getByRole('button', { name: /Cloud DevOps Architect/i });
    fireEvent.click(devopsTab);

    expect(screen.getByText(/Marcus Vance/i)).toBeInTheDocument();
    expect(screen.getAllByText(/68%/i).length).toBeGreaterThan(0);
  });

  it('simulates adding missing credentials and updates the score in real-time', () => {
    renderHomePage();

    // Default: 88%
    expect(screen.getAllByText(/88%/i).length).toBeGreaterThan(0);

    // Click simulate profile tuning
    const simulateBtn = screen.getByRole('button', { name: /simulate adding missing credentials/i });
    fireEvent.click(simulateBtn);

    // Boosted score: 94%
    expect(screen.getAllByText(/94%/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Tuned Profile/i)).toBeInTheDocument();

    // Toggle back
    const resetBtn = screen.getByRole('button', { name: /reset to initial cv/i });
    fireEvent.click(resetBtn);
    expect(screen.getAllByText(/88%/i).length).toBeGreaterThan(0);
  });

  it('switches between Applicant, Recruiter, and Super Admin role tabs', () => {
    renderHomePage();

    // Default is Applicant tab
    expect(screen.getByText(/For Job Seekers \(Applicants\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Pre-Application ATS Preview/i)).toBeInTheDocument();

    // Switch to Recruiter tab
    const recruiterTab = screen.getByRole('button', { name: /For Recruiters & Hiring Teams/i });
    fireEvent.click(recruiterTab);
    expect(screen.getAllByText(/7-Stage Pipeline Kanban/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Side-by-Side Candidate Comparison/i)).toBeInTheDocument();

    // Switch to Super Admin tab
    const adminTab = screen.getByRole('button', { name: /For Super Admins & Compliance/i });
    fireEvent.click(adminTab);
    expect(screen.getByText(/Tenant Verification & Quotas/i)).toBeInTheDocument();
    expect(screen.getByText(/Global ATS Scoring Weight Tuner/i)).toBeInTheDocument();
  });

  it('toggles FAQ accordions', () => {
    renderHomePage();

    // First FAQ open by default
    expect(screen.getByText(/SRS §4.4 \(FR-ATS-09\) mandates strict protected-class isolation/i)).toBeInTheDocument();

    // Click another FAQ question
    const secondFaq = screen.getByText(/Can applicants see why they received a specific score\?/i);
    fireEvent.click(secondFaq);

    expect(
      screen.getByText(/Every applicant has access to the full 5-pillar breakdown for their applications/i)
    ).toBeInTheDocument();
  });

  it('pings the backend health check when probe button is clicked', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          service: 'recruitment-monolith',
          uptimeSeconds: 120,
        },
      },
    } as any);

    renderHomePage();

    const probeBtn = screen.getByRole('button', { name: /run health probe/i });
    fireEvent.click(probeBtn);

    await waitFor(() => {
      expect(screen.getByText(/Connected: recruitment-monolith \(Uptime: 120s\)/i)).toBeInTheDocument();
    });
  });
});
