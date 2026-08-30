import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Eye,
  Brain,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Activity,
  Layers,
  Sparkles,
  FileText,
  Users,
  ChevronRight,
  Stethoscope,
  Sliders,
  Check,
  AlertTriangle,
  Lock,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NetraScanLogo } from '../components/common/NetraScanLogo';

// High-fidelity synthetic fundus & Grad-CAM visual layers
const HERO_FUNDUS_SVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"><defs><radialGradient id="fundusBg" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23d94812"/><stop offset="60%" stop-color="%239a2c0a"/><stop offset="90%" stop-color="%235a1204"/><stop offset="100%" stop-color="%231a0501"/></radialGradient><radialGradient id="opticDisc" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23ffeb99"/><stop offset="70%" stop-color="%23f5b041"/><stop offset="100%" stop-color="%23d68910"/></radialGradient><filter id="blur"><feGaussianBlur stdDeviation="3"/></filter></defs><rect width="500" height="500" fill="%2307111F"/><circle cx="250" cy="250" r="235" fill="url(%23fundusBg)"/><circle cx="150" cy="250" r="36" fill="url(%23opticDisc)"/><circle cx="310" cy="255" r="16" fill="%236e1a06" filter="url(%23blur)" opacity="0.8"/><path d="M150 250 Q 190 170 280 135 T 410 110" stroke="%23580e03" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M150 250 Q 190 330 290 370 T 420 395" stroke="%23580e03" stroke-width="7.5" fill="none" stroke-linecap="round"/><path d="M150 250 Q 100 170 50 120" stroke="%23781506" stroke-width="5.5" fill="none" stroke-linecap="round"/><path d="M150 250 Q 100 330 50 380" stroke="%23781506" stroke-width="5.5" fill="none" stroke-linecap="round"/><circle cx="300" cy="225" r="4.5" fill="%23400502"/><circle cx="330" cy="285" r="5" fill="%23400502"/><circle cx="270" cy="295" r="3.8" fill="%23400502"/><circle cx="355" cy="205" r="6" fill="%23fff2a8" opacity="0.85"/><circle cx="375" cy="225" r="5" fill="%23fff2a8" opacity="0.85"/><circle cx="340" cy="310" r="9" fill="%23e84118" opacity="0.75" filter="url(%23blur)"/><circle cx="280" cy="195" r="10" fill="%23e84118" opacity="0.7" filter="url(%23blur)"/></svg>';

const HERO_HEATMAP_SVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"><defs><radialGradient id="hotspot1" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23ff0000" stop-opacity="0.85"/><stop offset="40%" stop-color="%23ffaa00" stop-opacity="0.65"/><stop offset="70%" stop-color="%2300ff00" stop-opacity="0.35"/><stop offset="100%" stop-color="%230000ff" stop-opacity="0"/></radialGradient><radialGradient id="hotspot2" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23ff0055" stop-opacity="0.8"/><stop offset="50%" stop-color="%23ffcc00" stop-opacity="0.5"/><stop offset="100%" stop-color="%2300ffff" stop-opacity="0"/></radialGradient><radialGradient id="fundusBg" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23d94812"/><stop offset="60%" stop-color="%239a2c0a"/><stop offset="90%" stop-color="%235a1204"/><stop offset="100%" stop-color="%231a0501"/></radialGradient></defs><rect width="500" height="500" fill="%2307111F"/><circle cx="250" cy="250" r="235" fill="url(%23fundusBg)"/><circle cx="325" cy="250" r="95" fill="url(%23hotspot1)"/><circle cx="290" cy="200" r="70" fill="url(%23hotspot2)"/><circle cx="350" cy="300" r="55" fill="url(%23hotspot2)"/></svg>';

export const LandingPage: React.FC = () => {
  const [sliderPos, setSliderPos] = useState(50);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);

  const HOTSPOTS = [
    {
      id: 'ma',
      x: 62,
      y: 45,
      title: 'Microaneurysms Detected',
      desc: 'Focal capillary dilatation in superior temporal arcade.',
      gradeContribution: '+42% Weight (Grade 1/2 Indicator)',
    },
    {
      id: 'he',
      x: 72,
      y: 41,
      title: 'Hard Lipid Exudates',
      desc: 'Waxy lipoprotein deposits secondary to microvascular leakage.',
      gradeContribution: '+19% Weight (Grade 2 Indicator)',
    },
    {
      id: 'bh',
      x: 56,
      y: 60,
      title: 'Dot & Blot Hemorrhages',
      desc: 'Intraretinal rupture within deep middle nuclear layers.',
      gradeContribution: '+31% Weight (Moderate NPDR)',
    },
    {
      id: 'od',
      x: 30,
      y: 50,
      title: 'Optic Disc Margin',
      desc: 'Intact cup-to-disc anatomy, ruling out disk neovascularization.',
      gradeContribution: 'Disc Intact (Rule-out PDR)',
    },
  ];

  return (
    <div className="min-h-screen bg-[#07111F] text-slate-100 font-sans selection:bg-[#2563EB] selection:text-white">
      {/* 1. Global Navbar */}
      <nav className="border-b border-[#1E2E48] bg-[#0B1424]/90 backdrop-blur-md sticky top-0 z-50 shadow-dark-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <NetraScanLogo size="md" showText={true} showTagline={false} variant="dark" />
          </Link>

          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#product" className="hover:text-[#38BDF8] transition">
              Product Architecture
            </a>
            <Link to="/screening" className="hover:text-[#38BDF8] transition">
              Screening Workstation
            </Link>
            <Link to="/explainability" className="hover:text-[#38BDF8] transition">
              Explainable AI
            </Link>
            <Link to="/dashboard" className="hover:text-[#38BDF8] transition">
              Clinical Dashboard
            </Link>
            <Link to="/model-performance" className="hover:text-[#38BDF8] transition">
              Model Telemetry
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="hidden sm:inline-flex px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-[#162338] transition border border-[#1E2E48]"
            >
              Sign In
            </Link>
            <Link
              to="/screening"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] hover:from-[#1D4ED8] hover:to-[#0284C7] text-white text-xs font-bold shadow-glow-blue transition flex items-center gap-2"
            >
              <span>Launch Screening</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Dark Hero Section */}
      <section className="relative pt-16 pb-24 px-6 overflow-hidden bg-gradient-to-b from-[#07111F] via-[#0B1424] to-[#07111F]">
        {/* Subtle ambient light gradient */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[850px] h-[400px] bg-[#0EA5E9]/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Hero Content */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#101B2D] border border-[#1E2E48] text-[#38BDF8] text-xs font-semibold uppercase tracking-wider shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
              <span>Clinical Decision Support System</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-white">
              AI-Powered Retinal Screening.{' '}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] via-[#2563EB] to-[#60A5FA]">
                Explainable.
              </span>{' '}
              <span className="text-white">Clinician-Verified.</span>
            </h1>

            <p className="text-base text-slate-300 max-w-xl leading-relaxed">
              NetraScan ingests optical fundus photographs, executes automated ICDR diabetic retinopathy classification, and projects granular Grad-CAM explainability maps to assist ophthalmologists in high-throughput triage.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/screening"
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] hover:from-[#1D4ED8] hover:to-[#0284C7] text-white font-bold text-sm shadow-glow-blue flex items-center gap-2.5 transition"
              >
                <span>Start Screening</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/dashboard"
                className="px-6 py-3.5 rounded-xl bg-[#101B2D] border border-[#1E2E48] hover:border-[#38BDF8] text-slate-200 hover:text-white font-bold text-sm transition"
              >
                Explore Clinical Dashboard
              </Link>
            </div>

            {/* Performance Telemetry Strip */}
            <div className="pt-6 border-t border-[#1E2E48] grid grid-cols-3 gap-6 text-left">
              <div>
                <div className="text-2xl font-black text-white">&gt;90.0%</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                  Referable Sensitivity
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#FB923C]">5-Class</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                  ICDR Severity Scale
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#38BDF8]">&lt;30s</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                  Triage Turnaround
                </div>
              </div>
            </div>
          </div>

          {/* Right Hero Retinal Inspection Workstation Visual */}
          <div className="lg:col-span-6">
            <div className="bg-[#0B1424] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-lg text-white relative">
              {/* Telemetry Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#1E2E48]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] animate-pulse" />
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">
                    RETINAL INSPECTION • AI ATTRIBUTION
                  </span>
                </div>
                <span className="text-xs font-mono font-bold bg-[#F97316]/20 text-[#FB923C] border border-[#F97316]/40 px-2.5 py-0.5 rounded-full">
                  Grade 2 (Moderate NPDR)
                </span>
              </div>

              {/* Optical Canvas */}
              <div className="my-5 relative rounded-xl overflow-hidden border border-[#1E2E48] aspect-square bg-[#05070B] shadow-inner select-none">
                {/* Heatmap Layer */}
                <img
                  src={HERO_HEATMAP_SVG}
                  alt="Grad-CAM Layer"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* RAW Fundus Layer clipped by slider */}
                <div
                  className="absolute inset-0 overflow-hidden transition-all"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={HERO_FUNDUS_SVG}
                    alt="Fundus Base"
                    className="absolute inset-0 w-[500px] h-[500px] max-w-none object-cover"
                  />
                </div>

                {/* Animated Clinical Laser Scanning Line */}
                <motion.div
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent shadow-[0_0_12px_2px_rgba(56,189,248,0.8)] pointer-events-none"
                />

                {/* Interactive Hotspot Markers */}
                {HOTSPOTS.map((spot) => (
                  <div
                    key={spot.id}
                    className="absolute z-20"
                    style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                    onMouseEnter={() => setActiveMarker(spot.id)}
                    onMouseLeave={() => setActiveMarker(null)}
                  >
                    <div className="relative -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
                      <span className="absolute -inset-1 rounded-full bg-[#38BDF8]/40 animate-ping" />
                      <div className="relative w-4 h-4 rounded-full bg-[#0EA5E9] border-2 border-white shadow-sm flex items-center justify-center text-[9px] font-bold text-white">
                        +
                      </div>

                      <AnimatePresence>
                        {activeMarker === spot.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 rounded-xl bg-[#101B2D] border border-[#1E2E48] text-white text-left shadow-dark-lg pointer-events-none z-30"
                          >
                            <p className="text-xs font-bold text-[#38BDF8]">{spot.title}</p>
                            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                              {spot.desc}
                            </p>
                            <span className="text-[10px] text-[#FB923C] font-semibold block mt-1.5 font-mono">
                              {spot.gradeContribution}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}

                {/* Slider divider line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-[#38BDF8] shadow-[0_0_8px_#38BDF8] pointer-events-none"
                  style={{ left: `${sliderPos}%` }}
                />
              </div>

              {/* Slider Controls */}
              <div className="flex items-center gap-3 px-2">
                <span className="text-xs text-slate-400 font-mono font-semibold uppercase tracking-wider">
                  RAW
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPos}
                  onChange={(e) => setSliderPos(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#162338] rounded-lg appearance-none cursor-pointer accent-[#38BDF8]"
                />
                <span className="text-xs text-[#38BDF8] font-mono font-semibold uppercase tracking-wider">
                  GRAD-CAM
                </span>
              </div>

              {/* Workstation Footer Diagnostics */}
              <div className="mt-4 pt-4 border-t border-[#1E2E48] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Confidence:</span>
                  <span className="font-mono font-bold text-[#38BDF8]">92.4%</span>
                </div>
                <span className="text-[#FB923C] font-bold flex items-center gap-1.5 font-mono">
                  <AlertTriangle size={14} className="text-[#F97316]" />
                  Referral Recommended (Actionable Grade 2)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Clinical Architecture Pillars */}
      <section id="product" className="py-24 px-6 border-t border-[#1E2E48] bg-[#0B1424]">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#38BDF8] font-mono">
              Clinical Rigor & Engineering
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Built on 4 Foundations of Medical AI
            </h2>
            <p className="text-sm text-slate-300">
              Transforming raw retinal photographs into structured, explainable, and clinician-verifiable diagnostic telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#101B2D] border border-[#1E2E48] hover:border-[#38BDF8] p-6 rounded-2xl transition-all space-y-3 shadow-dark-sm">
              <div className="w-12 h-12 rounded-xl bg-[#0EA5E9]/10 text-[#38BDF8] border border-[#0EA5E9]/30 flex items-center justify-center">
                <ShieldCheck size={22} />
              </div>
              <h3 className="text-base font-bold text-white">OpenCV Quality Gatekeeper</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Laplacian variance blur filter screens every image before AI inference to reject ungradable or out-of-focus fundus scans.
              </p>
            </div>

            <div className="bg-[#101B2D] border border-[#1E2E48] hover:border-[#38BDF8] p-6 rounded-2xl transition-all space-y-3 shadow-dark-sm">
              <div className="w-12 h-12 rounded-xl bg-[#0EA5E9]/10 text-[#38BDF8] border border-[#0EA5E9]/30 flex items-center justify-center">
                <Sparkles size={22} />
              </div>
              <h3 className="text-base font-bold text-white">CLAHE Contrast Enhancement</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Applies adaptive histogram equalization in LAB color space to amplify subtle microaneurysms, hemorrhages, and exudates.
              </p>
            </div>

            <div className="bg-[#101B2D] border border-[#1E2E48] hover:border-[#38BDF8] p-6 rounded-2xl transition-all space-y-3 shadow-dark-sm">
              <div className="w-12 h-12 rounded-xl bg-[#0EA5E9]/10 text-[#38BDF8] border border-[#0EA5E9]/30 flex items-center justify-center">
                <Brain size={22} />
              </div>
              <h3 className="text-base font-bold text-white">MATLAB ResNet-18 Model</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Deep neural network fine-tuned for 5-class international grading (No DR, Mild, Moderate, Severe, and Proliferative DR).
              </p>
            </div>

            <div className="bg-[#101B2D] border border-[#1E2E48] hover:border-[#38BDF8] p-6 rounded-2xl transition-all space-y-3 shadow-dark-sm">
              <div className="w-12 h-12 rounded-xl bg-[#0EA5E9]/10 text-[#38BDF8] border border-[#0EA5E9]/30 flex items-center justify-center">
                <Stethoscope size={22} />
              </div>
              <h3 className="text-base font-bold text-white">Human-in-the-Loop Review</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Built-in clinician verification workflow empowering doctors to review, confirm, or override AI staging before report export.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Explainable AI Showcase */}
      <section className="py-24 px-6 bg-[#07111F] text-white border-t border-[#1E2E48]">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#38BDF8] font-mono">
              EXPLAINABLE AI ENGINE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Transparent Decision Attribution
            </h2>
            <p className="text-sm text-slate-300">
              Grad-CAM visualizes deep convolutional feature activations directly on retinal anatomy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#101B2D] border border-[#1E2E48] p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#162338] text-[#38BDF8] flex items-center justify-center">
                <Activity size={20} />
              </div>
              <h3 className="text-sm font-bold text-white">Target Layer Gradients</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Gradients of predicted ICDR score $y^c$ are computed with respect to final convolutional block feature activations (`res5b_relu` / `layer4[-1]`).
              </p>
            </div>

            <div className="bg-[#101B2D] border border-[#1E2E48] p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#162338] text-[#38BDF8] flex items-center justify-center">
                <Layers size={20} />
              </div>
              <h3 className="text-sm font-bold text-white">Global Average Pooling</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Importance weights $\alpha_k^c$ quantify the contribution of each convolutional feature map towards the final diabetic retinopathy grade.
              </p>
            </div>

            <div className="bg-[#101B2D] border border-[#1E2E48] p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#162338] text-[#38BDF8] flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <h3 className="text-sm font-bold text-white">Biomarker Localization</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                A weighted forward activation map is passed through ReLU rectification to isolate only features with a positive diagnostic influence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Clinical Decision Governance (Human-in-the-Loop) */}
      <section className="py-24 px-6 border-t border-[#1E2E48] bg-[#0B1424]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#38BDF8] font-mono">
              RESPONSIBLE CLINICAL GOVERNANCE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Clinician in the Loop. <br />
              <span className="text-slate-400">AI as Decision Support, Not the Judge.</span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every automated recommendation generated by NetraScan is subject to mandatory clinician review. Ophthalmologists can confirm, override with diagnostic notes, or escalate directly to tertiary vitreoretinal care.
            </p>
            <div className="space-y-3">
              {[
                'Full audit trail recording clinician ID, timestamp, and modification rationale',
                'Dual verification for high-risk Grade 3 (Severe) and Grade 4 (Proliferative) scans',
                'Printable medical-grade PDF and HTML clinical summaries with physician signature',
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs text-slate-300">
                  <CheckCircle2 size={16} className="text-[#38BDF8] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="p-6 rounded-2xl bg-[#101B2D] border border-[#1E2E48] shadow-dark-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1E2E48]">
                <div className="flex items-center gap-2">
                  <Stethoscope size={16} className="text-[#38BDF8]" />
                  <span className="text-xs font-bold text-white">Diagnostic Verification Console</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                  VERIFIED AUDIT
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-[#162338] border border-[#1E2E48]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    AI Recommendation
                  </span>
                  <div className="text-sm font-bold text-white mt-1">Grade 2: Moderate NPDR</div>
                  <span className="text-[11px] text-[#38BDF8] font-mono">Confidence: 92.4%</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0EA5E9]/10 border border-[#0EA5E9]/30">
                  <span className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-wider block">
                    Clinician Staging
                  </span>
                  <div className="text-sm font-bold text-white mt-1">Grade 2: Confirmed</div>
                  <span className="text-[11px] text-slate-300">Dr. Arvind Sen, MD</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#162338] text-xs text-slate-300 font-mono leading-relaxed border border-[#1E2E48]">
                &quot;Multiple microaneurysms and hard exudates confirmed in posterior pole. Referral issued for optical coherence tomography (OCT) macular edema evaluation.&quot;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Enterprise Security & Privacy */}
      <section className="py-20 px-6 border-t border-[#1E2E48] bg-[#07111F]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#0B1424] border border-[#1E2E48] space-y-3">
            <Lock size={20} className="text-[#38BDF8]" />
            <h3 className="text-sm font-bold text-white">HIPAA & GDPR Ready</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              In-memory inference pipeline with zero permanent patient image retention without consent. All temporary files auto-sanitized post-analysis.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-[#0B1424] border border-[#1E2E48] space-y-3">
            <Database size={20} className="text-[#38BDF8]" />
            <h3 className="text-sm font-bold text-white">EHR / PACS Interoperable</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Standardized JSON schemas and DICOM-compatible clinical HTML exports ready for seamless hospital records integration.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-[#0B1424] border border-[#1E2E48] space-y-3">
            <Zap size={20} className="text-[#38BDF8]" />
            <h3 className="text-sm font-bold text-white">Sub-30s Low-Latency Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Engineered for high-volume district hospital screening camps and tele-ophthalmology outreach vans.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Final Call to Action */}
      <section className="py-24 px-6 border-t border-[#1E2E48] bg-gradient-to-b from-[#0B1424] to-[#07111F] text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Accelerate Retinopathy Triage with Clinical AI
          </h2>
          <p className="text-base text-slate-300 max-w-2xl mx-auto">
            Experience explainable AI screening with real-time Grad-CAM attribution and human-in-the-loop governance.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/screening"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] hover:from-[#1D4ED8] hover:to-[#0284C7] text-white font-bold text-sm shadow-glow-blue flex items-center gap-2 transition"
            >
              <span>Launch Screening Workstation</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/dashboard"
              className="px-8 py-4 rounded-xl bg-[#101B2D] border border-[#1E2E48] hover:border-[#38BDF8] text-white font-bold text-sm transition"
            >
              View Clinical Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Professional Footer */}
      <footer className="border-t border-[#1E2E48] py-12 px-6 bg-[#07111F] text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <NetraScanLogo size="sm" showText={true} showTagline={false} variant="dark" />
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Explainable Diabetic Retinopathy Screening System</span>
          </div>
          <div className="flex items-center gap-6 text-slate-400">
            <Link to="/screening" className="hover:text-white transition">
              Workstation
            </Link>
            <Link to="/explainability" className="hover:text-white transition">
              Explainability
            </Link>
            <Link to="/model-performance" className="hover:text-white transition">
              Telemetry
            </Link>
            <Link to="/system-health" className="hover:text-white transition">
              System Health
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
