import React from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet'
import { Icon } from 'leaflet'
import { useUIStore } from '../../stores/useUIStore'

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface MapEventsProps {
  onMapClick: (lat: number, lng: number) => void
}

const MapEvents: React.FC<MapEventsProps> = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng
      onMapClick(lat, lng)
    }
  })
  return null
}

export const SolarMap: React.FC = () => {
  const { center, zoom, radiusKm, selected, setSelected, setValid } = useUIStore()

  const handleMapClick = (lat: number, lng: number) => {
    setSelected({ lat, lng })
    setValid(true)
  }

  return (
    <div className="w-full h-[480px] relative">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height: '480px', width: '100%' }}
        className="rounded-xl z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapEvents onMapClick={handleMapClick} />
        
        {selected && (
          <>
            <Marker position={[selected.lat, selected.lng]} />
            <Circle
              center={[selected.lat, selected.lng]}
              radius={radiusKm * 1000}
              pathOptions={{
                color: '#FFB347',
                fillColor: '#FFB347',
                fillOpacity: 0.1,
                weight: 2
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  )
}
