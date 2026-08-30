import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  User,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/common/PageHeader';
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
        action={{
          label: 'Back to Dashboard',
          onClick: () => navigate('/dashboard'),
        }}
      />
    );
  }

  const { patient, prediction, quality, review } = session;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          to="/dashboard"
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1"
        >
          <ArrowLeft size={14} />
          <span>Back to Screenings</span>
        </Link>
      </div>

      <PageHeader
        title={`Screening Session: ${session.id}`}
        subtitle={`Examined on ${session.timestamp} for ${patient.name} (${patient.patient_id})`}
        badge={<StatusBadge grade={prediction.dr_grade} size="md" />}
      />

      {/* Patient & Scan Metadata Summary */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-500 font-medium">Patient Name</span>
          <p className="font-bold text-sm text-slate-900 mt-0.5">{patient.name}</p>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Examined Eye</span>
          <p className="font-bold text-sm text-slate-900 mt-0.5">{patient.examined_eye}</p>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Diabetes History</span>
          <p className="font-semibold text-slate-800 mt-0.5">
            {patient.diabetes_type} ({patient.duration_years || 'N/A'} yrs)
          </p>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Doctor Review Status</span>
          <p className="font-semibold text-blue-700 mt-0.5 capitalize">
            {review.status} ({review.doctor_name})
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
