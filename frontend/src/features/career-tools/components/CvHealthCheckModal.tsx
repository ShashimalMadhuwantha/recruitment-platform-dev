import React, { useState } from 'react';
import {
  X,
  HeartPulse,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lightbulb,
  Sparkles,
  BookOpen,
  TrendingUp,
  BarChart,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useCvHealthCheck } from '../hooks';
import type { CvHealthIssueDto } from '../types';

interface CvHealthCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToProfileSection?: (section: string) => void;
}

export const CvHealthCheckModal: React.FC<CvHealthCheckModalProps> = ({
  isOpen,
  onClose,
  onNavigateToProfileSection,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'PASSED'>('ALL');
  const { data, isLoading, refetch, isRefetching } = useCvHealthCheck({ enabled: isOpen });

  if (!isOpen) return null;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-300';
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-300';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-300';
    return 'text-rose-600 bg-rose-50 border-rose-300';
  };

  const getSeverityBadge = (severity: CvHealthIssueDto['severity']) => {
    switch (severity) {
      case 'PASSED':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Passed
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-600" /> Critical
          </span>
        );
      case 'WARNING':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Warning
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-blue-600" /> Suggestion
          </span>
        );
    }
  };

  const filteredIssues =
    data?.issues.filter((issue) => {
      if (filter === 'ALL') return true;
      if (filter === 'CRITICAL') return issue.severity === 'CRITICAL';
      if (filter === 'WARNING') return issue.severity === 'WARNING';
      if (filter === 'PASSED') return issue.severity === 'PASSED';
      return true;
    }) || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-surface rounded-2xl shadow-2xl border border-border-default flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border-default bg-surface-muted flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text-primary">
                  CV Health Diagnostic & Quality Scoring
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-100 text-brand-700">
                  FR-AP-24
                </span>
              </div>
              <p className="text-xs text-text-secondary">
                In-depth automated audit of your profile completeness, action verbs, metrics & ATS readability
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="text-xs gap-1 text-brand-600 border-brand-200"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`}
              />
              <span>Re-scan</span>
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <HeartPulse className="w-10 h-10 text-brand-600 animate-pulse mx-auto" />
              <p className="text-xs font-semibold text-text-primary">
                Analyzing CV structure, vocabulary density & section balance...
              </p>
            </div>
          ) : !data ? (
            <div className="py-16 text-center text-xs text-text-secondary">
              Unable to analyze profile. Please make sure your profile is active.
            </div>
          ) : (
            <>
              {/* Score Hero Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Health Score Dial */}
                <div
                  className={`p-5 rounded-2xl border flex flex-col items-center justify-center text-center ${getScoreColor(
                    data.healthScore
                  )}`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Overall Health Score
                  </span>
                  <div className="text-4xl font-extrabold my-2">
                    {data.healthScore}
                    <span className="text-base font-medium opacity-80">/100</span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/70 shadow-2xs">
                    Grade: {data.grade.replace('_', ' ')}
                  </span>
                </div>

                {/* Metrics Breakdown */}
                <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-surface-muted rounded-xl border border-border-default text-center space-y-0.5">
                    <p className="text-[11px] text-text-secondary font-medium">Word Count</p>
                    <p className="text-base font-bold text-text-primary">{data.wordCount}</p>
                    <span className="text-[10px] text-text-muted">Target: 350-1000</span>
                  </div>

                  <div className="p-3 bg-surface-muted rounded-xl border border-border-default text-center space-y-0.5">
                    <p className="text-[11px] text-text-secondary font-medium">Action Verbs</p>
                    <p className="text-base font-bold text-emerald-700">
                      {data.actionVerbCount}
                    </p>
                    <span className="text-[10px] text-text-muted">Impact verbs</span>
                  </div>

                  <div className="p-3 bg-surface-muted rounded-xl border border-border-default text-center space-y-0.5">
                    <p className="text-[11px] text-text-secondary font-medium">Metrics / Numbers</p>
                    <p className="text-base font-bold text-brand-700">
                      {data.quantifiableMetricsCount}
                    </p>
                    <span className="text-[10px] text-text-muted">Measurable results</span>
                  </div>

                  <div className="p-3 bg-surface-muted rounded-xl border border-border-default text-center space-y-0.5">
                    <p className="text-[11px] text-text-secondary font-medium">Audit Checks</p>
                    <p className="text-base font-bold text-emerald-700">
                      {data.passedChecksCount} / {data.issues.length}
                    </p>
                    <span className="text-[10px] text-text-muted">Passed audits</span>
                  </div>
                </div>
              </div>

              {/* Required Core Sections Status */}
              <div className="p-4 rounded-xl border border-border-default bg-surface-muted/30 space-y-2.5">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center justify-between">
                  <span>Resume Section Completeness</span>
                  <span className="text-[11px] font-medium text-text-secondary">
                    Essential for ATS parsers
                  </span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Object.entries(data.sectionChecks).map(([key, isPresent]) => (
                    <div
                      key={key}
                      className={`p-2.5 rounded-lg border text-xs flex items-center gap-1.5 font-medium ${
                        isPresent
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                          : 'bg-rose-50/60 border-rose-200 text-rose-800'
                      }`}
                    >
                      {isPresent ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      )}
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Detected Keyword Density */}
              {data.topKeywords && data.topKeywords.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart className="w-3.5 h-3.5 text-brand-600" />
                    <span>Top Keyword Density & Signal</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.topKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-lg bg-surface-muted border border-border-default text-text-primary flex items-center gap-1.5"
                      >
                        <span className="font-semibold capitalize">{kw.word}</span>
                        <span className="text-[10px] text-text-muted">
                          {kw.count}× ({kw.densityPercent}%)
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Filter Tabs & Detailed Issues List */}
              <div className="space-y-3 pt-2 border-t border-border-default">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Diagnostic Findings & Action Items
                  </h3>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-lg border border-border-default text-xs">
                    <button
                      onClick={() => setFilter('ALL')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                        filter === 'ALL'
                          ? 'bg-surface text-text-primary shadow-2xs'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      All ({data.issues.length})
                    </button>
                    <button
                      onClick={() => setFilter('CRITICAL')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                        filter === 'CRITICAL'
                          ? 'bg-surface text-rose-700 shadow-2xs'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Critical ({data.criticalIssuesCount})
                    </button>
                    <button
                      onClick={() => setFilter('WARNING')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                        filter === 'WARNING'
                          ? 'bg-surface text-amber-700 shadow-2xs'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Warnings ({data.warningsCount})
                    </button>
                    <button
                      onClick={() => setFilter('PASSED')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                        filter === 'PASSED'
                          ? 'bg-surface text-emerald-700 shadow-2xs'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Passed ({data.passedChecksCount})
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {filteredIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-4 rounded-xl border border-border-default bg-surface hover:border-brand-300 transition-colors space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                            <span>{issue.title}</span>
                          </h4>
                          <p className="text-xs text-text-secondary">{issue.description}</p>
                        </div>
                        {getSeverityBadge(issue.severity)}
                      </div>

                      {issue.recommendation && (
                        <div className="p-2.5 rounded-lg bg-surface-muted border border-border-default/60 text-xs flex items-start gap-2 text-brand-900">
                          <Sparkles className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-text-primary">
                              Actionable Advice:{' '}
                            </span>
                            <span className="text-text-secondary">{issue.recommendation}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border-default bg-surface-muted flex items-center justify-between">
          <span className="text-[11px] text-text-secondary">
            Scored automatically based on top 500 tech & ATS industry rubrics
          </span>
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
