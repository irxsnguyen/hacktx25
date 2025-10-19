import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { SolarAnalysis } from '../types'

interface AnalysisStore {
  analyses: SolarAnalysis[]
  addAnalysis: (analysis: SolarAnalysis) => void
  getAnalysis: (id: string) => SolarAnalysis | undefined
  deleteAnalysis: (id: string) => void
  clearAllAnalyses: () => void
}

export const useAnalysisStore = create<AnalysisStore>()(
  persist(
    (set, get) => ({
      analyses: [],
      
      addAnalysis: (analysis) => 
        set((state) => ({ 
          analyses: [...state.analyses, analysis] 
        })),
      
      getAnalysis: (id) => {
        const { analyses } = get()
        return analyses.find(analysis => analysis.id === id)
      },
      
      deleteAnalysis: (id) =>
        set((state) => ({
          analyses: state.analyses.filter(analysis => analysis.id !== id)
        })),
      
      clearAllAnalyses: () => set({ analyses: [] })
    }),
    {
      name: 'solarized-analyses',
      storage: createJSONStorage(() => localStorage),
      version: 1
    }
  )
)
