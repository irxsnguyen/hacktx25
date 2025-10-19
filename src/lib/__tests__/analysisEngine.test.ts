import { describe, it, expect } from 'vitest'
import { AnalysisEngine, SolarCandidate } from '../analysisEngine'

describe('AnalysisEngine', () => {
  const mockCandidates: SolarCandidate[] = [
    {
      coordinates: { lat: 30.2672, lng: -97.7431 },
      score: 85.5,
      kwhPerDay: 4.2
    },
    {
      coordinates: { lat: 30.2680, lng: -97.7420 },
      score: 92.3,
      kwhPerDay: 5.1
    },
    {
      coordinates: { lat: 30.2660, lng: -97.7440 },
      score: 78.9,
      kwhPerDay: 3.8
    },
    {
      coordinates: { lat: 30.2690, lng: -97.7410 },
      score: 88.7,
      kwhPerDay: 4.5
    },
    {
      coordinates: { lat: 30.2650, lng: -97.7450 },
      score: 95.1,
      kwhPerDay: 5.8
    },
    {
      coordinates: { lat: 30.2700, lng: -97.7400 },
      score: 82.4,
      kwhPerDay: 4.0
    }
  ]

  describe('rankTopLocations', () => {
    it('should rank candidates by kWh/day in descending order', () => {
      const results = AnalysisEngine.rankTopLocations(mockCandidates, { maxResults: 3 })
      
      expect(results).toHaveLength(3)
      expect(results[0].kwhPerDay).toBe(5.8) // Highest kWh
      expect(results[1].kwhPerDay).toBe(5.1) // Second highest
      expect(results[2].kwhPerDay).toBe(4.5) // Third highest
    })

    it('should filter out invalid candidates', () => {
      const candidatesWithInvalid: SolarCandidate[] = [
        ...mockCandidates,
        {
          coordinates: { lat: 30.3000, lng: -97.7000 },
          score: NaN,
          kwhPerDay: 3.0
        },
        {
          coordinates: { lat: 30.3000, lng: -97.7000 },
          score: 50.0,
          kwhPerDay: -1.0
        },
        {
          coordinates: { lat: 30.3000, lng: -97.7000 },
          score: Infinity,
          kwhPerDay: 2.0
        }
      ]

      const results = AnalysisEngine.rankTopLocations(candidatesWithInvalid)
      
      // Should only return valid candidates
      results.forEach(result => {
        expect(result.score).toBeGreaterThanOrEqual(0)
        expect(result.kwhPerDay).toBeGreaterThanOrEqual(0)
        expect(Number.isFinite(result.score)).toBe(true)
        expect(Number.isFinite(result.kwhPerDay)).toBe(true)
      })
    })

    it('should apply minimum spacing constraint', () => {
      const closeCandidates: SolarCandidate[] = [
        {
          coordinates: { lat: 30.2672, lng: -97.7431 },
          score: 90.0,
          kwhPerDay: 5.0
        },
        {
          coordinates: { lat: 30.2673, lng: -97.7432 }, // Very close to first
          score: 95.0,
          kwhPerDay: 6.0
        },
        {
          coordinates: { lat: 30.2700, lng: -97.7400 }, // Far from others
          score: 80.0,
          kwhPerDay: 4.0
        }
      ]

      const results = AnalysisEngine.rankTopLocations(closeCandidates, {
        maxResults: 3,
        minSpacingMeters: 100
      })

      // Should only return 2 results due to spacing constraint
      expect(results).toHaveLength(2)
      // Should include the highest scoring one and the distant one
      expect(results[0].kwhPerDay).toBe(6.0) // Highest score
      expect(results[1].kwhPerDay).toBe(4.0) // Distant one
    })

    it('should be deterministic for same inputs', () => {
      const results1 = AnalysisEngine.rankTopLocations(mockCandidates)
      const results2 = AnalysisEngine.rankTopLocations(mockCandidates)
      
      expect(results1).toEqual(results2)
    })

    it('should handle empty candidates array', () => {
      const results = AnalysisEngine.rankTopLocations([])
      expect(results).toEqual([])
    })

    it('should respect maxResults limit', () => {
      const results = AnalysisEngine.rankTopLocations(mockCandidates, { maxResults: 2 })
      expect(results).toHaveLength(2)
    })
  })

  describe('validateResults', () => {
    it('should validate correct results', () => {
      const validResults = mockCandidates.slice(0, 3)
      const validation = AnalysisEngine.validateResults(validResults)
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect duplicate coordinates', () => {
      const duplicateResults: SolarCandidate[] = [
        mockCandidates[0],
        { ...mockCandidates[0] } // Same coordinates
      ]
      
      const validation = AnalysisEngine.validateResults(duplicateResults)
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Duplicate coordinates found in results')
    })

    it('should detect invalid scores', () => {
      const invalidResults: SolarCandidate[] = [
        { ...mockCandidates[0], score: NaN },
        { ...mockCandidates[1], score: -1 }
      ]
      
      const validation = AnalysisEngine.validateResults(invalidResults)
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(error => error.includes('invalid scores'))).toBe(true)
    })
  })

  describe('generateReport', () => {
    it('should generate correct report for valid results', () => {
      const results = mockCandidates.slice(0, 3)
      const report = AnalysisEngine.generateReport(results)
      
      expect(report.validResults).toBe(3)
      expect(report.bestScore).toBe(Math.max(...results.map(r => r.score)))
      expect(report.bestKwhPerDay).toBe(Math.max(...results.map(r => r.kwhPerDay)))
      expect(report.averageScore).toBeCloseTo(
        results.reduce((sum, r) => sum + r.score, 0) / results.length
      )
    })

    it('should handle empty results', () => {
      const report = AnalysisEngine.generateReport([])
      
      expect(report.validResults).toBe(0)
      expect(report.averageScore).toBe(0)
      expect(report.bestScore).toBe(0)
    })
  })

  describe('tie-breaking', () => {
    it('should use latitude as tie-breaker when kWh/day is equal', () => {
      const tiedCandidates: SolarCandidate[] = [
        {
          coordinates: { lat: 30.2700, lng: -97.7400 }, // Higher latitude
          score: 80.0,
          kwhPerDay: 4.0
        },
        {
          coordinates: { lat: 30.2600, lng: -97.7500 }, // Lower latitude
          score: 80.0,
          kwhPerDay: 4.0
        }
      ]

      const results = AnalysisEngine.rankTopLocations(tiedCandidates)
      
      // Should prefer lower latitude (southern location)
      expect(results[0].coordinates.lat).toBe(30.2600)
    })

    it('should use longitude as second tie-breaker', () => {
      const tiedCandidates: SolarCandidate[] = [
        {
          coordinates: { lat: 30.2650, lng: -97.7500 }, // Higher longitude (west)
          score: 80.0,
          kwhPerDay: 4.0
        },
        {
          coordinates: { lat: 30.2650, lng: -97.7400 }, // Lower longitude (east)
          score: 80.0,
          kwhPerDay: 4.0
        }
      ]

      const results = AnalysisEngine.rankTopLocations(tiedCandidates)
      
      // Should prefer lower longitude (eastern location)
      expect(results[0].coordinates.lng).toBe(-97.7400)
    })
  })
})
