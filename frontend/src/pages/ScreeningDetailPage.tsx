import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  User,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfidenceBar } from '../components/common/ConfidenceBar';
import { QualityCard } from '../components/common/QualityCard';
import { HeatmapViewer } from '../components/common/HeatmapViewer';
import { ClinicalReviewPanel } from '../components/common/ClinicalReviewPanel';
import { EmptyState } from '../components/common/EmptyState';

export const ScreeningDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { screenings, updateReview, addToast } = useApp();
  const navigate = useNavigate();

  const session = screenings.find((s) => s.id === id);

  if (!session || !session.prediction) {
    return (
      <EmptyState
        title="Screening Record Not Found"
        description={`No screening data available for session ID ${id}.`}
        actionLabel="Back to Dashboard"
        onAction={() => navigate('/dashboard')}
      />
    );
  }

  const { patient, prediction, quality, review } = session;

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex items-center gap-2">
        <Link
          to="/dashboard"
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition"
        >
          <ArrowLeft size={14} />
          <span>Back to Screenings</span>
        </Link>
      </div>

      <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Screening Session: {session.id}
            </h1>
            <StatusBadge grade={prediction.dr_grade} size="md" />
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Examined on {session.timestamp} for {patient.name} ({patient.patient_id})
          </p>
        </div>
      </div>

      {/* Patient & Scan Metadata Summary */}
      <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-5 shadow-dark-sm grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-400 text-[10px] uppercase font-bold block">Patient Name</span>
          <p className="font-bold text-sm text-white mt-0.5">{patient.name}</p>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] uppercase font-bold block">Examined Eye</span>
          <p className="font-bold text-sm text-white mt-0.5">{patient.examined_eye}</p>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] uppercase font-bold block">Diabetes History</span>
          <p className="font-semibold text-slate-300 mt-0.5">
            {patient.diabetes_type} ({patient.duration_years || 'N/A'} yrs)
          </p>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] uppercase font-bold block">Review Status</span>
          <p className="font-semibold text-[#38BDF8] mt-0.5 capitalize font-mono">
            {review?.status || 'Pending Review'}
          </p>
        </div>
      </div>

      {/* Probabilities & Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <ConfidenceBar
            probabilities={prediction.class_probabilities}
            predictedGrade={prediction.dr_grade}
          />
        </div>
        <div className="lg:col-span-5">
          <QualityCard quality={quality} />
        </div>
      </div>

      {/* Explainable AI Heatmap */}
      <HeatmapViewer
        originalImage={session.image_url}
        heatmapImage={prediction.gradcam_image}
        stageName={prediction.severity_label}
        confidence={prediction.confidence}
        evidence={prediction.evidence}
      />
    </div>
  );
};
