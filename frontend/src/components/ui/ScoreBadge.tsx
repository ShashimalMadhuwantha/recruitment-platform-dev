import React from 'react';
import { cn } from '../../lib/utils';

export interface ScoreBadgeProps {
  score: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showProgressBar?: boolean;
  className?: string;
}

export function getScoreBand(score: number): {
  band: 'high' | 'mid' | 'low';
  label: 'Strong match' | 'Partial match' | 'Weak match';
  textColor: string;
  bgColor: string;
  progressColor: string;
} {
  const rounded = Math.round(score);
  if (rounded >= 80) {
    return {
      band: 'high',
      label: 'Strong match',
      textColor: 'text-score-high',
      bgColor: 'bg-score-high-bg',
      progressColor: 'bg-score-high',
    };
  } else if (rounded >= 50) {
    return {
      band: 'mid',
      label: 'Partial match',
      textColor: 'text-score-mid',
      bgColor: 'bg-score-mid-bg',
      progressColor: 'bg-score-mid',
    };
  } else {
    return {
      band: 'low',
      label: 'Weak match',
      textColor: 'text-score-low',
      bgColor: 'bg-score-low-bg',
      progressColor: 'bg-score-low',
    };
  }
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  size = 'md',
  showLabel = true,
  showProgressBar = false,
  className,
}) => {
  const roundedScore = Math.max(0, Math.min(100, Math.round(score)));
  const { label, textColor, bgColor, progressColor } = getScoreBand(roundedScore);

  const containerSizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-4 py-2.5 text-base',
  };

  const numberSizes = {
    sm: 'font-semibold',
    md: 'font-bold',
    lg: 'text-3xl font-bold',
  };

  const isLg = size === 'lg';

  return (
    <div className={cn('inline-flex flex-col gap-1', isLg && 'w-full max-w-[280px]', className)}>
      <div
        data-testid="score-badge"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors',
          bgColor,
          textColor,
          containerSizes[size]
        )}
      >
        <span className={cn('tracking-tight', numberSizes[size])}>{roundedScore}%</span>
        {showLabel && <span className="font-normal text-xs opacity-90">{label}</span>}
      </div>

      {(showProgressBar || isLg) && (
        <div
          className="w-full bg-border-default/40 rounded-full h-2 overflow-hidden"
          role="progressbar"
          aria-valuenow={roundedScore}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn('h-full rounded-full transition-all duration-500', progressColor)}
            style={{ width: `${roundedScore}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default ScoreBadge;
