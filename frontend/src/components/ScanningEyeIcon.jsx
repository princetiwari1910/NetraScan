import React from "react";

/**
 * ScanningEyeIcon - Futuristic Medical AI Retinal Scanner Logo Icon
 * 
 * Design Features:
 * - Sleek, aerodynamic eye contour with precision medical styling
 * - Concentric retinal targeting rings with optical reticle crosshairs
 * - Foveal center core with optical aperture
 * - Micro-calibrated retinal vascular / telemetry arcs
 * - Subtle precision laser scan sweep line
 * - Optimized for crisp rendering at 18px-24px inside the blue square container
 */
export function ScanningEyeIcon({
  size = 20,
  color = "currentColor",
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
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`netrascan-retinal-scanner-icon ${animated ? "is-animated" : ""} ${className}`}
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
        {/* Subtle Horizontal Laser Scan Beam Gradient */}
        <linearGradient
          id={`laserBeam_${uniqueId}`}
          x1="2"
          y1="12"
          x2="22"
          y2="12"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="25%" stopColor={color} stopOpacity="0.8" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="75%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>

        {/* Reticle Glow */}
        <filter id={`reticleGlow_${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <style>{`
        @keyframes scanSweepMotion {
          0% {
            transform: translateY(-3.5px);
            opacity: 0.2;
          }
          50% {
            transform: translateY(3.5px);
            opacity: 0.95;
          }
          100% {
            transform: translateY(-3.5px);
            opacity: 0.2;
          }
        }
        @keyframes reticlePulseMotion {
          0%, 100% {
            transform: scale(1);
            opacity: 0.85;
          }
          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }
        .netrascan-retinal-scanner-icon.is-animated .scanner-beam {
          animation: scanSweepMotion 2.4s ease-in-out infinite;
        }
        .netrascan-retinal-scanner-icon.is-animated .scanner-reticle-ring {
          transform-origin: 12px 12px;
          animation: reticlePulseMotion 3s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .netrascan-retinal-scanner-icon.is-animated .scanner-beam,
          .netrascan-retinal-scanner-icon.is-animated .scanner-reticle-ring {
            animation: none;
          }
        }
      `}</style>

      {/* 1. OUTER EYE CONTOUR */}
      <path
        d="M2.2 12C3.8 7.6 7.6 4.5 12 4.5C16.4 4.5 20.2 7.6 21.8 12C20.2 16.4 16.4 19.5 12 19.5C7.6 19.5 3.8 16.4 2.2 12Z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* 2. OPTICAL TARGETING CORNER RETICLES */}
      <path d="M12 2.5V4.2" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <path d="M12 19.8V21.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <path d="M1.2 12H2.8" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <path d="M21.2 12H22.8" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

      {/* 3. CONCENTRIC RETINAL SCAN RINGS (RETICLE) */}
      {/* Outer Iris Targeting Ring */}
      <circle
        cx="12"
        cy="12"
        r="5.5"
        stroke={color}
        strokeWidth="1.3"
        strokeDasharray="18 4"
        className="scanner-reticle-ring"
        opacity="0.9"
      />

      {/* Inner Pupil / Foveal Core */}
      <circle
        cx="12"
        cy="12"
        r="2.8"
        stroke={color}
        strokeWidth="1.4"
        fill={color}
        fillOpacity="0.25"
      />

      {/* 4. CENTRAL OPTICAL APERTURE / SCAN SENSOR POINT */}
      <circle
        cx="12"
        cy="12"
        r="1.1"
        fill="#FFFFFF"
      />

      {/* 5. RETINAL VASCULAR / TELEMETRY DIAGNOSTIC ARCS */}
      <path
        d="M8.5 9.5C9.5 8.6 10.7 8.2 12 8.2"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M15.5 14.5C14.5 15.4 13.3 15.8 12 15.8"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.75"
      />

      {/* 6. HORIZONTAL LASER SCANNING BEAM */}
      <g className="scanner-beam">
        <line
          x1="4.5"
          y1="12"
          x2="19.5"
          y2="12"
          stroke={`url(#laserBeam_${uniqueId})`}
          strokeWidth="1.2"
          strokeLinecap="round"
          filter={`url(#reticleGlow_${uniqueId})`}
        />
      </g>
    </svg>
  );
}

export default ScanningEyeIcon;
