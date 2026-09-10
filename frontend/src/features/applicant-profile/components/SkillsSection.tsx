import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import type { ApplicantSkillDto, SkillMaster } from '../types';

interface SkillsSectionProps {
  skills: ApplicantSkillDto[];
  masterSkills: SkillMaster[];
  onAdd: (data: { skillId: string; proficiency: number; yearsExperience?: number | null }) => Promise<any>;
  onUpdate: (id: string, data: { proficiency?: number; yearsExperience?: number | null }) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({
  skills,
  masterSkills,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [proficiency, setProficiency] = useState(3);
  const [yearsExperience, setYearsExperience] = useState<string>('2');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Derive categories from master skills
  const categories = Array.from(
    new Set(masterSkills.map((s) => s.category).filter(Boolean) as string[])
  ).sort();

  const existingSkillIds = new Set(skills.map((s) => s.skillId));

  const filteredMasterSkills = masterSkills
    .filter((s) => !existingSkillIds.has(s.id) || s.id === selectedSkillId)
    .filter((s) => (selectedCategory === 'ALL' ? true : s.category === selectedCategory))
    .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const proficiencyLabels: Record<number, string> = {
    1: 'Beginner',
    2: 'Elementary',
    3: 'Intermediate',
    4: 'Advanced',
    5: 'Expert / Lead',
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkillId) return;

    await onAdd({
      skillId: selectedSkillId,
      proficiency,
      yearsExperience: yearsExperience ? Number(yearsExperience) : null,
    });

    setSelectedSkillId('');
    setSearchTerm('');
    setProficiency(3);
    setYearsExperience('2');
  };

  const handleStartEdit = (skill: ApplicantSkillDto) => {
    setEditingId(skill.id);
    setProficiency(skill.proficiency);
    setYearsExperience(skill.yearsExperience !== undefined && skill.yearsExperience !== null ? String(skill.yearsExperience) : '');
  };

  const handleSaveEdit = async (id: string) => {
    await onUpdate(id, {
      proficiency,
      yearsExperience: yearsExperience ? Number(yearsExperience) : null,
    });
    setEditingId(null);
  };

  return (
    <Card className="p-6 bg-surface border border-border-default space-y-6">
      <div className="border-b border-border-default pb-4">
        <h2 className="text-lg font-semibold text-brand-900">Skills & Competencies</h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Select verified skills from the master taxonomy and self-rate your proficiency. This directly powers the ATS skills match engine.
        </p>
      </div>

      {/* Add Skill Form */}
      <form onSubmit={handleAdd} className="p-4 bg-surface-muted rounded-xl border border-border-default space-y-4">
        <h3 className="text-sm font-semibold text-text-primary">+ Add New Skill</h3>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-brand-600 text-white'
                : 'bg-surface text-text-secondary border border-border-default hover:bg-slate-100'
            }`}
          >
            All Categories ({masterSkills.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface text-text-secondary border border-border-default hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="w-full space-y-1.5 text-left">
            <label htmlFor="skillSelect" className="block text-xs font-medium text-text-secondary">
              Select Skill <span className="text-rose-500">*</span>
            </label>
            <select
              id="skillSelect"
              required
              value={selectedSkillId}
              onChange={(e) => setSelectedSkillId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface"
            >
              <option value="">-- Choose verified skill ({filteredMasterSkills.length}) --</option>
              {filteredMasterSkills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.category ? `(${s.category})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full space-y-1.5 text-left">
            <label className="block text-xs font-medium text-text-secondary">
              Proficiency: {proficiencyLabels[proficiency]} ({proficiency}/5)
            </label>
            <div className="flex items-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setProficiency(lvl)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    proficiency >= lvl
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-surface border border-border-default text-text-muted hover:border-brand-600'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full space-y-1.5 text-left">
            <label htmlFor="skillYears" className="block text-xs font-medium text-text-secondary">
              Years of Experience
            </label>
            <input
              id="skillYears"
              type="number"
              min="0"
              max="40"
              step="0.5"
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
              placeholder="e.g. 3.5"
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="primary" size="sm" type="submit" disabled={!selectedSkillId}>
            Add Skill to Profile
          </Button>
        </div>
      </form>

      {/* Skills List */}
      {skills.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-border-default rounded-xl bg-surface-muted/50">
          <p className="text-sm font-medium text-text-secondary">No skills added yet</p>
          <p className="text-xs text-text-muted mt-1">Add at least 3 skills to earn +20% profile completeness.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {skills.map((skillItem) => {
            const isEditing = editingId === skillItem.id;
            return (
              <div
                key={skillItem.id}
                className="p-3.5 rounded-xl border border-border-default bg-surface hover:border-slate-300 transition-colors flex flex-col justify-between space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-brand-900">
                      {skillItem.skill?.name || 'Skill'}
                    </h4>
                    {skillItem.skill?.category && (
                      <span className="text-[10px] text-text-secondary font-medium">
                        {skillItem.skill.category}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(skillItem.id)}
                    className="text-text-muted hover:text-rose-600 text-xs p-1"
                    title="Remove skill"
                  >
                    ✕
                  </button>
                </div>

                {isEditing ? (
                  <div className="space-y-2 pt-1 border-t border-border-default">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setProficiency(lvl)}
                          className={`w-6 h-6 text-[10px] rounded font-bold ${
                            proficiency >= lvl ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="number"
                        min="0"
                        max="40"
                        step="0.5"
                        value={yearsExperience}
                        onChange={(e) => setYearsExperience(e.target.value)}
                        className="w-16 px-1.5 py-1 text-xs border rounded"
                      />
                      <Button variant="primary" size="sm" onClick={() => handleSaveEdit(skillItem.id)}>
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                    <span className="font-medium text-text-secondary">
                      {proficiencyLabels[skillItem.proficiency]} ({skillItem.proficiency}/5)
                    </span>
                    <span className="text-text-muted font-medium">
                      {skillItem.yearsExperience ? `${skillItem.yearsExperience} yrs` : '1 yr'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
