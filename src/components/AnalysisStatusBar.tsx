import React from 'react'

interface AnalysisStatusBarProps {
  percentage: number
  status: 'idle' | 'grid-generation' | 'irradiance-computation' | 'ranking' | 'complete'
  message: string
  className?: string
}

const AnalysisStatusBar: React.FC<AnalysisStatusBarProps> = ({
  percentage,
  status,
  message,
  className = ''
}) => {
  // Don't show anything when idle
  if (status === 'idle') {
    return null
  }

  const getStatusColor = () => {
    switch (status) {
      case 'grid-generation':
        return 'bg-sky-500'
      case 'irradiance-computation':
        return 'bg-sun-500'
      case 'ranking':
        return 'bg-earth-500'
      case 'complete':
        return 'bg-earth-600'
      default:
        return 'bg-neutral-400'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'grid-generation':
        return (
          <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        )
      case 'irradiance-computation':
        return (
          <div className="w-4 h-4 border-2 border-sun-500 border-t-transparent rounded-full animate-spin" />
        )
      case 'ranking':
        return (
          <div className="w-4 h-4 border-2 border-earth-500 border-t-transparent rounded-full animate-spin" />
        )
      case 'complete':
        return (
          <div className="w-4 h-4 bg-earth-600 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-neutral-200 shadow-soft ${className}`}>
      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-700">
            {status === 'complete' ? 'Analysis Complete!' : 'Analysis Progress'}
          </span>
          <span className="text-sm text-neutral-600 font-mono">
            {percentage}%
          </span>
        </div>
        
        {/* Progress Track */}
        <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ease-out ${getStatusColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Status Message */}
      <div className="flex items-center space-x-3">
        {getStatusIcon()}
        <div className="flex-1">
          <p className="text-sm text-neutral-700 font-medium">
            {message}
          </p>
          {status === 'complete' && (
            <p className="text-xs text-earth-600 mt-1">
              Results saved and ready to view
            </p>
          )}
        </div>
      </div>

      {/* Stage Indicators */}
      {status !== 'complete' && (
        <div className="mt-3 flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${status === 'grid-generation' ? 'bg-sky-500' : 'bg-neutral-300'}`} />
          <div className={`w-2 h-2 rounded-full ${status === 'irradiance-computation' ? 'bg-sun-500' : status === 'ranking' ? 'bg-sky-500' : 'bg-neutral-300'}`} />
          <div className={`w-2 h-2 rounded-full ${status === 'ranking' ? 'bg-earth-500' : 'bg-neutral-300'}`} />
          <div className="w-2 h-2 rounded-full bg-neutral-300" />
        </div>
      )}
    </div>
  )
}

export default AnalysisStatusBar
