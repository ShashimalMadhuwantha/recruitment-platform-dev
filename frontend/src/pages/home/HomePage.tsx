import React, { useState } from 'react';
import { ScoreBadge } from '../../components/ui/ScoreBadge';
import { ScoreBreakdown } from '../../components/shared/ScoreBreakdown';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { AtsScoreBreakdown } from '@recruitment-platform/shared';
import { apiClient } from '../../lib/api-client';

export const HomePage: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [isTestingApi, setIsTestingApi] = useState(false);

  // Demo Score Breakdown to verify frontend design rendering
  const demoBreakdown: AtsScoreBreakdown = {
    overallScore: 88,
    scoreBand: 'HIGH',
    bandLabel: 'Strong match',
    skillsMatch: {
      score: 92,
      weight: 40,
      weightedScore: 37,
      matchedItems: ['TypeScript', 'React', 'Node.js', 'MySQL'],
      missingItems: ['GraphQL'],
    },
    experienceMatch: {
      score: 85,
      weight: 25,
      weightedScore: 21,
    },
    educationMatch: {
      score: 100,
      weight: 15,
      weightedScore: 15,
    },
    semanticMatch: {
      score: 80,
      weight: 15,
      weightedScore: 12,
    },
    certificationMatch: {
      score: 60,
      weight: 5,
      weightedScore: 3,
      matchedItems: ['AWS Certified Developer'],
    },
    topMatchingTerms: ['TypeScript', 'React', 'monolith', 'REST API', 'MySQL', 'Node.js'],
    computedAt: new Date().toISOString(),
  };

  const checkApiHealth = async () => {
    setIsTestingApi(true);
    try {
      const res = await apiClient.get('/health');
      setHealthStatus(`Connected! Service: ${res.data.data.service} (Uptime: ${res.data.data.uptimeSeconds}s)`);
    } catch (err) {
      setHealthStatus(`Health Check Error: ${(err as Error).message}`);
    } finally {
      setIsTestingApi(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10 space-y-10">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-900 text-xs font-medium">
          <span>Epic 0 Active</span>
          <span>•</span>
          <span>Monorepo & Infrastructure Setup</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-brand-900 tracking-tight">
          Recruitment & ATS Platform
        </h1>
        <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
          Multi-tenant hiring platform with in-process deterministic ATS score predictions,
          role-specific dashboards, and zero-container single-server architecture.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Button variant="primary" onClick={checkApiHealth} isLoading={isTestingApi}>
            Test Backend /api/health
          </Button>
          <Button variant="secondary" onClick={() => window.open('https://github.com', '_blank')}>
            View Documentation
          </Button>
        </div>
        {healthStatus && (
          <p className="text-xs font-mono p-2.5 bg-surface border border-border-default rounded-lg text-brand-600">
            {healthStatus}
          </p>
        )}
      </div>

      {/* Design System Verification Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-base font-semibold text-text-primary mb-3">ATS Score Bands</h3>
          <p className="text-xs text-text-secondary mb-4">
            Standardized 3-tier scoring bands used across applicant & recruiter views:
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">High (80-100%):</span>
              <ScoreBadge score={92} size="sm" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Mid (50-79%):</span>
              <ScoreBadge score={68} size="sm" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Low (0-49%):</span>
              <ScoreBadge score={35} size="sm" />
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-text-primary mb-3">Pipeline Statuses</h3>
          <p className="text-xs text-text-secondary mb-4">
            Semantic state pills differentiated from score band colors:
          </p>
          <div className="flex flex-wrap gap-2">
            <StatusPill status="APPLIED" />
            <StatusPill status="SCREENING" />
            <StatusPill status="SHORTLISTED" />
            <StatusPill status="INTERVIEW" />
            <StatusPill status="OFFER" />
            <StatusPill status="HIRED" />
            <StatusPill status="REJECTED" />
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-text-primary mb-3">Platform Architecture</h3>
          <ul className="text-xs text-text-secondary space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-600"></span>
              <strong>Backend:</strong> Express.js Modular Monolith
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-600"></span>
              <strong>Database:</strong> MySQL + Prisma ORM
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-600"></span>
              <strong>Scoring:</strong> Rule-based + in-process TF-IDF
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-600"></span>
              <strong>Infra:</strong> PM2 + Nginx on Single VPS
            </li>
          </ul>
        </Card>
      </div>

      {/* Live Signature ATS Breakdown Component Demo */}
      <div>
        <h2 className="text-xl font-bold text-brand-900 mb-4">Signature ATS Score Component</h2>
        <ScoreBreakdown breakdown={demoBreakdown} />
      </div>
    </div>
  );
};

export default HomePage;
