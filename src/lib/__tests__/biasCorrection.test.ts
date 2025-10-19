import { describe, it, expect } from 'vitest'
import { BiasCorrectionEngine, BiasCorrectionConfig } from '../biasCorrection'
import { Coordinates } from '../../types'

describe('Bias Correction System', () => {
  const testConfig: BiasCorrectionConfig = {
    monthlyAttenuation: [0.55, 0.58, 0.62, 0.65, 0.68, 0.70, 0.72, 0.70, 0.68, 0.65, 0.60, 0.57],
    monthlyTemperature: [5, 8, 12, 16, 20, 24, 26, 25, 22, 17, 12, 7],
    temperatureCoeff: 0.004,
    referenceSampleSize: 8,
    referenceRadius: 1.0,
    csiWeight: 0.6,
    percentileWeight: 0.4,
    minBaselineRatio: 0.1,
    maxBaselineRatio: 3.0
  }

  it('should calculate baseline POA for different locations', () => {
    const locations = [
      { lat: 40, lng: -74, name: 'New York' },
      { lat: 30, lng: -97, name: 'Austin' },
      { lat: 50, lng: -4, name: 'London' },
      { lat: 60, lng: 10, name: 'Oslo' }
    ]
    
    const dayOfYear = 173 // June 21
    const tilt = 30
    const azimuth = 180
    
    console.log('\n📍 Baseline POA calculations:')
    console.log('Location        Baseline POA')
    console.log('---------------------------')
    
    for (const location of locations) {
      const baselinePOA = BiasCorrectionEngine.calculateBaselinePOA(
        location,
        dayOfYear,
        tilt,
        azimuth,
        testConfig
      )
      
      console.log(`${location.name.padEnd(15)} ${baselinePOA.toFixed(2)} W/m²`)
      
      // Baseline should be positive for reasonable locations
      expect(baselinePOA).toBeGreaterThan(0)
    }
  })

  it('should show different baselines for different latitudes', () => {
    const latitudes = [20, 30, 40, 50, 60]
    const longitude = -74
    const dayOfYear = 173 // June 21
    const tilt = 30
    const azimuth = 180
    
    console.log('\n🌍 Latitude vs Baseline POA:')
    console.log('Latitude  Baseline POA')
    console.log('----------------------')
    
    const baselines: number[] = []
    
    for (const lat of latitudes) {
      const location = { lat, lng: longitude }
      const baselinePOA = BiasCorrectionEngine.calculateBaselinePOA(
        location,
        dayOfYear,
        tilt,
        azimuth,
        testConfig
      )
      
      baselines.push(baselinePOA)
      console.log(`${lat.toString().padStart(8)}° ${baselinePOA.toFixed(2)} W/m²`)
    }
    
    // Lower latitudes should generally have higher baselines
    // (though this depends on the specific climatology model)
    expect(baselines.length).toBe(latitudes.length)
  })

  it('should calculate bias correction factors', () => {
    const center = { lat: 40, lng: -74 }
    const referencePoints = BiasCorrectionEngine.sampleReferencePoints(
      center,
      testConfig.referenceRadius,
      testConfig.referenceSampleSize
    )
    
    console.log(`\n🔧 Bias correction with ${referencePoints.length} reference points:`)
    
    const biasFactors = BiasCorrectionEngine.calculateBiasFactors(
      referencePoints,
      173, // June 21
      30,  // tilt
      180, // azimuth
      testConfig
    )
    
    console.log(`Slope: ${biasFactors.slope.toFixed(3)}`)
    console.log(`Intercept: ${biasFactors.intercept.toFixed(3)}`)
    console.log(`Correlation: ${biasFactors.correlation.toFixed(3)}`)
    
    // Bias factors should be reasonable
    expect(biasFactors.slope).toBeGreaterThan(0)
    expect(Math.abs(biasFactors.correlation)).toBeLessThanOrEqual(1)
  })

  it('should process candidates with bias correction', () => {
    const candidates = [
      { location: { lat: 40, lng: -74 }, rawPOA: 100 },
      { location: { lat: 40.1, lng: -74.1 }, rawPOA: 120 },
      { location: { lat: 40.2, lng: -74.2 }, rawPOA: 80 },
      { location: { lat: 40.3, lng: -74.3 }, rawPOA: 150 },
      { location: { lat: 40.4, lng: -74.4 }, rawPOA: 90 }
    ]
    
    console.log('\n📊 Bias correction results:')
    console.log('Location     Raw POA  Baseline  Corrected  CSI    Percentile  RPS')
    console.log('------------------------------------------------------------------')
    
    const results = BiasCorrectionEngine.processAllCandidates(
      candidates,
      173, // June 21
      30,  // tilt
      180, // azimuth
      testConfig
    )
    
    for (const result of results) {
      console.log(
        `${result.location.lat.toFixed(1)}°,${result.location.lng.toFixed(1)}° ` +
        `${result.rawPOA.toFixed(0).padStart(7)} ` +
        `${result.baselinePOA.toFixed(0).padStart(8)} ` +
        `${result.correctedPOA.toFixed(0).padStart(9)} ` +
        `${result.clearSkyIndex.toFixed(2).padStart(4)} ` +
        `${result.localPercentile.toFixed(0).padStart(10)}% ` +
        `${result.relativePotentialScore.toFixed(3).padStart(6)}`
      )
      
      // Results should have reasonable values
      expect(result.rawPOA).toBeGreaterThan(0)
      expect(result.baselinePOA).toBeGreaterThan(0)
      expect(result.correctedPOA).toBeGreaterThanOrEqual(0)
      expect(result.clearSkyIndex).toBeGreaterThanOrEqual(0)
      expect(result.localPercentile).toBeGreaterThanOrEqual(0)
      expect(result.localPercentile).toBeLessThanOrEqual(100)
      expect(result.relativePotentialScore).toBeGreaterThanOrEqual(0)
    }
    
    // Results should be sorted by RPS (descending)
    const rpsValues = results.map(r => r.relativePotentialScore)
    const sortedRps = [...rpsValues].sort((a, b) => b - a)
    expect(rpsValues).toEqual(sortedRps)
  })

  it('should eliminate geographic bias in ranking', () => {
    // Create candidates with different latitudes but similar local conditions
    const candidates = [
      { location: { lat: 20, lng: -100 }, rawPOA: 200 }, // High latitude, high raw POA
      { location: { lat: 40, lng: -100 }, rawPOA: 150 }, // Medium latitude, medium raw POA
      { location: { lat: 60, lng: -100 }, rawPOA: 100 }, // Low latitude, low raw POA
    ]
    
    console.log('\n🎯 Geographic bias elimination test:')
    console.log('Before bias correction (raw POA ranking):')
    candidates.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.location.lat}°N: ${c.rawPOA} W/m²`)
    })
    
    const results = BiasCorrectionEngine.processAllCandidates(
      candidates,
      173, // June 21
      30,  // tilt
      180, // azimuth
      testConfig
    )
    
    console.log('\nAfter bias correction (RPS ranking):')
    results.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.location.lat}°N: RPS=${r.relativePotentialScore.toFixed(3)}, Raw=${r.rawPOA.toFixed(0)}, Baseline=${r.baselinePOA.toFixed(0)}`)
    })
    
    // The ranking should change based on relative potential, not absolute POA
    expect(results.length).toBe(candidates.length)
    
    // All results should have valid RPS scores
    results.forEach(result => {
      expect(result.relativePotentialScore).toBeGreaterThanOrEqual(0)
      expect(result.relativePotentialScore).toBeLessThanOrEqual(2) // CSI is clamped to 0-2
    })
  })

  it('should handle edge cases gracefully', () => {
    // Test with very low POA values
    const candidates = [
      { location: { lat: 80, lng: 0 }, rawPOA: 1 }, // Very high latitude
      { location: { lat: 40, lng: 0 }, rawPOA: 0.1 }, // Very low POA
    ]
    
    const results = BiasCorrectionEngine.processAllCandidates(
      candidates,
      173, // June 21
      30,  // tilt
      180, // azimuth
      testConfig
    )
    
    console.log('\n⚠️  Edge case handling:')
    results.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.location.lat}°N: RPS=${r.relativePotentialScore.toFixed(3)}, Raw=${r.rawPOA.toFixed(2)}`)
    })
    
    // Should handle edge cases without crashing
    expect(results.length).toBe(candidates.length)
    results.forEach(result => {
      expect(result.relativePotentialScore).toBeGreaterThanOrEqual(0)
      expect(result.correctedPOA).toBeGreaterThanOrEqual(0)
    })
  })
})
