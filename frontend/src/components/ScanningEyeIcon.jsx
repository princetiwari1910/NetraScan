import React from "react";

/**
 * ScanningEyeIcon - Exact match of the NetraScan AI Retinal Scanner Symbol
 * 
 * Features:
 * - Crisp almond eye contour with tapered optical endpoints
 * - Cardinal crosshair reticle spikes (12, 3, 6, 9 o'clock)
 * - Faint circular radar tracking ring with orbital telemetry light nodes
 * - High-tech aperture iris with mechanical/optical radial tick segments
 * - Multi-stage concentric glowing cyan/blue laser lens rings
 * - Glowing white foveal laser sensor core with cyan lens flare
 */
export function ScanningEyeIcon({
  size = 24,
  className = "",
  animated = true,
  ariaLabel = "NetraScan Retinal Scanner",
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
      className={`netrascan-eye-scanner-exact ${animated ? "is-animated" : ""} ${className}`}
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
        {/* Glowing Center Pupil Radial Gradient */}
        <radialGradient
          id={`pupilGlow_${uniqueId}`}
          cx="50"
          cy="50"
          r="16"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#67E8F9" />
          <stop offset="55%" stopColor="#06B6D4" />
          <stop offset="85%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#082F49" />
        </radialGradient>

        {/* Outer Iris Track Gradient */}
        <radialGradient
          id={`irisRingGrad_${uniqueId}`}
          cx="50"
          cy="50"
          r="26"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#082F49" />
          <stop offset="60%" stopColor="#0E3B5A" />
          <stop offset="90%" stopColor="#155E75" />
          <stop offset="100%" stopColor="#06B6D4" />
        </radialGradient>

        {/* Center Optical Flare Filter */}
        <filter id={`coreFlare_${uniqueId}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Subtle Lens Bloom Filter */}
        <filter id={`bloom_${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <style>{`
        @keyframes netraLaserPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.95;
          }
          50% {
            transform: scale(1.06);
            opacity: 1;
            filter: drop-shadow(0 0 4px #38BDF8);
          }
        }
        @keyframes netraReticleSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .netrascan-eye-scanner-exact.is-animated .netra-iris-pulse {
          transform-origin: 50px 50px;
          animation: netraLaserPulse 3s ease-in-out infinite;
        }
        .netrascan-eye-scanner-exact.is-animated .netra-telemetry-dots {
          transform-origin: 50px 50px;
          animation: netraReticleSpin 20s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .netrascan-eye-scanner-exact.is-animated .netra-iris-pulse,
          .netrascan-eye-scanner-exact.is-animated .netra-telemetry-dots {
            animation: none;
          }
        }
      `}</style>

      {/* ================= 1. CIRCULAR RADAR RETICLE & TELEMETRY ================= */}
      {/* Background Target Circle */}
      <circle
        cx="50"
        cy="50"
        r="32"
        stroke="#7DD3FC"
        strokeWidth="1.2"
        strokeOpacity="0.4"
        strokeDasharray="2 4"
      />

      {/* Orbital Telemetry Nodes / Optical Flare Particles */}
      <g className="netra-telemetry-dots">
        <circle cx="74" cy="28" r="1.8" fill="#38BDF8" filter={`url(#bloom_${uniqueId})`} />
        <circle cx="74" cy="28" r="0.8" fill="#FFFFFF" />
        <circle cx="76" cy="68" r="1.4" fill="#38BDF8" opacity="0.8" />
        <circle cx="26" cy="70" r="1.2" fill="#38BDF8" opacity="0.6" />
      </g>

      {/* ================= 2. FOUR CARDINAL CROSSHAIR SPIKES ================= */}
      {/* Top Spike (12 o'clock) */}
      <line x1="50" y1="12" x2="50" y2="28" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
      {/* Bottom Spike (6 o'clock) */}
      <line x1="50" y1="72" x2="50" y2="88" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
      {/* Left Spike (9 o'clock) */}
      <line x1="12" y1="50" x2="28" y2="50" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
      {/* Right Spike (3 o'clock) */}
      <line x1="72" y1="50" x2="88" y2="50" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />

      {/* ================= 3. CRISP WHITE ALMOND EYE OUTLINE ================= */}
      <path
        d="M20 50C28 32 40 25 50 25C60 25 72 32 80 50C72 68 60 75 50 75C40 75 28 68 20 50Z"
        stroke="#FFFFFF"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#082842"
        fillOpacity="0.85"
      />

      {/* ================= 4. HIGH-TECH MULTI-STAGE APERTURE IRIS ================= */}
      <g className="netra-iris-pulse">
        {/* Outer Iris Dark Base */}
        <circle
          cx="50"
          cy="50"
          r="20.5"
          fill={`url(#irisRingGrad_${uniqueId})`}
          stroke="#00E5FF"
          strokeWidth="1.5"
        />

        {/* Concentric Calibration Ring */}
        <circle
          cx="50"
          cy="50"
          r="18"
          stroke="#38BDF8"
          strokeWidth="0.8"
          strokeDasharray="1.5 2"
          opacity="0.85"
        />

        {/* Optical Aperture Radial Gear Ticks */}
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * 360) / 16;
          const rad = (angle * Math.PI) / 180;
          const x1 = 50 + 17.5 * Math.cos(rad);
          const y1 = 50 + 17.5 * Math.sin(rad);
          const x2 = 50 + 15 * Math.cos(rad);
          const y2 = 50 + 15 * Math.sin(rad);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#A5F3FC"
              strokeWidth="1.1"
              strokeLinecap="round"
              opacity="0.9"
            />
          );
        })}

        {/* Middle Cyan Laser Ring */}
        <circle
          cx="50"
          cy="50"
          r="14"
          stroke="#00E5FF"
          strokeWidth="1.8"
          opacity="0.95"
        />

        {/* Dark Separation Ring */}
        <circle
          cx="50"
          cy="50"
          r="11.5"
          fill="#041829"
          stroke="#38BDF8"
          strokeWidth="1"
        />

        {/* Inner Laser Ring */}
        <circle
          cx="50"
          cy="50"
          r="8.5"
          stroke="#00E5FF"
          strokeWidth="1.4"
        />

        {/* Central Glowing Sensor Pupil Core */}
        <circle
          cx="50"
          cy="50"
          r="6.5"
          fill={`url(#pupilGlow_${uniqueId})`}
          filter={`url(#coreFlare_${uniqueId})`}
        />

        {/* Bright White Specular Aperture Center */}
        <circle
          cx="50"
          cy="50"
          r="2.8"
          fill="#FFFFFF"
        />
        <circle
          cx="48.8"
          cy="48.8"
          r="1.2"
          fill="#FFFFFF"
          opacity="0.9"
        />
      </g>
    </svg>
  );
}

export default ScanningEyeIcon;
