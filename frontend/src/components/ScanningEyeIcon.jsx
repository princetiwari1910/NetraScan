import React from "react";

/**
 * ScanningEyeIcon - Premium Medical AI Retinal Scanning Logo Icon
 * Features:
 * - Stylized geometric human eye contour
 * - Retinal scan concentric targeting rings
 * - Retinal vessel/neural diagnostic arc patterns
 * - Subtle animated scanning beam & telemetry nodes
 * - Fully responsive vector SVG with prefers-reduced-motion support
 */
export function ScanningEyeIcon({
  size = 24,
  className = "",
  animated = true,
  ariaLabel = "NetraScan AI Retinal Scanner Logo",
  style = {},
}) {
  const uniqueId = React.useId().replace(/:/g, "_");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`netrascan-scanning-eye ${animated ? "is-animated" : ""} ${className}`}
      aria-label={ariaLabel}
      role="img"
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0,
        ...style,
      }}
    >
      <defs>
        {/* Outer Eye Gradient */}
        <linearGradient
          id={`eyeOutlineGrad_${uniqueId}`}
          x1="10"
          y1="50"
          x2="90"
          y2="50"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>

        {/* Retinal Iris Core Gradient */}
        <radialGradient
          id={`irisRadial_${uniqueId}`}
          cx="50"
          cy="50"
          r="26"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="45%" stopColor="#0369A1" />
          <stop offset="85%" stopColor="#075985" />
          <stop offset="100%" stopColor="#0C4A6E" />
        </radialGradient>

        {/* Scanning Laser Beam Gradient */}
        <linearGradient
          id={`scanBeamGrad_${uniqueId}`}
          x1="18"
          y1="50"
          x2="82"
          y2="50"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
          <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
        </linearGradient>

        {/* Glow Filter for Scanning Laser */}
        <filter id={`scanGlow_${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <style>{`
        @keyframes netrascanScanSweep {
          0% {
            transform: translateY(-8px);
            opacity: 0.3;
          }
          50% {
            transform: translateY(8px);
            opacity: 0.95;
          }
          100% {
            transform: translateY(-8px);
            opacity: 0.3;
          }
        }

        @keyframes netrascanRadarPulse {
          0%, 100% {
            transform: scale(0.96);
            opacity: 0.55;
          }
          50% {
            transform: scale(1.04);
            opacity: 0.95;
          }
        }

        @keyframes netrascanNodeBlink {
          0%, 100% { opacity: 0.4; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.25); }
        }

        .netrascan-scanning-eye.is-animated .eye-scan-line {
          animation: netrascanScanSweep 3.2s ease-in-out infinite;
          transform-origin: center;
        }

        .netrascan-scanning-eye.is-animated .eye-radar-ring {
          animation: netrascanRadarPulse 2.8s ease-in-out infinite;
          transform-origin: 50px 50px;
        }

        .netrascan-scanning-eye.is-animated .eye-node-dot-1 {
          animation: netrascanNodeBlink 2.4s ease-in-out infinite;
          transform-origin: 50px 24px;
        }

        .netrascan-scanning-eye.is-animated .eye-node-dot-2 {
          animation: netrascanNodeBlink 2.4s ease-in-out 1.2s infinite;
          transform-origin: 75px 50px;
        }

        @media (prefers-reduced-motion: reduce) {
          .netrascan-scanning-eye.is-animated .eye-scan-line,
          .netrascan-scanning-eye.is-animated .eye-radar-ring,
          .netrascan-scanning-eye.is-animated .eye-node-dot-1,
          .netrascan-scanning-eye.is-animated .eye-node-dot-2 {
            animation: none !important;
          }
        }
      `}</style>

      {/* ================= 1. OUTER EYE APERTURE (STYLIZED CONTOUR) ================= */}
      {/* Top Eyelid Arc */}
      <path
        d="M8 50C18 24 40 16 50 16C60 16 82 24 92 50"
        stroke={`url(#eyeOutlineGrad_${uniqueId})`}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Bottom Eyelid Arc */}
      <path
        d="M8 50C18 76 40 84 50 84C60 84 82 76 92 50"
        stroke={`url(#eyeOutlineGrad_${uniqueId})`}
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Optical Precision Corner Brackets */}
      <path
        d="M5 45L8 50L5 55"
        stroke="#38BDF8"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <path
        d="M95 45L92 50L95 55"
        stroke="#38BDF8"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />

      {/* ================= 2. RETINAL IRIS & CHOROID FIELD ================= */}
      <circle
        cx="50"
        cy="50"
        r="25"
        fill={`url(#irisRadial_${uniqueId})`}
        stroke="#0284C7"
        strokeWidth="2"
      />

      {/* Retinal Concentric Radar Rings */}
      <circle
        cx="50"
        cy="50"
        r="20"
        stroke="#38BDF8"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        opacity="0.75"
        className="eye-radar-ring"
      />
      <circle
        cx="50"
        cy="50"
        r="14"
        stroke="#7DD3FC"
        strokeWidth="1.2"
        strokeDasharray="2 3"
        opacity="0.6"
      />

      {/* Retinal Micro-Vascular & Neural Biomarker Arcs */}
      <path
        d="M38 56C42 52 46 54 49 50M35 44C40 46 44 43 47 48M62 44C58 46 55 42 53 47M64 56C59 53 56 55 53 51"
        stroke="#38BDF8"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* ================= 3. CENTRAL FOVEAL PUPIL ================= */}
      <circle
        cx="50"
        cy="50"
        r="8"
        fill="#07111F"
        stroke="#38BDF8"
        strokeWidth="1.5"
      />
      {/* Specular Optic Reflection */}
      <circle
        cx="47.5"
        cy="47.5"
        r="2"
        fill="#FFFFFF"
        opacity="0.95"
      />

      {/* ================= 4. ACTIVE AI SCANNING LASER BEAM ================= */}
      <g className="eye-scan-line" filter={`url(#scanGlow_${uniqueId})`}>
        {/* Horizontal Laser Sweep Wave */}
        <line
          x1="18"
          y1="50"
          x2="82"
          y2="50"
          stroke={`url(#scanBeamGrad_${uniqueId})`}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Scan Center Flare */}
        <circle
          cx="50"
          cy="50"
          r="2.5"
          fill="#38BDF8"
          opacity="0.9"
        />
      </g>

      {/* ================= 5. AI DIAGNOSTIC TELEMETRY NODES ================= */}
      <circle
        cx="50"
        cy="24"
        r="2.5"
        fill="#38BDF8"
        className="eye-node-dot-1"
      />
      <line
        x1="50"
        y1="24"
        x2="50"
        y2="30"
        stroke="#38BDF8"
        strokeWidth="1"
        opacity="0.65"
      />

      <circle
        cx="75"
        cy="50"
        r="2.5"
        fill="#2DD4BF"
        className="eye-node-dot-2"
      />
      <line
        x1="70"
        y1="50"
        x2="75"
        y2="50"
        stroke="#2DD4BF"
        strokeWidth="1"
        opacity="0.65"
      />
    </svg>
  );
}

export default ScanningEyeIcon;
