import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTalentPool } from '../../features/recruiter-pipeline/hooks';
import { TalentPoolCandidateDto } from '../../features/recruiter-pipeline/types';
import { apiClient } from '../../lib/api-client';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
  Search,
  Compass,
  MapPin,
  Briefcase,
  FileText,
  EyeOff,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  X,
} from 'lucide-react';

const COMMON_SKILLS = [
  'React',
  'TypeScript',
  'Node.js',
  'Python',
  'Java',
  'AWS',
  'Docker',
  'SQL',
  'Tailwind CSS',
  'GraphQL',
];

export const TalentPoolPage: React.FC = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [minExperience, setMinExperience] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useTalentPool({
    search: search || undefined,
    skills: selectedSkills.length > 0 ? selectedSkills : undefined,
    minExperience: minExperience || undefined,
    page,
    limit: 12,
  });

  const candidates = data?.candidates || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedSkills([]);
    setMinExperience(undefined);
    setPage(1);
  };

  const [downloadingCandidateId, setDownloadingCandidateId] = useState<string | null>(null);

  const handleDownloadCv = async (candidate: TalentPoolCandidateDto) => {
    if (!candidate.cvUrl) return;
    try {
      setDownloadingCandidateId(candidate.id);
      let endpoint = candidate.cvUrl;
      if (endpoint.startsWith('/api/')) {
        endpoint = endpoint.replace(/^\/api/, '');
      }
      const res = await apiClient.get(endpoint, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName =
        candidate.cvFileName ||
        `${candidate.fullName.replace(/[^a-zA-Z0-9_-]/g, '_')}_CV.pdf`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to download CV:', err);
      if (candidate.cvUrl.startsWith('http')) {
        window.open(candidate.cvUrl, '_blank');
      } else {
        alert('Unable to download CV. The file may no longer be available.');
      }
    } finally {
      setDownloadingCandidateId(null);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-default">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-brand-600" />
            <h1 className="text-2xl font-bold text-brand-900 tracking-tight">
              Talent Pool Sourcing
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Proactively discover and source verified candidate profiles across skills, experience, and location. Strictly complies with candidate privacy settings (Blind Profiles masked).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/recruiter/pipeline')}
            className="text-xs"
          >
            ← Back to Pipeline
          </Button>
        </div>
      </div>

      {/* Sourcing Search & Filters Card */}
      <div className="bg-surface rounded-2xl border border-border-default p-5 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search talent by keyword, headline, summary, or city..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-9 py-2.5 text-xs text-text-primary bg-surface-muted border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 placeholder:text-text-muted"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Min Experience Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-text-secondary whitespace-nowrap">
              Experience:
            </label>
            <select
              value={minExperience !== undefined ? minExperience : ''}
              onChange={(e) => {
                setMinExperience(e.target.value ? Number(e.target.value) : undefined);
                setPage(1);
              }}
              className="text-xs font-medium text-text-primary bg-surface-muted border border-border-default rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-brand-600"
            >
              <option value="">Any Experience</option>
              <option value="1">1+ Years</option>
              <option value="3">3+ Years</option>
              <option value="5">5+ Years</option>
              <option value="8">8+ Years</option>
            </select>
          </div>
        </div>

        {/* Skill Filter Tags */}
        <div className="space-y-1.5 pt-2 border-t border-border-default text-xs">
          <span className="font-semibold text-text-secondary text-[11px] uppercase tracking-wider">
            Quick Skill Filters:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_SKILLS.map((skill) => {
              const isSelected = selectedSkills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    isSelected
                      ? 'bg-brand-600 text-white border-brand-600 shadow-2xs'
                      : 'bg-surface-muted text-text-secondary border-border-default hover:bg-surface-hover hover:text-text-primary'
                  }`}
                >
                  {isSelected ? '✓ ' : '+ '}
                  {skill}
                </button>
              );
            })}

              {(selectedSkills.length > 0 || search || minExperience !== undefined) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-2.5 py-1 text-xs font-semibold text-brand-600 hover:text-brand-700 underline ml-2"
                >
                  Clear All Filters
                </button>
              )}
            </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span>
          Found <strong className="text-text-primary">{total}</strong> candidate profile
          {total === 1 ? '' : 's'}
        </span>
        {isLoading && (
          <div className="flex items-center gap-1.5 text-brand-600">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Searching candidate directory...</span>
          </div>
        )}
      </div>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {candidates.map((candidate) => (
          <Card
            key={candidate.id}
            className={`p-5 rounded-2xl border transition-all space-y-3.5 bg-surface hover:shadow-md ${
              candidate.isBlind
                ? 'border-indigo-200 bg-indigo-50/10'
                : 'border-border-default hover:border-brand-600/40'
            }`}
          >
            {/* Top Row: Name / Blind badge */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-11 h-11 rounded-full font-bold text-sm flex items-center justify-center shrink-0 ${
                    candidate.isBlind
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      : 'bg-brand-50 text-brand-700 border border-brand-200'
                  }`}
                >
                  {candidate.isBlind ? (
                    <EyeOff className="w-5 h-5 text-indigo-600" />
                  ) : (
                    candidate.fullName.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-text-primary truncate">
                    {candidate.fullName}
                  </h3>
                  <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">
                    {candidate.headline || 'Candidate Profile'}
                  </p>
                </div>
              </div>

              {candidate.isBlind && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0"
                  title="Blind Profile: Candidate identity is protected until mutual interest."
                >
                  <ShieldCheck className="w-3 h-3 text-indigo-600" />
                  <span>Blind Profile</span>
                </span>
              )}
            </div>

            {/* Meta tags: location & experience */}
            <div className="flex items-center gap-3 text-xs text-text-secondary flex-wrap">
              {candidate.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span>{candidate.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span>{candidate.experienceYears ?? 0} Years Experience</span>
              </div>
            </div>

            {/* Bio / Summary snippet */}
            {candidate.summary && (
              <p className="text-xs text-text-secondary line-clamp-2 italic bg-surface-muted p-2.5 rounded-lg border border-border-default/60">
                "{candidate.summary}"
              </p>
            )}

            {/* Candidate Skills */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                Top Skills
              </span>
              <div className="flex flex-wrap gap-1">
                {candidate.skills.slice(0, 6).map((s) => (
                  <span
                    key={s.name}
                    className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-muted text-text-secondary border border-border-default"
                  >
                    {s.name}
                  </span>
                ))}
                {candidate.skills.length > 6 && (
                  <span className="px-1.5 py-0.5 text-[10px] text-text-muted font-medium">
                    +{candidate.skills.length - 6} more
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-border-default flex items-center justify-between gap-2">
              {candidate.cvUrl ? (
                <button
                  type="button"
                  onClick={() => handleDownloadCv(candidate)}
                  disabled={downloadingCandidateId === candidate.id}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Download candidate CV"
                >
                  {downloadingCandidateId === candidate.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  <span>Download CV</span>
                </button>
              ) : (
                <span className="text-[11px] text-text-muted">
                  {candidate.isBlind ? 'CV masked for privacy' : 'No public CV'}
                </span>
              )}

              {candidate.email ? (
                <a
                  href={`mailto:${candidate.email}?subject=Exciting Career Opportunity`}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors flex items-center gap-1"
                >
                  <Mail className="w-3 h-3" />
                  <span>Contact</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      `Candidate has privacy protections enabled. Invite to apply through your active vacancy to connect.`
                    )
                  }
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-surface-muted text-text-secondary border border-border-default hover:bg-surface-hover transition-colors"
                >
                  Invite to Job
                </button>
              )}
            </div>
          </Card>
        ))}

        {!isLoading && candidates.length === 0 && (
          <div className="col-span-full py-16 text-center bg-surface rounded-2xl border border-border-default space-y-3">
            <Compass className="w-10 h-10 text-text-muted mx-auto" />
            <h3 className="text-base font-bold text-text-primary">No candidates found</h3>
            <p className="text-xs text-text-secondary max-w-md mx-auto">
              Try broadening your search query, removing skill filters, or lowering minimum experience requirements.
            </p>
            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Clear All Search Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border-default text-xs">
          <span className="text-text-secondary">
            Page <strong className="text-text-primary">{page}</strong> of{' '}
            <strong className="text-text-primary">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="gap-1 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="gap-1 text-xs"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TalentPoolPage;
