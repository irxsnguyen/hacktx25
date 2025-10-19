import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Sidebar from '../Sidebar'

// Mock the stores
vi.mock('../../store/useMapStore', () => ({
  useMapStore: () => ({
    center: { lat: 30.2672, lng: -97.7431 },
    isPickingLocation: false,
    setPickingLocation: vi.fn()
  })
}))

vi.mock('../../store/useUIStore', () => ({
  useUIStore: () => ({
    sidebarCollapsed: false,
    setSidebarCollapsed: vi.fn()
  })
}))

describe('Sidebar', () => {
  const mockOnAnalyze = vi.fn()
  const mockOnClear = vi.fn()

  const defaultProps = {
    onAnalyze: mockOnAnalyze,
    onClear: mockOnClear,
    isAnalyzing: false,
    progress: 0,
    results: []
  }

  it('renders input fields with default values', () => {
    render(<Sidebar {...defaultProps} />)
    
    expect(screen.getByDisplayValue('30.2672')).toBeInTheDocument()
    expect(screen.getByDisplayValue('-97.7431')).toBeInTheDocument()
    expect(screen.getByDisplayValue('5')).toBeInTheDocument()
  })

  it('calls onAnalyze when analyze button is clicked', () => {
    render(<Sidebar {...defaultProps} />)
    
    const analyzeButton = screen.getByText('Analyze')
    fireEvent.click(analyzeButton)
    
    expect(mockOnAnalyze).toHaveBeenCalledWith({
      latitude: 30.2672,
      longitude: -97.7431,
      radius: 5,
      urbanPenalty: false
    })
  })

  it('calls onClear when clear button is clicked', () => {
    render(<Sidebar {...defaultProps} />)
    
    const clearButton = screen.getByText('Clear')
    fireEvent.click(clearButton)
    
    expect(mockOnClear).toHaveBeenCalled()
  })

  it('shows progress bar when analyzing', () => {
    render(<Sidebar {...defaultProps} isAnalyzing={true} progress={50} />)
    
    expect(screen.getByText('Analyzing...')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('displays results when provided', () => {
    const results = [
      {
        rank: 1,
        coordinates: { lat: 30.2672, lng: -97.7431 },
        score: 85.5,
        kwhPerDay: 4.2
      }
    ]
    
    render(<Sidebar {...defaultProps} results={results} />)
    
    expect(screen.getByText('Top 5 Results')).toBeInTheDocument()
    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByText('Score: 85.5')).toBeInTheDocument()
  })
})
