import React, { useState, useRef } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import type { CVDto } from '../types';

interface ResumeUploaderProps {
  resumes: CVDto[];
  onUpload: (data: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    fileData?: string;
    isPrimary?: boolean;
    formData?: FormData;
  }) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onSetPrimary: (id: string) => Promise<any>;
  onApplyToProfile: (cvId: string) => Promise<any>;
  isUploading: boolean;
}

export const ResumeUploader: React.FC<ResumeUploaderProps> = ({
  resumes,
  onUpload,
  onDelete,
  onSetPrimary,
  onApplyToProfile,
  isUploading,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewCv, setPreviewCv] = useState<CVDto | null>(null);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFile = async (file: File) => {
    setUploadError(null);
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File exceeds 5MB maximum upload limit.');
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

    // Read file as base64 or prepare FormData
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1];
        await onUpload({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/pdf',
          fileData: base64Data,
          isPrimary: resumes.length === 0,
        });
      } catch (err: any) {
        setUploadError(err.response?.data?.error?.message || 'Failed to upload and parse resume.');
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
    }
  };

  const handleApply = async (cvId: string) => {
    try {
      setIsApplying(true);
      await onApplyToProfile(cvId);
      setApplySuccess('Resume details and skills have been successfully applied to your profile!');
      setTimeout(() => setApplySuccess(null), 4000);
    } catch (err: any) {
      setUploadError(err.response?.data?.error?.message || 'Could not auto-fill profile from resume.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Card className="p-6 bg-surface border border-border-default space-y-6">
      <div className="border-b border-border-default pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-brand-900">Resume & CV Management</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Upload your CV for automated text extraction, background ATS parsing, and quick application attachment.
          </p>
        </div>
      </div>

      {uploadError && (
        <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-lg border border-rose-200">
          ⚠️ {uploadError}
        </div>
      )}

      {applySuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200">
          ✓ {applySuccess}
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
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-brand-600 bg-brand-50/50'
            : 'border-border-default hover:border-slate-400 bg-surface-muted/40'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept=".pdf,.docx,.doc,.txt"
          className="hidden"
        />

        <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-3 text-xl">
          📄
        </div>

        {isUploading ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-brand-900">Uploading & Parsing Resume...</p>
            <p className="text-xs text-text-secondary">Extracting skills, contact info, and background milestones</p>
            <div className="w-48 mx-auto bg-slate-200 rounded-full h-1.5 overflow-hidden mt-2">
              <div className="h-full bg-brand-600 animate-pulse w-full" />
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-brand-900">
              Click to browse or drag and drop your CV file here
            </p>
            <p className="text-xs text-text-muted">Supports PDF, DOCX, or TXT up to 5MB</p>
          </div>
        )}
      </div>

      {/* Uploaded Resumes List */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-semibold text-text-primary">Uploaded Documents ({resumes.length})</h3>

        {resumes.length === 0 ? (
          <p className="text-xs text-text-muted italic">No resume uploaded yet. Upload a document to earn +15% profile completeness.</p>
        ) : (
          <div className="space-y-3">
            {resumes.map((cv) => (
              <div
                key={cv.id}
                className="p-4 rounded-xl border border-border-default bg-surface hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {cv.fileName.endsWith('.pdf') ? 'PDF' : 'DOC'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-brand-900">{cv.fileName}</span>
                      {cv.isPrimary && (
                        <span className="text-[10px] uppercase font-bold bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full">
                          Primary CV
                        </span>
                      )}
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          cv.parsingStatus === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : cv.parsingStatus === 'FAILED'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {cv.parsingStatus || 'PARSED'}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      {formatFileSize(cv.fileSize)} • Uploaded on {cv.createdAt ? cv.createdAt.split('T')[0] : 'Recently'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewCv(cv)}
                    className="text-xs text-brand-600 hover:bg-brand-50"
                  >
                    View Parsed Data
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isApplying}
                    onClick={() => handleApply(cv.id)}
                    className="text-xs"
                  >
                    Apply to Profile
                  </Button>

                  {!cv.isPrimary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSetPrimary(cv.id)}
                      className="text-xs text-text-secondary"
                    >
                      Make Primary
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={() => onDelete(cv.id)}
                    className="text-xs text-rose-600 hover:text-rose-800 p-1.5"
                    title="Delete resume"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Parsed Data Preview Modal / Drawer */}
      {previewCv && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border-default shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-border-default flex items-center justify-between bg-surface-muted">
              <div>
                <h3 className="text-base font-bold text-brand-900">Parsed Resume Entities</h3>
                <p className="text-xs text-text-secondary">{previewCv.fileName}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCv(null)}
                className="text-text-muted hover:text-text-primary text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {previewCv.parsedJson ? (
                <>
                  {/* Contact Info */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-brand-900 uppercase tracking-wider">Contact Information</h4>
                    <div className="p-3 bg-slate-50 rounded-lg border text-xs text-text-primary space-y-1">
                      <p><span className="font-semibold">Email:</span> {previewCv.parsedJson.contactInfo?.email || 'N/A'}</p>
                      <p><span className="font-semibold">Phone:</span> {previewCv.parsedJson.contactInfo?.phone || 'N/A'}</p>
                      <p><span className="font-semibold">Candidate Name:</span> {previewCv.parsedJson.contactInfo?.name || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Detected Skills */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-brand-900 uppercase tracking-wider">
                      Detected Skills ({previewCv.parsedJson.detectedSkills?.length || 0})
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {previewCv.parsedJson.detectedSkills && previewCv.parsedJson.detectedSkills.length > 0 ? (
                        previewCv.parsedJson.detectedSkills.map((s, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-medium"
                          >
                            ✓ {s}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-text-muted">No explicit skills matched</p>
                      )}
                    </div>
                  </div>

                  {/* Work Experience */}
                  {previewCv.parsedJson.workExperience && previewCv.parsedJson.workExperience.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-brand-900 uppercase tracking-wider">Extracted Experience</h4>
                      <div className="space-y-2">
                        {previewCv.parsedJson.workExperience.map((exp, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-lg border text-xs">
                            <p className="font-bold text-text-primary">{exp.title}</p>
                            <p className="text-text-secondary">{exp.company} • {exp.startDate || '2022'} - {exp.endDate || 'Present'}</p>
                            {exp.description && <p className="text-text-muted mt-1">{exp.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {previewCv.parsedJson.education && previewCv.parsedJson.education.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-brand-900 uppercase tracking-wider">Extracted Education</h4>
                      <div className="space-y-2">
                        {previewCv.parsedJson.education.map((edu, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-lg border text-xs">
                            <p className="font-bold text-text-primary">{edu.degree}</p>
                            <p className="text-text-secondary">{edu.institution} {edu.fieldOfStudy ? `(${edu.fieldOfStudy})` : ''}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Raw Text Preview */}
                  {previewCv.parsedText && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-brand-900 uppercase tracking-wider">Indexed Plain Text (for ATS TF-IDF Matching)</h4>
                      <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {previewCv.parsedText}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-text-secondary">No parsed metadata available for this file.</p>
              )}
            </div>

            <div className="p-4 border-t border-border-default bg-surface-muted flex justify-between items-center">
              <Button variant="ghost" size="sm" onClick={() => setPreviewCv(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  await handleApply(previewCv.id);
                  setPreviewCv(null);
                }}
              >
                Apply Parsed Data to Profile
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
