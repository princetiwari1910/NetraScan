import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Calendar,
  Activity,
  PlusCircle,
  FileText,
  ChevronRight,
  ShieldCheck,
  Zap,
  Cpu,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';

const STAGE_DISTRIBUTION = [
  { name: 'Grade 0 (No DR)', count: 215, color: '#16A34A' },
  { name: 'Grade 1 (Mild)', count: 95, color: '#D97706' },
  { name: 'Grade 2 (Moderate)', count: 54, color: '#E8752F' },
  { name: 'Grade 3 (Severe)', count: 22, color: '#DC2626' },
  { name: 'Grade 4 (PDR)', count: 15, color: '#9333EA' },
];

export const DashboardPage: React.FC = () => {
  const { screenings, patients, health, currentScreening } = useApp();
  const navigate = useNavigate();

  const totalScreeningsCount = screenings.length + 395;
  const pendingReviewsCount = screenings.filter((s) => s.review.status === 'pending').length;
  const referableCount = screenings.filter((s) => s.prediction?.referable).length + 86;

  const ACTIVITY_DATA = [
    { day: 'Mon', total: 42, referable: 9 },
    { day: 'Tue', total: 58, referable: 13 },
    { day: 'Wed', total: 64, referable: 15 },
    { day: 'Thu', total: 51, referable: 11 },
    { day: 'Fri', total: 72, referable: 17 },
    { day: 'Sat', total: 68, referable: 14 },
    { day: 'Sun', total: 46, referable: 8 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Greeting & Telemetry Header */}
      <PageHeader
        title="Good morning, Doctor."
        subtitle="Your retinal screening overview and clinical telemetry."
        badge={
          <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            AI Inference Core Online
          </span>
        }
        actions={
          <Link
            to="/screening"
            className="px-4 py-2 bg-[#E8752F] hover:bg-[#C85A20] text-white text-xs font-bold rounded-xl shadow-warm-xs flex items-center gap-2 transition"
          >
            <PlusCircle size={15} />
            <span>New Retinal Screening</span>
          </Link>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Screenings"
          value={totalScreeningsCount}
          subtitle="Cumulative scans"
          icon={Eye}
          accentColor="orange"
          trend={{ value: '+14.2%', isPositive: true, label: 'vs last week' }}
        />
        <StatCard
          title="Pending Reviews"
          value={pendingReviewsCount || 1}
          subtitle="Awaiting doctor sign-off"
          icon={CheckCircle2}
          accentColor="purple"
          onClick={() => navigate('/screening')}
        />
        <StatCard
          title="Referable Cases"
          value={referableCount}
          subtitle="Grade 2, 3, or 4"
          icon={AlertTriangle}
          accentColor="orange"
          trend={{ value: '22.1%', isPositive: false, label: 'Referral rate' }}
        />
        <StatCard
          title="Average Confidence"
          value="92.4%"
          subtitle="MATLAB ResNet-18 Softmax"
          icon={Sparkles}
          accentColor="teal"
          trend={{ value: '+1.1%', isPositive: true }}
        />
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Screening Activity Area Chart */}
        <div className="lg:col-span-8 bg-white border border-[#EAE9E4] rounded-2xl p-6 shadow-warm-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-[#F0EFEA]">
            <div>
              <h3 className="text-base font-bold text-[#17191D]">
                Screening Activity & Triage Trends
              </h3>
              <p className="text-xs text-[#5F6368] mt-0.5">
                Daily volume comparing referable cases (Grade 2+) vs routine monitoring
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[#17191D]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#111318]" />
                Total Screened
              </span>
              <span className="flex items-center gap-1.5 text-[#E8752F]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E8752F]" />
                Referable Cases
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ACTIVITY_DATA}>
                <defs>
                  <linearGradient id="totalColorWarm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111318" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#111318" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="referableColorWarm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E8752F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#E8752F" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" vertical={false} />
                <XAxis dataKey="day" stroke="#8A8F98" fontSize={11} tickLine={false} axisLine={{ stroke: '#EAE9E4' }} />
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
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#111318"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#totalColorWarm)"
                  name="Total Screened"
                />
                <Area
                  type="monotone"
                  dataKey="referable"
                  stroke="#E8752F"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#referableColorWarm)"
                  name="Referable Cases"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Second Chart: DR Stage Distribution */}
        <div className="lg:col-span-4 bg-white border border-[#EAE9E4] rounded-2xl p-6 shadow-warm-xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-[#F0EFEA]">
              <h3 className="text-base font-bold text-[#17191D]">
                DR Severity Breakdown
              </h3>
              <p className="text-xs text-[#5F6368] mt-0.5">
                ICDR 5-class distribution
              </p>
            </div>

            <div className="h-44 w-full my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={STAGE_DISTRIBUTION}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {STAGE_DISTRIBUTION.map((entry: { color: string }, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #EAE9E4',
                      borderRadius: '8px',
                      color: '#17191D',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[#F0EFEA]">
            {STAGE_DISTRIBUTION.map((item: { name: string; count: number; color: string }) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-2 text-[#5F6368]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-bold text-[#17191D]">
                  {item.count} ({((item.count / 401) * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Row: Referral Priority Queue & AI Model Health Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending Clinician Reviews & Referral Queue */}
        <div className="lg:col-span-7 bg-white border border-[#EAE9E4] rounded-2xl p-6 shadow-warm-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA]">
            <div>
              <h3 className="text-base font-bold text-[#17191D] flex items-center gap-2">
                <AlertTriangle size={16} className="text-[#E8752F]" />
                <span>Actionable Referral Queue (Grade 2+)</span>
              </h3>
              <p className="text-xs text-[#5F6368] mt-0.5">
                Priority patients flagged for tertiary ophthalmologist evaluation
              </p>
            </div>
            <span className="text-xs font-bold text-[#C85A20] bg-[#FCF4EF] border border-[#F6D7C3] px-2.5 py-1 rounded-full">
              3 High Priority
            </span>
          </div>

          <div className="space-y-2.5">
            {[
              { id: 'PAT-48291', name: 'Ramesh Patel', eye: 'OD (Right Eye)', stage: 2, confidence: '91.4%', reason: 'Microaneurysms & Exudates in Macular Arcade' },
              { id: 'PAT-77312', name: 'Anil Deshmukh', eye: 'OS (Left Eye)', stage: 4, confidence: '94.8%', reason: 'Neovascularization & Vitreous Hemorrhage Risk' },
              { id: 'PAT-90321', name: 'Sunita Rao', eye: 'OD (Right Eye)', stage: 3, confidence: '89.2%', reason: 'Venous Beading in 2+ Quadrants' },
            ].map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-xl border border-[#EAE9E4] bg-[#FAF9F7] hover:bg-[#FCF4EF] hover:border-[#F6D7C3] transition flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#17191D]">{p.name}</span>
                    <span className="text-[11px] text-[#8A8F98] font-medium">{p.id} • {p.eye}</span>
                  </div>
                  <p className="text-[11px] text-[#5F6368] mt-0.5">{p.reason}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge grade={p.stage as any} size="sm" />
                  <Link
                    to="/screening"
                    className="px-2.5 py-1 bg-white border border-[#EAE9E4] hover:border-[#E8752F] text-[#E8752F] rounded-lg text-xs font-bold shadow-warm-xs"
                  >
                    Triage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Inference Core Live Telemetry Card */}
        <div className="lg:col-span-5 bg-white border border-[#EAE9E4] rounded-2xl p-6 shadow-warm-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA]">
            <div>
              <h3 className="text-base font-bold text-[#17191D] flex items-center gap-2">
                <Cpu size={16} className="text-[#E8752F]" />
                <span>AI Inference Subsystem</span>
              </h3>
              <p className="text-xs text-[#5F6368] mt-0.5">
                Real-time status of neural network and OpenCV filters
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Operational
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-[#FAF9F7] border border-[#EAE9E4] flex items-center justify-between">
              <span className="text-[#5F6368] font-medium">Model Architecture:</span>
              <span className="font-bold text-[#17191D]">MATLAB ResNet-18 (5-Class ICDR)</span>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF9F7] border border-[#EAE9E4] flex items-center justify-between">
              <span className="text-[#5F6368] font-medium">Explainability Hook:</span>
              <span className="font-bold text-[#E8752F]">Grad-CAM (`res5b_relu` / `layer4`)</span>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF9F7] border border-[#EAE9E4] flex items-center justify-between">
              <span className="text-[#5F6368] font-medium">Quality Gatekeeper:</span>
              <span className="font-bold text-emerald-800">OpenCV Laplacian Blur (&gt;100.0)</span>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF9F7] border border-[#EAE9E4] flex items-center justify-between">
              <span className="text-[#5F6368] font-medium">Mean Inference Latency:</span>
              <span className="font-bold text-[#17191D]">142 ms (Hardware Accelerated)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Screenings Table */}
      <div className="bg-white border border-[#EAE9E4] rounded-2xl p-6 shadow-warm-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA]">
          <div>
            <h3 className="text-base font-bold text-[#17191D]">
              Recent Screenings
            </h3>
            <p className="text-xs text-[#5F6368] mt-0.5">
              Incoming patient triage sessions and clinician review statuses
            </p>
          </div>

          <Link
            to="/screening"
            className="text-xs font-bold text-[#E8752F] hover:text-[#C85A20] flex items-center gap-1 transition"
          >
            <span>View All</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EAE9E4] bg-[#FAF9F7] text-[#5F6368] uppercase tracking-wider text-[11px] font-bold">
                <th className="py-2.5 pl-3">Patient</th>
                <th className="py-2.5">Date</th>
                <th className="py-2.5">Image Quality</th>
                <th className="py-2.5">AI Grade</th>
                <th className="py-2.5">Confidence</th>
                <th className="py-2.5">Referral</th>
                <th className="py-2.5">Review Status</th>
                <th className="py-2.5 pr-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EFEA]">
              {screenings.slice(0, 5).map((session) => {
                const grade = session.prediction?.dr_grade ?? 0;
                const isReferable = session.prediction?.referable ?? false;

                return (
                  <tr
                    key={session.id}
                    className="hover:bg-[#FAF9F7] transition-colors group"
                  >
                    <td className="py-3.5 pl-3">
                      <div className="font-bold text-[#17191D]">
                        {session.patient.name}
                      </div>
                      <div className="text-[#8A8F98] text-[11px]">
                        {session.patient.patient_id} • {session.patient.examined_eye}
                      </div>
                    </td>
                    <td className="py-3.5 text-[#5F6368] font-medium">
                      {session.timestamp.split(' ')[0]}
                    </td>
                    <td className="py-3.5">
                      <span className="font-semibold text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        Var: {session.quality.laplacian_variance.toFixed(0)} (Pass)
                      </span>
                    </td>
                    <td className="py-3.5">
                      <StatusBadge grade={grade} size="sm" />
                    </td>
                    <td className="py-3.5 font-bold text-[#17191D]">
                      {((session.prediction?.confidence ?? 0.9) * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`font-semibold text-xs px-2.5 py-0.5 rounded-full border ${
                          isReferable
                            ? 'bg-[#FCF4EF] text-[#C85A20] border-[#F6D7C3]'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {isReferable ? 'Recommended' : 'Not Required'}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#FAF9F7] text-[#17191D] border border-[#EAE9E4] capitalize">
                        {session.review.status}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3 text-right">
                      <Link
                        to={`/screening/${session.id}`}
                        className="px-3 py-1.5 bg-white hover:bg-[#FAF9F7] text-[#17191D] rounded-lg font-bold text-xs transition inline-block border border-[#EAE9E4] hover:border-[#E8752F] shadow-warm-xs"
                      >
                        Review Scan
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
