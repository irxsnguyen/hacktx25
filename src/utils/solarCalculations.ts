import { Coordinates, SolarPosition, IrradianceData, SolarCalculationParams } from '../types'
import { AnalysisEngine, SolarCandidate } from '../lib/analysisEngine'

/**
 * Solar position calculations using simplified solar position algorithm
 */
export class SolarPositionCalculator {
  /**
   * Calculate solar position for given date and location
   */
  static calculateSolarPosition(
    lat: number,
    _lon: number,
    date: Date
  ): SolarPosition {
    const dayOfYear = this.getDayOfYear(date)
    const hour = date.getHours() + date.getMinutes() / 60

    // Solar declination angle
    const declination = this.calculateDeclination(dayOfYear)

    // Hour angle
    const hourAngle = this.calculateHourAngle(hour)

    // Solar elevation angle
    const elevation = this.calculateElevation(lat, declination, hourAngle)

    // Solar azimuth angle
    const azimuth = this.calculateAzimuth(lat, declination, hourAngle, elevation)

    return { elevation, azimuth }
  }

  private static getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0)
    const diff = date.getTime() - start.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  private static calculateDeclination(dayOfYear: number): number {
    const declination = 23.45 * Math.sin((284 + dayOfYear) * (Math.PI / 180))
    return (declination * Math.PI) / 180
  }

  private static calculateHourAngle(hour: number): number {
    return ((hour - 12) * 15 * Math.PI) / 180
  }

  private static calculateElevation(
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

  private static calculateAzimuth(
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

  private static calculateIncidenceAngle(
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
   * Uses the new AnalysisEngine for deterministic, merit-based ranking
   */
  static async analyzeSolarPotential(
    center: Coordinates,
    radiusKm: number,
    urbanPenalty: boolean = false
  ): Promise<{ coordinates: Coordinates; score: number; kwhPerDay: number }[]> {
    const gridPoints = this.generateGridPoints(center, radiusKm)
    const candidates: SolarCandidate[] = []

    // Calculate scores for all grid points
    for (const point of gridPoints) {
      const score = await this.calculateSolarScore(point, urbanPenalty)
      const kwhPerDay = this.scoreToKwh(score)
      
      candidates.push({
        coordinates: point,
        score,
        kwhPerDay
      })
    }

    // Use the new analysis engine for proper ranking
    const topResults = AnalysisEngine.rankTopLocations(candidates, {
      maxResults: 5,
      minSpacingMeters: 100,
      minScore: 0,
      minKwhPerDay: 0
    })

    // Validate results for quality assurance
    const validation = AnalysisEngine.validateResults(topResults)
    if (!validation.isValid) {
      console.warn('Analysis validation failed:', validation.errors)
    }
    if (validation.warnings.length > 0) {
      console.warn('Analysis warnings:', validation.warnings)
    }

    return topResults
  }

  private static generateGridPoints(center: Coordinates, radiusKm: number): Coordinates[] {
    const points: Coordinates[] = []
    const stepSize = Math.max(0.15, radiusKm / 20) // ~150m minimum step
    
    // Generate grid within radius
    for (let lat = center.lat - radiusKm / 111; lat <= center.lat + radiusKm / 111; lat += stepSize / 111) {
      for (let lng = center.lng - radiusKm / (111 * Math.cos(center.lat * Math.PI / 180)); 
           lng <= center.lng + radiusKm / (111 * Math.cos(center.lat * Math.PI / 180)); 
           lng += stepSize / (111 * Math.cos(center.lat * Math.PI / 180))) {
        
        const distance = this.calculateDistance(center, { lat, lng })
        if (distance <= radiusKm) {
          points.push({ lat, lng })
        }
      }
    }
    
    return points
  }

  private static async calculateSolarScore(
    coordinates: Coordinates,
    urbanPenalty: boolean
  ): Promise<number> {
    const { lat, lng } = coordinates
    const tilt = lat * 0.76 // Simple rule of thumb
    const azimuth = lat >= 0 ? 180 : 0 // South in N hemisphere, North in S hemisphere
    
    // Use equinox for representative day
    const date = new Date(2024, 2, 20) // March 20, 2024 (spring equinox)
    
    let totalEnergy = 0
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
        const poaIrradiance = IrradianceCalculator.calculatePOAIrradiance(irradiance, solarPos, params)
        const energy = IrradianceCalculator.calculateDailyEnergy(poaIrradiance, params)
        
        totalEnergy += energy
      }
    }
    
    // Apply urban penalty if enabled
    let finalScore = totalEnergy
    if (urbanPenalty) {
      const urbanFactor = this.calculateUrbanFactor(lat)
      finalScore *= urbanFactor
    }
    
    // Apply sky view factor (simplified)
    const skyViewFactor = this.calculateSkyViewFactor(lat)
    finalScore *= skyViewFactor
    
    return Math.max(0, finalScore)
  }

  private static calculateUrbanFactor(lat: number): number {
    // Simplified urban penalty based on latitude
    return Math.max(0.7, 1 - Math.abs(lat) / 90 * 0.3)
  }

  private static calculateSkyViewFactor(lat: number): number {
    // Simplified sky view factor
    return Math.max(0.8, 1 - Math.abs(lat) / 90 * 0.2)
  }

  private static scoreToKwh(score: number): number {
    // Convert score to estimated kWh/day for 1m² panel
    return score * 0.1 // Rough conversion factor
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
}
