import { Coordinates } from '../types'

export interface ExclusionPolygon {
  id: string
  type: 'residential' | 'commercial' | 'water' | 'sensitive'
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
  bounds: {
    minLat: number
    maxLat: number
    minLng: number
    maxLng: number
  }
  buffer: number // meters
}

export interface ExclusionConfig {
  enabled: boolean
  bufferMeters: number
  tagSetVersion: string
  cacheExpiryDays: number
  apiTimeout: number
  includeWater: boolean
  includeSensitive: boolean
}

export interface ExclusionResult {
  isExcluded: boolean
  reason?: string
  polygonId?: string
  polygonType?: string
}

export class ExclusionMask {
  private static readonly DEFAULT_CONFIG: ExclusionConfig = {
    enabled: false,
    bufferMeters: 50,
    tagSetVersion: '1.0',
    cacheExpiryDays: 7,
    apiTimeout: 10000,
    includeWater: false,
    includeSensitive: false
  }

  private static cache = new Map<string, ExclusionPolygon[]>()
  private static readonly OVERPASS_API = 'https://overpass-api.de/api/interpreter'
  private static readonly CACHE_KEY_PREFIX = 'exclusion_mask_'

  /**
   * Check if a point is excluded by any polygon
   */
  static async isPointExcluded(
    lat: number,
    lng: number,
    center: Coordinates,
    radiusKm: number,
    config: ExclusionConfig = this.DEFAULT_CONFIG
  ): Promise<ExclusionResult> {
    if (!config.enabled) {
      return { isExcluded: false }
    }

    try {
      // Get polygons for this area
      const polygons = await this.getPolygonsForArea(center, radiusKm, config)
      
      // Check if point is within any polygon
      for (const polygon of polygons) {
        if (this.pointInPolygon(lat, lng, polygon.geometry)) {
          return {
            isExcluded: true,
            reason: `Point is within ${polygon.type} area`,
            polygonId: polygon.id,
            polygonType: polygon.type
          }
        }
      }

      return { isExcluded: false }
    } catch (error) {
      console.warn('Exclusion mask check failed:', error)
      return { isExcluded: false }
    }
  }

  /**
   * Get all polygons for a given area (with caching)
   */
  private static async getPolygonsForArea(
    center: Coordinates,
    radiusKm: number,
    config: ExclusionConfig
  ): Promise<ExclusionPolygon[]> {
    const cacheKey = this.generateCacheKey(center, radiusKm, config)
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      if (this.isCacheValid(cached, config)) {
        return cached
      }
    }

    // Fetch from API
    const polygons = await this.fetchPolygonsFromOverpass(center, radiusKm, config)
    
    // Cache the results
    this.cache.set(cacheKey, polygons)
    this.saveToLocalStorage(cacheKey, polygons, config)

    return polygons
  }

  /**
   * Fetch polygons from Overpass API
   */
  private static async fetchPolygonsFromOverpass(
    center: Coordinates,
    radiusKm: number,
    config: ExclusionConfig
  ): Promise<ExclusionPolygon[]> {
    const bbox = this.calculateBoundingBox(center, radiusKm)
    const query = this.buildOverpassQuery(bbox, config)
    
    console.log('Fetching exclusion polygons from Overpass API...')
    
    const response = await fetch(this.OVERPASS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`
    })

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`)
    }

    const data = await response.json()
    return this.parseOverpassResponse(data, config)
  }

  /**
   * Build Overpass query for residential areas
   */
  private static buildOverpassQuery(bbox: string, config: ExclusionConfig): string {
    const tags = []
    
    // Residential land use
    tags.push('landuse=residential')
    
    // Optional: Water bodies
    if (config.includeWater) {
      tags.push('natural=water')
      tags.push('waterway=*')
    }
    
    // Optional: Sensitive areas
    if (config.includeSensitive) {
      tags.push('amenity=school')
      tags.push('amenity=hospital')
      tags.push('amenity=place_of_worship')
      tags.push('amenity=grave_yard')
    }

    const tagQuery = tags.map(tag => `["${tag}"]`).join('')
    
    return `
[out:json][timeout:25];
(
  way${tagQuery}(${bbox});
  relation${tagQuery}(${bbox});
);
out geom;
`
  }

  /**
   * Parse Overpass API response into ExclusionPolygon objects
   */
  private static parseOverpassResponse(
    data: any,
    config: ExclusionConfig
  ): ExclusionPolygon[] {
    const polygons: ExclusionPolygon[] = []
    
    for (const element of data.elements || []) {
      if (element.type === 'way' && element.geometry) {
        const polygon = this.createPolygonFromWay(element, config)
        if (polygon) {
          polygons.push(polygon)
        }
      } else if (element.type === 'relation' && element.members) {
        const multiPolygon = this.createPolygonFromRelation(element, config)
        if (multiPolygon) {
          polygons.push(multiPolygon)
        }
      }
    }

    console.log(`Parsed ${polygons.length} exclusion polygons`)
    return polygons
  }

  /**
   * Create polygon from OSM way
   */
  private static createPolygonFromWay(
    way: any,
    config: ExclusionConfig
  ): ExclusionPolygon | null {
    if (!way.geometry || way.geometry.length < 3) {
      return null
    }

    const coordinates = way.geometry.map((point: any) => [point.lon, point.lat])
    
    // Close polygon if not already closed
    if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
        coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
      coordinates.push(coordinates[0])
    }

    const geometry: GeoJSON.Polygon = {
      type: 'Polygon',
      coordinates: [coordinates]
    }

    return {
      id: `way_${way.id}`,
      type: this.classifyPolygonType(way.tags),
      geometry,
      bounds: this.calculateBounds(geometry),
      buffer: config.bufferMeters
    }
  }

  /**
   * Create polygon from OSM relation
   */
  private static createPolygonFromRelation(
    relation: any,
    config: ExclusionConfig
  ): ExclusionPolygon | null {
    // Simplified: just use outer ways for now
    const outerWays = relation.members.filter((m: any) => m.role === 'outer')
    if (outerWays.length === 0) return null

    // For now, just use the first outer way
    const firstWay = outerWays[0]
    return this.createPolygonFromWay(firstWay, config)
  }

  /**
   * Classify polygon type based on OSM tags
   */
  private static classifyPolygonType(tags: any): ExclusionPolygon['type'] {
    if (tags.landuse === 'residential') return 'residential'
    if (tags.natural === 'water') return 'water'
    if (tags.amenity === 'school' || tags.amenity === 'hospital') return 'sensitive'
    return 'residential' // default
  }

  /**
   * Calculate bounding box for area
   */
  private static calculateBoundingBox(center: Coordinates, radiusKm: number): string {
    const latOffset = radiusKm / 111.0 // Rough km to degrees
    const lngOffset = radiusKm / (111.0 * Math.cos(center.lat * Math.PI / 180))
    
    const minLat = center.lat - latOffset
    const maxLat = center.lat + latOffset
    const minLng = center.lng - lngOffset
    const maxLng = center.lng + lngOffset
    
    return `${minLat},${minLng},${maxLat},${maxLng}`
  }

  /**
   * Calculate bounds for a geometry
   */
  private static calculateBounds(geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon): ExclusionPolygon['bounds'] {
    let minLat = Infinity, maxLat = -Infinity
    let minLng = Infinity, maxLng = -Infinity

    const processCoordinates = (coords: number[][]) => {
      for (const [lng, lat] of coords) {
        minLat = Math.min(minLat, lat)
        maxLat = Math.max(maxLat, lat)
        minLng = Math.min(minLng, lng)
        maxLng = Math.max(maxLng, lng)
      }
    }

    if (geometry.type === 'Polygon') {
      for (const ring of geometry.coordinates) {
        processCoordinates(ring)
      }
    } else if (geometry.type === 'MultiPolygon') {
      for (const polygon of geometry.coordinates) {
        for (const ring of polygon) {
          processCoordinates(ring)
        }
      }
    }

    return { minLat, maxLat, minLng, maxLng }
  }

  /**
   * Point-in-polygon test using ray casting algorithm
   */
  private static pointInPolygon(
    lat: number,
    lng: number,
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
  ): boolean {
    if (geometry.type === 'Polygon') {
      return this.pointInSinglePolygon(lat, lng, geometry)
    } else if (geometry.type === 'MultiPolygon') {
      return geometry.coordinates.some(polygon => 
        this.pointInSinglePolygon(lat, lng, { type: 'Polygon', coordinates: polygon })
      )
    }
    return false
  }

  /**
   * Point-in-polygon test for single polygon (handles holes)
   */
  private static pointInSinglePolygon(
    lat: number,
    lng: number,
    polygon: GeoJSON.Polygon
  ): boolean {
    const [exteriorRing, ...holes] = polygon.coordinates
    
    // Check if point is in exterior ring
    if (!this.pointInRing(lat, lng, exteriorRing)) {
      return false
    }
    
    // Check if point is in any hole (if so, it's excluded)
    for (const hole of holes) {
      if (this.pointInRing(lat, lng, hole)) {
        return false
      }
    }
    
    return true
  }

  /**
   * Ray casting algorithm for point-in-ring test
   */
  private static pointInRing(lat: number, lng: number, ring: number[][]): boolean {
    let inside = false
    
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i]
      const [xj, yj] = ring[j]
      
      if (((yi > lat) !== (yj > lat)) && 
          (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
        inside = !inside
      }
    }
    
    return inside
  }

  /**
   * Generate cache key for area
   */
  private static generateCacheKey(
    center: Coordinates,
    radiusKm: number,
    _config: ExclusionConfig
  ): string {
    const key = `${this.CACHE_KEY_PREFIX}${center.lat.toFixed(4)}_${center.lng.toFixed(4)}_${radiusKm}_${_config.tagSetVersion}`
    return key
  }

  /**
   * Check if cache is still valid
   */
  private static isCacheValid(
    polygons: ExclusionPolygon[],
    _config: ExclusionConfig
  ): boolean {
    // Simple check - in real implementation, you'd check timestamps
    return polygons.length > 0
  }

  /**
   * Save to local storage
   */
  private static saveToLocalStorage(
    cacheKey: string,
    polygons: ExclusionPolygon[],
    config: ExclusionConfig
  ): void {
    try {
      const data = {
        polygons,
        timestamp: Date.now(),
        expiry: Date.now() + (config.cacheExpiryDays * 24 * 60 * 60 * 1000)
      }
      localStorage.setItem(cacheKey, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save exclusion polygons to localStorage:', error)
    }
  }


  /**
   * Get polygons for visualization
   */
  static async getPolygonsForVisualization(
    center: Coordinates,
    radiusKm: number,
    config: ExclusionConfig = this.DEFAULT_CONFIG
  ): Promise<ExclusionPolygon[]> {
    return this.getPolygonsForArea(center, radiusKm, config)
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache.clear()
    
    // Clear localStorage
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      if (key.startsWith(this.CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key)
      }
    }
  }
}
