import React from 'react';
import type { ApplicationVelocityPointDto } from '@recruitment-platform/shared';

export interface VelocityChartProps {
  points: ApplicationVelocityPointDto[];
  interval: 'day' | 'week' | 'month';
  onIntervalChange?: (interval: 'day' | 'week' | 'month') => void;
  isLoading?: boolean;
}

export const VelocityChart: React.FC<VelocityChartProps> = ({
  points,
  interval,
  onIntervalChange,
  isLoading,
}) => {
  const maxCount = Math.max(1, ...points.map((p) => p.count));

  return (
    <div className="bg-surface border border-border-default rounded-lg p-6 flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Application Velocity</h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Applicant volume trend across calendar intervals
          </p>
        </div>

        {onIntervalChange && (
          <div className="inline-flex rounded-lg border border-border-default p-0.5 bg-surface-muted self-start sm:self-auto">
            {(['day', 'week', 'month'] as const).map((int) => (
              <button
                key={int}
                type="button"
                onClick={() => onIntervalChange(int)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                  interval === int
                    ? 'bg-surface text-text-primary shadow-sm border border-border-default'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {int}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="h-44 flex items-end gap-2 animate-pulse">
          {[40, 70, 30, 90, 60, 80, 50, 65].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-surface-muted rounded-t"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      ) : points.length === 0 ? (
        <div className="h-44 flex flex-col items-center justify-center text-center text-text-muted text-xs">
          <p>No application trend data found for the selected range.</p>
        </div>
      ) : (
        <div>
          <div className="h-48 flex items-end gap-1.5 sm:gap-2 pt-6 pb-2 border-b border-border-default">
            {points.map((pt, i) => {
              const heightPercent = Math.max(4, Math.round((pt.count / maxCount) * 100));

              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  {/* Tooltip */}
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-brand-900 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10">
                    {pt.count} application{pt.count !== 1 ? 's' : ''} ({pt.date})
                  </div>

                  {/* Value Label above bar */}
                  <span className="text-[10px] font-medium text-text-muted mb-1 group-hover:text-text-primary">
                    {pt.count}
                  </span>

                  {/* Bar */}
                  <div
                    className="w-full max-w-[32px] bg-brand-600 group-hover:bg-brand-700 rounded-t transition-all duration-300"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Date Axis */}
          <div className="flex justify-between items-center text-[10px] text-text-muted mt-2 px-1">
            <span>{points[0]?.label || ''}</span>
            {points.length > 2 && (
              <span>{points[Math.floor(points.length / 2)]?.label || ''}</span>
            )}
            <span>{points[points.length - 1]?.label || ''}</span>
          </div>
        </div>
      )}
    </div>
  );
};
