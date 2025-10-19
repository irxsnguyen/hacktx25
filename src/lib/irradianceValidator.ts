import { SolarPositionCalculator, IrradianceCalculator } from '../utils/solarCalculations'
import { Coordinates, SolarCalculationParams } from '../types'

/**
 * Validation result structure
 */
export interface ValidationResult {
    location: Coordinates
    date: Date
    computed: {
      ghi: number
      dni: number
      dhi: number
      poa: number
    }
    reference: {
      ghi: number
      dni: number
      dhi: number
      poa?: number
    }
    errors: {
      ghiError: number
      dniError: number
      dhiError: number
      poaError?: number
    }
    relativeErrors: {
      ghiRelative: number
      dniRelative: number
      dhiRelative: number
      poaRelative?: number
    }
    metrics: {
      rmse: number
      mae: number
      mbe: number
      r2: number
  }
}

/**
 * NASA POWER API response structure
 */
interface NASAPowerResponse {
  properties: {
    parameter: {
      ALLSKY_SFC_SW_DWN: {
        [key: string]: number[]
      }
      ALLSKY_SFC_SW_DNI: {
        [key: string]: number[]
      }
      ALLSKY_SFC_SW_DIFF: {
        [key: string]: number[]
      }
    }
  }
}

/**
 * Irradiance validation against real-world datasets
 * 
 * Compares computed irradiance values against reference data from NASA POWER,
 * NREL NSRDB, or PVGIS to identify calculation errors and validate accuracy.
 */
export class IrradianceValidator {
  private static readonly NASA_POWER_BASE_URL = 'https://power.larc.nasa.gov/api/temporal/hourly/point'

  /**
   * Validate irradiance at a single location and time
   */
  static async validateSinglePoint(
    location: Coordinates,
    date: Date,
    tilt: number = 30,
    azimuth: number = 180
  ): Promise<ValidationResult> {
    // Compute our irradiance values
    const computed = await this.computeIrradiance(location, date, tilt, azimuth)
    
    // Fetch reference data
    const reference = await this.fetchReferenceData(location, date)
    
    // Calculate errors
    const errors = this.calculateErrors(computed, reference)
    const relativeErrors = this.calculateRelativeErrors(computed, reference)
    
    // Calculate metrics
    const metrics = this.calculateMetrics(computed, reference)
    
    return {
      location,
      date,
      computed,
      reference,
      errors,
      relativeErrors,
      metrics
    }
  }

  /**
   * Validate irradiance across a geographic sweep
   */
  static async validateGeographicSweep(
    startLat: number = -60,
    endLat: number = 60,
    startLon: number = -180,
    endLon: number = 180,
    stepSize: number = 10,
    date: Date = new Date('2024-06-21T12:00:00Z'),
    tilt: number = 30,
    azimuth: number = 180
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = []
    
    console.log(`Starting geographic sweep validation...`)
    console.log(`Latitude: ${startLat}° to ${endLat}° (step: ${stepSize}°)`)
    console.log(`Longitude: ${startLon}° to ${endLon}° (step: ${stepSize}°)`)
    console.log(`Date: ${date.toISOString()}`)
    console.log(`Panel: ${tilt}° tilt, ${azimuth}° azimuth`)
    
    const totalPoints = Math.ceil((endLat - startLat) / stepSize) * Math.ceil((endLon - startLon) / stepSize)
    let currentPoint = 0
    
    for (let lat = startLat; lat <= endLat; lat += stepSize) {
      for (let lon = startLon; lon <= endLon; lon += stepSize) {
        currentPoint++
        const progress = Math.round((currentPoint / totalPoints) * 100)
        
        console.log(`Processing point ${currentPoint}/${totalPoints} (${progress}%): ${lat}°, ${lon}°`)
        
        try {
          const result = await this.validateSinglePoint(
            { lat, lng: lon },
            date,
            tilt,
            azimuth
          )
          results.push(result)
        } catch (error) {
          console.warn(`Failed to validate ${lat}°, ${lon}°:`, error)
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    return results
  }

  /**
   * Compute irradiance using our internal algorithm
   */
  private static async computeIrradiance(
    location: Coordinates,
    date: Date,
    tilt: number,
    azimuth: number
  ): Promise<{ ghi: number; dni: number; dhi: number; poa: number }> {
    const { lat, lng } = location
    
    // Calculate solar position
    const solarPos = SolarPositionCalculator.calculateSolarPosition(lat, lng, date)
    
    // Calculate irradiance components
    const params: SolarCalculationParams = {
      latitude: lat,
      longitude: lng,
      date,
      tilt,
      azimuth,
      albedo: 0.2,
      temperatureCoeff: 0.004,
      panelEfficiency: 0.18
    }
    
    const irradiance = IrradianceCalculator.calculateIrradiance(solarPos, params)
    const poa = IrradianceCalculator.calculatePOAIrradiance(irradiance, solarPos, params)
    
    return {
      ghi: irradiance.ghi,
      dni: irradiance.dni,
      dhi: irradiance.dhi,
      poa
    }
  }

  /**
   * Fetch reference data from NASA POWER API
   */
  private static async fetchReferenceData(
    location: Coordinates,
    date: Date
  ): Promise<{ ghi: number; dni: number; dhi: number }> {
    const { lat, lng } = location
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    const url = new URL(this.NASA_POWER_BASE_URL)
    url.searchParams.set('parameters', 'ALLSKY_SFC_SW_DWN,ALLSKY_SFC_SW_DNI,ALLSKY_SFC_SW_DIFF')
    url.searchParams.set('community', 'RE')
    url.searchParams.set('longitude', lng.toString())
    url.searchParams.set('latitude', lat.toString())
    url.searchParams.set('start', `${year}${month}${day}`)
    url.searchParams.set('end', `${year}${month}${day}`)
    url.searchParams.set('user', 'anonymous')
    url.searchParams.set('format', 'json')
    
    try {
      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error(`NASA POWER API error: ${response.status} ${response.statusText}`)
      }
      
      const data: NASAPowerResponse = await response.json()
      
      // Extract hourly values for the specific date
      const ghiValues = data.properties.parameter.ALLSKY_SFC_SW_DWN[`${year}${month}${day}`] || []
      const dniValues = data.properties.parameter.ALLSKY_SFC_SW_DNI[`${year}${month}${day}`] || []
      const dhiValues = data.properties.parameter.ALLSKY_SFC_SW_DIFF[`${year}${month}${day}`] || []
      
      // Get the value for the specific hour (12:00 UTC = index 12)
      const hour = date.getUTCHours()
      const ghi = ghiValues[hour] || 0
      const dni = dniValues[hour] || 0
      const dhi = dhiValues[hour] || 0
      
      return { ghi, dni, dhi }
    } catch (error) {
      console.warn(`Failed to fetch NASA POWER data for ${lat}°, ${lng}°:`, error)
      // Return zero values as fallback
      return { ghi: 0, dni: 0, dhi: 0 }
    }
  }

  /**
   * Calculate absolute errors
   */
  private static calculateErrors(
    computed: { ghi: number; dni: number; dhi: number; poa: number },
    reference: { ghi: number; dni: number; dhi: number; poa?: number }
  ): { ghiError: number; dniError: number; dhiError: number; poaError?: number } {
    return {
      ghiError: computed.ghi - reference.ghi,
      dniError: computed.dni - reference.dni,
      dhiError: computed.dhi - reference.dhi,
      poaError: reference.poa ? computed.poa - reference.poa : undefined
    }
  }

  /**
   * Calculate relative errors (percentage)
   */
  private static calculateRelativeErrors(
    computed: { ghi: number; dni: number; dhi: number; poa: number },
    reference: { ghi: number; dni: number; dhi: number; poa?: number }
  ): { ghiRelative: number; dniRelative: number; dhiRelative: number; poaRelative?: number } {
    return {
      ghiRelative: reference.ghi > 0 ? (computed.ghi - reference.ghi) / reference.ghi * 100 : 0,
      dniRelative: reference.dni > 0 ? (computed.dni - reference.dni) / reference.dni * 100 : 0,
      dhiRelative: reference.dhi > 0 ? (computed.dhi - reference.dhi) / reference.dhi * 100 : 0,
      poaRelative: reference.poa && reference.poa > 0 ? (computed.poa - reference.poa) / reference.poa * 100 : undefined
    }
  }

  /**
   * Calculate statistical metrics
   */
  private static calculateMetrics(
    computed: { ghi: number; dni: number; dhi: number; poa: number },
    reference: { ghi: number; dni: number; dhi: number; poa?: number }
  ): { rmse: number; mae: number; mbe: number; r2: number } {
    const values = [
      { computed: computed.ghi, reference: reference.ghi },
      { computed: computed.dni, reference: reference.dni },
      { computed: computed.dhi, reference: reference.dhi }
    ]
    
    if (reference.poa) {
      values.push({ computed: computed.poa, reference: reference.poa })
    }
    
    const errors = values.map(v => v.computed - v.reference)
    const n = errors.length
    
    // Mean Absolute Error (MAE)
    const mae = errors.reduce((sum, error) => sum + Math.abs(error), 0) / n
    
    // Mean Bias Error (MBE)
    const mbe = errors.reduce((sum, error) => sum + error, 0) / n
    
    // Root Mean Square Error (RMSE)
    const rmse = Math.sqrt(errors.reduce((sum, error) => sum + error * error, 0) / n)
    
    // R-squared (simplified)
    const referenceMean = values.reduce((sum, v) => sum + v.reference, 0) / n
    
    const ssRes = values.reduce((sum, v) => sum + Math.pow(v.computed - v.reference, 2), 0)
    const ssTot = values.reduce((sum, v) => sum + Math.pow(v.reference - referenceMean, 2), 0)
    const r2 = 1 - (ssRes / ssTot)
    
    return { rmse, mae, mbe, r2 }
  }

  /**
   * Analyze validation results and generate report
   */
  static analyzeResults(results: ValidationResult[]): {
    summary: {
      totalPoints: number
      averageErrors: { ghi: number; dni: number; dhi: number; poa?: number }
      maxErrors: { ghi: number; dni: number; dhi: number; poa?: number }
      problemLocations: Array<{ location: Coordinates; errors: any }>
    }
    longitudeAnalysis: {
      longitudeBins: Array<{ longitude: number; averageError: number; count: number }>
      discontinuityDetected: boolean
    }
  } {
    const totalPoints = results.length
    
    // Calculate average errors
    const averageErrors = {
      ghi: results.reduce((sum, r) => sum + Math.abs(r.errors.ghiError), 0) / totalPoints,
      dni: results.reduce((sum, r) => sum + Math.abs(r.errors.dniError), 0) / totalPoints,
      dhi: results.reduce((sum, r) => sum + Math.abs(r.errors.dhiError), 0) / totalPoints,
      poa: results.filter(r => r.errors.poaError !== undefined).length > 0 
        ? results.reduce((sum, r) => sum + Math.abs(r.errors.poaError || 0), 0) / results.filter(r => r.errors.poaError !== undefined).length
        : undefined
    }
    
    // Calculate maximum errors
    const maxErrors = {
      ghi: Math.max(...results.map(r => Math.abs(r.errors.ghiError))),
      dni: Math.max(...results.map(r => Math.abs(r.errors.dniError))),
      dhi: Math.max(...results.map(r => Math.abs(r.errors.dhiError))),
      poa: results.filter(r => r.errors.poaError !== undefined).length > 0
        ? Math.max(...results.map(r => Math.abs(r.errors.poaError || 0)))
        : undefined
    }
    
    // Find problem locations (high errors)
    const problemLocations = results
      .filter(r => Math.abs(r.errors.ghiError) > 100 || Math.abs(r.errors.dniError) > 100)
      .map(r => ({ location: r.location, errors: r.errors }))
    
    // Analyze longitude patterns
    const longitudeBins = new Map<number, { totalError: number; count: number }>()
    
    results.forEach(result => {
      const lon = Math.round(result.location.lng / 10) * 10 // Bin by 10° longitude
      const current = longitudeBins.get(lon) || { totalError: 0, count: 0 }
      longitudeBins.set(lon, {
        totalError: current.totalError + Math.abs(result.errors.ghiError),
        count: current.count + 1
      })
    })
    
    const longitudeAnalysis = {
      longitudeBins: Array.from(longitudeBins.entries()).map(([longitude, data]) => ({
        longitude,
        averageError: data.totalError / data.count,
        count: data.count
      })),
      discontinuityDetected: false // Will be set based on analysis
    }
    
    // Detect longitude discontinuity
    const sortedBins = longitudeAnalysis.longitudeBins.sort((a, b) => a.longitude - b.longitude)
    for (let i = 1; i < sortedBins.length - 1; i++) {
      const prev = sortedBins[i - 1].averageError
      const curr = sortedBins[i].averageError
      const next = sortedBins[i + 1].averageError
      
      // Check for sudden jump in error
      if (Math.abs(curr - prev) > 50 || Math.abs(next - curr) > 50) {
        longitudeAnalysis.discontinuityDetected = true
        break
      }
    }
    
    return {
      summary: {
        totalPoints,
        averageErrors,
        maxErrors,
        problemLocations
      },
      longitudeAnalysis
    }
  }

  /**
   * Export validation results to CSV
   */
  static exportToCSV(results: ValidationResult[]): string {
    const headers = [
      'Latitude', 'Longitude', 'Date',
      'Computed_GHI', 'Computed_DNI', 'Computed_DHI', 'Computed_POA',
      'Reference_GHI', 'Reference_DNI', 'Reference_DHI', 'Reference_POA',
      'GHI_Error', 'DNI_Error', 'DHI_Error', 'POA_Error',
      'GHI_Relative_Error', 'DNI_Relative_Error', 'DHI_Relative_Error', 'POA_Relative_Error',
      'RMSE', 'MAE', 'MBE', 'R2'
    ].join(',')
    
    const rows = results.map(result => [
      result.location.lat,
      result.location.lng,
      result.date.toISOString(),
      result.computed.ghi,
      result.computed.dni,
      result.computed.dhi,
      result.computed.poa,
      result.reference.ghi,
      result.reference.dni,
      result.reference.dhi,
      result.reference.poa || '',
      result.errors.ghiError,
      result.errors.dniError,
      result.errors.dhiError,
      result.errors.poaError || '',
      result.relativeErrors.ghiRelative,
      result.relativeErrors.dniRelative,
      result.relativeErrors.dhiRelative,
      result.relativeErrors.poaRelative || '',
      result.metrics.rmse,
      result.metrics.mae,
      result.metrics.mbe,
      result.metrics.r2
    ].join(','))
    
    return [headers, ...rows].join('\n')
  }
}
