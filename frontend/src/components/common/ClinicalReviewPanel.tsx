import React, { useState } from 'react';
import {
  UserCheck,
  Edit3,
  CheckCircle2,
  FileText,
  Shield,
  Stethoscope,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';
import { ICDRGrade, ClinicalReview, AnalysisSuccessResponse } from '../../types';
import { GRADE_DETAILS } from './StatusBadge';

interface ClinicalReviewPanelProps {
  prediction: AnalysisSuccessResponse;
  currentReview?: ClinicalReview;
  onSaveReview: (review: ClinicalReview) => void;
  onGenerateReport: () => void;
  isGeneratingReport?: boolean;
  variant?: 'dark' | 'light';
}

export const ClinicalReviewPanel: React.FC<ClinicalReviewPanelProps> = ({
  prediction,
  currentReview,
  onSaveReview,
  onGenerateReport,
  isGeneratingReport = false,
  variant = 'dark',
}) => {
  const isDark = variant === 'dark';
  const [isOverriding, setIsOverriding] = useState(
    currentReview?.status === 'overridden'
  );
  const [selectedGrade, setSelectedGrade] = useState<ICDRGrade>(
    currentReview?.final_grade ?? prediction.dr_grade
  );
  const [doctorNotes, setDoctorNotes] = useState<string>(
    currentReview?.notes ?? ''
  );
  const [doctorName, setDoctorName] = useState<string>(
    currentReview?.doctor_name ?? 'Dr. Arvind Sen, MD'
  );

  const isVerified = currentReview?.status === 'verified';
  const isOverridden = currentReview?.status === 'overridden';

  const handleConfirm = () => {
    onSaveReview({
      review_id: `REV-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'verified',
      doctor_name: doctorName,
      doctor_id: 'DOC-8821',
      final_grade: prediction.dr_grade,
      final_stage_name: prediction.severity_label,
      notes: doctorNotes || 'Confirmed AI recommendation after direct retinal fundus review.',
      reviewed_at: new Date().toISOString(),
    });
  };

  const handleOverrideSubmit = () => {
    onSaveReview({
      review_id: `REV-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'overridden',
      doctor_name: doctorName,
      doctor_id: 'DOC-8821',
      final_grade: selectedGrade,
      final_stage_name: GRADE_DETAILS[selectedGrade].label,
      notes: doctorNotes,
      reviewed_at: new Date().toISOString(),
    });
  };

  return (
    <div
      className={`rounded-2xl p-6 space-y-6 transition-all ${
        isDark
          ? 'bg-[#101B2D] border border-[#1E2E48] text-white shadow-dark-sm'
          : 'bg-white border border-[#E2E8F0] text-slate-900 shadow-sm'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between pb-4 border-b ${
          isDark ? 'border-[#1E2E48]' : 'border-[#F0EFEA]'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl border ${
              isDark
                ? 'bg-[#2563EB]/15 text-[#38BDF8] border-[#2563EB]/30'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            <Stethoscope size={20} />
          </div>
          <div>
            <h3
              className={`text-base font-bold ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Human-in-the-Loop Clinical Verification
            </h3>
            <p
              className={`text-xs ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Mandatory physician sign-off, staging confirmation, or diagnostic override
            </p>
          </div>
        </div>

        {/* Current status pill */}
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full border font-mono ${
            isVerified
              ? isDark
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : isOverridden
              ? isDark
                ? 'bg-purple-950/60 text-purple-400 border-purple-800'
                : 'bg-purple-50 text-purple-800 border-purple-200'
              : isDark
              ? 'bg-amber-950/60 text-amber-400 border-amber-800'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          {isVerified
            ? '✓ Verified by Clinician'
            : isOverridden
            ? '✎ Overridden by Clinician'
            : '⏳ Pending Review'}
        </span>
      </div>

      {/* AI Recommendation Summary Box */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isDark
            ? 'bg-[#162338] border-[#1E2E48]'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div>
          <span
            className={`text-[10px] uppercase tracking-wider font-bold block ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Model Suggested Stage
          </span>
          <div
            className={`text-sm font-bold mt-0.5 flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            <span>{prediction.severity_label}</span>
            <span
              className={`text-xs font-mono font-medium ${
                isDark ? 'text-[#38BDF8]' : 'text-blue-700'
              }`}
            >
              ({(prediction.confidence * 100).toFixed(1)}% Confidence)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ${
              isVerified
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <CheckCircle2 size={14} />
            Confirm AI Finding
          </button>

          <button
            onClick={() => setIsOverriding(!isOverriding)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              isOverriding
                ? isDark
                  ? 'bg-purple-950/50 border-purple-600 text-purple-300'
                  : 'bg-purple-50 border-purple-300 text-purple-800'
                : isDark
                ? 'bg-[#101B2D] hover:bg-[#1E2E48] border-[#1E2E48] text-slate-300 hover:text-white'
                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <Edit3 size={14} />
            {isOverriding ? 'Cancel Override' : 'Override Stage'}
          </button>
        </div>
      </div>

      {/* Override form when active */}
      {isOverriding && (
        <div
          className={`p-4 rounded-xl border space-y-4 ${
            isDark
              ? 'bg-[#162338] border-purple-500/40'
              : 'bg-purple-50/60 border-purple-200'
          }`}
        >
          <div className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
            <Edit3 size={14} />
            <span>Select Clinician Staging:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {([0, 1, 2, 3, 4] as ICDRGrade[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGrade(g)}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                  selectedGrade === g
                    ? 'bg-purple-600 text-white border-purple-500 shadow-sm font-bold'
                    : isDark
                    ? 'bg-[#101B2D] border-[#1E2E48] text-slate-300 hover:border-purple-500'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300'
                }`}
              >
                <div className="font-bold">Grade {g}</div>
                <div className="text-[11px] opacity-90 line-clamp-1">
                  {GRADE_DETAILS[g].shortLabel}
                </div>
              </button>
            ))}
          </div>

          <div>
            <label
              className={`block text-xs font-semibold mb-1 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Clinical Rationale / Notes:
            </label>
            <textarea
              rows={2}
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="e.g. Detected subtle microaneurysms in macular region not flagged with high confidence."
              className={`w-full text-xs p-3 rounded-xl border ${
                isDark
                  ? 'bg-[#101B2D] border-[#1E2E48] text-white focus:border-purple-400'
                  : 'bg-white border-purple-200 text-slate-900 focus:ring-purple-500'
              } focus:outline-none`}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleOverrideSubmit}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              Submit Clinical Override
            </button>
          </div>
        </div>
      )}

      {/* Clinician Signature & Report Generation Action */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div
          className={`flex items-center gap-2 text-xs ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          <Shield size={14} className="text-[#38BDF8]" />
          <span>
            Signing as: <strong className="text-white">{doctorName}</strong>
          </span>
        </div>

        <button
          onClick={onGenerateReport}
          disabled={isGeneratingReport}
          className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] hover:from-[#1D4ED8] hover:to-[#0284C7] disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-glow-blue flex items-center justify-center gap-2 transition-all font-mono"
        >
          <FileText size={15} />
          {isGeneratingReport ? 'Generating Report...' : 'Generate Clinical Diagnostic Report'}
        </button>
      </div>

      {/* Mandatory Regulatory Medical Disclaimer */}
      <div
        className={`p-3 rounded-xl border text-xs leading-relaxed ${
          isDark
            ? 'bg-[#162338] border-[#1E2E48] text-slate-400'
            : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}
      >
        <strong>Clinical Notice:</strong> NetraScan is an AI-assisted screening and decision support system. Results must be verified by a licensed healthcare professional and do not constitute an autonomous medical diagnosis.
      </div>
    </div>
  );
};
