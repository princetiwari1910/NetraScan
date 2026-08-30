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
}

const ACCENT_STYLES = {
  orange: {
    iconBg: 'bg-[#FCF4EF] text-[#E8752F] border border-[#F6D7C3]',
    border: 'hover:border-[#E8752F]',
  },
  blue: {
    iconBg: 'bg-[#F0F7FF] text-[#2563EB] border border-[#DBEAFE]',
    border: 'hover:border-[#2563EB]',
  },
  cyan: {
    iconBg: 'bg-[#F0FDFA] text-[#0891B2] border border-[#CCFBF1]',
    border: 'hover:border-[#0891B2]',
  },
  teal: {
    iconBg: 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]',
    border: 'hover:border-[#16A34A]',
  },
  purple: {
    iconBg: 'bg-[#FAF5FF] text-[#9333EA] border border-[#F3E8FF]',
    border: 'hover:border-[#9333EA]',
  },
  red: {
    iconBg: 'bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2]',
    border: 'hover:border-[#DC2626]',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'orange',
  onClick,
}) => {
  const styles = ACCENT_STYLES[accentColor] || ACCENT_STYLES.orange;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={`bg-white border border-[#EAE9E4] rounded-2xl p-5 shadow-warm-xs transition-all duration-200 ${styles.border} ${
        onClick ? 'cursor-pointer hover:shadow-warm-sm' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${styles.iconBg}`}>
          <Icon size={18} strokeWidth={2.2} />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-black text-[#17191D] tracking-tight">
          {value}
        </span>
        {subtitle && (
          <span className="text-xs text-[#8A8F98] font-medium">
            {subtitle}
          </span>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-[#F0EFEA] flex items-center justify-between text-xs">
          <div
            className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md ${
              trend.isPositive
                ? 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                : 'text-[#C85A20] bg-[#FCF4EF] border border-[#F6D7C3]'
            }`}
          >
            {trend.isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span>{trend.value}</span>
          </div>
          {trend.label && (
            <span className="text-[#8A8F98] font-medium text-[11px]">{trend.label}</span>
          )}
        </div>
      )}
    </motion.div>
  );
};
