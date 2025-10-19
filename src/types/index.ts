export interface Coordinates {
  lat: number
  lng: number
}

export interface SolarAnalysis {
  id: string
  center: Coordinates
  radius: number
  results: SolarResult[]
  createdAt: Date
  completedAt: Date
}

export interface SolarResult {
  rank: number
  coordinates: Coordinates
  score: number
  estimatedKwhPerDay: number
  landPrice?: number        // USD/m² - land price marker
  powerPerCost?: number     // kWh/$/m² - power per cost efficiency
  costEfficiency?: number   // normalized cost efficiency (0-1)
}

export interface AnalysisInputs {
  latitude: number
  longitude: number
  radius: number
  urbanPenalty: boolean
}

export interface SolarPosition {
  elevation: number
  azimuth: number
}

export interface IrradianceData {
  dni: number // Direct Normal Irradiance
  dhi: number // Diffuse Horizontal Irradiance
  ghi: number // Global Horizontal Irradiance
}

export interface SolarCalculationParams {
  latitude: number
  longitude: number
  date: Date
  tilt: number
  azimuth: number
  albedo: number
  temperatureCoeff: number
  panelEfficiency: number
}

// Extensibility interfaces for future enhancements
export interface HorizonProfile {
  getHorizonProfile(lat: number, lon: number): number[]
}

export interface NearFieldMask {
  nearFieldMask(lat: number, lon: number): number
}

export interface ExternalIrradiance {
  externalIrradiance(lat: number, lon: number, date: Date): Promise<IrradianceData>
}

export interface MapState {
  center: Coordinates
  zoom: number
  isPickingLocation: boolean
}

export interface AnalysisProgress {
  percentage: number
  status: 'idle' | 'grid-generation' | 'irradiance-computation' | 'ranking' | 'complete'
  message: string
}

export interface UIState {
  sidebarCollapsed: boolean
  analysisProgress: AnalysisProgress
  currentAnalysis: SolarAnalysis | null
}

export interface ExclusionConfig {
  enabled: boolean
  bufferMeters: number
  includeWater: boolean
  includeSensitive: boolean
}
