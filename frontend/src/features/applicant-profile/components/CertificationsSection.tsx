import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import type { CertificationDto } from '../types';

interface CertificationsSectionProps {
  certifications: CertificationDto[];
  onAdd: (data: Omit<CertificationDto, 'id' | 'applicantId' | 'createdAt'>) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
}

export const CertificationsSection: React.FC<CertificationsSectionProps> = ({
  certifications,
  onAdd,
  onDelete,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAdd({
      name,
      issuer,
      issueDate: issueDate || undefined,
      expiryDate: expiryDate || undefined,
      credentialUrl: credentialUrl || undefined,
    });
    setName('');
    setIssuer('');
    setIssueDate('');
    setExpiryDate('');
    setCredentialUrl('');
    setIsAdding(false);
  };

  return (
    <Card className="p-6 bg-surface border border-border-default space-y-6">
      <div className="flex items-center justify-between border-b border-border-default pb-4">
        <div>
          <h2 className="text-lg font-semibold text-brand-900">Certifications & Licenses</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Industry badges and credentials verifying your specialized technical capabilities.
          </p>
        </div>
        {!isAdding && (
          <Button variant="primary" size="sm" onClick={() => setIsAdding(true)}>
            + Add Certification
          </Button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 bg-surface-muted rounded-xl border border-border-default space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Add Certification</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="w-full space-y-1.5 text-left">
              <label htmlFor="certName" className="block text-xs font-medium text-text-secondary">
                Certification Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="certName"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AWS Certified Solutions Architect"
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface"
              />
            </div>

            <div className="w-full space-y-1.5 text-left">
              <label htmlFor="certIssuer" className="block text-xs font-medium text-text-secondary">
                Issuing Organization <span className="text-rose-500">*</span>
              </label>
              <input
                id="certIssuer"
                type="text"
                required
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="e.g. Amazon Web Services"
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="w-full space-y-1.5 text-left">
              <label htmlFor="certIssue" className="block text-xs font-medium text-text-secondary">
                Issue Date
              </label>
              <input
                id="certIssue"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface"
              />
            </div>

            <div className="w-full space-y-1.5 text-left">
              <label htmlFor="certExpiry" className="block text-xs font-medium text-text-secondary">
                Expiry Date (if applicable)
              </label>
              <input
                id="certExpiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface"
              />
            </div>

            <div className="w-full space-y-1.5 text-left">
              <label htmlFor="certUrl" className="block text-xs font-medium text-text-secondary">
                Credential URL / Badge Link
              </label>
              <input
                id="certUrl"
                type="url"
                value={credentialUrl}
                onChange={(e) => setCredentialUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Certification
            </Button>
          </div>
        </form>
      )}

      {certifications.length === 0 && !isAdding ? (
        <div className="text-center py-6 border-2 border-dashed border-border-default rounded-xl bg-surface-muted/50">
          <p className="text-sm font-medium text-text-secondary">No certifications added</p>
          <p className="text-xs text-text-muted mt-1">Credentials increase your score in vacancy requirements matches.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="p-4 rounded-xl border border-border-default bg-surface hover:border-slate-300 transition-colors flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-brand-900">{cert.name}</h3>
                <p className="text-xs font-medium text-text-primary">{cert.issuer}</p>
                <p className="text-xs text-text-muted">
                  Issued: {cert.issueDate ? cert.issueDate.split('T')[0] : 'N/A'}
                  {cert.expiryDate ? ` • Expires: ${cert.expiryDate.split('T')[0]}` : ''}
                </p>
                {cert.credentialUrl && (
                  <a
                    href={cert.credentialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1 mt-1 font-medium"
                  >
                    View Credential ↗
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={() => onDelete(cert.id)}
                className="text-text-muted hover:text-rose-600 text-xs p-1"
                title="Remove certification"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
