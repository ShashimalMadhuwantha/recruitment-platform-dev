import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import type { PortfolioDto } from '../types';

interface PortfolioSectionProps {
  portfolios: PortfolioDto[];
  onAdd: (data: { type: string; url: string; fileRef?: string | null }) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
}

export const PortfolioSection: React.FC<PortfolioSectionProps> = ({
  portfolios,
  onAdd,
  onDelete,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [type, setType] = useState('GITHUB');
  const [url, setUrl] = useState('');

  const linkTypes = [
    { value: 'GITHUB', label: 'GitHub Profile / Code Repository' },
    { value: 'LINKEDIN', label: 'LinkedIn Profile' },
    { value: 'PORTFOLIO', label: 'Personal Portfolio Website' },
    { value: 'BEHANCE', label: 'Behance / Dribbble Design Portfolio' },
    { value: 'OTHER', label: 'Other Project URL' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    await onAdd({ type, url });
    setUrl('');
    setType('GITHUB');
    setIsAdding(false);
  };

  return (
    <Card className="p-6 bg-surface border border-border-default space-y-6">
      <div className="flex items-center justify-between border-b border-border-default pb-4">
        <div>
          <h2 className="text-lg font-semibold text-brand-900">Portfolio & Online Links</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Share links to your code repositories, design portfolios, and social profiles.
          </p>
        </div>
        {!isAdding && (
          <Button variant="primary" size="sm" onClick={() => setIsAdding(true)}>
            + Add Link
          </Button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 bg-surface-muted rounded-xl border border-border-default space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Add Portfolio Link</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="w-full space-y-1.5 text-left">
              <label htmlFor="linkType" className="block text-xs font-medium text-text-secondary">
                Platform / Link Type <span className="text-rose-500">*</span>
              </label>
              <select
                id="linkType"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface"
              >
                {linkTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full space-y-1.5 text-left">
              <label htmlFor="linkUrl" className="block text-xs font-medium text-text-secondary">
                Destination URL <span className="text-rose-500">*</span>
              </label>
              <input
                id="linkUrl"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
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
              Save Link
            </Button>
          </div>
        </form>
      )}

      {portfolios.length === 0 && !isAdding ? (
        <div className="text-center py-6 border-2 border-dashed border-border-default rounded-xl bg-surface-muted/50">
          <p className="text-sm font-medium text-text-secondary">No portfolio links added</p>
          <p className="text-xs text-text-muted mt-1">Showcase your live work to recruiters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {portfolios.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-border-default bg-surface hover:border-slate-300 transition-colors flex items-center justify-between gap-4"
            >
              <div className="space-y-0.5 truncate">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                  {item.type}
                </span>
                <p className="text-xs font-semibold text-text-primary truncate">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline flex items-center gap-1"
                  >
                    {item.url} ↗
                  </a>
                </p>
              </div>

              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="text-text-muted hover:text-rose-600 text-xs p-1"
                title="Remove link"
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
