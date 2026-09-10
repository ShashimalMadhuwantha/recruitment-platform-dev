import React, { useState } from 'react';
import {
  useModerationStats,
  useContentReports,
  useResolveReport,
  useBannedKeywords,
  useCreateBannedKeyword,
  useDeleteBannedKeyword,
  useTestKeywords,
  useAuditLogs,
  useGdprRequests,
  useProcessGdprRequest,
} from '../../features/moderation/hooks';
import {
  ContentReport,
  ReportStatus,
  BannedKeywordCategory,
  AuditLogEntry,
  GdprRequest,
} from '../../features/moderation/types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatusPill } from '../../components/ui/StatusPill';
import { EmptyState } from '../../components/ui/EmptyState';

export const AdminModerationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'JOBS' | 'PROFILES' | 'KEYWORDS' | 'AUDIT' | 'GDPR'>('JOBS');

  // Stats
  const { data: stats } = useModerationStats();

  // 1. Content Reports (Jobs & Profiles)
  const [reportStatusFilter, setReportStatusFilter] = useState<ReportStatus | 'ALL'>('PENDING');
  const [reportSearch, setReportSearch] = useState('');
  const [reportPage, setReportPage] = useState(1);
  const targetTypeParam = activeTab === 'JOBS' ? 'JOB_POSTING' : 'APPLICANT_PROFILE';

  const { data: reportsData, isLoading: reportsLoading } = useContentReports({
    page: reportPage,
    limit: 10,
    targetType: targetTypeParam,
    status: reportStatusFilter === 'ALL' ? undefined : reportStatusFilter,
    search: reportSearch || undefined,
  });

  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [resolveModalReport, setResolveModalReport] = useState<{ report: ContentReport; action: string } | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const resolveMutation = useResolveReport();

  // 2. Banned Keywords
  const { data: keywords, isLoading: keywordsLoading } = useBannedKeywords();
  const [newKeyword, setNewKeyword] = useState('');
  const [newCategory, setNewCategory] = useState<BannedKeywordCategory>('DISCRIMINATION');
  const [newSeverity, setNewSeverity] = useState<'BLOCK' | 'WARN'>('BLOCK');
  const [testText, setTestText] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  const createKeywordMutation = useCreateBannedKeyword();
  const deleteKeywordMutation = useDeleteBannedKeyword();
  const testKeywordMutation = useTestKeywords();

  // 3. Audit Logs
  const [auditPage, setAuditPage] = useState(1);
  const [auditAction, setAuditAction] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogEntry | null>(null);

  const { data: auditData, isLoading: auditLoading } = useAuditLogs({
    page: auditPage,
    limit: 15,
    action: auditAction || undefined,
    search: auditSearch || undefined,
  });

  // 4. GDPR Requests
  const { data: gdprRequests, isLoading: gdprLoading } = useGdprRequests();
  const [selectedGdpr, setSelectedGdpr] = useState<GdprRequest | null>(null);
  const [gdprProcessModal, setGdprProcessModal] = useState<GdprRequest | null>(null);
  const [gdprAction, setGdprAction] = useState<'COMPLETED' | 'REJECTED'>('COMPLETED');
  const [gdprRejectionReason, setGdprRejectionReason] = useState('');
  const processGdprMutation = useProcessGdprRequest();

  // Handlers
  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveModalReport || !resolveNotes.trim()) return;

    try {
      await resolveMutation.mutateAsync({
        id: resolveModalReport.report.id,
        payload: {
          action: resolveModalReport.action as any,
          notes: resolveNotes,
        },
      });
      setResolveModalReport(null);
      setResolveNotes('');
      if (selectedReport?.id === resolveModalReport.report.id) {
        setSelectedReport(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to resolve report');
    }
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;

    try {
      await createKeywordMutation.mutateAsync({
        keyword: newKeyword.trim(),
        category: newCategory,
        severity: newSeverity,
      });
      setNewKeyword('');
    } catch (err: any) {
      alert(err.message || 'Failed to add keyword');
    }
  };

  const handleTestKeywords = async () => {
    if (!testText.trim()) return;
    try {
      const res = await testKeywordMutation.mutateAsync(testText);
      setTestResult(res);
    } catch (err: any) {
      alert(err.message || 'Failed to test text');
    }
  };

  const handleProcessGdprSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gdprProcessModal) return;

    try {
      await processGdprMutation.mutateAsync({
        id: gdprProcessModal.id,
        payload: {
          status: gdprAction,
          rejectionReason: gdprAction === 'REJECTED' ? gdprRejectionReason : undefined,
        },
      });
      setGdprProcessModal(null);
      setGdprRejectionReason('');
      if (selectedGdpr?.id === gdprProcessModal.id) {
        setSelectedGdpr(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to process GDPR request');
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Moderation & Compliance Center
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Review reported content, manage prohibited taxonomy, inspect immutable audit trails, and fulfill GDPR requests.
          </p>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-border-default flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-text-secondary uppercase">Flagged Jobs</div>
            <div className="text-xl font-bold text-amber-700 mt-1">{stats?.pendingJobReports ?? 0}</div>
          </div>
          <Badge variant="warning">Pending</Badge>
        </Card>
        <Card className="p-4 border-border-default flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-text-secondary uppercase">Reported Profiles</div>
            <div className="text-xl font-bold text-red-700 mt-1">{stats?.pendingProfileReports ?? 0}</div>
          </div>
          <Badge variant="danger">Pending</Badge>
        </Card>
        <Card className="p-4 border-border-default flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-text-secondary uppercase">Banned Keywords</div>
            <div className="text-xl font-bold text-text-primary mt-1">{stats?.totalBannedKeywords ?? 0}</div>
          </div>
          <Badge variant="neutral">Active</Badge>
        </Card>
        <Card className="p-4 border-border-default flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-text-secondary uppercase">Open GDPR SLA</div>
            <div className="text-xl font-bold text-brand-600 mt-1">{stats?.openGdprRequests ?? 0}</div>
          </div>
          <Badge variant="primary">30d SLA</Badge>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-border-default space-x-2">
        <button
          onClick={() => { setActiveTab('JOBS'); setReportPage(1); }}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'JOBS'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Flagged Jobs
        </button>
        <button
          onClick={() => { setActiveTab('PROFILES'); setReportPage(1); }}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'PROFILES'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Reported Profiles
        </button>
        <button
          onClick={() => setActiveTab('KEYWORDS')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'KEYWORDS'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Banned Keywords & Anti-Discrimination
        </button>
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'AUDIT'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Platform Audit Logs
        </button>
        <button
          onClick={() => setActiveTab('GDPR')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'GDPR'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          GDPR Privacy Requests
        </button>
      </div>

      {/* TAB 1 & 2: CONTENT REPORTS (JOBS & PROFILES) */}
      {(activeTab === 'JOBS' || activeTab === 'PROFILES') && (
        <div className="space-y-4">
          <Card className="p-4 border-border-default flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-text-secondary">Status:</span>
              <button
                onClick={() => { setReportStatusFilter('PENDING'); setReportPage(1); }}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  reportStatusFilter === 'PENDING' ? 'bg-brand-primary text-white' : 'bg-surface-muted text-text-secondary hover:bg-border-default'
                }`}
              >
                Pending Review
              </button>
              <button
                onClick={() => { setReportStatusFilter('RESOLVED'); setReportPage(1); }}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  reportStatusFilter === 'RESOLVED' ? 'bg-brand-primary text-white' : 'bg-surface-muted text-text-secondary hover:bg-border-default'
                }`}
              >
                Resolved
              </button>
              <button
                onClick={() => { setReportStatusFilter('DISMISSED'); setReportPage(1); }}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  reportStatusFilter === 'DISMISSED' ? 'bg-brand-primary text-white' : 'bg-surface-muted text-text-secondary hover:bg-border-default'
                }`}
              >
                Dismissed
              </button>
              <button
                onClick={() => { setReportStatusFilter('ALL'); setReportPage(1); }}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  reportStatusFilter === 'ALL' ? 'bg-brand-primary text-white' : 'bg-surface-muted text-text-secondary hover:bg-border-default'
                }`}
              >
                All
              </button>
            </div>
            <input
              type="text"
              placeholder="Search reports by reason..."
              value={reportSearch}
              onChange={(e) => { setReportSearch(e.target.value); setReportPage(1); }}
              className="w-full sm:w-64 h-8 px-3 bg-surface rounded-md border border-border-default text-xs text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
            />
          </Card>

          <Card className="p-0 overflow-hidden border-border-default">
            {reportsLoading ? (
              <div className="p-12 text-center text-sm text-text-secondary">Loading moderation queue...</div>
            ) : !reportsData || reportsData.items.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title={activeTab === 'JOBS' ? 'No flagged job postings' : 'No reported candidate profiles'}
                  description="All submitted reports in this category have been investigated and resolved."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-surface-muted border-b border-border-default text-xs font-semibold text-text-secondary">
                      <th className="py-3 px-4">Reported Target</th>
                      <th className="py-3 px-4">Violation Reason</th>
                      <th className="py-3 px-4">Reported By</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Reported Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {reportsData.items.map((rep) => (
                      <tr key={rep.id} className="hover:bg-surface-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-text-primary">
                            {rep.targetDetails?.title || rep.targetDetails?.name || `Target ID: ${rep.targetId.substring(0, 8)}...`}
                          </div>
                          {rep.targetDetails?.companyName && (
                            <div className="text-xs text-text-muted">Company: {rep.targetDetails.companyName}</div>
                          )}
                          {rep.targetDetails?.email && (
                            <div className="text-xs text-text-muted">{rep.targetDetails.email}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <div className="font-semibold text-red-700">{rep.reason}</div>
                          {rep.description && (
                            <div className="text-text-muted line-clamp-1 mt-0.5">{rep.description}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-text-secondary">
                          {rep.reporter ? (
                            <div>
                              <div>{rep.reporter.email}</div>
                              <span className="text-[10px] text-text-muted font-mono">{rep.reporter.role}</span>
                            </div>
                          ) : (
                            <span className="text-text-muted italic">Automated System / Guest</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <StatusPill status={rep.status} />
                        </td>
                        <td className="py-3 px-4 text-xs text-text-secondary">
                          {new Date(rep.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedReport(rep)}
                            className="h-8 text-xs text-brand-primary"
                          >
                            Details
                          </Button>
                          {rep.status === 'PENDING' && (
                            <>
                              {activeTab === 'JOBS' ? (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => setResolveModalReport({ report: rep, action: 'TAKEDOWN' })}
                                  className="h-8 text-xs bg-red-600 hover:bg-red-700"
                                >
                                  Take Down
                                </Button>
                              ) : (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => setResolveModalReport({ report: rep, action: 'SUSPEND_PROFILE' })}
                                  className="h-8 text-xs bg-red-600 hover:bg-red-700"
                                >
                                  Suspend User
                                </Button>
                              )}
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setResolveModalReport({ report: rep, action: 'DISMISS' })}
                                className="h-8 text-xs"
                              >
                                Dismiss
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: BANNED KEYWORDS & ANTI-DISCRIMINATION */}
      {activeTab === 'KEYWORDS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Keyword Management & Add Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5 border-border-default space-y-4">
              <h3 className="text-base font-semibold text-text-primary">Add Prohibited / Discriminatory Term</h3>
              <form onSubmit={handleAddKeyword} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-text-secondary mb-1">Keyword or Phrase</label>
                    <input
                      type="text"
                      placeholder="e.g. young energetic, native speaker only..."
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      className="w-full h-9 px-3 bg-surface rounded-md border border-border-default text-xs text-text-primary focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Violation Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as BannedKeywordCategory)}
                      className="w-full h-9 px-2.5 bg-surface rounded-md border border-border-default text-xs text-text-primary focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                    >
                      <option value="DISCRIMINATION">Discrimination / Bias</option>
                      <option value="SPAM">Spam / Fraud</option>
                      <option value="OFFENSIVE">Offensive Language</option>
                      <option value="MISLEADING">Misleading Terms</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-3">
                    <label className="text-xs font-medium text-text-secondary">Severity:</label>
                    <label className="flex items-center space-x-1 text-xs text-text-primary cursor-pointer">
                      <input
                        type="radio"
                        checked={newSeverity === 'BLOCK'}
                        onChange={() => setNewSeverity('BLOCK')}
                      />
                      <span>Block (Rejects post)</span>
                    </label>
                    <label className="flex items-center space-x-1 text-xs text-text-primary cursor-pointer">
                      <input
                        type="radio"
                        checked={newSeverity === 'WARN'}
                        onChange={() => setNewSeverity('WARN')}
                      />
                      <span>Warn (Flags for review)</span>
                    </label>
                  </div>
                  <Button type="submit" variant="primary" size="sm" disabled={createKeywordMutation.isPending}>
                    {createKeywordMutation.isPending ? 'Adding...' : 'Add Keyword'}
                  </Button>
                </div>
              </form>
            </Card>

            {/* Keywords List */}
            <Card className="p-0 overflow-hidden border-border-default">
              <div className="p-4 border-b border-border-default flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">Active Prohibited Taxonomy ({keywords?.length || 0})</h3>
              </div>
              {keywordsLoading ? (
                <div className="p-8 text-center text-xs text-text-secondary">Loading keywords...</div>
              ) : !keywords || keywords.length === 0 ? (
                <div className="p-8 text-center text-xs text-text-muted">No banned keywords configured yet.</div>
              ) : (
                <div className="p-4 flex flex-wrap gap-2">
                  {keywords.map((kw) => (
                    <div
                      key={kw.id}
                      className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-border-default bg-surface hover:border-red-300 transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-xs text-text-primary">{kw.keyword}</span>
                        <div className="flex items-center space-x-1 text-[10px] text-text-muted mt-0.5">
                          <span className="font-medium text-amber-700">{kw.category}</span>
                          <span>·</span>
                          <span className={kw.severity === 'BLOCK' ? 'text-red-600 font-bold' : 'text-amber-600'}>
                            {kw.severity}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteKeywordMutation.mutate(kw.id)}
                        className="text-text-muted hover:text-danger text-xs font-bold px-1"
                        title="Delete keyword"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Live Text Scanner */}
          <div className="space-y-6">
            <Card className="p-5 border-border-default space-y-4">
              <h3 className="text-base font-semibold text-text-primary">Live Anti-Bias Validator</h3>
              <p className="text-xs text-text-secondary">
                Paste candidate descriptions or job vacancy text to simulate automated pre-publish keyword validation.
              </p>
              <textarea
                rows={5}
                placeholder="Paste job posting text or candidate profile summary here..."
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="w-full p-3 bg-surface rounded-md border border-border-default text-xs text-text-primary focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTestKeywords}
                disabled={testKeywordMutation.isPending}
                className="w-full"
              >
                {testKeywordMutation.isPending ? 'Analyzing Text...' : 'Scan for Violations'}
              </Button>

              {testResult && (
                <div className="mt-4 p-3 rounded-lg border border-border-default space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Scanner Result:</span>
                    {testResult.isValid ? (
                      <Badge variant="success">No Violations Found</Badge>
                    ) : (
                      <Badge variant="danger">{testResult.violations.length} Violation(s)</Badge>
                    )}
                  </div>
                  {testResult.violations.length > 0 && (
                    <ul className="space-y-1.5 pt-2 border-t border-border-subtle">
                      {testResult.violations.map((v: any, idx: number) => (
                        <li key={idx} className="flex justify-between items-center text-red-700 bg-red-50 p-1.5 rounded">
                          <span className="font-semibold">"{v.keyword}"</span>
                          <span className="text-[10px] font-medium uppercase">{v.category} ({v.severity})</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* TAB 4: PLATFORM AUDIT LOG SYSTEM */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-4">
          <Card className="p-4 border-border-default grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Search Audit Logs</label>
              <input
                type="text"
                placeholder="Search action or target ID..."
                value={auditSearch}
                onChange={(e) => { setAuditSearch(e.target.value); setAuditPage(1); }}
                className="w-full h-8 px-3 bg-surface rounded-md border border-border-default text-xs text-text-primary focus:border-brand-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Filter Action</label>
              <input
                type="text"
                placeholder="e.g. USER_STATUS_UPDATE, MODERATION..."
                value={auditAction}
                onChange={(e) => { setAuditAction(e.target.value); setAuditPage(1); }}
                className="w-full h-8 px-3 bg-surface rounded-md border border-border-default text-xs text-text-primary focus:border-brand-primary outline-none"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setAuditSearch(''); setAuditAction(''); setAuditPage(1); }}
                className="w-full h-8 text-xs"
              >
                Clear Filters
              </Button>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden border-border-default">
            {auditLoading ? (
              <div className="p-12 text-center text-sm text-text-secondary">Loading audit trail...</div>
            ) : !auditData || auditData.items.length === 0 ? (
              <div className="p-8">
                <EmptyState title="No audit logs match criteria" description="Platform audit records will appear here as actions occur." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-surface-muted border-b border-border-default text-xs font-semibold text-text-secondary">
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Target</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Payload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {auditData.items.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-semibold text-xs text-brand-primary bg-blue-50 px-2 py-0.5 rounded">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-text-secondary">
                          {log.actor ? (
                            <div>
                              <div className="font-medium text-text-primary">{log.actor.email}</div>
                              <span className="text-[10px] text-text-muted">{log.actor.role}</span>
                            </div>
                          ) : (
                            <span className="text-text-muted italic">System Automated</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-text-secondary">
                          <span className="font-semibold text-text-primary">{log.targetType}</span>
                          {log.targetId && (
                            <div className="text-[10px] text-text-muted font-mono">{log.targetId.substring(0, 12)}...</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-text-secondary">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAuditLog(log)}
                            className="h-7 text-xs text-brand-primary"
                          >
                            Inspect JSON
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 5: GDPR PRIVACY REQUESTS */}
      {activeTab === 'GDPR' && (
        <div className="space-y-4">
          <Card className="p-0 overflow-hidden border-border-default">
            <div className="p-4 border-b border-border-default flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-text-primary">GDPR & Data Subject Requests</h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Fulfill user Right to Access (Data Export) and Right to be Forgotten (Account Erasure) within the 30-day statutory SLA.
                </p>
              </div>
            </div>
            {gdprLoading ? (
              <div className="p-12 text-center text-sm text-text-secondary">Loading GDPR requests...</div>
            ) : !gdprRequests || gdprRequests.length === 0 ? (
              <div className="p-8">
                <EmptyState title="No active GDPR requests" description="User data export and erasure requests will be listed here." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-surface-muted border-b border-border-default text-xs font-semibold text-text-secondary">
                      <th className="py-3 px-4">User Account</th>
                      <th className="py-3 px-4">Request Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">SLA Deadline</th>
                      <th className="py-3 px-4">Submitted Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {gdprRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-surface-muted/50 transition-colors">
                        <td className="py-3 px-4 text-xs">
                          <div className="font-semibold text-text-primary">{req.user?.email || req.userId}</div>
                          <div className="text-[10px] text-text-muted">{req.user?.role}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={req.requestType === 'DATA_EXPORT' ? 'primary' : 'danger'}>
                            {req.requestType === 'DATA_EXPORT' ? 'Data Export (Access)' : 'Erasure (Forget)'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <StatusPill status={req.status} />
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <span className="font-semibold text-amber-800">
                            {new Date(req.slaDeadline).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-text-secondary">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {req.status === 'SUBMITTED' || req.status === 'PROCESSING' ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => { setGdprProcessModal(req); setGdprAction('COMPLETED'); }}
                              className="h-8 text-xs"
                            >
                              Fulfill Request
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedGdpr(req)}
                              className="h-8 text-xs text-brand-primary"
                            >
                              View Details
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* RESOLVE REPORT MODAL */}
      {resolveModalReport && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-xl border border-border-default shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-text-primary">
              Resolve Moderation Report: {resolveModalReport.action}
            </h3>
            <p className="text-xs text-text-secondary">
              Target ID: <span className="font-mono">{resolveModalReport.report.targetId}</span> ({resolveModalReport.report.targetType})
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Mandatory Moderator Resolution Notes
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why this action is taken for audit compliance..."
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  className="w-full p-2.5 bg-surface rounded-md border border-border-default text-xs text-text-primary focus:border-brand-primary outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setResolveModalReport(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={resolveMutation.isPending}>
                  {resolveMutation.isPending ? 'Resolving...' : 'Confirm Resolution'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROCESS GDPR MODAL */}
      {gdprProcessModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-xl border border-border-default shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-text-primary">
              Process GDPR Subject Request
            </h3>
            <p className="text-xs text-text-secondary">
              User: <span className="font-semibold">{gdprProcessModal.user?.email}</span> ({gdprProcessModal.requestType})
            </p>

            <form onSubmit={handleProcessGdprSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Outcome</label>
                <select
                  value={gdprAction}
                  onChange={(e) => setGdprAction(e.target.value as any)}
                  className="w-full h-9 px-3 bg-surface rounded-md border border-border-default text-xs text-text-primary focus:border-brand-primary outline-none"
                >
                  <option value="COMPLETED">Fulfill / Complete (Generate Archive or Anonymize)</option>
                  <option value="REJECTED">Reject Request</option>
                </select>
              </div>

              {gdprAction === 'REJECTED' && (
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Rejection Reason</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Provide statutory justification for rejection..."
                    value={gdprRejectionReason}
                    onChange={(e) => setGdprRejectionReason(e.target.value)}
                    className="w-full p-2 bg-surface rounded-md border border-border-default text-xs text-text-primary outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setGdprProcessModal(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={processGdprMutation.isPending}>
                  {processGdprMutation.isPending ? 'Processing...' : 'Confirm'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JSON PAYLOAD INSPECTOR MODAL (FOR AUDIT OR GDPR) */}
      {(selectedAuditLog || selectedGdpr) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-xl border border-border-default shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border-default pb-3">
              <h3 className="text-base font-bold text-text-primary">
                {selectedAuditLog ? `Audit Event: ${selectedAuditLog.action}` : 'GDPR Data Package'}
              </h3>
              <button
                onClick={() => { setSelectedAuditLog(null); setSelectedGdpr(null); }}
                className="text-text-muted hover:text-text-primary text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs">
              <pre>
                {JSON.stringify(
                  selectedAuditLog ? (selectedAuditLog.detailsJson || selectedAuditLog) : (selectedGdpr?.detailsJson || selectedGdpr),
                  null,
                  2
                )}
              </pre>
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => { setSelectedAuditLog(null); setSelectedGdpr(null); }}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminModerationPage;
