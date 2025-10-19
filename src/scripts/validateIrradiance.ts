#!/usr/bin/env tsx

/**
 * Standalone irradiance validation script
 * 
 * Usage: npm run validate-irradiance
 * 
 * This script validates our solar irradiance calculations against real-world data
 * from NASA POWER API to identify calculation errors and longitude discontinuities.
 */

import { IrradianceValidator } from '../lib/irradianceValidator'

async function main() {
  console.log('🔍 Starting Irradiance Validation...')
  console.log('=====================================')
  
  // Test specific problematic locations
  const testLocations = [
    { lat: 40, lng: -30, name: 'Atlantic (30°W)' },
    { lat: 40, lng: -25, name: 'Atlantic (25°W)' },
    { lat: 40, lng: -20, name: 'Atlantic (20°W) - PROBLEM AREA' },
    { lat: 40, lng: -15, name: 'Atlantic (15°W)' },
    { lat: 40, lng: -10, name: 'Atlantic (10°W)' },
    { lat: 40, lng: -5, name: 'Atlantic (5°W)' },
    { lat: 40, lng: 0, name: 'Greenwich (0°)' },
    { lat: 40, lng: 5, name: 'Europe (5°E)' },
    { lat: 40, lng: 10, name: 'Europe (10°E)' },
  ]
  
  const testDate = new Date('2024-06-21T12:00:00Z') // Summer solstice
  const results = []
  
  console.log(`\n📊 Testing ${testLocations.length} locations at ${testDate.toISOString()}`)
  console.log('Panel: 30° tilt, 180° azimuth (south-facing)')
  console.log('\nLocation Results:')
  console.log('==================')
  
  for (const location of testLocations) {
    try {
      console.log(`\n📍 ${location.name} (${location.lat}°, ${location.lng}°)`)
      
      const result = await IrradianceValidator.validateSinglePoint(
        { lat: location.lat, lng: location.lng },
        testDate,
        30, // tilt
        180 // azimuth
      )
      
      results.push(result)
      
      // Display results
      console.log(`  Computed:  GHI=${result.computed.ghi.toFixed(1)} W/m², DNI=${result.computed.dni.toFixed(1)} W/m², DHI=${result.computed.dhi.toFixed(1)} W/m²`)
      console.log(`  Reference: GHI=${result.reference.ghi.toFixed(1)} W/m², DNI=${result.reference.dni.toFixed(1)} W/m², DHI=${result.reference.dhi.toFixed(1)} W/m²`)
      console.log(`  Errors:    GHI=${result.relativeErrors.ghiRelative.toFixed(1)}%, DNI=${result.relativeErrors.dniRelative.toFixed(1)}%, DHI=${result.relativeErrors.dhiRelative.toFixed(1)}%`)
      
      // Flag high errors
      if (Math.abs(result.relativeErrors.ghiRelative) > 30) {
        console.log(`  ⚠️  HIGH GHI ERROR: ${result.relativeErrors.ghiRelative.toFixed(1)}%`)
      }
      if (Math.abs(result.relativeErrors.dniRelative) > 30) {
        console.log(`  ⚠️  HIGH DNI ERROR: ${result.relativeErrors.dniRelative.toFixed(1)}%`)
      }
      
    } catch (error) {
      console.error(`  ❌ Failed to validate ${location.name}:`, error instanceof Error ? error.message : String(error))
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  if (results.length === 0) {
    console.log('\n❌ No validation results obtained. Check API connectivity.')
    return
  }
  
  // Analyze results
  console.log('\n📈 Analysis Results:')
  console.log('====================')
  
  const analysis = IrradianceValidator.analyzeResults(results)
  
  console.log(`\nTotal Points Validated: ${analysis.summary.totalPoints}`)
  console.log(`Average Errors: GHI=${analysis.summary.averageErrors.ghi.toFixed(1)} W/m², DNI=${analysis.summary.averageErrors.dni.toFixed(1)} W/m², DHI=${analysis.summary.averageErrors.dhi.toFixed(1)} W/m²`)
  console.log(`Maximum Errors: GHI=${analysis.summary.maxErrors.ghi.toFixed(1)} W/m², DNI=${analysis.summary.maxErrors.dni.toFixed(1)} W/m², DHI=${analysis.summary.maxErrors.dhi.toFixed(1)} W/m²`)
  
  if (analysis.summary.problemLocations.length > 0) {
    console.log(`\n⚠️  Problem Locations (${analysis.summary.problemLocations.length}):`)
    analysis.summary.problemLocations.forEach((problem, i) => {
      console.log(`  ${i + 1}. ${problem.location.lat}°, ${problem.location.lng}°: GHI error=${problem.errors.ghiError.toFixed(1)} W/m²`)
    })
  }
  
  // Longitude discontinuity analysis
  console.log('\n🌍 Longitude Discontinuity Analysis:')
  console.log('====================================')
  
  if (analysis.longitudeAnalysis.discontinuityDetected) {
    console.log('⚠️  LONGITUDE DISCONTINUITY DETECTED!')
    console.log('Longitude bins with average errors:')
    analysis.longitudeAnalysis.longitudeBins.forEach(bin => {
      console.log(`  ${bin.longitude}°: ${bin.averageError.toFixed(1)} W/m² (${bin.count} points)`)
    })
  } else {
    console.log('✅ No significant longitude discontinuity detected')
  }
  
  // Check for the specific -20° longitude issue
  console.log('\n🔍 Specific -20° Longitude Check:')
  console.log('==================================')
  
  const longitudeResults = results.sort((a, b) => a.location.lng - b.location.lng)
  
  for (let i = 1; i < longitudeResults.length; i++) {
    const prev = longitudeResults[i - 1]
    const curr = longitudeResults[i]
    
    const ghiChange = Math.abs(curr.computed.ghi - prev.computed.ghi)
    const dniChange = Math.abs(curr.computed.dni - prev.computed.dni)
    
    console.log(`${prev.location.lng}° → ${curr.location.lng}°: GHI change=${ghiChange.toFixed(1)} W/m², DNI change=${dniChange.toFixed(1)} W/m²`)
    
    if (ghiChange > 50 || dniChange > 50) {
      console.log(`  ⚠️  SUDDEN CHANGE DETECTED! This may indicate the longitude bug.`)
    }
  }
  
  // Export results
  console.log('\n💾 Exporting Results:')
  console.log('======================')
  
  const csv = IrradianceValidator.exportToCSV(results)
  console.log(`CSV contains ${results.length} validation records`)
  console.log('CSV data (first 3 lines):')
  console.log(csv.split('\n').slice(0, 3).join('\n'))
  
  console.log('\n✅ Irradiance validation complete!')
}

// Run the validation
main().catch(error => {
  console.error('❌ Validation failed:', error)
})
