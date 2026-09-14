import React from 'react';

export interface KpiMetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: number;
    unit?: string;
    isPositiveGood?: boolean;
  };
  subtitle?: string;
  icon?: React.ReactNode;
}

export const KpiMetricCard: React.FC<KpiMetricCardProps> = ({
  title,
  value,
  unit,
  trend,
  subtitle,
  icon,
}) => {
  const isPositive = trend ? trend.value > 0 : false;
  const isNeutral = trend ? trend.value === 0 : true;

  // By default, positive trend is good, unless isPositiveGood is explicitly false (e.g. time to hire: lower is better)
  const isGood =
    trend?.isPositiveGood !== undefined
      ? trend.isPositiveGood
        ? isPositive
        : !isPositive
      : isPositive;

  const trendColorClass = isNeutral
    ? 'text-text-secondary bg-surface-muted border-border-default'
    : isGood
    ? 'text-score-high bg-emerald-50 border-emerald-200'
    : 'text-score-low bg-rose-50 border-rose-200';

  return (
    <div className="bg-surface border border-border-default rounded-lg p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">{title}</span>
        {icon && <div className="text-text-muted">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          {value}
        </span>
        {unit && <span className="text-sm text-text-secondary font-medium">{unit}</span>}
      </div>

      <div className="mt-3 pt-3 border-t border-border-default flex items-center justify-between text-xs">
        {trend ? (
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[11px] font-semibold ${trendColorClass}`}
            >
              {isPositive ? '+' : ''}
              {trend.value}
              {trend.unit || '%'}
            </span>
            <span className="text-text-muted">{subtitle || 'vs previous period'}</span>
          </div>
        ) : (
          <span className="text-text-muted">{subtitle || 'Real-time aggregate'}</span>
        )}
      </div>
    </div>
  );
};
