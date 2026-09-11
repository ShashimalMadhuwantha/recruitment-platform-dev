import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { usePublicJobDetails, useToggleSaveJob } from '../../features/job-search/hooks';
import { useAuth } from '../../app/providers';
import { PreApplyMatchPreviewDrawer } from '../../features/ats-scoring/components/PreApplyMatchPreviewDrawer';
import { ApplyJobModal } from '../../features/application/components/ApplyJobModal';
import {
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Bookmark,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Share2,
  AlertCircle,
  GraduationCap,
  Award,
} from 'lucide-react';

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: job, isLoading, refetch } = usePublicJobDetails(id);
  const toggleSaveMutation = useToggleSaveJob();

  const [isPreviewDrawerOpen, setIsPreviewDrawerOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-20 text-center text-xs text-text-secondary">
        Loading job vacancy details...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-20 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-text-primary">Job Vacancy Not Found</h2>
        <p className="text-xs text-text-secondary">The role you are looking for may have been closed or expired.</p>
        <Link to="/jobs">
          <Button variant="primary" size="sm">
            Back to Job Board
          </Button>
        </Link>
      </div>
    );
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleApplyClick = () => {
    if (!user) {
      navigate(`/auth/login?redirect=/jobs/${job.id}`);
      return;
    }
    setIsApplyModalOpen(true);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8 space-y-8">
      {/* Back Link */}
      <div>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-brand-600 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to all vacancies
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="bg-surface rounded-xl border border-border-default p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center font-bold text-brand-700 text-2xl shrink-0">
              {job.companyName.charAt(0)}
            </div>
            <div>
              <span className="text-xs font-semibold text-text-secondary">
                {job.companyName} • {job.companyIndustry || 'Technology'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-brand-900 tracking-tight mt-0.5">
                {job.title}
              </h1>

              {/* Key Highlights */}
              <div className="flex flex-wrap items-center gap-3 pt-3 text-xs text-text-secondary">
                <span className="inline-flex items-center gap-1 bg-surface-muted px-2.5 py-1 rounded-md border border-border-default font-medium">
                  <MapPin className="w-3.5 h-3.5 text-text-muted" />
                  {job.location || 'Remote'}
                </span>
                <span className="inline-flex items-center gap-1 bg-surface-muted px-2.5 py-1 rounded-md border border-border-default font-medium">
                  <Briefcase className="w-3.5 h-3.5 text-text-muted" />
                  {job.employmentType.replace('_', ' ')}
                </span>
                {job.salaryMin && job.salaryMax && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-200 font-semibold">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} / year
                  </span>
                )}
                {job.deadline && (
                  <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    Apply by {new Date(job.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Share link button */}
            <Button variant="ghost" size="sm" onClick={handleCopyLink} title="Share job posting">
              <Share2 className="w-4 h-4 mr-1.5 text-text-secondary" />
              {copiedLink ? 'Copied!' : 'Share'}
            </Button>

            {/* Bookmark button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toggleSaveMutation.mutate(job.id)}
              disabled={toggleSaveMutation.isPending}
            >
              <Bookmark className={`w-4 h-4 mr-1.5 ${job.isSaved ? 'fill-amber-600 text-amber-600' : ''}`} />
              {job.isSaved ? 'Saved' : 'Save'}
            </Button>

            {/* Match Preview CTA (Epic 7 Integration) */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsPreviewDrawerOpen(true)}
              className="border-brand-300 hover:border-brand-600 text-brand-700 bg-brand-50 hover:bg-brand-100"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-brand-600" />
              Check Match Score
            </Button>

            {/* Apply Action */}
            {job.hasApplied ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Applied
              </span>
            ) : (
              <Button variant="primary" size="sm" onClick={handleApplyClick}>
                Apply Now
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Details Column + Sidebar Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Description & Requirements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description Card */}
          <Card className="p-6 sm:p-8 space-y-4">
            <h2 className="text-base font-bold text-brand-900 border-b border-border-default pb-2">
              Role Overview & Responsibilities
            </h2>
            <div className="text-xs sm:text-sm text-text-primary leading-relaxed whitespace-pre-line">
              {job.description}
            </div>

            {job.requirementsSummary && (
              <div className="pt-4 border-t border-border-default space-y-2">
                <h3 className="text-xs font-bold text-text-primary">Key Requirements Summary</h3>
                <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">
                  {job.requirementsSummary}
                </p>
              </div>
            )}
          </Card>

          {/* Required Skills Card */}
          {job.requiredSkills.length > 0 && (
            <Card className="p-6 sm:p-8 space-y-4">
              <h2 className="text-base font-bold text-brand-900 border-b border-border-default pb-2">
                Technical Taxonomy & Required Skills
              </h2>
              <p className="text-xs text-text-secondary">
                Our automated ATS scoring engine evaluates your proficiency against these required technical dimensions:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {job.requiredSkills.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 bg-surface-muted rounded-lg border border-border-default flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-text-primary">{s.name}</p>
                      <p className="text-[11px] text-text-secondary">
                        Min. Proficiency: {s.minProficiency} / 5
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        s.priority === 'MUST_HAVE'
                          ? 'bg-brand-50 text-brand-700 border-brand-200'
                          : 'bg-surface text-text-secondary border-border-default'
                      }`}
                    >
                      {s.priority === 'MUST_HAVE' ? 'Must Have' : 'Nice to Have'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Screening Questions Notice */}
          {job.screeningQuestions && job.screeningQuestions.length > 0 && (
            <Card className="p-6 border-brand-200 bg-brand-50/30 space-y-2">
              <h3 className="text-xs font-bold text-brand-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-brand-600" />
                Pre-Screening Questionnaire Notice
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                This vacancy contains {job.screeningQuestions.length} applicant screening question(s). You will answer these questions during the submission flow.
              </p>
            </Card>
          )}
        </div>

        {/* Right 1 Col: Sidebar Info & Sticky Apply Card */}
        <div className="lg:col-span-1 space-y-6 sticky top-20">
          <Card className="p-6 space-y-5 border-border-default">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Position Highlights
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3">
                <Briefcase className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-text-primary">Employment Type</p>
                  <p className="text-text-secondary">{job.employmentType.replace('_', ' ')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-text-primary">Location</p>
                  <p className="text-text-secondary">{job.location || 'Remote'}</p>
                </div>
              </div>

              {job.requirements?.minExperienceYears !== null && job.requirements?.minExperienceYears !== undefined && (
                <div className="flex items-start gap-3">
                  <Award className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-text-primary">Experience Required</p>
                    <p className="text-text-secondary">
                      {job.requirements.minExperienceYears}+ years
                    </p>
                  </div>
                </div>
              )}

              {job.requirements?.educationLevel && (
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-text-primary">Education Level</p>
                    <p className="text-text-secondary">{job.requirements.educationLevel}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border-default space-y-2.5">
              <Button
                variant="primary"
                className="w-full justify-center"
                onClick={handleApplyClick}
                disabled={job.hasApplied}
              >
                {job.hasApplied ? 'Already Applied' : 'Apply for This Vacancy'}
              </Button>

              <Button
                variant="secondary"
                className="w-full justify-center"
                onClick={() => setIsPreviewDrawerOpen(true)}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 text-brand-600" />
                Preview ATS Match
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Epic 7 Pre-Apply Match Preview Drawer */}
      <PreApplyMatchPreviewDrawer
        jobId={job.id}
        isOpen={isPreviewDrawerOpen}
        onClose={() => setIsPreviewDrawerOpen(false)}
        onProceedToApply={() => {
          setIsPreviewDrawerOpen(false);
          setIsApplyModalOpen(true);
        }}
      />

      {/* Epic 8 Multi-Step Apply Modal */}
      <ApplyJobModal
        job={job}
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
};

export default JobDetailPage;
