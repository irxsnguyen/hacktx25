import { describe, it, expect } from 'vitest'
import { SolarPositionCalculator, IrradianceCalculator } from '../../utils/solarCalculations'
import { Coordinates, SolarCalculationParams } from '../../types'

interface DiagnosticResult {
  lat: number
  lon: number
  mode: 'FIXED_UTC' | 'SOLAR_NOON'
  utcTime: string
  hourAngle: number
  zenith: number
  azimuth: number
  cosIncidence: number
  beamPOA: number
  diffusePOA: number
  groundReflected: number
  totalPOA: number
  dni: number
  dhi: number
  ghi: number
  ghiError: number
  negativeCosCount: number
  unitViolations: string[]
}

describe('Irradiance Computation Diagnostics', () => {
  const testDate = new Date(2025, 5, 21) // June 21, 2025 (summer solstice)
  const latitudeBands = [15, 35, 55] // North latitudes
  const longitudeRange = { min: -80, max: 40, step: 1 }
  
  it('should run Fixed UTC sweep diagnostics', async () => {
    console.log('\n=== FIXED UTC SWEEP DIAGNOSTICS ===')
    const results: DiagnosticResult[] = []
    
    for (const lat of latitudeBands) {
      console.log(`\nLatitude: ${lat}°N`)
      console.log('Lon\tMode\t\tH_deg\tθz_deg\tψs_deg\tcosθi\tEb_POA\tEd_POA\tEr_POA\tPOA_total\tGHI_err')
      
      for (let lon = longitudeRange.min; lon <= longitudeRange.max; lon += longitudeRange.step) {
        const result = await runDiagnosticAtPoint(lat, lon, 'FIXED_UTC', testDate)
        results.push(result)
        
        // Log key diagnostics for this longitude
        if (lon % 10 === 0) { // Log every 10th longitude for readability
          console.log(`${lon}\t${result.mode}\t${result.hourAngle.toFixed(1)}\t${result.zenith.toFixed(1)}\t${result.azimuth.toFixed(1)}\t${result.cosIncidence.toFixed(3)}\t${result.beamPOA.toFixed(1)}\t${result.diffusePOA.toFixed(1)}\t${result.groundReflected.toFixed(1)}\t${result.totalPOA.toFixed(1)}\t${result.ghiError.toFixed(3)}`)
        }
      }
    }
    
    // Analyze results
    analyzeResults(results, 'FIXED_UTC')
  })
  
  it('should run Solar Noon sweep diagnostics', async () => {
    console.log('\n=== SOLAR NOON SWEEP DIAGNOSTICS ===')
    const results: DiagnosticResult[] = []
    
    for (const lat of latitudeBands) {
      console.log(`\nLatitude: ${lat}°N`)
      console.log('Lon\tMode\t\tH_deg\tθz_deg\tψs_deg\tcosθi\tEb_POA\tEd_POA\tEr_POA\tPOA_total\tGHI_err')
      
      for (let lon = longitudeRange.min; lon <= longitudeRange.max; lon += longitudeRange.step) {
        const result = await runDiagnosticAtPoint(lat, lon, 'SOLAR_NOON', testDate)
        results.push(result)
        
        // Log key diagnostics for this longitude
        if (lon % 10 === 0) { // Log every 10th longitude for readability
          console.log(`${lon}\t${result.mode}\t${result.hourAngle.toFixed(1)}\t${result.zenith.toFixed(1)}\t${result.azimuth.toFixed(1)}\t${result.cosIncidence.toFixed(3)}\t${result.beamPOA.toFixed(1)}\t${result.diffusePOA.toFixed(1)}\t${result.groundReflected.toFixed(1)}\t${result.totalPOA.toFixed(1)}\t${result.ghiError.toFixed(3)}`)
        }
      }
    }
    
    // Analyze results
    analyzeResults(results, 'SOLAR_NOON')
  })
  
  it('should test azimuth wrap continuity', async () => {
    console.log('\n=== AZIMUTH WRAP CONTINUITY TEST ===')
    const testLat = 35
    const testLon = -20
    const azimuthTestValues = [358, 359, 0, 1, 2]
    
    console.log('Testing azimuth wrap around 0°/360°:')
    console.log('Azimuth\tcosθi\tBeam_POA\tContinuity')
    
    for (const azimuth of azimuthTestValues) {
      // Create a mock solar position with specific azimuth
      const mockSolarPos = {
        elevation: 45 * Math.PI / 180, // 45 degrees in radians
        azimuth: azimuth * Math.PI / 180 // Convert to radians
      }
      
      const tilt = 30
      const panelAzimuth = 180 // South-facing
      
      // Calculate AOI for this azimuth
      const cosIncidence = Math.sin(mockSolarPos.elevation) * Math.cos(tilt * Math.PI / 180) +
                          Math.cos(mockSolarPos.elevation) * Math.sin(tilt * Math.PI / 180) * 
                          Math.cos(mockSolarPos.azimuth - panelAzimuth * Math.PI / 180)
      
      const beamPOA = Math.max(0, cosIncidence) * 1000 // Assume 1000 W/m² DNI
      
      console.log(`${azimuth}°\t${cosIncidence.toFixed(3)}\t${beamPOA.toFixed(1)}\t${cosIncidence > 0 ? 'OK' : 'NEG'}`)
    }
  })
})

async function runDiagnosticAtPoint(
  lat: number, 
  lon: number, 
  mode: 'FIXED_UTC' | 'SOLAR_NOON',
  baseDate: Date
): Promise<DiagnosticResult> {
  // Determine the time to use
  let testTime: Date
  if (mode === 'FIXED_UTC') {
    testTime = new Date(baseDate)
    testTime.setUTCHours(12, 0, 0, 0) // 12:00 UTC
  } else {
    // Calculate solar noon for this longitude
    testTime = calculateSolarNoon(lon, baseDate)
  }
  
  // Calculate solar position
  const solarPos = SolarPositionCalculator.calculateSolarPosition(lat, lon, testTime)
  
  // Calculate diagnostic values
  const hourAngle = calculateHourAngle(testTime, lon)
  const zenith = 90 - (solarPos.elevation * 180 / Math.PI)
  const azimuth = solarPos.azimuth * 180 / Math.PI
  
  // Panel parameters
  const tilt = lat * 0.76 // Simple rule of thumb
  const panelAzimuth = lat >= 0 ? 180 : 0 // South in N hemisphere, North in S hemisphere
  
  // Calculate AOI
  const cosIncidence = Math.sin(solarPos.elevation) * Math.cos(tilt * Math.PI / 180) +
                      Math.cos(solarPos.elevation) * Math.sin(tilt * Math.PI / 180) * 
                      Math.cos(solarPos.azimuth - panelAzimuth * Math.PI / 180)
  
  // Calculate irradiance components
  const params: SolarCalculationParams = {
    latitude: lat,
    longitude: lon,
    date: testTime,
    tilt,
    azimuth: panelAzimuth,
    albedo: 0.2,
    temperatureCoeff: 0.004,
    panelEfficiency: 0.18
  }
  
  const irradiance = IrradianceCalculator.calculateIrradiance(solarPos, params)
  const poaComponents = calculatePOAComponents(irradiance, solarPos, params)
  
  // Check for unit violations
  const unitViolations: string[] = []
  if (solarPos.elevation < -Math.PI/2 || solarPos.elevation > Math.PI/2) {
    unitViolations.push('elevation_out_of_range')
  }
  if (solarPos.azimuth < -Math.PI || solarPos.azimuth > Math.PI) {
    unitViolations.push('azimuth_out_of_range')
  }
  
  // GHI consistency check
  const ghiCheck = irradiance.dni * Math.sin(solarPos.elevation) + irradiance.dhi
  const ghiError = Math.abs(irradiance.ghi - ghiCheck)
  
  return {
    lat,
    lon,
    mode,
    utcTime: testTime.toISOString(),
    hourAngle,
    zenith,
    azimuth,
    cosIncidence,
    beamPOA: poaComponents.beamPOA,
    diffusePOA: poaComponents.diffusePOA,
    groundReflected: poaComponents.groundReflected,
    totalPOA: poaComponents.totalPOA,
    dni: irradiance.dni,
    dhi: irradiance.dhi,
    ghi: irradiance.ghi,
    ghiError,
    negativeCosCount: cosIncidence < 0 ? 1 : 0,
    unitViolations
  }
}

function calculateSolarNoon(longitude: number, date: Date): Date {
  const dayOfYear = getDayOfYear(date)
  
  // Equation of Time correction
  const B = (360 / 365) * (dayOfYear - 81) * (Math.PI / 180)
  const equationOfTime = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)
  
  // Solar noon = 12:00 + longitude offset + EoT correction
  const longitudeOffsetHours = longitude / 15
  const eotOffsetHours = equationOfTime / 60
  
  const solarNoon = new Date(date)
  solarNoon.setUTCHours(12 + longitudeOffsetHours + eotOffsetHours, 0, 0, 0)
  
  return solarNoon
}

function calculateHourAngle(date: Date, longitude: number): number {
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60
  const dayOfYear = getDayOfYear(date)
  
  // Equation of Time correction
  const B = (360 / 365) * (dayOfYear - 81) * (Math.PI / 180)
  const equationOfTime = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)
  
  // Solar time = UTC + longitude offset + EoT
  const solarTime = hour + longitude / 15 + equationOfTime / 60
  const hourAngle = (solarTime - 12) * 15 // Convert to degrees
  
  return hourAngle
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function calculatePOAComponents(
  irradiance: any,
  solarPos: any,
  params: SolarCalculationParams
): {
  beamPOA: number
  diffusePOA: number
  groundReflected: number
  totalPOA: number
} {
  const { dni, dhi, ghi } = irradiance
  const { tilt, azimuth } = params
  
  // Direct component
  const cosIncidence = Math.sin(solarPos.elevation) * Math.cos(tilt * Math.PI / 180) +
                      Math.cos(solarPos.elevation) * Math.sin(tilt * Math.PI / 180) * 
                      Math.cos(solarPos.azimuth - azimuth * Math.PI / 180)
  
  const beamPOA = dni * Math.max(0, cosIncidence)
  
  // Diffuse component (simplified isotropic model)
  const diffusePOA = dhi * (1 + Math.cos(tilt * Math.PI / 180)) / 2
  
  // Ground-reflected component
  const groundReflected = ghi * 0.2 * (1 - Math.cos(tilt * Math.PI / 180)) / 2
  
  const totalPOA = beamPOA + diffusePOA + groundReflected
  
  return { beamPOA, diffusePOA, groundReflected, totalPOA }
}

function analyzeResults(results: DiagnosticResult[], mode: string): void {
  console.log(`\n=== ${mode} ANALYSIS ===`)
  
  // Calculate statistics
  const poaValues = results.map(r => r.totalPOA)
  const minPOA = Math.min(...poaValues)
  const maxPOA = Math.max(...poaValues)
  const avgPOA = poaValues.reduce((sum, val) => sum + val, 0) / poaValues.length
  const stdDevPOA = Math.sqrt(poaValues.reduce((sum, val) => sum + Math.pow(val - avgPOA, 2), 0) / poaValues.length)
  
  const negativeCosCount = results.reduce((sum, r) => sum + r.negativeCosCount, 0)
  const unitViolationCount = results.reduce((sum, r) => sum + r.unitViolations.length, 0)
  const ghiErrors = results.map(r => r.ghiError)
  const maxGhiError = Math.max(...ghiErrors)
  
  console.log(`POA Statistics:`)
  console.log(`  Min: ${minPOA.toFixed(1)} W/m²`)
  console.log(`  Max: ${maxPOA.toFixed(1)} W/m²`)
  console.log(`  Avg: ${avgPOA.toFixed(1)} W/m²`)
  console.log(`  StdDev: ${stdDevPOA.toFixed(1)} W/m²`)
  console.log(`\nValidation:`)
  console.log(`  Negative cos(θi) count: ${negativeCosCount}`)
  console.log(`  Unit violations: ${unitViolationCount}`)
  console.log(`  Max GHI error: ${maxGhiError.toFixed(3)} W/m²`)
  
  // Check for longitude discontinuity around -20°
  const discontinuityCheck = checkLongitudeDiscontinuity(results)
  console.log(`\nLongitude Discontinuity Check:`)
  console.log(`  Peak detected: ${discontinuityCheck.hasPeak}`)
  if (discontinuityCheck.hasPeak) {
    console.log(`  Peak location: ${discontinuityCheck.peakLongitude}°`)
    console.log(`  Peak magnitude: ${discontinuityCheck.peakMagnitude.toFixed(1)} W/m²`)
  }
  
  // Assertions
  expect(negativeCosCount).toBe(0) // No negative cos(θi) during day
  expect(unitViolationCount).toBe(0) // No unit violations
  expect(maxGhiError).toBeLessThan(10) // GHI consistency within 10 W/m²
  
  if (mode === 'SOLAR_NOON') {
    expect(discontinuityCheck.hasPeak).toBe(false) // No artificial peaks at solar noon
  }
}

function checkLongitudeDiscontinuity(results: DiagnosticResult[]): {
  hasPeak: boolean
  peakLongitude: number
  peakMagnitude: number
} {
  // Group by latitude and check for peaks
  const byLatitude = new Map<number, DiagnosticResult[]>()
  for (const result of results) {
    if (!byLatitude.has(result.lat)) {
      byLatitude.set(result.lat, [])
    }
    byLatitude.get(result.lat)!.push(result)
  }
  
  let maxPeak = 0
  let peakLongitude = 0
  let hasPeak = false
  
  for (const [lat, latResults] of byLatitude) {
    // Sort by longitude
    latResults.sort((a, b) => a.lon - b.lon)
    
    // Check for significant jumps in POA
    for (let i = 1; i < latResults.length - 1; i++) {
      const prev = latResults[i - 1].totalPOA
      const curr = latResults[i].totalPOA
      const next = latResults[i + 1].totalPOA
      
      // Look for local maximum
      if (curr > prev && curr > next) {
        const jump = Math.max(curr - prev, curr - next)
        if (jump > maxPeak) {
          maxPeak = jump
          peakLongitude = latResults[i].lon
          hasPeak = true
        }
      }
    }
  }
  
  return {
    hasPeak,
    peakLongitude,
    peakMagnitude: maxPeak
  }
}

