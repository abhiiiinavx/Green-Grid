import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card } from './Card.js';

export interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  comparison?: string;
  isIncrease?: boolean;
  comparisonLabel?: string;
  icon?: React.ReactNode;
  subtitle?: string;
  status?: 'normal' | 'high' | 'warning' | 'positive';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  comparison,
  isIncrease,
  comparisonLabel = 'vs previous period',
  icon,
  subtitle,
  status = 'normal',
  onClick,
}) => {
  return (
    <Card
      className={`relative overflow-hidden transition-all ${
        onClick ? 'cursor-pointer hover:border-emerald-500/50' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </p>
        {icon && (
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {unit}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      )}

      {comparison !== undefined && (
        <div className="mt-3.5 flex items-center gap-1.5 text-xs">
          <span
            className={`inline-flex items-center font-medium px-1.5 py-0.5 rounded ${
              status === 'positive' || (!isIncrease && status !== 'warning')
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : isIncrease
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {isIncrease ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            ) : comparison.includes('↓') || comparison.includes('-') ? (
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <Minus className="w-3.5 h-3.5 mr-0.5" />
            )}
            {comparison}
          </span>
          <span className="text-slate-500 dark:text-slate-400 truncate">{comparisonLabel}</span>
        </div>
      )}
    </Card>
  );
};
