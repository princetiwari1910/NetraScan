import React from 'react';
import { QualityMetric } from '../../types';
import { CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

interface QualityCardProps {
  quality: QualityMetric;
  variant?: 'dark' | 'light';
}

export const QualityCard: React.FC<QualityCardProps> = ({ quality, variant = 'dark' }) => {
  const isPass = !quality.is_blurry && quality.status !== 'Corrupted' && quality.status !== 'Error';
  const isDark = variant === 'dark';

  return (
    <div
      className={`rounded-2xl border p-6 transition-all ${
        isDark
          ? `bg-[#101B2D] ${isPass ? 'border-emerald-500/40' : 'border-[#F97316]/50'} text-white shadow-dark-sm`
          : `bg-white ${isPass ? 'border-emerald-200' : 'border-[#F6D7C3]'} text-slate-900 shadow-sm`
      }`}
    >
      <div
        className={`flex items-center justify-between pb-3 border-b ${
          isDark ? 'border-[#1E2E48]' : 'border-[#F0EFEA]'
        }`}
      >
        <div className="flex items-center gap-2">
          {isPass ? (
            <div
              className={`p-1.5 rounded-lg ${
                isDark
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              <CheckCircle2 size={16} />
            </div>
          ) : (
            <div
              className={`p-1.5 rounded-lg ${
                isDark
                  ? 'bg-[#F97316]/15 text-[#FB923C] border border-[#F97316]/30'
                  : 'bg-[#FCF4EF] text-[#C85A20] border border-[#F6D7C3]'
              }`}
            >
              <AlertTriangle size={16} />
            </div>
          )}
          <h4
            className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-slate-200' : 'text-slate-900'
            }`}
          >
            Image Quality Gatekeeper
          </h4>
        </div>

        <span
          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border font-mono ${
            isPass
              ? isDark
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : isDark
              ? 'bg-[#F97316]/15 text-[#FB923C] border-[#F97316]/30'
              : 'bg-[#FCF4EF] text-[#C85A20] border-[#F6D7C3]'
          }`}
        >
          {quality.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div
          className={`p-3 rounded-xl border ${
            isDark ? 'bg-[#162338] border-[#1E2E48]' : 'bg-[#FAF9F7] border-[#EAE9E4]'
          }`}
        >
          <span
            className={`text-[11px] uppercase tracking-wider font-semibold block ${
              isDark ? 'text-slate-400' : 'text-[#5F6368]'
            }`}
          >
            Laplacian Variance
          </span>
          <p className="text-lg font-black font-mono text-[#38BDF8] mt-0.5">
            {quality.laplacian_variance.toFixed(1)}
          </p>
        </div>

        <div
          className={`p-3 rounded-xl border ${
            isDark ? 'bg-[#162338] border-[#1E2E48]' : 'bg-[#FAF9F7] border-[#EAE9E4]'
          }`}
        >
          <span
            className={`text-[11px] uppercase tracking-wider font-semibold block ${
              isDark ? 'text-slate-400' : 'text-[#5F6368]'
            }`}
          >
            Clarity Threshold
          </span>
          <p
            className={`text-lg font-bold font-mono mt-0.5 ${
              isDark ? 'text-white' : 'text-[#17191D]'
            }`}
          >
            {quality.threshold.toFixed(1)}
          </p>
        </div>

        <div
          className={`p-3 rounded-xl border col-span-2 sm:col-span-1 ${
            isDark ? 'bg-[#162338] border-[#1E2E48]' : 'bg-[#FAF9F7] border-[#EAE9E4]'
          }`}
        >
          <span
            className={`text-[11px] uppercase tracking-wider font-semibold block ${
              isDark ? 'text-slate-400' : 'text-[#5F6368]'
            }`}
          >
            Focus Assessment
          </span>
          <p
            className={`text-xs font-bold mt-1.5 flex items-center gap-1.5 ${
              quality.is_blurry
                ? 'text-[#FB923C]'
                : isDark
                ? 'text-emerald-400'
                : 'text-emerald-700'
            }`}
          >
            {quality.is_blurry ? 'Potential Blur' : 'Optimal Focus'}
          </p>
        </div>
      </div>

      <div
        className={`mt-3 text-xs leading-relaxed flex items-start gap-2 pt-2 ${
          isDark ? 'text-slate-300' : 'text-[#5F6368]'
        }`}
      >
        <Sparkles size={14} className="shrink-0 text-[#38BDF8] mt-0.5" />
        <span>
          {isPass
            ? 'OpenCV Laplacian filter confirms optical focus is adequate for reliable microvascular lesion grading.'
            : 'Image focus score is below clinical diagnostic threshold. Please consider recapturing for optimal staging confidence.'}
        </span>
      </div>
    </div>
  );
};
