import { MinHeap, HeapItem } from '../minHeap'

describe('MinHeap', () => {
  it('should maintain only the best K items', () => {
    const heap = new MinHeap(3)
    
    // Add items with scores: 10, 20, 30, 5, 15, 25
    const items: HeapItem[] = [
      { score: 10, kwhPerDay: 1, coordinates: { lat: 0, lng: 0 } },
      { score: 20, kwhPerDay: 2, coordinates: { lat: 1, lng: 1 } },
      { score: 30, kwhPerDay: 3, coordinates: { lat: 2, lng: 2 } },
      { score: 5, kwhPerDay: 0.5, coordinates: { lat: 3, lng: 3 } },
      { score: 15, kwhPerDay: 1.5, coordinates: { lat: 4, lng: 4 } },
      { score: 25, kwhPerDay: 2.5, coordinates: { lat: 5, lng: 5 } }
    ]
    
    // Add all items
    items.forEach(item => heap.push(item))
    
    // Should only keep the top 3: 30, 25, 20
    const result = heap.toArray()
    expect(result).toHaveLength(3)
    
    // Check that we have the highest scores
    const scores = result.map(item => item.score).sort((a, b) => b - a)
    expect(scores).toEqual([30, 25, 20])
  })
  
  it('should not add items worse than the worst when full', () => {
    const heap = new MinHeap(2)
    
    // Add two good items
    heap.push({ score: 20, kwhPerDay: 2, coordinates: { lat: 0, lng: 0 } })
    heap.push({ score: 30, kwhPerDay: 3, coordinates: { lat: 1, lng: 1 } })
    
    expect(heap.size()).toBe(2)
    expect(heap.getMinScore()).toBe(20) // Worst score in heap
    
    // Try to add a worse item
    heap.push({ score: 10, kwhPerDay: 1, coordinates: { lat: 2, lng: 2 } })
    
    // Should still have only 2 items, and worst should still be 20
    expect(heap.size()).toBe(2)
    expect(heap.getMinScore()).toBe(20)
  })
  
  it('should replace worst item when better item is added', () => {
    const heap = new MinHeap(2)
    
    // Add two items
    heap.push({ score: 20, kwhPerDay: 2, coordinates: { lat: 0, lng: 0 } })
    heap.push({ score: 30, kwhPerDay: 3, coordinates: { lat: 1, lng: 1 } })
    
    expect(heap.getMinScore()).toBe(20)
    
    // Add a better item (should replace the worst)
    heap.push({ score: 25, kwhPerDay: 2.5, coordinates: { lat: 2, lng: 2 } })
    
    // Should still have 2 items, but worst should now be 25
    expect(heap.size()).toBe(2)
    expect(heap.getMinScore()).toBe(25)
  })
})
