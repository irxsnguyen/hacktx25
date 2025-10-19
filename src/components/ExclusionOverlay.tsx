import { useEffect, useState } from 'react'
import { Polygon } from 'react-leaflet'
import { ExclusionMask, ExclusionPolygon } from '../lib/exclusionMask'
import { Coordinates } from '../types'

interface ExclusionOverlayProps {
  center: Coordinates
  radiusKm: number
  enabled: boolean
  bufferMeters: number
  includeWater: boolean
  includeSensitive: boolean
}

export default function ExclusionOverlay({
  center,
  radiusKm,
  enabled,
  bufferMeters,
  includeWater,
  includeSensitive
}: ExclusionOverlayProps) {
  const [polygons, setPolygons] = useState<ExclusionPolygon[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setPolygons([])
      return
    }

    const loadPolygons = async () => {
      setLoading(true)
      try {
        const exclusionPolygons = await ExclusionMask.getPolygonsForVisualization(
          center,
          radiusKm,
          {
            enabled: true,
            bufferMeters,
            tagSetVersion: '1.0',
            cacheExpiryDays: 7,
            apiTimeout: 10000,
            includeWater,
            includeSensitive
          }
        )
        setPolygons(exclusionPolygons)
      } catch (error) {
        console.warn('Failed to load exclusion polygons:', error)
        setPolygons([])
      } finally {
        setLoading(false)
      }
    }

    loadPolygons()
  }, [center, radiusKm, enabled, bufferMeters, includeWater, includeSensitive])

  if (!enabled || polygons.length === 0) {
    return null
  }

  const getPolygonColor = (type: string) => {
    switch (type) {
      case 'residential':
        return '#ef4444' // red-500
      case 'water':
        return '#3b82f6' // blue-500
      case 'sensitive':
        return '#f59e0b' // amber-500
      default:
        return '#6b7280' // gray-500
    }
  }

  const getPolygonOpacity = (type: string) => {
    switch (type) {
      case 'residential':
        return 0.3
      case 'water':
        return 0.2
      case 'sensitive':
        return 0.25
      default:
        return 0.2
    }
  }

  return (
    <>
      {polygons.map((polygon, index) => {
        if (polygon.geometry.type === 'Polygon') {
          const coordinates = polygon.geometry.coordinates[0].map(coord => [coord[1], coord[0]] as [number, number]) // Convert [lng, lat] to [lat, lng]
          
          return (
            <Polygon
              key={`polygon-${polygon.id}-${index}`}
              positions={coordinates}
              pathOptions={{
                color: getPolygonColor(polygon.type),
                fillColor: getPolygonColor(polygon.type),
                fillOpacity: getPolygonOpacity(polygon.type),
                weight: 2,
                opacity: 0.8
              }}
            />
          )
        } else if (polygon.geometry.type === 'MultiPolygon') {
          return polygon.geometry.coordinates.map((polygonCoords, polyIndex) => {
            const coordinates = polygonCoords[0].map(coord => [coord[1], coord[0]] as [number, number]) // Convert [lng, lat] to [lat, lng]
            
            return (
              <Polygon
                key={`multipolygon-${polygon.id}-${index}-${polyIndex}`}
                positions={coordinates}
                pathOptions={{
                  color: getPolygonColor(polygon.type),
                  fillColor: getPolygonColor(polygon.type),
                  fillOpacity: getPolygonOpacity(polygon.type),
                  weight: 2,
                  opacity: 0.8
                }}
              />
            )
          })
        }
        return null
      })}
      
      {loading && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg z-[1000]">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-sun-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-neutral-700">Loading exclusion data...</span>
          </div>
        </div>
      )}
    </>
  )
}
