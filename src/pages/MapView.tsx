import { useState, useCallback } from 'react'
import { useUIStore } from '../store/useUIStore'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { SolarPotentialAnalyzer } from '../utils/solarCalculations'
import { AnalysisInputs, SolarAnalysis } from '../types'
import Map from '../components/Map'
import Sidebar from '../components/Sidebar'

export default function MapView() {
  const { analysisProgress, setAnalysisProgress, setCurrentAnalysis, isPickingLocation } = useUIStore()
  const { addAnalysis } = useAnalysisStore()
  
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentResults, setCurrentResults] = useState<Array<{
    rank: number
    coordinates: { lat: number; lng: number }
    score: number
    kwhPerDay: number
  }>>([])

  const handleAnalyze = useCallback(async (inputs: AnalysisInputs) => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setCurrentResults([])

    try {
      // Simulate progress updates
      let currentProgress = 0
      const progressInterval = setInterval(() => {
        currentProgress += Math.random() * 10
        if (currentProgress >= 90) {
          clearInterval(progressInterval)
          setAnalysisProgress(90)
        } else {
          setAnalysisProgress(currentProgress)
        }
      }, 200)

      // Run solar analysis
      const results = await SolarPotentialAnalyzer.analyzeSolarPotential(
        { lat: inputs.latitude, lng: inputs.longitude },
        inputs.radius,
        inputs.urbanPenalty
      )

      clearInterval(progressInterval)
      setAnalysisProgress(100)

      // Format results with ranks
      const rankedResults = results.map((result, index) => ({
        rank: index + 1,
        coordinates: result.coordinates,
        score: result.score,
        kwhPerDay: result.kwhPerDay
      }))

      setCurrentResults(rankedResults)

      // Create analysis record
      const analysis: SolarAnalysis = {
        id: `analysis_${Date.now()}`,
        center: { lat: inputs.latitude, lng: inputs.longitude },
        radius: inputs.radius,
        results: rankedResults.map(r => ({
          rank: r.rank,
          coordinates: r.coordinates,
          score: r.score,
          estimatedKwhPerDay: r.kwhPerDay
        })),
        createdAt: new Date(),
        completedAt: new Date()
      }

      setCurrentAnalysis(analysis)
      addAnalysis(analysis)

    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [setAnalysisProgress, setCurrentAnalysis, addAnalysis])

  const handleClear = useCallback(() => {
    setCurrentResults([])
    setAnalysisProgress(0)
    setCurrentAnalysis(null)
  }, [setAnalysisProgress, setCurrentAnalysis])

  return (
    <div className="flex h-screen">
      <Sidebar
        onAnalyze={handleAnalyze}
        onClear={handleClear}
        isAnalyzing={isAnalyzing}
        progress={analysisProgress}
        results={currentResults}
      />
      
      <div className="flex-1 relative">
        <Map results={currentResults} />
        
        {isPickingLocation && (
          <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-3xl p-4 shadow-warm border border-sun-200">
            <div className="flex items-center space-x-3 text-sun-600">
              <div className="w-3 h-3 bg-sun-500 rounded-full animate-pulse-slow" />
              <span className="font-medium">Click on the map to set the center point</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
