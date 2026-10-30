import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Users,
  Sliders,
  Sparkles,
  Lock,
  Scale,
  FileText,
  Building2,
  ChevronDown,
  ChevronUp,
  Zap,
  Briefcase,
  Clock,
  Target,
  Compass,
  Eye,
  RefreshCw,
  HelpCircle,
  Check,
  Layers,
  Award,
  BookOpen,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ScoreBadge } from '../../components/ui/ScoreBadge';
import { ScoreBreakdown } from '../../components/shared/ScoreBreakdown';
import { StatusPill } from '../../components/ui/StatusPill';
import { AtsScoreBreakdown, ApplicationStatus } from '@recruitment-platform/shared';
import { apiClient } from '../../lib/api-client';

// Demo dataset representing realistic ATS scoring breakdowns per job profile
interface DemoJobData {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  candidateName: string;
  candidateRole: string;
  candidateExp: string;
  breakdown: AtsScoreBreakdown;
  boostedBreakdown: AtsScoreBreakdown;
  improvementTip: string;
}

const DEMO_JOBS: Record<string, DemoJobData> = {
  fullstack: {
    id: 'fullstack',
    title: 'Lead Full-Stack Engineer',
    company: 'Fintech Nexus (Tenant)',
    location: 'Hybrid • New York, NY',
    salary: '$145,000 – $175,000',
    candidateName: 'Alex Chen',
    candidateRole: 'Senior TypeScript / Node.js Developer',
    candidateExp: '6 years verified experience',
    breakdown: {
      overallScore: 88,
      scoreBand: 'HIGH',
      bandLabel: 'Strong match',
      skillsMatch: {
        score: 92,
        weight: 40,
        weightedScore: 36.8,
        matchedItems: ['TypeScript', 'React 18', 'Node.js', 'MySQL', 'REST APIs'],
        missingItems: ['GraphQL'],
      },
      experienceMatch: {
        score: 85,
        weight: 25,
        weightedScore: 21.25,
      },
      educationMatch: {
        score: 100,
        weight: 15,
        weightedScore: 15.0,
      },
      semanticMatch: {
        score: 80,
        weight: 15,
        weightedScore: 12.0,
      },
      certificationMatch: {
        score: 60,
        weight: 5,
        weightedScore: 3.0,
        matchedItems: ['AWS Certified Developer'],
      },
      topMatchingTerms: ['TypeScript', 'React', 'modular monolith', 'REST API', 'MySQL', 'Node.js'],
      computedAt: new Date().toISOString(),
    },
    boostedBreakdown: {
      overallScore: 94,
      scoreBand: 'HIGH',
      bandLabel: 'Strong match',
      skillsMatch: {
        score: 100,
        weight: 40,
        weightedScore: 40.0,
        matchedItems: ['TypeScript', 'React 18', 'Node.js', 'MySQL', 'REST APIs', 'GraphQL (Added)'],
        missingItems: [],
      },
      experienceMatch: {
        score: 85,
        weight: 25,
        weightedScore: 21.25,
      },
      educationMatch: {
        score: 100,
        weight: 15,
        weightedScore: 15.0,
      },
      semanticMatch: {
        score: 86,
        weight: 15,
        weightedScore: 12.9,
      },
      certificationMatch: {
        score: 100,
        weight: 5,
        weightedScore: 5.0,
        matchedItems: ['AWS Certified Developer', 'GraphQL Master Certification'],
      },
      topMatchingTerms: ['TypeScript', 'React', 'GraphQL', 'modular monolith', 'REST API', 'MySQL'],
      computedAt: new Date().toISOString(),
    },
    improvementTip: "Adding verified 'GraphQL' experience and schema architecture raises this candidate's score from 88% to 94%.",
  },
  designer: {
    id: 'designer',
    title: 'Senior Product Designer',
    company: 'CloudMatrix SaaS',
    location: 'Remote • Global',
    salary: '$130,000 – $160,000',
    candidateName: 'Elena Rostova',
    candidateRole: 'Principal UX/UI Designer',
    candidateExp: '5.5 years in B2B systems',
    breakdown: {
      overallScore: 92,
      scoreBand: 'HIGH',
      bandLabel: 'Strong match',
      skillsMatch: {
        score: 95,
        weight: 40,
        weightedScore: 38.0,
        matchedItems: ['Figma', 'Design Systems', 'User Research', 'Prototyping', 'WCAG 2.1 AA'],
        missingItems: ['Webflow'],
      },
      experienceMatch: {
        score: 90,
        weight: 25,
        weightedScore: 22.5,
      },
      educationMatch: {
        score: 90,
        weight: 15,
        weightedScore: 13.5,
      },
      semanticMatch: {
        score: 88,
        weight: 15,
        weightedScore: 13.2,
      },
      certificationMatch: {
        score: 80,
        weight: 5,
        weightedScore: 4.0,
        matchedItems: ['Nielsen Norman UX Certified'],
      },
      topMatchingTerms: ['Design Systems', 'WCAG AA', 'Design Tokens', 'User Journey', 'Usability Testing'],
      computedAt: new Date().toISOString(),
    },
    boostedBreakdown: {
      overallScore: 97,
      scoreBand: 'HIGH',
      bandLabel: 'Strong match',
      skillsMatch: {
        score: 100,
        weight: 40,
        weightedScore: 40.0,
        matchedItems: ['Figma', 'Design Systems', 'User Research', 'Prototyping', 'WCAG 2.1 AA', 'Webflow'],
        missingItems: [],
      },
      experienceMatch: {
        score: 92,
        weight: 25,
        weightedScore: 23.0,
      },
      educationMatch: {
        score: 95,
        weight: 15,
        weightedScore: 14.25,
      },
      semanticMatch: {
        score: 94,
        weight: 15,
        weightedScore: 14.1,
      },
      certificationMatch: {
        score: 100,
        weight: 5,
        weightedScore: 5.0,
        matchedItems: ['Nielsen Norman UX Certified', 'Accessible UI Specialist'],
      },
      topMatchingTerms: ['Design Systems', 'WCAG AA', 'Design Tokens', 'Webflow', 'Usability Testing'],
      computedAt: new Date().toISOString(),
    },
    improvementTip: "Candidate meets core UX benchmarks; highlighting Design System tokens and Webflow increases match to 97%.",
  },
  devops: {
    id: 'devops',
    title: 'Cloud DevOps Architect',
    company: 'Apex Infrastructure',
    location: 'Hybrid • Austin, TX',
    salary: '$150,000 – $185,000',
    candidateName: 'Marcus Vance',
    candidateRole: 'Systems & Cloud Engineer',
    candidateExp: '4 years verified systems tenure',
    breakdown: {
      overallScore: 68,
      scoreBand: 'MID',
      bandLabel: 'Partial match',
      skillsMatch: {
        score: 65,
        weight: 40,
        weightedScore: 26.0,
        matchedItems: ['Linux Systems', 'AWS Services', 'Docker', 'Git'],
        missingItems: ['Kubernetes', 'Terraform', 'Prometheus'],
      },
      experienceMatch: {
        score: 75,
        weight: 25,
        weightedScore: 18.75,
      },
      educationMatch: {
        score: 80,
        weight: 15,
        weightedScore: 12.0,
      },
      semanticMatch: {
        score: 64,
        weight: 15,
        weightedScore: 9.6,
      },
      certificationMatch: {
        score: 40,
        weight: 5,
        weightedScore: 2.0,
        matchedItems: ['AWS Certified Cloud Practitioner'],
      },
      topMatchingTerms: ['AWS', 'Linux Systems', 'Docker Containers', 'Bash Scripting'],
      computedAt: new Date().toISOString(),
    },
    boostedBreakdown: {
      overallScore: 86,
      scoreBand: 'HIGH',
      bandLabel: 'Strong match',
      skillsMatch: {
        score: 88,
        weight: 40,
        weightedScore: 35.2,
        matchedItems: ['Linux Systems', 'AWS Services', 'Docker', 'Git', 'Kubernetes (Added)', 'Terraform (Added)'],
        missingItems: ['Prometheus'],
      },
      experienceMatch: {
        score: 80,
        weight: 25,
        weightedScore: 20.0,
      },
      educationMatch: {
        score: 80,
        weight: 15,
        weightedScore: 12.0,
      },
      semanticMatch: {
        score: 78,
        weight: 15,
        weightedScore: 11.7,
      },
      certificationMatch: {
        score: 80,
        weight: 5,
        weightedScore: 4.0,
        matchedItems: ['AWS Solutions Architect', 'CKA Kubernetes'],
      },
      topMatchingTerms: ['Kubernetes', 'Terraform', 'AWS', 'Docker Containers', 'Linux Systems'],
      computedAt: new Date().toISOString(),
    },
    improvementTip: "Candidate has strong foundational Linux/AWS skills. Adding Kubernetes and Terraform elevates this profile to 86% Strong Match.",
  },
};

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Interactive state
  const [selectedDemoKey, setSelectedDemoKey] = useState<string>('fullstack');
  const [isSimulatingSkillAddition, setIsSimulatingSkillAddition] = useState<boolean>(false);
  const [activeRoleTab, setActiveRoleTab] = useState<'applicant' | 'recruiter' | 'admin'>('applicant');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [isTestingApi, setIsTestingApi] = useState(false);

  const currentDemo = DEMO_JOBS[selectedDemoKey];
  const activeBreakdown = isSimulatingSkillAddition
    ? currentDemo.boostedBreakdown
    : currentDemo.breakdown;

  const checkApiHealth = async () => {
    setIsTestingApi(true);
    try {
      const res = await apiClient.get('/health');
      setHealthStatus(`Connected: ${res.data.data.service} (Uptime: ${res.data.data.uptimeSeconds}s)`);
    } catch (err) {
      setHealthStatus(`Health Check Error: ${(err as Error).message}`);
    } finally {
      setIsTestingApi(false);
    }
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  return (
    <div className="w-full bg-surface-muted text-text-primary">
      {/* ─────────────────────────────────────────────────────────────────────────
          1. HERO SECTION: Dual-Audience Value Proposition
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="border-b border-border-default bg-surface">
        <div className="max-w-[1280px] mx-auto px-6 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-900 text-xs font-medium border border-border-default/50">
                <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse"></span>
                <span>Deterministic &amp; Explainable Hiring</span>
                <span className="text-border-default">•</span>
                <span>Multi-Tenant ATS Platform</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold text-brand-900 tracking-tight leading-[1.15]">
                Hiring decisions backed by transparent match scoring, not black-box guesswork.
              </h1>

              <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl">
                The unified recruitment platform connecting job seekers, hiring teams, and platform administrators.
                Applicants preview deterministic match scores before applying; recruiters manage 7-stage pipelines with
                unbiased 5-pillar candidate scoring; and platform owners govern multi-tenant compliance with audit logging.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/jobs')}
                  className="gap-2"
                >
                  <span>Explore Job Vacancies</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate('/auth/register')}
                  className="gap-2"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Start Hiring as Recruiter</span>
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => {
                    const el = document.getElementById('interactive-simulator');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="gap-1.5 text-xs text-text-secondary"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  <span>See Live ATS Demo</span>
                </Button>
              </div>

              {/* Proof Metric Badges */}
              <div className="pt-6 border-t border-border-default grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-2xl font-bold text-brand-900">&lt;10s</div>
                  <div className="text-xs text-text-secondary mt-0.5">Instant In-Process Scoring</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-brand-900">Zero-Bias</div>
                  <div className="text-xs text-text-secondary mt-0.5">Protected Class Isolation</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-brand-900">100%</div>
                  <div className="text-xs text-text-secondary mt-0.5">Explainable TF-IDF + SQL</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-brand-900">99.9%</div>
                  <div className="text-xs text-text-secondary mt-0.5">Monolith System SLA</div>
                </div>
              </div>
            </div>

            {/* Right Hero Preview Card */}
            <div className="lg:col-span-5">
              <Card className="border-border-default bg-surface p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-border-default">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Applicant Preview
                    </span>
                    <h3 className="text-base font-semibold text-brand-900">
                      Lead Full-Stack Engineer
                    </h3>
                    <p className="text-xs text-text-muted">Fintech Nexus • Hybrid</p>
                  </div>
                  <ScoreBadge score={88} size="md" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span>Taxonomy Skills Match (40%)</span>
                    <span className="font-semibold text-text-primary">92%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-border-default overflow-hidden">
                    <div className="h-full bg-score-high rounded-full w-[92%]"></div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span>Experience Duration &amp; Relevance (25%)</span>
                    <span className="font-semibold text-text-primary">85%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-border-default overflow-hidden">
                    <div className="h-full bg-score-high rounded-full w-[85%]"></div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span>Contextual TF-IDF Similarity (15%)</span>
                    <span className="font-semibold text-text-primary">80%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-border-default overflow-hidden">
                    <div className="h-full bg-score-high rounded-full w-[80%]"></div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-surface-muted border border-border-default text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-medium text-brand-900">
                    <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                    <span>Real-Time Profile Advice:</span>
                  </div>
                  <p className="text-text-secondary text-[11px] leading-relaxed">
                    "Candidate profile satisfies 4 of 5 must-have skills. Adding verified GraphQL expertise moves predicted match to 94%."
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-text-secondary flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-score-high" />
                    <span>GDPR &amp; Bias Shielded</span>
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/applicant/dashboard')}
                  >
                    View My Tracker
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          2. SIGNATURE INTERACTIVE ATS SIMULATOR: See How Scoring Works
      ────────────────────────────────────────────────────────────────────────── */}
      <section id="interactive-simulator" className="py-16 sm:py-20 border-b border-border-default">
        <div className="max-w-[1280px] mx-auto px-6 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-900 text-xs font-medium">
              <Zap className="w-3.5 h-3.5 text-brand-600" />
              <span>Interactive Evaluation Simulator</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-900">
              The platform's signature ATS engine in action
            </h2>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Experience the exact deterministic scoring algorithm used when an applicant submits their CV.
              Switch job profiles, inspect the five weighted dimensions, and simulate real-time profile optimization.
            </p>
          </div>

          {/* Job Profile Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {Object.values(DEMO_JOBS).map((job) => {
              const isSelected = selectedDemoKey === job.id;
              return (
                <button
                  key={job.id}
                  onClick={() => {
                    setSelectedDemoKey(job.id);
                    setIsSimulatingSkillAddition(false);
                  }}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors border ${
                    isSelected
                      ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                      : 'bg-surface text-text-secondary border-border-default hover:bg-surface-muted hover:text-text-primary'
                  }`}
                >
                  <span>{job.title}</span>
                  <span className="ml-2 text-[11px] opacity-80">({job.company.split(' ')[0]})</span>
                </button>
              );
            })}
          </div>

          {/* Candidate Card & Simulator View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Candidate & Job Context Details */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Target Vacancy Requisition
                  </span>
                  <h3 className="text-base font-bold text-brand-900">{currentDemo.title}</h3>
                  <p className="text-xs text-text-secondary">{currentDemo.company} • {currentDemo.location}</p>
                  <p className="text-xs font-medium text-brand-600 pt-1">{currentDemo.salary}</p>
                </div>

                <div className="pt-3 border-t border-border-default space-y-2">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Simulated Candidate
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-900 font-semibold text-sm">
                      {currentDemo.candidateName.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-text-primary">{currentDemo.candidateName}</div>
                      <div className="text-xs text-text-secondary">{currentDemo.candidateRole}</div>
                      <div className="text-[11px] text-text-muted">{currentDemo.candidateExp}</div>
                    </div>
                  </div>
                </div>

                {/* Real-Time Skill Addition Interactive Control */}
                <div className="pt-3 border-t border-border-default space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-primary">Simulate Profile Tuning:</span>
                    <span className="text-[11px] text-brand-600 font-medium">
                      {isSimulatingSkillAddition ? 'Tuned Profile' : 'Raw CV Upload'}
                    </span>
                  </div>
                  <Button
                    variant={isSimulatingSkillAddition ? 'secondary' : 'primary'}
                    size="sm"
                    className="w-full text-xs gap-1.5"
                    onClick={() => setIsSimulatingSkillAddition(!isSimulatingSkillAddition)}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingSkillAddition ? 'animate-spin' : ''}`} />
                    <span>
                      {isSimulatingSkillAddition ? 'Reset to Initial CV' : 'Simulate Adding Missing Credentials'}
                    </span>
                  </Button>
                </div>

                {/* Dynamic Advice Box */}
                <div className="p-3 rounded-lg bg-surface-muted border border-border-default text-xs space-y-1">
                  <div className="font-semibold text-brand-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                    <span>Algorithmic Explainability</span>
                  </div>
                  <p className="text-text-secondary text-[11px] leading-relaxed">
                    {currentDemo.improvementTip}
                  </p>
                </div>
              </Card>

              {/* Verified Scoring SLA Box */}
              <div className="p-4 rounded-lg bg-surface border border-border-default space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-900">
                  <Scale className="w-4 h-4 text-brand-600" />
                  <span>SRS §4.3 Scoring Compliance</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Scoring executes inside the Node.js modular monolith using pure SQL set-overlap and in-process
                  TF-IDF vectorization. Deterministic output: identical inputs and weights always produce identical scores.
                </p>
              </div>
            </div>

            {/* Live Signature Score Breakdown Component */}
            <div className="lg:col-span-8 space-y-4">
              <ScoreBreakdown breakdown={activeBreakdown} />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          3. THREE-ROLE PLATFORM ARCHITECTURE: Applicant, Recruiter, Admin
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 border-b border-border-default bg-surface">
        <div className="max-w-[1280px] mx-auto px-6 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-900 text-xs font-medium">
              <Users className="w-3.5 h-3.5 text-brand-600" />
              <span>Three Roles, One Visual Language</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-900">
              Purpose-built workflows for every participant in the hiring journey
            </h2>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Rather than reskinning the application per role, our design system reuses the same robust components
              while orienting each role's dashboard toward what they value most.
            </p>
          </div>

          {/* Interactive Role Switcher Tabs */}
          <div className="flex justify-center">
            <div className="inline-flex p-1 rounded-lg bg-surface-muted border border-border-default">
              <button
                onClick={() => setActiveRoleTab('applicant')}
                className={`px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeRoleTab === 'applicant'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                For Job Seekers (Applicants)
              </button>
              <button
                onClick={() => setActiveRoleTab('recruiter')}
                className={`px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeRoleTab === 'recruiter'
                    ? 'bg-role-recruiter text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                For Recruiters &amp; Hiring Teams
              </button>
              <button
                onClick={() => setActiveRoleTab('admin')}
                className={`px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeRoleTab === 'admin'
                    ? 'bg-role-admin text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                For Super Admins &amp; Compliance
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          {activeRoleTab === 'applicant' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="max-w-2xl mx-auto text-center space-y-2">
                <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
                  Emphasis: Progress, Transparency, and Career Empowerment
                </span>
                <h3 className="text-xl font-bold text-brand-900">
                  Stop applying blind. Know your fit before you submit.
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Applicants get continuous feedback on their candidacy with pre-application score previews,
                  actionable gap recommendations, and granular privacy controls.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600">
                    <Target className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-semibold text-text-primary">Pre-Application ATS Preview</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    SRS §3.3.3 (FR-AP-18): Evaluate your CV against any live job requisition before applying.
                    See your predicted 0–100% score and category breakdown to decide where to focus effort.
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center text-xs text-brand-600 font-medium">
                      Zero-penalty on-demand checks
                    </span>
                  </div>
                </Card>

                <Card className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-semibold text-text-primary">Automated CV Parser &amp; Multi-Resume</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    SRS §3.3.2 (FR-AP-12/14): Upload PDF or DOCX resumes. In-process parser automatically extracts
                    taxonomy skills, education, and career tenure while maintaining multiple tailored resume versions.
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center text-xs text-brand-600 font-medium">
                      Selectable resume per application
                    </span>
                  </div>
                </Card>

                <Card className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-semibold text-text-primary">Resume Health &amp; Skill Gap Advice</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    SRS §3.3.4 (FR-AP-22/24): Instant diagnosis of formatting pitfalls, keyword density, and missing sections.
                    Receive recommendations (e.g., "Add Docker to reach 85% match") to strengthen your application.
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center text-xs text-brand-600 font-medium">
                      Actionable career guidance
                    </span>
                  </div>
                </Card>

                <Card className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-semibold text-text-primary">Verified Employer Discovery</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    SRS §3.3.7 (FR-AP-31/32): Browse verified recruiting companies, view culture media galleries,
                    perks, office locations, and follow companies to get immediate alerts on new vacancy postings.
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center text-xs text-brand-600 font-medium">
                      Authentic company profiles
                    </span>
                  </div>
                </Card>

                <Card className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-semibold text-text-primary">Employer Privacy Shield</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    SRS §3.3.1 (FR-AP-10/30): Hide your profile from your current employer's email domain.
                    Toggle public visibility, apply-only mode, or export/delete your data under GDPR standards.
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center text-xs text-brand-600 font-medium">
                      100% confidential job seeking
                    </span>
                  </div>
                </Card>

                <Card className="space-y-3 bg-brand-100/40 border-brand-600/30 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-brand-900">Ready to test your candidacy?</span>
                    <h4 className="text-base font-bold text-brand-900">Search verified openings today</h4>
                    <p className="text-xs text-text-secondary">
                      Access active listings across verified engineering, design, product, and leadership roles.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    className="w-full mt-4"
                    onClick={() => navigate('/jobs')}
                  >
                    Browse Open Jobs
                  </Button>
                </Card>
              </div>
            </div>
          )}

          {activeRoleTab === 'recruiter' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="max-w-2xl mx-auto text-center space-y-2">
                <span className="text-xs font-semibold text-role-recruiter uppercase tracking-wider">
                  Emphasis: Information Density, Candidate Comparison, and Pipeline Velocity
                </span>
                <h3 className="text-xl font-bold text-brand-900">
                  Screen hundreds of applicants in minutes, with zero cognitive overload.
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Recruiters get high-density Kanban pipelines, explainable candidate comparison scorecards,
                  and custom scoring weights tailored to each specific requisition.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-role-recruiter">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-semibold text-text-primary">Custom Weighted Requisition Builder</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    SRS §3.2.2 (FR-RC-04/06): Configure must-have vs. nice-to-have skill weights per job posting.
                    Prioritize skills over education for senior technical roles within platform-sanctioned bounds.
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center text-xs text-role-recruiter font-medium">
                      Configurable per requisition
                    </span>
                  </div>
                </Card>

                <Card className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-role-recruiter">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-semibold text-text-primary">7-Stage Pipeline Kanban</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    SRS §3.2.3 (FR-RC-12): Move candidates seamlessly through Applied, Screening, Shortlisted,
                    Interview, Offer, Hired, and Rejected. Every candidate card features their signature ScoreBadge.
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center text-xs text-role-recruiter font-medium">
                      Drag-and-drop workflow
                    </span>
                  </div>
                </Card>

                <Card className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-role-recruiter">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-semibold text-text-primary">Side-by-Side Candidate Comparison</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    SRS §3.2.3 (FR-RC-16): Compare shortlisted candidates side-by-side across their 5 sub-scores,
                    tenure, verified certifications, and interview scorecard feedback in a unified matrix.
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center text-xs text-role-recruiter font-medium">
                      Objective candidate matrices
                    </span>
                  </div>
                </Card>

                <Card className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-role-recruiter">
                    <Scale className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-semibold text-text-primary">Audited Recruiter Score Overrides</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    SRS §4.4 (FR-ATS-06): Recruiters retain final decision authority. Override any algorithmic score
                    with a mandatory justification note, preserved in the immutable audit log.
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center text-xs text-role-recruiter font-medium">
                      Human judgment + full audit trail
                    </span>
                  </div>
                </Card>

                <Card className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-role-recruiter">
                    <Compass className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-semibold text-text-primary">Talent Pool Database Search</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    SRS §3.2.3 (FR-RC-11): Directly source candidate profiles across the platform talent pool using
                    skill taxonomy and experience filters, respecting applicant privacy boundaries.
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center text-xs text-role-recruiter font-medium">
                      Proactive talent sourcing
                    </span>
                  </div>
                </Card>

                <Card className="space-y-3 bg-teal-50/50 border-teal-600/30 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-role-recruiter">Ready to streamline your pipeline?</span>
                    <h4 className="text-base font-bold text-brand-900">Create your recruiting organization</h4>
                    <p className="text-xs text-text-secondary">
                      Post vacancies, invite hiring managers, and automate candidate screening today.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    className="w-full mt-4 bg-role-recruiter hover:bg-teal-800"
                    onClick={() => navigate('/auth/register')}
                  >
                    Start Hiring Now
                  </Button>
                </Card>
              </div>
            </div>
          )}

          {activeRoleTab === 'admin' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="max-w-2xl mx-auto text-center space-y-2">
                <span className="text-xs font-semibold text-role-admin uppercase tracking-wider">
                  Emphasis: Multi-Tenant Oversight, System Configuration, and Compliance
                </span>
                <h3 className="text-xl font-bold text-brand-900">
                  Global governance for multi-tenant recruitment integrity.
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Super Admins manage tenant accounts, assign subscription quotas, enforce discriminatory-language filters,
                  tune platform-wide ATS scoring defaults, and track GDPR compliance.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-role-admin">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-semibold text-text-primary">Tenant Verification &amp; Quotas</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    SRS §3.1.1 (FR-SA-01/03): Review company signups, inspect business documentation, and assign
                    Free, Pro, or Enterprise subscription limits (active jobs, seat limits, ATS scan volumes).
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center text-xs text-role-admin font-medium">
                      Enterprise multi-tenancy
                    </span>
                  </div>
                </Card>

                <Card className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-role-admin">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-semibold text-text-primary">Global ATS Scoring Weight Tuner</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    SRS §3.1.4 (FR-SA-14): Configure platform-wide default weights across skills, tenure, degree hierarchies,
                    semantic similarity, and certifications. Define allowable override boundaries for tenants.
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center text-xs text-role-admin font-medium">
                      Platform-level calibration
                    </span>
                  </div>
                </Card>

                <Card className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-role-admin">
                    <Eye className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-semibold text-text-primary">Automated Content Moderation</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    SRS §3.1.3 (FR-SA-09/11): Real-time keyword filter flags discriminatory or non-compliant job postings.
                    Detect fraudulent profiles and moderate flagged user accounts with full audit tracking.
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center text-xs text-role-admin font-medium">
                      Anti-bias &amp; spam protection
                    </span>
                  </div>
                </Card>

                <Card className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-role-admin">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-semibold text-text-primary">Immutable Audit Trail &amp; GDPR SLAs</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    SRS §3.1.3 (FR-SA-12/13): Log every admin action, score override, and tenant impersonation session.
                    Track GDPR right-to-erasure and data portability requests with SLA timers.
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center text-xs text-role-admin font-medium">
                      Strict compliance readiness
                    </span>
                  </div>
                </Card>

                <Card className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-role-admin">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-semibold text-text-primary">Platform Telemetry &amp; MRR</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    SRS §3.1.5 (FR-SA-19/22): Real-time platform KPI dashboard displaying total users, active jobs,
                    applications per day, average ATS scores across industries, and subscription MRR/ARR.
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center text-xs text-role-admin font-medium">
                      Executive operational oversight
                    </span>
                  </div>
                </Card>

                <Card className="space-y-3 bg-slate-100/60 border-slate-600/30 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-role-admin">Platform Governance Overview</span>
                    <h4 className="text-base font-bold text-brand-900">Audit-ready architecture</h4>
                    <p className="text-xs text-text-secondary">
                      Designed to satisfy enterprise data privacy laws, tenant isolation, and strict role-based access.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4 border-role-admin text-role-admin hover:bg-slate-200"
                    onClick={() => navigate('/auth/login')}
                  >
                    Admin Portal Sign In
                  </Button>
                </Card>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          4. THE 5-PILLAR ATS SCORING ENGINE: Deep Dive Specification
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 border-b border-border-default">
        <div className="max-w-[1280px] mx-auto px-6 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-900 text-xs font-medium">
              <Scale className="w-3.5 h-3.5 text-brand-600" />
              <span>Scientific &amp; Unbiased Evaluation</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-900">
              Inside the 5-pillar hybrid scoring engine
            </h2>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              We eliminated opaque, probabilistic AI models that hallucinate. Our engine marries deterministic
              relational SQL set-matching with in-process TF-IDF cosine similarity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Pillar 1 */}
            <Card className="space-y-3 border-t-4 border-t-brand-600">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-600">Pillar 1</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand-100 text-brand-900 font-semibold">
                  40% Weight
                </span>
              </div>
              <h3 className="text-base font-semibold text-brand-900">Skills Match</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Relational SQL set-overlap against canonical skill taxonomy. Must-have skills carry 2x weight over
                nice-to-have, adjusted by verified proficiency level.
              </p>
              <div className="pt-2 text-[11px] text-text-muted">
                Input: Candidate skills vs JobRequiredSkills
              </div>
            </Card>

            {/* Pillar 2 */}
            <Card className="space-y-3 border-t-4 border-t-brand-600">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-600">Pillar 2</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand-100 text-brand-900 font-semibold">
                  25% Weight
                </span>
              </div>
              <h3 className="text-base font-semibold text-brand-900">Experience Match</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Verifies total cumulative duration in relevant roles. Cross-references job title keyword overlap
                against the target seniority requirement.
              </p>
              <div className="pt-2 text-[11px] text-text-muted">
                Input: Work experience dates &amp; titles
              </div>
            </Card>

            {/* Pillar 3 */}
            <Card className="space-y-3 border-t-4 border-t-brand-600">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-600">Pillar 3</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand-100 text-brand-900 font-semibold">
                  15% Weight
                </span>
              </div>
              <h3 className="text-base font-semibold text-brand-900">Education Match</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Evaluates structured degree hierarchy (Diploma &lt; Bachelor's &lt; Master's &lt; Doctorate)
                against minimum job criteria, plus field-of-study alignment.
              </p>
              <div className="pt-2 text-[11px] text-text-muted">
                Input: Verified institution degree &amp; major
              </div>
            </Card>

            {/* Pillar 4 */}
            <Card className="space-y-3 border-t-4 border-t-brand-600">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-600">Pillar 4</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand-100 text-brand-900 font-semibold">
                  15% Weight
                </span>
              </div>
              <h3 className="text-base font-semibold text-brand-900">Semantic TF-IDF</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                In-process natural language processing. TF-IDF vectorization and cosine similarity reward contextual
                descriptions without requiring exact keyword phrasing.
              </p>
              <div className="pt-2 text-[11px] text-text-muted">
                Engine: In-process `natural` pure JS library
              </div>
            </Card>

            {/* Pillar 5 */}
            <Card className="space-y-3 border-t-4 border-t-brand-600">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-600">Pillar 5</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand-100 text-brand-900 font-semibold">
                  5% Weight
                </span>
              </div>
              <h3 className="text-base font-semibold text-brand-900">Certifications</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Checks presence of mandatory and preferred industry credentials (AWS, CISSP, PMP, CPA) against
                the master certification registry.
              </p>
              <div className="pt-2 text-[11px] text-text-muted">
                Input: Credential ID &amp; issuing body
              </div>
            </Card>
          </div>

          {/* Protected Class Firewall Notice */}
          <div className="p-6 rounded-lg bg-surface border border-border-default space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-brand-900">
              <ShieldCheck className="w-5 h-5 text-score-high" />
              <span>Protected-Class Algorithmic Firewall (SRS §4.4 FR-ATS-09)</span>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-4xl">
              To eliminate hiring bias, candidate demographic markers—including age, birth year, gender, marital status,
              ethnicity, and profile photographs—are strictly quarantined and never processed by the ATS scoring engine.
              Scoring is strictly limited to verifiable competence, experience, and educational qualifications.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          5. END-TO-END WORKFLOW: 5-Step Lifecycle
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 border-b border-border-default bg-surface">
        <div className="max-w-[1280px] mx-auto px-6 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-900 text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-brand-600" />
              <span>Streamlined Lifecycle</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-900">
              From vacancy creation to signed offer letter
            </h2>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Every stage of the recruitment process is connected through transparent data contracts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-5 rounded-lg bg-surface-muted border border-border-default space-y-2">
              <div className="w-7 h-7 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h4 className="text-sm font-semibold text-text-primary">Configure Requisition</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Recruiter defines required skills, seniority thresholds, knockout questions, and custom weights.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-surface-muted border border-border-default space-y-2">
              <div className="w-7 h-7 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h4 className="text-sm font-semibold text-text-primary">Pre-Check &amp; Apply</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Applicant uploads CV, reviews their predicted match score, tunes profile gaps, and submits with 1-click.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-surface-muted border border-border-default space-y-2">
              <div className="w-7 h-7 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h4 className="text-sm font-semibold text-text-primary">Deterministic Triage</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                In-process engine scores the submission in &lt;10s. Candidates are categorized into Strong, Partial, or Weak bands.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-surface-muted border border-border-default space-y-2">
              <div className="w-7 h-7 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                4
              </div>
              <h4 className="text-sm font-semibold text-text-primary">Kanban &amp; Interviews</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Recruiter progresses candidates, compares scorecards, logs private notes, and syncs calendar invites.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-surface-muted border border-border-default space-y-2">
              <div className="w-7 h-7 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                5
              </div>
              <h4 className="text-sm font-semibold text-text-primary">Offer &amp; Placement</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Generate formal offer letters, track candidate acceptance, and archive the closed requisition.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          6. PRICING & TENANT PLANS: SRS §3.1.1 & §3.1.6
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 border-b border-border-default">
        <div className="max-w-[1280px] mx-auto px-6 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-900 text-xs font-medium">
              <Award className="w-3.5 h-3.5 text-brand-600" />
              <span>Transparent SaaS Tiers</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-900">
              Subscription tiers for teams of all sizes
            </h2>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Transparent quotas and limits enforced automatically by the platform's multi-tenant engine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter Tier */}
            <Card className="p-6 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-brand-900">Starter</h3>
                  <p className="text-xs text-text-secondary">Ideal for boutique hiring and single recruiters</p>
                </div>
                <div className="text-3xl font-bold text-brand-900">
                  $0 <span className="text-xs font-normal text-text-muted">/ month</span>
                </div>
                <div className="pt-4 border-t border-border-default space-y-3 text-xs text-text-secondary">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-score-high" />
                    <span>2 Active Job Vacancies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-score-high" />
                    <span>1 Recruiter Seat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-score-high" />
                    <span>50 ATS Scans per Month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-score-high" />
                    <span>Standard 7-Stage Kanban</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-score-high" />
                    <span>Global Taxonomy Matching</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/auth/register')}
              >
                Get Started Free
              </Button>
            </Card>

            {/* Growth Tier (Most Popular) */}
            <Card className="p-6 space-y-6 flex flex-col justify-between border-2 border-brand-600 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-brand-600 text-white text-[11px] font-semibold">
                Most Popular
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-brand-900">Professional</h3>
                  <p className="text-xs text-text-secondary">For growing companies with active hiring pipelines</p>
                </div>
                <div className="text-3xl font-bold text-brand-900">
                  $149 <span className="text-xs font-normal text-text-muted">/ month</span>
                </div>
                <div className="pt-4 border-t border-border-default space-y-3 text-xs text-text-secondary">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-score-high" />
                    <span className="font-semibold text-text-primary">15 Active Job Vacancies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-score-high" />
                    <span className="font-semibold text-text-primary">5 Team Seats</span> (Hiring Managers)
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-score-high" />
                    <span className="font-semibold text-text-primary">Unlimited ATS Scans</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-score-high" />
                    <span>Custom Job Scoring Weight Overrides</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-score-high" />
                    <span>Talent Pool Sourcing &amp; Messaging</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-score-high" />
                    <span>Calendar Sync &amp; Video Call Integrations</span>
                  </div>
                </div>
              </div>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => navigate('/auth/register')}
              >
                Start 14-Day Pro Trial
              </Button>
            </Card>

            {/* Enterprise Tier */}
            <Card className="p-6 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-brand-900">Enterprise</h3>
                  <p className="text-xs text-text-secondary">For multi-brand organizations requiring compliance</p>
                </div>
                <div className="text-3xl font-bold text-brand-900">
                  Custom <span className="text-xs font-normal text-text-muted">/ annual</span>
                </div>
                <div className="pt-4 border-t border-border-default space-y-3 text-xs text-text-secondary">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-score-high" />
                    <span className="font-semibold text-text-primary">Unlimited Job Vacancies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-score-high" />
                    <span className="font-semibold text-text-primary">Unlimited Seats</span> (Custom RBAC)
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-score-high" />
                    <span>Dedicated Tenant Isolation SLA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-score-high" />
                    <span>Full Audit Logging &amp; GDPR DSR Automation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-score-high" />
                    <span>Custom Taxonomy &amp; Verification Workflows</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-score-high" />
                    <span>Dedicated Technical Account Manager</span>
                  </div>
                </div>
              </div>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate('/auth/register')}
              >
                Contact Enterprise Sales
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          7. PLATFORM ARCHITECTURE & BACKEND HEALTH
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 border-b border-border-default bg-surface">
        <div className="max-w-[1280px] mx-auto px-6 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-900 text-xs font-medium">
              <BookOpen className="w-3.5 h-3.5 text-brand-600" />
              <span>Technical Foundations</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-900">
              Lean, reliable monolithic architecture
            </h2>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Engineered per SRS §2.2 as a single deployable Express.js + MySQL modular monolith.
              Zero microservice overhead, zero external AI latency, and zero distributed failure modes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-lg border border-border-default bg-surface-muted space-y-2">
              <span className="text-xs font-bold text-brand-600">Core Runtime</span>
              <h4 className="text-sm font-semibold text-text-primary">Express.js &amp; TypeScript</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Domain-driven feature modules (auth, applicant, job, pipeline, ats-scoring, notifications, admin).
              </p>
            </div>

            <div className="p-5 rounded-lg border border-border-default bg-surface-muted space-y-2">
              <span className="text-xs font-bold text-brand-600">Database Layer</span>
              <h4 className="text-sm font-semibold text-text-primary">MySQL &amp; Prisma ORM</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Single source of truth. Relational data with FULLTEXT indexing and lightweight retry jobs.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-border-default bg-surface-muted space-y-2">
              <span className="text-xs font-bold text-brand-600">ATS Engine</span>
              <h4 className="text-sm font-semibold text-text-primary">In-Process TF-IDF</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Sub-second pure JavaScript TF-IDF cosine similarity via `natural`. No GPUs, no rate limits, no third-party outages.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-border-default bg-surface-muted space-y-2">
              <span className="text-xs font-bold text-brand-600">Production Infra</span>
              <h4 className="text-sm font-semibold text-text-primary">PM2 + Nginx Reverse Proxy</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Single VPS cluster setup with automatic CPU clustering, zero-downtime reloads, and TLS 1.2+ termination.
              </p>
            </div>
          </div>

          {/* Live API Health Check Control */}
          <div className="p-4 rounded-lg border border-border-default bg-surface flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-0.5 text-center sm:text-left">
              <div className="text-xs font-semibold text-text-primary flex items-center gap-2 justify-center sm:justify-start">
                <span className="w-2 h-2 rounded-full bg-score-high"></span>
                <span>Live Monolith API Status</span>
              </div>
              <p className="text-xs text-text-secondary">
                Ping the live Express.js `/api/health` endpoint to verify modular monolith responsiveness.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {healthStatus && (
                <span className="text-xs font-mono text-brand-600 bg-brand-100 px-3 py-1.5 rounded-lg border border-brand-600/20">
                  {healthStatus}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={checkApiHealth}
                isLoading={isTestingApi}
                className="text-xs"
              >
                Run Health Probe
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          8. FREQUENTLY ASKED QUESTIONS: Interactive Accordion
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 border-b border-border-default">
        <div className="max-w-[840px] mx-auto px-6 space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-900 text-xs font-medium">
              <HelpCircle className="w-3.5 h-3.5 text-brand-600" />
              <span>Questions &amp; Transparency</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-900">
              Frequently asked questions
            </h2>
            <p className="text-sm text-text-secondary">
              Everything you need to know about our scoring methodology, privacy, and architecture.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'How does the ATS score prevent demographic and algorithmic bias?',
                a: 'SRS §4.4 (FR-ATS-09) mandates strict protected-class isolation. Signals such as age, birth date, gender, ethnicity, marital status, and profile photos are completely quarantined from the scoring pipeline. The score is computed strictly from verified taxonomy skills, documented tenure duration, degree credentials, and in-process TF-IDF text relevance.',
              },
              {
                q: 'Can applicants see why they received a specific score?',
                a: 'Yes. Every applicant has access to the full 5-pillar breakdown for their applications, including matched vs. missing taxonomy skills and top matching semantic terms. Furthermore, the system provides actionable recommendations (e.g., "Adding Kubernetes increases match to 85%").',
              },
              {
                q: 'Can recruiters manually override an ATS score?',
                a: 'Yes. Per SRS §4.4 (FR-ATS-06), recruiters retain ultimate decision-making authority and can calibrate a candidate\'s score. However, any manual override requires a mandatory justification note and is permanently recorded in the immutable audit log for compliance.',
              },
              {
                q: 'Can my current employer see that I am on the platform?',
                a: 'No. Applicants can enable the Employer Privacy Shield (SRS §3.3.1 FR-AP-10/30), which automatically blocks recruiters from specified corporate email domains from discovering or viewing your profile.',
              },
              {
                q: 'What resume file formats are supported for automated CV parsing?',
                a: 'The system accepts PDF and DOCX formats. The text extraction engine extracts skills, education, and career milestones to populate your structured profile, which you can review and edit before submitting.',
              },
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-lg border border-border-default bg-surface overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 text-left flex items-center justify-between text-sm font-semibold text-brand-900 hover:bg-surface-muted transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-text-muted flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs sm:text-sm text-text-secondary leading-relaxed border-t border-border-default/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          9. CALL TO ACTION: Unified Conversion Banner
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-brand-900 text-white">
        <div className="max-w-[1280px] mx-auto px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-600/50 text-white text-xs font-medium border border-white/10">
            <span>Enterprise-Grade Recruitment</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight max-w-2xl mx-auto">
            Experience high-clarity hiring decisions today.
          </h2>

          <p className="text-sm sm:text-base text-brand-100 max-w-xl mx-auto leading-relaxed">
            Whether you are advancing your career or scaling an engineering organization,
            leverage transparent match scoring to make confident choices.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              variant="primary"
              size="lg"
              className="bg-white text-brand-900 hover:bg-brand-100 hover:text-brand-900"
              onClick={() => navigate('/jobs')}
            >
              Browse Open Vacancies
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="border-white/40 text-white hover:bg-white/10"
              onClick={() => navigate('/auth/register')}
            >
              Create Recruiter Organization
            </Button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          10. FOOTER: Navigation & System Status
      ────────────────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border-default bg-surface py-12">
        <div className="max-w-[1280px] mx-auto px-6 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Col 1: Brand Info */}
            <div className="col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
                  A
                </div>
                <span className="font-bold text-brand-900 tracking-tight">TalentMatch ATS</span>
              </div>
              <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                Deterministic ATS score predictions, 7-stage pipeline kanbans, and multi-tenant compliance built for high-stakes hiring.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs text-text-secondary">
                <span className="w-2 h-2 rounded-full bg-score-high"></span>
                <span className="font-medium text-text-primary">All Systems Operational</span>
                <span>•</span>
                <span>99.9% Uptime</span>
              </div>
            </div>

            {/* Col 2: For Applicants */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-brand-900 uppercase tracking-wider">
                For Applicants
              </span>
              <ul className="text-xs text-text-secondary space-y-2">
                <li>
                  <Link to="/jobs" className="hover:text-brand-600 transition-colors">
                    Find Vacancies
                  </Link>
                </li>
                <li>
                  <Link to="/companies" className="hover:text-brand-600 transition-colors">
                    Company Directory
                  </Link>
                </li>
                <li>
                  <Link to="/applicant/dashboard" className="hover:text-brand-600 transition-colors">
                    Application Tracker
                  </Link>
                </li>
                <li>
                  <Link to="/applicant/profile" className="hover:text-brand-600 transition-colors">
                    CV &amp; Skill Profile
                  </Link>
                </li>
                <li>
                  <Link to="/applicant/settings" className="hover:text-brand-600 transition-colors">
                    Privacy Controls
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: For Recruiters */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-brand-900 uppercase tracking-wider">
                For Recruiters
              </span>
              <ul className="text-xs text-text-secondary space-y-2">
                <li>
                  <Link to="/recruiter/jobs/new" className="hover:text-brand-600 transition-colors">
                    Post a Vacancy
                  </Link>
                </li>
                <li>
                  <Link to="/recruiter/pipeline" className="hover:text-brand-600 transition-colors">
                    Pipeline Kanban
                  </Link>
                </li>
                <li>
                  <Link to="/recruiter/talent-pool" className="hover:text-brand-600 transition-colors">
                    Talent Pool Search
                  </Link>
                </li>
                <li>
                  <Link to="/recruiter/analytics" className="hover:text-brand-600 transition-colors">
                    Hiring Analytics
                  </Link>
                </li>
                <li>
                  <Link to="/recruiter/team" className="hover:text-brand-600 transition-colors">
                    Team Members
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Compliance & Admin */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-brand-900 uppercase tracking-wider">
                Governance
              </span>
              <ul className="text-xs text-text-secondary space-y-2">
                <li>
                  <Link to="/admin/dashboard" className="hover:text-brand-600 transition-colors">
                    Admin Portal
                  </Link>
                </li>
                <li>
                  <Link to="/admin/config" className="hover:text-brand-600 transition-colors">
                    ATS Weight Config
                  </Link>
                </li>
                <li>
                  <Link to="/admin/moderation" className="hover:text-brand-600 transition-colors">
                    Moderation Center
                  </Link>
                </li>
                <li>
                  <Link to="/admin/plans" className="hover:text-brand-600 transition-colors">
                    Subscription Plans
                  </Link>
                </li>
                <li>
                  <a href="#compliance" className="hover:text-brand-600 transition-colors">
                    GDPR / Privacy SLA
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border-default flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
            <div>
              &copy; {new Date().getFullYear()} Recruitment &amp; ATS Platform. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span>Modular Monolith Release v1.0.0</span>
              <span>•</span>
              <span>Inter Design System</span>
              <span>•</span>
              <span>WCAG 2.1 AA Compliant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
