import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Coordinates {
  lat: number
  lng: number
}

interface UIStore {
  // Map state
  center: Coordinates
  zoom: number
  radiusKm: number
  selected: Coordinates | null
  isValid: boolean
  
  // Actions
  setCenter: (center: Coordinates) => void
  setZoom: (zoom: number) => void
  setRadiusKm: (radius: number) => void
  setSelected: (selected: Coordinates | null) => void
  setValid: (valid: boolean) => void
  reset: () => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // Initial state
      center: { lat: 30.2672, lng: -97.7431 },
      zoom: 13,
      radiusKm: 5,
      selected: null,
      isValid: false,
      
      // Actions
      setCenter: (center) => set({ center }),
      setZoom: (zoom) => set({ zoom }),
      setRadiusKm: (radiusKm) => set({ radiusKm }),
      setSelected: (selected) => set({ selected }),
      setValid: (isValid) => set({ isValid }),
      reset: () => set({
        center: { lat: 30.2672, lng: -97.7431 },
        zoom: 13,
        radiusKm: 5,
        selected: null,
        isValid: false
      })
    }),
    {
      name: 'solarized-ui',
      version: 1
    }
  )
)
