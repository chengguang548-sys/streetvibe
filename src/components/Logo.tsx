import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'monogram' | 'stacked' | 'horizontal';
  color?: 'original' | 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Logo({ 
  className = '', 
  variant = 'horizontal', 
  color = 'original',
  size = 'md' 
}: LogoProps) {
  
  // High fidelity vector paths representing the stylized "SV" Monogram
  // Uses beautiful, eye-safe premium gradients as seen in the user's uploaded asset.
  const gradientIdS = `logo-grad-s-${color}`;
  const gradientIdV = `logo-grad-v-${color}`;

  // Dimensions setup Based on Size
  const sizeMap = {
    sm: { monogram: 'w-7 h-5', horizontal: 'h-6 xs:h-7 sm:h-8', stacked: 'w-16 h-16', wordmarkOnly: 'h-6 xs:h-7' },
    md: { monogram: 'w-10 h-7', horizontal: 'h-8 xs:h-10 sm:h-11', stacked: 'w-24 h-24', wordmarkOnly: 'h-8 xs:h-10' },
    lg: { monogram: 'w-14 h-10', horizontal: 'h-11 xs:h-14 sm:h-16', stacked: 'w-36 h-36', wordmarkOnly: 'h-11 xs:h-14' },
    xl: { monogram: 'w-20 h-15', horizontal: 'h-16 xs:h-22 sm:h-24', stacked: 'w-48 h-48', wordmarkOnly: 'h-16 xs:h-22' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Colors mapping for stylized words and vectors
  const streetColor = color === 'light' ? '#FFFFFF' : '#061114';
  const vibeColor = color === 'light' ? '#B8E1F0' : (color === 'dark' ? '#061114' : '#38BDF8');
  const taglineColor = color === 'light' ? 'rgba(255,255,255,0.7)' : '#485152';
  const lineColor = color === 'light' ? 'rgba(255,255,255,0.4)' : '#061114';

  // Render original gradients or solid styles for the iconic Monogram
  const renderDefs = () => {
    return (
      <defs>
        {/* Stylized premium light-blue to white gradient for the "S" ribbon */}
        <linearGradient id={gradientIdS} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#DCEFF7" />
          <stop offset="100%" stopColor="#B8E1F0" />
        </linearGradient>
        
        {/* Dynamic sky-blue gradient for the "V" chevron */}
        <linearGradient id={gradientIdV} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B8E1F0" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
      </defs>
    );
  };

  const fillS = color === 'light' ? '#FFFFFF' : (color === 'dark' ? '#061114' : `url(#${gradientIdS})`);
  const fillV = color === 'light' ? '#FFFFFF' : (color === 'dark' ? '#061114' : `url(#${gradientIdV})`);

  // SV Monogram vector paths (Geometric futuristic curves matching the logo photo)
  const renderMonogram = (svgStyleClass: string) => (
    <svg 
      viewBox="0 0 160 100" 
      className={`${svgStyleClass} fill-none shrink-0`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {renderDefs()}
      <g transform="translate(5, 5)">
        {/* Stylized "S" Ribbon */}
        <path 
          d="M 108 10 
             L 54 10 
             C 32 10, 22 24, 22 41 
             C 22 58, 34 68, 54 68 
             L 86 68 
             C 94 68, 98 71, 98 76 
             C 98 81, 93 84, 85 84 
             L 10 84 
             L 16 74 
             L 85 74 
             C 89 74, 91 73, 91 71 
             C 91 69, 89 68, 85 68 
             L 54 68 
             C 42 68, 32 60, 32 48 
             C 32 36, 42 20, 54 20 
             L 114 20 
             Z" 
          fill={fillS} 
        />
        
        {/* Stylized "V" overlapping Chevron */}
        <path 
          d="M 76 29 
             L 96 29 
             L 112 68 
             L 128 29 
             L 148 29 
             L 120 90 
             L 104 90 
             Z" 
          fill={fillV} 
        />
      </g>
    </svg>
  );

  // Stylized Futuristic STREETVIBE Wordmark matching Image #2 exactly.
  // It is rendered with high precision curves, and standard equivalence-e "≡" characters.
  const renderWordmark = (svgStyleClass: string) => {
    // Letter positions (10 letters)
    const letterWidth = 32;
    const letterSpacing = 9;
    const getX = (index: number) => 9 + index * (letterWidth + letterSpacing);

    return (
      <svg
        viewBox="0 0 410 90"
        className={`${svgStyleClass} fill-none shrink-0`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 1. STREET Letters (White or Dark depending on theme) */}
        <g stroke={streetColor} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="miter">
          {/* S */}
          <path d={`M ${getX(0) + 24},12 H ${getX(0) + 6} V 28 H ${getX(0) + 24} V 44 H ${getX(0) + 5}`} />
          {/* T */}
          <path d={`M ${getX(1) + 2},12 H ${getX(1) + 30} M ${getX(1) + 16},12 V 44`} />
          {/* R */}
          <path d={`M ${getX(2) + 6},12 V 44 M ${getX(2) + 6},12 H ${getX(2) + 18} C ${getX(2) + 24},12 ${getX(2) + 26},16 ${getX(2) + 26},21 C ${getX(2) + 26},26 ${getX(2) + 24},28 ${getX(2) + 18},28 H ${getX(2) + 6} M ${getX(2) + 15},28 L ${getX(2) + 25},44`} />
          {/* E (Stripe ≡) */}
          <path d={`M ${getX(3) + 6},12 H ${getX(3) + 26} M ${getX(3) + 6},28 H ${getX(3) + 26} M ${getX(3) + 6},44 H ${getX(3) + 26}`} />
          {/* E (Stripe ≡) */}
          <path d={`M ${getX(4) + 6},12 H ${getX(4) + 26} M ${getX(4) + 6},28 H ${getX(4) + 26} M ${getX(4) + 6},44 H ${getX(4) + 26}`} />
          {/* T */}
          <path d={`M ${getX(5) + 2},12 H ${getX(5) + 30} M ${getX(5) + 16},12 V 44`} />
        </g>

        {/* 2. VIBE Letters (Blue gradient or sky blue color) */}
        <g stroke={vibeColor} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="miter">
          {/* V */}
          <path d={`M ${getX(6) + 4},12 L ${getX(6) + 16},44 L ${getX(6) + 28},12`} />
          {/* I */}
          <path d={`M ${getX(7) + 16},12 V 44`} />
          {/* B */}
          <path d={`M ${getX(8) + 6},12 V 44 M ${getX(8) + 6},12 H ${getX(8) + 19} C ${getX(8) + 24},12 ${getX(8) + 26},16 ${getX(8) + 26},20 C ${getX(8) + 26},24 ${getX(8) + 23},26 ${getX(8) + 19},26 H ${getX(8) + 6} M ${getX(8) + 6},26 H ${getX(8) + 20} C ${getX(8) + 25},26 ${getX(8) + 27},30 ${getX(8) + 27},35 C ${getX(8) + 27},40 ${getX(8) + 25},44 ${getX(8) + 20},44 H ${getX(8) + 6}`} />
          {/* E (Stripe ≡) */}
          <path d={`M ${getX(9) + 6},12 H ${getX(9) + 26} M ${getX(9) + 28},28 H ${getX(9) + 7} M ${getX(9) + 6},44 H ${getX(9) + 26}`} />
        </g>

        {/* 3. Horizontal Lines & Tagline */}
        <line x1="12" y1="70" x2="80" y2="70" stroke={lineColor} strokeWidth="1.6" />
        <line x1="330" y1="70" x2="398" y2="70" stroke={lineColor} strokeWidth="1.6" />
        
        <text 
          x="205" 
          y="74" 
          fontFamily="'Montserrat', 'Inter', sans-serif" 
          fontSize="10" 
          fontWeight="800" 
          letterSpacing="2.8" 
          textAnchor="middle" 
          fill={taglineColor}
        >
          THE PREMIUM CLOTHING STORE
        </text>
      </svg>
    );
  };

  if (variant === 'monogram') {
    return renderMonogram(currentSize.monogram + ' ' + className);
  }

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center justify-center text-center ${className}`}>
        {renderWordmark(currentSize.wordmarkOnly)}
      </div>
    );
  }

  // default / horizontal logo variant
  // This renders only the stunning custom wordmark with embedded tagline, matching the user's logo exactly!
  return (
    <div className={`flex items-center select-none ${className}`}>
      {renderWordmark(currentSize.horizontal)}
    </div>
  );
}
