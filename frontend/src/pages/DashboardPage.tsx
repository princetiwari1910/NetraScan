import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Eye,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Activity,
  Filter,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { MOCK_DASHBOARD_STATS, MOCK_TRIAGE_TRENDS, MOCK_SEVERITY_DISTRIBUTION } from '../services/mockData';

export const DashboardPage: React.FC = () => {
  const { screenings, patients, health } = useApp();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  const isOnline = health?.status === 'healthy';

  const totalPatients = patients.length;
  const totalScreenings = screenings.length;
  const pendingReviews = screenings.filter((s) => !s.review || s.review.status === 'pending').length;
  const referableCases = screenings.filter((s) => s.prediction?.referable).length;

  return (
    <div className="space-y-6 text-slate-100">
      {/* 1. Header with Clinician Greeting & Live Telemetry */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1E2E48]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Good morning, Doctor.
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#101B2D] border border-[#1E2E48] text-slate-300 font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              {isOnline ? 'AI Inference Operational' : 'Demo Mode Active'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Here&apos;s your retinal screening overview and clinical telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/screening"
            className="px-5 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] hover:from-[#1D4ED8] hover:to-[#0284C7] text-white text-xs font-bold rounded-xl shadow-glow-blue flex items-center gap-2 transition"
          >
            <Eye size={15} />
            <span>Launch Workstation</span>
          </Link>
        </div>
      </div>

      {/* 2. Key Telemetry Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Screenings"
          value={totalScreenings || MOCK_DASHBOARD_STATS.total_screenings}
          subtitle="Fundus scans ingested"
          icon={Eye}
          accentColor="blue"
          trend={{ value: '+14.2%', isPositive: true, label: 'vs last week' }}
        />
        <StatCard
          title="Pending Reviews"
          value={pendingReviews}
          subtitle="Awaiting sign-off"
          icon={Clock}
          accentColor="cyan"
          trend={{ value: '2 urgent', isPositive: false, label: 'High Priority' }}
        />
        <StatCard
          title="Referable Cases"
          value={referableCases}
          subtitle="Grade 2+ (Prob >= 0.35)"
          icon={AlertTriangle}
          accentColor="orange"
          trend={{ value: '38.4%', isPositive: false, label: 'Referral Rate' }}
        />
        <StatCard
          title="Average Confidence"
          value="92.4%"
          subtitle="MATLAB ResNet-18 Softmax"
          icon={Sparkles}
          accentColor="teal"
          trend={{ value: '+1.1%', isPositive: true, label: 'Accuracy Benchmark' }}
        />
      </div>

      {/* 3. Analytics Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Screening Activity Trends Area Chart */}
        <div className="lg:col-span-8 bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2E48]">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity size={18} className="text-[#38BDF8]" />
                Screening Activity & Triage Trends
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Volume of fundus screenings versus actionable referable retinopathy detections
              </p>
            </div>

            {/* Time Filter Pills */}
            <div className="flex items-center gap-1 bg-[#162338] border border-[#1E2E48] p-1 rounded-xl text-xs font-semibold">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-lg transition font-mono ${
                    timeRange === range
                      ? 'bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_TRIAGE_TRENDS}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorReferable" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2E48" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#1E2E48' }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#1E2E48' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1424',
                    border: '1px solid #1E2E48',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  }}
                  itemStyle={{ color: '#FFFFFF' }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#38BDF8"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                  name="Total Screened"
                />
                <Area
                  type="monotone"
                  dataKey="referable"
                  stroke="#F97316"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorReferable)"
                  name="Referable Cases"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#1E2E48]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" /> Total Screenings
              </span>
              <span className="flex items-center gap-1.5 font-medium text-[#FB923C]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" /> Referable Findings (Grade 2+)
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Aggregated Clinic Feed</span>
          </div>
        </div>

        {/* DR Severity Distribution Donut Chart */}
        <div className="lg:col-span-4 bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-[#1E2E48]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PieChartIcon size={18} className="text-[#38BDF8]" />
                ICDR Severity Breakdown
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Staging distribution across patient screening cohort
              </p>
            </div>

            <div className="h-52 w-full relative mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={MOCK_SEVERITY_DISTRIBUTION}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {MOCK_SEVERITY_DISTRIBUTION.map((entry: { color: string }, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#0B1424" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B1424',
                      border: '1px solid #1E2E48',
                      borderRadius: '12px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-white">
                  {totalScreenings || 1842}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Total
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[#1E2E48] text-xs">
            {MOCK_SEVERITY_DISTRIBUTION.map((item: { label: string; percentage: number; count: number; color: string }, idx: number) => (
              <div key={idx} className="flex items-center justify-between py-0.5">
                <span className="flex items-center gap-2 text-slate-300 font-medium text-[11px]">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
                <span className="font-mono font-bold text-white text-[11px]">
                  {item.percentage}% ({item.count})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Live Screening Triage Queue & Clinical Review */}
      <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2E48]">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Eye size={18} className="text-[#38BDF8]" />
              Recent Screening & Triage Queue
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live patient screening telemetry, automated predictions, and clinician audit status
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/patients"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#162338] border border-[#1E2E48] text-slate-300 hover:text-white hover:border-[#38BDF8] transition flex items-center gap-1.5"
            >
              <span>View All Patients</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1E2E48] text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3 px-3">Patient Record</th>
                <th className="py-3 px-3">Examined Eye</th>
                <th className="py-3 px-3">AI ICDR Staging</th>
                <th className="py-3 px-3">Confidence</th>
                <th className="py-3 px-3">Referral Status</th>
                <th className="py-3 px-3">Review Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2E48]/60">
              {screenings.slice(0, 5).map((screening) => {
                const isVerified = screening.review?.status === 'verified';
                const isReferable = screening.prediction?.referable ?? false;

                return (
                  <tr
                    key={screening.id}
                    className="hover:bg-[#162338]/50 transition group"
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">
                        {screening.patient.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {screening.patient.patient_id} • {screening.patient.age}y / {screening.patient.gender}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-300">
                        {screening.patient.examined_eye}
                      </span>
                      <div className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]">
                        {screening.filename}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge grade={screening.prediction?.dr_grade ?? 0} />
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      {screening.prediction ? `${(screening.prediction.confidence * 100).toFixed(1)}%` : 'N/A'}
                    </td>
                    <td className="py-3 px-3">
                      {isReferable ? (
                        <span className="inline-flex items-center gap-1 font-bold text-[11px] text-[#FB923C] bg-[#F97316]/15 border border-[#F97316]/30 px-2 py-0.5 rounded-full font-mono">
                          <AlertTriangle size={11} /> Referable
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded-full font-mono">
                          <CheckCircle2 size={11} /> Routine
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {isVerified ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                          <CheckCircle2 size={13} />
                          <span className="text-[11px]">Signed Off</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[#38BDF8] font-semibold">
                          <Clock size={13} />
                          <span className="text-[11px]">Pending Review</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/screening/${screening.id}`}
                          className="px-3 py-1 rounded-lg text-[11px] font-bold bg-[#162338] text-slate-200 border border-[#1E2E48] hover:border-[#38BDF8] hover:text-white transition"
                        >
                          Workstation
                        </Link>
                        {screening.report_id && (
                          <Link
                            to={`/reports/${screening.report_id}`}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#162338] transition"
                            title="View Clinical Report"
                          >
                            <FileText size={15} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Clinical Safety & Telemetry Callout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#101B2D] border border-[#1E2E48] flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#0EA5E9]/15 text-[#38BDF8] border border-[#0EA5E9]/30 shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Quality Gatekeeper Active</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              OpenCV Laplacian blur scoring automatically filters ungradable scans prior to neural classification.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#101B2D] border border-[#1E2E48] flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#2563EB]/15 text-[#38BDF8] border border-[#2563EB]/30 shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Grad-CAM XAI Hook</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Real-time convolutional gradient backpropagation highlights microaneurysms and exudate hotspots.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#101B2D] border border-[#1E2E48] flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#F97316]/15 text-[#FB923C] border border-[#F97316]/30 shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">0.35 Referral Safeguard</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Any cumulative probability for Grade 2+ above 0.35 triggers clinical referral recommendation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
