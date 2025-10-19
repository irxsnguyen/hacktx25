import { describe, it, expect } from 'vitest'
import { SolarPotentialAnalyzer } from '../../utils/solarCalculations'

describe('Simple Top-5 Algorithm', () => {
  it('should return top 5 results by kWh/day', async () => {
    const center = { lat: 30.2672, lng: -97.7431 } // Austin, TX
    const radius = 2 // 2 km radius
    
    const results = await SolarPotentialAnalyzer.analyzeSolarPotential(center, radius, false)
    
    // Should have results
    expect(results.length).toBeGreaterThan(0)
    expect(results.length).toBeLessThanOrEqual(5)
    
    // Results should be sorted by kWh/day (descending)
    if (results.length > 1) {
      for (let i = 1; i < results.length; i++) {
        expect(results[i-1].kwhPerDay).toBeGreaterThanOrEqual(results[i].kwhPerDay)
      }
    }
  })
  
  it('should maintain minimum spacing between results', async () => {
    const center = { lat: 30.2672, lng: -97.7431 }
    const radius = 3
    
    const results = await SolarPotentialAnalyzer.analyzeSolarPotential(center, radius, false)
    
    if (results.length > 1) {
      // Check that no two results are too close together
      for (let i = 0; i < results.length; i++) {
        for (let j = i + 1; j < results.length; j++) {
          const distance = calculateDistance(results[i].coordinates, results[j].coordinates)
          expect(distance).toBeGreaterThan(0.4) // At least 400m apart
        }
      }
    }
  })
  
  it('should be deterministic for same inputs', async () => {
    const center = { lat: 30.2672, lng: -97.7431 }
    const radius = 1
    
    const results1 = await SolarPotentialAnalyzer.analyzeSolarPotential(center, radius, false)
    const results2 = await SolarPotentialAnalyzer.analyzeSolarPotential(center, radius, false)
    
    // Results should be identical (deterministic)
    expect(results1).toEqual(results2)
  })
  
  it('should handle different radii correctly', async () => {
    const center = { lat: 30.2672, lng: -97.7431 }
    
    const smallResults = await SolarPotentialAnalyzer.analyzeSolarPotential(center, 1, false)
    const largeResults = await SolarPotentialAnalyzer.analyzeSolarPotential(center, 5, false)
    
    // Both should produce results
    expect(smallResults.length).toBeGreaterThan(0)
    expect(largeResults.length).toBeGreaterThan(0)
    
    // Larger radius should potentially have more diverse results
    if (largeResults.length > 1) {
      const latitudes = largeResults.map(r => r.coordinates.lat)
      const longitudes = largeResults.map(r => r.coordinates.lng)
      
      const latSpread = Math.max(...latitudes) - Math.min(...latitudes)
      const lngSpread = Math.max(...longitudes) - Math.min(...longitudes)
      
      // Should have some geographic spread for larger radius
      expect(latSpread + lngSpread).toBeGreaterThan(0.001)
    }
  })
})

// Helper function to calculate distance between two coordinates
function calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
  const R = 6371 // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180
  const dLng = (point2.lng - point1.lng) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}
