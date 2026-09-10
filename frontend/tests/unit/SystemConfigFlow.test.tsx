import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminConfigPage } from '../../src/pages/admin/AdminConfigPage';
import * as ConfigHooksModule from '../../src/features/system-config/hooks';

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Frontend System Configuration Flow (Epic 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(ConfigHooksModule, 'useAtsWeights').mockReturnValue({
      data: {
        current: {
          id: 'w-1',
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
            id: 'engineering-tech',
            name: 'Engineering & Technical Roles',
            description: 'Focuses on verified technical skills and coding proficiency.',
            weights: {
              skillsWeight: 0.50,
              experienceWeight: 0.20,
              educationWeight: 0.10,
              semanticWeight: 0.15,
              certificationWeight: 0.05,
            },
          },
        ],
      },
      isLoading: false,
    } as any);

    vi.spyOn(ConfigHooksModule, 'useUpdateAtsWeights').mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);

    vi.spyOn(ConfigHooksModule, 'useSkillsTaxonomy').mockReturnValue({
      data: [
        {
          id: 's-1',
          name: 'TypeScript',
          category: 'Programming Languages',
          aliasesJson: ['TS', 'Typescript'],
          _count: { applicantSkills: 15, jobRequiredSkills: 8 },
        },
      ],
      isLoading: false,
    } as any);

    vi.spyOn(ConfigHooksModule, 'useCreateSkill').mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);

    vi.spyOn(ConfigHooksModule, 'useDeleteSkill').mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);

    vi.spyOn(ConfigHooksModule, 'useIndustries').mockReturnValue({
      data: [
        { id: 'ind-1', name: 'Information Technology', category: 'Technology', isActive: true },
      ],
      isLoading: false,
    } as any);

    vi.spyOn(ConfigHooksModule, 'useLocations').mockReturnValue({
      data: [
        { id: 'loc-1', city: 'San Francisco', state: 'CA', country: 'United States', isRemoteAllowed: true, isActive: true },
      ],
      isLoading: false,
    } as any);

    vi.spyOn(ConfigHooksModule, 'useNotificationTemplates').mockReturnValue({
      data: [
        {
          id: 'tmpl-1',
          name: 'Candidate Application Received',
          code: 'APP_RECEIVED',
          channel: 'EMAIL',
          subject: 'Application Received: {{job_title}}',
          body: 'Hello {{candidate_name}}, thank you for applying.',
          variablesJson: ['candidate_name', 'job_title'],
          isActive: true,
        },
      ],
      isLoading: false,
    } as any);

    vi.spyOn(ConfigHooksModule, 'useUpdateNotificationTemplate').mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);

    vi.spyOn(ConfigHooksModule, 'useIntegrations').mockReturnValue({
      data: [
        {
          id: 'int-1',
          provider: 'SMTP_EMAIL',
          status: 'CONNECTED',
          configJson: { host: 'smtp.sendgrid.net', port: '587' },
          lastTestedAt: '2026-03-01T12:00:00Z',
        },
      ],
      isLoading: false,
    } as any);

    vi.spyOn(ConfigHooksModule, 'useTestIntegration').mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ success: true, message: 'SMTP connected' }),
      isPending: false,
    } as any);

    vi.spyOn(ConfigHooksModule, 'useFeatureFlags').mockReturnValue({
      data: [
        {
          id: 'flag-1',
          key: 'ai_ats_scoring',
          name: 'AI-Powered ATS Match Scoring',
          description: 'Enables semantic parsing and resume matching',
          isGloballyEnabled: true,
          enabledTiersJson: ['PRO', 'ENTERPRISE'],
        },
      ],
      isLoading: false,
    } as any);

    vi.spyOn(ConfigHooksModule, 'useUpdateFeatureFlag').mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);
  });

  it('1. renders ATS Weight matrix and presets', () => {
    renderWithProviders(<AdminConfigPage />);

    expect(screen.getByText(/System Configuration & Taxonomy/i)).toBeInTheDocument();
    expect(screen.getByText(/Default ATS Weight Matrix/i)).toBeInTheDocument();
    expect(screen.getByText(/100% \/ 100%/i)).toBeInTheDocument();
    expect(screen.getByText(/Engineering & Technical Roles/i)).toBeInTheDocument();
  });

  it('2. switches to Master Taxonomy tab and displays skills with recognized aliases', () => {
    renderWithProviders(<AdminConfigPage />);

    const taxonomyTabBtn = screen.getByRole('button', { name: /Master Taxonomy/i });
    fireEvent.click(taxonomyTabBtn);

    expect(screen.getByText(/Skills Taxonomy & Synonym Dictionary/i)).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('TS')).toBeInTheDocument();
    expect(screen.getByText(/15 candidates • 8 jobs/i)).toBeInTheDocument();
  });

  it('3. switches to Notification Templates tab, selects template and toggles Live Preview', () => {
    renderWithProviders(<AdminConfigPage />);

    const templatesTabBtn = screen.getByRole('button', { name: /Notification Templates/i });
    fireEvent.click(templatesTabBtn);

    expect(screen.getByText(/System Templates/i)).toBeInTheDocument();
    const tmplItem = screen.getByText('Candidate Application Received');
    fireEvent.click(tmplItem);

    expect(screen.getByText(/Code: APP_RECEIVED/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Application Received: {{job_title}}/i)).toBeInTheDocument();

    const previewBtn = screen.getByRole('button', { name: /Live Preview/i });
    fireEvent.click(previewBtn);

    expect(screen.getByText('Subject Preview')).toBeInTheDocument();
    expect(screen.getByText(/Staff Software Engineer/i)).toBeInTheDocument();
  });

  it('4. switches to Integrations tab and triggers Connection Test', async () => {
    renderWithProviders(<AdminConfigPage />);

    const integrationsTabBtn = screen.getByRole('button', { name: /Integrations & APIs/i });
    fireEvent.click(integrationsTabBtn);

    expect(screen.getByText(/SMTP Mail Delivery Service/i)).toBeInTheDocument();
    expect(screen.getByText('CONNECTED')).toBeInTheDocument();

    const testBtn = screen.getByRole('button', { name: /Test Connection/i });
    fireEvent.click(testBtn);
  });

  it('5. switches to Feature Flags tab and displays Plan Tier matrix', () => {
    renderWithProviders(<AdminConfigPage />);

    const flagsTabBtn = screen.getByRole('button', { name: /Feature Flags & Matrix/i });
    fireEvent.click(flagsTabBtn);

    expect(screen.getByText(/Feature Flag & Plan Tier Capability Matrix/i)).toBeInTheDocument();
    expect(screen.getByText('AI-Powered ATS Match Scoring')).toBeInTheDocument();
    expect(screen.getByText('flag: ai_ats_scoring')).toBeInTheDocument();
  });
});
