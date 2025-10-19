import { MaxHeap, HeapItem } from '../minHeap'

describe('MaxHeap Solar Analysis', () => {
  it('should maintain top 5 solar scores correctly', () => {
    const heap = new MaxHeap(5)
    
    // Simulate solar scores from different locations
    const solarScores = [
      { score: 15.2, kwhPerDay: 1.52, coordinates: { lat: 30.0, lng: -97.0 } },
      { score: 18.7, kwhPerDay: 1.87, coordinates: { lat: 30.1, lng: -97.1 } },
      { score: 12.3, kwhPerDay: 1.23, coordinates: { lat: 30.2, lng: -97.2 } },
      { score: 22.1, kwhPerDay: 2.21, coordinates: { lat: 30.3, lng: -97.3 } },
      { score: 16.8, kwhPerDay: 1.68, coordinates: { lat: 30.4, lng: -97.4 } },
      { score: 19.5, kwhPerDay: 1.95, coordinates: { lat: 30.5, lng: -97.5 } },
      { score: 14.1, kwhPerDay: 1.41, coordinates: { lat: 30.6, lng: -97.6 } },
      { score: 25.3, kwhPerDay: 2.53, coordinates: { lat: 30.7, lng: -97.7 } },
      { score: 17.9, kwhPerDay: 1.79, coordinates: { lat: 30.8, lng: -97.8 } },
      { score: 13.7, kwhPerDay: 1.37, coordinates: { lat: 30.9, lng: -97.9 } }
    ]
    
    // Add all scores to heap
    solarScores.forEach(item => heap.push(item))
    
    // Should have exactly 5 items
    expect(heap.size()).toBe(5)
    
    // Get the results
    const results = heap.toArray()
    
    // Should contain the top 5 highest scores
    const scores = results.map(item => item.score).sort((a, b) => b - a)
    expect(scores).toEqual([25.3, 22.1, 19.5, 18.7, 17.9])
    
    // The worst score among top 5 should be 17.9
    expect(heap.getWorstScore()).toBe(17.9)
  })
  
  it('should replace worst candidate when better one is found', () => {
    const heap = new MaxHeap(3)
    
    // Add initial candidates
    heap.push({ score: 10, kwhPerDay: 1, coordinates: { lat: 0, lng: 0 } })
    heap.push({ score: 20, kwhPerDay: 2, coordinates: { lat: 1, lng: 1 } })
    heap.push({ score: 15, kwhPerDay: 1.5, coordinates: { lat: 2, lng: 2 } })
    
    // Worst should be 10 (smallest of the three)
    expect(heap.getWorstScore()).toBe(10)
    
    // Add a better candidate (should replace the worst)
    heap.push({ score: 25, kwhPerDay: 2.5, coordinates: { lat: 3, lng: 3 } })
    
    // Should still have 3 items, but worst should now be 15
    expect(heap.size()).toBe(3)
    expect(heap.getWorstScore()).toBe(15)
    
    // Verify we have the top 3 scores
    const results = heap.toArray()
    const scores = results.map(item => item.score).sort((a, b) => b - a)
    expect(scores).toEqual([25, 20, 15])
  })
})
