import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Database,
  Mail,
  Zap,
  Flag,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  Search,
  Eye,
  Send,
  Save,
  ShieldCheck,
  Globe,
  Tag,
  MapPin,
  Building2,
  Key,
  X,
} from 'lucide-react';
import {
  useAtsWeights,
  useUpdateAtsWeights,
  useSkillsTaxonomy,
  useCreateSkill,
  useDeleteSkill,
  useIndustries,
  useCreateIndustry,
  useDeleteIndustry,
  useLocations,
  useCreateLocation,
  useDeleteLocation,
  useNotificationTemplates,
  useUpdateNotificationTemplate,
  useIntegrations,
  useUpdateIntegration,
  useTestIntegration,
  useFeatureFlags,
  useUpdateFeatureFlag,
} from '../../features/system-config/hooks';
import type {
  ScoreWeightConfig,
  SkillTaxonomyItem,
  IndustryItem,
  LocationItem,
  NotificationTemplateItem,
  SystemIntegrationSettingItem,
  FeatureFlagItem,
  PlanTier,
  IntegrationProvider,
} from '../../features/system-config/types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const AdminConfigPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'weights' | 'taxonomy' | 'templates' | 'integrations' | 'flags'>('weights');

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              Super Admin Governance
            </span>
            <span className="text-xs text-text-secondary">Platform-Wide Settings</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-brand-600" />
            System Configuration & Taxonomy
          </h1>
          <p className="text-xs text-text-secondary mt-1 max-w-2xl">
            Configure global ATS scoring parameters, manage standardized master taxonomy dictionaries, customize notification templates, connect third-party integrations, and toggle feature flag capability tiers.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-border-default pb-2">
        <button
          onClick={() => setActiveTab('weights')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'weights'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Global ATS Weights
        </button>
        <button
          onClick={() => setActiveTab('taxonomy')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'taxonomy'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
          }`}
        >
          <Database className="w-4 h-4" />
          Master Taxonomy
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'templates'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
          }`}
        >
          <Mail className="w-4 h-4" />
          Notification Templates
        </button>
        <button
          onClick={() => setActiveTab('integrations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'integrations'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
          }`}
        >
          <Zap className="w-4 h-4" />
          Integrations & APIs
        </button>
        <button
          onClick={() => setActiveTab('flags')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'flags'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
          }`}
        >
          <Flag className="w-4 h-4" />
          Feature Flags & Matrix
        </button>
      </div>

      {/* Main Content Area */}
      <div>
        {activeTab === 'weights' && <AtsWeightsTab />}
        {activeTab === 'taxonomy' && <TaxonomyTab />}
        {activeTab === 'templates' && <NotificationTemplatesTab />}
        {activeTab === 'integrations' && <IntegrationsTab />}
        {activeTab === 'flags' && <FeatureFlagsTab />}
      </div>
    </div>
  );
};

// =========================================================================
// 1. ATS Weights Configuration Tab
// =========================================================================
const AtsWeightsTab: React.FC = () => {
  const { data, isLoading } = useAtsWeights();
  const updateMutation = useUpdateAtsWeights();

  const [weights, setWeights] = useState<ScoreWeightConfig>({
    skillsWeight: 0.40,
    experienceWeight: 0.25,
    educationWeight: 0.15,
    semanticWeight: 0.15,
    certificationWeight: 0.05,
  });
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (data?.current) {
      setWeights({
        skillsWeight: data.current.skillsWeight,
        experienceWeight: data.current.experienceWeight,
        educationWeight: data.current.educationWeight,
        semanticWeight: data.current.semanticWeight,
        certificationWeight: data.current.certificationWeight,
      });
    }
  }, [data]);

  const totalPercentage = Math.round(
    (weights.skillsWeight +
      weights.experienceWeight +
      weights.educationWeight +
      weights.semanticWeight +
      weights.certificationWeight) *
      100
  );

  const isExact100 = totalPercentage === 100;

  const handleSliderChange = (key: keyof ScoreWeightConfig, val: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: Math.round(val) / 100,
    }));
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const applyPreset = (presetWeights: ScoreWeightConfig) => {
    setWeights(presetWeights);
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleSave = async () => {
    if (!isExact100) {
      setErrorMsg(`Total weights must sum to exactly 100%. Current sum is ${totalPercentage}%.`);
      return;
    }
    setErrorMsg(null);
    try {
      await updateMutation.mutateAsync(weights);
      setSuccessMsg('Global ATS default weights updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save weights.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-text-secondary">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-brand-600" /> Loading ATS Weight Configuration...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sliders & Visualizer (2 Cols) */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-border-default pb-4 mb-6">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Default ATS Weight Matrix</h2>
              <p className="text-xs text-text-secondary">These weights compute overall candidate match score platform-wide unless overridden at the vacancy level.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary font-medium">Total Balance:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isExact100
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                    : 'bg-rose-50 text-rose-700 border border-rose-300 animate-pulse'
                }`}
              >
                {totalPercentage}% / 100%
              </span>
            </div>
          </div>

          {/* Visual Percentage Bar */}
          <div className="mb-8">
            <div className="text-xs font-medium text-text-primary mb-2 flex justify-between">
              <span>Score Distribution Breakdown</span>
              <span>100% Target</span>
            </div>
            <div className="h-4 w-full rounded-full bg-slate-100 flex overflow-hidden border border-border-default">
              <div
                style={{ width: `${weights.skillsWeight * 100}%` }}
                className="bg-brand-600 h-full transition-all duration-300"
                title={`Skills: ${Math.round(weights.skillsWeight * 100)}%`}
              />
              <div
                style={{ width: `${weights.experienceWeight * 100}%` }}
                className="bg-blue-500 h-full transition-all duration-300"
                title={`Experience: ${Math.round(weights.experienceWeight * 100)}%`}
              />
              <div
                style={{ width: `${weights.educationWeight * 100}%` }}
                className="bg-emerald-500 h-full transition-all duration-300"
                title={`Education: ${Math.round(weights.educationWeight * 100)}%`}
              />
              <div
                style={{ width: `${weights.semanticWeight * 100}%` }}
                className="bg-purple-500 h-full transition-all duration-300"
                title={`Semantic TF-IDF: ${Math.round(weights.semanticWeight * 100)}%`}
              />
              <div
                style={{ width: `${weights.certificationWeight * 100}%` }}
                className="bg-amber-500 h-full transition-all duration-300"
                title={`Certifications: ${Math.round(weights.certificationWeight * 100)}%`}
              />
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-text-secondary">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-600" /> Skills ({Math.round(weights.skillsWeight * 100)}%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Experience ({Math.round(weights.experienceWeight * 100)}%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Education ({Math.round(weights.educationWeight * 100)}%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Semantic Match ({Math.round(weights.semanticWeight * 100)}%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Certifications ({Math.round(weights.certificationWeight * 100)}%)</span>
            </div>
          </div>

          {/* Individual Sliders */}
          <div className="space-y-5">
            {/* 1. Skills */}
            <div className="p-4 rounded-lg bg-surface-muted border border-border-default">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-brand-600" />
                  Skills Match Weight (Core Competencies & Proficiencies)
                </label>
                <span className="text-sm font-bold text-brand-600">{Math.round(weights.skillsWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={Math.round(weights.skillsWeight * 100)}
                onChange={(e) => handleSliderChange('skillsWeight', Number(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
              />
            </div>

            {/* 2. Experience */}
            <div className="p-4 rounded-lg bg-surface-muted border border-border-default">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  Work Experience Weight (Years & Relevant Roles)
                </label>
                <span className="text-sm font-bold text-blue-600">{Math.round(weights.experienceWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={Math.round(weights.experienceWeight * 100)}
                onChange={(e) => handleSliderChange('experienceWeight', Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
              />
            </div>

            {/* 3. Education */}
            <div className="p-4 rounded-lg bg-surface-muted border border-border-default">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  Education Level Weight (Degrees & Field of Study)
                </label>
                <span className="text-sm font-bold text-emerald-600">{Math.round(weights.educationWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={Math.round(weights.educationWeight * 100)}
                onChange={(e) => handleSliderChange('educationWeight', Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
              />
            </div>

            {/* 4. Semantic TF-IDF */}
            <div className="p-4 rounded-lg bg-surface-muted border border-border-default">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500" />
                  Semantic & NLP Resume Match Weight (Contextual TF-IDF Similarity)
                </label>
                <span className="text-sm font-bold text-purple-600">{Math.round(weights.semanticWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={Math.round(weights.semanticWeight * 100)}
                onChange={(e) => handleSliderChange('semanticWeight', Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
              />
            </div>

            {/* 5. Certifications */}
            <div className="p-4 rounded-lg bg-surface-muted border border-border-default">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  Certifications & Credentials Weight
                </label>
                <span className="text-sm font-bold text-amber-600">{Math.round(weights.certificationWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={Math.round(weights.certificationWeight * 100)}
                onChange={(e) => handleSliderChange('certificationWeight', Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
              />
            </div>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="mt-4 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mt-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex justify-end gap-3 border-t border-border-default pt-5">
            <Button
              variant="secondary"
              onClick={() => {
                if (data?.current) {
                  setWeights({
                    skillsWeight: data.current.skillsWeight,
                    experienceWeight: data.current.experienceWeight,
                    educationWeight: data.current.educationWeight,
                    semanticWeight: data.current.semanticWeight,
                    certificationWeight: data.current.certificationWeight,
                  });
                }
              }}
            >
              Reset to Saved
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!isExact100 || updateMutation.isPending}
            >
              {updateMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
              Save Configuration
            </Button>
          </div>
        </Card>
      </div>

      {/* Preset Profiles & Formula Guide (1 Col) */}
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-text-primary mb-1 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Preset Industry Blueprints
          </h3>
          <p className="text-xs text-text-secondary mb-4">Click a preset to quickly apply proven scoring weight distributions.</p>

          <div className="space-y-3">
            {data?.presets.map((preset) => (
              <div
                key={preset.id}
                onClick={() => applyPreset(preset.weights)}
                className="p-3.5 rounded-lg bg-surface-muted border border-border-default hover:border-brand-300 hover:bg-brand-50/50 cursor-pointer transition group"
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-semibold text-text-primary group-hover:text-brand-700 transition">
                    {preset.name}
                  </h4>
                  <span className="text-[10px] uppercase font-bold text-brand-600 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
                    Apply
                  </span>
                </div>
                <p className="text-xs text-text-secondary mb-2 leading-relaxed">{preset.description}</p>
                <div className="flex gap-2 text-[11px] font-mono text-text-secondary">
                  <span className="text-brand-600 font-semibold">S:{preset.weights.skillsWeight * 100}%</span>
                  <span className="text-blue-600 font-semibold">Exp:{preset.weights.experienceWeight * 100}%</span>
                  <span className="text-emerald-600 font-semibold">Edu:{preset.weights.educationWeight * 100}%</span>
                  <span className="text-purple-600 font-semibold">NLP:{preset.weights.semanticWeight * 100}%</span>
                  <span className="text-amber-600 font-semibold">Cert:{preset.weights.certificationWeight * 100}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-text-primary mb-1 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Mathematical Score Formula
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed mb-3">
            Overall ATS match is calculated as a normalized composite score:
          </p>
          <div className="p-3 rounded bg-slate-900 text-xs font-mono text-indigo-300 leading-loose border border-slate-700">
            Score = (W<sub>s</sub> × S<sub>skills</sub>) + (W<sub>e</sub> × S<sub>exp</sub>) + (W<sub>ed</sub> × S<sub>edu</sub>) + (W<sub>sem</sub> × S<sub>tfidf</sub>) + (W<sub>c</sub> × S<sub>cert</sub>)
          </div>
          <p className="text-[11px] text-text-secondary mt-2">
            Where ∑ W = 1.0 (100%). Scores mapped: 80-100 (HIGH), 50-79 (MID), 0-49 (LOW).
          </p>
        </Card>
      </div>
    </div>
  );
};

// =========================================================================
// 2. Master Taxonomy Tab (Skills, Industries, Locations)
// =========================================================================
const TaxonomyTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'skills' | 'industries' | 'locations'>('skills');

  return (
    <div className="space-y-6">
      <div className="flex border-b border-border-default pb-2 gap-2">
        <button
          onClick={() => setSubTab('skills')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition ${
            subTab === 'skills' ? 'bg-slate-900 text-white shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
          }`}
        >
          <Tag className="w-3.5 h-3.5 inline mr-1.5" />
          Standard Skills & Aliases
        </button>
        <button
          onClick={() => setSubTab('industries')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition ${
            subTab === 'industries' ? 'bg-slate-900 text-white shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 inline mr-1.5" />
          Industry Sectors
        </button>
        <button
          onClick={() => setSubTab('locations')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition ${
            subTab === 'locations' ? 'bg-slate-900 text-white shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 inline mr-1.5" />
          Locations & Remote Hubs
        </button>
      </div>

      {subTab === 'skills' && <SkillsSubTab />}
      {subTab === 'industries' && <IndustriesSubTab />}
      {subTab === 'locations' && <LocationsSubTab />}
    </div>
  );
};

// Skills SubTab
const SkillsSubTab: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [selectedCategoryOption, setSelectedCategoryOption] = useState('Programming Languages');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [newSkillAliases, setNewSkillAliases] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: skills, isLoading } = useSkillsTaxonomy(search, category);
  const createSkillMutation = useCreateSkill();
  const deleteSkillMutation = useDeleteSkill();

  // Extract all existing unique categories
  const allCategories = useMemo(() => {
    const standard = [
      'Programming Languages',
      'Frontend',
      'Backend',
      'Databases',
      'DevOps & Tools',
      'Cloud Infrastructure',
      'Architecture',
      'AI & Data',
      'Design',
      'Quality Assurance',
      'Management',
    ];
    if (skills) {
      skills.forEach((s) => {
        if (s.category && !standard.includes(s.category)) {
          standard.push(s.category);
        }
      });
    }
    return standard;
  }, [skills]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newSkillName.trim()) {
      setFormError('Skill name is required.');
      return;
    }

    const finalCategory =
      selectedCategoryOption === '__CUSTOM__'
        ? customCategoryInput.trim()
        : selectedCategoryOption;

    if (!finalCategory) {
      setFormError('Please specify a category for this skill.');
      return;
    }

    try {
      const aliasesArray = newSkillAliases
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      await createSkillMutation.mutateAsync({
        name: newSkillName.trim(),
        category: finalCategory,
        aliases: aliasesArray,
      });

      setIsAddModalOpen(false);
      setNewSkillName('');
      setCustomCategoryInput('');
      setNewSkillAliases('');
      setSelectedCategoryOption('Programming Languages');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to add skill.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete skill '${name}'?`)) return;
    try {
      await deleteSkillMutation.mutateAsync(id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not delete skill.');
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Skills Taxonomy & Synonym Dictionary</h3>
          <p className="text-xs text-text-secondary">Manage verified skill terms and synonyms for automated resume keyword matching.</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setIsAddModalOpen(true);
            setFormError(null);
          }}
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Skill
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-secondary" />
          <input
            type="text"
            placeholder="Search skills or aliases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface border border-border-default text-xs text-text-primary placeholder-text-secondary focus:outline-none focus:border-brand-500"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 rounded-lg bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-brand-500"
        >
          <option value="ALL">All Categories</option>
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8 text-text-secondary text-xs">Loading skills dictionary...</div>
      ) : (
        <div className="overflow-x-auto border border-border-default rounded-lg">
          <table className="w-full text-left text-xs text-text-primary">
            <thead className="bg-surface-muted text-text-secondary font-semibold uppercase border-b border-border-default">
              <tr>
                <th className="py-3 px-4">Skill Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Recognized Aliases / Synonyms</th>
                <th className="py-3 px-4">Profiles / Vacancies</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default bg-surface">
              {skills?.map((item: SkillTaxonomyItem) => (
                <tr key={item.id} className="hover:bg-surface-hover transition">
                  <td className="py-3 px-4 font-semibold text-text-primary">{item.name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {item.category || 'General'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1.5">
                      {Array.isArray(item.aliasesJson) && item.aliasesJson.length > 0 ? (
                        item.aliasesJson.map((alias: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-[11px] bg-brand-50 text-brand-700 border border-brand-200 font-mono">
                            {alias}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">None</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-text-secondary">
                    {item._count?.applicantSkills || 0} candidates • {item._count?.jobRequiredSkills || 0} jobs
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-1.5 text-text-secondary hover:text-rose-600 transition rounded hover:bg-slate-100"
                      title="Delete Skill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {skills?.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-secondary">
                    No skills found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Skill Modal (Fully centered in screen) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-border-default rounded-xl max-w-md w-full p-6 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4 border-b border-border-default pb-3">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Tag className="w-4 h-4 text-brand-600" />
                Add Taxonomy Skill
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-surface-hover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Skill Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kotlin"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Category</label>
                <select
                  value={selectedCategoryOption}
                  onChange={(e) => setSelectedCategoryOption(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-brand-500"
                >
                  {allCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__CUSTOM__">+ Custom Category / Add New...</option>
                </select>
              </div>

              {selectedCategoryOption === '__CUSTOM__' && (
                <div className="p-3 bg-brand-50/50 border border-brand-200 rounded-lg">
                  <label className="block text-xs font-semibold text-brand-900 mb-1">Enter New Custom Category *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mobile Development"
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-surface border border-brand-300 text-xs text-text-primary focus:outline-none focus:border-brand-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Aliases / Synonyms (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. KT, Kotlin Multiplatform, Android Kotlin"
                  value={newSkillAliases}
                  onChange={(e) => setNewSkillAliases(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-brand-500"
                />
                <p className="text-[11px] text-text-secondary mt-1">
                  Resumes containing any of these synonyms will automatically match this skill during ATS scoring.
                </p>
              </div>

              {formError && (
                <div className="p-3 rounded bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-4 border-t border-border-default">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={createSkillMutation.isPending}
                >
                  {createSkillMutation.isPending ? 'Saving...' : 'Add Skill'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
};

// Industries SubTab
const IndustriesSubTab: React.FC = () => {
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Technology');

  const { data: industries, isLoading } = useIndustries(search);
  const createIndustryMutation = useCreateIndustry();
  const deleteIndustryMutation = useDeleteIndustry();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createIndustryMutation.mutateAsync({ name: name.trim(), category });
    setIsAddModalOpen(false);
    setName('');
  };

  const handleDelete = async (id: string, indName: string) => {
    if (!confirm(`Delete industry '${indName}'?`)) return;
    await deleteIndustryMutation.mutateAsync(id);
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Industry Taxonomy</h3>
          <p className="text-xs text-text-secondary">Official business sectors for employer company categorization.</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Industry
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-text-secondary text-xs">Loading industries...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {industries?.map((ind: IndustryItem) => (
            <div key={ind.id} className="p-4 rounded-lg bg-surface-muted border border-border-default flex justify-between items-center">
              <div>
                <h4 className="text-xs font-semibold text-text-primary">{ind.name}</h4>
                <span className="text-[11px] text-text-secondary">{ind.category || 'General'}</span>
              </div>
              <button
                onClick={() => handleDelete(ind.id, ind.name)}
                className="p-1.5 text-text-secondary hover:text-rose-600 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-border-default rounded-xl max-w-md w-full p-6 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4 border-b border-border-default pb-3">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-600" />
                Add Industry
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-surface-hover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Industry Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Telecommunications"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Category Group</label>
                <input
                  type="text"
                  placeholder="e.g. Telecom"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-4 border-t border-border-default">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
};

// Locations SubTab
const LocationsSubTab: React.FC = () => {
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('United States');
  const [isRemoteAllowed, setIsRemoteAllowed] = useState(true);

  const { data: locations, isLoading } = useLocations(search);
  const createLocationMutation = useCreateLocation();
  const deleteLocationMutation = useDeleteLocation();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim() || !country.trim()) return;
    await createLocationMutation.mutateAsync({
      city: city.trim(),
      state: state.trim() || null,
      country: country.trim(),
      isRemoteAllowed,
    });
    setIsAddModalOpen(false);
    setCity('');
    setState('');
  };

  const handleDelete = async (id: string, locName: string) => {
    if (!confirm(`Delete location '${locName}'?`)) return;
    await deleteLocationMutation.mutateAsync(id);
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Geographic Locations & Remote Hubs</h3>
          <p className="text-xs text-text-secondary">Standardized city, state, and country options for job postings and candidate profiles.</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Location
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-text-secondary text-xs">Loading locations...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations?.map((loc: LocationItem) => (
            <div key={loc.id} className="p-4 rounded-lg bg-surface-muted border border-border-default flex justify-between items-center">
              <div>
                <h4 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-600" />
                  {loc.city}{loc.state ? `, ${loc.state}` : ''}
                </h4>
                <p className="text-[11px] text-text-secondary mt-0.5">{loc.country}</p>
                {loc.isRemoteAllowed && (
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Remote Supported
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDelete(loc.id, loc.city)}
                className="p-1.5 text-text-secondary hover:text-rose-600 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-border-default rounded-xl max-w-md w-full p-6 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4 border-b border-border-default pb-3">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-600" />
                Add Standard Location
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-surface-hover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">City *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Seattle"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">State / Province</label>
                <input
                  type="text"
                  placeholder="e.g. WA"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Country *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. United States"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remoteCheck"
                  checked={isRemoteAllowed}
                  onChange={(e) => setIsRemoteAllowed(e.target.checked)}
                  className="rounded bg-surface border-border-default text-brand-600 focus:ring-0"
                />
                <label htmlFor="remoteCheck" className="text-xs text-text-primary">Allow as Remote Hub</label>
              </div>
              <div className="flex justify-end gap-2.5 pt-4 border-t border-border-default">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
};

// =========================================================================
// 3. Notification Templates Tab
// =========================================================================
const NotificationTemplatesTab: React.FC = () => {
  const { data: templates, isLoading } = useNotificationTemplates();
  const updateMutation = useUpdateNotificationTemplate();

  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplateItem | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSelect = (tmpl: NotificationTemplateItem) => {
    setSelectedTemplate(tmpl);
    setSubject(tmpl.subject);
    setBody(tmpl.body);
    setPreviewMode(false);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    try {
      await updateMutation.mutateAsync({
        id: selectedTemplate.id,
        data: { subject, body },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      alert('Failed to save template.');
    }
  };

  const insertVariable = (token: string) => {
    setBody((prev) => prev + ` {{${token}}}`);
  };

  const renderMockPreview = (text: string) => {
    return text
      .replace(/{{\s*candidate_name\s*}}/g, 'Alex Morgan')
      .replace(/{{\s*job_title\s*}}/g, 'Staff Software Engineer')
      .replace(/{{\s*company_name\s*}}/g, 'Apex Digital Solutions')
      .replace(/{{\s*stage_name\s*}}/g, 'Technical Interview')
      .replace(/{{\s*portal_url\s*}}/g, 'https://ats.example.com')
      .replace(/{{\s*interview_time\s*}}/g, 'Sept 18, 2026 at 2:00 PM EST')
      .replace(/{{\s*interview_type\s*}}/g, 'Zoom Video Call')
      .replace(/{{\s*meeting_link\s*}}/g, 'https://zoom.us/j/123456789')
      .replace(/{{\s*recruiter_name\s*}}/g, 'Sarah Jenkins')
      .replace(/{{\s*admin_name\s*}}/g, 'John Doe')
      .replace(/{{\s*base_salary\s*}}/g, '$145,000')
      .replace(/{{\s*currency\s*}}/g, 'USD')
      .replace(/{{\s*start_date\s*}}/g, 'October 1, 2026')
      .replace(/{{\s*expiration_date\s*}}/g, 'September 25, 2026')
      .replace(/{{\s*decline_reason\s*}}/g, 'Accepted an offer with another company');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Template Selection List (1 Col) */}
      <div className="space-y-3">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-1">System Templates</h3>
          <p className="text-xs text-text-secondary mb-4">Select an automated email template to customize text and dynamic variables.</p>

          {isLoading ? (
            <div className="py-6 text-center text-text-secondary text-xs">Loading templates...</div>
          ) : (
            <div className="space-y-2.5">
              {templates?.map((tmpl: NotificationTemplateItem) => (
                <div
                  key={tmpl.id}
                  onClick={() => handleSelect(tmpl)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition ${
                    selectedTemplate?.id === tmpl.id
                      ? 'bg-brand-50 border-brand-500 text-brand-900 shadow-sm'
                      : 'bg-surface-muted border-border-default text-text-primary hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-semibold">{tmpl.name}</h4>
                    <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded">
                      {tmpl.channel}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1 truncate">{tmpl.subject}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Template Editor & Preview (2 Cols) */}
      <div className="lg:col-span-2">
        {selectedTemplate ? (
          <Card className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border-default pb-4">
              <div>
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <Mail className="w-5 h-5 text-brand-600" />
                  {selectedTemplate.name}
                </h3>
                <span className="text-xs font-mono text-text-secondary">Code: {selectedTemplate.code}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={previewMode ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  {previewMode ? <Edit3 className="w-3.5 h-3.5 mr-1.5" /> : <Eye className="w-3.5 h-3.5 mr-1.5" />}
                  {previewMode ? 'Edit Mode' : 'Live Preview'}
                </Button>
              </div>
            </div>

            {/* Available Tokens Pill Bar */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-2">
                Available Dynamic Tokens (Click to insert):
              </label>
              <div className="flex flex-wrap gap-2">
                {(selectedTemplate.variablesJson as string[] | undefined)?.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVariable(v)}
                    className="px-2.5 py-1 rounded text-xs font-mono bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 transition flex items-center gap-1"
                  >
                    <span>+{`{{${v}}}`}</span>
                  </button>
                ))}
              </div>
            </div>

            {!previewMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Email Subject Line</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-brand-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Email Body Template</label>
                  <textarea
                    rows={10}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-brand-500 font-sans leading-relaxed"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 bg-surface-muted rounded-lg p-5 border border-border-default">
                <div className="border-b border-border-default pb-3">
                  <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Subject Preview</span>
                  <h4 className="text-sm font-semibold text-text-primary mt-1">{renderMockPreview(subject)}</h4>
                </div>
                <div>
                  <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Body Preview</span>
                  <div className="text-xs text-text-primary mt-2 whitespace-pre-wrap leading-relaxed">
                    {renderMockPreview(body)}
                  </div>
                </div>
              </div>
            )}

            {saveSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Template updated successfully.
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-border-default">
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                <Save className="w-4 h-4 mr-1.5" />
                {updateMutation.isPending ? 'Saving...' : 'Save Template'}
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-12 text-center text-text-secondary text-xs">
            Select a template from the list on the left to edit its contents.
          </Card>
        )}
      </div>
    </div>
  );
};

// =========================================================================
// 4. Integrations & APIs Tab
// =========================================================================
const IntegrationsTab: React.FC = () => {
  const { data: integrations, isLoading } = useIntegrations();
  const updateMutation = useUpdateIntegration();
  const testMutation = useTestIntegration();

  const [activeConfigProvider, setActiveConfigProvider] = useState<IntegrationProvider | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string | null }>>({});

  const handleConfigure = (item: SystemIntegrationSettingItem) => {
    setActiveConfigProvider(item.provider);
    const existing = (item.configJson as Record<string, string>) || {};
    setConfigValues(existing);
  };

  const handleSaveConfig = async () => {
    if (!activeConfigProvider) return;
    try {
      await updateMutation.mutateAsync({
        provider: activeConfigProvider,
        config: configValues,
      });
      setActiveConfigProvider(null);
    } catch {
      alert('Failed to update integration setting.');
    }
  };

  const handleTestConnection = async (provider: IntegrationProvider) => {
    try {
      const result = await testMutation.mutateAsync(provider);
      setTestResults((prev) => ({
        ...prev,
        [provider]: { success: result.success, message: result.message },
      }));
    } catch (err: unknown) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: { success: false, message: err instanceof Error ? err.message : 'Connection test failed.' },
      }));
    }
  };

  const providerMeta: Record<IntegrationProvider, { title: string; desc: string; icon: typeof Mail }> = {
    SMTP_EMAIL: {
      title: 'SMTP Mail Delivery Service',
      desc: 'Connect transactional email gateway (SendGrid, Mailgun, Amazon SES) for applicant notifications and verification codes.',
      icon: Mail,
    },
    GOOGLE_OAUTH: {
      title: 'Google OAuth 2.0 Single Sign-On',
      desc: 'Allow candidates and recruiters to sign in securely with their Google enterprise workspace accounts.',
      icon: Globe,
    },
    LINKEDIN_OAUTH: {
      title: 'LinkedIn OAuth & Profile Import',
      desc: 'Enable One-Click apply via LinkedIn profile data and work history parsing.',
      icon: Key,
    },
    ZOOM_CALENDAR: {
      title: 'Zoom Video & Calendar Sync',
      desc: 'Automate virtual interview link generation and Google / Outlook calendar invites.',
      icon: Zap,
    },
  };

  if (isLoading) {
    return <div className="py-12 text-center text-text-secondary text-xs">Loading third-party integrations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations?.map((item: SystemIntegrationSettingItem) => {
          const meta = providerMeta[item.provider];
          const IconComponent = meta?.icon || Zap;
          const testRes = testResults[item.provider];

          return (
            <Card key={item.id} className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2.5 rounded-lg bg-brand-50 border border-brand-200 text-brand-600">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      item.status === 'CONNECTED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : item.status === 'ERROR'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-text-primary">{meta?.title || item.provider}</h3>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">{meta?.desc}</p>

                {item.lastTestedAt && (
                  <p className="text-[11px] text-text-secondary mt-2 font-mono">
                    Last tested: {new Date(item.lastTestedAt).toLocaleString()}
                  </p>
                )}

                {testRes && (
                  <div
                    className={`mt-3 p-2.5 rounded text-xs ${
                      testRes.success
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {testRes.message}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t border-border-default">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleConfigure(item)}
                >
                  Configure Keys
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleTestConnection(item.provider)}
                  disabled={testMutation.isPending}
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Test Connection
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Config Modal */}
      {activeConfigProvider && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-border-default rounded-xl max-w-lg w-full p-6 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4 border-b border-border-default pb-3">
              <h3 className="text-base font-bold text-text-primary">
                Configure {providerMeta[activeConfigProvider]?.title}
              </h3>
              <button
                type="button"
                onClick={() => setActiveConfigProvider(null)}
                className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-surface-hover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-text-secondary mb-4">Enter production API keys and connection parameters.</p>

            <div className="space-y-4">
              {activeConfigProvider === 'SMTP_EMAIL' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">SMTP Host</label>
                    <input
                      type="text"
                      value={configValues.host || ''}
                      onChange={(e) => setConfigValues({ ...configValues, host: e.target.value })}
                      placeholder="smtp.sendgrid.net"
                      className="w-full px-3 py-2 rounded-lg bg-surface border border-border-default text-xs text-text-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">Port</label>
                      <input
                        type="text"
                        value={configValues.port || '587'}
                        onChange={(e) => setConfigValues({ ...configValues, port: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-surface border border-border-default text-xs text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">From Email</label>
                      <input
                        type="text"
                        value={configValues.fromEmail || ''}
                        onChange={(e) => setConfigValues({ ...configValues, fromEmail: e.target.value })}
                        placeholder="no-reply@domain.com"
                        className="w-full px-3 py-2 rounded-lg bg-surface border border-border-default text-xs text-text-primary"
                      />
                    </div>
                  </div>
                </>
              )}

              {(activeConfigProvider === 'GOOGLE_OAUTH' || activeConfigProvider === 'LINKEDIN_OAUTH') && (
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Client ID</label>
                  <input
                    type="text"
                    value={configValues.clientId || ''}
                    onChange={(e) => setConfigValues({ ...configValues, clientId: e.target.value })}
                    placeholder="apps.googleusercontent.com client id"
                    className="w-full px-3 py-2 rounded-lg bg-surface border border-border-default text-xs text-text-primary"
                  />
                </div>
              )}

              {activeConfigProvider === 'ZOOM_CALENDAR' && (
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Zoom API Key / JWT Secret</label>
                  <input
                    type="text"
                    value={configValues.zoomApiKey || ''}
                    onChange={(e) => setConfigValues({ ...configValues, zoomApiKey: e.target.value })}
                    placeholder="Zoom API Token"
                    className="w-full px-3 py-2 rounded-lg bg-surface border border-border-default text-xs text-text-primary"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-6 mt-4 border-t border-border-default">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveConfigProvider(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveConfig}
                disabled={updateMutation.isPending}
              >
                Save Integration
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 5. Feature Flags & Tier Matrix Tab
// =========================================================================
const FeatureFlagsTab: React.FC = () => {
  const { data: flags, isLoading } = useFeatureFlags();
  const updateMutation = useUpdateFeatureFlag();

  const handleToggleGlobal = async (flag: FeatureFlagItem) => {
    try {
      await updateMutation.mutateAsync({
        key: flag.key,
        data: { isGloballyEnabled: !flag.isGloballyEnabled },
      });
    } catch {
      alert('Failed to update feature flag.');
    }
  };

  const handleToggleTier = async (flag: FeatureFlagItem, tier: PlanTier) => {
    const currentTiers = (flag.enabledTiersJson as PlanTier[]) || [];
    const newTiers = currentTiers.includes(tier)
      ? currentTiers.filter((t) => t !== tier)
      : [...currentTiers, tier];

    try {
      await updateMutation.mutateAsync({
        key: flag.key,
        data: { enabledTiers: newTiers },
      });
    } catch {
      alert('Failed to update tier permissions.');
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-text-secondary text-xs">Loading feature flag matrix...</div>;
  }

  return (
    <Card className="p-6">
      <div className="border-b border-border-default pb-4 mb-6">
        <h3 className="text-base font-semibold text-text-primary">Feature Flag & Plan Tier Capability Matrix</h3>
        <p className="text-xs text-text-secondary">Toggle system-wide feature availability and manage subscription tier entitlements.</p>
      </div>

      <div className="overflow-x-auto border border-border-default rounded-lg">
        <table className="w-full text-left text-xs text-text-primary">
          <thead className="bg-surface-muted text-text-secondary font-semibold uppercase border-b border-border-default">
            <tr>
              <th className="py-3.5 px-4">Feature Capability</th>
              <th className="py-3.5 px-4 text-center">Global Platform Master</th>
              <th className="py-3.5 px-4 text-center">Free Starter</th>
              <th className="py-3.5 px-4 text-center">Pro Recruiter</th>
              <th className="py-3.5 px-4 text-center">Enterprise ATS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default bg-surface">
            {flags?.map((flag: FeatureFlagItem) => {
              const tiers = (flag.enabledTiersJson as PlanTier[]) || [];

              return (
                <tr key={flag.id} className="hover:bg-surface-hover transition">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-text-primary">{flag.name}</div>
                    <div className="text-xs text-text-secondary mt-0.5">{flag.description}</div>
                    <div className="text-[11px] font-mono text-brand-600 mt-1">flag: {flag.key}</div>
                  </td>

                  {/* Global Toggle */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleToggleGlobal(flag)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                        flag.isGloballyEnabled ? 'bg-brand-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${
                          flag.isGloballyEnabled ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>

                  {/* Free Tier */}
                  <td className="py-3.5 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={tiers.includes('FREE')}
                      disabled={!flag.isGloballyEnabled}
                      onChange={() => handleToggleTier(flag, 'FREE')}
                      className="w-4 h-4 rounded bg-surface border-border-default text-brand-600 focus:ring-0 cursor-pointer disabled:opacity-30"
                    />
                  </td>

                  {/* Pro Tier */}
                  <td className="py-3.5 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={tiers.includes('PRO')}
                      disabled={!flag.isGloballyEnabled}
                      onChange={() => handleToggleTier(flag, 'PRO')}
                      className="w-4 h-4 rounded bg-surface border-border-default text-brand-600 focus:ring-0 cursor-pointer disabled:opacity-30"
                    />
                  </td>

                  {/* Enterprise Tier */}
                  <td className="py-3.5 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={tiers.includes('ENTERPRISE')}
                      disabled={!flag.isGloballyEnabled}
                      onChange={() => handleToggleTier(flag, 'ENTERPRISE')}
                      className="w-4 h-4 rounded bg-surface border-border-default text-brand-600 focus:ring-0 cursor-pointer disabled:opacity-30"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
