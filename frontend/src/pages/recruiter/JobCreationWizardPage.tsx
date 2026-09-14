import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Save,
  Send,
  Plus,
  Trash2,
  Sliders,
  ShieldAlert,
  Star,
  Zap,
  HelpCircle,
  Search,
  Check,
  Filter,
} from 'lucide-react';
import {
  useCreateJob,
  useUpdateJob,
  useJobDetails,
  useCheckCompliance,
} from '../../features/job-vacancy/hooks';
import { useSkillsTaxonomy, useAtsWeights, useCreateSkill } from '../../features/system-config/hooks';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type {
  CreateJobVacancyDto,
  JobStatus,
  EmploymentType,
  SkillPriority,
  ScreeningQuestion,
  JobRequiredSkillDto,
  ScoreWeightConfig,
  JobComplianceCheckResult,
} from '../../features/job-vacancy/types';

export const JobCreationWizardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirementsSummary, setRequirementsSummary] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('FULL_TIME');
  const [salaryMin, setSalaryMin] = useState<number | ''>('');
  const [salaryMax, setSalaryMax] = useState<number | ''>('');
  const [deadline, setDeadline] = useState('');

  // Step 2: Requirements & Skills
  const [minExp, setMinExp] = useState<number | ''>('');
  const [maxExp, setMaxExp] = useState<number | ''>('');
  const [educationLevel, setEducationLevel] = useState('Bachelor');
  const [certificationsInput, setCertificationsInput] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<JobRequiredSkillDto[]>([]);

  // Step 3: ATS Weights & Screening
  const [useCustomWeights, setUseCustomWeights] = useState(false);
  const [customWeights, setCustomWeights] = useState<ScoreWeightConfig>({
    skillsWeight: 0.40,
    experienceWeight: 0.25,
    educationWeight: 0.15,
    semanticWeight: 0.15,
    certificationWeight: 0.05,
  });
  const [screeningQuestions, setScreeningQuestions] = useState<ScreeningQuestion[]>([]);

  // Step 4: Compliance Scan
  const [complianceResult, setComplianceResult] = useState<JobComplianceCheckResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Queries & Mutations
  const { data: existingJob, isLoading: isLoadingJob } = useJobDetails(id);
  const { data: taxonomySkills, isLoading: isLoadingSkills } = useSkillsTaxonomy();
  const skillList = Array.isArray(taxonomySkills) ? taxonomySkills : [];
  const { data: defaultWeightsData } = useAtsWeights();
  const createJobMutation = useCreateJob();
  const updateJobMutation = useUpdateJob();
  const complianceMutation = useCheckCompliance();
  const createSkillMutation = useCreateSkill();

  // Inline custom skill creation state
  const [isAddingCustomSkill, setIsAddingCustomSkill] = useState(false);
  const [customSkillName, setCustomSkillName] = useState('');
  const [customSkillCategory, setCustomSkillCategory] = useState('');

  // Skills search & category filters for Step 2
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [selectedSkillCategory, setSelectedSkillCategory] = useState('ALL');

  // Group skills by category for rich display
  const skillsByCategory = useMemo(() => {
    const map: Record<string, typeof skillList> = {};
    for (const skill of skillList) {
      const cat = skill.category || 'General';
      if (!map[cat]) map[cat] = [];
      map[cat].push(skill);
    }
    return map;
  }, [skillList]);

  const uniqueCategories = useMemo(() => {
    return ['ALL', ...Object.keys(skillsByCategory).sort()];
  }, [skillsByCategory]);

  const filteredSkills = useMemo(() => {
    return skillList.filter((s) => {
      const matchesSearch =
        !skillSearchQuery.trim() ||
        s.name.toLowerCase().includes(skillSearchQuery.toLowerCase()) ||
        (Array.isArray(s.aliasesJson) &&
          (s.aliasesJson as string[]).some((a) =>
            a.toLowerCase().includes(skillSearchQuery.toLowerCase())
          ));
      const matchesCategory =
        selectedSkillCategory === 'ALL' || s.category === selectedSkillCategory;
      return matchesSearch && matchesCategory;
    });
  }, [skillList, skillSearchQuery, selectedSkillCategory]);

  // Populate data in edit mode
  useEffect(() => {
    if (existingJob) {
      setTitle(existingJob.title || '');
      setDescription(existingJob.description || '');
      setRequirementsSummary(existingJob.requirementsSummary || '');
      setLocation(existingJob.location || '');
      setEmploymentType(existingJob.employmentType || 'FULL_TIME');
      setSalaryMin(existingJob.salaryMin != null ? Number(existingJob.salaryMin) : '');
      setSalaryMax(existingJob.salaryMax != null ? Number(existingJob.salaryMax) : '');
      setDeadline(existingJob.deadline ? existingJob.deadline.substring(0, 10) : '');

      if (existingJob.jobRequirement) {
        setMinExp(existingJob.jobRequirement.minExperienceYears != null ? Number(existingJob.jobRequirement.minExperienceYears) : '');
        setMaxExp(existingJob.jobRequirement.maxExperienceYears != null ? Number(existingJob.jobRequirement.maxExperienceYears) : '');
        setEducationLevel(existingJob.jobRequirement.educationLevel || 'Bachelor');
        if (Array.isArray(existingJob.jobRequirement.requiredCertifications)) {
          setCertificationsInput((existingJob.jobRequirement.requiredCertifications as string[]).join(', '));
        }
      }

      if (existingJob.jobRequiredSkills) {
        setSelectedSkills(
          existingJob.jobRequiredSkills.map((s) => ({
            skillId: s.skillId,
            priority: s.priority,
            weight: Number(s.weight),
            minProficiency: s.minProficiency,
            skill: s.skill,
          }))
        );
      }

      if (existingJob.screeningQuestionsJson && Array.isArray(existingJob.screeningQuestionsJson)) {
        setScreeningQuestions(existingJob.screeningQuestionsJson as ScreeningQuestion[]);
      }

      if (existingJob.scoreWeightConfigs && existingJob.scoreWeightConfigs.length > 0) {
        setUseCustomWeights(true);
        const w = existingJob.scoreWeightConfigs[0];
        setCustomWeights({
          skillsWeight: Number(w.skillsWeight),
          experienceWeight: Number(w.experienceWeight),
          educationWeight: Number(w.educationWeight),
          semanticWeight: Number(w.semanticWeight),
          certificationWeight: Number(w.certificationWeight),
        });
      }
    }
  }, [existingJob]);

  // Helper to find violations in a specific text field
  const getFieldViolations = (text: string) => {
    if (!complianceResult?.violations || !text) return [];
    const lower = text.toLowerCase();
    return complianceResult.violations.filter((v) =>
      lower.includes(v.keyword.toLowerCase().trim())
    );
  };

  // Debounced real-time compliance check across title, description, and requirementsSummary
  useEffect(() => {
    const hasContent = title.trim() || description.trim() || requirementsSummary.trim();
    if (!hasContent) {
      setComplianceResult(null);
      return;
    }

    const timer = setTimeout(() => {
      complianceMutation
        .mutateAsync({
          title: title.trim(),
          description: description.trim(),
          requirementsSummary: requirementsSummary.trim(),
        })
        .then((res) => setComplianceResult(res))
        .catch(() => {});
    }, 350);

    return () => clearTimeout(timer);
  }, [title, description, requirementsSummary]);

  // Ensure compliance check runs immediately when moving to Step 4 if not yet loaded
  useEffect(() => {
    if (
      currentStep === 4 &&
      !complianceResult &&
      (title.trim() || description.trim() || requirementsSummary.trim())
    ) {
      complianceMutation
        .mutateAsync({
          title: title.trim(),
          description: description.trim(),
          requirementsSummary: requirementsSummary.trim(),
        })
        .then((res) => setComplianceResult(res))
        .catch(() => {});
    }
  }, [currentStep, complianceResult, title, description, requirementsSummary]);

  // Skills helpers
  const handleAddSkill = (skillId: string) => {
    if (!skillId) return;
    if (selectedSkills.some((s) => s.skillId === skillId)) return;
    const item = skillList.find((s) => s.id === skillId);
    setSelectedSkills((prev) => [
      ...prev,
      {
        skillId,
        priority: 'MUST_HAVE',
        weight: 1.0,
        minProficiency: 3,
        skill: item ? { id: item.id, name: item.name, category: item.category } : undefined,
      },
    ]);
  };

  const handleCreateAndAddCustomSkill = async () => {
    if (!customSkillName.trim()) return;
    try {
      const newSkill = await createSkillMutation.mutateAsync({
        name: customSkillName.trim(),
        category: customSkillCategory.trim() || 'General',
      });
      setSelectedSkills((prev) => [
        ...prev,
        {
          skillId: newSkill.id,
          priority: 'MUST_HAVE',
          weight: 1.0,
          minProficiency: 3,
          skill: { id: newSkill.id, name: newSkill.name, category: newSkill.category },
        },
      ]);
      setCustomSkillName('');
      setCustomSkillCategory('');
      setIsAddingCustomSkill(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to create custom skill');
    }
  };

  const handleRemoveSkill = (skillId: string) => {
    setSelectedSkills((prev) => prev.filter((s) => s.skillId !== skillId));
  };

  const handleUpdateSkillPriority = (skillId: string, priority: SkillPriority) => {
    setSelectedSkills((prev) =>
      prev.map((s) => (s.skillId === skillId ? { ...s, priority } : s))
    );
  };

  const handleUpdateSkillProficiency = (skillId: string, minProficiency: number) => {
    setSelectedSkills((prev) =>
      prev.map((s) => (s.skillId === skillId ? { ...s, minProficiency } : s))
    );
  };

  // Screening questions helpers
  const handleAddQuestion = () => {
    setScreeningQuestions((prev) => [
      ...prev,
      {
        id: `q-${Date.now()}`,
        question: '',
        type: 'YES_NO',
        isKnockout: false,
        requiredAnswer: 'YES',
      },
    ]);
  };

  const handleRemoveQuestion = (qId: string) => {
    setScreeningQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  // Validation before step changes
  const canProceedStep1 = title.trim().length >= 3 && description.trim().length >= 10;
  const totalWeightPercent = Math.round(
    (customWeights.skillsWeight +
      customWeights.experienceWeight +
      customWeights.educationWeight +
      customWeights.semanticWeight +
      customWeights.certificationWeight) *
      100
  );
  const isWeight100 = !useCustomWeights || totalWeightPercent === 100;

  // Submit action
  const handleSubmit = async (targetStatus: JobStatus) => {
    setFormError(null);

    const certsArray = certificationsInput
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const payload: CreateJobVacancyDto = {
      title: title.trim(),
      description: description.trim(),
      requirementsSummary: requirementsSummary.trim() || null,
      location: location.trim() || null,
      employmentType,
      salaryMin: salaryMin !== '' ? Number(salaryMin) : null,
      salaryMax: salaryMax !== '' ? Number(salaryMax) : null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      status: targetStatus,
      requirements: {
        minExperienceYears: minExp !== '' ? Number(minExp) : null,
        maxExperienceYears: maxExp !== '' ? Number(maxExp) : null,
        educationLevel: educationLevel || null,
        requiredCertifications: certsArray.length > 0 ? certsArray : null,
      },
      requiredSkills: selectedSkills.map((s) => ({
        skillId: s.skillId,
        priority: s.priority,
        weight: s.weight,
        minProficiency: s.minProficiency,
      })),
      screeningQuestions: screeningQuestions.filter((q) => q.question.trim().length > 0),
      atsWeightOverrides: useCustomWeights ? customWeights : null,
    };

    try {
      if (isEditMode) {
        await updateJobMutation.mutateAsync({ id: id!, data: payload });
      } else {
        await createJobMutation.mutateAsync(payload);
      }
      navigate('/recruiter/jobs');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'An error occurred while saving job vacancy.');
    }
  };

  if (isEditMode && isLoadingJob) {
    return <div className="py-12 text-center text-text-secondary text-xs">Loading job vacancy...</div>;
  }

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/recruiter/jobs" className="text-xs text-text-secondary hover:text-text-primary">
              &larr; Back to Vacancies
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-brand-600" />
            {isEditMode ? `Edit Vacancy: ${title || 'Job'}` : 'Create New Job Vacancy'}
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Follow the 4-step wizard to define role requirements, skill weights, screening criteria, and publish to the candidate portal.
          </p>
        </div>
      </div>

      {/* Step Indicator Bar */}
      <div className="grid grid-cols-4 gap-2 border-b border-border-default pb-4">
        {[
          { step: 1, label: '1. Role Overview' },
          { step: 2, label: '2. Skills & Requirements' },
          { step: 3, label: '3. ATS Weights & Rules' },
          { step: 4, label: '4. Compliance & Publish' },
        ].map((s) => (
          <button
            key={s.step}
            type="button"
            onClick={() => {
              if (s.step < currentStep || canProceedStep1) {
                setCurrentStep(s.step as 1 | 2 | 3 | 4);
              }
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold text-center transition ${
              currentStep === s.step
                ? 'bg-brand-600 text-white shadow-sm'
                : currentStep > s.step
                ? 'bg-brand-50 text-brand-700 border border-brand-200'
                : 'bg-surface-muted text-text-secondary'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Wizard Content Card */}
      <Card className="p-6">
        {/* ========================================================= */}
        {/* Step 1: Role Overview & Details */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-text-primary border-b border-border-default pb-2">
              Role Details & Overview
            </h2>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Job Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Full Stack Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-lg bg-surface border text-xs text-text-primary focus:outline-none font-medium ${
                  getFieldViolations(title).length > 0
                    ? 'border-rose-400 focus:border-rose-500 bg-rose-50/10'
                    : 'border-border-default focus:border-brand-500'
                }`}
              />
              {getFieldViolations(title).length > 0 && (
                <p className="text-[11px] text-[#B3423A] mt-1 flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  Contains prohibited keyword: {getFieldViolations(title).map((v) => `"${v.keyword}"`).join(', ')}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Employment Type</label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-brand-500"
                >
                  <option value="FULL_TIME">Full-time</option>
                  <option value="PART_TIME">Part-time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="REMOTE">Remote</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Location / Remote Hub</label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco, CA or Remote (US)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Salary Min (Annual $)</label>
                <input
                  type="number"
                  placeholder="e.g. 100000"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Salary Max (Annual $)</label>
                <input
                  type="number"
                  placeholder="e.g. 150000"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Application Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Short Requirements Summary</label>
              <input
                type="text"
                placeholder="Brief one-line highlight (e.g. 5+ years React, distributed backend architecture)"
                value={requirementsSummary}
                onChange={(e) => setRequirementsSummary(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg bg-surface border text-xs text-text-primary focus:outline-none ${
                  getFieldViolations(requirementsSummary).length > 0
                    ? 'border-rose-400 focus:border-rose-500 bg-rose-50/10'
                    : 'border-border-default focus:border-brand-500'
                }`}
              />
              {getFieldViolations(requirementsSummary).length > 0 && (
                <p className="text-[11px] text-[#B3423A] mt-1 flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  Contains prohibited keyword: {getFieldViolations(requirementsSummary).map((v) => `"${v.keyword}"`).join(', ')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Detailed Job Description *</label>
              <textarea
                rows={10}
                required
                placeholder="Describe role responsibilities, team structure, tech stack, and ideal background..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-lg bg-surface border text-xs text-text-primary focus:outline-none leading-relaxed font-sans ${
                  getFieldViolations(description).length > 0
                    ? 'border-rose-400 focus:border-rose-500 bg-rose-50/10'
                    : 'border-border-default focus:border-brand-500'
                }`}
              />
              {getFieldViolations(description).length > 0 && (
                <p className="text-[11px] text-[#B3423A] mt-1 flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  Contains prohibited keyword: {getFieldViolations(description).map((v) => `"${v.keyword}"`).join(', ')}
                </p>
              )}
            </div>

            {/* Real-time Compliance Status Banner on Step 1 */}
            {complianceResult?.hasViolations && (
              <div
                className={`p-4 rounded-lg border flex flex-col gap-2 transition-all ${
                  !complianceResult.canPublish
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : 'bg-amber-50 border-amber-300 text-amber-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-current" />
                  <span>
                    {!complianceResult.canPublish
                      ? 'Prohibited or Discriminatory Language Detected (Publication Blocked)'
                      : 'Content Policy Warnings Found'}
                  </span>
                </div>
                <p className="text-xs leading-relaxed">
                  {!complianceResult.canPublish
                    ? 'The compliance engine detected prohibited or discriminatory keywords in your job posting. This vacancy cannot be published until these issues are resolved:'
                    : 'The compliance engine flagged potential advisory content issues in your posting:'}
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {complianceResult.violations.map((v, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-white border border-current shadow-sm font-semibold flex items-center gap-1.5"
                    >
                      <span>"{v.keyword}"</span>
                      <span className="text-[10px] px-1 py-0.2 rounded font-sans font-bold bg-black/5">
                        {v.severity}
                      </span>
                    </span>
                  ))}
                </div>
                <p className="text-[11px] font-semibold mt-1">
                  {!complianceResult.canPublish
                    ? 'Please revise or remove these keywords in the Title, Requirements Summary, or Description above.'
                    : 'Review the flagged terms above to ensure your posting conforms with company guidelines.'}
                </p>
              </div>
            )}

            {complianceResult && !complianceResult.hasViolations && (title.trim() || description.trim() || requirementsSummary.trim()) && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Compliance check passed:</strong> No prohibited or discriminatory keywords detected.
                </span>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-border-default">
              <Button
                variant="primary"
                onClick={() => setCurrentStep(2)}
                disabled={!canProceedStep1}
              >
                Continue to Requirements &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* Step 2: Requirements & Taxonomy Skills Selection */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-base font-semibold text-text-primary border-b border-border-default pb-2">
              Requirements & Skills Taxonomy
            </h2>

            {/* Experience & Education */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Min Experience (Years)</label>
                <input
                  type="number"
                  placeholder="e.g. 3"
                  value={minExp}
                  onChange={(e) => setMinExp(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Max Experience (Years)</label>
                <input
                  type="number"
                  placeholder="e.g. 7"
                  value={maxExp}
                  onChange={(e) => setMaxExp(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Minimum Education Level</label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-brand-500"
                >
                  <option value="High School">High School</option>
                  <option value="Associate">Associate Degree</option>
                  <option value="Bachelor">Bachelor Degree</option>
                  <option value="Master">Master Degree</option>
                  <option value="Doctorate">Doctorate / Ph.D.</option>
                  <option value="None">No Specific Requirement</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Required Certifications (Comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. AWS Certified Solutions Architect, PMP, CISSP"
                value={certificationsInput}
                onChange={(e) => setCertificationsInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Required Skills Picker */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-text-primary">
                  Required Competencies & Skills (ATS Skills Match Sub-Score)
                </label>
              </div>

              {/* Rich Skill Selection System */}
              <div className="space-y-3 p-4 bg-surface-muted border border-border-default rounded-lg">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <span className="text-xs font-semibold text-text-primary">
                    Master Skills Dictionary ({skillList.length} total available)
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsAddingCustomSkill(!isAddingCustomSkill)}
                    className="self-start sm:self-auto text-xs"
                  >
                    {isAddingCustomSkill ? 'Cancel' : '+ Custom Skill'}
                  </Button>
                </div>

                {/* Inline Custom Skill Form */}
                {isAddingCustomSkill && (
                  <div className="p-3 bg-surface border border-border-default rounded-lg flex flex-col sm:flex-row gap-2.5 items-end">
                    <div className="flex-1 w-full">
                      <label className="block text-[11px] font-semibold text-text-primary mb-1">
                        Skill Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Docker, Kubernetes, GraphQL"
                        value={customSkillName}
                        onChange={(e) => setCustomSkillName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div className="w-full sm:w-48">
                      <label className="block text-[11px] font-semibold text-text-primary mb-1">
                        Category (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. DevOps, Backend"
                        value={customSkillCategory}
                        onChange={(e) => setCustomSkillCategory(e.target.value)}
                        className="w-full px-3 py-1.5 rounded bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleCreateAndAddCustomSkill}
                      disabled={!customSkillName.trim() || createSkillMutation.isPending}
                      className="shrink-0 text-xs h-[30px]"
                    >
                      {createSkillMutation.isPending ? 'Adding...' : 'Add to Role'}
                    </Button>
                  </div>
                )}

                {/* Search & Category Filter */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-secondary" />
                    <input
                      type="text"
                      placeholder="Search skills by name or alias (e.g. React, Python, AWS)..."
                      value={skillSearchQuery}
                      onChange={(e) => setSkillSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface border border-border-default text-xs text-text-primary placeholder-text-secondary focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  {/* Dropdown with optgroups */}
                  <select
                    id="skillSelector"
                    aria-label="Select a skill from master taxonomy to add"
                    defaultValue=""
                    onChange={(e) => {
                      handleAddSkill(e.target.value);
                      e.target.value = '';
                    }}
                    className="w-full sm:w-64 px-3 py-1.5 rounded-lg bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-brand-500"
                  >
                    <option value="" disabled>
                      {isLoadingSkills
                        ? 'Loading skills taxonomy...'
                        : skillList.length === 0
                        ? 'No skills in taxonomy'
                        : `+ Quick Select Dropdown (${skillList.length})...`}
                    </option>
                    {Object.entries(skillsByCategory).map(([cat, skills]) => (
                      <optgroup key={cat} label={cat}>
                        {skills.map((s) => (
                          <option
                            key={s.id}
                            value={s.id}
                            disabled={selectedSkills.some((sel) => sel.skillId === s.id)}
                          >
                            {s.name} {selectedSkills.some((sel) => sel.skillId === s.id) ? '✓ (Added)' : ''}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Category Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {uniqueCategories.map((cat) => {
                    const isSelected = selectedSkillCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedSkillCategory(cat)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition ${
                          isSelected
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'bg-surface text-text-secondary border border-border-default hover:border-brand-300'
                        }`}
                      >
                        {cat === 'ALL' ? 'All Skills' : cat}
                      </button>
                    );
                  })}
                </div>

                {/* Quick-Add Skill Badges Grid */}
                <div className="pt-2 border-t border-border-default">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] text-text-secondary font-medium">
                      Click any skill chip below to quickly add it to requirements:
                    </span>
                    <span className="text-[10px] text-text-muted">
                      Showing {filteredSkills.length} of {skillList.length}
                    </span>
                  </div>

                  {filteredSkills.length === 0 ? (
                    <div className="text-center py-4 text-xs text-text-secondary">
                      No skills match your filter. Use <strong>"+ Custom Skill"</strong> above to add it!
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {filteredSkills.map((s) => {
                        const isAdded = selectedSkills.some((sel) => sel.skillId === s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => !isAdded && handleAddSkill(s.id)}
                            disabled={isAdded}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1 ${
                              isAdded
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 opacity-60 cursor-default'
                                : 'bg-surface hover:bg-brand-50 text-text-primary hover:text-brand-700 border border-border-default hover:border-brand-300 cursor-pointer shadow-xs'
                            }`}
                          >
                            {isAdded ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Plus className="w-3 h-3 text-brand-600" />
                            )}
                            <span>{s.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Skills List */}
              <div className="space-y-2 mt-3">
                {selectedSkills.map((item) => (
                  <div
                    key={item.skillId}
                    className="p-3 bg-surface-muted border border-border-default rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-primary">{item.skill?.name || 'Skill'}</span>
                      <span className="text-[10px] text-text-secondary bg-surface px-2 py-0.5 rounded border border-border-default">
                        {item.skill?.category || 'General'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Priority toggle */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateSkillPriority(item.skillId, 'MUST_HAVE')}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                            item.priority === 'MUST_HAVE'
                              ? 'bg-rose-50 text-rose-700 border border-rose-300'
                              : 'bg-surface text-text-secondary border border-border-default'
                          }`}
                        >
                          Must Have
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateSkillPriority(item.skillId, 'NICE_TO_HAVE')}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                            item.priority === 'NICE_TO_HAVE'
                              ? 'bg-blue-50 text-blue-700 border border-blue-300'
                              : 'bg-surface text-text-secondary border border-border-default'
                          }`}
                        >
                          Nice to Have
                        </button>
                      </div>

                      {/* Proficiency stars */}
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-text-secondary mr-1">Min Level:</span>
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => handleUpdateSkillProficiency(item.skillId, lvl)}
                            className={`p-1 rounded ${
                              lvl <= item.minProficiency ? 'text-amber-500' : 'text-slate-300'
                            }`}
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </button>
                        ))}
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(item.skillId)}
                        className="p-1 text-text-secondary hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {selectedSkills.length === 0 && (
                  <div className="py-6 text-center text-xs text-text-muted border border-dashed border-border-default rounded-lg">
                    No skills added yet. Select skills from the dropdown above to compute candidate match scores.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-border-default">
              <Button variant="secondary" onClick={() => setCurrentStep(1)}>
                &larr; Back
              </Button>
              <Button variant="primary" onClick={() => setCurrentStep(3)}>
                Continue to ATS Weights &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* Step 3: Vacancy-Level ATS Weights & Screening Rules */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-base font-semibold text-text-primary border-b border-border-default pb-2">
              ATS Scoring Weights & Application Screening
            </h2>

            {/* Custom weights toggle */}
            <div className="p-4 bg-surface-muted border border-border-default rounded-lg flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-text-primary">Customize ATS Sub-Score Weights for This Role</h4>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Default platform weights are: Skills (40%), Experience (25%), Education (15%), Semantic NLP (15%), Certifications (5%).
                </p>
              </div>
              <input
                type="checkbox"
                id="customWeightsToggle"
                checked={useCustomWeights}
                onChange={(e) => setUseCustomWeights(e.target.checked)}
                className="w-4 h-4 rounded bg-surface border-border-default text-brand-600 focus:ring-0 cursor-pointer"
              />
            </div>

            {/* Sliders if enabled */}
            {useCustomWeights && (
              <div className="space-y-4 p-4 border border-brand-200 bg-brand-50/20 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-text-primary">Weight Distribution (Must Sum to 100%)</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      isWeight100
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : 'bg-rose-50 text-rose-700 border border-rose-300 animate-pulse'
                    }`}
                  >
                    {totalWeightPercent}% / 100%
                  </span>
                </div>

                {/* Presets */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {defaultWeightsData?.presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setCustomWeights(preset.weights)}
                      className="px-2.5 py-1 text-[11px] font-medium rounded bg-surface border border-border-default hover:border-brand-400 text-text-primary transition"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                {/* Sliders */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Skills Match:</span>
                      <span className="font-bold">{Math.round(customWeights.skillsWeight * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(customWeights.skillsWeight * 100)}
                      onChange={(e) =>
                        setCustomWeights({ ...customWeights, skillsWeight: Number(e.target.value) / 100 })
                      }
                      className="w-full accent-brand-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Experience Match:</span>
                      <span className="font-bold">{Math.round(customWeights.experienceWeight * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(customWeights.experienceWeight * 100)}
                      onChange={(e) =>
                        setCustomWeights({ ...customWeights, experienceWeight: Number(e.target.value) / 100 })
                      }
                      className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Education Match:</span>
                      <span className="font-bold">{Math.round(customWeights.educationWeight * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(customWeights.educationWeight * 100)}
                      onChange={(e) =>
                        setCustomWeights({ ...customWeights, educationWeight: Number(e.target.value) / 100 })
                      }
                      className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Semantic NLP Match:</span>
                      <span className="font-bold">{Math.round(customWeights.semanticWeight * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(customWeights.semanticWeight * 100)}
                      onChange={(e) =>
                        setCustomWeights({ ...customWeights, semanticWeight: Number(e.target.value) / 100 })
                      }
                      className="w-full accent-purple-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Certifications Match:</span>
                      <span className="font-bold">{Math.round(customWeights.certificationWeight * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(customWeights.certificationWeight * 100)}
                      onChange={(e) =>
                        setCustomWeights({ ...customWeights, certificationWeight: Number(e.target.value) / 100 })
                      }
                      className="w-full accent-amber-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Application Screening Questions */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-semibold text-text-primary">Application Screening Questions</h4>
                  <p className="text-[11px] text-text-secondary">
                    Add custom qualification questions. Mark as "Knockout" to flag non-compliant applicants automatically.
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={handleAddQuestion}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Question
                </Button>
              </div>

              <div className="space-y-3 mt-3">
                {screeningQuestions.map((q, idx) => (
                  <div key={q.id} className="p-3.5 bg-surface-muted border border-border-default rounded-lg space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-bold text-text-primary">Question #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="text-text-secondary hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="e.g. Do you have experience managing distributed engineering teams?"
                      value={q.question}
                      onChange={(e) =>
                        setScreeningQuestions((prev) =>
                          prev.map((item) => (item.id === q.id ? { ...item, question: e.target.value } : item))
                        )
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-brand-500"
                    />

                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <label className="text-text-secondary font-medium">Type:</label>
                        <select
                          value={q.type}
                          onChange={(e) =>
                            setScreeningQuestions((prev) =>
                              prev.map((item) =>
                                item.id === q.id ? { ...item, type: e.target.value as any } : item
                              )
                            )
                          }
                          className="px-2 py-1 bg-surface border border-border-default rounded text-xs text-text-primary"
                        >
                          <option value="YES_NO">Yes / No</option>
                          <option value="TEXT">Short Text</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`knockout-${q.id}`}
                          checked={q.isKnockout}
                          onChange={(e) =>
                            setScreeningQuestions((prev) =>
                              prev.map((item) =>
                                item.id === q.id ? { ...item, isKnockout: e.target.checked } : item
                              )
                            )
                          }
                          className="w-3.5 h-3.5 text-brand-600 rounded"
                        />
                        <label htmlFor={`knockout-${q.id}`} className="text-text-primary font-medium">
                          Knockout Question
                        </label>
                      </div>

                      {q.isKnockout && q.type === 'YES_NO' && (
                        <div className="flex items-center gap-2">
                          <label className="text-text-secondary font-medium">Required Answer:</label>
                          <select
                            value={q.requiredAnswer || 'YES'}
                            onChange={(e) =>
                              setScreeningQuestions((prev) =>
                                prev.map((item) =>
                                  item.id === q.id ? { ...item, requiredAnswer: e.target.value } : item
                                )
                              )
                            }
                            className="px-2 py-1 bg-surface border border-border-default rounded text-xs text-text-primary"
                          >
                            <option value="YES">Yes</option>
                            <option value="NO">No</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-border-default">
              <Button variant="secondary" onClick={() => setCurrentStep(2)}>
                &larr; Back
              </Button>
              <Button
                variant="primary"
                onClick={() => setCurrentStep(4)}
                disabled={!isWeight100}
              >
                Review & Publish &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* Step 4: Review, Compliance Check & Publish */}
        {/* ========================================================= */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-base font-semibold text-text-primary border-b border-border-default pb-2">
              Review & Pre-Publish Compliance Verification
            </h2>

            {/* Compliance Scanner Banner */}
            {complianceResult ? (
              complianceResult.hasViolations ? (
                <div
                  className={`p-4 rounded-lg border flex flex-col gap-2 ${
                    !complianceResult.canPublish
                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                      : 'bg-amber-50 border-amber-300 text-amber-800'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4" />
                    <span>
                      {!complianceResult.canPublish
                        ? 'Prohibited Discriminatory Language Detected (Publication Blocked)'
                        : 'Content Policy Warnings Found'}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    The platform compliance engine detected keywords that may violate fair hiring standards or anti-discrimination regulations:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {complianceResult.violations.map((v, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-white border border-current shadow-sm font-semibold"
                      >
                        "{v.keyword}" ({v.severity})
                      </span>
                    ))}
                  </div>
                  {!complianceResult.canPublish && (
                    <p className="text-[11px] font-semibold mt-1">
                      Please return to Step 1 and remove the flagged discriminatory keywords before publishing this job posting.
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Compliance scan passed!</strong> No discriminatory or prohibited keyword patterns were detected in the title, requirements summary, or description.
                  </span>
                </div>
              )
            ) : (
              <div className="p-3 text-xs text-text-secondary bg-surface-muted rounded border border-border-default flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-600 animate-pulse" />
                <span>Running real-time anti-discrimination compliance check...</span>
              </div>
            )}

            {/* Summary Review Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-surface-muted border border-border-default space-y-2">
                <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Role Overview</span>
                <h3 className="text-sm font-bold text-text-primary">{title}</h3>
                <p className="text-xs text-text-secondary">
                  {employmentType.replace('_', ' ')} • {location || 'No location set'}
                </p>
                {salaryMin && salaryMax && (
                  <p className="text-xs text-brand-700 font-semibold">
                    ${Number(salaryMin).toLocaleString()} – ${Number(salaryMax).toLocaleString()} / year
                  </p>
                )}
                <p className="text-xs text-text-secondary line-clamp-3 mt-1">{description}</p>
              </div>

              <div className="p-4 rounded-lg bg-surface-muted border border-border-default space-y-2">
                <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Skills & Requirements</span>
                <p className="text-xs text-text-primary">
                  <strong>Experience:</strong> {minExp || 0} – {maxExp || 'Any'} years
                </p>
                <p className="text-xs text-text-primary">
                  <strong>Education:</strong> {educationLevel}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedSkills.map((s) => (
                    <span
                      key={s.skillId}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-border-default text-text-primary"
                    >
                      {s.skill?.name || 'Skill'} ({s.priority === 'MUST_HAVE' ? 'Must' : 'Nice'})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-border-default">
              <Button variant="secondary" onClick={() => setCurrentStep(3)}>
                &larr; Back
              </Button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  variant="secondary"
                  onClick={() => handleSubmit('DRAFT')}
                  disabled={createJobMutation.isPending || updateJobMutation.isPending}
                  className="flex-1 sm:flex-none"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  Save as Draft
                </Button>

                <Button
                  variant="primary"
                  onClick={() => handleSubmit('PUBLISHED')}
                  disabled={
                    createJobMutation.isPending ||
                    updateJobMutation.isPending ||
                    (complianceResult ? !complianceResult.canPublish : false)
                  }
                  className="flex-1 sm:flex-none"
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  Publish Vacancy
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default JobCreationWizardPage;
