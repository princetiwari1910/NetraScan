import React, { useState } from 'react';
import {
  BrainCircuit,
  Sparkles,
  Info,
  Layers,
  Cpu,
  Eye,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { HeatmapViewer } from '../components/common/HeatmapViewer';
import { DEMO_FUNDUS_SVG, DEMO_HEATMAP_SVG } from '../services/mockData';

export const ExplainabilityPage: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('ma');

  const REGIONS = [
    {
      id: 'ma',
      title: '1. Microaneurysm Clusters',
      contribution: '+42% Activation Weight',
      location: 'Parafoveal Capillary Network',
      description: 'Localized focal dilatations in deep capillary beds. High gradient magnitude in final convolutional layer indicates primary trigger for diabetic retinopathy staging.',
      icdrSignificance: 'Mandatory biomarker for Grade 1 (Mild) & Grade 2 (Moderate NPDR).',
    },
    {
      id: 'he',
      title: '2. Dot & Blot Intraretinal Hemorrhages',
      contribution: '+31% Activation Weight',
      location: 'Inferior & Temporal Quad',
      description: 'Microvascular ruptures confined to inner nuclear and outer plexiform retinal layers. Gradient activation confirms multi-quadrant involvement.',
      icdrSignificance: 'Distinguishes Moderate NPDR from Mild NPDR under ICDR criteria.',
    },
    {
      id: 'ex',
      title: '3. Hard Lipid Exudates',
      contribution: '+19% Activation Weight',
      location: 'Superior Temporal Vascular Arcade',
      description: 'Lipoprotein precipitates extravasating from chronically incompetent retinal capillaries with surrounding retinal edema.',
      icdrSignificance: 'Key risk biomarker requiring close macular surveillance.',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Explainable AI & Grad-CAM Architecture"
        subtitle="Transparent neural decision-support through Gradient-weighted Class Activation Mapping (Grad-CAM)."
        badge={
          <span className="text-xs font-semibold bg-[#FCF4EF] text-[#C85A20] border border-[#F6D7C3] px-3 py-1 rounded-full uppercase tracking-wider">
            Biomarker Attribution
          </span>
        }
      />

      {/* Visual Explanation Timeline */}
      <div className="bg-white border border-[#EAE9E4] rounded-2xl p-6 shadow-warm-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA]">
          <h3 className="text-sm font-bold text-[#17191D] flex items-center gap-2">
            <Activity size={16} className="text-[#E8752F]" />
            <span>Neural Inference & Explainability Timeline</span>
          </h3>
          <span className="text-[11px] font-bold text-[#8A8F98] uppercase tracking-wider font-mono">
            Deterministic Pipeline
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {[
            { step: '01', title: 'Fundus Image', desc: 'Normalized 3-channel optical RGB fundus photograph.' },
            { step: '02', title: 'Feature Extraction', desc: 'MATLAB ResNet-18 multi-scale residual feature maps.' },
            { step: '03', title: 'Pathological Localization', desc: 'Grad-CAM gradient backprop onto res5b_relu layer.' },
            { step: '04', title: 'Model Decision', desc: 'Global average pooled softmax scoring with 0.35 referral threshold.' },
            { step: '05', title: 'ICDR Grade Output', desc: 'Moderate NPDR (Grade 2) with visual attribution map.' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#FAF9F7] border border-[#EAE9E4] flex flex-col justify-between relative group hover:border-[#E8752F] transition"
            >
              <div>
                <span className="text-xs font-black text-[#E8752F]">{item.step}</span>
                <h4 className="text-xs font-bold text-[#17191D] mt-1">{item.title}</h4>
                <p className="text-[11px] text-[#5F6368] mt-1 leading-snug">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Demonstration Section with Dark Optical Viewer */}
      <HeatmapViewer
        originalImage={DEMO_FUNDUS_SVG}
        heatmapImage={DEMO_HEATMAP_SVG}
        stageName="Moderate Non-Proliferative Diabetic Retinopathy"
        confidence={0.924}
        evidence={[
          'Microaneurysms detected in parafoveal capillary network.',
          'Dot-and-blot intraretinal hemorrhages contributing to Grade 2 classification.',
          'Hard lipid exudates identified in superior temporal vascular arcade.',
        ]}
      />

      {/* "Why did the model predict Grade 2?" Breakdown Section */}
      <div className="bg-white border border-[#EAE9E4] rounded-2xl p-6 shadow-warm-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F0EFEA]">
          <div>
            <h3 className="text-base font-bold text-[#17191D]">
              Why did the model predict Grade 2 (Moderate NPDR)?
            </h3>
            <p className="text-xs text-[#5F6368] mt-0.5">
              Decomposition of convolutional attention hotspots into specific pathological biomarkers
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#FCF4EF] text-[#C85A20] border border-[#F6D7C3]">
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
                  ? 'bg-[#FCF4EF] border-[#E8752F] shadow-warm-xs ring-2 ring-[#E8752F]/20'
                  : 'bg-[#FAF9F7] border-[#EAE9E4] hover:border-[#F6D7C3]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#17191D]">{reg.title}</span>
                <span className="text-[10px] font-bold text-[#C85A20] bg-[#FAECE0] px-2 py-0.5 rounded-full">
                  {reg.contribution}
                </span>
              </div>
              <span className="text-[11px] font-medium text-[#5F6368] block mt-1">
                Location: {reg.location}
              </span>
              <p className="text-xs text-[#5F6368] mt-2 leading-relaxed">
                {reg.description}
              </p>
              <div className="mt-3 pt-2.5 border-t border-[#EAE9E4] text-[11px] font-semibold text-[#17191D]">
                {reg.icdrSignificance}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scientific & Clinical Methodology Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#EAE9E4] rounded-2xl p-6 shadow-warm-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#FCF4EF] text-[#E8752F] border border-[#F6D7C3] flex items-center justify-center">
            <Cpu size={20} />
          </div>
          <h3 className="text-sm font-bold text-[#17191D]">
            1. Target Layer Gradients
          </h3>
          <p className="text-xs text-[#5F6368] leading-relaxed">
            Gradients of the predicted ICDR class score $y^c$ are computed with respect to the feature map activations $A^k$ of ResNet-18's final residual block (`res5b_relu` / `layer4[-1]`).
          </p>
        </div>

        <div className="bg-white border border-[#EAE9E4] rounded-2xl p-6 shadow-warm-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] text-[#0891B2] border border-[#CCFBF1] flex items-center justify-center">
            <Layers size={20} />
          </div>
          <h3 className="text-sm font-bold text-[#17191D]">
            2. Global Average Pooling
          </h3>
          <p className="text-xs text-[#5F6368] leading-relaxed">
            Importance weights $\alpha_k^c$ are obtained via spatial global average pooling over pixels, capturing the importance of each feature map $k$ for class $c$.
          </p>
        </div>

        <div className="bg-white border border-[#EAE9E4] rounded-2xl p-6 shadow-warm-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7] flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <h3 className="text-sm font-bold text-[#17191D]">
            3. ReLU Rectified Heatmap
          </h3>
          <p className="text-xs text-[#5F6368] leading-relaxed">
            A weighted combination of forward activation maps is passed through a ReLU non-linearity to only preserve features that have a positive influence on the target DR stage.
          </p>
        </div>
      </div>

      {/* Clinical Trust & Regulatory Disclaimer Notice */}
      <div className="bg-[#FCF4EF] border border-[#F6D7C3] rounded-2xl p-5 space-y-2">
        <div className="flex items-center gap-2 text-[#C85A20] text-xs font-bold uppercase tracking-wider">
          <ShieldCheck size={16} className="text-[#E8752F]" />
          <span>Clinical Trust Protocol • Decision Support Mandate</span>
        </div>
        <p className="text-xs text-[#5F6368] leading-relaxed">
          <strong>Model explanation ≠ clinical diagnosis.</strong> Highlighted regions indicate retinal areas that contributed most significantly to the neural network's decision. They do not substitute for comprehensive ophthalmoscopic examination. Clinicians must correlate Grad-CAM hotspots with direct examination findings and patient medical history.
        </p>
      </div>
    </div>
  );
};
