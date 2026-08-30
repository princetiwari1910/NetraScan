import React, { useState } from 'react';
import {
  Brain,
  Layers,
  Sparkles,
  Cpu,
  Info,
  Sliders,
  CheckCircle2,
  Crosshair,
  Maximize2,
  Activity,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DEMO_FUNDUS_SVG, DEMO_HEATMAP_SVG } from '../services/mockData';
import { HeatmapViewer } from '../components/common/HeatmapViewer';

interface BiomarkerRegion {
  id: string;
  title: string;
  location: string;
  description: string;
  contribution: string;
  icdrSignificance: string;
}

const REGIONS: BiomarkerRegion[] = [
  {
    id: 'ma',
    title: 'Microaneurysm Clusters',
    location: 'Superior-temporal arcade (parafoveal network)',
    description:
      'Focal saccular outpouchings of retinal capillaries resulting from pericyte loss and vessel wall weakening.',
    contribution: 'High (42% Gradient Weight)',
    icdrSignificance: 'Defines transition from Grade 0 (No DR) to Grade 1/2 NPDR.',
  },
  {
    id: 'he',
    title: 'Hard Lipid Exudates',
    location: 'Macular boundary (superior pole)',
    description:
      'Waxy lipoprotein precipitates leaking from chronically damaged endothelial tight junctions.',
    contribution: 'Moderate (28% Gradient Weight)',
    icdrSignificance: 'Signals chronic vascular hyperpermeability and risk of diabetic macular edema (DME).',
  },
  {
    id: 'bh',
    title: 'Blot & Dot Intraretinal Hemorrhages',
    location: 'Deep middle layers of the inner nuclear retina',
    description:
      'Ruptured capillary microaneurysms within the compact middle retinal layer forming discrete dot/blot lesions.',
    contribution: 'Very High (30% Gradient Weight)',
    icdrSignificance: 'Key criteria for Moderate (Grade 2) vs Severe (Grade 3) classification (4-2-1 rule).',
  },
];

export const ExplainabilityPage: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('ma');

  return (
    <div className="space-y-6 text-slate-100">
      {/* 1. Header */}
      <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Brain size={22} className="text-[#38BDF8]" />
              Explainable AI (Grad-CAM) Visual Attribution
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Visualizing deep convolutional feature activations from MATLAB ResNet-18 (`res5b_relu` / `layer4[-1]`) to explain what the AI predicted, why it predicted it, and where pathology was localized.
          </p>
        </div>

        <span className="text-xs font-mono font-bold bg-[#2563EB]/15 text-[#38BDF8] border border-[#2563EB]/30 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          Target: res5b_relu
        </span>
      </div>

      {/* 2. Step-by-Step Decision Pipeline */}
      <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">
          Convolutional Attribution Pipeline
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[
            { step: '01', title: 'Fundus Ingestion', desc: 'Normalized 224×224 optical RGB retinal photograph.' },
            { step: '02', title: 'Feature Extraction', desc: 'ResNet-18 multi-scale residual feature maps.' },
            { step: '03', title: 'Gradient Backprop', desc: 'Backpropagated gradients onto res5b_relu layer.' },
            { step: '04', title: 'Global Pool & ReLU', desc: 'Weighted activation maps rectified for positive influence.' },
            { step: '05', title: 'Attribution Map', desc: 'Moderate NPDR (Grade 2) with highlighted pathology.' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#162338] border border-[#1E2E48] hover:border-[#38BDF8] transition flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-black font-mono text-[#38BDF8]">{item.step}</span>
                <h4 className="text-xs font-bold text-white mt-1">{item.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Interactive Retinal Workstation with Dark Optical Canvas */}
      <HeatmapViewer
        originalImage={DEMO_FUNDUS_SVG}
        heatmapImage={DEMO_HEATMAP_SVG}
        stageName="Moderate Non-Proliferative Diabetic Retinopathy"
        confidence={0.924}
        evidence={[
          'Microaneurysms detected in parafoveal capillary network.',
          'Dot-and-blot intraretinal hemorrhages contributing to Grade 2 classification.',
          'Hard lipid exudates identified in superior temporal vascular arcade.',
          'Referral indicated under 0.35 clinical probability threshold.',
        ]}
      />

      {/* 4. "Why did the model predict Grade 2?" Breakdown Section */}
      <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1E2E48]">
          <div>
            <h3 className="text-base font-bold text-white">
              Why did the model predict Grade 2 (Moderate NPDR)?
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Decomposition of convolutional attention hotspots into specific pathological biomarkers
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#F97316]/20 text-[#FB923C] border border-[#F97316]/40">
            Grade 2: Moderate NPDR (92.4% Confidence)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {REGIONS.map((reg) => (
            <div
              key={reg.id}
              onClick={() => setSelectedRegion(reg.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                selectedRegion === reg.id
                  ? 'bg-[#162338] border-[#38BDF8] shadow-glow-cyan'
                  : 'bg-[#162338]/60 border-[#1E2E48] hover:border-slate-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{reg.title}</span>
                <span className="text-[10px] font-mono font-bold text-[#38BDF8] bg-[#0EA5E9]/15 px-2 py-0.5 rounded-full border border-[#0EA5E9]/30">
                  {reg.contribution}
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400 block mt-1">
                Location: {reg.location}
              </span>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {reg.description}
              </p>
              <div className="mt-3 pt-2.5 border-t border-[#1E2E48] text-[11px] font-semibold text-[#38BDF8]">
                {reg.icdrSignificance}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Scientific & Mathematical Attribution Formula */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#162338] text-[#38BDF8] border border-[#1E2E48] flex items-center justify-center">
            <Cpu size={20} />
          </div>
          <h3 className="text-sm font-bold text-white">1. Target Layer Gradients</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Gradients of the predicted ICDR class score $y^c$ are computed with respect to the feature map activations $A^k$ of ResNet-18&apos;s final residual block (`res5b_relu` / `layer4[-1]`).
          </p>
        </div>

        <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#162338] text-[#38BDF8] border border-[#1E2E48] flex items-center justify-center">
            <Layers size={20} />
          </div>
          <h3 className="text-sm font-bold text-white">2. Global Average Pooling</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-mono">
            {"Importance weights α_k^c quantify the pooled contribution of each convolutional channel A^k to the target grade."}
          </p>
        </div>

        <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#162338] text-[#38BDF8] border border-[#1E2E48] flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <h3 className="text-sm font-bold text-white">3. ReLU Feature Rectification</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-mono">
            {"L_Grad-CAM = ReLU(Σ α_k^c * A^k) isolates features with positive pathological diagnostic influence."}
          </p>
        </div>
      </div>
    </div>
  );
};
