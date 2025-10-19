import { SolarPositionCalculator, IrradianceCalculator } from '../utils/solarCalculations'
import { Coordinates, SolarCalculationParams } from '../types'

/**
 * Bias correction system to eliminate geographic bias in solar potential ranking
 * 
 * Problem: Raw POA/irradiance favors lower latitudes, so "Top 5" can be dominated 
 * by geography rather than relative site quality. We want a score that reflects 
 * how good a spot is compared to its local climate baseline, not just absolute kWh.
 * 
 * Solution: Baseline-normalized, locally ranked solar potential with bias correction.
 */

export interface BiasCorrectionConfig {
  // Baseline climatology parameters
  monthlyAttenuation: number[] // 0.55-0.75 depending on month
  monthlyTemperature: number[] // Typical monthly ambient temperature
  temperatureCoeff: number     // Temperature derating coefficient
  
  // Bias correction parameters
  referenceSampleSize: number  // Number of reference points for bias fitting
  referenceRadius: number      // Radius for reference sampling (km)
  
  // RPS calculation weights
  csiWeight: number           // Weight for clear-sky index (0-1)
  percentileWeight: number    // Weight for local percentile (0-1)
  
  // Safeguards
  minBaselineRatio: number    // Minimum baseline ratio to avoid division by zero
  maxBaselineRatio: number     // Maximum baseline ratio to avoid outliers
}

export interface BiasCorrectionResult {
  location: Coordinates       // Location coordinates
  rawPOA: number              // Original POA calculation
  baselinePOA: number         // Expected baseline for this location
  correctedPOA: number        // Bias-corrected POA
  clearSkyIndex: number       // CSI = correctedPOA / baselinePOA
  localPercentile: number     // Percentile within candidate set (0-100)
  relativePotentialScore: number // Final RPS score
  biasFactors: {
    slope: number            // Affine transformation slope
    intercept: number         // Affine transformation intercept
    correlation: number       // Model-baseline correlation
  }
  // Additional fields for land price integration
  kwhPerDay?: number         // Energy output in kWh/day
  landPrice?: number         // Land price in USD/m²
  powerPerCost?: number      // Power per cost efficiency
}

export class BiasCorrectionEngine {
  private static readonly DEFAULT_CONFIG: BiasCorrectionConfig = {
    // Monthly attenuation factors (Jan-Dec)
    monthlyAttenuation: [0.55, 0.58, 0.62, 0.65, 0.68, 0.70, 0.72, 0.70, 0.68, 0.65, 0.60, 0.57],
    // Monthly temperature (°C)
    monthlyTemperature: [5, 8, 12, 16, 20, 24, 26, 25, 22, 17, 12, 7],
    temperatureCoeff: 0.004,
    
    // Bias correction
    referenceSampleSize: 12,
    referenceRadius: 2.0, // km
    
    // RPS weights
    csiWeight: 0.6,
    percentileWeight: 0.4,
    
    // Safeguards
    minBaselineRatio: 0.1,
    maxBaselineRatio: 3.0
  }

  /**
   * Calculate baseline POA for a location based on climatology proxy
   */
  static calculateBaselinePOA(
    location: Coordinates,
    dayOfYear: number,
    tilt: number,
    azimuth: number,
    config: BiasCorrectionConfig = this.DEFAULT_CONFIG
  ): number {
    const { lat: _lat, lng: _lng } = location
    
    // Get month for climatology lookup
    const month = Math.floor(dayOfYear / 30.44) // Approximate month from day of year
    const monthIndex = Math.max(0, Math.min(11, month))
    
    // Get climatology factors
    const attenuation = config.monthlyAttenuation[monthIndex]
    const ambientTemp = config.monthlyTemperature[monthIndex]
    
    // Calculate clear-sky POA for this location and day
    const clearSkyPOA = this.calculateClearSkyPOA(location, dayOfYear, tilt, azimuth)
    
    // Apply climatology attenuation
    const climatologyPOA = clearSkyPOA * attenuation
    
    // Apply temperature derating
    const temperatureDerate = 1 - config.temperatureCoeff * (ambientTemp - 25)
    const baselinePOA = climatologyPOA * Math.max(0.5, temperatureDerate)
    
    return Math.max(0, baselinePOA)
  }

  /**
   * Calculate clear-sky POA for baseline estimation
   */
  private static calculateClearSkyPOA(
    location: Coordinates,
    dayOfYear: number,
    tilt: number,
    azimuth: number
  ): number {
    const { lat, lng } = location
    
    // Use solar noon for baseline calculation
    const date = new Date(2024, 0, 1) // Start of year
    date.setDate(dayOfYear)
    date.setHours(12, 0, 0, 0) // Solar noon
    
    // Calculate solar position
    const solarPos = SolarPositionCalculator.calculateSolarPosition(lat, lng, date)
    
    if (solarPos.elevation <= 0) return 0
    
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
    
    return poa
  }

  /**
   * Sample reference points around center for bias correction
   */
  static sampleReferencePoints(
    center: Coordinates,
    radiusKm: number,
    sampleSize: number
  ): Coordinates[] {
    const points: Coordinates[] = []
    
    for (let i = 0; i < sampleSize; i++) {
      const angle = (2 * Math.PI * i) / sampleSize
      const distance = radiusKm * (0.3 + 0.7 * Math.random()) // Random distance within radius
      
      // Convert to lat/lng
      const latKm = 111 // km per degree latitude
      const lngKm = 111 * Math.cos(center.lat * Math.PI / 180)
      
      const lat = center.lat + (distance * Math.cos(angle)) / latKm
      const lng = center.lng + (distance * Math.sin(angle)) / lngKm
      
      points.push({ lat, lng })
    }
    
    return points
  }

  /**
   * Calculate bias correction factors by comparing model vs baseline
   */
  static calculateBiasFactors(
    referencePoints: Coordinates[],
    dayOfYear: number,
    tilt: number,
    azimuth: number,
    config: BiasCorrectionConfig = this.DEFAULT_CONFIG
  ): { slope: number; intercept: number; correlation: number } {
    const modelValues: number[] = []
    const baselineValues: number[] = []
    
    // Calculate both model and baseline for each reference point
    for (const point of referencePoints) {
      // Model POA (our current calculation)
      const modelPOA = this.calculateModelPOA(point, dayOfYear, tilt, azimuth)
      modelValues.push(modelPOA)
      
      // Baseline POA (climatology proxy)
      const baselinePOA = this.calculateBaselinePOA(point, dayOfYear, tilt, azimuth, config)
      baselineValues.push(baselinePOA)
    }
    
    // Calculate affine transformation: baseline ≈ slope * model + intercept
    const { slope, intercept, correlation } = this.fitAffineTransformation(modelValues, baselineValues)
    
    return { slope, intercept, correlation }
  }

  /**
   * Calculate model POA using current solar calculation method
   */
  private static calculateModelPOA(
    location: Coordinates,
    dayOfYear: number,
    tilt: number,
    azimuth: number
  ): number {
    const { lat, lng } = location
    
    // Use solar noon for model calculation
    const date = new Date(2024, 0, 1)
    date.setDate(dayOfYear)
    date.setHours(12, 0, 0, 0)
    
    // Calculate solar position
    const solarPos = SolarPositionCalculator.calculateSolarPosition(lat, lng, date)
    
    if (solarPos.elevation <= 0) return 0
    
    // Calculate irradiance and POA
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
    
    return poa
  }

  /**
   * Fit affine transformation between model and baseline values
   */
  private static fitAffineTransformation(
    modelValues: number[],
    baselineValues: number[]
  ): { slope: number; intercept: number; correlation: number } {
    const n = modelValues.length
    
    if (n < 2) {
      return { slope: 1, intercept: 0, correlation: 0 }
    }
    
    // Calculate means
    const modelMean = modelValues.reduce((sum, val) => sum + val, 0) / n
    const baselineMean = baselineValues.reduce((sum, val) => sum + val, 0) / n
    
    // Calculate slope and intercept using least squares
    let numerator = 0
    let denominator = 0
    
    for (let i = 0; i < n; i++) {
      const modelDiff = modelValues[i] - modelMean
      const baselineDiff = baselineValues[i] - baselineMean
      
      numerator += modelDiff * baselineDiff
      denominator += modelDiff * modelDiff
    }
    
    const slope = denominator > 0 ? numerator / denominator : 1
    const intercept = baselineMean - slope * modelMean
    
    // Calculate correlation coefficient
    let modelVariance = 0
    let baselineVariance = 0
    let covariance = 0
    
    for (let i = 0; i < n; i++) {
      const modelDiff = modelValues[i] - modelMean
      const baselineDiff = baselineValues[i] - baselineMean
      
      modelVariance += modelDiff * modelDiff
      baselineVariance += baselineDiff * baselineDiff
      covariance += modelDiff * baselineDiff
    }
    
    const correlation = (modelVariance > 0 && baselineVariance > 0) 
      ? covariance / Math.sqrt(modelVariance * baselineVariance)
      : 0
    
    return { slope, intercept, correlation }
  }

  /**
   * Apply bias correction to a POA value
   */
  static applyBiasCorrection(
    rawPOA: number,
    biasFactors: { slope: number; intercept: number; correlation: number },
    _config: BiasCorrectionConfig = this.DEFAULT_CONFIG
  ): number {
    const { slope, intercept, correlation } = biasFactors
    
    // If correlation is too low, use multiplicative correction
    if (Math.abs(correlation) < 0.3) {
      // Fallback to multiplicative correction
      return rawPOA * 1.0 // No correction if correlation is poor
    }
    
    // Apply affine transformation
    const correctedPOA = slope * rawPOA + intercept
    
    // Apply safeguards
    return Math.max(0, correctedPOA)
  }

  /**
   * Calculate Relative Potential Score (RPS) for a candidate
   */
  static calculateRPS(
    _rawPOA: number,
    baselinePOA: number,
    correctedPOA: number,
    localPercentile: number,
    config: BiasCorrectionConfig = this.DEFAULT_CONFIG
  ): number {
    // Calculate clear-sky index
    const csi = baselinePOA > 0 
      ? Math.max(0, Math.min(2, correctedPOA / baselinePOA))
      : 0
    
    // Normalize local percentile to 0-1
    const normalizedPercentile = localPercentile / 100
    
    // Calculate weighted RPS
    const rps = (config.csiWeight * csi) + (config.percentileWeight * normalizedPercentile)
    
    return Math.max(0, rps)
  }

  /**
   * Calculate local percentile within candidate set
   */
  static calculateLocalPercentile(
    candidatePOA: number,
    allCandidates: number[]
  ): number {
    if (allCandidates.length <= 1) return 50
    
    // Sort candidates and find rank
    const sortedCandidates = [...allCandidates].sort((a, b) => a - b)
    const rank = sortedCandidates.findIndex(poa => poa >= candidatePOA)
    
    if (rank === -1) return 100 // Highest value
    if (rank === 0) return 0    // Lowest value
    
    // Calculate percentile
    const percentile = (rank / (sortedCandidates.length - 1)) * 100
    
    return Math.max(0, Math.min(100, percentile))
  }

  /**
   * Process a single candidate with full bias correction pipeline
   */
  static processCandidate(
    location: Coordinates,
    rawPOA: number,
    dayOfYear: number,
    tilt: number,
    azimuth: number,
    allCandidates: number[],
    biasFactors: { slope: number; intercept: number; correlation: number },
    _config: BiasCorrectionConfig = this.DEFAULT_CONFIG
  ): BiasCorrectionResult {
    // Calculate baseline
    const baselinePOA = this.calculateBaselinePOA(location, dayOfYear, tilt, azimuth, _config)
    
    // Apply bias correction
    const correctedPOA = this.applyBiasCorrection(rawPOA, biasFactors, _config)
    
    // Calculate clear-sky index
    const clearSkyIndex = baselinePOA > 0 
      ? Math.max(0, Math.min(2, correctedPOA / baselinePOA))
      : 0
    
    // Calculate local percentile
    const localPercentile = this.calculateLocalPercentile(correctedPOA, allCandidates)
    
    // Calculate RPS
    const relativePotentialScore = this.calculateRPS(
      rawPOA,
      baselinePOA,
      correctedPOA,
      localPercentile,
      _config
    )
    
    return {
      location,
      rawPOA,
      baselinePOA,
      correctedPOA,
      clearSkyIndex,
      localPercentile,
      relativePotentialScore,
      biasFactors
    }
  }

  /**
   * Process all candidates with bias correction
   */
  static processAllCandidates(
    candidates: Array<{ location: Coordinates; rawPOA: number }>,
    dayOfYear: number,
    tilt: number,
    azimuth: number,
    config: BiasCorrectionConfig = this.DEFAULT_CONFIG
  ): BiasCorrectionResult[] {
    // Sample reference points for bias correction
    const center = candidates[0]?.location || { lat: 0, lng: 0 }
    const referencePoints = this.sampleReferencePoints(
      center,
      config.referenceRadius,
      config.referenceSampleSize
    )
    
    // Calculate bias factors
    const biasFactors = this.calculateBiasFactors(
      referencePoints,
      dayOfYear,
      tilt,
      azimuth,
      config
    )
    
    // Extract all POA values for percentile calculation
    const allPOAs = candidates.map(c => c.rawPOA)
    
    // Process each candidate
    const results: BiasCorrectionResult[] = []
    
    for (const candidate of candidates) {
      const result = this.processCandidate(
        candidate.location,
        candidate.rawPOA,
        dayOfYear,
        tilt,
        azimuth,
        allPOAs,
        biasFactors,
        config
      )
      results.push(result)
    }
    
    return results
  }
}
