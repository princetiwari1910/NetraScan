import React from 'react';
import { motion } from 'framer-motion';
import { ICDRGrade } from '../../types';

interface ConfidenceBarProps {
  probabilities: Record<string, number>;
  predictedGrade: ICDRGrade;
}

const STAGE_CONFIG: Array<{ grade: ICDRGrade; keyMatch: string; label: string; color: string; barBg: string }> = [
  { grade: 0, keyMatch: '0', label: 'Grade 0 — No DR', color: 'text-emerald-700', barBg: 'bg-emerald-500' },
  { grade: 1, keyMatch: '1', label: 'Grade 1 — Mild NPDR', color: 'text-amber-700', barBg: 'bg-amber-500' },
  { grade: 2, keyMatch: '2', label: 'Grade 2 — Moderate NPDR', color: 'text-[#C85A20]', barBg: 'bg-[#E8752F]' },
  { grade: 3, keyMatch: '3', label: 'Grade 3 — Severe NPDR', color: 'text-red-700', barBg: 'bg-red-500' },
  { grade: 4, keyMatch: '4', label: 'Grade 4 — Proliferative DR', color: 'text-purple-700', barBg: 'bg-purple-500' },
];

export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({
  probabilities,
  predictedGrade,
}) => {
  const getProbability = (grade: ICDRGrade): number => {
    for (const [key, val] of Object.entries(probabilities || {})) {
      if (key.includes(String(grade)) || key.startsWith(`Grade_${grade}`)) {
        return val;
      }
    }
    return 0;
  };

  return (
    <div className="space-y-3.5 bg-white border border-[#EAE9E4] rounded-2xl p-6 shadow-warm-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#5F6368]">
          Softmax Class Probabilities (5-Class ICDR)
        </h4>
        <span className="text-xs bg-[#FCF4EF] text-[#C85A20] border border-[#F6D7C3] px-2.5 py-0.5 rounded-full font-semibold">
          Softmax Distribution
        </span>
      </div>

      <div className="space-y-2.5 pt-1">
        {STAGE_CONFIG.map(({ grade, label, color, barBg }) => {
          const prob = getProbability(grade);
          const percent = (prob * 100).toFixed(1);
          const isSelected = grade === predictedGrade;

          return (
            <div
              key={grade}
              className={`p-2.5 rounded-xl transition-colors ${
                isSelected
                  ? 'bg-[#FCF4EF] border border-[#F6D7C3] shadow-warm-xs'
                  : 'hover:bg-[#FAF9F7]'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span className={`flex items-center gap-2 ${isSelected ? 'font-bold text-[#17191D]' : 'text-[#5F6368]'}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${barBg}`} />
                  {label}
                  {isSelected && (
                    <span className="text-[10px] bg-[#E8752F] text-white font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ml-1">
                      Predicted
                    </span>
                  )}
                </span>
                <span className={`font-bold ${isSelected ? color : 'text-[#8A8F98]'}`}>
                  {percent}%
                </span>
              </div>

              <div className="h-2 w-full bg-[#EFECE6] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: grade * 0.08 }}
                  className={`h-full rounded-full ${barBg} ${isSelected ? 'shadow-warm-xs' : 'opacity-85'}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
