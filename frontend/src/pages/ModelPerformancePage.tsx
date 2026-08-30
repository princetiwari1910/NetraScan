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
import { PageHeader } from '../components/common/PageHeader';
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
    <div className="space-y-6">
      <PageHeader
        title="AI Model Performance & Evaluation"
        subtitle="Empirical validation benchmarks for MATLAB ResNet-18 fine-tuned on multi-center clinical datasets (EyePACS, Messidor-2, APTOS 2019)."
        badge={
          <span className="text-xs font-semibold bg-[#FCF4EF] text-[#C85A20] border border-[#F6D7C3] px-3 py-1 rounded-full uppercase tracking-wider">
            Validation Benchmark Dataset
          </span>
        }
      />

      {/* Model Spec Bar */}
      <div className="bg-white border border-[#EAE9E4] rounded-2xl p-5 shadow-warm-xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-[#5F6368] font-medium">Neural Architecture</span>
          <p className="font-bold text-sm text-[#17191D] mt-0.5">{metrics.model_name}</p>
        </div>
        <div>
          <span className="text-[#5F6368] font-medium">Diagnostic Task</span>
          <p className="font-bold text-sm text-[#17191D] mt-0.5">{metrics.task}</p>
        </div>
        <div>
          <span className="text-[#5F6368] font-medium">Input Resolution</span>
          <p className="font-bold text-sm text-[#E8752F] mt-0.5">{metrics.input_resolution}</p>
        </div>
        <div>
          <span className="text-[#5F6368] font-medium">Hardware Device</span>
          <p className="font-bold text-sm text-[#E8752F] mt-0.5">{metrics.device}</p>
        </div>
      </div>

      {/* Primary Validation KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Accuracy"
          value="89.4%"
          subtitle="Exact 5-class match"
          icon={ShieldCheck}
          accentColor="blue"
          trend={{ value: 'Multi-center validation', isPositive: true }}
        />
        <StatCard
          title="Referable Sensitivity"
          value={`${(metrics.sensitivity * 100).toFixed(1)}%`}
          subtitle="Grade 2+ detection rate"
          icon={CheckCircle2}
          accentColor="orange"
          trend={{ value: 'Target: >90.0% (Exceeded)', isPositive: true }}
        />
        <StatCard
          title="Referable Specificity"
          value={`${(metrics.specificity * 100).toFixed(1)}%`}
          subtitle="True negative rate"
          icon={CheckCircle2}
          accentColor="cyan"
          trend={{ value: 'Target: >85.0% (Exceeded)', isPositive: true }}
        />
        <StatCard
          title="Multi-Class ROC-AUC"
          value={metrics.auc_roc.toFixed(3)}
          subtitle="Discriminative area"
          icon={BarChart2}
          accentColor="purple"
          trend={{ value: 'High Diagnostic Area', isPositive: true }}
        />
      </div>

      {/* Clinical Validation Targets Box */}
      <div className="bg-white border border-[#EAE9E4] rounded-2xl p-6 shadow-warm-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F0EFEA]">
          <div>
            <h3 className="text-base font-bold text-[#17191D] flex items-center gap-2">
              <Target size={18} className="text-[#E8752F]" />
              <span>Clinical Validation Targets & Benchmarks</span>
            </h3>
            <p className="text-xs text-[#5F6368] mt-0.5">
              Engineering targets established for deployment in tele-ophthalmology clinical environments
            </p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FAF9F7] text-[#5F6368] border border-[#EAE9E4]">
            Pre-Clinical Benchmarks
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {[
            { metric: 'Sensitivity', target: '> 90.0%', actual: '91.8%', status: 'Target Met', color: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
            { metric: 'Specificity', target: '> 85.0%', actual: '89.2%', status: 'Target Met', color: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
            { metric: 'Grad-CAM IoU', target: '> 0.65', actual: '0.72 IoU', status: 'Target Met', color: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
            { metric: 'Quality Gate Error', target: '< 3.0%', actual: '2.4%', status: 'Target Met', color: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
            { metric: 'Triage Turnaround', target: '< 30.0s', actual: '4.2s (GPU)', status: 'Target Met', color: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
          ].map((item, i) => (
            <div key={i} className="p-3.5 rounded-xl border border-[#EAE9E4] bg-[#FAF9F7] flex flex-col justify-between space-y-2">
              <div>
                <span className="text-[#5F6368] font-medium">{item.metric}</span>
                <div className="text-lg font-bold text-[#17191D] mt-0.5">{item.actual}</div>
                <span className="text-[11px] text-[#8A8F98]">Target: {item.target}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border text-center ${item.color}`}>
                ✓ {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Visualizations Grid: ROC Curve & Confidence Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Multi-Class ROC Curve */}
        <div className="lg:col-span-6 bg-white border border-[#EAE9E4] rounded-2xl p-6 shadow-warm-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA]">
            <div>
              <h3 className="text-base font-bold text-[#17191D]">
                Receiver Operating Characteristic (ROC)
              </h3>
              <p className="text-xs text-[#5F6368] mt-0.5">
                True Positive Rate vs False Positive Rate (AUC = 0.942)
              </p>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ROC_CURVE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" />
                <XAxis dataKey="fpr" stroke="#8A8F98" fontSize={11} tickLine={false} axisLine={{ stroke: '#EAE9E4' }} name="FPR" />
                <YAxis stroke="#8A8F98" fontSize={11} tickLine={false} axisLine={false} name="TPR" />
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
                <Line type="monotone" dataKey="tpr" stroke="#E8752F" strokeWidth={3} dot={{ r: 4, fill: '#E8752F' }} name="MATLAB ResNet-18" />
                <Line type="monotone" dataKey="baseline" stroke="#E5E2DA" strokeDasharray="4 4" dot={false} name="Chance (0.5)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Prediction Confidence Distribution */}
        <div className="lg:col-span-6 bg-white border border-[#EAE9E4] rounded-2xl p-6 shadow-warm-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA]">
            <div>
              <h3 className="text-base font-bold text-[#17191D]">
                Inference Confidence Score Histogram
              </h3>
              <p className="text-xs text-[#5F6368] mt-0.5">
                Test set distribution across softmax probability bins
              </p>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CONFIDENCE_DISTRIBUTION}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" vertical={false} />
                <XAxis dataKey="bin" stroke="#8A8F98" fontSize={11} tickLine={false} axisLine={{ stroke: '#EAE9E4' }} />
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
                <Bar dataKey="count" fill="#E8752F" radius={[6, 6, 0, 0]} name="Patient Scans" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5x5 ICDR Confusion Matrix */}
      <div className="bg-white border border-[#EAE9E4] rounded-2xl p-6 shadow-warm-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA]">
          <div>
            <h3 className="text-base font-bold text-[#17191D]">
              5x5 ICDR Multi-Class Confusion Matrix
            </h3>
            <p className="text-xs text-[#5F6368] mt-0.5">
              Predicted versus ground truth clinical expert grades (N = 1,420 test retinal fundus images)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[500px]">
            <div className="grid grid-cols-6 gap-2 text-center text-xs">
              <div className="p-2 font-bold text-[#8A8F98]">True \ Pred</div>
              <div className="p-2 font-bold text-emerald-800 bg-emerald-50 rounded-lg">G0 No DR</div>
              <div className="p-2 font-bold text-amber-800 bg-amber-50 rounded-lg">G1 Mild</div>
              <div className="p-2 font-bold text-[#C85A20] bg-[#FCF4EF] rounded-lg">G2 Mod</div>
              <div className="p-2 font-bold text-red-800 bg-red-50 rounded-lg">G3 Sev</div>
              <div className="p-2 font-bold text-purple-800 bg-purple-50 rounded-lg">G4 PDR</div>

              {metrics.confusion_matrix.map((row, rIdx) => (
                <React.Fragment key={`row-${rIdx}`}>
                  <div className="p-2 font-bold text-[#17191D] flex items-center justify-center bg-[#FAF9F7] rounded-lg">
                    {['G0 No DR', 'G1 Mild', 'G2 Mod', 'G3 Sev', 'G4 PDR'][rIdx]}
                  </div>
                  {row.map((val, cIdx) => {
                    const isDiagonal = rIdx === cIdx;
                    return (
                      <div
                        key={`cell-${rIdx}-${cIdx}`}
                        className={`p-3 rounded-xl font-bold flex items-center justify-center transition-all ${
                          isDiagonal
                            ? 'bg-[#FCF4EF] text-[#E8752F] border-2 border-[#E8752F] shadow-warm-xs'
                            : val > 0
                            ? 'bg-[#FAF9F7] text-[#5F6368] border border-[#EAE9E4]'
                            : 'bg-white text-[#8A8F98] border border-[#F0EFEA]'
                        }`}
                      >
                        {val}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
