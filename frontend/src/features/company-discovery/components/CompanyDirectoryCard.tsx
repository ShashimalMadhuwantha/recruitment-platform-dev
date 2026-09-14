import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Briefcase, Users, CheckCircle2, Heart } from 'lucide-react';
import type { PublicCompanySummaryDto } from '../types';

interface CompanyDirectoryCardProps {
  company: PublicCompanySummaryDto;
  onToggleFollow?: (companyId: string) => void;
  isFollowLoading?: boolean;
}

export const CompanyDirectoryCard: React.FC<CompanyDirectoryCardProps> = ({
  company,
  onToggleFollow,
  isFollowLoading = false,
}) => {
  const profileUrl = `/companies/${company.slug || company.id}`;

  return (
    <div className="group relative bg-surface border border-border-default hover:border-brand-300 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md flex flex-col h-full">
      {/* Cover Banner */}
      <div className="h-28 w-full relative bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 overflow-hidden shrink-0">
        {company.coverPhotoUrl ? (
          <img
            src={company.coverPhotoUrl}
            alt={`${company.name} cover`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-950/80 to-brand-600/40 opacity-70" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Follow quick toggle on card header */}
        {onToggleFollow && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFollow(company.id);
            }}
            disabled={isFollowLoading}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
              company.isFollowedByMe
                ? 'bg-rose-500/90 text-white hover:bg-rose-600 shadow-sm'
                : 'bg-black/30 text-white/90 hover:bg-black/50 hover:text-white'
            }`}
            title={company.isFollowedByMe ? 'Following employer' : 'Follow employer'}
          >
            <Heart
              className={`w-4 h-4 transition-transform active:scale-90 ${
                company.isFollowedByMe ? 'fill-white' : ''
              }`}
            />
          </button>
        )}
      </div>

      {/* Main Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Logo & Headline Row */}
          <div className="flex items-end justify-between -mt-11 mb-3">
            <Link
              to={profileUrl}
              className="w-16 h-16 rounded-xl border-2 border-surface bg-surface shadow-sm overflow-hidden flex items-center justify-center shrink-0 group-hover:ring-2 group-hover:ring-brand-500 transition-all"
            >
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={`${company.name} logo`}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div className="w-full h-full bg-brand-50 flex items-center justify-center font-bold text-brand-700 text-xl">
                  {company.name.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>

            {/* Active Openings Pill */}
            {company.activeJobCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Briefcase className="w-3 h-3" />
                {company.activeJobCount} {company.activeJobCount === 1 ? 'opening' : 'openings'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-muted text-text-muted border border-border-default">
                No active openings
              </span>
            )}
          </div>

          {/* Company Title & Industry */}
          <div className="space-y-1">
            <Link
              to={profileUrl}
              className="group-hover:text-brand-600 transition-colors inline-flex items-center gap-1.5 font-bold text-base text-brand-900 line-clamp-1"
            >
              <span>{company.name}</span>
              <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 fill-brand-50" />
            </Link>

            <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
              {company.industry && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-text-muted" />
                  {company.industry}
                </span>
              )}
              {company.headquarters && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-text-muted" />
                  {company.headquarters}
                </span>
              )}
            </div>
          </div>

          {/* Description Snippet */}
          {company.description && (
            <p className="mt-2.5 text-xs text-text-secondary line-clamp-2 leading-relaxed">
              {company.description}
            </p>
          )}
        </div>

        {/* Footer info: followers & view profile CTA */}
        <div className="pt-3 border-t border-border-default/60 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 text-text-secondary">
            <Users className="w-3.5 h-3.5 text-text-muted" />
            <span className="font-medium text-text-primary">{company.followerCount}</span>
            <span>{company.followerCount === 1 ? 'follower' : 'followers'}</span>
          </span>

          <Link
            to={profileUrl}
            className="font-semibold text-brand-600 hover:text-brand-800 transition-colors"
          >
            Explore profile &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
