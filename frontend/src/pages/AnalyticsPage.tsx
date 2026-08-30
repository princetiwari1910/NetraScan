import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Users,
  CheckCircle2,
  Calendar,
  Filter,
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
import { PageHeader } from '../components/common/PageHeader';
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
    <div className="space-y-6">
      <PageHeader
        title="Population Health & Triage Analytics"
        subtitle="Epidemiological diabetic retinopathy trends, screening throughput, and clinical override telemetry."
        badge={
          <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full uppercase tracking-wider">
            Clinical Analytics
          </span>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Screened"
          value="2,670"
          subtitle="Past 6 months"
          icon={Users}
          accentColor="blue"
          trend={{ value: '+18.4%', isPositive: true }}
        />
        <StatCard
          title="Referable Rate"
          value="21.8%"
          subtitle="Grade 2, 3, or 4"
          icon={AlertTriangle}
          accentColor="orange"
          trend={{ value: '-0.8%', isPositive: true, label: 'Stable' }}
        />
        <StatCard
          title="Doctor Override Rate"
          value="1.7%"
          subtitle="High AI concordance"
          icon={CheckCircle2}
          accentColor="teal"
          trend={{ value: '98.3% Agreement', isPositive: true }}
        />
        <StatCard
          title="Quality Gate Rejection"
          value="2.4%"
          subtitle="Laplacian blur filter"
          icon={BarChart3}
          accentColor="cyan"
          trend={{ value: '< 3% Target Met', isPositive: true }}
        />
      </div>

      {/* Monthly Screenings & Referrals Trend */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Monthly Throughput vs Actionable Referrals
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cumulative patient triage volume charted against referable retinopathy detections
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              Total Screened
            </span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              Referable DR
            </span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MONTHLY_TRENDS}>
              <defs>
                <linearGradient id="screenedGradLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="referableGradLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EA580C" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#EA580C" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  color: '#0F172A',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="screened"
                stroke="#2563EB"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#screenedGradLight)"
                name="Total Screened"
              />
              <Area
                type="monotone"
                dataKey="referable"
                stroke="#EA580C"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#referableGradLight)"
                name="Referable Cases"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Age Correlation Bar Chart */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
          Age-Cohort Retinopathy Severity Correlation
        </h3>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={AGE_CORRELATION}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="ageGroup" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  color: '#0F172A',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="normal" stackId="a" fill="#16A34A" name="Grade 0 (No DR)" />
              <Bar dataKey="mild" stackId="a" fill="#D97706" name="Grade 1 (Mild)" />
              <Bar dataKey="mod" stackId="a" fill="#EA580C" name="Grade 2 (Moderate)" />
              <Bar dataKey="severe" stackId="a" fill="#DC2626" name="Grade 3/4 (Severe/PDR)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
