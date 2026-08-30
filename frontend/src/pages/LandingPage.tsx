import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Eye,
  Brain,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Cpu,
  FileText,
  Sliders,
  Sparkles,
  Zap,
  Crosshair,
  Target,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NetraScanLogo } from '../components/common/NetraScanLogo';
import { DEMO_FUNDUS_SVG, DEMO_HEATMAP_SVG } from '../services/mockData';

export const LandingPage: React.FC = () => {
  const [sliderPos, setSliderPos] = useState(50);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [isScanningActive, setIsScanningActive] = useState(true);

  const HOTSPOTS = [
    {
      id: 'ma',
      x: 62,
      y: 48,
      title: 'Microaneurysms',
      desc: 'Focal dilation of retinal capillaries in temporal arcade.',
      gradeContribution: '+42% Weight (Grade 1/2 Indicator)',
    },
    {
      id: 'he',
      x: 72,
      y: 42,
      title: 'Hard Lipid Exudates',
      desc: 'Waxy lipoprotein deposits secondary to chronic vascular leakage.',
      gradeContribution: '+19% Weight (Grade 2 Indicator)',
    },
    {
      id: 'bh',
      x: 38,
      y: 65,
      title: 'Dot & Blot Hemorrhages',
      desc: 'Intraretinal microvascular rupture within deep nuclear layers.',
      gradeContribution: '+31% Weight (Moderate NPDR)',
    },
    {
      id: 'od',
      x: 30,
      y: 50,
      title: 'Optic Nerve Head',
      desc: 'Normal physiological cup-to-disc ratio without neovascularization.',
      gradeContribution: 'Disc Margin Intact (Rule-out PDR)',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-[#17191D] font-sans selection:bg-[#E8752F] selection:text-white">
      {/* 1. NAVBAR */}
      <nav className="border-b border-[#EAE9E4] bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-warm-xs">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <NetraScanLogo size="md" showText={true} showTagline={false} variant="light" />
          </Link>

          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#5F6368]">
            <a href="#product" className="hover:text-[#E8752F] transition">Product Architecture</a>
            <Link to="/screening" className="hover:text-[#E8752F] transition">Screening Workstation</Link>
            <Link to="/explainability" className="hover:text-[#E8752F] transition">Explainable AI</Link>
            <Link to="/dashboard" className="hover:text-[#E8752F] transition">Clinical Dashboard</Link>
            <Link to="/model-performance" className="hover:text-[#E8752F] transition">Validation Metrics</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/screening"
              className="px-5 py-2.5 rounded-xl bg-[#E8752F] hover:bg-[#C85A20] text-white text-xs font-bold shadow-warm-xs transition flex items-center gap-2"
            >
              <span>Start Screening</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. LIGHT HERO SECTION */}
      <section className="relative pt-16 pb-20 px-6 overflow-hidden">
        {/* Warm ambient background */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[#FCF4EF]/70 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FCF4EF] border border-[#F6D7C3] text-[#C85A20] text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#E8752F] animate-pulse" />
              <span>AI-Powered Retinal Screening</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-[#17191D]">
              AI-Powered Retinal Screening.
              <br />
              <span className="text-[#E8752F]">
                Explainable. Clinician-Verified.
              </span>
            </h1>

            <p className="text-base text-[#5F6368] max-w-xl leading-relaxed">
              NetraScan analyzes retinal fundus photographs using deep learning, performs automated ICDR diabetic retinopathy staging, and visualizes the microvascular biomarkers influencing every prediction through explainable AI.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/screening"
                className="px-8 py-3.5 rounded-xl bg-[#E8752F] hover:bg-[#C85A20] text-white font-bold text-sm shadow-warm-xs flex items-center gap-2.5 transition"
              >
                <span>Start Screening</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/dashboard"
                className="px-6 py-3.5 rounded-xl bg-white border border-[#EAE9E4] hover:bg-[#FAF9F7] text-[#17191D] font-bold text-sm transition shadow-warm-xs"
              >
                Explore Clinical Dashboard
              </Link>
            </div>

            {/* Validation Benchmarks */}
            <div className="pt-6 border-t border-[#EAE9E4] grid grid-cols-3 gap-6 text-left">
              <div>
                <div className="text-2xl font-black text-[#17191D]">&gt;90.0%</div>
                <div className="text-xs text-[#8A8F98] uppercase tracking-wider font-semibold mt-0.5">
                  Referable Sensitivity
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#E8752F]">5-Class</div>
                <div className="text-xs text-[#8A8F98] uppercase tracking-wider font-semibold mt-0.5">
                  ICDR Severity Scale
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#17191D]">&lt;30s</div>
                <div className="text-xs text-[#8A8F98] uppercase tracking-wider font-semibold mt-0.5">
                  Triage Turnaround
                </div>
              </div>
            </div>
          </div>

          {/* 3. HERO VISUAL: HIGH-END DARK MEDICAL IMAGING WORKSTATION */}
          <div className="lg:col-span-6">
            <div className="bg-[#111318] border border-[#22252B] rounded-2xl p-6 shadow-2xl text-white relative">
              {/* Header Telemetry Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-[#22252B]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#E8752F]" />
                  <span className="text-xs font-bold text-[#FAF9F7] uppercase tracking-wider font-mono">
                    RETINAL INSPECTION • AI MODEL ANALYSIS
                  </span>
                </div>
                <span className="text-[11px] font-bold bg-[#FCF4EF] text-[#C85A20] border border-[#F6D7C3] px-2.5 py-0.5 rounded-full">
                  Grade 2 (Moderate NPDR)
                </span>
              </div>

              {/* Interactive Retinal Canvas with Hotspots & Laser Line */}
              <div className="my-5 relative rounded-xl overflow-hidden border border-[#32363F] aspect-square bg-[#05070B] shadow-inner">
                {/* Heatmap Layer */}
                <img
                  src={DEMO_HEATMAP_SVG}
                  alt="Grad-CAM Layer"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Original Layer clipped by interactive slider */}
                <div
                  className="absolute inset-0 overflow-hidden transition-all"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={DEMO_FUNDUS_SVG}
                    alt="Fundus Base"
                    className="absolute inset-0 w-[500px] h-[500px] max-w-none object-cover"
                  />
                </div>

                {/* Laser Scanning Beam Sweep */}
                {isScanningActive && (
                  <motion.div
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#67C7D4] to-transparent shadow-[0_0_12px_2px_rgba(103,199,212,0.8)] pointer-events-none"
                  />
                )}

                {/* Interactive Biomarker Hotspots */}
                {HOTSPOTS.map((spot) => (
                  <div
                    key={spot.id}
                    className="absolute z-20"
                    style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                    onMouseEnter={() => setActiveHotspot(spot.id)}
                    onMouseLeave={() => setActiveHotspot(null)}
                  >
                    <div className="relative -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
                      <span className="absolute -inset-1 rounded-full bg-[#E8752F]/40 animate-ping" />
                      <div className="relative w-3.5 h-3.5 rounded-full bg-[#E8752F] border-2 border-white shadow-sm flex items-center justify-center text-[8px] font-bold text-white">
                        +
                      </div>

                      {/* Tooltip on hover */}
                      <AnimatePresence>
                        {activeHotspot === spot.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 rounded-xl bg-[#181A1F] border border-[#32363F] text-white text-left shadow-2xl pointer-events-none z-30"
                          >
                            <p className="text-xs font-bold text-[#F4A261]">{spot.title}</p>
                            <p className="text-[11px] text-[#A6ABB5] mt-0.5 leading-snug">{spot.desc}</p>
                            <span className="text-[10px] text-[#E8752F] font-semibold block mt-1.5">
                              {spot.gradeContribution}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}

                {/* Divider Line with Slider Position */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-[#E8752F] shadow-md pointer-events-none"
                  style={{ left: `${sliderPos}%` }}
                />
              </div>

              {/* Slider Controller */}
              <div className="flex items-center gap-3 px-2">
                <span className="text-xs text-[#8A8F98] font-semibold uppercase tracking-wider font-mono">
                  RAW
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPos}
                  onChange={(e) => setSliderPos(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#22252B] rounded-lg appearance-none cursor-pointer accent-[#E8752F]"
                />
                <span className="text-xs text-[#F4A261] font-semibold uppercase tracking-wider font-mono">
                  GRAD-CAM
                </span>
              </div>

              {/* Bottom Result Pill */}
              <div className="mt-4 pt-4 border-t border-[#22252B] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[#8A8F98]">Confidence:</span>
                  <span className="font-mono font-bold text-[#F4A261]">92.4%</span>
                </div>
                <span className="text-[#F4A261] font-bold flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-[#E8752F]" />
                  Referral Recommended (Actionable Grade 2)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. LIGHT CLINICAL FEATURES / 4 PILLARS OF MEDICAL RIGOR */}
      <section id="product" className="py-20 px-6 border-t border-[#EAE9E4] bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E8752F]">
              Clinical Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17191D]">
              Built on 4 Pillars of Medical Rigor
            </h2>
            <p className="text-sm text-[#5F6368]">
              Transforming raw retinal photographs into structured, explainable, and clinician-verifiable diagnostic telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#FAF9F7] border border-[#EAE9E4] hover:border-[#E8752F] p-6 rounded-2xl transition-all space-y-3 shadow-warm-xs">
              <div className="w-12 h-12 rounded-xl bg-[#FCF4EF] text-[#E8752F] border border-[#F6D7C3] flex items-center justify-center">
                <Eye size={22} />
              </div>
              <h3 className="text-base font-bold text-[#17191D]">OpenCV Quality Gatekeeper</h3>
              <p className="text-xs text-[#5F6368] leading-relaxed">
                Laplacian variance blur filter screens every image before AI inference to reject ungradable or out-of-focus fundus scans.
              </p>
            </div>

            <div className="bg-[#FAF9F7] border border-[#EAE9E4] hover:border-[#E8752F] p-6 rounded-2xl transition-all space-y-3 shadow-warm-xs">
              <div className="w-12 h-12 rounded-xl bg-[#FCF4EF] text-[#E8752F] border border-[#F6D7C3] flex items-center justify-center">
                <Sparkles size={22} />
              </div>
              <h3 className="text-base font-bold text-[#17191D]">CLAHE Contrast Enhancement</h3>
              <p className="text-xs text-[#5F6368] leading-relaxed">
                Applies adaptive histogram equalization in LAB color space to amplify subtle microaneurysms, hemorrhages, and exudates.
              </p>
            </div>

            <div className="bg-[#FAF9F7] border border-[#EAE9E4] hover:border-[#E8752F] p-6 rounded-2xl transition-all space-y-3 shadow-warm-xs">
              <div className="w-12 h-12 rounded-xl bg-[#FCF4EF] text-[#E8752F] border border-[#F6D7C3] flex items-center justify-center">
                <Brain size={22} />
              </div>
              <h3 className="text-base font-bold text-[#17191D]">MATLAB ResNet-18 Model</h3>
              <p className="text-xs text-[#5F6368] leading-relaxed">
                Deep neural network fine-tuned for 5-class international grading (No DR, Mild, Moderate, Severe, and Proliferative DR).
              </p>
            </div>

            <div className="bg-[#FAF9F7] border border-[#EAE9E4] hover:border-[#E8752F] p-6 rounded-2xl transition-all space-y-3 shadow-warm-xs">
              <div className="w-12 h-12 rounded-xl bg-[#FCF4EF] text-[#E8752F] border border-[#F6D7C3] flex items-center justify-center">
                <Stethoscope size={22} />
              </div>
              <h3 className="text-base font-bold text-[#17191D]">Human-in-the-Loop Review</h3>
              <p className="text-xs text-[#5F6368] leading-relaxed">
                Built-in clinician verification workflow empowering doctors to review, confirm, or override AI staging before report export.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. DARK RETINAL EXPLAINABILITY & BIOMARKER SECTION */}
      <section className="py-20 px-6 bg-[#111318] text-white border-t border-[#22252B]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F4A261] font-mono">
              EXPLAINABLE AI ENGINE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Transparent Decision Attribution
            </h2>
            <p className="text-xs text-[#8A8F98]">
              Grad-CAM visualizes deep convolutional feature activations directly on retinal anatomy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#181A1F] border border-[#22252B] p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#22252B] text-[#F4A261] flex items-center justify-center">
                <Cpu size={20} />
              </div>
              <h3 className="text-sm font-bold text-white">Target Layer Gradients</h3>
              <p className="text-xs text-[#8A8F98] leading-relaxed">
                Gradients of predicted ICDR score $y^c$ are computed with respect to final convolutional block feature activations (`model.features[-1]`).
              </p>
            </div>

            <div className="bg-[#181A1F] border border-[#22252B] p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#22252B] text-[#F4A261] flex items-center justify-center">
                <Layers size={20} />
              </div>
              <h3 className="text-sm font-bold text-white">Global Average Pooling</h3>
              <p className="text-xs text-[#8A8F98] leading-relaxed">
                Importance weights $\alpha_k^c$ quantify the contribution of each convolutional feature map towards the final diabetic retinopathy grade.
              </p>
            </div>

            <div className="bg-[#181A1F] border border-[#22252B] p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#22252B] text-[#F4A261] flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <h3 className="text-sm font-bold text-white">Biomarker Localization</h3>
              <p className="text-xs text-[#8A8F98] leading-relaxed">
                A weighted forward activation map is passed through ReLU rectification to isolate only features with a positive diagnostic influence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. LIGHT TELE-OPHTHALMOLOGY WORKFLOW */}
      <section className="py-20 px-6 border-t border-[#EAE9E4] bg-[#FAF9F7]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E8752F]">
              End-to-End Protocol
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17191D]">
              Integrated Tele-Ophthalmology Screening
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: '01', title: 'Fundus Capture', desc: 'Patient scanned with fundus camera or mobile optical adapter.' },
              { step: '02', title: 'Quality Gate', desc: 'Laplacian blur filter verifies image gradability in <300ms.' },
              { step: '03', title: 'AI Staging', desc: '5-Class ICDR classification with softmax confidence.' },
              { step: '04', title: 'Grad-CAM XAI', desc: 'Explainable convolutional attention map highlights lesion hotspots.' },
              { step: '05', title: 'Clinical Report', desc: 'Standardized PDF/HTML report and hospital referral telemetry.' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white border border-[#EAE9E4] p-5 rounded-2xl space-y-2 shadow-warm-xs">
                <span className="text-2xl font-black text-[#E8752F]">{item.step}</span>
                <h4 className="text-sm font-bold text-[#17191D]">{item.title}</h4>
                <p className="text-xs text-[#5F6368] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. DEEP CHARCOAL FOOTER & FINAL CTA */}
      <footer className="py-14 px-6 border-t border-[#22252B] bg-[#111318] text-white text-center space-y-6">
        <div className="max-w-xl mx-auto space-y-4">
          <NetraScanLogo size="md" showText={true} showTagline={false} variant="dark" className="justify-center" />
          <p className="text-xs text-[#8A8F98]">
            Clinical decision support platform for point-of-care diabetic retinopathy screening, explainable triage, and referral management.
          </p>
          <div className="pt-2">
            <Link
              to="/dashboard"
              className="px-6 py-2.5 bg-[#E8752F] hover:bg-[#C85A20] text-white text-xs font-bold rounded-xl shadow-warm-xs transition inline-flex items-center gap-2"
            >
              <span>Access Clinician Command Center</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="text-xs text-[#5F6368] pt-6 border-t border-[#22252B]">
          © 2026 NetraScan. All medical decision support claims subject to clinician oversight.
        </div>
      </footer>
    </div>
  );
};
