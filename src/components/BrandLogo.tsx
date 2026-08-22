import React from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  size = "md", 
  showTagline = false,
  onClick
}) => {
  const iconContainerSizes = {
    sm: "w-8 h-8 rounded-xl p-1",
    md: "w-9 h-9 md:w-10 md:h-10 rounded-xl p-1.5",
    lg: "w-12 h-12 rounded-2xl p-2",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl md:text-2xl",
    lg: "text-2xl md:text-3xl",
  };

  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-3 group cursor-pointer select-none"
      title="skimm. - Nachrichten in Perfektion"
    >
      {/* Icon Badge */}
      <div className="relative">
        {/* Glow halo behind icon */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 opacity-50 blur-md group-hover:opacity-90 group-hover:scale-105 transition-all duration-300" />
        
        <div className={`relative ${iconContainerSizes[size]} bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-400/40 shadow-xl flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105`}>
          {/* Shimmer light effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
          
          {/* Custom Stylized Logo SVG Mark */}
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full text-white relative z-10 drop-shadow-md"
          >
            {/* Layer 1: Back Card */}
            <rect
              x="6"
              y="5"
              width="16"
              height="20"
              rx="3"
              fill="url(#skimm_grad_back)"
              fillOpacity="0.7"
            />
            
            {/* Layer 2: Front Folded Speed Card with Newspaper Lines */}
            <path
              d="M10 9C10 7.89543 10.8954 7 12 7H24C25.1046 7 26 7.89543 26 9V21C26 22.1046 25.1046 23 24 23H12C10.8954 23 10 22.1046 10 21V9Z"
              fill="url(#skimm_grad_front)"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="0.8"
            />

            {/* Newspaper headlines / lines */}
            <rect x="13" y="10" width="8" height="2" rx="1" fill="#FFFFFF" />
            <rect x="13" y="14" width="10" height="1.5" rx="0.75" fill="#C7D2FE" />
            <rect x="13" y="17.5" width="7" height="1.5" rx="0.75" fill="#A5B4FC" opacity="0.8" />

            {/* AI Sparkle Gem on the right top corner */}
            <circle cx="22" cy="11" r="1.8" fill="#FCD34D" className="animate-pulse" />

            <defs>
              <linearGradient id="skimm_grad_back" x1="6" y1="5" x2="22" y2="25" gradientUnits="userSpaceOnUse">
                <stop stopColor="#312E81" />
                <stop offset="1" stopColor="#4338CA" />
              </linearGradient>
              <linearGradient id="skimm_grad_front" x1="10" y1="7" x2="26" y2="23" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366F1" />
                <stop offset="0.5" stopColor="#4F46E5" />
                <stop offset="1" stopColor="#3730A3" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <div className="flex items-center">
          <span className={`${textSizes[size]} font-black tracking-tight text-white font-display leading-none group-hover:text-indigo-200 transition-colors`}>
            skimm
          </span>
          {/* Animated Glowing Accent Dot */}
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 group-hover:bg-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.9)] ml-0.5 transition-all duration-300 animate-pulse" />
        </div>
        {showTagline && (
          <span className="text-[9.5px] font-mono tracking-widest uppercase text-indigo-300/80 font-bold mt-0.5">
            Intelligence Stream
          </span>
        )}
      </div>
    </div>
  );
};
