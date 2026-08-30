import React from 'react';
import {
  Printer,
  Download,
  Share2,
  X,
  Shield,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { ClinicalReport } from '../../types';
import { GRADE_DETAILS } from './StatusBadge';
import { NetraScanLogo } from './NetraScanLogo';

interface ReportPreviewProps {
  report: ClinicalReport;
  onClose?: () => void;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  report,
  onClose,
}) => {
  const { patient, screening, analysis_result, report_id, generated_at } = report;
  const gradeInfo = GRADE_DETAILS[analysis_result.dr_grade] || GRADE_DETAILS[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white border border-[#EAE9E4] rounded-2xl shadow-warm-md overflow-hidden max-w-4xl mx-auto my-4 text-[#17191D]">
      {/* Top Action Bar (hidden in print) */}
      <div className="p-4 bg-[#FAF9F7] border-b border-[#EAE9E4] flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold bg-[#FCF4EF] text-[#C85A20] border border-[#F6D7C3] px-2.5 py-1 rounded-lg">
            {report_id}
          </span>
          <span className="text-xs text-[#5F6368]">
            Generated: {new Date(generated_at).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#E8752F] hover:bg-[#C85A20] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-warm-xs transition"
          >
            <Printer size={14} />
            Print / Save as PDF
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-[#8A8F98] hover:text-[#17191D] rounded-lg hover:bg-[#EFECE6]"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Printable Clinical Report Body */}
      <div className="p-8 sm:p-10 space-y-8 print:p-0">
        {/* Clinic & System Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#17191D] pb-6">
          <div>
            <NetraScanLogo size="md" showText={true} showTagline={false} variant="light" />
            <p className="text-xs text-[#5F6368] font-medium mt-1">
              Tele-Ophthalmology & Automated Diabetic Retinopathy Triage System
            </p>
          </div>
          <div className="text-left sm:text-right text-xs text-[#5F6368] space-y-0.5">
            <div><strong>Report ID:</strong> {report_id}</div>
            <div><strong>Neural Model:</strong> MATLAB ResNet-18 (ICDR 5-Class, res5b_relu)</div>
            <div><strong>Date of Evaluation:</strong> {new Date(generated_at).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Patient Demographics Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#FAF9F7] p-5 rounded-xl border border-[#EAE9E4] text-xs">
          <div>
            <span className="text-[#8A8F98] block">Patient Name</span>
            <span className="font-bold text-[#17191D] text-sm">{patient.name}</span>
          </div>
          <div>
            <span className="text-[#8A8F98] block">Patient ID</span>
            <span className="font-bold text-[#17191D]">{patient.patient_id}</span>
          </div>
          <div>
            <span className="text-[#8A8F98] block">Age / Gender</span>
            <span className="font-bold text-[#17191D]">{patient.age} Yrs / {patient.gender}</span>
          </div>
          <div>
            <span className="text-[#8A8F98] block">Examined Eye</span>
            <span className="font-bold text-[#17191D]">{patient.examined_eye}</span>
          </div>
          <div>
            <span className="text-[#8A8F98] block">Diabetes Classification</span>
            <span className="font-bold text-[#17191D]">{patient.diabetes_type || 'Type 2'}</span>
          </div>
          <div>
            <span className="text-[#8A8F98] block">Known Duration</span>
            <span className="font-bold text-[#17191D]">{patient.duration_years || 10} Years</span>
          </div>
          <div className="col-span-2">
            <span className="text-[#8A8F98] block">Clinical History & Indications</span>
            <span className="font-medium text-[#17191D]">{patient.clinician_notes || 'Routine annual retinal screening.'}</span>
          </div>
        </div>

        {/* Diagnostic Assessment Banner */}
        <div className="p-6 rounded-2xl border border-[#F6D7C3] bg-[#FCF4EF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8F98]">
              Automated ICDR Staging Classification
            </span>
            <h3 className="text-2xl font-black text-[#17191D] mt-0.5">
              {analysis_result.severity_label}
            </h3>
            <p className="text-xs text-[#5F6368] mt-1">
              International Clinical Diabetic Retinopathy (ICDR) Scale: <strong>Grade {analysis_result.dr_grade}</strong>
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <div className="text-xs text-[#8A8F98]">Softmax Model Confidence</div>
            <div className="text-2xl font-black text-[#E8752F]">
              {(analysis_result.confidence * 100).toFixed(1)}%
            </div>
            <div className="text-xs font-bold text-[#C85A20]">
              {analysis_result.referable ? 'Referral Recommended (Actionable Grade 2+)' : 'Routine Screening Interval'}
            </div>
          </div>
        </div>

        {/* Retinal & Grad-CAM Image Pair with Dark Optical Backdrop */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#5F6368] mb-3">
            Ophthalmic Imaging & Deep Feature Attribution
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-[#22252B] bg-[#05070B] rounded-xl p-3 text-center space-y-2">
              <span className="text-[11px] font-bold text-[#8A8F98] uppercase tracking-wider font-mono">
                A. Fundus Photography (Standardized)
              </span>
              <div className="aspect-square rounded-lg overflow-hidden border border-[#32363F] bg-[#05070B]">
                <img
                  src={screening?.image_url || analysis_result.gradcam_image}
                  alt="Raw Fundus"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="border border-[#22252B] bg-[#05070B] rounded-xl p-3 text-center space-y-2">
              <span className="text-[11px] font-bold text-[#F4A261] uppercase tracking-wider font-mono">
                B. Grad-CAM Biomarker Activation Map
              </span>
              <div className="aspect-square rounded-lg overflow-hidden border border-[#32363F] bg-[#05070B]">
                <img
                  src={analysis_result.gradcam_image}
                  alt="Grad-CAM Heatmap"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pathological Findings */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#5F6368]">
            Automated Visual Findings & Biomarker Evidence
          </h4>
          <ul className="space-y-2 text-xs">
            {analysis_result.evidence.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FAF9F7] border border-[#EAE9E4]">
                <CheckCircle2 size={15} className="text-[#E8752F] shrink-0 mt-0.5" />
                <span className="text-[#17191D] font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Physician Sign-Off & Verification Block */}
        <div className="border-t-2 border-[#17191D] pt-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="space-y-2 text-xs text-[#5F6368]">
            <p className="font-bold text-[#17191D]">Diagnostic Decision Support Notice</p>
            <p className="leading-relaxed">
              This automated report is generated by NetraScan deep learning software to assist eye-care clinicians in population-scale triage. Final treatment decisions and referrals require clinical slit-lamp or indirect ophthalmoscopic confirmation.
            </p>
          </div>

          <div className="space-y-4 text-xs text-right">
            <div>
              <p className="text-[#8A8F98]">Attending Ophthalmologist:</p>
              <p className="font-bold text-[#17191D] text-sm">Dr. Arvind Sen, MD (Ophthal.)</p>
              <p className="text-[#5F6368]">Medical Reg. No: MED-882109</p>
            </div>
            <div className="pt-4">
              <div className="border-b border-[#17191D] w-48 ml-auto mb-1" />
              <p className="text-[10px] text-[#8A8F98] uppercase tracking-wider">Physician Signature & Stamp</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
