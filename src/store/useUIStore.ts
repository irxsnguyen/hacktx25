import { create } from 'zustand'
import { UIState, SolarAnalysis, Coordinates } from '../types'

interface InputValidation {
  latitude: { isValid: boolean; error?: string }
  longitude: { isValid: boolean; error?: string }
  radius: { isValid: boolean; error?: string }
}

interface UIStore extends UIState {
  // Map state
  mapCenter: Coordinates
  mapZoom: number
  radiusKm: number
  isPickingLocation: boolean
  
  // Input state
  inputLatitude: number
  inputLongitude: number
  inputRadius: number
  inputUrbanPenalty: boolean
  
  // Validation state
  validation: InputValidation
  
  // Actions
  setSidebarCollapsed: (collapsed: boolean) => void
  setAnalysisProgress: (progress: number) => void
  setCurrentAnalysis: (analysis: SolarAnalysis | null) => void
  resetAnalysis: () => void
  
  // Map actions
  setMapCenter: (center: Coordinates) => void
  setMapZoom: (zoom: number) => void
  setRadiusKm: (radius: number) => void
  setPickingLocation: (picking: boolean) => void
  
  // Input actions
  setInputLatitude: (lat: number) => void
  setInputLongitude: (lon: number) => void
  setInputRadius: (radius: number) => void
  setInputUrbanPenalty: (penalty: boolean) => void
  
  // Validation actions
  validateInputs: () => void
  clampInputs: () => void
  
  // Sync actions
  syncInputsToMap: () => void
  syncMapToInputs: () => void
  handleMapClick: (coordinates: Coordinates) => void
}

const validateCoordinate = (value: number, type: 'latitude' | 'longitude'): { isValid: boolean; error?: string } => {
  if (type === 'latitude') {
    if (value < -90 || value > 90) {
      return { isValid: false, error: 'Latitude must be between -90 and 90' }
    }
  } else {
    if (value < -180 || value > 180) {
      return { isValid: false, error: 'Longitude must be between -180 and 180' }
    }
  }
  return { isValid: true }
}

const validateRadius = (value: number): { isValid: boolean; error?: string } => {
  if (value <= 0 || value > 100) {
    return { isValid: false, error: 'Radius must be between 0.1 and 100 km' }
  }
  return { isValid: true }
}

export const useUIStore = create<UIStore>((set, get) => ({
  // Initial state
  sidebarCollapsed: false,
  analysisProgress: 0,
  currentAnalysis: null,
  
  // Map state
  mapCenter: { lat: 30.2672, lng: -97.7431 },
  mapZoom: 13,
  radiusKm: 5,
  isPickingLocation: false,
  
  // Input state
  inputLatitude: 30.2672,
  inputLongitude: -97.7431,
  inputRadius: 5,
  inputUrbanPenalty: false,
  
  // Validation state
  validation: {
    latitude: { isValid: true },
    longitude: { isValid: true },
    radius: { isValid: true }
  },
  
  // Basic actions
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  setAnalysisProgress: (analysisProgress) => set({ analysisProgress }),
  setCurrentAnalysis: (currentAnalysis) => set({ currentAnalysis }),
  
  resetAnalysis: () => set({ 
    analysisProgress: 0, 
    currentAnalysis: null 
  }),
  
  // Map actions
  setMapCenter: (mapCenter) => set({ mapCenter }),
  setMapZoom: (mapZoom) => set({ mapZoom }),
  setRadiusKm: (radiusKm) => set({ radiusKm }),
  setPickingLocation: (isPickingLocation) => set({ isPickingLocation }),
  
  // Input actions
  setInputLatitude: (inputLatitude) => {
    set({ inputLatitude })
    get().validateInputs()
  },
  setInputLongitude: (inputLongitude) => {
    set({ inputLongitude })
    get().validateInputs()
  },
  setInputRadius: (inputRadius) => {
    set({ inputRadius })
    get().validateInputs()
  },
  setInputUrbanPenalty: (inputUrbanPenalty) => set({ inputUrbanPenalty }),
  
  // Validation actions
  validateInputs: () => {
    const { inputLatitude, inputLongitude, inputRadius } = get()
    set({
      validation: {
        latitude: validateCoordinate(inputLatitude, 'latitude'),
        longitude: validateCoordinate(inputLongitude, 'longitude'),
        radius: validateRadius(inputRadius)
      }
    })
  },
  
  clampInputs: () => {
    const { inputLatitude, inputLongitude, inputRadius } = get()
    set({
      inputLatitude: Math.max(-90, Math.min(90, inputLatitude)),
      inputLongitude: Math.max(-180, Math.min(180, inputLongitude)),
      inputRadius: Math.max(0.1, Math.min(100, inputRadius))
    })
    get().validateInputs()
  },
  
  // Sync actions
  syncInputsToMap: () => {
    const { inputLatitude, inputLongitude, inputRadius, validation } = get()
    
    // Only sync if inputs are valid
    if (validation.latitude.isValid && validation.longitude.isValid && validation.radius.isValid) {
      set({
        mapCenter: { lat: inputLatitude, lng: inputLongitude },
        radiusKm: inputRadius
      })
    }
  },
  
  syncMapToInputs: () => {
    const { mapCenter, radiusKm } = get()
    set({
      inputLatitude: mapCenter.lat,
      inputLongitude: mapCenter.lng,
      inputRadius: radiusKm
    })
    get().validateInputs()
  },
  
  handleMapClick: (coordinates) => {
    const { isPickingLocation } = get()
    if (isPickingLocation) {
      set({
        mapCenter: coordinates,
        inputLatitude: coordinates.lat,
        inputLongitude: coordinates.lng,
        isPickingLocation: false
      })
      get().validateInputs()
    }
  }
}))
