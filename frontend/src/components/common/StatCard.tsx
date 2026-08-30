import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
    label?: string;
  };
  accentColor?: 'blue' | 'cyan' | 'teal' | 'orange' | 'purple' | 'red';
  onClick?: () => void;
  variant?: 'dark' | 'light';
}

const ACCENT_STYLES = {
  orange: {
    iconBg: 'bg-[#F97316]/15 text-[#FB923C] border border-[#F97316]/30',
    border: 'hover:border-[#F97316]',
  },
  blue: {
    iconBg: 'bg-[#2563EB]/15 text-[#38BDF8] border border-[#2563EB]/30',
    border: 'hover:border-[#38BDF8]',
  },
  cyan: {
    iconBg: 'bg-[#0EA5E9]/15 text-[#22D3EE] border border-[#0EA5E9]/30',
    border: 'hover:border-[#22D3EE]',
  },
  teal: {
    iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    border: 'hover:border-emerald-400',
  },
  purple: {
    iconBg: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
    border: 'hover:border-purple-400',
  },
  red: {
    iconBg: 'bg-red-500/15 text-red-400 border border-red-500/30',
    border: 'hover:border-red-400',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'blue',
  onClick,
  variant = 'dark',
}) => {
  const styles = ACCENT_STYLES[accentColor] || ACCENT_STYLES.blue;
  const isDark = variant === 'dark';

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={`rounded-2xl p-5 transition-all duration-200 ${
        isDark
          ? 'bg-[#101B2D] border border-[#1E2E48] text-white shadow-dark-sm'
          : 'bg-white border border-[#E2E8F0] text-slate-900 shadow-sm'
      } ${styles.border} ${onClick ? 'cursor-pointer hover:shadow-dark-md' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-[11px] font-bold uppercase tracking-wider ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${styles.iconBg}`}>
          <Icon size={18} strokeWidth={2.2} />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span
          className={`text-2xl sm:text-3xl font-black tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          {value}
        </span>
        {subtitle && (
          <span
            className={`text-xs font-medium font-mono ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {subtitle}
          </span>
        )}
      </div>

      {trend && (
        <div
          className={`mt-3 pt-3 border-t flex items-center justify-between text-xs ${
            isDark ? 'border-[#1E2E48]' : 'border-slate-100'
          }`}
        >
          <div
            className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md ${
              trend.isPositive
                ? 'text-emerald-400 bg-emerald-950/50 border border-emerald-800/50'
                : 'text-[#FB923C] bg-[#F97316]/15 border border-[#F97316]/30'
            }`}
          >
            {trend.isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span>{trend.value}</span>
          </div>
          {trend.label && (
            <span
              className={`font-medium text-[11px] ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {trend.label}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};
