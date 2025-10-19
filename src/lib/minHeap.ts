/**
 * MinHeap implementation for efficient top-K selection
 * 
 * This heap maintains the K smallest elements, allowing us to efficiently
 * find and remove the worst candidate when we have more than K candidates.
 * 
 * For solar analysis, we want the TOP 5 candidates (highest scores),
 * so we use a MinHeap to keep track of the worst of the top 5.
 * When we find a candidate better than the worst, we replace it.
 */

export interface HeapItem {
  score: number
  kwhPerDay: number
  coordinates: { lat: number; lng: number }
}

export class MinHeap {
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
    } else if (item.score > this.heap[0].score) {
      // Heap is full, but new item is better than worst (root)
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
   * Get the worst (minimum) score in the heap
   */
  getMinScore(): number {
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
    if (this.heap[index].score < this.heap[parentIndex].score) {
      this.swap(index, parentIndex)
      this.heapifyUp(parentIndex)
    }
  }

  private heapifyDown(index: number): void {
    const leftChild = 2 * index + 1
    const rightChild = 2 * index + 2
    let smallest = index

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
