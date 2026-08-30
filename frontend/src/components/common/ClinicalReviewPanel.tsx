import React, { useState } from 'react';
import {
  UserCheck,
  Edit3,
  CheckCircle2,
  FileText,
  Shield,
  Stethoscope,
  ChevronDown,
} from 'lucide-react';
import { ICDRGrade, ClinicalReview, AnalysisSuccessResponse } from '../../types';
import { GRADE_DETAILS } from './StatusBadge';

interface ClinicalReviewPanelProps {
  prediction: AnalysisSuccessResponse;
  currentReview?: ClinicalReview;
  onSaveReview: (review: ClinicalReview) => void;
  onGenerateReport: () => void;
  isGeneratingReport?: boolean;
}

export const ClinicalReviewPanel: React.FC<ClinicalReviewPanelProps> = ({
  prediction,
  currentReview,
  onSaveReview,
  onGenerateReport,
  isGeneratingReport = false,
}) => {
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
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            <Stethoscope size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Human-in-the-Loop Clinical Verification
            </h3>
            <p className="text-xs text-slate-500">
              Clinician sign-off, staging confirmation, or diagnosis override
            </p>
          </div>
        </div>

        {/* Current status pill */}
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full border ${
            isVerified
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : isOverridden
              ? 'bg-purple-50 text-purple-800 border-purple-200'
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
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
            Model Suggested Stage
          </span>
          <div className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-2">
            <span>{prediction.severity_label}</span>
            <span className="text-xs text-slate-500 font-medium">
              ({(prediction.confidence * 100).toFixed(1)}% Confidence)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all ${
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
                ? 'bg-purple-50 border-purple-300 text-purple-800'
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
        <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl space-y-4">
          <div className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
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
                    ? 'bg-purple-700 text-white border-purple-700 shadow-2xs font-bold'
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clinical Rationale / Notes:
            </label>
            <textarea
              rows={2}
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="e.g. Detected subtle microaneurysms in macular region not flagged with high confidence."
              className="w-full text-xs p-3 rounded-xl border border-purple-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleOverrideSubmit}
              className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-2xs transition-all"
            >
              Submit Clinical Override
            </button>
          </div>
        </div>
      )}

      {/* Clinician Signature & Report Generation Action */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Shield size={14} className="text-blue-600" />
          <span>
            Signing as: <strong className="text-slate-900">{doctorName}</strong>
          </span>
        </div>

        <button
          onClick={onGenerateReport}
          disabled={isGeneratingReport}
          className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all"
        >
          <FileText size={15} />
          {isGeneratingReport ? 'Generating Report...' : 'Generate Clinical Diagnostic Report'}
        </button>
      </div>

      {/* Mandatory Regulatory Medical Disclaimer */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 leading-relaxed">
        <strong>Clinical Notice:</strong> NetraScan is an AI-assisted screening and decision support system. Results must be verified by a licensed healthcare professional and do not constitute an autonomous medical diagnosis.
      </div>
    </div>
  );
};
