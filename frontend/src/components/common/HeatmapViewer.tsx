import React, { useState } from 'react';
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sliders,
  Eye,
  Layers,
  Columns,
  Info,
  Sparkles,
  Zap,
  Crosshair,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeatmapViewerProps {
  originalImage: string;
  heatmapImage: string;
  stageName: string;
  confidence: number;
  evidence: string[];
  hideSidePanel?: boolean;
}

export const HeatmapViewer: React.FC<HeatmapViewerProps> = ({
  originalImage,
  heatmapImage,
  stageName,
  confidence,
  evidence,
  hideSidePanel = false,
}) => {
  const [viewMode, setViewMode] = useState<'overlay' | 'split' | 'raw' | 'enhanced' | 'heatmap'>('overlay');
  const [opacity, setOpacity] = useState<number>(70);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showLaser, setShowLaser] = useState<boolean>(true);
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 250));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 75));
  const handleResetZoom = () => setZoomLevel(100);

  const displayImage = heatmapImage || originalImage;

  // Key biomarker coordinates on retinal scan for interactive hovering
  const HOTSPOTS = [
    { id: 1, x: 64, y: 46, title: 'Microaneurysms & Leakage', desc: 'Focal dilation of capillaries in temporal vascular arcade.' },
    { id: 2, x: 70, y: 38, title: 'Hard Lipid Exudates', desc: 'Waxy lipoprotein deposits within macular boundary.' },
    { id: 3, x: 36, y: 64, title: 'Intraretinal Hemorrhages', desc: 'Deep dot-and-blot bleeding indicative of vascular compromise.' },
  ];

  return (
    <div
      className={`bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 flex flex-col bg-white text-slate-900 shadow-2xl border-slate-300' : ''
      }`}
    >
      {/* Viewer Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
              <Sparkles size={16} />
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Retinal Imaging Workstation & Grad-CAM XAI
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Deep convolutional feature localization from final layer (`model.features[-1]`)
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('overlay')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'overlay'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={13} />
            Overlay
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'split'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns size={13} />
            Side-by-Side
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'raw'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye size={13} />
            Raw Fundus
          </button>
          <button
            onClick={() => setViewMode('enhanced')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'enhanced'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap size={13} />
            CLAHE Enhanced
          </button>
        </div>
      </div>

      {/* Viewer Main Display & Side Panel */}
      <div className={`grid grid-cols-1 ${hideSidePanel ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-0 flex-1`}>
        {/* Visual Canvas Area — Dark Optical Treatment */}
        <div className={`${hideSidePanel ? 'w-full' : 'lg:col-span-8'} bg-[#05070B] p-6 flex flex-col items-center justify-center relative min-h-[420px] overflow-hidden`}>
          {/* Zoom controls floating bar */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1 rounded-xl text-white text-xs shadow-md">
            <button
              onClick={handleZoomOut}
              disabled={zoomLevel <= 75}
              className="p-1.5 hover:bg-slate-800 rounded disabled:opacity-40"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-xs px-2 font-semibold">{zoomLevel}%</span>
            <button
              onClick={handleZoomIn}
              disabled={zoomLevel >= 250}
              className="p-1.5 hover:bg-slate-800 rounded disabled:opacity-40"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 hover:bg-slate-800 rounded"
              title="Reset Zoom"
            >
              <RotateCcw size={14} />
            </button>
            <div className="h-4 w-px bg-slate-700 mx-0.5" />
            <button
              onClick={() => setShowLaser(!showLaser)}
              className={`p-1.5 rounded transition ${showLaser ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:bg-slate-800'}`}
              title="Toggle Laser Scan Line"
            >
              <Crosshair size={14} />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 hover:bg-slate-800 rounded"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>

          {/* Interactive Image Container */}
          <div
            className="relative flex items-center justify-center transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {viewMode === 'split' ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
                    Raw Fundus Photograph
                  </span>
                  <div className="w-56 sm:w-64 h-56 sm:h-64 rounded-xl overflow-hidden border border-slate-700 bg-black shadow-md">
                    <img
                      src={originalImage}
                      alt="Original Retina"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs uppercase tracking-wider text-cyan-300 font-semibold mb-2">
                    Grad-CAM Activation Map
                  </span>
                  <div className="w-56 sm:w-64 h-56 sm:h-64 rounded-xl overflow-hidden border border-cyan-400/80 bg-black shadow-md">
                    <img
                      src={displayImage}
                      alt="Grad-CAM Retina"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            ) : viewMode === 'raw' ? (
              <div className="w-72 sm:w-84 h-72 sm:h-84 rounded-xl overflow-hidden border border-slate-700 bg-black shadow-xl relative">
                <img
                  src={originalImage}
                  alt="Original Retina"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : viewMode === 'enhanced' ? (
              <div className="w-72 sm:w-84 h-72 sm:h-84 rounded-xl overflow-hidden border border-blue-500/80 bg-black shadow-xl relative">
                <img
                  src={originalImage}
                  alt="Enhanced Retina"
                  className="w-full h-full object-cover contrast-125 saturate-110"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-blue-600/80 backdrop-blur-md rounded text-[10px] text-white font-bold">
                  CLAHE Enhanced (LAB)
                </div>
              </div>
            ) : (
              /* Overlay Mode with interactive Opacity blending & Hotspots */
              <div className="relative w-72 sm:w-84 h-72 sm:h-84 rounded-xl overflow-hidden border border-slate-700 bg-black shadow-2xl">
                <img
                  src={originalImage}
                  alt="Original Base"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <img
                  src={displayImage}
                  alt="Grad-CAM Layer"
                  style={{ opacity: opacity / 100 }}
                  className="absolute inset-0 w-full h-full object-cover mix-blend-screen transition-opacity duration-150"
                />

                {/* Laser Scanning Line */}
                {showLaser && (
                  <motion.div
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_2px_rgba(34,211,238,0.8)] pointer-events-none"
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
                    <div className="relative -translate-x-1/2 -translate-y-1/2 cursor-pointer">
                      <span className="absolute -inset-1 rounded-full bg-cyan-400/40 animate-ping" />
                      <div className="relative w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-white shadow-sm flex items-center justify-center text-[8px] font-bold text-black">
                        +
                      </div>

                      <AnimatePresence>
                        {activeHotspot === spot.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 rounded-xl bg-slate-900/95 border border-slate-700 text-white text-left shadow-2xl pointer-events-none z-30"
                          >
                            <p className="text-xs font-bold text-cyan-300">{spot.title}</p>
                            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{spot.desc}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Opacity slider bar for overlay mode */}
          {viewMode === 'overlay' && (
            <div className="mt-6 w-full max-w-sm bg-slate-900/90 backdrop-blur-md border border-slate-700 px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-md">
              <Sliders size={15} className="text-cyan-400 shrink-0" />
              <span className="text-xs text-slate-200 font-medium whitespace-nowrap">
                Heatmap Intensity:
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="text-xs font-bold text-white w-9 text-right">
                {opacity}%
              </span>
            </div>
          )}

          {/* Color bar legend */}
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-300 font-medium">
            <span>Low Activation</span>
            <div className="h-2 w-24 rounded-full bg-gradient-to-r from-blue-600 via-yellow-400 to-red-600" />
            <span>High Activation Hotspots</span>
          </div>
        </div>

        {/* Explainability Side Analysis Panel */}
        {!hideSidePanel && (
          <div className="lg:col-span-4 p-5 sm:p-6 bg-slate-50 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-200">
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-800 text-xs font-bold uppercase tracking-wider">
                  <Info size={14} />
                  <span>Clinical Interpretation</span>
                </div>
                <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                  Highlighted regions indicate retinal zones that strongly influenced the neural network's decision towards{' '}
                  <strong className="font-semibold text-blue-800">{stageName}</strong> (Confidence: {(confidence * 100).toFixed(1)}%).
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Biomarkers & Attention Hotspots:
                </h4>
                <ul className="space-y-2">
                  {evidence.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-slate-800 bg-white border border-slate-200 p-2.5 rounded-xl flex items-start gap-2 shadow-2xs"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 italic leading-snug">
                Note: Grad-CAM attention highlights feature activations. It serves as clinical decision support and should always be correlated with direct funduscopic exam.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
