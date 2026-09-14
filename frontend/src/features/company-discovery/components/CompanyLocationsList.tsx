import React from 'react';
import { MapPin, Building, Navigation } from 'lucide-react';
import type { PublicCompanyOfficeLocation } from '../types';

interface CompanyLocationsListProps {
  locations: PublicCompanyOfficeLocation[];
  companyName: string;
}

export const CompanyLocationsList: React.FC<CompanyLocationsListProps> = ({
  locations,
  companyName,
}) => {
  if (!locations || locations.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-border-default p-6 text-center text-text-secondary">
        <Building className="w-6 h-6 text-text-muted mx-auto mb-2" />
        <p className="text-xs text-text-muted">
          {companyName} has not published physical office locations.
        </p>
      </div>
    );
  }

  // Sort HQ first
  const sortedLocations = [...locations].sort((a, b) => (b.isHQ ? 1 : 0) - (a.isHQ ? 1 : 0));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-brand-900 tracking-tight flex items-center gap-2">
        <Building className="w-5 h-5 text-brand-600" />
        <span>Office Hubs & Locations</span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedLocations.map((loc, idx) => (
          <div
            key={loc.id || idx}
            className={`p-4 rounded-xl border transition-all ${
              loc.isHQ
                ? 'bg-emerald-50/50 border-emerald-300 shadow-sm ring-1 ring-emerald-200/60'
                : 'bg-surface border-border-default hover:border-brand-300'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-lg ${
                    loc.isHQ ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-muted text-text-secondary'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-brand-900 leading-tight">
                    {loc.name || loc.city}
                  </h4>
                  <p className="text-xs text-text-secondary">
                    {[loc.city, loc.state, loc.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>

              {loc.isHQ && (
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-600 text-white shadow-xs">
                  HQ
                </span>
              )}
            </div>

            {loc.address && (
              <div className="mt-2 pt-2 border-t border-border-default/40 flex items-center gap-1.5 text-xs text-text-muted">
                <Navigation className="w-3 h-3 shrink-0" />
                <span className="truncate">{loc.address}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
