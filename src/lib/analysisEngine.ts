/**
 * Solarized Analysis Engine
 * 
 * CRITIQUE OF PREVIOUS IMPLEMENTATION:
 * 
 * 1. Selection Bias: The original selectTopResults() method used a naive "first 5" approach
 *    that returned points based on iteration order, not merit. This biased results toward
 *    the northwest corner of the grid and ignored higher-value areas.
 * 
 * 2. Non-determinism: Results varied with grid alignment and loop order changes, making
 *    the same inputs produce different outputs - a critical flaw for scientific analysis.
 * 
 * 3. Edge Overfitting: Grid origin dominated picks; dense hot spots later in the scan
 *    were missed due to early exit logic.
 * 
 * 4. No Quality Control: NaN/invalid scores could pass through without filtering, and
 *    there were no tie-breakers or proper spatial de-duplication.
 * 
 * 5. Performance Tradeoff Ignored: For N≈400–1200 candidates, a full sort is cheap and
 *    provides better results than streaming approaches.
 * 
 * TARGET BEHAVIOR:
 * - Rank all valid candidates by descending kWh/day (or score)
 * - Enforce minimum spacing between winners (100m) to avoid clustering
 * - Deterministic for same inputs (no reliance on object enumeration order)
 * - Filter out invalid/NaN/negative scores
 * - Stable tie-breakers: higher kWh first, then lower latitude, then lower longitude
 */

import { Coordinates } from '../types'

export interface SolarCandidate {
  coordinates: Coordinates
  score: number
  kwhPerDay: number
}

export interface AnalysisConfig {
  maxResults: number
  minSpacingMeters: number
  minScore: number
  minKwhPerDay: number
}

export class AnalysisEngine {
  private static readonly DEFAULT_CONFIG: AnalysisConfig = {
    maxResults: 5,
    minSpacingMeters: 100,
    minScore: 0,
    minKwhPerDay: 0
  }

  /**
   * Ranks all valid candidates by descending kWh/day and returns the top results
   * with minimum spacing constraints.
   * 
   * This method ensures:
   * - Deterministic results for the same inputs
   * - Proper ranking by merit (kWh/day)
   * - Quality control (filters invalid scores)
   * - Spatial de-duplication (minimum spacing)
   * - Stable tie-breaking
   */
  static rankTopLocations(
    candidates: SolarCandidate[],
    config: Partial<AnalysisConfig> = {},
    center?: Coordinates
  ): SolarCandidate[] {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config }
    
    // Step 1: Filter out invalid candidates
    const validCandidates = this.filterValidCandidates(candidates, finalConfig)
    
    if (validCandidates.length === 0) {
      return []
    }
    
    // Step 2: Sort by merit with stable tie-breakers
    const sortedCandidates = this.sortByMerit(validCandidates, center)
    
    // Step 3: Apply minimum spacing constraint
    return this.applySpacingConstraint(sortedCandidates, finalConfig)
  }

  /**
   * Filters out invalid candidates based on score and kWh thresholds
   */
  private static filterValidCandidates(
    candidates: SolarCandidate[],
    config: AnalysisConfig
  ): SolarCandidate[] {
    return candidates.filter(candidate => {
      // Check for valid numbers (not NaN, not Infinity)
      if (!this.isValidNumber(candidate.score) || !this.isValidNumber(candidate.kwhPerDay)) {
        return false
      }
      
      // Check minimum thresholds
      if (candidate.score < config.minScore || candidate.kwhPerDay < config.minKwhPerDay) {
        return false
      }
      
      // Check for negative values (shouldn't happen with solar calculations)
      if (candidate.score < 0 || candidate.kwhPerDay < 0) {
        return false
      }
      
      return true
    })
  }

  /**
   * Sorts candidates by merit with robust deterministic tie-breakers
   * 
   * Primary sort: kWh/day (descending) - maximum solar output
   * Tie-breaker 1: Score (descending) - secondary merit metric
   * Tie-breaker 2: Distance from center (ascending) - prefer points closer to center
   * Tie-breaker 3: Latitude (ascending) - prefer southern locations as final tie-breaker
   * Tie-breaker 4: Longitude (ascending) - prefer western locations
   * 
   * This ensures completely deterministic results for identical inputs.
   */
  private static sortByMerit(candidates: SolarCandidate[], center?: Coordinates): SolarCandidate[] {
    return candidates.sort((a, b) => {
      // Primary sort: kWh/day (descending) - maximum solar output
      const kwhDiff = b.kwhPerDay - a.kwhPerDay
      if (Math.abs(kwhDiff) > 1e-12) { // Use smaller epsilon for better precision
        return kwhDiff
      }
      
      // Tie-breaker 1: Score (descending) - secondary merit
      const scoreDiff = b.score - a.score
      if (Math.abs(scoreDiff) > 1e-12) {
        return scoreDiff
      }
      
      // Tie-breaker 2: Distance from center (ascending) - prefer points closer to center
      if (center) {
        const distA = this.calculateDistance(center, a.coordinates)
        const distB = this.calculateDistance(center, b.coordinates)
        const distDiff = distA - distB
        if (Math.abs(distDiff) > 1e-12) {
          return distDiff
        }
      }
      
      // Tie-breaker 3: Latitude (ascending) - prefer southern locations as final tie-breaker
      const latDiff = a.coordinates.lat - b.coordinates.lat
      if (Math.abs(latDiff) > 1e-12) {
        return latDiff
      }
      
      // Tie-breaker 4: Longitude (ascending) - prefer western locations
      return a.coordinates.lng - b.coordinates.lng
    })
  }

  /**
   * Applies minimum spacing constraint to prevent clustering
   * 
   * This ensures the top results are spatially distributed and not clustered
   * in a single area, providing better coverage of the search region.
   */
  private static applySpacingConstraint(
    sortedCandidates: SolarCandidate[],
    config: AnalysisConfig
  ): SolarCandidate[] {
    const selected: SolarCandidate[] = []
    const minSpacingKm = config.minSpacingMeters / 1000
    
    for (const candidate of sortedCandidates) {
      if (selected.length >= config.maxResults) {
        break
      }
      
      // Check if candidate is too close to any already selected
      const tooClose = selected.some(selectedCandidate => {
        const distance = this.calculateDistance(candidate.coordinates, selectedCandidate.coordinates)
        return distance < minSpacingKm
      })
      
      if (!tooClose) {
        selected.push(candidate)
      }
    }
    
    return selected
  }

  /**
   * Validates if a number is valid (not NaN, not Infinity)
   */
  private static isValidNumber(value: number): boolean {
    return !isNaN(value) && isFinite(value)
  }

  /**
   * Calculates distance between two coordinates in kilometers
   * Uses Haversine formula for accurate distance calculation
   */
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
   * Validates analysis results for quality assurance
   * 
   * Enhanced validation for the robust hexagonal grid sampling algorithm
   */
  static validateResults(results: SolarCandidate[]): {
    isValid: boolean
    errors: string[]
    warnings: string[]
    metrics: {
      totalResults: number
      averageKwhPerDay: number
      maxKwhPerDay: number
      minKwhPerDay: number
      spatialDistribution: number
    }
  } {
    const errors: string[] = []
    const warnings: string[] = []
    
    if (results.length === 0) {
      warnings.push('No valid results found')
      return { 
        isValid: true, 
        errors, 
        warnings,
        metrics: {
          totalResults: 0,
          averageKwhPerDay: 0,
          maxKwhPerDay: 0,
          minKwhPerDay: 0,
          spatialDistribution: 0
        }
      }
    }
    
    // Check for duplicate coordinates
    const coordinates = results.map(r => `${r.coordinates.lat},${r.coordinates.lng}`)
    const uniqueCoordinates = new Set(coordinates)
    if (coordinates.length !== uniqueCoordinates.size) {
      errors.push('Duplicate coordinates found in results')
    }
    
    // Check for invalid scores
    const invalidScores = results.filter(r => !this.isValidNumber(r.score) || r.score < 0)
    if (invalidScores.length > 0) {
      errors.push(`Found ${invalidScores.length} results with invalid scores`)
    }
    
    // Check for invalid kWh values
    const invalidKwh = results.filter(r => !this.isValidNumber(r.kwhPerDay) || r.kwhPerDay < 0)
    if (invalidKwh.length > 0) {
      errors.push(`Found ${invalidKwh.length} results with invalid kWh/day values`)
    }
    
    // Check if results are properly sorted
    for (let i = 1; i < results.length; i++) {
      if (results[i].kwhPerDay > results[i-1].kwhPerDay) {
        warnings.push('Results are not properly sorted by kWh/day')
        break
      }
    }
    
    // Check minimum spacing
    const minSpacing = 100 // meters
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const distance = this.calculateDistance(results[i].coordinates, results[j].coordinates)
        if (distance < minSpacing / 1000) {
          warnings.push(`Results ${i+1} and ${j+1} are too close (${(distance * 1000).toFixed(1)}m apart)`)
        }
      }
    }
    
    // Calculate metrics
    const kwhValues = results.map(r => r.kwhPerDay)
    const averageKwhPerDay = kwhValues.reduce((sum, val) => sum + val, 0) / kwhValues.length
    const maxKwhPerDay = Math.max(...kwhValues)
    const minKwhPerDay = Math.min(...kwhValues)
    
    // Calculate spatial distribution (average distance between all pairs)
    let totalDistance = 0
    let pairCount = 0
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        totalDistance += this.calculateDistance(results[i].coordinates, results[j].coordinates)
        pairCount++
      }
    }
    const spatialDistribution = pairCount > 0 ? totalDistance / pairCount : 0
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metrics: {
        totalResults: results.length,
        averageKwhPerDay,
        maxKwhPerDay,
        minKwhPerDay,
        spatialDistribution
      }
    }
  }

  /**
   * Generates a summary report of the analysis results
   */
  static generateReport(results: SolarCandidate[]): {
    totalCandidates: number
    validResults: number
    averageScore: number
    averageKwhPerDay: number
    bestScore: number
    bestKwhPerDay: number
    scoreRange: { min: number; max: number }
    kwhRange: { min: number; max: number }
  } {
    if (results.length === 0) {
      return {
        totalCandidates: 0,
        validResults: 0,
        averageScore: 0,
        averageKwhPerDay: 0,
        bestScore: 0,
        bestKwhPerDay: 0,
        scoreRange: { min: 0, max: 0 },
        kwhRange: { min: 0, max: 0 }
      }
    }
    
    const scores = results.map(r => r.score)
    const kwhValues = results.map(r => r.kwhPerDay)
    
    return {
      totalCandidates: results.length,
      validResults: results.length,
      averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      averageKwhPerDay: kwhValues.reduce((sum, kwh) => sum + kwh, 0) / kwhValues.length,
      bestScore: Math.max(...scores),
      bestKwhPerDay: Math.max(...kwhValues),
      scoreRange: { min: Math.min(...scores), max: Math.max(...scores) },
      kwhRange: { min: Math.min(...kwhValues), max: Math.max(...kwhValues) }
    }
  }
}
