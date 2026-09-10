import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Search,
  Copy,
  Check,
  Edit,
  Trash2,
  Users,
  ExternalLink,
  MoreVertical,
  Play,
  Pause,
  XCircle,
  Clock,
  MapPin,
  Calendar,
} from 'lucide-react';
import {
  useCompanyJobs,
  useUpdateJobStatus,
  useCloneJob,
  useDeleteJob,
} from '../../features/job-vacancy/hooks';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { JobStatus, RecruiterJobListItem } from '../../features/job-vacancy/types';

export const RecruiterJobsPage: React.FC = () => {
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<JobStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [shareModalJob, setShareModalJob] = useState<RecruiterJobListItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const { data, isLoading } = useCompanyJobs({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    search: search || undefined,
    page: 1,
    limit: 50,
  });

  const updateStatusMutation = useUpdateJobStatus();
  const cloneMutation = useCloneJob();
  const deleteMutation = useDeleteJob();

  const handleStatusChange = async (id: string, newStatus: JobStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update job status.');
    }
  };

  const handleClone = async (id: string) => {
    try {
      const cloned = await cloneMutation.mutateAsync(id);
      navigate(`/recruiter/jobs/${cloned.id}/edit`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to duplicate job vacancy.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete or archive '${title}'?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete job vacancy.');
    }
  };

  const copyPublicLink = (jobId: string) => {
    const url = `${window.location.origin}/jobs/${jobId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'PAUSED':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'CLOSED':
        return 'bg-rose-50 text-rose-700 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-brand-600" />
            Job Vacancy Management
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Create, track, and manage role lifecycles, screening rules, and candidate application pipelines.
          </p>
        </div>
        <Link to="/recruiter/jobs/new">
          <Button variant="primary" size="sm" className="shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" /> Post New Vacancy
          </Button>
        </Link>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-1 border-b border-border-default sm:border-0 pb-2 sm:pb-0">
          {(['ALL', 'PUBLISHED', 'DRAFT', 'PAUSED', 'CLOSED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              {st === 'ALL' ? 'All Roles' : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-secondary" />
          <input
            type="text"
            placeholder="Search vacancies by title or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-surface border border-border-default text-xs text-text-primary placeholder-text-secondary focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Vacancies Table Card */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-text-secondary text-xs">Loading job vacancies...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text-primary">
              <thead className="bg-surface-muted text-text-secondary font-semibold uppercase border-b border-border-default">
                <tr>
                  <th className="py-3.5 px-4">Role / Title</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Applications</th>
                  <th className="py-3.5 px-4">Timeline</th>
                  <th className="py-3.5 px-4 text-right">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default bg-surface">
                {data?.items.map((job) => (
                  <tr key={job.id} className="hover:bg-surface-hover transition">
                    {/* Title & Info */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-sm text-text-primary hover:text-brand-700 transition">
                        <Link to={`/recruiter/jobs/${job.id}/edit`}>{job.title}</Link>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-text-secondary mt-1">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-text-muted" />
                          {job.employmentType.replace('_', ' ')}
                        </span>
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-text-muted" />
                            {job.location}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(job.status)}`}>
                        {job.status}
                      </span>
                    </td>

                    {/* Applications Count */}
                    <td className="py-4 px-4">
                      <Link
                        to="/recruiter"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold transition border border-brand-200"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{job.applicationsCount} Candidates</span>
                      </Link>
                    </td>

                    {/* Timeline */}
                    <td className="py-4 px-4 text-text-secondary text-[11px]">
                      <div>Created: {new Date(job.createdAt).toLocaleDateString()}</div>
                      {job.deadline ? (
                        <div className="text-brand-700 font-medium mt-0.5">
                          Expires: {new Date(job.deadline).toLocaleDateString()}
                        </div>
                      ) : (
                        <div className="text-text-muted mt-0.5">No deadline</div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick status transitions */}
                        {job.status === 'DRAFT' && (
                          <button
                            onClick={() => handleStatusChange(job.id, 'PUBLISHED')}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[11px] font-semibold border border-emerald-300 transition"
                            title="Publish Vacancy"
                          >
                            Publish
                          </button>
                        )}
                        {job.status === 'PUBLISHED' && (
                          <button
                            onClick={() => handleStatusChange(job.id, 'PAUSED')}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded text-[11px] font-semibold border border-amber-300 transition"
                            title="Pause Vacancy"
                          >
                            Pause
                          </button>
                        )}
                        {job.status === 'PAUSED' && (
                          <button
                            onClick={() => handleStatusChange(job.id, 'PUBLISHED')}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[11px] font-semibold border border-emerald-300 transition"
                            title="Re-activate Vacancy"
                          >
                            Activate
                          </button>
                        )}
                        {job.status !== 'CLOSED' && (
                          <button
                            onClick={() => handleStatusChange(job.id, 'CLOSED')}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold border border-slate-300 transition"
                            title="Close Vacancy"
                          >
                            Close
                          </button>
                        )}

                        {/* Share link */}
                        <button
                          onClick={() => setShareModalJob(job)}
                          className="p-1.5 text-text-secondary hover:text-brand-600 rounded hover:bg-surface-hover transition"
                          title="Share Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <Link
                          to={`/recruiter/jobs/${job.id}/edit`}
                          className="p-1.5 text-text-secondary hover:text-brand-600 rounded hover:bg-surface-hover transition"
                          title="Edit Vacancy"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>

                        {/* Duplicate */}
                        <button
                          onClick={() => handleClone(job.id)}
                          className="p-1.5 text-text-secondary hover:text-brand-600 rounded hover:bg-surface-hover transition"
                          title="Duplicate Vacancy"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(job.id, job.title)}
                          className="p-1.5 text-text-secondary hover:text-rose-600 rounded hover:bg-surface-hover transition"
                          title="Delete / Archive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {data?.items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-text-secondary">
                      <Briefcase className="w-8 h-8 text-text-muted mx-auto mb-2" />
                      <p className="font-semibold text-text-primary">No job vacancies found</p>
                      <p className="text-xs text-text-secondary mt-1">
                        Click "Post New Vacancy" above to start hiring with automated ATS scoring.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Share Job Modal */}
      {shareModalJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border-default rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-brand-600" />
              Public Candidate Application Link
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Share this direct URL on LinkedIn, job boards, or email. Applicants can view requirements, check their match score, and apply online.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/jobs/${shareModalJob.id}`}
                className="w-full px-3 py-2 rounded-lg bg-surface-muted border border-border-default text-xs font-mono text-text-primary"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => copyPublicLink(shareModalJob.id)}
                className="shrink-0"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-300 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {copiedLink ? 'Copied!' : 'Copy'}
              </Button>
            </div>

            <div className="flex justify-end pt-3 border-t border-border-default">
              <Button variant="secondary" size="sm" onClick={() => setShareModalJob(null)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterJobsPage;
