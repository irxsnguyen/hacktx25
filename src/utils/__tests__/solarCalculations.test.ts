import { describe, it, expect } from 'vitest'
import { SolarPositionCalculator, IrradianceCalculator, SolarPotentialAnalyzer } from '../solarCalculations'
import { SolarCalculationParams } from '../../types'

describe('SolarPositionCalculator', () => {
  it('calculates solar position for a given date and location', () => {
    const date = new Date(2024, 2, 20) // Spring equinox
    const position = SolarPositionCalculator.calculateSolarPosition(30.2672, -97.7431, date)
    
    expect(position.elevation).toBeGreaterThan(0)
    expect(position.azimuth).toBeGreaterThan(0)
    expect(position.elevation).toBeLessThan(Math.PI / 2)
    expect(position.azimuth).toBeLessThan(2 * Math.PI)
  })

  it('returns zero elevation for night time', () => {
    const date = new Date(2024, 2, 20, 2, 0) // 2 AM
    const position = SolarPositionCalculator.calculateSolarPosition(30.2672, -97.7431, date)
    
    expect(position.elevation).toBeLessThanOrEqual(0)
  })
})

describe('IrradianceCalculator', () => {
  const mockParams: SolarCalculationParams = {
    latitude: 30.2672,
    longitude: -97.7431,
    date: new Date(2024, 2, 20, 12, 0),
    tilt: 23,
    azimuth: 180,
    albedo: 0.2,
    temperatureCoeff: 0.004,
    panelEfficiency: 0.18
  }

  it('calculates irradiance components', () => {
    const solarPos = { elevation: Math.PI / 4, azimuth: Math.PI }
    const irradiance = IrradianceCalculator.calculateIrradiance(solarPos, mockParams)
    
    expect(irradiance.dni).toBeGreaterThan(0)
    expect(irradiance.dhi).toBeGreaterThan(0)
    expect(irradiance.ghi).toBeGreaterThan(0)
  })

  it('calculates POA irradiance', () => {
    const solarPos = { elevation: Math.PI / 4, azimuth: Math.PI }
    const irradiance = { dni: 800, dhi: 200, ghi: 1000 }
    const poa = IrradianceCalculator.calculatePOAIrradiance(irradiance, solarPos, mockParams)
    
    expect(poa).toBeGreaterThan(0)
  })

  it('calculates daily energy production', () => {
    const poaIrradiance = 1000 // W/m²
    const energy = IrradianceCalculator.calculateDailyEnergy(poaIrradiance, mockParams)
    
    expect(energy).toBeGreaterThan(0)
    expect(energy).toBeLessThan(1) // Should be less than 1 kWh/m² for 1 hour
  })
})

describe('SolarPotentialAnalyzer', () => {
  it('generates grid points within radius', async () => {
    const center = { lat: 30.2672, lng: -97.7431 }
    const radius = 1 // 1 km radius
    
    const results = await SolarPotentialAnalyzer.analyzeSolarPotential(center, radius, false)
    
    expect(results.length).toBeGreaterThan(0)
    expect(results.length).toBeLessThanOrEqual(5) // Should return top 5
  })

  it('returns results with valid scores', async () => {
    const center = { lat: 30.2672, lng: -97.7431 }
    const radius = 1
    
    const results = await SolarPotentialAnalyzer.analyzeSolarPotential(center, radius, false)
    
    results.forEach(result => {
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.kwhPerDay).toBeGreaterThanOrEqual(0)
      expect(result.coordinates.lat).toBeGreaterThan(center.lat - 0.01)
      expect(result.coordinates.lat).toBeLessThan(center.lat + 0.01)
      expect(result.coordinates.lng).toBeGreaterThan(center.lng - 0.01)
      expect(result.coordinates.lng).toBeLessThan(center.lng + 0.01)
    })
  })
})
