import React from 'react'

interface BrandProps {
  className?: string
}

export const Brand: React.FC<BrandProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Solarize Logo SVG */}
      <div className="w-12 h-12 bg-sun-gradient rounded-full flex items-center justify-center shadow-warm animate-sun-glow">
        <svg 
          className="w-8 h-8 text-white" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="6" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                fill="none" />
        </svg>
      </div>
      
      {/* Brand Text */}
      <div>
        <h1 className="text-2xl font-bold font-poppins bg-gradient-to-r from-sun-600 to-sun-800 bg-clip-text text-transparent">
          Solarize
        </h1>
        <p className="text-xs text-stone-500 font-inter">
          Solar Potential Analysis
        </p>
      </div>
    </div>
  )
}
