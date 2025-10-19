import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { SolarAnalysis } from '../types'

interface SolarizedDB extends DBSchema {
  analyses: {
    key: string
    value: SolarAnalysis
  }
}

class StorageService {
  private db: IDBPDatabase<SolarizedDB> | null = null

  async init(): Promise<void> {
    this.db = await openDB<SolarizedDB>('solarized', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('analyses')) {
          db.createObjectStore('analyses', { keyPath: 'id' })
        }
      },
    })
  }

  async saveAnalysis(analysis: SolarAnalysis): Promise<void> {
    if (!this.db) await this.init()
    await this.db!.put('analyses', analysis)
  }

  async getAnalysis(id: string): Promise<SolarAnalysis | undefined> {
    if (!this.db) await this.init()
    return await this.db!.get('analyses', id)
  }

  async getAllAnalyses(): Promise<SolarAnalysis[]> {
    if (!this.db) await this.init()
    return await this.db!.getAll('analyses')
  }

  async deleteAnalysis(id: string): Promise<void> {
    if (!this.db) await this.init()
    await this.db!.delete('analyses', id)
  }

  async clearAllAnalyses(): Promise<void> {
    if (!this.db) await this.init()
    await this.db!.clear('analyses')
  }
}

export const storageService = new StorageService()

// Fallback to localStorage if IndexedDB is not available
export const localStorageService = {
  async saveAnalysis(analysis: SolarAnalysis): Promise<void> {
    const analyses = this.getAllAnalyses()
    const existingIndex = analyses.findIndex(a => a.id === analysis.id)
    
    if (existingIndex >= 0) {
      analyses[existingIndex] = analysis
    } else {
      analyses.push(analysis)
    }
    
    localStorage.setItem('solarized-analyses', JSON.stringify(analyses))
  },

  getAllAnalyses(): SolarAnalysis[] {
    const stored = localStorage.getItem('solarized-analyses')
    if (!stored) return []
    
    try {
      return JSON.parse(stored).map((analysis: any) => ({
        ...analysis,
        createdAt: new Date(analysis.createdAt),
        completedAt: new Date(analysis.completedAt)
      }))
    } catch {
      return []
    }
  },

  async getAnalysis(id: string): Promise<SolarAnalysis | undefined> {
    return this.getAllAnalyses().find(analysis => analysis.id === id)
  },

  async deleteAnalysis(id: string): Promise<void> {
    const analyses = this.getAllAnalyses().filter(analysis => analysis.id !== id)
    localStorage.setItem('solarized-analyses', JSON.stringify(analyses))
  },

  async clearAllAnalyses(): Promise<void> {
    localStorage.removeItem('solarized-analyses')
  }
}
