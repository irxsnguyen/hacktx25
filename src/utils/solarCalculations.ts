import { Coordinates, SolarPosition, IrradianceData, SolarCalculationParams } from '../types'
import { BiasCorrectionEngine, BiasCorrectionResult } from '../lib/biasCorrection'
import { LandPriceEstimator, LandPriceResult } from '../lib/landPriceEstimator'
import { ExclusionMask } from '../lib/exclusionMask'

/**
 * Solar position calculations using simplified solar position algorithm
 */
export class SolarPositionCalculator {
  /**
   * Calculate solar position for given date and location
   */
  static calculateSolarPosition(
    lat: number,
    lon: number,
    date: Date
  ): SolarPosition {
    const dayOfYear = this.getDayOfYear(date)
    
    // Convert UTC time to local solar time
    const utcHour = date.getUTCHours() + date.getUTCMinutes() / 60
    const localSolarTime = this.convertToLocalSolarTime(utcHour, lon, dayOfYear)

    // Solar declination angle
    const declination = this.calculateDeclination(dayOfYear)

    // Hour angle using local solar time
    const hourAngle = this.calculateHourAngle(localSolarTime)

    // Solar elevation angle
    const elevation = this.calculateElevation(lat, declination, hourAngle)

    // Solar azimuth angle
    const azimuth = this.calculateAzimuth(lat, declination, hourAngle, elevation)

    return { elevation, azimuth }
  }

  static getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0)
    const diff = date.getTime() - start.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  static calculateDeclination(dayOfYear: number): number {
    const declination = 23.45 * Math.sin((284 + dayOfYear) * (Math.PI / 180))
    return (declination * Math.PI) / 180
  }

  /**
   * Convert UTC time to local solar time
   */
  private static convertToLocalSolarTime(utcHour: number, longitude: number, dayOfYear: number): number {
    // Equation of Time correction
    const B = (360 / 365) * (dayOfYear - 81) * (Math.PI / 180)
    const equationOfTime = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)
    
    // Local solar time = UTC + longitude offset + EoT
    return utcHour + longitude / 15 + equationOfTime / 60
  }


  /**
   * Calculate hour angle from solar time
   */
  private static calculateHourAngle(solarTime: number): number {
    return ((solarTime - 12) * 15 * Math.PI) / 180
  }

  /**
   * Calculate hour angle with longitude correction and Equation of Time
   */
  static calculateHourAngleWithLongitude(hour: number, longitude: number, dayOfYear: number): number {
    // Equation of Time correction
    const B = (360 / 365) * (dayOfYear - 81) * (Math.PI / 180)
    const equationOfTime = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)
    
    // Solar time = local time + longitude offset + EoT
    const solarTime = hour + longitude / 15 + equationOfTime / 60
    return ((solarTime - 12) * 15 * Math.PI) / 180
  }

  /**
   * Calculate solar noon for a given longitude and date
   */
  static calculateSolarNoon(longitude: number, date: Date): Date {
    const dayOfYear = this.getDayOfYear(date)
    
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

  static calculateElevation(
    lat: number,
    declination: number,
    hourAngle: number
  ): number {
    const latRad = (lat * Math.PI) / 180
    const elevation = Math.asin(
      Math.sin(declination) * Math.sin(latRad) +
        Math.cos(declination) * Math.cos(latRad) * Math.cos(hourAngle)
    )
    return elevation
  }

  static calculateAzimuth(
    lat: number,
    declination: number,
    hourAngle: number,
    _elevation: number
  ): number {
    const latRad = (lat * Math.PI) / 180
    const azimuth = Math.atan2(
      Math.sin(hourAngle),
      Math.cos(hourAngle) * Math.sin(latRad) -
        Math.tan(declination) * Math.cos(latRad)
    )
    return azimuth
  }
}

/**
 * Irradiance calculations for solar potential analysis
 */
export class IrradianceCalculator {
  private static readonly SOLAR_CONSTANT = 1367 // W/m²
  private static readonly CLEAR_SKY_ATTENUATION = 0.75
  private static readonly DIFFUSE_FRACTION = 0.15
  private static readonly ALBEDO = 0.2
  // private static readonly PANEL_EFFICIENCY = 0.18
  // private static readonly TEMPERATURE_COEFF = 0.004

  /**
   * Calculate irradiance components for a given solar position
   */
  static calculateIrradiance(
    solarPos: SolarPosition,
    params: SolarCalculationParams
  ): IrradianceData {
    const { elevation } = solarPos
    const { latitude, tilt, azimuth } = params

    // Incidence angle calculation
    const incidenceAngle = this.calculateIncidenceAngle(
      solarPos,
      latitude,
      tilt,
      azimuth
    )

    // Direct Normal Irradiance (DNI)
    const dni = this.calculateDNI(elevation, incidenceAngle)

    // Diffuse Horizontal Irradiance (DHI)
    const dhi = this.calculateDHI(dni, elevation)

    // Global Horizontal Irradiance (GHI)
    const ghi = dni * Math.sin(elevation) + dhi

    return { dni, dhi, ghi }
  }

  static calculateIncidenceAngle(
    solarPos: SolarPosition,
    _latitude: number,
    tilt: number,
    azimuth: number
  ): number {
    const { elevation, azimuth: solarAzimuth } = solarPos
    // const _latRad = (latitude * Math.PI) / 180
    const tiltRad = (tilt * Math.PI) / 180
    const azimuthRad = (azimuth * Math.PI) / 180
    const solarAzimuthRad = (solarAzimuth * Math.PI) / 180

    const cosIncidence =
      Math.sin(elevation) * Math.cos(tiltRad) +
      Math.cos(elevation) * Math.sin(tiltRad) * Math.cos(solarAzimuthRad - azimuthRad)

    return Math.acos(Math.max(0, cosIncidence))
  }

  private static calculateDNI(elevation: number, incidenceAngle: number): number {
    if (elevation <= 0) return 0

    const airMass = 1 / Math.sin(elevation)
    const atmosphericTransmittance = Math.pow(0.7, Math.pow(airMass, 0.678))

    return (
      this.SOLAR_CONSTANT *
      Math.max(0, Math.cos(incidenceAngle)) *
      atmosphericTransmittance *
      this.CLEAR_SKY_ATTENUATION
    )
  }

  private static calculateDHI(dni: number, elevation: number): number {
    if (elevation <= 0) return 0
    return dni * Math.sin(elevation) * this.DIFFUSE_FRACTION
  }

  /**
   * Calculate plane-of-array irradiance
   */
  static calculatePOAIrradiance(
    irradiance: IrradianceData,
    solarPos: SolarPosition,
    params: SolarCalculationParams
  ): number {
    const { dni, dhi } = irradiance
    const { tilt, azimuth } = params
    const { elevation: _elevation } = solarPos

    // Direct component
    const incidenceAngle = this.calculateIncidenceAngle(
      solarPos,
      params.latitude,
      tilt,
      azimuth
    )
    const directComponent = dni * Math.max(0, Math.cos(incidenceAngle))

    // Diffuse component (simplified isotropic model)
    const diffuseComponent = dhi * (1 + Math.cos((tilt * Math.PI) / 180)) / 2

    // Ground-reflected component
    const groundReflected = irradiance.ghi * this.ALBEDO * (1 - Math.cos((tilt * Math.PI) / 180)) / 2

    return directComponent + diffuseComponent + groundReflected
  }

  /**
   * Calculate daily energy production in kWh/m²
   */
  static calculateDailyEnergy(
    poaIrradiance: number,
    params: SolarCalculationParams
  ): number {
    const { panelEfficiency, temperatureCoeff } = params
    
    // Simple temperature derating (ambient + irradiance-driven rise)
    const cellTemperature = 25 + poaIrradiance * 0.03
    const efficiencyDerate = panelEfficiency * (1 - temperatureCoeff * (cellTemperature - 25))
    
    // Convert W/m² to kWh/m² (assuming 1 hour integration)
    return (poaIrradiance * efficiencyDerate) / 1000
  }
}

/**
 * Main solar potential analyzer
 */
export class SolarPotentialAnalyzer {
  /**
   * Analyze solar potential for a grid of points within radius
   * 
   * Uses bias-corrected ranking to eliminate geographic bias and rank by
   * relative potential score (RPS) rather than absolute irradiance.
   * 
   * Now includes land price integration for cost-adjusted analysis:
   * - Attaches land price data to each evaluated location
   * - Calculates cost-adjusted metrics (solar output per dollar)
   * - Enables ranking by cost efficiency rather than just solar potential
   * 
   * Key improvements:
   * - Baseline-normalized scoring eliminates latitude bias
   * - Local percentile ranking prevents "bottom hugging"
   * - Bias correction accounts for model-climatology differences
   * - Land price integration enables economic analysis
   * - Still exposes absolute kWh/day for transparency
   */
  static async analyzeSolarPotential(
    center: Coordinates,
    radiusKm: number,
    urbanPenalty: boolean = false,
    includeLandPrices: boolean = true,
    rankByCostEfficiency: boolean = true,
    exclusionConfig?: { enabled: boolean; bufferMeters: number; includeWater: boolean; includeSensitive: boolean },
    onProgress?: (percentage: number, status: string, message: string) => void
  ): Promise<{ coordinates: Coordinates; score: number; kwhPerDay: number; landPrice?: number; powerPerCost?: number }[]> {
    // Stage 1: Grid Generation (10%)
    onProgress?.(10, 'grid-generation', 'Generating candidate grid...')
    let gridPoints = this.generateGridPoints(center, radiusKm)
    
    // Apply exclusion filtering if enabled
    if (exclusionConfig?.enabled) {
      onProgress?.(15, 'grid-generation', 'Filtering excluded areas...')
      const filteredPoints: Coordinates[] = []
      let excludedCount = 0
      
      for (const point of gridPoints) {
        const exclusionResult = await ExclusionMask.isPointExcluded(
          point.lat,
          point.lng,
          center,
          radiusKm,
          {
            enabled: true,
            bufferMeters: exclusionConfig.bufferMeters,
            tagSetVersion: '1.0',
            cacheExpiryDays: 7,
            apiTimeout: 10000,
            includeWater: exclusionConfig.includeWater,
            includeSensitive: exclusionConfig.includeSensitive
          }
        )
        
        if (!exclusionResult.isExcluded) {
          filteredPoints.push(point)
        } else {
          excludedCount++
        }
      }
      
      gridPoints = filteredPoints
      console.log(`Exclusion filtering: ${excludedCount} points excluded (${Math.round(excludedCount / (gridPoints.length + excludedCount) * 100)}%)`)
    }
    
    // Stage 2: Calculate raw POA for all candidates (10% → 50%)
    onProgress?.(20, 'irradiance-computation', 'Calculating raw solar potential...')
    
    const candidates: Array<{ location: Coordinates; rawPOA: number }> = []
    const totalPoints = gridPoints.length
    
    for (let i = 0; i < gridPoints.length; i++) {
      const point = gridPoints[i]
      const rawPOA = await this.calculateRawPOA(point, urbanPenalty)
      candidates.push({ location: point, rawPOA })
      
      // Update progress during computation (20% → 50%)
      const progress = 20 + (i / totalPoints) * 30
      onProgress?.(Math.round(progress), 'irradiance-computation', `Processing ${i + 1} of ${totalPoints} locations...`)
    }

    // Stage 3: Apply bias correction (50% → 80%)
    onProgress?.(50, 'bias-correction', 'Applying bias correction and baseline normalization...')
    
    const dayOfYear = SolarPositionCalculator.getDayOfYear(new Date())
    const tilt = center.lat * 0.76 // Simple rule of thumb
    const azimuth = center.lat >= 0 ? 180 : 0 // South in N hemisphere, North in S hemisphere
    
    // Process all candidates with bias correction
    const biasResults = BiasCorrectionEngine.processAllCandidates(
      candidates,
      dayOfYear,
      tilt,
      azimuth
    )
    
    onProgress?.(80, 'bias-correction', 'Bias correction complete!')

    // Stage 4: Land price integration (80% → 90%)
    let landPriceResults: LandPriceResult[] = []
    if (includeLandPrices) {
      onProgress?.(80, 'land-prices', 'Fetching land price data...')
      
      // Get land prices for all candidates
      const locations = biasResults.map(result => result.location)
      
      try {
        landPriceResults = await LandPriceEstimator.getLandPrices(locations)
        onProgress?.(90, 'land-prices', 'Land price data integrated!')
      } catch (error) {
        console.warn('Land price lookup failed, continuing without cost data:', error)
        onProgress?.(90, 'land-prices', 'Land price lookup failed, using solar-only ranking')
      }
    }

    // Stage 5: Calculate power-per-cost scores and rank (90% → 100%)
    onProgress?.(90, 'ranking', 'Calculating power-per-cost scores and ranking...')
    
    // Calculate power-per-cost for each candidate
    const candidatesWithCosts = biasResults.map(result => {
      const landPriceData = landPriceResults.find(lp => 
        lp.location.lat === result.location.lat && 
        lp.location.lng === result.location.lng
      )
      
      const kwhPerDay = result.correctedPOA * 0.1 // Convert to kWh/day estimate
      const landPrice = landPriceData?.pricePerSquareMeter || 1.0 // Default to $1/m²
      const powerPerCost = LandPriceEstimator.calculatePowerPerCost(kwhPerDay, landPrice)
      
      return {
        ...result,
        kwhPerDay,
        landPrice,
        powerPerCost
      }
    })
    
    // Sort by power-per-cost if enabled, otherwise by RPS
    const sortedResults = rankByCostEfficiency && includeLandPrices
      ? candidatesWithCosts
          .sort((a, b) => b.powerPerCost - a.powerPerCost)
          .slice(0, 20) // Take top 20 for spacing consideration
      : candidatesWithCosts
          .sort((a, b) => b.relativePotentialScore - a.relativePotentialScore)
          .slice(0, 20)
    
    // Apply spacing constraint to prevent clustering
    const topResults = this.applySpacingToBiasResults(sortedResults, center)
    
    // Convert to expected format
    const finalResults = topResults.map(result => ({
      coordinates: result.location,
      score: result.relativePotentialScore,
      kwhPerDay: result.kwhPerDay || 0,
      landPrice: result.landPrice,
      powerPerCost: result.powerPerCost
    }))

    // Stage 6: Completion (100%)
    onProgress?.(100, 'complete', 'Analysis complete!')
    
    return finalResults
  }

  private static generateGridPoints(center: Coordinates, radiusKm: number): Coordinates[] {
    return this.generateRandomSampling(center, radiusKm)
  }

  /**
   * Generates a seeded random sampling of points within the search radius
   * 
   * Benefits of random sampling:
   * - Eliminates directional bias completely
   * - Blue-noise style distribution for even coverage
   * - Deterministic results for same inputs (seeded)
   * - Uniform distribution across circular area
   */
  private static generateRandomSampling(center: Coordinates, radiusKm: number): Coordinates[] {
    const points: Coordinates[] = []
    
    // Calculate target number of points based on radius
    // Formula: radius² × 30, with bounds 200-2000 points
    const targetPointCount = Math.min(2000, Math.max(200, Math.round(radiusKm * radiusKm * 30)))
    
    // Create seeded random number generator
    const rng = this.createSeededRNG(center.lat, center.lng, radiusKm)
    
    // Generate random points uniformly distributed in the circle
    for (let i = 0; i < targetPointCount; i++) {
      const point = this.generateRandomPointInCircle(center, radiusKm, rng)
      points.push(point)
    }
    
    return points
  }



  private static calculateUrbanFactor(lat: number): number {
    // Simplified urban penalty based on latitude
    return Math.max(0.7, 1 - Math.abs(lat) / 90 * 0.3)
  }

  private static calculateSkyViewFactor(lat: number): number {
    // Simplified sky view factor
    return Math.max(0.8, 1 - Math.abs(lat) / 90 * 0.2)
  }


  /**
   * Creates a seeded random number generator for deterministic results
   */
  private static createSeededRNG(lat: number, lng: number, radiusKm: number): () => number {
    // Create a simple hash from the input parameters
    const seed = this.simpleHash(lat, lng, radiusKm)
    let state = seed
    
    return () => {
      // Linear congruential generator (LCG)
      state = (state * 1664525 + 1013904223) % 4294967296
      return state / 4294967296
    }
  }

  /**
   * Simple hash function to create seed from input parameters
   */
  private static simpleHash(lat: number, lng: number, radiusKm: number): number {
    // Convert to integers and combine
    const latInt = Math.floor(lat * 1000000)
    const lngInt = Math.floor(lng * 1000000)
    const radiusInt = Math.floor(radiusKm * 1000)
    
    // Simple hash combination
    let hash = latInt
    hash = ((hash << 5) - hash + lngInt) & 0xffffffff
    hash = ((hash << 5) - hash + radiusInt) & 0xffffffff
    
    return Math.abs(hash)
  }

  /**
   * Generates a random point uniformly distributed within the circle
   */
  private static generateRandomPointInCircle(
    center: Coordinates, 
    radiusKm: number, 
    rng: () => number
  ): Coordinates {
    // Generate random radius and angle for uniform distribution in circle
    // Use sqrt(random()) for radius to ensure uniform area distribution
    const randomRadius = radiusKm * Math.sqrt(rng())
    const randomAngle = 2 * Math.PI * rng()
    
    // Convert polar to Cartesian coordinates
    const x = randomRadius * Math.cos(randomAngle)
    const y = randomRadius * Math.sin(randomAngle)
    
    // Convert to lat/lng coordinates
    const latKm = 111 // km per degree latitude
    const lngKm = 111 * Math.cos(center.lat * Math.PI / 180) // km per degree longitude at this latitude
    
    const lat = center.lat + y / latKm
    const lng = center.lng + x / lngKm
    
    return { lat, lng }
  }

  private static calculateDistance(point1: Coordinates, point2: Coordinates): number {
    const R = 6371 // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180
    const dLng = (point2.lng - point1.lng) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  /**
   * Calculate raw POA for a single location (without bias correction)
   */
  private static async calculateRawPOA(
    coordinates: Coordinates,
    urbanPenalty: boolean
  ): Promise<number> {
    const { lat, lng } = coordinates
    const tilt = lat * 0.76 // Simple rule of thumb
    const azimuth = lat >= 0 ? 180 : 0 // South in N hemisphere, North in S hemisphere
    
    // Use equinox for representative day
    const date = new Date(2024, 2, 20) // March 20, 2024 (spring equinox)
    
    let totalPOA = 0
    const timeSteps = 24 * 12 // 5-minute intervals
    
    for (let i = 0; i < timeSteps; i++) {
      const hour = i / 12
      const currentDate = new Date(date)
      currentDate.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0)
      
      const solarPos = SolarPositionCalculator.calculateSolarPosition(lat, lng, currentDate)
      
      if (solarPos.elevation > 0) {
        const params: SolarCalculationParams = {
          latitude: lat,
          longitude: lng,
          date: currentDate,
          tilt,
          azimuth,
          albedo: 0.2,
          temperatureCoeff: 0.004,
          panelEfficiency: 0.18
        }
        
        const irradiance = IrradianceCalculator.calculateIrradiance(solarPos, params)
        const poa = IrradianceCalculator.calculatePOAIrradiance(irradiance, solarPos, params)
        
        totalPOA += poa
      }
    }
    
    // Apply urban penalty if enabled
    if (urbanPenalty) {
      const urbanFactor = this.calculateUrbanFactor(lat)
      totalPOA *= urbanFactor
    }
    
    // Apply sky view factor
    const skyViewFactor = this.calculateSkyViewFactor(lat)
    totalPOA *= skyViewFactor
    
    return Math.max(0, totalPOA)
  }

  /**
   * Apply spacing constraint to bias-corrected results
   */
  private static applySpacingToBiasResults(
    results: BiasCorrectionResult[],
    _center: Coordinates
  ): BiasCorrectionResult[] {
    if (results.length <= 1) return results
    
    const finalResults: BiasCorrectionResult[] = []
    const minSpacingKm = 0.5 // 500m minimum spacing
    
    for (const candidate of results) {
      // Check if this candidate is far enough from already selected ones
      const tooClose = finalResults.some(selected => 
        this.calculateDistance(candidate.location, selected.location) < minSpacingKm
      )
      
      if (!tooClose) {
        finalResults.push(candidate)
        if (finalResults.length >= 5) break
      }
    }
    
    return finalResults
  }

  // ===== DIAGNOSTIC UTILITIES =====

  /**
   * Validates that an angle is in radians (between -π and π)
   */
  private static validateRadians(angle: number, name: string): void {
    if (angle < -Math.PI || angle > Math.PI) {
      console.warn(`Unit violation: ${name} = ${angle} is outside valid radian range [-π, π]`)
    }
  }


  /**
   * Checks that elevation is within expected range
   */
  private static checkElevationRange(elevation: number): void {
    if (elevation < -Math.PI/2 || elevation > Math.PI/2) {
      console.warn(`Elevation out of range: ${elevation} radians (${elevation * 180 / Math.PI}°)`)
    }
  }

  /**
   * Checks that azimuth is within expected range
   */
  private static checkAzimuthRange(azimuth: number): void {
    if (azimuth < -Math.PI || azimuth > Math.PI) {
      console.warn(`Azimuth out of range: ${azimuth} radians (${azimuth * 180 / Math.PI}°)`)
    }
  }

  /**
   * Calculates true solar noon for a given longitude and date
   */
  static calculateSolarNoon(longitude: number, date: Date): Date {
    const dayOfYear = SolarPositionCalculator.getDayOfYear(date)
    
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

  /**
   * Enhanced solar position calculation with diagnostic data
   */
  static calculateSolarPositionWithDiagnostics(
    lat: number,
    lon: number,
    date: Date
  ): SolarPosition & {
    declination: number
    hourAngle: number
    zenith: number
    convention: string
  } {
    const dayOfYear = SolarPositionCalculator.getDayOfYear(date)
    const hour = date.getHours() + date.getMinutes() / 60

    // Solar declination angle
    const declination = SolarPositionCalculator.calculateDeclination(dayOfYear)

    // Hour angle with longitude correction
    const hourAngle = SolarPositionCalculator.calculateHourAngleWithLongitude(hour, lon, dayOfYear)

    // Solar elevation angle
    const elevation = SolarPositionCalculator.calculateElevation(lat, declination, hourAngle)

    // Solar azimuth angle
    const azimuth = SolarPositionCalculator.calculateAzimuth(lat, declination, hourAngle, elevation)

    // Validate units
    SolarPotentialAnalyzer.validateRadians(elevation, 'elevation')
    SolarPotentialAnalyzer.validateRadians(azimuth, 'azimuth')
    SolarPotentialAnalyzer.checkElevationRange(elevation)
    SolarPotentialAnalyzer.checkAzimuthRange(azimuth)

    return {
      elevation,
      azimuth,
      declination: declination * 180 / Math.PI, // Convert to degrees
      hourAngle: hourAngle * 180 / Math.PI, // Convert to degrees
      zenith: 90 - (elevation * 180 / Math.PI), // Convert to degrees
      convention: '0°=North, 90°=East, 180°=South, 270°=West'
    }
  }

  /**
   * Hour angle calculation with longitude correction
   */
  static calculateHourAngleWithLongitude(hour: number, longitude: number, dayOfYear: number): number {
    // Equation of Time correction
    const B = (360 / 365) * (dayOfYear - 81) * (Math.PI / 180)
    const equationOfTime = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)
    
    // Solar time = local time + longitude offset + EoT
    const solarTime = hour + longitude / 15 + equationOfTime / 60
    return ((solarTime - 12) * 15 * Math.PI) / 180
  }

  /**
   * Validates Angle of Incidence calculations
   */
  static validateAOI(
    solarPos: SolarPosition,
    tilt: number,
    panelAzimuth: number,
    _latitude: number
  ): {
    cosIncidence: number
    aoiDegrees: number
    isNegative: boolean
    beamContribution: number
  } {
    const { elevation, azimuth } = solarPos
    const tiltRad = (tilt * Math.PI) / 180
    const azimuthRad = (panelAzimuth * Math.PI) / 180
    const solarAzimuthRad = azimuth

    const cosIncidence = Math.sin(elevation) * Math.cos(tiltRad) +
                        Math.cos(elevation) * Math.sin(tiltRad) * Math.cos(solarAzimuthRad - azimuthRad)

    const aoiDegrees = Math.acos(Math.max(-1, Math.min(1, cosIncidence))) * 180 / Math.PI
    const isNegative = cosIncidence < 0
    const beamContribution = Math.max(0, cosIncidence)

    return {
      cosIncidence,
      aoiDegrees,
      isNegative,
      beamContribution
    }
  }

  /**
   * Enhanced POA calculation with component breakdown
   */
  static calculatePOAComponents(
    irradiance: IrradianceData,
    solarPos: SolarPosition,
    params: SolarCalculationParams
  ): {
    beamPOA: number
    diffusePOA: number
    groundReflected: number
    totalPOA: number
    dni: number
    dhi: number
    ghi: number
    ghiCheck: number
    ghiError: number
  } {
    const { dni, dhi, ghi } = irradiance
    const { tilt, azimuth } = params

    // Direct component
    const incidenceAngle = IrradianceCalculator.calculateIncidenceAngle(solarPos, params.latitude, tilt, azimuth)
    const beamPOA = dni * Math.max(0, Math.cos(incidenceAngle))

    // Diffuse component (simplified isotropic model)
    const diffusePOA = dhi * (1 + Math.cos((tilt * Math.PI) / 180)) / 2

    // Ground-reflected component
    const groundReflected = ghi * 0.2 * (1 - Math.cos((tilt * Math.PI) / 180)) / 2

    const totalPOA = beamPOA + diffusePOA + groundReflected

    // GHI consistency check
    const ghiCheck = dni * Math.sin(solarPos.elevation) + dhi
    const ghiError = Math.abs(ghi - ghiCheck)

    return {
      beamPOA,
      diffusePOA,
      groundReflected,
      totalPOA,
      dni,
      dhi,
      ghi,
      ghiCheck,
      ghiError
    }
  }
}
