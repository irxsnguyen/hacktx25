import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Coordinates {
  lat: number
  lng: number
}

interface AnalysisResult {
  id: string
  createdAt: Date
  center: Coordinates
  radiusKm: number
  resultSummary: {
    bestSites: Array<{
      lat: number
      lng: number
      score: number
    }>
  }
}

interface AnalysisStore {
  analyses: AnalysisResult[]
  addAnalysis: (analysis: Omit<AnalysisResult, 'id' | 'createdAt'>) => void
  removeAnalysis: (id: string) => void
  clearAll: () => void
}

export const useAnalysisStore = create<AnalysisStore>()(
  persist(
    (set) => ({
      analyses: [],
      
      addAnalysis: (analysis) => set((state) => ({
        analyses: [
          ...state.analyses,
          {
            ...analysis,
            id: `analysis_${Date.now()}`,
            createdAt: new Date()
          }
        ]
      })),
      
      removeAnalysis: (id) => set((state) => ({
        analyses: state.analyses.filter(analysis => analysis.id !== id)
      })),
      
      clearAll: () => set({ analyses: [] })
    }),
    {
      name: 'solarized-analyses',
      version: 1
    }
  )
)
