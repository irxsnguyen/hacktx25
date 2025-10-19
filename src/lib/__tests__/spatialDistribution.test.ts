import { describe, it, expect } from 'vitest'
import { AnalysisEngine, SolarCandidate } from '../analysisEngine'

describe('Spatial Distribution Fix', () => {
  it('should not cluster results in southern region when using distance-based tie-breaking', () => {
    // Create candidates with identical scores but different positions
    const center = { lat: 30.2672, lng: -97.7431 } // Austin, TX
    const candidates: SolarCandidate[] = [
      // Northern candidates
      { coordinates: { lat: 30.3, lng: -97.7 }, score: 20.0, kwhPerDay: 2.0 },
      { coordinates: { lat: 30.31, lng: -97.71 }, score: 20.0, kwhPerDay: 2.0 },
      { coordinates: { lat: 30.32, lng: -97.72 }, score: 20.0, kwhPerDay: 2.0 },
      
      // Central candidates
      { coordinates: { lat: 30.27, lng: -97.74 }, score: 20.0, kwhPerDay: 2.0 },
      { coordinates: { lat: 30.28, lng: -97.75 }, score: 20.0, kwhPerDay: 2.0 },
      
      // Southern candidates
      { coordinates: { lat: 30.2, lng: -97.7 }, score: 20.0, kwhPerDay: 2.0 },
      { coordinates: { lat: 30.21, lng: -97.71 }, score: 20.0, kwhPerDay: 2.0 },
      { coordinates: { lat: 30.22, lng: -97.72 }, score: 20.0, kwhPerDay: 2.0 },
    ]
    
    const results = AnalysisEngine.rankTopLocations(candidates, {
      maxResults: 5,
      minSpacingMeters: 50, // Small spacing for this test
      minScore: 0,
      minKwhPerDay: 0
    }, center)
    
    // Should have 5 results
    expect(results).toHaveLength(5)
    
    // Results should not all be in the southern region
    const latitudes = results.map(r => r.coordinates.lat)
    const minLat = Math.min(...latitudes)
    const maxLat = Math.max(...latitudes)
    
    // Should have some spread in latitude (not all clustered in south)
    expect(maxLat - minLat).toBeGreaterThan(0.01) // At least 0.01 degrees spread
    
    // Should prefer points closer to center when scores are equal
    const distances = results.map(r => {
      const latDiff = r.coordinates.lat - center.lat
      const lngDiff = r.coordinates.lng - center.lng
      return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff)
    })
    
    // First result should be closer to center than later results
    for (let i = 1; i < results.length; i++) {
      expect(distances[0]).toBeLessThanOrEqual(distances[i])
    }
  })
  
  it('should still prefer higher scores over distance when scores differ', () => {
    const center = { lat: 30.2672, lng: -97.7431 }
    const candidates: SolarCandidate[] = [
      // High score, far from center
      { coordinates: { lat: 30.4, lng: -97.8 }, score: 25.0, kwhPerDay: 2.5 },
      // Lower score, close to center
      { coordinates: { lat: 30.27, lng: -97.74 }, score: 15.0, kwhPerDay: 1.5 },
      { coordinates: { lat: 30.28, lng: -97.75 }, score: 15.0, kwhPerDay: 1.5 },
    ]
    
    const results = AnalysisEngine.rankTopLocations(candidates, {
      maxResults: 2,
      minSpacingMeters: 50,
      minScore: 0,
      minKwhPerDay: 0
    }, center)
    
    // Should prefer the high score even though it's farther
    expect(results[0].score).toBe(25.0)
    expect(results[0].coordinates.lat).toBe(30.4)
  })
})
