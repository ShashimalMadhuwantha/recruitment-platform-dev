import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Building2,
  Search,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { useBlockedCompanies, useBlockCompany, useUnblockCompany } from '../hooks';
import { companyDiscoveryApi } from '../../company-discovery/api';
import type { PublicCompanySummaryDto } from '../../company-discovery/types';

export const BlockedCompaniesManager: React.FC = () => {
  const { data: blockedList = [], isLoading, isError } = useBlockedCompanies();
  const blockMutation = useBlockCompany();
  const unblockMutation = useUnblockCompany();

  // Search state for autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicCompanySummaryDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<PublicCompanySummaryDto | null>(null);
  const [reason, setReason] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Debounced company lookup
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2 || selectedCompany) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await companyDiscoveryApi.searchCompanies({
          keyword: searchQuery.trim(),
          limit: 6,
        });
        // Filter out already blocked companies
        const filtered = res.items.filter(
          (c) => !blockedList.some((b) => b.companyId === c.id)
        );
        setSearchResults(filtered);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCompany, blockedList]);

  const handleSelectCompany = (company: PublicCompanySummaryDto) => {
    setSelectedCompany(company);
    setSearchQuery(company.name);
    setSearchResults([]);
  };

  const handleBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    try {
      setNotification(null);
      await blockMutation.mutateAsync({
        companyId: selectedCompany.id,
        reason: reason.trim() || undefined,
      });

      setNotification({
        type: 'success',
        text: `Successfully blocked ${selectedCompany.name}. Recruiter searches from this company will no longer see your profile.`,
      });
      setSelectedCompany(null);
      setSearchQuery('');
      setReason('');
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err?.response?.data?.error?.message || 'Failed to block employer. Please try again.',
      });
    }
  };

  const handleUnblock = async (companyId: string, companyName: string) => {
    try {
      setNotification(null);
      await unblockMutation.mutateAsync(companyId);
      setNotification({
        type: 'success',
        text: `Unblocked ${companyName}. The employer can now view your public profile in talent pool searches.`,
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err?.response?.data?.error?.message || 'Failed to unblock employer.',
      });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
          <ShieldAlert className="w-5 h-5 text-indigo-600" />
          <span>Employer Visibility Shield & Blocklist</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Block specific companies from ever discovering your candidate profile in talent pool searches or viewing your applications.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Informative Notice */}
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-900 leading-relaxed">
            <span className="font-semibold">Candidate Privacy Guarantee:</span> When you block an employer, recruiters associated with that organization are strictly concealed from finding your profile in Talent Pool directories (FR-RC-11). Your identity and job searches remain entirely confidential.
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            className={`p-3 rounded-lg flex items-center gap-2 text-xs font-medium ${
              notification.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
        )}

        {/* Block Company Form */}
        <form onSubmit={handleBlock} className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Employer to Blocklist
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search Input with Autocomplete */}
            <div className="md:col-span-6 relative">
              <label className="block text-xs font-medium text-slate-700 mb-1">Company Name</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type company name (e.g. Acme Corp)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (selectedCompany) setSelectedCompany(null);
                  }}
                  className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                {isSearching && (
                  <Loader2 className="w-4 h-4 text-indigo-500 absolute right-3 top-2.5 animate-spin" />
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && !selectedCompany && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-52 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCompany(c)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {c.logoUrl ? (
                          <img src={c.logoUrl} alt="" className="w-5 h-5 rounded object-cover" />
                        ) : (
                          <Building2 className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="font-semibold text-slate-800">{c.name}</span>
                      </div>
                      <span className="text-slate-400 text-[11px]">{c.industry || 'Enterprise'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reason Input */}
            <div className="md:col-span-4">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reason <span className="text-slate-400 font-normal">(Private note)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Current employer, Non-compete..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={200}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={!selectedCompany || blockMutation.isPending}
                className="w-full h-[38px] px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {blockMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5" />
                )}
                <span>Block Employer</span>
              </button>
            </div>
          </div>
        </form>

        {/* List of Blocked Companies */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Blocked Employers ({blockedList.length})
            </h4>
          </div>

          {isLoading ? (
            <div className="py-8 flex items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : isError ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              Failed to load blocked employers.
            </div>
          ) : blockedList.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50">
              <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No Blocked Employers</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                You currently have not blocked any companies. Use the form above if there are particular organizations you want to conceal your candidacy from.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {blockedList.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {item.companyLogoUrl ? (
                      <img
                        src={item.companyLogoUrl}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                        {item.companyName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{item.companyName}</span>
                        {item.reason && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            {item.reason}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        {item.companyIndustry && <span>{item.companyIndustry}</span>}
                        <span>•</span>
                        <span>Blocked on {new Date(item.blockedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Unblock button */}
                  <button
                    type="button"
                    onClick={() => handleUnblock(item.companyId, item.companyName)}
                    disabled={unblockMutation.isPending}
                    className="self-end sm:self-center px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Unblock</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
