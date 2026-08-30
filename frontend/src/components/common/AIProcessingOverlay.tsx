import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Sparkles, Brain, Eye, Cpu } from 'lucide-react';

interface AIProcessingOverlayProps {
  imagePreview: string;
}

const PIPELINE_STEPS = [
  { id: 'val', label: 'Image metadata & format validation', icon: Eye },
  { id: 'qual', label: 'OpenCV Laplacian blur & clarity gatekeeper', icon: Eye },
  { id: 'clahe', label: 'CLAHE microvascular contrast enhancement (LAB)', icon: Sparkles },
  { id: 'eff', label: 'MATLAB ResNet-18 deep convolutional inference', icon: Brain },
  { id: 'cam', label: 'Grad-CAM (res5b_relu) activation localization', icon: Cpu },
  { id: 'rep', label: 'Structuring ICDR stage & clinical findings', icon: CheckCircle2 },
];

export const AIProcessingOverlay: React.FC<AIProcessingOverlayProps> = ({
  imagePreview,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < PIPELINE_STEPS.length - 1 ? prev + 1 : prev));
    }, 550);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white border border-[#EAE9E4] rounded-2xl p-6 sm:p-8 text-[#17191D] shadow-warm-md overflow-hidden relative">
      <div className="flex items-center justify-between pb-6 border-b border-[#F0EFEA] relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#FCF4EF] text-[#E8752F] border border-[#F6D7C3]">
            <Brain size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#17191D] flex items-center gap-2">
              Neural Triage & Analysis in Progress
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FCF4EF] text-[#C85A20] border border-[#F6D7C3]">
                MATLAB ResNet-18
              </span>
            </h3>
            <p className="text-xs text-[#5F6368] mt-0.5">
              Evaluating fundus photograph across 5 ICDR Diabetic Retinopathy stages
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#C85A20] bg-[#FCF4EF] px-3 py-1.5 rounded-xl border border-[#F6D7C3]">
          <Loader2 size={14} className="animate-spin text-[#E8752F]" />
          <span>Processing Pipeline...</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-6 items-center relative z-10">
        {/* Animated Scanning Retina Canvas — Deep Dark Optical Treatment */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl overflow-hidden border-2 border-[#E8752F] bg-[#05070B] shadow-2xl">
            <img
              src={imagePreview}
              alt="Scanning Fundus"
              className="w-full h-full object-cover opacity-90"
            />
            {/* Animated Cyan Laser Scanning Line */}
            <motion.div
              animate={{
                top: ['0%', '100%', '0%'],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#67C7D4] to-transparent shadow-[0_0_12px_3px_rgba(103,199,212,0.8)]"
            />
            {/* Scanning Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e8752f15_1px,transparent_1px),linear-gradient(to_bottom,#e8752f15_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

            {/* Corner Markers */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#E8752F]" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#E8752F]" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#E8752F]" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#E8752F]" />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-[#C85A20] mt-3 flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#E8752F] animate-ping" />
            Active Optical Feature Extraction
          </span>
        </div>

        {/* Step-by-Step Progress Pipeline */}
        <div className="md:col-span-7 space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-[#5F6368] mb-2">
            Clinical Processing Pipeline
          </div>
          {PIPELINE_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const Icon = step.icon;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isCompleted
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : isCurrent
                    ? 'bg-[#FCF4EF] border-[#F6D7C3] text-[#17191D] shadow-warm-xs font-semibold'
                    : 'bg-[#FAF9F7] border-[#EAE9E4] text-[#8A8F98]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : isCurrent
                        ? 'bg-[#FAECE0] text-[#E8752F]'
                        : 'bg-[#EFECE6] text-[#8A8F98]'
                    }`}
                  >
                    <Icon size={14} />
                  </div>
                  <span className="text-xs">{step.label}</span>
                </div>

                <div>
                  {isCompleted ? (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  ) : isCurrent ? (
                    <Loader2 size={16} className="text-[#E8752F] animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-[#E5E2DA]" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
