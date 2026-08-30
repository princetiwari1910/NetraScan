import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  FileText,
  Activity,
  PlusCircle,
  TrendingUp,
  AlertTriangle,
  Eye,
  CheckCircle2
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';

export const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { patients, screenings } = useApp();
  const navigate = useNavigate();

  const patient = patients.find((p) => p.patient_id === id);
  const patientScreenings = screenings.filter((s) => s.patient.patient_id === id);

  if (!patient) {
    return (
      <EmptyState
        title="Patient Not Found"
        description={`No registered patient profile found for ID ${id}.`}
        actionLabel="Back to Directory"
        onAction={() => navigate('/patients')}
      />
    );
  }

  // Generate longitudinal progression data
  const progressionData = [
    { date: 'Aug 2024', grade: 0, hba1c: 6.8 },
    { date: 'Feb 2025', grade: 1, hba1c: 7.4 },
    { date: 'Aug 2025', grade: 1, hba1c: 7.9 },
    { date: 'Feb 2026', grade: 2, hba1c: 8.2 },
    { date: 'Aug 2026', grade: patientScreenings[0]?.prediction?.dr_grade ?? 2, hba1c: 8.4 },
  ];

  return (
    <div className="space-y-6 text-slate-100">
      {/* 1. Top Navigation & Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1E2E48]">
        <div className="flex items-center gap-3">
          <Link
            to="/patients"
            className="p-2 rounded-xl bg-[#101B2D] border border-[#1E2E48] hover:border-[#38BDF8] text-slate-300 hover:text-white transition"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-white">{patient.name}</h1>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#101B2D] border border-[#1E2E48] text-[#38BDF8]">
                {patient.patient_id}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {patient.age} yrs • {patient.gender} • {patient.diabetes_type || 'Type 2 Diabetes'}
            </p>
          </div>
        </div>

        <Link
          to="/screening"
          className="px-4 py-2 bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] hover:from-[#1D4ED8] hover:to-[#0284C7] text-white text-xs font-bold rounded-xl shadow-glow-blue flex items-center gap-2 transition"
        >
          <PlusCircle size={15} />
          <span>New Screening</span>
        </Link>
      </div>

      {/* 2. Demographic & Medical Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-5 shadow-dark-sm space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Diabetes Clinical Profile
          </span>
          <div className="text-sm font-bold text-white">
            {patient.diabetes_type || 'Type 2 Diabetes'}
          </div>
          <p className="text-xs text-slate-400">
            Duration: <strong className="text-white font-mono">{patient.duration_years || 10} years</strong>
          </p>
        </div>

        <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-5 shadow-dark-sm space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Total Fundus Scans
          </span>
          <div className="text-sm font-bold font-mono text-[#38BDF8]">
            {patientScreenings.length} Recorded Sessions
          </div>
          <p className="text-xs text-slate-400">
            Last Exam:{' '}
            <strong className="text-white">
              {patientScreenings[0]?.timestamp.split(' ')[0] || 'Today'}
            </strong>
          </p>
        </div>

        <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-5 shadow-dark-sm space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Triage & Risk Assessment
          </span>
          <div>
            <StatusBadge grade={patientScreenings[0]?.prediction?.dr_grade ?? 2} />
          </div>
          <p className="text-xs text-[#FB923C] font-semibold flex items-center gap-1 font-mono">
            <AlertTriangle size={12} /> Actionable follow-up required
          </p>
        </div>
      </div>

      {/* 3. Longitudinal Retinopathy Progression Chart */}
      <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2E48]">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-[#38BDF8]" />
              Longitudinal Disease Staging Trajectory
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical diabetic retinopathy grading trajectory plotted alongside glycemic control (HbA1c %)
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">24-Month Clinical Window</span>
        </div>

        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2E48" vertical={false} />
              <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
              <YAxis
                domain={[0, 4]}
                ticks={[0, 1, 2, 3, 4]}
                stroke="#64748B"
                fontSize={11}
                tickFormatter={(val) => `Grade ${val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0B1424',
                  border: '1px solid #1E2E48',
                  borderRadius: '12px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="grade"
                stroke="#F97316"
                strokeWidth={3}
                dot={{ r: 5, fill: '#F97316' }}
                name="ICDR Grade"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Past Examination History List */}
      <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Clock size={18} className="text-[#38BDF8]" />
          Historical Screening Examinations
        </h3>

        <div className="space-y-3">
          {patientScreenings.map((screening) => (
            <div
              key={screening.id}
              className="p-4 rounded-xl bg-[#162338] border border-[#1E2E48] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#38BDF8] transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-black border border-[#1E2E48] shrink-0">
                  <img
                    src={screening.image_url}
                    alt="Fundus Scan"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{screening.patient.examined_eye}</span>
                    <span className="text-xs font-mono text-slate-400">{screening.id}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                    <Calendar size={12} />
                    <span>{screening.timestamp}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <StatusBadge grade={screening.prediction.dr_grade} />
                <span className="text-xs font-mono font-bold text-white">
                  {(screening.prediction.confidence * 100).toFixed(1)}%
                </span>
                <Link
                  to={`/screening/${screening.id}`}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#101B2D] border border-[#1E2E48] hover:border-[#38BDF8] text-slate-200 hover:text-white transition"
                >
                  Inspect Scan
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
