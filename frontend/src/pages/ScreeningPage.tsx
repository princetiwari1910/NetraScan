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
  Cpu,
  Download,
  Printer,
  X
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
import { ImageUploader } from '../components/common/ImageUploader';
import { AIProcessingOverlay } from '../components/common/AIProcessingOverlay';
import { StatusBadge, GRADE_DETAILS } from '../components/common/StatusBadge';
import { ConfidenceBar } from '../components/common/ConfidenceBar';
import { HeatmapViewer } from '../components/common/HeatmapViewer';
import { ReportPreview } from '../components/common/ReportPreview';
import { QualityCard } from '../components/common/QualityCard';
import { ClinicalReviewPanel } from '../components/common/ClinicalReviewPanel';

type WorkstationState = 'upload' | 'scanning' | 'results' | 'report_modal';

const WORKFLOW_STEPS = [
  { id: 1, title: 'Patient Info' },
  { id: 2, title: 'Image Upload' },
  { id: 3, title: 'Quality Check' },
  { id: 4, title: 'AI Analysis' },
  { id: 5, title: 'DR Staging' },
  { id: 6, title: 'Explainability' },
  { id: 7, title: 'Clinician Review' },
  { id: 8, title: 'Clinical Report' },
];

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
  const [activeReport, setActiveReport] = useState<ClinicalReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const getCurrentStepNumber = () => {
    switch (state) {
      case 'upload':
        return 1;
      case 'scanning':
        return 4;
      case 'results':
        return activeSession?.review?.status === 'verified' ? 7 : 5;
      case 'report_modal':
        return 8;
      default:
        return 1;
    }
  };

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
      let result: AnalysisResponse;

      if (demoMode) {
        // Fast simulated response for demonstration
        await new Promise((r) => setTimeout(r, 2200));
        result = {
          status: 'success',
          dr_grade: 2,
          severity_label: 'Moderate Non-Proliferative Diabetic Retinopathy',
          referable: true,
          confidence: 0.9245,
          class_probabilities: {
            'Grade_0_No Diabetic Retinopathy': 0.0112,
            'Grade_1_Mild Non-Proliferative Diabetic Retinopathy': 0.0435,
            'Grade_2_Moderate Non-Proliferative Diabetic Retinopathy': 0.9245,
            'Grade_3_Severe Non-Proliferative Diabetic Retinopathy': 0.0163,
            'Grade_4_Proliferative Diabetic Retinopathy': 0.0045,
          },
          gradcam_image: DEMO_HEATMAP_SVG,
          evidence: [
            'Multiple microaneurysms and localized blot intraretinal hemorrhages.',
            'Focal hard lipid exudates identified in macula or posterior pole.',
            'Mild cotton wool spots observed in temporal arcade.',
            'Referral indicated for comprehensive ophthalmological evaluation.',
          ],
          quality_metric: {
            laplacian_variance: 168.4,
            is_blurry: false,
            threshold: 100.0,
            status: 'Pass',
          },
        };
      } else {
        // Live FastAPI Backend Call
        result = await predictRetinalImage(file);
      }

      if (result.status === 'success') {
        setPrediction(result);

        const newSession: ScreeningSession = {
          id: `SCR-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          patient: patient,
          image_url: previewUrl,
          filename: file.name,
          file_size_kb: Math.round(file.size / 1024),
          dimensions: '224 × 224 px',
          prediction: result,
          quality: result.quality_metric,
        };

        setActiveSession(newSession);
        setCurrentScreening(newSession);
        addScreening(newSession);

        setState('results');
        addToast({
          type: 'success',
          title: 'Analysis Complete',
          message: `Staged as ${result.severity_label} (${(result.confidence * 100).toFixed(1)}% confidence).`,
        });
      } else if (result.status === 'recapture_required') {
        setState('upload');
        addToast({
          type: 'warning',
          title: 'Image Quality Warning',
          message: result.reason || 'Image focus insufficient for reliable staging. Please recapture.',
        });
      } else {
        setState('upload');
        addToast({
          type: 'error',
          title: 'Analysis Error',
          message: result.error || 'AI service encountered an issue. Try again in demo mode.',
        });
      }
    } catch (err: any) {
      console.error(err);
      setState('upload');
      addToast({
        type: 'error',
        title: 'Connection Error',
        message: 'Could not connect to FastAPI backend on port 8000. Switch to DEMO mode in topbar.',
      });
    }
  };

  const handleSaveReview = (review: ClinicalReview) => {
    if (!activeSession) return;
    const updated = { ...activeSession, review };
    setActiveSession(updated);
    setCurrentScreening(updated);

    addToast({
      type: 'success',
      title: review.status === 'verified' ? 'Clinician Verified' : 'Clinical Override Saved',
      message: `Signed off by ${review.doctor_name}. Ready for report export.`,
    });
  };

  const handleGenerateReport = async () => {
    if (!activeSession || !prediction || !currentPatient) return;
    setIsGeneratingReport(true);

    try {
      const response = await generateClinicalReport(currentPatient, prediction);

      const report: ClinicalReport = {
        report_id: response.report_id,
        patient: currentPatient,
        screening: activeSession,
        analysis_result: prediction,
        generated_at: new Date().toISOString(),
        status: activeSession.review?.status === 'verified' ? 'reviewed' : 'generated',
        view_url: response.view_url,
        download_url: response.download_url,
      };

      setActiveReport(report);
      addReport(report);
      setState('report_modal');

      addToast({
        type: 'success',
        title: 'Report Generated',
        message: `Clinical report ${response.report_id} generated and ready for print/download.`,
      });
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Report Error',
        message: 'Could not compile report. Please try again.',
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleReset = () => {
    setState('upload');
    setCurrentFile(null);
    setCurrentPreviewUrl('');
    setPrediction(null);
    setActiveSession(null);
    setActiveReport(null);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* 1. Header & Workflow Progress Indicator */}
      <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-5 shadow-dark-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Eye size={22} className="text-[#38BDF8]" />
              Retinal Screening & Clinical Workstation
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              8-Step guided diagnostic workflow from image ingestion to physician sign-off
            </p>
          </div>

          {state !== 'upload' && (
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#162338] hover:bg-[#1E2E48] text-slate-300 hover:text-white border border-[#1E2E48] flex items-center gap-1.5 transition self-start sm:self-auto font-mono"
            >
              <RotateCcw size={14} />
              <span>New Examination</span>
            </button>
          )}
        </div>

        {/* 8-Step Visual Stepper Strip */}
        <div className="pt-3 border-t border-[#1E2E48] grid grid-cols-4 sm:grid-cols-8 gap-2">
          {WORKFLOW_STEPS.map((step) => {
            const current = getCurrentStepNumber();
            const isCompleted = step.id < current;
            const isActive = step.id === current;

            return (
              <div
                key={step.id}
                className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                  isActive
                    ? 'bg-gradient-to-r from-[#2563EB]/20 to-[#0EA5E9]/20 border-[#38BDF8] text-white shadow-glow-cyan'
                    : isCompleted
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                    : 'bg-[#162338]/60 border-[#1E2E48] text-slate-500'
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] font-mono font-bold">
                  {isCompleted ? (
                    <CheckCircle2 size={12} className="text-emerald-400" />
                  ) : (
                    <span>0{step.id}</span>
                  )}
                </div>
                <span className="text-[10px] font-semibold mt-0.5 truncate w-full">
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Main Workstation Body */}
      <AnimatePresence mode="wait">
        {state === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ImageUploader onAnalyze={handleStartAnalysis} />
          </motion.div>
        )}

        {state === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
          >
            <AIProcessingOverlay imagePreview={currentPreviewUrl} />
          </motion.div>
        )}

        {state === 'results' && prediction && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Top Results Banner */}
            <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <StatusBadge grade={prediction.dr_grade} size="lg" />
                    {prediction.referable ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F97316]/20 text-[#FB923C] border border-[#F97316]/40 font-mono">
                        <AlertTriangle size={13} />
                        Referral Required (Grade 2+)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/50 text-emerald-400 border border-emerald-800/50 font-mono">
                        <CheckCircle2 size={13} />
                        Routine Annual Review
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {prediction.severity_label}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Graded in accordance with the International Clinical Diabetic Retinopathy (ICDR) Disease Severity Scale.
                  </p>
                </div>

                {/* Quick Diagnostics Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#162338] p-4 rounded-xl border border-[#1E2E48] text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">
                      Confidence
                    </span>
                    <span className="text-lg font-black font-mono text-[#38BDF8]">
                      {(prediction.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">
                      Architecture
                    </span>
                    <span className="text-xs font-bold font-mono text-white mt-1 block">
                      MATLAB ResNet-18
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">
                      Target Layer
                    </span>
                    <span className="text-xs font-bold font-mono text-[#38BDF8] mt-1 block">
                      res5b_relu
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">
                      Clarity Score
                    </span>
                    <span className="text-xs font-bold font-mono text-emerald-400 mt-1 block">
                      {prediction.quality_metric.status} ({prediction.quality_metric.laplacian_variance})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Retinal Heatmap Viewer & Evidence Breakdown */}
            <HeatmapViewer
              originalImage={currentPreviewUrl}
              heatmapImage={prediction.gradcam_image}
              stageName={prediction.severity_label}
              confidence={prediction.confidence}
              evidence={prediction.evidence}
            />

            {/* Quality & Softmax Distribution Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 space-y-4">
                <ConfidenceBar
                  probabilities={prediction.class_probabilities}
                  predictedGrade={prediction.dr_grade}
                />
              </div>
              <div className="lg:col-span-6 space-y-4">
                <QualityCard quality={prediction.quality_metric} />
              </div>
            </div>

            {/* Human-in-the-Loop Clinician Sign-off Console */}
            <ClinicalReviewPanel
              prediction={prediction}
              currentReview={activeSession?.review}
              onSaveReview={handleSaveReview}
              onGenerateReport={handleGenerateReport}
              isGeneratingReport={isGeneratingReport}
            />
          </motion.div>
        )}

        {state === 'report_modal' && activeReport && (
          <motion.div
            key="report_modal"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between bg-[#101B2D] border border-[#1E2E48] p-4 rounded-2xl">
              <button
                onClick={() => setState('results')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#162338] text-slate-300 hover:text-white border border-[#1E2E48] flex items-center gap-1.5 transition font-mono"
              >
                <ArrowLeft size={14} />
                <span>Return to Workstation</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#162338] hover:bg-[#1E2E48] text-white border border-[#1E2E48] flex items-center gap-1.5 transition font-mono"
                >
                  <Printer size={14} />
                  <span>Print Report</span>
                </button>
                <a
                  href={`http://127.0.0.1:8000/report/${activeReport.report_id}?download=true`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] hover:from-[#1D4ED8] hover:to-[#0284C7] text-white flex items-center gap-1.5 transition font-mono shadow-glow-blue"
                >
                  <Download size={14} />
                  <span>Download HTML</span>
                </a>
              </div>
            </div>

            {/* Render Clinical Report Preview */}
            <ReportPreview report={activeReport} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
