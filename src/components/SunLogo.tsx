
interface SunLogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function SunLogo({ size = 'md', className = '' }: SunLogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Sun center circle */}
        <circle
          cx="16"
          cy="16"
          r="8"
          fill="currentColor"
          className="text-sun-500"
        />
        
        {/* Alternating rays - short and long */}
        {/* Top ray (long) */}
        <line
          x1="16"
          y1="2"
          x2="16"
          y2="6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-sun-600"
        />
        
        {/* Top-right ray (short) */}
        <line
          x1="24.5"
          y1="7.5"
          x2="22.5"
          y2="9.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-sun-600"
        />
        
        {/* Right ray (long) */}
        <line
          x1="30"
          y1="16"
          x2="26"
          y2="16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-sun-600"
        />
        
        {/* Bottom-right ray (short) */}
        <line
          x1="24.5"
          y1="24.5"
          x2="22.5"
          y2="22.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-sun-600"
        />
        
        {/* Bottom ray (long) */}
        <line
          x1="16"
          y1="30"
          x2="16"
          y2="26"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-sun-600"
        />
        
        {/* Bottom-left ray (short) */}
        <line
          x1="7.5"
          y1="24.5"
          x2="9.5"
          y2="22.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-sun-600"
        />
        
        {/* Left ray (long) */}
        <line
          x1="2"
          y1="16"
          x2="6"
          y2="16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-sun-600"
        />
        
        {/* Top-left ray (short) */}
        <line
          x1="7.5"
          y1="7.5"
          x2="9.5"
          y2="9.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-sun-600"
        />
      </svg>
    </div>
  )
}
