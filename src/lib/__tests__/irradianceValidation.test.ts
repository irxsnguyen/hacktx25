import { describe, it, expect, beforeEach } from 'vitest'
import { IrradianceValidator } from '../irradianceValidator'

describe('Irradiance Validation Against Real-World Data', () => {
  const testDate = new Date('2024-06-21T12:00:00Z') // Summer solstice
  const testLocations = [
    { lat: 40.7128, lng: -74.0060 }, // New York
    { lat: 51.5074, lng: -0.1278 }, // London
    { lat: 35.6762, lng: 139.6503 }, // Tokyo
    { lat: -33.8688, lng: 151.2093 }, // Sydney
    { lat: 48.8566, lng: 2.3522 }, // Paris
  ]

  it('should validate single point against NASA POWER data', async () => {
    const location = { lat: 40.7128, lng: -74.0060 } // New York
    const result = await IrradianceValidator.validateSinglePoint(location, testDate)
    
    // Basic validation
    expect(result.location).toEqual(location)
    expect(result.date).toEqual(testDate)
    expect(result.computed.ghi).toBeGreaterThan(0)
    expect(result.computed.dni).toBeGreaterThan(0)
    expect(result.computed.dhi).toBeGreaterThan(0)
    expect(result.computed.poa).toBeGreaterThan(0)
    
    // Reference data should be available
    expect(result.reference.ghi).toBeGreaterThan(0)
    expect(result.reference.dni).toBeGreaterThan(0)
    expect(result.reference.dhi).toBeGreaterThan(0)
    
    // Errors should be reasonable (within 50% for initial validation)
    expect(Math.abs(result.relativeErrors.ghiRelative)).toBeLessThan(50)
    expect(Math.abs(result.relativeErrors.dniRelative)).toBeLessThan(50)
    expect(Math.abs(result.relativeErrors.dhiRelative)).toBeLessThan(50)
    
    console.log('Single point validation result:', {
      location: result.location,
      computed: result.computed,
      reference: result.reference,
      errors: result.errors,
      relativeErrors: result.relativeErrors
    })
  }, 30000) // 30 second timeout for API calls

  it('should validate multiple locations', async () => {
    const results = []
    
    for (const location of testLocations) {
      try {
        const result = await IrradianceValidator.validateSinglePoint(location, testDate)
        results.push(result)
        console.log(`Validated ${location.lat}°, ${location.lng}°: GHI error ${result.relativeErrors.ghiRelative.toFixed(1)}%`)
      } catch (error) {
        console.warn(`Failed to validate ${location.lat}°, ${location.lng}°:`, error)
      }
    }
    
    expect(results.length).toBeGreaterThan(0)
    
    // Analyze results
    const analysis = IrradianceValidator.analyzeResults(results)
    console.log('Validation analysis:', analysis)
    
    // Check for longitude discontinuity
    if (analysis.longitudeAnalysis.discontinuityDetected) {
      console.warn('⚠️  Longitude discontinuity detected!')
      console.log('Longitude bins:', analysis.longitudeAnalysis.longitudeBins)
    }
    
    // Check for problem locations
    if (analysis.summary.problemLocations.length > 0) {
      console.warn('⚠️  Problem locations detected:', analysis.summary.problemLocations)
    }
    
    expect(analysis.summary.totalPoints).toBeGreaterThan(0)
  }, 120000) // 2 minute timeout for multiple API calls

  it('should detect longitude discontinuity around -20°', async () => {
    // Test specific longitude range around the problematic -20° area
    const longitudeTestPoints = [
      { lat: 40, lng: -30 },
      { lat: 40, lng: -25 },
      { lat: 40, lng: -20 },
      { lat: 40, lng: -15 },
      { lat: 40, lng: -10 },
    ]
    
    const results = []
    
    for (const location of longitudeTestPoints) {
      try {
        const result = await IrradianceValidator.validateSinglePoint(location, testDate)
        results.push(result)
        console.log(`Longitude ${location.lng}°: GHI computed=${result.computed.ghi.toFixed(1)}, reference=${result.reference.ghi.toFixed(1)}, error=${result.relativeErrors.ghiRelative.toFixed(1)}%`)
      } catch (error) {
        console.warn(`Failed to validate ${location.lat}°, ${location.lng}°:`, error)
      }
    }
    
    expect(results.length).toBeGreaterThan(0)
    
    // Check for sudden changes in computed values around -20°
    const sortedResults = results.sort((a, b) => a.location.lng - b.location.lng)
    
    for (let i = 1; i < sortedResults.length; i++) {
      const prev = sortedResults[i - 1]
      const curr = sortedResults[i]
      const ghiChange = Math.abs(curr.computed.ghi - prev.computed.ghi)
      const dniChange = Math.abs(curr.computed.dni - prev.computed.dni)
      
      console.log(`Longitude change ${prev.location.lng}° → ${curr.location.lng}°: GHI change ${ghiChange.toFixed(1)}, DNI change ${dniChange.toFixed(1)}`)
      
      // Flag if there's a sudden jump (more than 50% change in computed values)
      if (ghiChange > 100 || dniChange > 100) {
        console.warn(`⚠️  Sudden irradiance change detected between ${prev.location.lng}° and ${curr.location.lng}°`)
      }
    }
  }, 60000)

  it('should export validation results to CSV', async () => {
    const location = { lat: 40.7128, lng: -74.0060 }
    const result = await IrradianceValidator.validateSinglePoint(location, testDate)
    
    const csv = IrradianceValidator.exportToCSV([result])
    
    expect(csv).toContain('Latitude,Longitude,Date')
    expect(csv).toContain('Computed_GHI,Computed_DNI,Computed_DHI,Computed_POA')
    expect(csv).toContain('Reference_GHI,Reference_DNI,Reference_DHI')
    expect(csv).toContain('GHI_Error,DNI_Error,DHI_Error')
    expect(csv).toContain('40.7128,-74.0060')
    
    console.log('CSV export sample:')
    console.log(csv.split('\n').slice(0, 3).join('\n'))
  }, 30000)

  it('should validate geographic sweep (limited scope)', async () => {
    // Limited sweep to avoid rate limiting
    const results = await IrradianceValidator.validateGeographicSweep(
      -30, 30, // Latitude: -30° to 30°
      -60, 60, // Longitude: -60° to 60°
      20,      // Step size: 20°
      testDate,
      30,      // Tilt: 30°
      180      // Azimuth: 180° (south)
    )
    
    expect(results.length).toBeGreaterThan(0)
    
    const analysis = IrradianceValidator.analyzeResults(results)
    console.log('Geographic sweep analysis:', {
      totalPoints: analysis.summary.totalPoints,
      averageErrors: analysis.summary.averageErrors,
      maxErrors: analysis.summary.maxErrors,
      discontinuityDetected: analysis.longitudeAnalysis.discontinuityDetected
    })
    
    // Check if longitude discontinuity is detected
    if (analysis.longitudeAnalysis.discontinuityDetected) {
      console.warn('⚠️  Longitude discontinuity detected in geographic sweep!')
      console.log('Longitude bins with errors:', analysis.longitudeAnalysis.longitudeBins)
    }
    
    expect(analysis.summary.totalPoints).toBeGreaterThan(0)
  }, 300000) // 5 minute timeout for geographic sweep
})
