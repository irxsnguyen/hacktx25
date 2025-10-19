import React from 'react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { useUIStore } from '../stores/useUIStore'
import { useAnalysisStore } from '../stores/useAnalysisStore'
import { useOptimization } from '../lib/hooks'

export const AnalysisPanel: React.FC = () => {
  const { selected, radiusKm, isValid } = useUIStore()
  const { addAnalysis } = useAnalysisStore()
  
  const { data, isLoading, error, refetch } = useOptimization({
    lat: selected?.lat || 0,
    lng: selected?.lng || 0,
    radiusKm
  })

  const handleAnalyze = () => {
    if (selected) {
      refetch()
    }
  }

  const handleSave = () => {
    if (data && selected) {
      addAnalysis({
        center: selected,
        radiusKm,
        resultSummary: data
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-800 mb-2">Solar Analysis</h2>
          <p className="text-stone-600 mb-6">
            Click on the map to select a location, then analyze solar potential
          </p>
          
          {!isValid && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-6">
              <p className="text-sky-700 text-sm">
                Please select a location on the map to begin analysis
              </p>
            </div>
          )}
          
          {isValid && (
            <div className="bg-earth-50 border border-earth-200 rounded-xl p-4 mb-6">
              <p className="text-earth-700 text-sm">
                Selected: {selected?.lat.toFixed(4)}, {selected?.lng.toFixed(4)}
              </p>
            </div>
          )}
          
          <Button 
            onClick={handleAnalyze}
            disabled={!isValid || isLoading}
            className="w-full mb-4 rounded-xl"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Solar Potential'}
          </Button>
        </div>
      </Card>

      {error ? (
        <Card className="bg-red-50 border-red-200 rounded-xl">
          <p className="text-red-700 text-sm">
            Error: Analysis failed
          </p>
        </Card>
      ) : null}

      {data && (
        <Card className="rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-stone-800">Top 5 Results</h3>
            <Button variant="secondary" onClick={handleSave} className="rounded-xl">
              Save Analysis
            </Button>
          </div>
          
          <div className="space-y-3">
            {data.bestSites.slice(0, 5).map((site, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 bg-sun-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-stone-800">
                      {site.lat.toFixed(4)}, {site.lng.toFixed(4)}
                    </p>
                    <p className="text-xs text-stone-500">Coordinates</p>
                  </div>
                </div>
                <span className="badge bg-sun-100 text-sun-800">
                  Score: {site.score.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
