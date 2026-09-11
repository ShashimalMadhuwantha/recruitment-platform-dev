import React, { useState, useRef } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
  useApplicantProfile,
  useResumes,
  useUploadResume,
  useDeleteResume,
  useSetPrimaryResume,
  useUpdateCVLabel,
  useDuplicateCV,
} from '../hooks';
import { applicantProfileApi } from '../api';
import type { ApplicantProfileDto, CVDto } from '../types';
import { CVBuilderModal } from './CVBuilderModal';
import { CVVersionHistoryModal } from './CVVersionHistoryModal';
import { SmartParseReviewModal } from './SmartParseReviewModal';
import {
  FileText,
  Sparkles,
  UploadCloud,
  History,
  Copy,
  Star,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Check,
  X,
} from 'lucide-react';

export interface CVManagerProps {
  profile?: ApplicantProfileDto;
  resumes?: CVDto[];
}

export const CVManager: React.FC<CVManagerProps> = ({
  profile: propProfile,
  resumes: propResumes,
}) => {
  const { data: fetchedProfile } = useApplicantProfile();
  const { data: fetchedResumes = [] } = useResumes();

  const profile = propProfile || fetchedProfile;
  const resumes = propResumes || fetchedResumes;

  // Mutations
  const uploadMutation = useUploadResume();
  const deleteMutation = useDeleteResume();
  const setPrimaryMutation = useSetPrimaryResume();
  const updateLabelMutation = useUpdateCVLabel();
  const duplicateMutation = useDuplicateCV();

  // Modals & Drawers state
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [historyCv, setHistoryCv] = useState<CVDto | null>(null);
  const [reviewCv, setReviewCv] = useState<CVDto | null>(null);

  // Upload state
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editing Version Label State
  const [editingCvId, setEditingCvId] = useState<string | null>(null);
  const [editLabelValue, setEditLabelValue] = useState<string>('');

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTemplateName = (name?: string) => {
    if (!name) return null;
    switch (name) {
      case 'MODERN_CLEAN':
        return 'Modern Clean';
      case 'TECHNICAL_ATS':
        return 'Technical ATS';
      case 'EXECUTIVE_CLASSIC':
        return 'Executive Classic';
      default:
        return name;
    }
  };

  const processFile = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File exceeds the 5MB maximum upload limit.');
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|doc|txt)$/i)) {
      setUploadError('Only PDF, DOCX, and TXT files are supported.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1];
        const initialLabel = file.name.replace(/\.[^/.]+$/, '');
        const createdCv = await uploadMutation.mutateAsync({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/pdf',
          fileData: base64Data,
          versionLabel: initialLabel,
          isPrimary: resumes.length === 0,
        });

        setUploadSuccess(`"${file.name}" uploaded successfully!`);
        setTimeout(() => setUploadSuccess(null), 4000);

        // Open Smart Parse Review drawer automatically so candidate can verify & sync extracted entities
        if (createdCv) {
          setReviewCv(createdCv);
        }
      } catch (err: any) {
        setUploadError(err.response?.data?.error?.message || 'Failed to upload and parse CV file.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleDownload = async (cv: CVDto) => {
    try {
      setDownloadingId(cv.id);
      await applicantProfileApi.downloadResumeBlob(cv.id, cv.fileName);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to download CV document.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleStartEditingLabel = (cv: CVDto) => {
    setEditingCvId(cv.id);
    setEditLabelValue(cv.versionLabel || cv.fileName.replace(/\.[^/.]+$/, ''));
  };

  const handleSaveLabel = async (cvId: string) => {
    if (!editLabelValue.trim()) return;
    try {
      await updateLabelMutation.mutateAsync({
        cvId,
        versionLabel: editLabelValue.trim(),
      });
      setEditingCvId(null);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update CV label.');
    }
  };

  const handleDuplicate = async (cvId: string) => {
    try {
      await duplicateMutation.mutateAsync(cvId);
      setUploadSuccess('CV duplicated successfully! You can now tailor this copy.');
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to duplicate CV.');
    }
  };

  const handleDelete = async (cvId: string, label?: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${
          label || 'this CV'
        }"? All previous version records for this CV will also be deleted.`
      )
    ) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(cvId);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete CV.');
    }
  };

  return (
    <Card className="p-6 bg-surface border border-border-default space-y-6">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-5">
        <div>
          <h2 className="text-lg font-semibold text-brand-900">Applicant CV & Resume Management</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage multiple tailored CV versions, generate ATS-optimized PDFs from your profile, and review extraction data.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5"
          >
            <UploadCloud className="w-4 h-4 text-brand-600" />
            <span>Upload File</span>
          </Button>

          {profile && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsBuilderOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Build CV from Profile</span>
            </Button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {uploadError && (
        <div className="p-3 bg-red-50 text-red-800 text-xs rounded-lg border border-red-200 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-red-600 hover:text-red-800 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {uploadSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{uploadSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadSuccess(null)}
            className="text-emerald-600 hover:text-emerald-800 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Drag and Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-brand-600 bg-brand-50/60 scale-[1.005]'
            : 'border-border-default hover:border-brand-400 bg-surface-muted/30 hover:bg-surface-muted/60'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept=".pdf,.docx,.doc,.txt"
          className="hidden"
        />

        <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center mx-auto mb-2.5">
          <UploadCloud className="w-5 h-5" />
        </div>

        {uploadMutation.isPending ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-brand-900">Uploading & Parsing Resume...</p>
            <p className="text-xs text-text-secondary">Extracting skills, contact details, and career milestones</p>
            <div className="w-48 mx-auto bg-slate-200 rounded-full h-1.5 overflow-hidden mt-2">
              <div className="h-full bg-brand-600 animate-pulse w-full" />
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-brand-900">
              Drag and drop your CV file here, or <span className="text-brand-600 underline">browse</span>
            </p>
            <p className="text-xs text-text-muted">
              Supports PDF and DOCX files up to 5MB. Automatic text & entity extraction will begin immediately.
            </p>
          </div>
        )}
      </div>

      {/* CV Versions List */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-brand-900 flex items-center gap-2">
            <span>Tailored CV Versions</span>
            <span className="text-xs font-normal text-text-muted">({resumes.length})</span>
          </h3>
          <p className="text-[11px] text-text-muted">
            The designated <span className="font-semibold text-brand-700">Primary CV</span> will be pre-selected for quick one-click job applications.
          </p>
        </div>

        {resumes.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border-default rounded-xl bg-surface-muted/20 space-y-3">
            <FileText className="w-10 h-10 text-text-muted mx-auto stroke-1" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-brand-900">No CV versions created yet</p>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                Upload your existing resume to parse your skills automatically, or generate an ATS-optimized CV using our built-in builder.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Document</span>
              </Button>
              {profile && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsBuilderOpen(true)}
                  className="flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Use CV Builder</span>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {resumes.map((cv) => {
              const isEditing = editingCvId === cv.id;
              const isBuilt = cv.createdFrom === 'BUILDER' || !!cv.templateName;
              const skills = cv.parsedJson?.detectedSkills || [];

              return (
                <div
                  key={cv.id}
                  className={`p-4 rounded-xl border transition-all ${
                    cv.isPrimary
                      ? 'border-brand-300 bg-brand-50/20 shadow-xs'
                      : 'border-border-default bg-surface hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left Column: Icon & Metadata */}
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isBuilt
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-brand-50 text-brand-700 border border-brand-200'
                        }`}
                      >
                        {isBuilt ? (
                          <Sparkles className="w-5 h-5" />
                        ) : cv.fileName.endsWith('.docx') ? (
                          'DOCX'
                        ) : (
                          'PDF'
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        {/* Title & Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={editLabelValue}
                                onChange={(e) => setEditLabelValue(e.target.value)}
                                className="px-2 py-0.5 text-xs font-semibold border border-brand-500 rounded focus:outline-hidden focus:ring-1 focus:ring-brand-500 bg-white"
                                placeholder="e.g. Senior Frontend Specialist CV"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveLabel(cv.id);
                                  if (e.key === 'Escape') setEditingCvId(null);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveLabel(cv.id)}
                                className="p-1 text-emerald-600 hover:text-emerald-800"
                                title="Save label"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCvId(null)}
                                className="p-1 text-text-muted hover:text-text-primary"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-brand-900">
                                {cv.versionLabel || cv.fileName}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleStartEditingLabel(cv)}
                                className="text-text-muted hover:text-brand-600 p-0.5 rounded"
                                title="Edit version label"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          {/* Primary Badge */}
                          {cv.isPrimary && (
                            <Badge variant="primary" size="sm" className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current" />
                              <span>Primary CV</span>
                            </Badge>
                          )}

                          {/* Source Badge */}
                          {isBuilt ? (
                            <Badge variant="secondary" size="sm" className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              <span>{formatTemplateName(cv.templateName || undefined) || 'ATS Generator'}</span>
                            </Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">
                              Upload
                            </Badge>
                          )}

                          {/* Parsing Status */}
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              cv.parsingStatus === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : cv.parsingStatus === 'FAILED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {cv.parsingStatus || 'PARSED'}
                          </span>
                        </div>

                        {/* File Details & Date */}
                        <p className="text-xs text-text-secondary">
                          <span className="font-mono text-[11px] text-text-muted">{cv.fileName}</span>
                          <span className="mx-1.5">•</span>
                          <span>{formatFileSize(cv.fileSize)}</span>
                          <span className="mx-1.5">•</span>
                          <span>Created {cv.createdAt ? cv.createdAt.split('T')[0] : 'Recently'}</span>
                        </p>

                        {/* Skill Keywords Summary */}
                        {skills.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            <span className="text-[10px] text-text-muted mr-1 font-medium">Keywords:</span>
                            {skills.slice(0, 4).map((skill, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded border border-slate-200 font-mono"
                              >
                                {skill}
                              </span>
                            ))}
                            {skills.length > 4 && (
                              <span className="text-[10px] text-text-muted">
                                +{skills.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Actions */}
                    <div className="flex flex-wrap items-center gap-2 self-end lg:self-center shrink-0">
                      {/* Download */}
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={downloadingId === cv.id}
                        onClick={() => handleDownload(cv)}
                        className="text-xs flex items-center gap-1"
                        title="Download CV file"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </Button>

                      {/* Version History (Rollback) */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setHistoryCv(cv)}
                        className="text-xs flex items-center gap-1 text-text-secondary hover:text-brand-900"
                        title="View chronological version history and restore previous snapshots"
                      >
                        <History className="w-3.5 h-3.5 text-brand-600" />
                        <span>History</span>
                      </Button>

                      {/* Duplicate */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicate(cv.id)}
                        className="text-xs flex items-center gap-1 text-text-secondary hover:text-brand-900"
                        title="Duplicate this CV into a new version to tailor for another role"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Duplicate</span>
                      </Button>

                      {/* Review Parsed Entities Drawer */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReviewCv(cv)}
                        className="text-xs flex items-center gap-1 text-brand-600 hover:bg-brand-50"
                        title="Verify extracted skills and selectively import to profile"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Review Data</span>
                      </Button>

                      {/* Make Primary */}
                      {!cv.isPrimary && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPrimaryMutation.mutateAsync(cv.id)}
                          className="text-xs text-text-muted hover:text-amber-600"
                          title="Set as primary CV for future job applications"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(cv.id, cv.versionLabel || cv.fileName)}
                        className="text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2"
                        title="Delete this CV version"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals & Drawers */}
      {/* 1. Smart Parse Review Drawer */}
      <SmartParseReviewModal
        cv={reviewCv}
        isOpen={!!reviewCv}
        onClose={() => setReviewCv(null)}
      />

      {/* 2. Chronological Version History & Restore Modal */}
      <CVVersionHistoryModal
        cv={historyCv}
        isOpen={!!historyCv}
        onClose={() => setHistoryCv(null)}
      />

      {/* 3. CV Builder Modal */}
      {profile && (
        <CVBuilderModal
          profile={profile}
          isOpen={isBuilderOpen}
          onClose={() => setIsBuilderOpen(false)}
        />
      )}
    </Card>
  );
};

export default CVManager;
