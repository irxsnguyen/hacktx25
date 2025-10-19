import React from 'react'
import { useUIStore } from '../../stores/useUIStore'

export const RadiusControl: React.FC = () => {
  const { radiusKm, setRadiusKm } = useUIStore()

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    setRadiusKm(value)
  }

  return (
    <div className="card rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-stone-800">Search Radius</h3>
        <span className="badge bg-sun-100 text-sun-800">
          {radiusKm} km
        </span>
      </div>
      
      <div className="space-y-2">
        <input
          type="range"
          min="1"
          max="50"
          value={radiusKm}
          onChange={handleRadiusChange}
          className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-sm text-stone-500">
          <span>1 km</span>
          <span>50 km</span>
        </div>
      </div>
    </div>
  )
}
