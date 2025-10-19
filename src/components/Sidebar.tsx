import { useEffect } from 'react'
import { useUIStore } from '../store/useUIStore'
import { useDebounce } from '../hooks/useDebounce'
import { AnalysisInputs } from '../types'
import AnalysisStatusBar from './AnalysisStatusBar'

interface SidebarProps {
  onAnalyze: (inputs: AnalysisInputs) => void
  onClear: () => void
  isAnalyzing: boolean
  progress: number
  results?: Array<{ 
    rank: number; 
    coordinates: { lat: number; lng: number }; 
    score: number; 
    kwhPerDay: number;
    landPrice?: number;
    powerPerCost?: number;
  }>
}

export default function Sidebar({ onAnalyze, onClear, isAnalyzing, progress, results }: SidebarProps) {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    inputLatitude,
    inputLongitude,
    inputRadius,
    inputUrbanPenalty,
    isPickingLocation,
    validation,
    analysisProgress,
    exclusionConfig,
    setInputLatitude,
    setInputLongitude,
    setInputRadius,
    setInputUrbanPenalty,
    setPickingLocation,
    syncInputsToMap,
    clampInputs,
    setExclusionEnabled,
    setExclusionBuffer,
    setExclusionIncludeWater,
    setExclusionIncludeSensitive
  } = useUIStore()

  // Debounced values for syncing to map
  const debouncedLatitude = useDebounce(inputLatitude, 250)
  const debouncedLongitude = useDebounce(inputLongitude, 250)
  const debouncedRadius = useDebounce(inputRadius, 250)

  // Sync debounced values to map
  useEffect(() => {
    syncInputsToMap()
  }, [debouncedLatitude, debouncedLongitude, debouncedRadius, syncInputsToMap])

  const handleInputChange = (field: keyof AnalysisInputs, value: string | number | boolean) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value as number
    
    switch (field) {
      case 'latitude':
        setInputLatitude(numValue)
        break
      case 'longitude':
        setInputLongitude(numValue)
        break
      case 'radius':
        setInputRadius(numValue)
        break
      case 'urbanPenalty':
        setInputUrbanPenalty(value as boolean)
        break
    }
  }

  const handleInputBlur = () => {
    clampInputs()
    syncInputsToMap()
  }

  const handlePickLocation = () => {
    setPickingLocation(!isPickingLocation)
  }

  const handleAnalyze = () => {
    const inputs: AnalysisInputs = {
      latitude: inputLatitude,
      longitude: inputLongitude,
      radius: inputRadius,
      urbanPenalty: inputUrbanPenalty
    }
    onAnalyze(inputs)
  }

  const handleClear = () => {
    setInputLatitude(30.2672)
    setInputLongitude(-97.7431)
    setInputRadius(5)
    setInputUrbanPenalty(false)
    onClear()
  }

  return (
    <div className={`sidebar h-full transition-all duration-300 ${
      sidebarCollapsed ? 'w-16' : 'w-80'
    }`}>
      {!sidebarCollapsed && (
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-sun-gradient rounded-full flex items-center justify-center shadow-warm">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-sun-600 to-sun-800 bg-clip-text text-transparent">
                Solar Analysis
              </h2>
            </div>
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="p-2 hover:bg-sun-100 rounded-2xl transition-all duration-300 hover:shadow-soft"
            >
              <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Inputs */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={inputLatitude}
                onChange={(e) => handleInputChange('latitude', e.target.value)}
                onBlur={handleInputBlur}
                className={`input-field ${!validation.latitude.isValid ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="30.2672"
              />
              {!validation.latitude.isValid && (
                <p className="text-red-500 text-xs mt-1">{validation.latitude.error}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={inputLongitude}
                onChange={(e) => handleInputChange('longitude', e.target.value)}
                onBlur={handleInputBlur}
                className={`input-field ${!validation.longitude.isValid ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="-97.7431"
              />
              {!validation.longitude.isValid && (
                <p className="text-red-500 text-xs mt-1">{validation.longitude.error}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Radius (km)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.1"
                max="100"
                value={inputRadius}
                onChange={(e) => handleInputChange('radius', e.target.value)}
                onBlur={handleInputBlur}
                className={`input-field ${!validation.radius.isValid ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="5"
              />
              {!validation.radius.isValid && (
                <p className="text-red-500 text-xs mt-1">{validation.radius.error}</p>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="urbanPenalty"
                checked={inputUrbanPenalty}
                onChange={(e) => handleInputChange('urbanPenalty', e.target.checked)}
                className="h-4 w-4 text-sun-500 focus:ring-sun-400 border-neutral-300 rounded"
              />
              <label htmlFor="urbanPenalty" className="text-sm text-neutral-700">
                Urban penalty
              </label>
            </div>

            {/* Exclusion Controls */}
            <div className="border-t border-neutral-200 pt-4">
              <h3 className="text-sm font-medium text-neutral-700 mb-3">Area Restrictions</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="excludeResidential"
                    checked={exclusionConfig.enabled}
                    onChange={(e) => setExclusionEnabled(e.target.checked)}
                    className="h-4 w-4 text-sun-500 focus:ring-sun-400 border-neutral-300 rounded"
                  />
                  <label htmlFor="excludeResidential" className="text-sm text-neutral-700">
                    Exclude Residential Areas (OSM)
                  </label>
                </div>

                {exclusionConfig.enabled && (
                  <div className="ml-7 space-y-3">
                    <div>
                      <label className="block text-xs text-neutral-600 mb-1">
                        Buffer Distance: {exclusionConfig.bufferMeters}m
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        step="10"
                        value={exclusionConfig.bufferMeters}
                        onChange={(e) => setExclusionBuffer(Number(e.target.value))}
                        className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="includeWater"
                          checked={exclusionConfig.includeWater}
                          onChange={(e) => setExclusionIncludeWater(e.target.checked)}
                          className="h-4 w-4 text-sun-500 focus:ring-sun-400 border-neutral-300 rounded"
                        />
                        <label htmlFor="includeWater" className="text-xs text-neutral-600">
                          Exclude water bodies
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="includeSensitive"
                          checked={exclusionConfig.includeSensitive}
                          onChange={(e) => setExclusionIncludeSensitive(e.target.checked)}
                          className="h-4 w-4 text-sun-500 focus:ring-sun-400 border-neutral-300 rounded"
                        />
                        <label htmlFor="includeSensitive" className="text-xs text-neutral-600">
                          Exclude sensitive areas
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handlePickLocation}
              className={`w-full py-3 px-4 rounded-2xl font-medium transition-all duration-300 ${
                isPickingLocation
                  ? 'bg-sky-100 text-sky-700 border-2 border-sky-400 shadow-sky'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:shadow-soft'
              }`}
            >
              {isPickingLocation ? 'Click on map to set center' : 'Pick on Map'}
            </button>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </button>

            <button
              onClick={handleClear}
              className="btn-secondary w-full"
            >
              Clear
            </button>
          </div>

          {/* Analysis Status Bar */}
          {analysisProgress && (
            <AnalysisStatusBar
              percentage={analysisProgress.percentage}
              status={analysisProgress.status}
              message={analysisProgress.message}
              className="mb-6"
            />
          )}

          {/* Results */}
          {results && results.length > 0 && (
            <div className="flex-1">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-sun-600 to-sun-800 bg-clip-text text-transparent mb-4">
                Top 5 Results
              </h3>
              <div className="space-y-3">
                {results.map((result) => (
                  <div key={result.rank} className="card hover:shadow-warm transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sun-600 text-lg">#{result.rank}</span>
                      <span className="text-xs text-neutral-500">
                        {result.coordinates.lat.toFixed(4)}, {result.coordinates.lng.toFixed(4)}
                      </span>
                    </div>
                    <div className="text-sm text-neutral-600 space-y-1">
                      <p className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-sun-400 rounded-full"></span>
                        <span>Score: {result.score.toFixed(1)}</span>
                      </p>
                      <p className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-earth-400 rounded-full"></span>
                        <span>Est. {result.kwhPerDay.toFixed(2)} kWh/m²/day</span>
                      </p>
                      {result.landPrice && (
                        <p className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-sky-400 rounded-full"></span>
                          <span>Land: ${result.landPrice.toFixed(0)}/m²</span>
                        </p>
                      )}
                      {result.powerPerCost && (
                        <p className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-neutral-500 rounded-full"></span>
                          <span>Efficiency: {result.powerPerCost.toFixed(3)} kWh/$/m²/day</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {sidebarCollapsed && (
        <div className="p-4 h-full flex flex-col items-center">
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="p-2 hover:bg-sun-100 rounded-2xl transition-all duration-300 hover:shadow-soft mb-4"
          >
            <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {isAnalyzing && (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-sun-500 border-t-transparent rounded-full animate-spin mb-2" />
              <span className="text-xs text-neutral-600 text-center">
                {Math.round(progress)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
