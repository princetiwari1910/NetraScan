import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Users,
  CheckCircle2,
  Calendar,
  Filter
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
import { StatCard } from '../components/common/StatCard';

const MONTHLY_TRENDS = [
  { month: 'Mar', screened: 280, referable: 61, overrides: 4 },
  { month: 'Apr', screened: 340, referable: 75, overrides: 6 },
  { month: 'May', screened: 410, referable: 88, overrides: 7 },
  { month: 'Jun', screened: 490, referable: 108, overrides: 9 },
  { month: 'Jul', screened: 530, referable: 114, overrides: 8 },
  { month: 'Aug', screened: 620, referable: 136, overrides: 11 },
];

const AGE_CORRELATION = [
  { ageGroup: '20-39', normal: 85, mild: 10, mod: 4, severe: 1 },
  { ageGroup: '40-49', normal: 140, mild: 35, mod: 18, severe: 5 },
  { ageGroup: '50-59', normal: 210, mild: 75, mod: 54, severe: 22 },
  { ageGroup: '60-69', normal: 180, mild: 90, mod: 78, severe: 38 },
  { ageGroup: '70+', normal: 95, mild: 55, mod: 62, severe: 41 },
];

export const AnalyticsPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  return (
    <div className="space-y-6 text-slate-100">
      {/* 1. Header */}
      <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 size={22} className="text-[#38BDF8]" />
            Population Health & Triage Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Epidemiological diabetic retinopathy trends, district screening throughput, and clinical override telemetry
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#162338] border border-[#1E2E48] p-1 rounded-xl text-xs font-semibold">
          {(['7d', '30d', '90d', '1y'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1 rounded-lg transition font-mono ${
                timeframe === t
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 2. KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="District Population Screened"
          value="2,670"
          subtitle="Unique individuals"
          icon={Users}
          accentColor="blue"
          trend={{ value: '+18.4%', isPositive: true }}
        />
        <StatCard
          title="Referable DR Prevalence"
          value="21.8%"
          subtitle="Grade 2+ detected"
          icon={AlertTriangle}
          accentColor="orange"
          trend={{ value: 'Actionable cohort', isPositive: false }}
        />
        <StatCard
          title="Clinician Concordance"
          value="97.6%"
          subtitle="AI diagnosis confirmed"
          icon={CheckCircle2}
          accentColor="teal"
          trend={{ value: '2.4% override rate', isPositive: true }}
        />
        <StatCard
          title="Monthly Growth"
          value="+16.2%"
          subtitle="Screening capacity"
          icon={TrendingUp}
          accentColor="purple"
          trend={{ value: 'Mobile vans', isPositive: true }}
        />
      </div>

      {/* 3. Monthly Trends Area Chart */}
      <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2E48]">
          <div>
            <h3 className="text-base font-bold text-white">
              Screening Volume vs Actionable Referrals
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              6-month district screening capacity growth plotted against specialist referral triage
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#38BDF8]">District Aggregate</span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MONTHLY_TRENDS}>
              <defs>
                <linearGradient id="colorScreened" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorReferral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2E48" vertical={false} />
              <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0B1424',
                  border: '1px solid #1E2E48',
                  borderRadius: '12px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                }}
              />
              <Area type="monotone" dataKey="screened" stroke="#38BDF8" strokeWidth={2.5} fill="url(#colorScreened)" name="Total Screened" />
              <Area type="monotone" dataKey="referable" stroke="#F97316" strokeWidth={2.5} fill="url(#colorReferral)" name="Referable Findings" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Age Cohort Severity Distribution */}
      <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm space-y-4">
        <div className="pb-3 border-b border-[#1E2E48]">
          <h3 className="text-base font-bold text-white">
            Age Demographic vs Retinopathy Severity Staging
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Prevalence of Mild, Moderate, and Severe NPDR across patient age brackets
          </p>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={AGE_CORRELATION}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2E48" vertical={false} />
              <XAxis dataKey="ageGroup" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0B1424',
                  border: '1px solid #1E2E48',
                  borderRadius: '12px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="normal" fill="#10B981" name="Grade 0 (No DR)" stackId="a" />
              <Bar dataKey="mild" fill="#F59E0B" name="Grade 1 (Mild)" stackId="a" />
              <Bar dataKey="mod" fill="#F97316" name="Grade 2 (Moderate)" stackId="a" />
              <Bar dataKey="severe" fill="#EF4444" name="Grade 3/4 (Severe/PDR)" stackId="a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
