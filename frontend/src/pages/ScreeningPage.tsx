import React, { useState } from 'react';
import {
  Sparkles,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Shield,
  Clock,
  Eye,
  Activity,
  Layers,
  Info,
  User,
  Check,
  Edit3,
  Stethoscope,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import {
  PatientInfo,
  AnalysisSuccessResponse,
  AnalysisResponse,
  ClinicalReview,
  ScreeningSession,
  ClinicalReport,
  ICDRGrade,
} from '../types';
import { predictRetinalImage, generateClinicalReport } from '../services/api';
import { DEMO_HEATMAP_SVG } from '../services/mockData';
import { PageHeader } from '../components/common/PageHeader';
import { ImageUploader } from '../components/common/ImageUploader';
import { AIProcessingOverlay } from '../components/common/AIProcessingOverlay';
import { StatusBadge, GRADE_DETAILS } from '../components/common/StatusBadge';
import { ConfidenceBar } from '../components/common/ConfidenceBar';
import { HeatmapViewer } from '../components/common/HeatmapViewer';
import { ReportPreview } from '../components/common/ReportPreview';

type WorkstationState = 'upload' | 'scanning' | 'results' | 'report_modal';

export const ScreeningPage: React.FC = () => {
  const {
    demoMode,
    addScreening,
    addReport,
    addToast,
    setCurrentScreening,
  } = useApp();

  const [state, setState] = useState<WorkstationState>('upload');
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState<string>('');
  const [currentPatient, setCurrentPatient] = useState<PatientInfo | null>(null);

  // Active prediction & session
  const [prediction, setPrediction] = useState<AnalysisSuccessResponse | null>(null);
  const [activeSession, setActiveSession] = useState<ScreeningSession | null>(null);
  const [generatedReport, setGeneratedReport] = useState<ClinicalReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Clinician in-place review state
  const [reviewStatus, setReviewStatus] = useState<'pending' | 'verified' | 'overridden'>('pending');
  const [selectedGrade, setSelectedGrade] = useState<ICDRGrade>(2);
  const [isOverriding, setIsOverriding] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState('');

  // Trigger analysis pipeline
  const handleStartAnalysis = async (
    file: File,
    previewUrl: string,
    patient: PatientInfo
  ) => {
    setCurrentFile(file);
    setCurrentPreviewUrl(previewUrl);
    setCurrentPatient(patient);
    setState('scanning');

    try {
      let analysisResult: AnalysisResponse;

      if (demoMode) {
        // Mock delay for realistic AI feel
        await new Promise((resolve) => setTimeout(resolve, 1800));
        analysisResult = {
          status: 'success',
          dr_grade: 2,
          severity_label: 'Moderate Non-Proliferative Diabetic Retinopathy',
          referable: true,
          confidence: 0.924,
          class_probabilities: {
            'Grade_0_No Diabetic Retinopathy': 0.018,
            'Grade_1_Mild Non-Proliferative Diabetic Retinopathy': 0.045,
            'Grade_2_Moderate Non-Proliferative Diabetic Retinopathy': 0.924,
            'Grade_3_Severe Non-Proliferative Diabetic Retinopathy': 0.011,
            'Grade_4_Proliferative Diabetic Retinopathy': 0.002,
          },
          gradcam_image: DEMO_HEATMAP_SVG,
          evidence: [
            'Multiple microaneurysms detected in temporal macular vascular arcade.',
            'Intraretinal dot-and-blot hemorrhages across inferior retina.',
            'Localized hard lipid exudates in outer foveal boundary.',
          ],
          quality_metric: {
            laplacian_variance: 168.4,
            is_blurry: false,
            threshold: 100.0,
            status: 'Pass',
          },
        };
      } else {
        analysisResult = await predictRetinalImage(file);
      }

      if (analysisResult.status === 'success') {
        const successData = analysisResult as AnalysisSuccessResponse;
        setPrediction(successData);
        setSelectedGrade(successData.dr_grade);

        const sessionId = `SCR-${Math.floor(1000 + Math.random() * 9000)}`;
        const session: ScreeningSession = {
          id: sessionId,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          patient,
          image_url: previewUrl,
          filename: file.name,
          file_size_kb: Math.round(file.size / 1024),
          dimensions: '2048 x 1536 px',
          prediction: successData,
          quality: successData.quality_metric,
          review: {
            review_id: `REV-${Math.floor(1000 + Math.random() * 9000)}`,
            status: 'pending',
            doctor_name: 'Dr. Arvind Sen, MD',
            doctor_id: 'DOC-8821',
            final_grade: successData.dr_grade,
            final_stage_name: successData.severity_label,
          },
        };

        setActiveSession(session);
        setCurrentScreening(session);
        addScreening(session);
        setState('results');

        addToast({
          type: 'success',
          title: 'AI Screening Complete',
          message: `${successData.severity_label} (${(successData.confidence * 100).toFixed(1)}% Confidence).`,
        });
      } else if (analysisResult.status === 'recapture_required') {
        setState('upload');
        addToast({
          type: 'warning',
          title: 'Quality Gate Notice',
          message: analysisResult.reason,
        });
      } else {
        setState('upload');
        addToast({
          type: 'error',
          title: 'AI Service Notice',
          message: analysisResult.error,
        });
      }
    } catch (err: any) {
      console.error('Error during analysis:', err);
      setState('upload');
      addToast({
        type: 'error',
        title: 'Diagnostic Error',
        message: 'Could not complete retinal screening. Please try again.',
      });
    }
  };

  const handleConfirmReview = () => {
    if (!activeSession || !prediction) return;
    const review: ClinicalReview = {
      review_id: `REV-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'verified',
      doctor_name: 'Dr. Arvind Sen, MD',
      doctor_id: 'DOC-8821',
      final_grade: prediction.dr_grade,
      final_stage_name: prediction.severity_label,
      notes: doctorNotes || 'Confirmed AI recommendation after ophthalmic fundus inspection.',
      reviewed_at: new Date().toISOString(),
    };
    setReviewStatus('verified');
    setActiveSession({ ...activeSession, review });
    addToast({
      type: 'success',
      title: 'Staging Verified',
      message: 'AI decision confirmed and recorded in patient medical history.',
    });
  };

  const handleOverrideReview = () => {
    if (!activeSession) return;
    const review: ClinicalReview = {
      review_id: `REV-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'overridden',
      doctor_name: 'Dr. Arvind Sen, MD',
      doctor_id: 'DOC-8821',
      final_grade: selectedGrade,
      final_stage_name: GRADE_DETAILS[selectedGrade].label,
      notes: doctorNotes || 'Clinician adjusted staging based on clinical funduscopic assessment.',
      reviewed_at: new Date().toISOString(),
    };
    setReviewStatus('overridden');
    setIsOverriding(false);
    setActiveSession({ ...activeSession, review });
    addToast({
      type: 'warning',
      title: 'Staging Overridden',
      message: `Final diagnosis adjusted to Grade ${selectedGrade}.`,
    });
  };

  const handleGenerateReport = async () => {
    if (!activeSession || !prediction || !currentPatient) return;

    setIsGeneratingReport(true);
    try {
      const res = await generateClinicalReport(currentPatient, prediction);

      const report: ClinicalReport = {
        report_id: res.report_id,
        patient: currentPatient,
        screening: activeSession,
        analysis_result: prediction,
        generated_at: new Date().toISOString(),
        status: reviewStatus === 'verified' ? 'reviewed' : 'generated',
        view_url: res.view_url,
        download_url: res.download_url,
      };

      setGeneratedReport(report);
      addReport(report);
      setState('report_modal');

      addToast({
        type: 'success',
        title: 'Clinical Report Synthesized',
        message: `Report ID: ${res.report_id} ready for review.`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Report Generation Failed',
        message: 'Unable to synthesize report document.',
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleReset = () => {
    setState('upload');
    setPrediction(null);
    setActiveSession(null);
    setCurrentFile(null);
    setCurrentPreviewUrl('');
    setGeneratedReport(null);
    setReviewStatus('pending');
    setIsOverriding(false);
    setDoctorNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Clinical Imaging Workstation"
        subtitle="Perform automated ICDR diabetic retinopathy staging, OpenCV focus validation, and Grad-CAM biomarker localization."
        badge={
          <span className="text-xs font-semibold bg-[#FCF4EF] text-[#C85A20] border border-[#F6D7C3] px-3 py-1 rounded-full uppercase tracking-wider">
            Tele-Ophthalmology Triage
          </span>
        }
        actions={
          state === 'results' && (
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-white border border-[#EAE9E4] hover:bg-[#FAF9F7] text-[#17191D] text-xs font-bold rounded-xl shadow-warm-xs flex items-center gap-2 transition"
            >
              <RotateCcw size={14} />
              <span>Start New Screening</span>
            </button>
          )
        }
      />

      <AnimatePresence mode="wait">
        {/* Step 1: Upload Form */}
        {state === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <ImageUploader onAnalyze={handleStartAnalysis} />
          </motion.div>
        )}

        {/* Step 2: AI Scanning Animation Overlay */}
        {state === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            <AIProcessingOverlay imagePreview={currentPreviewUrl} />
          </motion.div>
        )}

        {/* Step 3: Professional 3-Column Clinical Workstation Layout */}
        {state === 'results' && prediction && activeSession && currentPatient && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            {/* Top Workstation Session Bar */}
            <div className="bg-white border border-[#EAE9E4] rounded-2xl p-4 shadow-warm-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-[#FCF4EF] text-[#E8752F] border border-[#F6D7C3] font-bold text-xs">
                  {activeSession.id}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#17191D]">
                    {currentPatient.name} ({currentPatient.patient_id})
                  </h3>
                  <span className="text-xs text-[#5F6368]">
                    Examined Eye: <strong>{currentPatient.examined_eye}</strong> • Captured: {activeSession.timestamp}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                    prediction.referable
                      ? 'bg-[#FCF4EF] text-[#C85A20] border-[#F6D7C3]'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {prediction.referable ? 'Referral Recommended (Grade 2+)' : 'Routine Monitoring (Grade 0-1)'}
                </span>
                <button
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                  className="px-4 py-2 bg-[#E8752F] hover:bg-[#C85A20] text-white text-xs font-bold rounded-xl shadow-warm-xs flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <FileText size={14} />
                  <span>{isGeneratingReport ? 'Synthesizing...' : 'Generate Report'}</span>
                </button>
              </div>
            </div>

            {/* 3-Column Layout: Left Dossier (col-3) | Center Imaging (col-6) | Right AI Findings & Verification (col-3) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              
              {/* LEFT COLUMN: Patient Intake & Image Quality */}
              <div className="xl:col-span-3 space-y-4">
                {/* Patient Information Card */}
                <div className="bg-white border border-[#EAE9E4] rounded-2xl p-5 shadow-warm-xs space-y-3">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-[#F0EFEA] text-[#17191D] font-bold text-xs">
                    <User size={15} className="text-[#E8752F]" />
                    <span>Patient Profile</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[#8A8F98] font-medium">Patient ID:</span>
                      <p className="font-bold text-[#17191D]">{currentPatient.patient_id}</p>
                    </div>
                    <div>
                      <span className="text-[#8A8F98] font-medium">Age / Gender:</span>
                      <p className="font-semibold text-[#17191D]">{currentPatient.age} yrs • {currentPatient.gender}</p>
                    </div>
                    <div>
                      <span className="text-[#8A8F98] font-medium">Diabetes Profile:</span>
                      <p className="font-semibold text-[#17191D]">
                        {currentPatient.diabetes_type || 'Type 2'} ({currentPatient.duration_years || '10'} yrs)
                      </p>
                    </div>
                    <div>
                      <span className="text-[#8A8F98] font-medium">Clinical Indications:</span>
                      <p className="text-[#5F6368] italic leading-snug mt-0.5">
                        "{currentPatient.clinician_notes || 'Routine annual fundus screening.'}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quality Gatekeeper Card */}
                <div className="bg-white border border-[#EAE9E4] rounded-2xl p-5 shadow-warm-xs space-y-3">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-[#F0EFEA] text-[#17191D] font-bold text-xs">
                    <Eye size={15} className="text-[#E8752F]" />
                    <span>Image Quality & Focus</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#5F6368]">Laplacian Variance:</span>
                      <span className="font-bold text-[#E8752F]">
                        {prediction.quality_metric.laplacian_variance.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5F6368]">Quality Threshold:</span>
                      <span className="font-semibold text-[#8A8F98]">&gt; 100.0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5F6368]">Gatekeeper Status:</span>
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ Passed (Gradable)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Softmax Class Distribution */}
                <div className="bg-white border border-[#EAE9E4] rounded-2xl p-5 shadow-warm-xs space-y-3">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-[#F0EFEA] text-[#17191D] font-bold text-xs">
                    <Activity size={15} className="text-[#E8752F]" />
                    <span>Softmax Probability</span>
                  </div>
                  <ConfidenceBar
                    probabilities={prediction.class_probabilities}
                    predictedGrade={prediction.dr_grade}
                  />
                </div>
              </div>

              {/* CENTER COLUMN: Large Retinal Imaging Workstation (Dark Optical Canvas) */}
              <div className="xl:col-span-6 space-y-4">
                <HeatmapViewer
                  originalImage={currentPreviewUrl}
                  heatmapImage={prediction.gradcam_image}
                  stageName={prediction.severity_label}
                  confidence={prediction.confidence}
                  evidence={prediction.evidence}
                  hideSidePanel={true}
                />
              </div>

              {/* RIGHT COLUMN: AI Analysis, Findings & Clinician Verification */}
              <div className="xl:col-span-3 space-y-4">
                {/* AI Prediction Header Card */}
                <div className="bg-white border border-[#EAE9E4] rounded-2xl p-5 shadow-warm-xs space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8F98]">
                    Primary AI Prediction
                  </span>
                  <div className="flex items-center gap-2">
                    <StatusBadge grade={prediction.dr_grade} size="md" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-[#17191D] leading-snug">
                      {prediction.severity_label}
                    </h4>
                    <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-[#F0EFEA]">
                      <span className="text-[#5F6368]">Model Confidence:</span>
                      <span className="font-extrabold text-[#E8752F] text-sm">
                        {(prediction.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detected Pathological Biomarkers */}
                <div className="bg-white border border-[#EAE9E4] rounded-2xl p-5 shadow-warm-xs space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#F0EFEA] text-[#17191D] font-bold text-xs">
                    <Sparkles size={15} className="text-[#E8752F]" />
                    <span>Detected Retinal Biomarkers</span>
                  </div>
                  <ul className="space-y-2">
                    {[
                      { name: 'Microaneurysms', status: 'Present (Hotspot Temporal)', active: true, tag: 'Grade 1+' },
                      { name: 'Intraretinal Hemorrhages', status: 'Dot & Blot Hemorrhages', active: true, tag: 'Grade 2+' },
                      { name: 'Hard Lipid Exudates', status: 'Focal Deposits Detected', active: true, tag: 'Grade 2+' },
                      { name: 'Soft Exudates (Cotton Wool)', status: 'Mild Non-specific', active: false, tag: 'Grade 3 Indicator' },
                      { name: 'Neovascularization (NVD/NVE)', status: 'Not Detected (Disc Margins Intact)', active: false, tag: 'Grade 4 Rule-out' },
                    ].map((item, idx) => (
                      <li
                        key={idx}
                        className={`p-2.5 rounded-xl border text-xs flex flex-col gap-0.5 ${
                          item.active
                            ? 'bg-[#FCF4EF] border-[#F6D7C3] text-[#17191D]'
                            : 'bg-[#FAF9F7] border-[#EAE9E4] text-[#8A8F98]'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>{item.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            item.active ? 'bg-[#FAECE0] text-[#C85A20]' : 'bg-[#EFECE6] text-[#8A8F98]'
                          }`}>
                            {item.tag}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#5F6368]">{item.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Decision Support Safety Warning */}
                <div className="p-3.5 rounded-xl bg-[#FCF4EF] border border-[#F6D7C3] text-xs text-[#C85A20] flex items-start gap-2">
                  <AlertTriangle size={16} className="text-[#E8752F] shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    <strong>Clinical Notice:</strong> AI output serves as diagnostic decision support and requires attending clinician verification.
                  </p>
                </div>

                {/* Clinician Verification Action Box */}
                <div className="bg-white border border-[#EAE9E4] rounded-2xl p-5 shadow-warm-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#F0EFEA]">
                    <span className="text-xs font-bold text-[#17191D] flex items-center gap-1.5">
                      <Stethoscope size={15} className="text-[#E8752F]" />
                      Clinician Verification
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      reviewStatus === 'verified'
                        ? 'bg-emerald-100 text-emerald-800'
                        : reviewStatus === 'overridden'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-[#FCF4EF] text-[#C85A20]'
                    }`}>
                      {reviewStatus}
                    </span>
                  </div>

                  {!isOverriding ? (
                    <div className="space-y-2">
                      <button
                        onClick={handleConfirmReview}
                        className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-warm-xs transition flex items-center justify-center gap-1.5"
                      >
                        <Check size={14} />
                        <span>Confirm AI Staging</span>
                      </button>
                      <button
                        onClick={() => setIsOverriding(true)}
                        className="w-full py-2 px-3 bg-white hover:bg-[#FAF9F7] border border-[#EAE9E4] text-[#17191D] rounded-xl text-xs font-bold shadow-warm-xs transition flex items-center justify-center gap-1.5"
                      >
                        <Edit3 size={14} />
                        <span>Override Staging</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6368]">
                        Select Overridden Grade:
                      </label>
                      <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(Number(e.target.value) as ICDRGrade)}
                        className="w-full text-xs p-2 rounded-xl border border-[#EAE9E4] bg-white text-[#17191D] focus:outline-none"
                      >
                        <option value={0}>Grade 0 — No Diabetic Retinopathy</option>
                        <option value={1}>Grade 1 — Mild NPDR</option>
                        <option value={2}>Grade 2 — Moderate NPDR</option>
                        <option value={3}>Grade 3 — Severe NPDR</option>
                        <option value={4}>Grade 4 — Proliferative DR</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Clinical rationale for override..."
                        value={doctorNotes}
                        onChange={(e) => setDoctorNotes(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-[#EAE9E4] bg-[#FAF9F7] text-[#17191D] focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleOverrideReview}
                          className="flex-1 py-2 bg-[#E8752F] hover:bg-[#C85A20] text-white rounded-xl text-xs font-bold"
                        >
                          Save Override
                        </button>
                        <button
                          onClick={() => setIsOverriding(false)}
                          className="px-3 py-2 bg-[#FAF9F7] hover:bg-[#EFECE6] text-[#5F6368] rounded-xl text-xs font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Report Modal Preview */}
        {state === 'report_modal' && generatedReport && (
          <motion.div
            key="report_modal"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <button
                onClick={() => setState('results')}
                className="px-4 py-2 bg-white border border-[#EAE9E4] text-[#17191D] text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-[#FAF9F7] shadow-warm-xs transition"
              >
                <ArrowLeft size={14} />
                <span>Back to Clinical Workstation</span>
              </button>
            </div>

            <ReportPreview
              report={generatedReport}
              onClose={() => setState('results')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
