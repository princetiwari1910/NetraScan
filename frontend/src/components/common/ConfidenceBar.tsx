import React from 'react';
import { motion } from 'framer-motion';
import { ICDRGrade } from '../../types';

interface ConfidenceBarProps {
  probabilities: Record<string, number>;
  predictedGrade: ICDRGrade;
  variant?: 'dark' | 'light';
}

const STAGE_CONFIG: Array<{ grade: ICDRGrade; keyMatch: string; label: string; colorDark: string; colorLight: string; barBg: string }> = [
  { grade: 0, keyMatch: '0', label: 'Grade 0 — No DR', colorDark: 'text-emerald-400', colorLight: 'text-emerald-700', barBg: 'bg-emerald-500' },
  { grade: 1, keyMatch: '1', label: 'Grade 1 — Mild NPDR', colorDark: 'text-amber-400', colorLight: 'text-amber-700', barBg: 'bg-amber-500' },
  { grade: 2, keyMatch: '2', label: 'Grade 2 — Moderate NPDR', colorDark: 'text-[#FB923C]', colorLight: 'text-[#C85A20]', barBg: 'bg-[#F97316]' },
  { grade: 3, keyMatch: '3', label: 'Grade 3 — Severe NPDR', colorDark: 'text-red-400', colorLight: 'text-red-700', barBg: 'bg-red-500' },
  { grade: 4, keyMatch: '4', label: 'Grade 4 — Proliferative DR', colorDark: 'text-purple-400', colorLight: 'text-purple-700', barBg: 'bg-purple-500' },
];

export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({
  probabilities,
  predictedGrade,
  variant = 'dark',
}) => {
  const isDark = variant === 'dark';

  const getProbability = (grade: ICDRGrade): number => {
    for (const [key, val] of Object.entries(probabilities || {})) {
      if (key.includes(String(grade)) || key.startsWith(`Grade_${grade}`)) {
        return val;
      }
    }
    return 0;
  };

  return (
    <div
      className={`rounded-2xl p-6 transition-all ${
        isDark
          ? 'bg-[#101B2D] border border-[#1E2E48] text-white shadow-dark-sm'
          : 'bg-white border border-[#EAE9E4] text-slate-900 shadow-sm'
      }`}
    >
      <div
        className={`flex items-center justify-between pb-3 border-b ${
          isDark ? 'border-[#1E2E48]' : 'border-[#F0EFEA]'
        }`}
      >
        <h4
          className={`text-xs font-bold uppercase tracking-wider ${
            isDark ? 'text-slate-400' : 'text-[#5F6368]'
          }`}
        >
          Softmax Class Probabilities (5-Class ICDR)
        </h4>
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold font-mono ${
            isDark
              ? 'bg-[#162338] text-[#38BDF8] border border-[#1E2E48]'
              : 'bg-[#FCF4EF] text-[#C85A20] border border-[#F6D7C3]'
          }`}
        >
          Softmax Distribution
        </span>
      </div>

      <div className="space-y-2.5 pt-2">
        {STAGE_CONFIG.map(({ grade, label, colorDark, colorLight, barBg }) => {
          const prob = getProbability(grade);
          const percent = (prob * 100).toFixed(1);
          const isSelected = grade === predictedGrade;

          return (
            <div
              key={grade}
              className={`p-2.5 rounded-xl transition-colors ${
                isSelected
                  ? isDark
                    ? 'bg-[#162338] border border-[#38BDF8]/40 shadow-sm'
                    : 'bg-[#FCF4EF] border border-[#F6D7C3] shadow-sm'
                  : isDark
                  ? 'hover:bg-[#162338]/50'
                  : 'hover:bg-[#FAF9F7]'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span
                  className={`flex items-center gap-2 ${
                    isSelected
                      ? isDark
                        ? 'font-bold text-white'
                        : 'font-bold text-[#17191D]'
                      : isDark
                      ? 'text-slate-300'
                      : 'text-[#5F6368]'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${barBg}`} />
                  {label}
                  {isSelected && (
                    <span className="text-[10px] bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ml-1 font-mono">
                      Predicted
                    </span>
                  )}
                </span>
                <span
                  className={`font-bold font-mono ${
                    isSelected ? (isDark ? colorDark : colorLight) : isDark ? 'text-slate-400' : 'text-[#8A8F98]'
                  }`}
                >
                  {percent}%
                </span>
              </div>

              <div
                className={`h-2 w-full rounded-full overflow-hidden ${
                  isDark ? 'bg-[#0B1424]' : 'bg-[#EFECE6]'
                }`}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: grade * 0.08 }}
                  className={`h-full rounded-full ${barBg} ${
                    isSelected ? 'shadow-sm' : 'opacity-80'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
