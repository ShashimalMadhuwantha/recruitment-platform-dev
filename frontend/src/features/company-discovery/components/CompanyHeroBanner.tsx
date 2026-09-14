import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Users,
  Globe,
  Share2,
  CheckCircle2,
  Heart,
  Check,
} from 'lucide-react';
import type { PublicCompanyDetailDto } from '../types';

interface CompanyHeroBannerProps {
  company: PublicCompanyDetailDto;
  onToggleFollow?: () => void;
  isFollowLoading?: boolean;
}

export const CompanyHeroBanner: React.FC<CompanyHeroBannerProps> = ({
  company,
  onToggleFollow,
  isFollowLoading = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hqLocation =
    company.locations.find((l) => l.isHQ) || company.locations[0];

  return (
    <div className="bg-surface rounded-3xl border border-border-default overflow-hidden shadow-sm">
      {/* Cover Header Banner */}
      <div className="h-48 sm:h-64 w-full relative bg-gradient-to-r from-brand-950 via-brand-900 to-slate-900 overflow-hidden">
        {company.coverPhotoUrl ? (
          <img
            src={company.coverPhotoUrl}
            alt={`${company.name} cover`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-900 via-brand-800 to-indigo-950 opacity-90" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      {/* Profile Details Container */}
      <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0 relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-6">
          {/* Logo & Headline */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-4 border-surface bg-surface shadow-md overflow-hidden flex items-center justify-center shrink-0">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={`${company.name} logo`}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="w-full h-full bg-brand-50 flex items-center justify-center font-bold text-brand-700 text-3xl">
                  {company.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-900 tracking-tight">
                  {company.name}
                </h1>
                <span title="Verified Employer Profile">
                  <CheckCircle2 className="w-5 h-5 text-brand-600 fill-brand-50 shrink-0" />
                </span>
              </div>

              {/* Tags & Metadata Row */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary font-medium">
                {company.industry && (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-text-muted" />
                    {company.industry}
                  </span>
                )}
                {company.size && (
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-text-muted" />
                    {company.size} employees
                  </span>
                )}
                {hqLocation && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-text-muted" />
                    {[hqLocation.city, hqLocation.country].filter(Boolean).join(', ')}
                  </span>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-800 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Visit Website &rarr;
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Action CTAs: Follow & Share */}
          <div className="flex items-center gap-3 shrink-0">
            {onToggleFollow && (
              <button
                type="button"
                onClick={onToggleFollow}
                disabled={isFollowLoading}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-xs ${
                  company.isFollowedByMe
                    ? 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100'
                    : 'bg-brand-600 text-white hover:bg-brand-700 active:scale-95'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${
                    company.isFollowedByMe ? 'fill-rose-600 text-rose-600' : ''
                  }`}
                />
                <span>{company.isFollowedByMe ? 'Following' : 'Follow'}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-md bg-black/10">
                  {company.followerCount}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm border border-border-default bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-all"
              title="Share profile link"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-text-muted" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* About Bio snippet */}
        {company.description && (
          <div className="mt-4 pt-4 border-t border-border-default/60">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
              About the Company
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed max-w-4xl whitespace-pre-line">
              {company.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
