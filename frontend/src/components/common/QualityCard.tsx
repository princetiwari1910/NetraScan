import React from 'react';
import { QualityMetric } from '../../types';
import { CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

interface QualityCardProps {
  quality: QualityMetric;
}

export const QualityCard: React.FC<QualityCardProps> = ({ quality }) => {
  const isPass = !quality.is_blurry && quality.status !== 'Corrupted' && quality.status !== 'Error';

  return (
    <div className={`rounded-2xl border p-6 transition-all bg-white shadow-warm-xs ${
      isPass
        ? 'border-emerald-200'
        : 'border-[#F6D7C3]'
    }`}>
      <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA]">
        <div className="flex items-center gap-2">
          {isPass ? (
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={16} />
            </div>
          ) : (
            <div className="p-1.5 rounded-lg bg-[#FCF4EF] text-[#C85A20] border border-[#F6D7C3]">
              <AlertTriangle size={16} />
            </div>
          )}
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#17191D]">
            Image Quality Gatekeeper
          </h4>
        </div>

        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
          isPass
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-[#FCF4EF] text-[#C85A20] border-[#F6D7C3]'
        }`}>
          {quality.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-[#FAF9F7] p-3 rounded-xl border border-[#EAE9E4]">
          <span className="text-[11px] uppercase tracking-wider text-[#5F6368] font-semibold">
            Laplacian Variance
          </span>
          <p className="text-lg font-black text-[#E8752F] mt-0.5">
            {quality.laplacian_variance.toFixed(1)}
          </p>
        </div>

        <div className="bg-[#FAF9F7] p-3 rounded-xl border border-[#EAE9E4]">
          <span className="text-[11px] uppercase tracking-wider text-[#5F6368] font-semibold">
            Clarity Threshold
          </span>
          <p className="text-lg font-bold text-[#17191D] mt-0.5">
            {quality.threshold.toFixed(1)}
          </p>
        </div>

        <div className="bg-[#FAF9F7] p-3 rounded-xl border border-[#EAE9E4] col-span-2 sm:col-span-1">
          <span className="text-[11px] uppercase tracking-wider text-[#5F6368] font-semibold">
            Focus Assessment
          </span>
          <p className={`text-xs font-bold mt-1.5 flex items-center gap-1.5 ${
            quality.is_blurry ? 'text-[#C85A20]' : 'text-emerald-700'
          }`}>
            {quality.is_blurry ? 'Potential Blur' : 'Optimal Focus'}
          </p>
        </div>
      </div>

      <div className="mt-3 text-xs text-[#5F6368] leading-relaxed flex items-start gap-2 pt-2">
        <Sparkles size={14} className="shrink-0 text-[#E8752F] mt-0.5" />
        <span>
          {isPass
            ? 'OpenCV Laplacian filter confirms optical focus is adequate for reliable microvascular lesion grading.'
            : 'Image focus score is below clinical diagnostic threshold. Please consider recapturing for optimal staging confidence.'}
        </span>
      </div>
    </div>
  );
};
