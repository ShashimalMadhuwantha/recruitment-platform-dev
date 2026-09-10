import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import type { WorkExperienceDto } from '../types';

interface ExperienceSectionProps {
  experiences: WorkExperienceDto[];
  onAdd: (data: Omit<WorkExperienceDto, 'id' | 'applicantId' | 'createdAt'>) => Promise<any>;
  onUpdate: (id: string, data: Partial<WorkExperienceDto>) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  experiences,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formState, setFormState] = useState({
    companyName: '',
    title: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
    skillsUsedStr: '',
  });

  const resetForm = () => {
    setFormState({
      companyName: '',
      title: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
      skillsUsedStr: '',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleStartEdit = (exp: WorkExperienceDto) => {
    setFormState({
      companyName: exp.companyName,
      title: exp.title,
      startDate: exp.startDate ? exp.startDate.split('T')[0] : '',
      endDate: exp.endDate ? exp.endDate.split('T')[0] : '',
      isCurrent: exp.isCurrent,
      description: exp.description || '',
      skillsUsedStr: Array.isArray(exp.skillsUsedJson) ? exp.skillsUsedJson.join(', ') : '',
    });
    setEditingId(exp.id);
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const skillsUsedJson = formState.skillsUsedStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      companyName: formState.companyName,
      title: formState.title,
      startDate: formState.startDate,
      endDate: formState.isCurrent ? undefined : formState.endDate || undefined,
      isCurrent: formState.isCurrent,
      description: formState.description || undefined,
      skillsUsedJson,
    };

    if (editingId) {
      await onUpdate(editingId, payload);
    } else {
      await onAdd(payload);
    }
    resetForm();
  };

  return (
    <Card className="p-6 bg-surface border border-border-default space-y-6">
      <div className="flex items-center justify-between border-b border-border-default pb-4">
        <div>
          <h2 className="text-lg font-semibold text-brand-900">Work Experience</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Add past and current roles to boost your experience match score in ATS evaluation.
          </p>
        </div>
        {!isAdding && (
          <Button variant="primary" size="sm" onClick={() => setIsAdding(true)}>
            + Add Experience
          </Button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 bg-surface-muted rounded-xl border border-border-default space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">
            {editingId ? 'Edit Work Experience' : 'Add Work Experience'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="w-full space-y-1.5 text-left">
              <label htmlFor="expTitle" className="block text-xs font-medium text-text-secondary">
                Job Title <span className="text-rose-500">*</span>
              </label>
              <input
                id="expTitle"
                type="text"
                required
                value={formState.title}
                onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                placeholder="e.g. Senior Software Engineer"
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface"
              />
            </div>

            <div className="w-full space-y-1.5 text-left">
              <label htmlFor="expCompany" className="block text-xs font-medium text-text-secondary">
                Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="expCompany"
                type="text"
                required
                value={formState.companyName}
                onChange={(e) => setFormState({ ...formState, companyName: e.target.value })}
                placeholder="e.g. Acme Corp"
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="w-full space-y-1.5 text-left">
              <label htmlFor="expStart" className="block text-xs font-medium text-text-secondary">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="expStart"
                type="date"
                required
                value={formState.startDate}
                onChange={(e) => setFormState({ ...formState, startDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface"
              />
            </div>

            <div className="w-full space-y-1.5 text-left">
              <label htmlFor="expEnd" className="block text-xs font-medium text-text-secondary">
                End Date
              </label>
              <input
                id="expEnd"
                type="date"
                disabled={formState.isCurrent}
                value={formState.endDate}
                onChange={(e) => setFormState({ ...formState, endDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isCurrentExp"
              checked={formState.isCurrent}
              onChange={(e) => setFormState({ ...formState, isCurrent: e.target.checked })}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-600 border-border-default"
            />
            <label htmlFor="isCurrentExp" className="text-xs font-medium text-text-primary cursor-pointer">
              I currently work in this role
            </label>
          </div>

          <div className="w-full space-y-1.5 text-left">
            <label htmlFor="expDesc" className="block text-xs font-medium text-text-secondary">
              Key Responsibilities & Achievements
            </label>
            <textarea
              id="expDesc"
              rows={3}
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              placeholder="Outline what systems you built, team size, impact, and engineering contributions..."
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface resize-y"
            />
          </div>

          <div className="w-full space-y-1.5 text-left">
            <label htmlFor="expSkills" className="block text-xs font-medium text-text-secondary">
              Skills & Technologies Used
            </label>
            <input
              id="expSkills"
              type="text"
              value={formState.skillsUsedStr}
              onChange={(e) => setFormState({ ...formState, skillsUsedStr: e.target.value })}
              placeholder="e.g. TypeScript, Node.js, Docker, Microservices"
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface"
            />
            <p className="text-[11px] text-text-muted">Comma-separated (e.g. React, TypeScript, GraphQL, AWS)</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={resetForm}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingId ? 'Save Changes' : 'Add Experience'}
            </Button>
          </div>
        </form>
      )}

      {/* Experience List */}
      {experiences.length === 0 && !isAdding ? (
        <div className="text-center py-8 border-2 border-dashed border-border-default rounded-xl bg-surface-muted/50">
          <p className="text-sm font-medium text-text-secondary">No work experience added yet</p>
          <p className="text-xs text-text-muted mt-1">Add your career milestones to earn +25% profile completeness.</p>
          <Button variant="secondary" size="sm" onClick={() => setIsAdding(true)} className="mt-4">
            + Add First Experience
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="p-4 rounded-xl border border-border-default bg-surface hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-brand-900">{exp.title}</h3>
                  {exp.isCurrent && (
                    <span className="text-[10px] uppercase font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-text-primary">{exp.companyName}</p>
                <p className="text-xs text-text-muted">
                  {exp.startDate ? exp.startDate.split('T')[0] : 'N/A'} —{' '}
                  {exp.isCurrent ? 'Present' : exp.endDate ? exp.endDate.split('T')[0] : 'N/A'}
                </p>
                {exp.description && (
                  <p className="text-xs text-text-secondary mt-2 line-clamp-3 leading-relaxed">
                    {exp.description}
                  </p>
                )}
                {Array.isArray(exp.skillsUsedJson) && exp.skillsUsedJson.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {exp.skillsUsedJson.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-start">
                <button
                  type="button"
                  onClick={() => handleStartEdit(exp)}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-800 px-2.5 py-1 rounded hover:bg-brand-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(exp.id)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-2.5 py-1 rounded hover:bg-rose-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
