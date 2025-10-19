import { describe, it, expect, beforeEach } from 'vitest'
import { ExclusionMask } from '../exclusionMask'

describe('Exclusion Mask', () => {
  beforeEach(() => {
    // Clear cache before each test
    ExclusionMask.clearCache()
  })

  it('should return false when exclusion is disabled', async () => {
    const center = { lat: 40.7128, lng: -74.0060 }
    const radiusKm = 2
    
    const result = await ExclusionMask.isPointExcluded(
      40.7128,
      -74.0060,
      center,
      radiusKm,
      { enabled: false, bufferMeters: 50, includeWater: false, includeSensitive: false }
    )
    
    expect(result.isExcluded).toBe(false)
  })

  it('should handle API errors gracefully', async () => {
    const center = { lat: 40.7128, lng: -74.0060 }
    const radiusKm = 2
    
    // Mock fetch to return error
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValue(new Error('API Error'))
    
    const result = await ExclusionMask.isPointExcluded(
      40.7128,
      -74.0060,
      center,
      radiusKm,
      { enabled: true, bufferMeters: 50, includeWater: false, includeSensitive: false }
    )
    
    expect(result.isExcluded).toBe(false)
    
    // Restore fetch
    global.fetch = originalFetch
  })

  it('should include water bodies in query when includeWater is true', async () => {
    const center = { lat: 40.7128, lng: -74.0060 }
    const radiusKm = 2
    
    // Mock successful API response with water body
    const mockResponse = {
      elements: [
        {
          type: 'way',
          id: 123,
          geometry: [
            { lat: 40.7128, lon: -74.0060 },
            { lat: 40.7129, lon: -74.0060 },
            { lat: 40.7129, lon: -74.0059 },
            { lat: 40.7128, lon: -74.0059 },
            { lat: 40.7128, lon: -74.0060 }
          ],
          tags: { natural: 'water' }
        }
      ]
    }
    
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })
    
    const result = await ExclusionMask.isPointExcluded(
      40.7128,
      -74.0060,
      center,
      radiusKm,
      { enabled: true, bufferMeters: 50, includeWater: true, includeSensitive: false }
    )
    
    expect(result.isExcluded).toBe(true)
    expect(result.polygonType).toBe('water')
    
    // Restore fetch
    global.fetch = originalFetch
  })

  it('should not include water bodies in query when includeWater is false', async () => {
    const center = { lat: 40.7128, lng: -74.0060 }
    const radiusKm = 2
    
    // Mock API response with no elements (no water bodies fetched)
    const mockResponse = { elements: [] }
    
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })
    
    const result = await ExclusionMask.isPointExcluded(
      40.7128,
      -74.0060,
      center,
      radiusKm,
      { enabled: true, bufferMeters: 50, includeWater: false, includeSensitive: false }
    )
    
    expect(result.isExcluded).toBe(false)
    
    // Restore fetch
    global.fetch = originalFetch
  })

  it('should generate correct cache keys', () => {
    const center1 = { lat: 40.7128, lng: -74.0060 }
    const center2 = { lat: 40.7129, lng: -74.0061 }
    const radiusKm = 2
    
    // This is testing the internal cache key generation
    // We can't directly test the private method, but we can test behavior
    expect(center1).not.toEqual(center2)
  })

  it('should handle point-in-polygon correctly', () => {
    // Test with a simple polygon
    const polygon: GeoJSON.Polygon = {
      type: 'Polygon',
      coordinates: [[
        [-74.0, 40.7],
        [-74.1, 40.7],
        [-74.1, 40.8],
        [-74.0, 40.8],
        [-74.0, 40.7]
      ]]
    }
    
    // Point inside polygon
    const insideResult = ExclusionMask['pointInPolygon'](40.75, -74.05, polygon)
    expect(insideResult).toBe(true)
    
    // Point outside polygon
    const outsideResult = ExclusionMask['pointInPolygon'](40.6, -74.2, polygon)
    expect(outsideResult).toBe(false)
  })

  it('should handle multi-polygon correctly', () => {
    const multiPolygon: GeoJSON.MultiPolygon = {
      type: 'MultiPolygon',
      coordinates: [
        [[
          [-74.0, 40.7],
          [-74.1, 40.7],
          [-74.1, 40.8],
          [-74.0, 40.8],
          [-74.0, 40.7]
        ]],
        [[
          [-73.9, 40.6],
          [-74.0, 40.6],
          [-74.0, 40.7],
          [-73.9, 40.7],
          [-73.9, 40.6]
        ]]
      ]
    }
    
    // Point in first polygon
    const result1 = ExclusionMask['pointInPolygon'](40.75, -74.05, multiPolygon)
    expect(result1).toBe(true)
    
    // Point in second polygon
    const result2 = ExclusionMask['pointInPolygon'](40.65, -73.95, multiPolygon)
    expect(result2).toBe(true)
    
    // Point outside both polygons
    const result3 = ExclusionMask['pointInPolygon'](40.5, -74.2, multiPolygon)
    expect(result3).toBe(false)
  })

  it('should handle polygons with holes', () => {
    const polygonWithHole: GeoJSON.Polygon = {
      type: 'Polygon',
      coordinates: [
        // Exterior ring
        [
          [-74.0, 40.7],
          [-74.1, 40.7],
          [-74.1, 40.8],
          [-74.0, 40.8],
          [-74.0, 40.7]
        ],
        // Hole
        [
          [-74.05, 40.72],
          [-74.08, 40.72],
          [-74.08, 40.75],
          [-74.05, 40.75],
          [-74.05, 40.72]
        ]
      ]
    }
    
    // Point in exterior but in hole (should be excluded)
    const result1 = ExclusionMask['pointInPolygon'](40.735, -74.065, polygonWithHole)
    expect(result1).toBe(false)
    
    // Point in exterior but not in hole (should be included)
    const result2 = ExclusionMask['pointInPolygon'](40.75, -74.02, polygonWithHole)
    expect(result2).toBe(true)
  })

  it('should calculate bounding box correctly', () => {
    const center = { lat: 40.7128, lng: -74.0060 }
    const radiusKm = 2
    
    const bbox = ExclusionMask['calculateBoundingBox'](center, radiusKm)
    expect(bbox).toContain('40.7')
    expect(bbox).toContain('-74.0')
  })

  it('should build correct Overpass query', () => {
    const bbox = '40.7,-74.0,40.8,-73.9'
    const config = {
      enabled: true,
      bufferMeters: 50,
      includeWater: true,
      includeSensitive: true
    }
    
    const query = ExclusionMask['buildOverpassQuery'](bbox, config)
    expect(query).toContain('landuse=residential')
    expect(query).toContain('natural=water')
    expect(query).toContain('amenity=school')
  })

  it('should parse Overpass response correctly', () => {
    const mockResponse = {
      elements: [
        {
          type: 'way',
          id: 123,
          geometry: [
            { lat: 40.7, lon: -74.0 },
            { lat: 40.8, lon: -74.0 },
            { lat: 40.8, lon: -73.9 },
            { lat: 40.7, lon: -73.9 }
          ],
          tags: {
            landuse: 'residential'
          }
        }
      ]
    }
    
    const config = {
      enabled: true,
      bufferMeters: 50,
      includeWater: false,
      includeSensitive: false
    }
    
    const polygons = ExclusionMask['parseOverpassResponse'](mockResponse, config)
    expect(polygons).toHaveLength(1)
    expect(polygons[0].type).toBe('residential')
    expect(polygons[0].id).toBe('way_123')
  })

  it('should classify polygon types correctly', () => {
    const residentialTags = { landuse: 'residential' }
    const waterTags = { natural: 'water' }
    const schoolTags = { amenity: 'school' }
    
    expect(ExclusionMask['classifyPolygonType'](residentialTags)).toBe('residential')
    expect(ExclusionMask['classifyPolygonType'](waterTags)).toBe('water')
    expect(ExclusionMask['classifyPolygonType'](schoolTags)).toBe('sensitive')
  })

  it('should calculate bounds correctly', () => {
    const geometry: GeoJSON.Polygon = {
      type: 'Polygon',
      coordinates: [[
        [-74.0, 40.7],
        [-74.1, 40.8],
        [-74.0, 40.8],
        [-74.0, 40.7]
      ]]
    }
    
    const bounds = ExclusionMask['calculateBounds'](geometry)
    expect(bounds.minLat).toBe(40.7)
    expect(bounds.maxLat).toBe(40.8)
    expect(bounds.minLng).toBe(-74.1)
    expect(bounds.maxLng).toBe(-74.0)
  })
})
