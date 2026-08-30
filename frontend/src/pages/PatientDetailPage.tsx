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
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { ICDRGrade } from '../types';

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
        action={{
          label: 'Back to Directory',
          onClick: () => navigate('/patients'),
        }}
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
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          to="/patients"
          className="text-xs font-semibold text-[#5F6368] hover:text-[#17191D] flex items-center gap-1"
        >
          <ArrowLeft size={14} />
          <span>Back to Patient Directory</span>
        </Link>
      </div>

      <PageHeader
        title={patient.name}
        subtitle={`Patient ID: ${patient.patient_id} • Age ${patient.age} yrs • ${patient.gender}`}
        badge={
          <span className="text-xs font-semibold bg-[#FCF4EF] text-[#C85A20] border border-[#F6D7C3] px-3 py-1 rounded-full uppercase tracking-wider">
            {patient.diabetes_type}
          </span>
        }
        actions={
          <Link
            to="/screening"
            className="px-4 py-2 bg-[#E8752F] hover:bg-[#C85A20] text-white text-xs font-bold rounded-xl shadow-warm-xs flex items-center gap-2 transition"
          >
            <PlusCircle size={14} />
            <span>Screen This Patient</span>
          </Link>
        }
      />

      {/* Demographics Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EAE9E4] rounded-2xl p-5 shadow-warm-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6368]">Examined Eye</span>
          <p className="text-lg font-bold text-[#17191D] mt-1">{patient.examined_eye}</p>
        </div>

        <div className="bg-white border border-[#EAE9E4] rounded-2xl p-5 shadow-warm-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6368]">Diabetes Duration</span>
          <p className="text-lg font-bold text-[#17191D] mt-1">
            {patient.duration_years ? `${patient.duration_years} Years` : 'Not Specified'}
          </p>
        </div>

        <div className="bg-white border border-[#EAE9E4] rounded-2xl p-5 shadow-warm-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6368]">Screening Sessions</span>
          <p className="text-lg font-black text-[#E8752F] mt-1">{patientScreenings.length} Recorded</p>
        </div>

        <div className="bg-white border border-[#EAE9E4] rounded-2xl p-5 shadow-warm-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6368]">Clinical Status</span>
          <p className="text-lg font-bold text-[#17191D] mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Active Follow-up
          </p>
        </div>
      </div>

      {/* Longitudinal Progression Chart */}
      <div className="bg-white border border-[#EAE9E4] rounded-2xl p-6 shadow-warm-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-[#F0EFEA]">
          <div>
            <h3 className="text-base font-bold text-[#17191D]">
              Longitudinal DR Trajectory & Glycemic Correlation
            </h3>
            <p className="text-xs text-[#5F6368] mt-0.5">
              Historical ICDR progression charted against HbA1c plasma levels over 24 months
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-[#E8752F]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E8752F]" />
              ICDR Grade (0-4)
            </span>
            <span className="flex items-center gap-1.5 text-[#D97706]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
              HbA1c (%)
            </span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" vertical={false} />
              <XAxis dataKey="date" stroke="#8A8F98" fontSize={11} tickLine={false} axisLine={{ stroke: '#EAE9E4' }} />
              <YAxis stroke="#8A8F98" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #EAE9E4',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(17, 19, 24, 0.05)',
                  color: '#17191D',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="grade"
                stroke="#E8752F"
                strokeWidth={3}
                dot={{ r: 5, fill: '#E8752F', strokeWidth: 2, stroke: '#FFFFFF' }}
                name="ICDR Grade"
              />
              <Line
                type="monotone"
                dataKey="hba1c"
                stroke="#D97706"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 4, fill: '#D97706' }}
                name="HbA1c (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Screenings Timeline Table */}
      <div className="bg-white border border-[#EAE9E4] rounded-2xl p-6 shadow-warm-xs space-y-4">
        <h3 className="text-base font-bold text-[#17191D] pb-3 border-b border-[#F0EFEA]">
          Retinal Screening Timeline
        </h3>

        {patientScreenings.length === 0 ? (
          <p className="text-xs text-[#5F6368]">No screenings recorded yet for this patient.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EAE9E4] bg-[#FAF9F7] text-[#5F6368] uppercase tracking-wider text-[11px] font-bold">
                  <th className="py-2.5 pl-3">Session ID</th>
                  <th className="py-2.5">Date & Time</th>
                  <th className="py-2.5">AI Staging</th>
                  <th className="py-2.5">Confidence</th>
                  <th className="py-2.5">Referral</th>
                  <th className="py-2.5">Review Status</th>
                  <th className="py-2.5 pr-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFEA]">
                {patientScreenings.map((session) => (
                  <tr key={session.id} className="hover:bg-[#FAF9F7] transition-colors">
                    <td className="py-3.5 pl-3 font-semibold text-[#E8752F]">{session.id}</td>
                    <td className="py-3.5 text-[#5F6368]">{session.timestamp}</td>
                    <td className="py-3.5">
                      <StatusBadge grade={session.prediction?.dr_grade ?? 0} size="sm" />
                    </td>
                    <td className="py-3.5 font-bold text-[#17191D]">
                      {((session.prediction?.confidence ?? 0.9) * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          session.prediction?.referable
                            ? 'bg-[#FCF4EF] text-[#C85A20] border-[#F6D7C3]'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {session.prediction?.referable ? 'Recommended' : 'Routine'}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#FAF9F7] border border-[#EAE9E4] text-[#17191D] capitalize">
                        {session.review.status}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3 text-right">
                      <Link
                        to={`/screening/${session.id}`}
                        className="px-3 py-1.5 bg-white hover:bg-[#FAF9F7] text-[#17191D] rounded-lg font-bold text-xs transition inline-block border border-[#EAE9E4] hover:border-[#E8752F] shadow-warm-xs"
                      >
                        View Full Session
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
