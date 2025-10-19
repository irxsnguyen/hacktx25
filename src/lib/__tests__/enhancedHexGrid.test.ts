import { AnalysisEngine, SolarCandidate } from '../analysisEngine'

describe('Enhanced Hexagonal Grid Algorithm', () => {
  it('should rank candidates by maximum kWh/day with deterministic tie-breakers', () => {
    const candidates: SolarCandidate[] = [
      { coordinates: { lat: 30.0, lng: -97.0 }, score: 15.2, kwhPerDay: 1.52 },
      { coordinates: { lat: 30.1, lng: -97.1 }, score: 18.7, kwhPerDay: 1.87 },
      { coordinates: { lat: 30.2, lng: -97.2 }, score: 12.3, kwhPerDay: 1.23 },
      { coordinates: { lat: 30.3, lng: -97.3 }, score: 22.1, kwhPerDay: 2.21 },
      { coordinates: { lat: 30.4, lng: -97.4 }, score: 16.8, kwhPerDay: 1.68 },
      { coordinates: { lat: 30.5, lng: -97.5 }, score: 19.5, kwhPerDay: 1.95 },
      { coordinates: { lat: 30.6, lng: -97.6 }, score: 14.1, kwhPerDay: 1.41 },
      { coordinates: { lat: 30.7, lng: -97.7 }, score: 25.3, kwhPerDay: 2.53 },
      { coordinates: { lat: 30.8, lng: -97.8 }, score: 17.9, kwhPerDay: 1.79 },
      { coordinates: { lat: 30.9, lng: -97.9 }, score: 13.7, kwhPerDay: 1.37 }
    ]
    
    const results = AnalysisEngine.rankTopLocations(candidates, {
      maxResults: 5,
      minSpacingMeters: 100,
      minScore: 0,
      minKwhPerDay: 0
    })
    
    // Should return top 5 by kWh/day
    expect(results).toHaveLength(5)
    
    // Should be sorted by kWh/day (descending)
    const kwhValues = results.map(r => r.kwhPerDay)
    expect(kwhValues).toEqual([2.53, 2.21, 1.95, 1.87, 1.79])
    
    // Should have the highest kWh/day values
    expect(results[0].kwhPerDay).toBe(2.53) // Best
    expect(results[4].kwhPerDay).toBe(1.79) // 5th best
  })
  
  it('should apply spacing constraints to prevent clustering', () => {
    // Create candidates that are very close together
    const candidates: SolarCandidate[] = [
      { coordinates: { lat: 30.0, lng: -97.0 }, score: 20.0, kwhPerDay: 2.0 },
      { coordinates: { lat: 30.0001, lng: -97.0001 }, score: 19.9, kwhPerDay: 1.99 }, // Very close to first
      { coordinates: { lat: 30.1, lng: -97.1 }, score: 18.0, kwhPerDay: 1.8 },
      { coordinates: { lat: 30.2, lng: -97.2 }, score: 17.0, kwhPerDay: 1.7 },
      { coordinates: { lat: 30.3, lng: -97.3 }, score: 16.0, kwhPerDay: 1.6 },
      { coordinates: { lat: 30.4, lng: -97.4 }, score: 15.0, kwhPerDay: 1.5 }
    ]
    
    const results = AnalysisEngine.rankTopLocations(candidates, {
      maxResults: 3,
      minSpacingMeters: 100, // 100m minimum spacing
      minScore: 0,
      minKwhPerDay: 0
    })
    
    // Should respect spacing constraints
    expect(results).toHaveLength(3)
    
    // Check that no two results are too close
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const distance = AnalysisEngine['calculateDistance'](results[i].coordinates, results[j].coordinates)
        expect(distance * 1000).toBeGreaterThanOrEqual(100) // At least 100m apart
      }
    }
  })
  
  it('should handle tie-breaking deterministically', () => {
    // Create candidates with identical kWh/day but different scores/coordinates
    const candidates: SolarCandidate[] = [
      { coordinates: { lat: 30.0, lng: -97.0 }, score: 15.0, kwhPerDay: 2.0 },
      { coordinates: { lat: 30.1, lng: -97.1 }, score: 16.0, kwhPerDay: 2.0 }, // Higher score
      { coordinates: { lat: 30.2, lng: -97.2 }, score: 14.0, kwhPerDay: 2.0 }, // Lower score
      { coordinates: { lat: 29.9, lng: -97.0 }, score: 15.0, kwhPerDay: 2.0 }, // Same score, lower lat
      { coordinates: { lat: 30.0, lng: -97.1 }, score: 15.0, kwhPerDay: 2.0 }  // Same score/lat, higher lng
    ]
    
    const results = AnalysisEngine.rankTopLocations(candidates, {
      maxResults: 5,
      minSpacingMeters: 50, // Smaller spacing for this test
      minScore: 0,
      minKwhPerDay: 0
    })
    
    // Should be deterministic - same order every time
    expect(results).toHaveLength(5)
    
    // First should be the one with highest score (16.0)
    expect(results[0].score).toBe(16.0)
    
    // Second should be one of the 15.0 scores, but deterministically chosen
    expect(results[1].score).toBe(15.0)
  })
  
  it('should filter out invalid candidates', () => {
    const candidates: SolarCandidate[] = [
      { coordinates: { lat: 30.0, lng: -97.0 }, score: 20.0, kwhPerDay: 2.0 },
      { coordinates: { lat: 30.1, lng: -97.1 }, score: NaN, kwhPerDay: 1.5 }, // Invalid score
      { coordinates: { lat: 30.2, lng: -97.2 }, score: 18.0, kwhPerDay: 1.8 },
      { coordinates: { lat: 30.3, lng: -97.3 }, score: 15.0, kwhPerDay: -1.0 }, // Negative kWh
      { coordinates: { lat: 30.4, lng: -97.4 }, score: 16.0, kwhPerDay: 1.6 },
      { coordinates: { lat: 30.5, lng: -97.5 }, score: Infinity, kwhPerDay: 1.7 } // Invalid score
    ]
    
    const results = AnalysisEngine.rankTopLocations(candidates, {
      maxResults: 5,
      minSpacingMeters: 100,
      minScore: 0,
      minKwhPerDay: 0
    })
    
    // Should only return valid candidates
    expect(results).toHaveLength(3) // Only 3 valid candidates
    
    // All results should have valid scores and kWh values
    results.forEach(result => {
      expect(Number.isFinite(result.score)).toBe(true)
      expect(Number.isFinite(result.kwhPerDay)).toBe(true)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.kwhPerDay).toBeGreaterThanOrEqual(0)
    })
  })
  
  it('should provide comprehensive validation metrics', () => {
    const candidates: SolarCandidate[] = [
      { coordinates: { lat: 30.0, lng: -97.0 }, score: 20.0, kwhPerDay: 2.0 },
      { coordinates: { lat: 30.1, lng: -97.1 }, score: 18.0, kwhPerDay: 1.8 },
      { coordinates: { lat: 30.2, lng: -97.2 }, score: 16.0, kwhPerDay: 1.6 },
      { coordinates: { lat: 30.3, lng: -97.3 }, score: 14.0, kwhPerDay: 1.4 },
      { coordinates: { lat: 30.4, lng: -97.4 }, score: 12.0, kwhPerDay: 1.2 }
    ]
    
    const results = AnalysisEngine.rankTopLocations(candidates, {
      maxResults: 5,
      minSpacingMeters: 100,
      minScore: 0,
      minKwhPerDay: 0
    })
    
    const validation = AnalysisEngine.validateResults(results)
    
    expect(validation.isValid).toBe(true)
    expect(validation.metrics.totalResults).toBe(5)
    expect(validation.metrics.maxKwhPerDay).toBe(2.0)
    expect(validation.metrics.minKwhPerDay).toBe(1.2)
    expect(validation.metrics.averageKwhPerDay).toBe(1.6)
    expect(validation.metrics.spatialDistribution).toBeGreaterThan(0)
  })
})
