import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import type { EducationDto } from '../types';

interface EducationSectionProps {
  educations: EducationDto[];
  onAdd: (data: Omit<EducationDto, 'id' | 'applicantId' | 'createdAt'>) => Promise<any>;
  onUpdate: (id: string, data: Partial<EducationDto>) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
}

export const EducationSection: React.FC<EducationSectionProps> = ({
  educations,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formState, setFormState] = useState({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    gpa: '',
  });

  const resetForm = () => {
    setFormState({
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      gpa: '',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleStartEdit = (edu: EducationDto) => {
    setFormState({
      institution: edu.institution,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy || '',
      startDate: edu.startDate ? edu.startDate.split('T')[0] : '',
      endDate: edu.endDate ? edu.endDate.split('T')[0] : '',
      gpa: edu.gpa !== undefined && edu.gpa !== null ? String(edu.gpa) : '',
    });
    setEditingId(edu.id);
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      institution: formState.institution,
      degree: formState.degree,
      fieldOfStudy: formState.fieldOfStudy || undefined,
      startDate: formState.startDate || undefined,
      endDate: formState.endDate || undefined,
      gpa: formState.gpa ? Number(formState.gpa) : undefined,
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
          <h2 className="text-lg font-semibold text-brand-900">Education History</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Degrees and academic qualifications that verify your foundational training.
          </p>
        </div>
        {!isAdding && (
          <Button variant="primary" size="sm" onClick={() => setIsAdding(true)}>
            + Add Education
          </Button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 bg-surface-muted rounded-xl border border-border-default space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">
            {editingId ? 'Edit Academic Qualification' : 'Add Academic Qualification'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="w-full space-y-1.5 text-left">
              <label htmlFor="eduInst" className="block text-xs font-medium text-text-secondary">
                Institution / University <span className="text-rose-500">*</span>
              </label>
              <input
                id="eduInst"
                type="text"
                required
                value={formState.institution}
                onChange={(e) => setFormState({ ...formState, institution: e.target.value })}
                placeholder="e.g. Stanford University"
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface"
              />
            </div>

            <div className="w-full space-y-1.5 text-left">
              <label htmlFor="eduDegree" className="block text-xs font-medium text-text-secondary">
                Degree Level <span className="text-rose-500">*</span>
              </label>
              <input
                id="eduDegree"
                type="text"
                required
                value={formState.degree}
                onChange={(e) => setFormState({ ...formState, degree: e.target.value })}
                placeholder="e.g. Bachelor of Science, Master of Science"
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="w-full space-y-1.5 text-left">
              <label htmlFor="eduField" className="block text-xs font-medium text-text-secondary">
                Field of Study / Major
              </label>
              <input
                id="eduField"
                type="text"
                value={formState.fieldOfStudy}
                onChange={(e) => setFormState({ ...formState, fieldOfStudy: e.target.value })}
                placeholder="e.g. Computer Science"
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface"
              />
            </div>

            <div className="w-full space-y-1.5 text-left">
              <label htmlFor="eduStart" className="block text-xs font-medium text-text-secondary">
                Start Date
              </label>
              <input
                id="eduStart"
                type="date"
                value={formState.startDate}
                onChange={(e) => setFormState({ ...formState, startDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface"
              />
            </div>

            <div className="w-full space-y-1.5 text-left">
              <label htmlFor="eduEnd" className="block text-xs font-medium text-text-secondary">
                Graduation / End Date
              </label>
              <input
                id="eduEnd"
                type="date"
                value={formState.endDate}
                onChange={(e) => setFormState({ ...formState, endDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface"
              />
            </div>
          </div>

          <div className="w-full space-y-1.5 text-left">
            <label htmlFor="eduGpa" className="block text-xs font-medium text-text-secondary">
              GPA / Grade (Optional)
            </label>
            <input
              id="eduGpa"
              type="text"
              value={formState.gpa}
              onChange={(e) => setFormState({ ...formState, gpa: e.target.value })}
              placeholder="e.g. 3.85"
              className="w-full max-w-[200px] px-3 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface"
            />
            <p className="text-[11px] text-text-muted">e.g. 3.8 / 4.0 or First Class Honours</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={resetForm}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingId ? 'Save Changes' : 'Add Education'}
            </Button>
          </div>
        </form>
      )}

      {/* Education List */}
      {educations.length === 0 && !isAdding ? (
        <div className="text-center py-8 border-2 border-dashed border-border-default rounded-xl bg-surface-muted/50">
          <p className="text-sm font-medium text-text-secondary">No education history added yet</p>
          <p className="text-xs text-text-muted mt-1">Add your degree to earn +20% profile completeness.</p>
          <Button variant="secondary" size="sm" onClick={() => setIsAdding(true)} className="mt-4">
            + Add Degree
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {educations.map((edu) => (
            <div
              key={edu.id}
              className="p-4 rounded-xl border border-border-default bg-surface hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-brand-900">{edu.degree}</h3>
                <p className="text-xs font-medium text-text-primary">
                  {edu.institution} {edu.fieldOfStudy ? `• ${edu.fieldOfStudy}` : ''}
                </p>
                <p className="text-xs text-text-muted">
                  {edu.startDate ? edu.startDate.split('T')[0] : 'N/A'} — {edu.endDate ? edu.endDate.split('T')[0] : 'Present'}
                  {edu.gpa ? ` • GPA: ${edu.gpa}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStartEdit(edu)}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-800 px-2.5 py-1 rounded hover:bg-brand-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(edu.id)}
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
