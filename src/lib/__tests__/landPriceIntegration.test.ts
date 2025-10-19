import { describe, it, expect } from 'vitest'
import { LandPriceEstimator, LandPriceConfig } from '../landPriceEstimator'
import { SolarPotentialAnalyzer } from '../../utils/solarCalculations'
import { Coordinates } from '../../types'

describe('Land Price Integration System', () => {
  const testConfig: LandPriceConfig = {
    apiEnabled: false, // Use synthetic for testing
    apiTimeout: 1000,
    apiRetries: 1,
    syntheticModel: {
      basePrice: 50,
      urbanGradient: 0.1,
      latitudeAdjustment: 0.02,
      longitudeAdjustment: 0.01
    },
    cacheEnabled: true,
    cacheExpiry: 1
  }

  it('should estimate land price for single location', async () => {
    const price = await LandPriceEstimator.estimateLandPriceAt(40.7128, -74.0060, testConfig)
    
    expect(price).toBeGreaterThan(0)
    expect(typeof price).toBe('number')
    
    console.log(`\n📍 Land price for New York: $${price.toFixed(2)}/m²`)
  })

  it('should get comprehensive land price data', async () => {
    const location = { lat: 40.7128, lng: -74.0060 }
    
    const result = await LandPriceEstimator.getLandPrice(location, testConfig)
    
    expect(result.location).toEqual(location)
    expect(result.pricePerSquareMeter).toBeGreaterThan(0)
    expect(result.dataSource).toBe('synthetic')
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.confidence).toBeLessThanOrEqual(1)
    
    console.log(`\n📊 Land price data for ${location.lat}°, ${location.lng}°:`)
    console.log(`  Price: $${result.pricePerSquareMeter.toFixed(2)}/m²`)
    console.log(`  Source: ${result.dataSource}`)
    console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`)
    if (result.metadata?.distanceToUrban) {
      console.log(`  Distance to urban: ${result.metadata.distanceToUrban.toFixed(1)} km`)
    }
  })

  it('should calculate power-per-cost scores', () => {
    const testCases = [
      { kwhPerDay: 5, landPrice: 50, expected: 0.1 },
      { kwhPerDay: 10, landPrice: 25, expected: 0.4 },
      { kwhPerDay: 3, landPrice: 100, expected: 0.03 },
      { kwhPerDay: 8, landPrice: 0.5, expected: 8.0 } // Uses epsilon floor
    ]
    
    console.log('\n💰 Power-per-cost calculation tests:')
    console.log('kWh/day  Land Price  Power/Cost  Expected')
    console.log('------------------------------------------')
    
    testCases.forEach(({ kwhPerDay, landPrice, expected }) => {
      const powerPerCost = LandPriceEstimator.calculatePowerPerCost(kwhPerDay, landPrice)
      
      expect(powerPerCost).toBeCloseTo(expected, 2)
      
      console.log(
        `${kwhPerDay.toString().padStart(7)} ` +
        `$${landPrice.toString().padStart(9)} ` +
        `${powerPerCost.toFixed(3).padStart(10)} ` +
        `${expected.toFixed(3).padStart(8)}`
      )
    })
  })

  it('should process multiple locations with land prices', async () => {
    const locations = [
      { lat: 40, lng: -74 },
      { lat: 40.1, lng: -74.1 },
      { lat: 40.2, lng: -74.2 }
    ]
    
    const results = await LandPriceEstimator.getLandPrices(locations, testConfig)
    
    expect(results).toHaveLength(locations.length)
    
    console.log('\n🏙️  Land prices for multiple locations:')
    console.log('Location     Price/m²    Source      Confidence')
    console.log('----------------------------------------------')
    
    results.forEach((result, i) => {
      expect(result.pricePerSquareMeter).toBeGreaterThan(0)
      
      console.log(
        `${result.location.lat.toFixed(1)}°,${result.location.lng.toFixed(1)}° ` +
        `$${result.pricePerSquareMeter.toFixed(0).padStart(9)} ` +
        `${result.dataSource.padStart(10)} ` +
        `${(result.confidence * 100).toFixed(1).padStart(8)}%`
      )
    })
  })

  it('should show geographic price variation', async () => {
    const locations = [
      { lat: 40, lng: -74, name: 'Urban' },
      { lat: 40, lng: -80, name: 'Rural' },
      { lat: 30, lng: -100, name: 'Southern' },
      { lat: 50, lng: -100, name: 'Northern' }
    ]
    
    console.log('\n🌍 Geographic price variation:')
    console.log('Location    Price/m²    Distance to Urban  Population Density')
    console.log('------------------------------------------------------------')
    
    for (const location of locations) {
      const result = await LandPriceEstimator.getLandPrice(location, testConfig)
      
      console.log(
        `${location.name.padEnd(10)} ` +
        `$${result.pricePerSquareMeter.toFixed(0).padStart(10)} ` +
        `${result.metadata?.distanceToUrban?.toFixed(1).padStart(18)} km ` +
        `${result.metadata?.populationDensity?.toFixed(0).padStart(18)} people/km²`
      )
    }
  })

  it('should integrate with solar analysis pipeline', async () => {
    const center = { lat: 40.7128, lng: -74.0060 }
    const radiusKm = 5
    
    console.log('\n🔋 Testing integrated solar + land price analysis...')
    
    // Mock progress callback
    const progressLog: string[] = []
    const onProgress = (percentage: number, status: string, message: string) => {
      progressLog.push(`${percentage}% - ${status}: ${message}`)
    }
    
    const results = await SolarPotentialAnalyzer.analyzeSolarPotential(
      center,
      radiusKm,
      false, // urbanPenalty
      true,  // includeLandPrices
      true,  // rankByCostEfficiency
      onProgress
    )
    
    expect(results.length).toBeGreaterThan(0)
    
    // Check that results include land price data
    const resultsWithLandPrice = results.filter(r => r.landPrice !== undefined)
    expect(resultsWithLandPrice.length).toBeGreaterThan(0)
    
    // Check that results include power-per-cost data
    const resultsWithPowerPerCost = results.filter(r => r.powerPerCost !== undefined)
    expect(resultsWithPowerPerCost.length).toBeGreaterThan(0)
    
    console.log(`\n📈 Analysis results (${results.length} locations):`)
    console.log('Location     Solar Score  kWh/day  Land Price  Power/Cost')
    console.log('----------------------------------------------------------')
    
    results.slice(0, 5).forEach((result, i) => {
      console.log(
        `${result.coordinates.lat.toFixed(2)}°,${result.coordinates.lng.toFixed(2)}° ` +
        `${result.score.toFixed(3).padStart(11)} ` +
        `${result.kwhPerDay.toFixed(1).padStart(7)} ` +
        `${result.landPrice ? `$${result.landPrice.toFixed(0)}` : 'N/A'.padStart(9)} ` +
        `${result.powerPerCost ? result.powerPerCost.toFixed(3) : 'N/A'.padStart(10)}`
      )
    })
    
    // Check progress tracking
    expect(progressLog.length).toBeGreaterThan(0)
    expect(progressLog.some(log => log.includes('land-prices'))).toBe(true)
    
    console.log('\n📊 Progress tracking:')
    progressLog.forEach(log => console.log(`  ${log}`))
  })

  it('should handle land price lookup failures gracefully', async () => {
    const location = { lat: 80, lng: 0 } // Very remote location
    
    // Test with API timeout to force fallback
    const failingConfig: LandPriceConfig = {
      apiEnabled: true, // Try API first
      apiTimeout: 1, // Very short timeout
      apiRetries: 0,
      syntheticModel: {
        basePrice: 10,
        urbanGradient: 0.2,
        latitudeAdjustment: 0.05,
        longitudeAdjustment: 0.02
      },
      cacheEnabled: true,
      cacheExpiry: 1
    }
    
    const result = await LandPriceEstimator.getLandPrice(location, failingConfig)
    
    expect(result.dataSource).toBe('synthetic')
    expect(result.pricePerSquareMeter).toBeGreaterThan(0)
    expect(result.confidence).toBeLessThan(0.5) // Low confidence for synthetic
    
    console.log(`\n⚠️  Fallback handling for remote location:`)
    console.log(`  Location: ${location.lat}°, ${location.lng}°`)
    console.log(`  Source: ${result.dataSource}`)
    console.log(`  Price: $${result.pricePerSquareMeter.toFixed(2)}/m²`)
    console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`)
  })

  it('should provide cache statistics', async () => {
    // Clear cache first
    LandPriceEstimator.clearCache()
    
    // Fetch some data to populate cache
    const locations = [
      { lat: 40, lng: -74 },
      { lat: 40.1, lng: -74.1 },
      { lat: 40.2, lng: -74.2 }
    ]
    
    await LandPriceEstimator.getLandPrices(locations, testConfig)
    
    const stats = LandPriceEstimator.getCacheStats()
    
    expect(stats.size).toBeGreaterThan(0)
    expect(stats.sources).toBeDefined()
    expect(stats.avgConfidence).toBeGreaterThan(0)
    
    console.log('\n📊 Cache statistics:')
    console.log(`  Cache size: ${stats.size} entries`)
    console.log(`  Sources: ${JSON.stringify(stats.sources)}`)
    console.log(`  Average confidence: ${(stats.avgConfidence * 100).toFixed(1)}%`)
  })

  it('should rank by power-per-cost when enabled', async () => {
    const center = { lat: 40.7128, lng: -74.0060 }
    const radiusKm = 2
    
    console.log('\n🏆 Testing power-per-cost ranking...')
    
    // Test with cost efficiency ranking enabled
    const resultsWithCost = await SolarPotentialAnalyzer.analyzeSolarPotential(
      center,
      radiusKm,
      false, // urbanPenalty
      true,  // includeLandPrices
      true,  // rankByCostEfficiency
      () => {} // no progress callback
    )
    
    // Test with cost efficiency ranking disabled
    const resultsWithoutCost = await SolarPotentialAnalyzer.analyzeSolarPotential(
      center,
      radiusKm,
      false, // urbanPenalty
      true,  // includeLandPrices
      false, // rankByCostEfficiency
      () => {} // no progress callback
    )
    
    expect(resultsWithCost.length).toBeGreaterThan(0)
    expect(resultsWithoutCost.length).toBeGreaterThan(0)
    
    // Results should be different when ranking by different criteria
    const withCostFirst = resultsWithCost[0]
    const withoutCostFirst = resultsWithoutCost[0]
    
    console.log(`\n📊 Ranking comparison:`)
    console.log(`  With cost ranking: ${withCostFirst.coordinates.lat.toFixed(2)}°, ${withCostFirst.coordinates.lng.toFixed(2)}° (Power/Cost: ${withCostFirst.powerPerCost?.toFixed(3)})`)
    console.log(`  Without cost ranking: ${withoutCostFirst.coordinates.lat.toFixed(2)}°, ${withoutCostFirst.coordinates.lng.toFixed(2)}° (Score: ${withoutCostFirst.score.toFixed(3)})`)
    
    // Both should have power-per-cost data
    expect(withCostFirst.powerPerCost).toBeDefined()
    expect(withoutCostFirst.powerPerCost).toBeDefined()
  })
})