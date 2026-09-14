import React, { useState } from 'react';
import { Download, FileJson, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { useExportPersonalData } from '../hooks';

export const GdprDataExportCard: React.FC = () => {
  const exportMutation = useExportPersonalData();
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExport = async () => {
    try {
      setDownloadSuccess(false);
      await exportMutation.mutateAsync();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
          <FileJson className="w-5 h-5 text-emerald-600" />
          <span>Personal Data Portability & Archive (GDPR Art. 20)</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Obtain a complete machine-readable copy of your personal data, applications, and CV history.
        </p>
      </div>

      <div className="p-6 space-y-5">
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Under the General Data Protection Regulation (GDPR) and international privacy laws, you have the right to receive all personal data you have provided to this platform in a structured, commonly used, and machine-readable JSON format.
        </p>

        {/* Data Included Breakdown */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Archive Contents Summary
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Applicant Profile & Contact Details</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Full Work History & Educations</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Verified Skills & Certifications</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>CV Document Metadata & Versions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Job Applications & ATS Match Scores</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Followed Companies & Saved Jobs</span>
            </div>
          </div>
        </div>

        {/* Feedback alerts */}
        {downloadSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Your complete data archive has been generated and downloaded successfully.</span>
          </div>
        )}

        {exportMutation.isError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs font-medium text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Failed to generate data archive. Please try again or contact support.</span>
          </div>
        )}

        {/* Trigger Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={exportMutation.isPending}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {exportMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{exportMutation.isPending ? 'Packaging Archive...' : 'Download Personal Data (.json)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
