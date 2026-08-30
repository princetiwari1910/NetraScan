import React from 'react';

interface NetraScanLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
  variant?: 'light' | 'dark';
}

export const NetraScanLogo: React.FC<NetraScanLogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = false,
  className = '',
  variant = 'light',
}) => {
  const iconDimensions = {
    sm: 28,
    md: 34,
    lg: 42,
    xl: 52,
  }[size];

  const textSize = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
  }[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Precision Medical AI Eye / Retinal Scan Vector Icon */}
      <svg
        width={iconDimensions}
        height={iconDimensions}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id="netraGradRetina" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E8752F" />
            <stop offset="60%" stopColor="#C85A20" />
            <stop offset="100%" stopColor="#181A1F" />
          </linearGradient>
          <linearGradient id="netraGradPupil" x1="16" y1="16" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F4A261" />
            <stop offset="100%" stopColor="#E8752F" />
          </linearGradient>
        </defs>

        {/* Shield / Enclosure */}
        <rect
          width="48"
          height="48"
          rx="12"
          fill={variant === 'dark' ? '#111318' : '#FAF9F7'}
          stroke={variant === 'dark' ? '#22252B' : '#E5E2DA'}
          strokeWidth="1.5"
        />
        
        {/* Retinal Optical Grid */}
        <circle cx="24" cy="24" r="16" stroke={variant === 'dark' ? '#32363F' : '#EFECE6'} strokeWidth="1" strokeDasharray="2 3" opacity="0.8" />
        <line x1="24" y1="8" x2="24" y2="12" stroke="#E8752F" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="24" y1="36" x2="24" y2="40" stroke="#E8752F" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="8" y1="24" x2="12" y2="24" stroke="#E8752F" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="36" y1="24" x2="40" y2="24" stroke="#E8752F" strokeWidth="1.5" strokeLinecap="round" />

        {/* Eye Contour */}
        <path
          d="M10 24C14.5 17 19.5 13.5 24 13.5C28.5 13.5 33.5 17 38 24C33.5 31 28.5 34.5 24 34.5C19.5 34.5 14.5 31 10 24Z"
          stroke="url(#netraGradRetina)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Foveal Center & Pupil */}
        <circle cx="24" cy="24" r="5.5" fill="url(#netraGradPupil)" />
        <circle cx="24" cy="24" r="2" fill="#FFFFFF" />

        {/* Neural Network Micro-Nodes */}
        <circle cx="17" cy="21" r="1.3" fill="#E8752F" />
        <circle cx="31" cy="22" r="1.3" fill="#E8752F" />
        <circle cx="28" cy="28" r="1.1" fill="#0891B2" />

        {/* Connecting Synaptic Arcs */}
        <path d="M17 21L21.5 24M24 24L31 22M24 24L28 28" stroke="#F4A261" strokeWidth="0.9" strokeLinecap="round" opacity="0.85" />
      </svg>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-black tracking-tight ${textSize} ${
              variant === 'dark' ? 'text-white' : 'text-[#17191D]'
            }`}>
              Netra<span className="text-[#E8752F]">Scan</span>
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-bold uppercase tracking-wider ${
              variant === 'dark'
                ? 'bg-[#22252B] text-[#F4A261] border border-[#32363F]'
                : 'bg-[#FCF4EF] text-[#C85A20] border border-[#F6D7C3]'
            }`}>
              Clinical AI
            </span>
          </div>
          {showTagline && (
            <span className="text-[11px] font-medium text-[#5F6368] tracking-wide mt-0.5">
              Explainable Retinal Decision Support
            </span>
          )}
        </div>
      )}
    </div>
  );
};
