import React from 'react';
import {
  Cpu,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  BarChart2,
  Info,
  Target,
  Clock,
  TrendingUp,
  Activity
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
  LineChart,
  Line,
} from 'recharts';
import { StatCard } from '../components/common/StatCard';
import { MOCK_MODEL_METRICS } from '../services/mockData';
import { GRADE_DETAILS } from '../components/common/StatusBadge';

const ROC_CURVE_DATA = [
  { fpr: 0.0, tpr: 0.0, baseline: 0.0 },
  { fpr: 0.02, tpr: 0.42, baseline: 0.02 },
  { fpr: 0.05, tpr: 0.78, baseline: 0.05 },
  { fpr: 0.08, tpr: 0.88, baseline: 0.08 },
  { fpr: 0.12, tpr: 0.94, baseline: 0.12 },
  { fpr: 0.20, tpr: 0.97, baseline: 0.20 },
  { fpr: 0.40, tpr: 0.99, baseline: 0.40 },
  { fpr: 1.0, tpr: 1.0, baseline: 1.0 },
];

const CONFIDENCE_DISTRIBUTION = [
  { bin: '50-60%', count: 24 },
  { bin: '60-70%', count: 68 },
  { bin: '70-80%', count: 182 },
  { bin: '80-90%', count: 420 },
  { bin: '90-100%', count: 726 },
];

export const ModelPerformancePage: React.FC = () => {
  const metrics = MOCK_MODEL_METRICS;

  return (
    <div className="space-y-6 text-slate-100">
      {/* 1. Header */}
      <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Activity size={22} className="text-[#38BDF8]" />
            AI Model Performance & Clinical Telemetry
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Empirical validation benchmarks for MATLAB ResNet-18 evaluated on multi-center clinical cohorts (EyePACS, Messidor-2, APTOS).
          </p>
        </div>

        <span className="text-xs font-mono font-bold bg-[#162338] border border-[#1E2E48] text-[#38BDF8] px-3 py-1.5 rounded-xl self-start sm:self-auto">
          Validation Benchmark Cohort
        </span>
      </div>

      {/* 2. Top Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="AUC-ROC (Referable)"
          value={metrics.auc_roc.toFixed(3)}
          subtitle="Area Under ROC Curve"
          icon={Target}
          accentColor="blue"
          trend={{ value: '>0.95 target', isPositive: true }}
        />
        <StatCard
          title="Referable Sensitivity"
          value={`${(metrics.sensitivity * 100).toFixed(1)}%`}
          subtitle="True Positive Rate (Grade 2+)"
          icon={CheckCircle2}
          accentColor="teal"
          trend={{ value: 'Exceeds WHO 90%', isPositive: true }}
        />
        <StatCard
          title="Referable Specificity"
          value={`${(metrics.specificity * 100).toFixed(1)}%`}
          subtitle="True Negative Rate (Grade 0/1)"
          icon={ShieldCheck}
          accentColor="cyan"
          trend={{ value: '+2.4% vs baseline', isPositive: true }}
        />
        <StatCard
          title="Quadratic Weighted Kappa"
          value={metrics.qwk.toFixed(3)}
          subtitle="Inter-rater concordance"
          icon={Sparkles}
          accentColor="orange"
          trend={{ value: 'Substantial agreement', isPositive: true }}
        />
      </div>

      {/* 3. ROC Curve & Confidence Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ROC Curve */}
        <div className="lg:col-span-6 bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E2E48]">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Target size={18} className="text-[#38BDF8]" />
                Receiver Operating Characteristic (ROC)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sensitivity vs 1 - Specificity for referable diabetic retinopathy (AUC = 0.961)
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#38BDF8] bg-[#0EA5E9]/15 px-2.5 py-1 rounded-lg border border-[#0EA5E9]/30">
              AUC 0.961
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ROC_CURVE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2E48" />
                <XAxis
                  dataKey="fpr"
                  stroke="#64748B"
                  fontSize={11}
                  label={{ value: 'False Positive Rate (1 - Specificity)', position: 'insideBottom', offset: -5, fill: '#64748B', fontSize: 10 }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  label={{ value: 'True Positive Rate (Sensitivity)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 10 }}
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
                <Line type="monotone" dataKey="tpr" stroke="#38BDF8" strokeWidth={3} dot={{ r: 4, fill: '#38BDF8' }} name="MATLAB ResNet-18" />
                <Line type="monotone" dataKey="baseline" stroke="#64748B" strokeDasharray="4 4" dot={false} name="Chance (0.5)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confidence Distribution Bar Chart */}
        <div className="lg:col-span-6 bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E2E48]">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 size={18} className="text-[#38BDF8]" />
                Softmax Confidence Distribution
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Frequency of predicted class probabilities across 1,420 test retinal fundus scans
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-800/50">
              Mean: 92.4%
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CONFIDENCE_DISTRIBUTION}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2E48" vertical={false} />
                <XAxis dataKey="bin" stroke="#64748B" fontSize={11} />
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
                <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} name="Scans Ingested" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. 5x5 ICDR Multiclass Confusion Matrix */}
      <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1E2E48]">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers size={18} className="text-[#38BDF8]" />
              5-Class ICDR Confusion Matrix (Validation Set N=1,420)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ground truth ophthalmologist consensus vs automated ResNet-18 classification
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">Pre-Clinical Benchmark</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1E2E48] text-slate-400 text-[10px] font-bold">
                <th className="py-2.5 px-3 text-left">Actual \ Predicted</th>
                <th className="py-2.5 px-3">Grade 0 (No DR)</th>
                <th className="py-2.5 px-3">Grade 1 (Mild)</th>
                <th className="py-2.5 px-3">Grade 2 (Moderate)</th>
                <th className="py-2.5 px-3">Grade 3 (Severe)</th>
                <th className="py-2.5 px-3">Grade 4 (PDR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2E48]/60">
              {metrics.confusion_matrix.map((row, actualIdx) => (
                <tr key={actualIdx} className="hover:bg-[#162338]/50 transition">
                  <td className="py-3 px-3 text-left font-bold text-white font-sans text-xs">
                    Grade {actualIdx} ({GRADE_DETAILS[actualIdx as keyof typeof GRADE_DETAILS]?.shortLabel})
                  </td>
                  {row.map((val, predIdx) => {
                    const isDiagonal = actualIdx === predIdx;
                    return (
                      <td key={predIdx} className="py-3 px-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-lg font-bold ${
                            isDiagonal
                              ? 'bg-[#2563EB]/25 text-[#38BDF8] border border-[#2563EB]/40'
                              : val > 0
                              ? 'bg-[#162338] text-slate-400'
                              : 'text-slate-600'
                          }`}
                        >
                          {val}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
