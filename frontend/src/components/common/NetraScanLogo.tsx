import React from 'react';

interface NetraScanLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
  variant?: 'dark' | 'light';
  className?: string;
}

export const NetraScanLogo: React.FC<NetraScanLogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = false,
  variant = 'dark',
  className = '',
}) => {
  const iconDimensions = {
    sm: { size: 24, stroke: 1.8 },
    md: { size: 32, stroke: 2 },
    lg: { size: 40, stroke: 2.2 },
    xl: { size: 52, stroke: 2.4 },
  }[size];

  const textSizes = {
    sm: { title: 'text-sm', tag: 'text-[9px]' },
    md: { title: 'text-lg', tag: 'text-[10px]' },
    lg: { title: 'text-xl', tag: 'text-[11px]' },
    xl: { title: 'text-2xl', tag: 'text-xs' },
  }[size];

  const isDark = variant === 'dark';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Geometric Medical-AI Retinal Emblem */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          width={iconDimensions.size}
          height={iconDimensions.size}
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 group-hover:scale-105"
        >
          {/* Hexagonal/Circular Precision Target Background */}
          <rect width="44" height="44" rx="10" fill="url(#logo_bg_grad)" />
          <rect x="0.5" y="0.5" width="43" height="43" rx="9.5" stroke="url(#logo_border_grad)" strokeOpacity="0.6" />

          {/* Retinal Optical Outer Ring */}
          <circle cx="22" cy="22" r="14" stroke="#0EA5E9" strokeWidth="1.5" strokeDasharray="2 3" strokeOpacity="0.6" />

          {/* Precision Crosshair Ticks */}
          <line x1="22" y1="4" x2="22" y2="9" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
          <line x1="22" y1="35" x2="22" y2="40" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
          <line x1="4" y1="22" x2="9" y2="22" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
          <line x1="35" y1="22" x2="40" y2="22" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />

          {/* Stylized Eye & Neural Network Arch */}
          <path
            d="M 8 22 C 14 12, 30 12, 36 22 C 30 32, 14 32, 8 22 Z"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Inner Optical Pupil / Neural Center */}
          <circle cx="22" cy="22" r="6" fill="#0B1424" stroke="#22D3EE" strokeWidth="1.8" />
          <circle cx="22" cy="22" r="2.5" fill="#38BDF8" />

          {/* AI Clinical Diagnostic Hotspot (Subtle Orange Accent) */}
          <circle cx="27" cy="18" r="2" fill="#F97316" />
          <circle cx="27" cy="18" r="3.5" stroke="#F97316" strokeWidth="0.8" strokeOpacity="0.6" />

          <defs>
            <linearGradient id="logo_bg_grad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0B1424" />
              <stop offset="1" stopColor="#07111F" />
            </linearGradient>
            <linearGradient id="logo_border_grad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2563EB" />
              <stop offset="0.5" stopColor="#0EA5E9" />
              <stop offset="1" stopColor="#22D3EE" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Brand Text Hierarchy */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight ${textSizes.title} ${
                isDark ? 'text-white' : 'text-[#0B1424]'
              }`}
            >
              NETRA<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] to-[#2563EB]">SCAN</span>
            </span>
          </div>
          {showTagline && (
            <span
              className={`font-semibold tracking-widest uppercase ${textSizes.tag} ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Clinical AI Platform
            </span>
          )}
        </div>
      )}
    </div>
  );
};
