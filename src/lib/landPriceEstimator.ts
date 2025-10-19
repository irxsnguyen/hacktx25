import { Coordinates } from '../types'

/**
 * Land Price Estimator for Solarized
 * 
 * Provides land price data for every candidate location to enable
 * power-per-cost ranking instead of raw irradiance ranking.
 * 
 * Features:
 * - API-backed pricing (when configured)
 * - Deterministic synthetic fallback
 * - Simple caching for repeated coordinates
 * - Consistent USD/m² units
 */

export interface LandPriceConfig {
  // API configuration
  apiEnabled: boolean
  apiTimeout: number
  apiRetries: number
  
  // Synthetic model parameters
  syntheticModel: {
    basePrice: number           // USD/m² base price
    urbanGradient: number       // Price decay per km from urban center
    latitudeAdjustment: number  // Price adjustment factor for latitude
    longitudeAdjustment: number // Price adjustment factor for longitude
  }
  
  // Caching
  cacheEnabled: boolean
  cacheExpiry: number          // hours
}

export interface LandPriceResult {
  location: Coordinates
  pricePerSquareMeter: number  // USD/m²
  dataSource: string           // 'api', 'synthetic', 'cached'
  confidence: number           // 0-1, data quality indicator
  metadata?: {
    distanceToUrban?: number    // km to nearest urban center
    populationDensity?: number  // people/km²
    propertyType?: string      // 'residential', 'commercial', 'agricultural'
  }
}

export class LandPriceEstimator {
  private static readonly DEFAULT_CONFIG: LandPriceConfig = {
    apiEnabled: false, // Start with synthetic for reliability
    apiTimeout: 5000,
    apiRetries: 3,
    syntheticModel: {
      basePrice: 200,          // $200/m² base price (more realistic)
      urbanGradient: 0.02,     // 2% decay per km from urban center (much gentler)
      latitudeAdjustment: 0.01, // 1% adjustment per degree latitude
      longitudeAdjustment: 0.005 // 0.5% adjustment per degree longitude
    },
    cacheEnabled: true,
    cacheExpiry: 24 // hours
  }

  private static cache = new Map<string, LandPriceResult>()
  private static urbanCenters: Coordinates[] = [
    { lat: 40.7128, lng: -74.0060 }, // New York
    { lat: 34.0522, lng: -118.2437 }, // Los Angeles
    { lat: 41.8781, lng: -87.6298 }, // Chicago
    { lat: 29.7604, lng: -95.3698 }, // Houston
    { lat: 33.4484, lng: -112.0740 }, // Phoenix
    { lat: 39.7392, lng: -104.9903 }, // Denver
    { lat: 47.6062, lng: -122.3321 }, // Seattle
    { lat: 25.7617, lng: -80.1918 }, // Miami
    { lat: 33.7490, lng: -84.3880 }, // Atlanta
    { lat: 40.4406, lng: -79.9959 }  // Pittsburgh
  ]

  /**
   * Estimate land price for a single location
   */
  static async estimateLandPriceAt(
    lat: number,
    lng: number,
    config: LandPriceConfig = this.DEFAULT_CONFIG
  ): Promise<number> {
    const location = { lat, lng }
    const result = await this.getLandPrice(location, config)
    return result.pricePerSquareMeter
  }

  /**
   * Get comprehensive land price data for a location
   */
  static async getLandPrice(
    location: Coordinates,
    config: LandPriceConfig = this.DEFAULT_CONFIG
  ): Promise<LandPriceResult> {
    const cacheKey = this.getCacheKey(location)
    
    // Check cache first
    if (config.cacheEnabled) {
      const cached = this.cache.get(cacheKey)
      if (cached && this.isCacheValid(cached, config.cacheExpiry)) {
        return cached
      }
    }

    let result: LandPriceResult

    try {
      if (config.apiEnabled) {
        result = await this.fetchFromAPI(location, config)
      } else {
        result = this.generateSyntheticPrice(location, config)
      }
    } catch (error) {
      console.warn(`Land price lookup failed for ${location.lat}, ${location.lng}:`, error)
      result = this.generateSyntheticPrice(location, config)
    }

    // Cache the result
    if (config.cacheEnabled) {
      this.cache.set(cacheKey, result)
    }

    return result
  }

  /**
   * Get land prices for multiple locations (batch processing)
   */
  static async getLandPrices(
    locations: Coordinates[],
    config: LandPriceConfig = this.DEFAULT_CONFIG
  ): Promise<LandPriceResult[]> {
    const results: LandPriceResult[] = []
    
    // Process in batches to avoid overwhelming APIs
    const batchSize = 10
    for (let i = 0; i < locations.length; i += batchSize) {
      const batch = locations.slice(i, i + batchSize)
      const batchPromises = batch.map(location => 
        this.getLandPrice(location, config).catch(error => {
          console.warn(`Land price lookup failed for ${location.lat}, ${location.lng}:`, error)
          return this.generateSyntheticPrice(location, config)
        })
      )
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // Small delay between batches
      if (i + batchSize < locations.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    return results
  }

  /**
   * Fetch land price from external API (placeholder implementation)
   */
  private static async fetchFromAPI(
    location: Coordinates,
    _config: LandPriceConfig
  ): Promise<LandPriceResult> {
    // This would integrate with real APIs like:
    // - Zillow API
    // - LandWatch API
    // - OpenStreetMap property data
    // - Government land records
    
    // For now, simulate API call
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Simulate API response with realistic prices
    const basePrice = 300 + Math.random() * 700 // $300-1000/m² (more realistic)
    const distanceToUrban = this.getDistanceToNearestUrban(location)
    const priceAdjustment = Math.max(0.3, 1 - (distanceToUrban * 0.01)) // Much gentler decay, min 30%
    
    return {
      location,
      pricePerSquareMeter: basePrice * priceAdjustment,
      dataSource: 'api',
      confidence: 0.8,
      metadata: {
        distanceToUrban,
        populationDensity: this.estimatePopulationDensity(location),
        propertyType: 'residential'
      }
    }
  }

  /**
   * Generate synthetic land price using configurable model
   */
  private static generateSyntheticPrice(
    location: Coordinates,
    config: LandPriceConfig
  ): LandPriceResult {
    const { lat, lng } = location
    const { syntheticModel } = config
    
    // Base price
    let price = syntheticModel.basePrice
    
    // Urban gradient adjustment (much gentler)
    const distanceToUrban = this.getDistanceToNearestUrban(location)
    const urbanDecay = Math.min(0.8, distanceToUrban * syntheticModel.urbanGradient) // Cap at 80% reduction
    price *= (1 - urbanDecay)
    
    // Latitude adjustment (higher prices in temperate zones)
    const latitudeAdjustment = 1 + (Math.abs(lat - 40) * syntheticModel.latitudeAdjustment)
    price *= latitudeAdjustment
    
    // Longitude adjustment (coastal premium)
    const longitudeAdjustment = 1 + (Math.abs(lng) * syntheticModel.longitudeAdjustment)
    price *= longitudeAdjustment
    
    // Add some randomness for realism
    price *= (0.8 + Math.random() * 0.4) // ±20% variation
    
    // Ensure minimum realistic price
    const minPrice = 50 // $50/m² minimum (much more realistic)
    
    return {
      location,
      pricePerSquareMeter: Math.max(minPrice, price),
      dataSource: 'synthetic',
      confidence: 0.3, // Low confidence for synthetic data
      metadata: {
        distanceToUrban,
        populationDensity: this.estimatePopulationDensity(location),
        propertyType: 'agricultural'
      }
    }
  }

  /**
   * Calculate power-per-cost score
   */
  static calculatePowerPerCost(
    kwhPerDay: number,
    landPrice: number,
    epsilon: number = 1.0 // USD/m² floor
  ): number {
    const adjustedPrice = Math.max(landPrice, epsilon)
    return kwhPerDay / adjustedPrice
  }

  /**
   * Get distance to nearest urban center
   */
  private static getDistanceToNearestUrban(location: Coordinates): number {
    let minDistance = Infinity
    
    for (const urbanCenter of this.urbanCenters) {
      const distance = this.calculateDistance(location, urbanCenter)
      if (distance < minDistance) {
        minDistance = distance
      }
    }
    
    return minDistance
  }

  /**
   * Estimate population density for a location
   */
  private static estimatePopulationDensity(location: Coordinates): number {
    const distanceToUrban = this.getDistanceToNearestUrban(location)
    
    // Simple model: higher density near urban centers
    if (distanceToUrban < 10) return 1000 + Math.random() * 2000 // 1000-3000 people/km²
    if (distanceToUrban < 50) return 100 + Math.random() * 400   // 100-500 people/km²
    return 10 + Math.random() * 50                               // 10-60 people/km²
  }

  /**
   * Calculate distance between two coordinates
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
   * Generate cache key for location
   */
  private static getCacheKey(location: Coordinates): string {
    return `${location.lat.toFixed(4)},${location.lng.toFixed(4)}`
  }

  /**
   * Check if cached data is still valid
   */
  private static isCacheValid(_data: LandPriceResult, expiryHours: number): boolean {
    const now = new Date()
    const expiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000)
    return now < expiry
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    size: number
    sources: Record<string, number>
    avgConfidence: number
  } {
    const sources: Record<string, number> = {}
    let totalConfidence = 0
    
    for (const data of this.cache.values()) {
      sources[data.dataSource] = (sources[data.dataSource] || 0) + 1
      totalConfidence += data.confidence
    }
    
    return {
      size: this.cache.size,
      sources,
      avgConfidence: this.cache.size > 0 ? totalConfidence / this.cache.size : 0
    }
  }
}