import React from 'react';
import { ICDRGrade } from '../../types';
import { ShieldCheck, AlertCircle, AlertTriangle, Flame, AlertOctagon } from 'lucide-react';

interface StatusBadgeProps {
  grade: ICDRGrade;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const GRADE_DETAILS = {
  0: {
    label: 'Grade 0 — No DR',
    shortLabel: 'No DR',
    desc: 'Normal Healthy Retina',
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold',
    dot: 'bg-emerald-500',
    icon: ShieldCheck,
    accent: '#16A34A',
  },
  1: {
    label: 'Grade 1 — Mild NPDR',
    shortLabel: 'Mild NPDR',
    desc: 'Microaneurysms only',
    bg: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold',
    dot: 'bg-amber-500',
    icon: AlertCircle,
    accent: '#D97706',
  },
  2: {
    label: 'Grade 2 — Moderate NPDR',
    shortLabel: 'Moderate NPDR',
    desc: 'Hemorrhages & Exudates',
    bg: 'bg-[#FCF4EF] text-[#C85A20] border-[#F6D7C3] font-semibold',
    dot: 'bg-[#E8752F]',
    icon: AlertTriangle,
    accent: '#E8752F',
  },
  3: {
    label: 'Grade 3 — Severe NPDR',
    shortLabel: 'Severe NPDR',
    desc: '4-2-1 Rule / IRMA',
    bg: 'bg-red-50 text-red-800 border-red-200 font-semibold',
    dot: 'bg-red-500',
    icon: Flame,
    accent: '#DC2626',
  },
  4: {
    label: 'Grade 4 — Proliferative DR',
    shortLabel: 'Proliferative DR',
    desc: 'Neovascularization',
    bg: 'bg-purple-50 text-purple-800 border-purple-200 font-semibold',
    dot: 'bg-purple-500',
    icon: AlertOctagon,
    accent: '#9333EA',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  grade,
  showIcon = true,
  size = 'md',
  className = '',
}) => {
  const info = GRADE_DETAILS[grade] || GRADE_DETAILS[0];
  const Icon = info.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-bold px-3.5 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-colors shadow-warm-xs ${info.bg} ${sizeClasses} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${info.dot}`} />
      {showIcon && <Icon size={iconSizes} className="shrink-0" />}
      <span>{info.label}</span>
    </span>
  );
};
