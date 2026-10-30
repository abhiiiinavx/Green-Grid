import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className,
  ...props
}) => {
  const baseStyles = 'bg-white dark:bg-slate-900 rounded-xl transition-all';

  const variantStyles = {
    default: 'border border-slate-200/80 dark:border-slate-800 shadow-subtle',
    elevated: 'border border-slate-200/60 dark:border-slate-800 shadow-card hover:shadow-elevated',
    bordered: 'border border-slate-300 dark:border-slate-700',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3.5 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={twMerge(clsx(baseStyles, variantStyles[variant], paddingStyles[padding], className))}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className }) => {
  return (
    <div className={twMerge('flex items-start justify-between gap-4 mb-4', className)}>
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};
