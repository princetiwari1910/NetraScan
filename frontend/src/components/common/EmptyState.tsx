import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'dark' | 'light';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  actionLabel,
  onAction,
  variant = 'dark',
}) => {
  const isDark = variant === 'dark';
  const label = action?.label || actionLabel;
  const handleClick = action?.onClick || onAction;

  return (
    <div
      className={`text-center py-12 px-4 rounded-2xl border border-dashed ${
        isDark
          ? 'bg-[#101B2D] border-[#1E2E48] text-white shadow-dark-sm'
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      <div
        className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4 border ${
          isDark
            ? 'bg-[#162338] text-slate-400 border-[#1E2E48]'
            : 'bg-slate-100 text-slate-400 border-slate-200'
        }`}
      >
        <Icon size={26} />
      </div>
      <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
      <p
        className={`text-xs max-w-sm mx-auto mt-1 leading-relaxed ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}
      >
        {description}
      </p>
      {label && handleClick && (
        <button
          onClick={handleClick}
          className="mt-4 px-4 py-2 bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] hover:from-[#1D4ED8] hover:to-[#0284C7] text-white text-xs font-bold rounded-xl shadow-glow-blue transition font-mono"
        >
          {label}
        </button>
      )}
    </div>
  );
};
