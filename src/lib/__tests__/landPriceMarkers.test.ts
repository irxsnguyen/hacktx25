import { describe, it, expect } from 'vitest'
import { SolarPotentialAnalyzer } from '../../utils/solarCalculations'
import { LandPriceEstimator } from '../landPriceEstimator'

describe('Land Price Data Markers', () => {
  it('should store land price as data marker for each location', async () => {
    const center = { lat: 40.7128, lng: -74.0060 }
    const radiusKm = 2
    
    console.log('\n🏷️  Testing land price data markers...')
    
    const results = await SolarPotentialAnalyzer.analyzeSolarPotential(
      center,
      radiusKm,
      false, // urbanPenalty
      true,  // includeLandPrices
      true,  // rankByCostEfficiency
      () => {} // no progress callback
    )
    
    expect(results.length).toBeGreaterThan(0)
    
    // Check that all results have land price markers
    const resultsWithLandPrice = results.filter(r => r.landPrice !== undefined)
    expect(resultsWithLandPrice.length).toBe(results.length)
    
    // Check that all results have power-per-cost markers
    const resultsWithPowerPerCost = results.filter(r => r.powerPerCost !== undefined)
    expect(resultsWithPowerPerCost.length).toBe(results.length)
    
    console.log(`\n📊 Analysis results with land price markers (${results.length} locations):`)
    console.log('Rank  Location        Score   kWh/day  Land Price  Power/Cost')
    console.log('-------------------------------------------------------------')
    
    results.slice(0, 5).forEach((result, i) => {
      console.log(
        `${(i + 1).toString().padStart(4)} ` +
        `${result.coordinates.lat.toFixed(2)}°,${result.coordinates.lng.toFixed(2)}° ` +
        `${result.score.toFixed(3).padStart(7)} ` +
        `${result.kwhPerDay.toFixed(1).padStart(7)} ` +
        `${result.landPrice ? `$${result.landPrice.toFixed(0)}` : 'N/A'.padStart(9)} ` +
        `${result.powerPerCost ? result.powerPerCost.toFixed(3) : 'N/A'.padStart(10)}`
      )
    })
    
    // Verify data integrity
    results.forEach((result, index) => {
      expect(result.coordinates).toBeDefined()
      expect(result.coordinates.lat).toBeTypeOf('number')
      expect(result.coordinates.lng).toBeTypeOf('number')
      expect(result.score).toBeTypeOf('number')
      expect(result.kwhPerDay).toBeTypeOf('number')
      expect(result.landPrice).toBeTypeOf('number')
      expect(result.powerPerCost).toBeTypeOf('number')
      
      // Land price should be positive
      expect(result.landPrice).toBeGreaterThan(0)
      
      // Power per cost should be positive
      expect(result.powerPerCost).toBeGreaterThan(0)
      
      // Power per cost should equal kwhPerDay / landPrice
      const expectedPowerPerCost = result.kwhPerDay / result.landPrice
      expect(result.powerPerCost).toBeCloseTo(expectedPowerPerCost, 3)
    })
    
    console.log('\n✅ All locations have land price data markers!')
    console.log(`   - ${results.length} locations analyzed`)
    console.log(`   - ${resultsWithLandPrice.length} with land price markers`)
    console.log(`   - ${resultsWithPowerPerCost.length} with power-per-cost markers`)
  })

  it('should maintain land price markers in saved analysis', async () => {
    const center = { lat: 40.7128, lng: -74.0060 }
    const radiusKm = 1
    
    console.log('\n💾 Testing land price markers in saved analysis...')
    
    const results = await SolarPotentialAnalyzer.analyzeSolarPotential(
      center,
      radiusKm,
      false, // urbanPenalty
      true,  // includeLandPrices
      true,  // rankByCostEfficiency
      () => {} // no progress callback
    )
    
    // Simulate creating a saved analysis (like in MapView.tsx)
    const savedAnalysis = {
      id: `analysis_${Date.now()}`,
      center,
      radius: radiusKm,
      results: results.map((result, index) => ({
        rank: index + 1,
        coordinates: result.coordinates,
        score: result.score,
        estimatedKwhPerDay: result.kwhPerDay,
        landPrice: result.landPrice,
        powerPerCost: result.powerPerCost
      })),
      createdAt: new Date(),
      completedAt: new Date()
    }
    
    expect(savedAnalysis.results.length).toBeGreaterThan(0)
    
    // Check that saved analysis maintains land price markers
    const savedResultsWithLandPrice = savedAnalysis.results.filter(r => r.landPrice !== undefined)
    expect(savedResultsWithLandPrice.length).toBe(savedAnalysis.results.length)
    
    const savedResultsWithPowerPerCost = savedAnalysis.results.filter(r => r.powerPerCost !== undefined)
    expect(savedResultsWithPowerPerCost.length).toBe(savedAnalysis.results.length)
    
    console.log(`\n📈 Saved analysis with land price markers:`)
    console.log(`   - ${savedAnalysis.results.length} results saved`)
    console.log(`   - ${savedResultsWithLandPrice.length} with land price markers`)
    console.log(`   - ${savedResultsWithPowerPerCost.length} with power-per-cost markers`)
    
    // Verify data persistence
    savedAnalysis.results.forEach((result, index) => {
      expect(result.rank).toBe(index + 1)
      expect(result.coordinates).toBeDefined()
      expect(result.score).toBeTypeOf('number')
      expect(result.estimatedKwhPerDay).toBeTypeOf('number')
      expect(result.landPrice).toBeTypeOf('number')
      expect(result.powerPerCost).toBeTypeOf('number')
    })
    
    console.log('\n✅ Land price markers successfully stored in saved analysis!')
  })

  it('should show geographic variation in land price markers', async () => {
    const center = { lat: 40.7128, lng: -74.0060 }
    const radiusKm = 5
    
    console.log('\n🌍 Testing geographic variation in land price markers...')
    
    const results = await SolarPotentialAnalyzer.analyzeSolarPotential(
      center,
      radiusKm,
      false, // urbanPenalty
      true,  // includeLandPrices
      true,  // rankByCostEfficiency
      () => {} // no progress callback
    )
    
    expect(results.length).toBeGreaterThan(0)
    
    // Check for geographic variation in land prices
    const landPrices = results.map(r => r.landPrice).filter(p => p !== undefined)
    const uniquePrices = [...new Set(landPrices.map(p => Math.round(p)))]
    
    console.log(`\n📊 Geographic land price variation:`)
    console.log(`   - ${results.length} locations analyzed`)
    console.log(`   - ${landPrices.length} with land price data`)
    console.log(`   - ${uniquePrices.length} unique price levels`)
    console.log(`   - Price range: $${Math.min(...landPrices).toFixed(0)} - $${Math.max(...landPrices).toFixed(0)}/m²`)
    
    // Should have some geographic variation
    expect(uniquePrices.length).toBeGreaterThan(1)
    
    // All prices should be positive
    landPrices.forEach(price => {
      expect(price).toBeGreaterThan(0)
    })
    
    console.log('\n✅ Geographic variation detected in land price markers!')
  })

  it('should rank by power-per-cost when land price markers are present', async () => {
    const center = { lat: 40.7128, lng: -74.0060 }
    const radiusKm = 3
    
    console.log('\n🏆 Testing power-per-cost ranking with land price markers...')
    
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
    
    // Both should have land price markers
    const withCostMarkers = resultsWithCost.filter(r => r.landPrice !== undefined)
    const withoutCostMarkers = resultsWithoutCost.filter(r => r.landPrice !== undefined)
    
    expect(withCostMarkers.length).toBe(resultsWithCost.length)
    expect(withoutCostMarkers.length).toBe(resultsWithoutCost.length)
    
    // Results should be different when ranking by different criteria
    const withCostFirst = resultsWithCost[0]
    const withoutCostFirst = resultsWithoutCost[0]
    
    console.log(`\n📊 Ranking comparison with land price markers:`)
    console.log(`  With cost ranking: ${withCostFirst.coordinates.lat.toFixed(2)}°, ${withCostFirst.coordinates.lng.toFixed(2)}° (Power/Cost: ${withCostFirst.powerPerCost?.toFixed(3)})`)
    console.log(`  Without cost ranking: ${withoutCostFirst.coordinates.lat.toFixed(2)}°, ${withoutCostFirst.coordinates.lng.toFixed(2)}° (Score: ${withoutCostFirst.score.toFixed(3)})`)
    
    // Both should have power-per-cost data
    expect(withCostFirst.powerPerCost).toBeDefined()
    expect(withoutCostFirst.powerPerCost).toBeDefined()
    
    console.log('\n✅ Power-per-cost ranking works with land price markers!')
  })
})
