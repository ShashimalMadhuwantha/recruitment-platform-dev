import React from 'react';
import {
  X,
  TrendingUp,
  Award,
  BookOpen,
  Briefcase,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  BarChart2,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useProfileImprovement } from '../hooks';
import { useNavigate } from 'react-router-dom';

interface ProfileImprovementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileImprovementDrawer: React.FC<ProfileImprovementDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { data, isLoading } = useProfileImprovement({ enabled: isOpen });

  if (!isOpen) return null;

  const handleActionClick = (actionType: string) => {
    onClose();
    switch (actionType) {
      case 'ADD_SKILL':
        navigate('/applicant/profile?tab=skills');
        break;
      case 'EDIT_SUMMARY':
        navigate('/applicant/profile?tab=basic');
        break;
      case 'ADD_EXPERIENCE':
        navigate('/applicant/profile?tab=experience');
        break;
      case 'ADD_CERTIFICATION':
        navigate('/applicant/profile?tab=certifications');
        break;
      default:
        navigate('/applicant/profile');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-2xs flex justify-end">
      <div className="w-full max-w-xl bg-surface h-full shadow-2xl border-l border-border-default flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-border-default flex items-start justify-between bg-surface-muted">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text-primary">
                  Career Insights & Skill Gap Analysis
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-100 text-brand-700">
                  FR-AP-23
                </span>
              </div>
              <p className="text-xs text-text-secondary">
                Cross-referenced against requirements in your target market
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <TrendingUp className="w-10 h-10 text-brand-600 animate-pulse mx-auto" />
              <p className="text-xs font-semibold text-text-primary">
                Scanning target jobs & computing industry skill demand...
              </p>
            </div>
          ) : !data ? (
            <div className="py-16 text-center text-xs text-text-secondary">
              Unable to generate recommendations at this time.
            </div>
          ) : (
            <>
              {/* Readiness Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100/50 border border-brand-200 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-brand-800 uppercase tracking-wider">
                    Market Competitiveness Score
                  </span>
                  <div className="text-3xl font-extrabold text-brand-950">
                    {data.overallReadinessScore}%
                  </div>
                  <p className="text-xs text-brand-800">
                    Benchmarked against {data.targetJobsAnalyzedCount} open job vacancies
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-surface/80 border border-brand-200 flex items-center justify-center text-brand-600 shadow-2xs">
                  <Sparkles className="w-8 h-8" />
                </div>
              </div>

              {/* Market Missing Skills */}
              {data.topMissingSkills && data.topMissingSkills.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-brand-600" />
                      <span>Most Demanded Skills You're Missing</span>
                    </h3>
                    <span className="text-[11px] text-text-secondary">Market demand</span>
                  </div>

                  <div className="space-y-2.5">
                    {data.topMissingSkills.map((skill, idx) => {
                      const demandPercent = Math.min(
                        100,
                        Math.round((skill.frequency / Math.max(1, data.targetJobsAnalyzedCount)) * 100)
                      );
                      return (
                        <div
                          key={idx}
                          className="p-3 bg-surface-muted rounded-xl border border-border-default space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-text-primary">{skill.name}</span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                skill.priority === 'HIGH'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {demandPercent}% of target jobs
                            </span>
                          </div>

                          <div className="w-full h-1.5 bg-border-default rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-600 rounded-full transition-all"
                              style={{ width: `${Math.max(15, demandPercent)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actionable Recommendations */}
              <div className="space-y-3 pt-2 border-t border-border-default">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Targeted Optimization Steps ({data.suggestions.length})
                </h3>

                <div className="space-y-3">
                  {data.suggestions.map((sug) => (
                    <div
                      key={sug.id}
                      className="p-4 rounded-xl border border-border-default bg-surface hover:border-brand-300 transition-colors space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              sug.priority === 'HIGH'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {sug.priority} Priority
                          </span>
                          <h4 className="text-xs font-bold text-text-primary mt-1">
                            {sug.title}
                          </h4>
                        </div>
                      </div>

                      <p className="text-xs text-text-secondary leading-relaxed">
                        {sug.description}
                      </p>

                      <div className="pt-1 flex items-center justify-end">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleActionClick(sug.actionType)}
                          className="text-xs gap-1.5 border-brand-200 text-brand-700 hover:bg-brand-50"
                        >
                          <span>{sug.actionLabel}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border-default bg-surface-muted flex items-center justify-between">
          <span className="text-[11px] text-text-secondary">
            Continuous AI analysis based on your activity
          </span>
          <Button variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
