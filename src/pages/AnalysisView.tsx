import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { SolarAnalysis } from '../types'

export default function AnalysisView() {
  const { analyses, deleteAnalysis, clearAllAnalyses } = useAnalysisStore()
  const [selectedAnalysis, setSelectedAnalysis] = useState<SolarAnalysis | null>(null)

  const handleDeleteAnalysis = (id: string) => {
    if (confirm('Are you sure you want to delete this analysis?')) {
      deleteAnalysis(id)
      if (selectedAnalysis?.id === id) {
        setSelectedAnalysis(null)
      }
    }
  }

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all analyses?')) {
      clearAllAnalyses()
      setSelectedAnalysis(null)
    }
  }

  const formatDate = (date: Date | string) => {
    try {
      // Convert string to Date if needed
      const dateObj = typeof date === 'string' ? new Date(date) : date
      
      // Check if date is valid
      if (!dateObj || isNaN(dateObj.getTime())) {
        return 'Invalid date'
      }
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj)
    } catch (error) {
      console.error('Date formatting error:', error)
      return 'Invalid date'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-sun-600 to-sun-800 bg-clip-text text-transparent">
            Saved Analyses
          </h1>
          <p className="text-neutral-600 mt-2 text-lg">
            View and manage your solar potential analyses
          </p>
        </div>
        
        {analyses.length > 0 && (
          <button
            onClick={handleClearAll}
            className="btn-accent"
          >
            Clear All
          </button>
        )}
      </div>

      {analyses.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-32 h-32 bg-sun-gradient rounded-full flex items-center justify-center mx-auto mb-6 shadow-warm">
            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-neutral-800 mb-3">No analyses yet</h3>
          <p className="text-neutral-600 mb-8 text-lg">Run your first solar potential analysis to get started.</p>
          <Link to="/" className="btn-primary text-lg px-8 py-4">
            Start Analysis
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Analysis List */}
          <div className="lg:col-span-1">
            <div className="space-y-3">
              {analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className={`card cursor-pointer transition-all duration-300 ${
                    selectedAnalysis?.id === analysis.id
                      ? 'ring-2 ring-sun-400 bg-sun-50 shadow-warm'
                      : 'hover:shadow-warm hover:scale-105'
                  }`}
                  onClick={() => setSelectedAnalysis(analysis)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-neutral-800 text-lg">
                      Analysis #{analysis.id.slice(-6)}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteAnalysis(analysis.id)
                      }}
                      className="text-neutral-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="text-sm text-neutral-600 space-y-2">
                    <p className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-sun-400 rounded-full"></span>
                      <span>Center: {analysis.center.lat.toFixed(4)}, {analysis.center.lng.toFixed(4)}</span>
                    </p>
                    <p className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-earth-400 rounded-full"></span>
                      <span>Radius: {analysis.radius} km</span>
                    </p>
                    <p className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-sky-400 rounded-full"></span>
                      <span>Results: {analysis.results.length} locations</span>
                    </p>
                    <p className="text-xs text-neutral-500 mt-2">
                      Created: {formatDate(analysis.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Analysis Details */}
          <div className="lg:col-span-2">
            {selectedAnalysis ? (
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-sun-600 to-sun-800 bg-clip-text text-transparent">
                    Analysis Results
                  </h2>
                  <Link
                    to="/"
                    className="btn-primary"
                    state={{ 
                      center: selectedAnalysis.center,
                      radius: selectedAnalysis.radius,
                      results: selectedAnalysis.results
                    }}
                  >
                    View on Map
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-sun-50 rounded-3xl p-6 border border-sun-200">
                    <h3 className="font-bold text-sun-800 mb-4 text-lg">Analysis Details</h3>
                    <div className="space-y-3 text-sm text-neutral-700">
                      <p className="flex items-center space-x-3">
                        <span className="w-2 h-2 bg-sun-500 rounded-full"></span>
                        <span><span className="font-medium">Center:</span> {selectedAnalysis.center.lat.toFixed(4)}, {selectedAnalysis.center.lng.toFixed(4)}</span>
                      </p>
                      <p className="flex items-center space-x-3">
                        <span className="w-2 h-2 bg-earth-500 rounded-full"></span>
                        <span><span className="font-medium">Radius:</span> {selectedAnalysis.radius} km</span>
                      </p>
                      <p className="flex items-center space-x-3">
                        <span className="w-2 h-2 bg-sky-500 rounded-full"></span>
                        <span><span className="font-medium">Completed:</span> {formatDate(selectedAnalysis.completedAt)}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-earth-50 rounded-3xl p-6 border border-earth-200">
                    <h3 className="font-bold text-earth-800 mb-4 text-lg">Summary</h3>
                    <div className="space-y-3 text-sm text-neutral-700">
                      <p className="flex items-center space-x-3">
                        <span className="w-2 h-2 bg-sun-500 rounded-full"></span>
                        <span><span className="font-medium">Total locations:</span> {selectedAnalysis.results.length}</span>
                      </p>
                      <p className="flex items-center space-x-3">
                        <span className="w-2 h-2 bg-earth-500 rounded-full"></span>
                        <span><span className="font-medium">Best score:</span> {Math.max(...selectedAnalysis.results.map(r => r.score)).toFixed(1)}</span>
                      </p>
                      <p className="flex items-center space-x-3">
                        <span className="w-2 h-2 bg-sky-500 rounded-full"></span>
                        <span><span className="font-medium">Avg. Wh/day:</span> {(selectedAnalysis.results.reduce((sum, r) => sum + r.estimatedKwhPerDay, 0) / selectedAnalysis.results.length * 1000).toFixed(0)}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-sun-600 to-sun-800 bg-clip-text text-transparent mb-6">
                    Top Results
                  </h3>
                  <div className="space-y-4">
                    {selectedAnalysis.results.map((result) => (
                      <div key={result.rank} className="bg-white/90 backdrop-blur-sm border border-sun-200 rounded-3xl p-6 hover:shadow-warm transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-sun-gradient text-white rounded-full flex items-center justify-center font-bold text-lg shadow-warm">
                              {result.rank}
                            </div>
                            <div>
                              <p className="font-bold text-neutral-800 text-lg">
                                {result.coordinates.lat.toFixed(4)}, {result.coordinates.lng.toFixed(4)}
                              </p>
                              <div className="flex items-center space-x-4 mt-1">
                                <p className="text-sm text-neutral-600 flex items-center space-x-2">
                                  <span className="w-2 h-2 bg-sun-500 rounded-full"></span>
                                  <span>Score: {result.score.toFixed(1)}</span>
                                </p>
                                <p className="text-sm text-neutral-600 flex items-center space-x-2">
                                  <span className="w-2 h-2 bg-earth-500 rounded-full"></span>
                                  <span>Est. {(result.estimatedKwhPerDay * 1000).toFixed(0)} Wh/day</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card text-center py-16">
                <div className="w-20 h-20 bg-sun-gradient rounded-full flex items-center justify-center mx-auto mb-6 shadow-warm">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-neutral-800 mb-3">Select an analysis</h3>
                <p className="text-neutral-600 text-lg">Choose an analysis from the list to view detailed results.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
