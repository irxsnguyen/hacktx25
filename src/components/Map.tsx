import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Circle, useMapEvents, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useUIStore } from '../store/useUIStore'
import { Coordinates } from '../types'
import ExclusionOverlay from './ExclusionOverlay'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface MapProps {
  results?: Array<{ 
    coordinates: Coordinates; 
    rank: number; 
    score: number; 
    kwhPerDay: number;
    landPrice?: number;
    powerPerCost?: number;
  }>
  center?: Coordinates
  zoom?: number
  radiusKm?: number
  showCenterMarker?: boolean
  showRadius?: boolean
}

function MapClickHandler() {
  const { isPickingLocation, handleMapClick } = useUIStore()

  useMapEvents({
    click: (e) => {
      if (isPickingLocation) {
        const { lat, lng } = e.latlng
        const coordinates = { lat, lng }
        handleMapClick(coordinates)
      }
    },
  })

  return null
}

function ScaleControl() {
  const map = useMap()

  useEffect(() => {
    if (map) {
      const scaleControl = L.control.scale({
        position: 'bottomright',
        metric: true,
        imperial: false,
        maxWidth: 200
      })
      
      scaleControl.addTo(map)

      return () => {
        map.removeControl(scaleControl)
      }
    }
  }, [map])

  return null
}

export default function Map({ 
  results, 
  center, 
  zoom, 
  radiusKm: propRadiusKm, 
  showCenterMarker = true, 
  showRadius = true 
}: MapProps) {
  const { mapCenter: storeMapCenter, mapZoom: storeMapZoom, radiusKm: storeRadiusKm, isPickingLocation, exclusionConfig } = useUIStore()
  
  // Use props if provided, otherwise fall back to store values
  const mapCenter = center || storeMapCenter
  const mapZoom = zoom || storeMapZoom
  const radiusKm = propRadiusKm || storeRadiusKm
  
  const mapRef = useRef<L.Map>(null)

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.invalidateSize()
    }
  }, [])

  return (
    <div className="w-full h-full">
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={mapZoom}
        className="w-full h-full"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Search radius circle */}
        {showRadius && (
          <Circle
            center={[mapCenter.lat, mapCenter.lng]}
            radius={radiusKm * 1000} // Convert km to meters and halve the radius
            pathOptions={{
              color: isPickingLocation ? '#80BFFF' : '#FFB347',
              fillColor: isPickingLocation ? '#80BFFF' : '#FFB347',
              fillOpacity: isPickingLocation ? 0.2 : 0.1,
              weight: isPickingLocation ? 3 : 2,
            }}
          />
        )}
        
        {/* Center marker */}
        {showCenterMarker && (
          <Marker
            position={[mapCenter.lat, mapCenter.lng]}
            icon={L.divIcon({
              className: 'custom-div-icon',
              html: `
                <div class="bg-sky-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs shadow-lg border-2 border-white ${isPickingLocation ? 'animate-pulse' : ''}">
                  ${isPickingLocation ? '+' : '⦿'}
                </div>
              `,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-base">Center Location</h3>
                <p className="text-sm text-gray-600">
                  {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Results markers */}
        {results?.map((result, index) => (
          <Marker
            key={index}
            position={[result.coordinates.lat, result.coordinates.lng]}
            icon={L.divIcon({
              className: 'custom-div-icon',
              html: `
                <div class="bg-sun-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg border-2 border-white">
                  ${result.rank}
                </div>
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            })}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-base-text">Rank #{result.rank}</h3>
                <p className="text-sm text-gray-600">
                  Score: {result.score.toFixed(1)}
                </p>
                <p className="text-sm text-gray-600">
                  Est. {result.kwhPerDay.toFixed(2)} kWh/m²/day
                </p>
                {result.landPrice && (
                  <p className="text-sm text-gray-600">
                    Land: ${result.landPrice.toFixed(0)}/m²
                  </p>
                )}
                {result.powerPerCost && (
                  <p className="text-sm text-gray-600">
                    Efficiency: {result.powerPerCost.toFixed(3)} kWh/$/m²/day
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {result.coordinates.lat.toFixed(4)}, {result.coordinates.lng.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Exclusion overlay */}
        <ExclusionOverlay
          center={mapCenter}
          radiusKm={radiusKm}
          enabled={exclusionConfig.enabled}
          bufferMeters={exclusionConfig.bufferMeters}
          includeWater={exclusionConfig.includeWater}
          includeSensitive={exclusionConfig.includeSensitive}
        />
        
        <ScaleControl />
        <MapClickHandler />
      </MapContainer>
    </div>
  )
}
