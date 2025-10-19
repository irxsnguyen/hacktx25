/**
 * MaxHeap implementation for efficient top-K selection
 * 
 * This heap maintains the K largest elements, allowing us to efficiently
 * find and remove the worst candidate when we have more than K candidates.
 * 
 * For solar analysis, we want the TOP 5 candidates (highest scores),
 * so we use a MaxHeap to keep track of the best candidates.
 * The root contains the WORST of the top K, so we can easily replace it.
 */

export interface HeapItem {
  score: number
  kwhPerDay: number
  coordinates: { lat: number; lng: number }
}

export class MaxHeap {
  private heap: HeapItem[] = []
  private readonly maxSize: number

  constructor(maxSize: number) {
    this.maxSize = maxSize
  }

  /**
   * Add a new item to the heap
   * If heap is full and new item is better than worst, replace worst
   * If heap is not full, just add the item
   */
  push(item: HeapItem): void {
    if (this.heap.length < this.maxSize) {
      // Heap not full, just add
      this.heap.push(item)
      this.heapifyUp(this.heap.length - 1)
    } else if (item.score > this.getWorstScore()) {
      // Heap is full, but new item is better than worst
      // Replace the worst (which is at root in max heap)
      this.heap[0] = item
      this.heapifyDown(0)
    }
    // If heap is full and new item is worse than worst, ignore it
  }

  /**
   * Get all items in the heap (unsorted)
   */
  toArray(): HeapItem[] {
    return [...this.heap]
  }

  /**
   * Get the worst (minimum) score among the top candidates
   * In a max heap, the root contains the worst of the top K
   */
  getWorstScore(): number {
    return this.heap.length > 0 ? this.heap[0].score : -Infinity
  }

  /**
   * Get the number of items in the heap
   */
  size(): number {
    return this.heap.length
  }

  /**
   * Check if heap is full
   */
  isFull(): boolean {
    return this.heap.length >= this.maxSize
  }

  private heapifyUp(index: number): void {
    if (index === 0) return

    const parentIndex = Math.floor((index - 1) / 2)
    // In max heap for top-K: smaller scores should bubble up (worst at root)
    if (this.heap[index].score < this.heap[parentIndex].score) {
      this.swap(index, parentIndex)
      this.heapifyUp(parentIndex)
    }
  }

  private heapifyDown(index: number): void {
    const leftChild = 2 * index + 1
    const rightChild = 2 * index + 2
    let smallest = index

    // In max heap for top-K: find the smallest score (worst candidate)
    if (leftChild < this.heap.length && this.heap[leftChild].score < this.heap[smallest].score) {
      smallest = leftChild
    }

    if (rightChild < this.heap.length && this.heap[rightChild].score < this.heap[smallest].score) {
      smallest = rightChild
    }

    if (smallest !== index) {
      this.swap(index, smallest)
      this.heapifyDown(smallest)
    }
  }

  private swap(i: number, j: number): void {
    const temp = this.heap[i]
    this.heap[i] = this.heap[j]
    this.heap[j] = temp
  }
}
