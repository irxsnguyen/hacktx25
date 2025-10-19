import { useQuery } from 'react-query'

interface OptimizationParams {
  lat: number
  lng: number
  radiusKm: number
}

interface OptimizationResponse {
  bestSites: Array<{
    lat: number
    lng: number
    score: number
  }>
}

export const useOptimization = ({ lat, lng, radiusKm }: OptimizationParams) => {
  return useQuery<OptimizationResponse>(
    ['optimization', lat, lng, radiusKm],
    async () => {
      // Mock data for demonstration - replace with actual API call when backend is available
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API delay
      
      // Generate mock solar analysis results
      const mockResults = Array.from({ length: 10 }, (_, i) => ({
        lat: lat + (Math.random() - 0.5) * (radiusKm / 111), // Rough conversion from km to degrees
        lng: lng + (Math.random() - 0.5) * (radiusKm / 111),
        score: Math.random() * 100
      })).sort((a, b) => b.score - a.score)
      
      return {
        bestSites: mockResults
      }
    },
    {
      enabled: !!(lat && lng && radiusKm > 0),
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )
}
