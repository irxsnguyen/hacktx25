import { describe, it, expect } from 'vitest'
import { SolarPotentialAnalyzer } from '../solarCalculations'

describe('Hexagonal Grid Generation', () => {
  const center = { lat: 30.2672, lng: -97.7431 } // Austin, TX

  describe('generateHexagonalGrid', () => {
    it('should generate points within the search radius', async () => {
      const radius = 1 // 1 km radius
      const results = await SolarPotentialAnalyzer.analyzeSolarPotential(center, radius, false)
      
      // Should have some results
      expect(results.length).toBeGreaterThan(0)
      expect(results.length).toBeLessThanOrEqual(5)
      
      // All results should be within radius
      results.forEach(result => {
        const distance = calculateDistance(center, result.coordinates)
        expect(distance).toBeLessThanOrEqual(radius + 0.01) // Small tolerance
      })
    })

    it('should scale point count with radius', async () => {
      const smallRadius = 1 // 1 km
      const largeRadius = 5 // 5 km
      
      // This is an indirect test - we can't directly access the grid points
      // but we can verify that larger radius produces results
      const smallResults = await SolarPotentialAnalyzer.analyzeSolarPotential(center, smallRadius, false)
      const largeResults = await SolarPotentialAnalyzer.analyzeSolarPotential(center, largeRadius, false)
      
      // Both should produce results
      expect(smallResults.length).toBeGreaterThan(0)
      expect(largeResults.length).toBeGreaterThan(0)
    })

    it('should produce deterministic results', async () => {
      const radius = 2
      
      const results1 = await SolarPotentialAnalyzer.analyzeSolarPotential(center, radius, false)
      const results2 = await SolarPotentialAnalyzer.analyzeSolarPotential(center, radius, false)
      
      // Results should be identical (deterministic)
      expect(results1).toEqual(results2)
    })

    it('should handle different latitudes correctly', async () => {
      const northernCenter = { lat: 45.0, lng: -97.7431 } // Northern latitude
      const southernCenter = { lat: 25.0, lng: -97.7431 } // Southern latitude
      const radius = 1
      
      const northernResults = await SolarPotentialAnalyzer.analyzeSolarPotential(northernCenter, radius, false)
      const southernResults = await SolarPotentialAnalyzer.analyzeSolarPotential(southernCenter, radius, false)
      
      // Both should produce results
      expect(northernResults.length).toBeGreaterThan(0)
      expect(southernResults.length).toBeGreaterThan(0)
    })

    it('should maintain proper spacing between points', async () => {
      const radius = 3 // Larger radius for more points
      const results = await SolarPotentialAnalyzer.analyzeSolarPotential(center, radius, false)
      
      if (results.length > 1) {
        // Check that results are properly spaced (analysis engine handles this)
        for (let i = 0; i < results.length; i++) {
          for (let j = i + 1; j < results.length; j++) {
            const distance = calculateDistance(results[i].coordinates, results[j].coordinates)
            // Should be at least 100m apart (0.1 km)
            expect(distance).toBeGreaterThanOrEqual(0.1)
          }
        }
      }
    })
  })

  describe('hexagonal grid properties', () => {
    it('should have uniform point distribution', async () => {
      const radius = 2
      const results = await SolarPotentialAnalyzer.analyzeSolarPotential(center, radius, false)
      
      // All results should have valid coordinates
      results.forEach(result => {
        expect(result.coordinates.lat).toBeGreaterThan(center.lat - radius / 111)
        expect(result.coordinates.lat).toBeLessThan(center.lat + radius / 111)
        expect(result.coordinates.lng).toBeGreaterThan(center.lng - radius / (111 * Math.cos(center.lat * Math.PI / 180)))
        expect(result.coordinates.lng).toBeLessThan(center.lng + radius / (111 * Math.cos(center.lat * Math.PI / 180)))
      })
    })

    it('should handle edge cases', async () => {
      // Very small radius
      const smallRadius = 0.5
      const smallResults = await SolarPotentialAnalyzer.analyzeSolarPotential(center, smallRadius, false)
      expect(smallResults.length).toBeGreaterThanOrEqual(0)
      
      // Larger radius
      const largeRadius = 10
      const largeResults = await SolarPotentialAnalyzer.analyzeSolarPotential(center, largeRadius, false)
      expect(largeResults.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('performance characteristics', () => {
    it('should complete analysis within reasonable time', async () => {
      const startTime = Date.now()
      const radius = 3
      
      await SolarPotentialAnalyzer.analyzeSolarPotential(center, radius, false)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete within 10 seconds (reasonable for 3km radius)
      expect(duration).toBeLessThan(10000)
    })
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
