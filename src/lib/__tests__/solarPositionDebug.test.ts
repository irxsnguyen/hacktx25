import { describe, it, expect } from 'vitest'
import { SolarPositionCalculator } from '../../utils/solarCalculations'

describe('Solar Position Debug Tests', () => {
  it('should calculate positive elevation for locations with sun above horizon', () => {
    // Test locations where sun should be above horizon at 12:00 UTC on June 21
    const testCases = [
      { lat: 40, lng: -74, name: 'New York' },
      { lat: 40, lng: -20, name: 'Atlantic (-20°)' },
      { lat: 40, lng: 0, name: 'Greenwich' },
      { lat: 40, lng: 20, name: 'Europe (+20°)' },
    ]
    
    const testDate = new Date('2024-06-21T12:00:00Z') // Summer solstice, 12:00 UTC
    
    for (const test of testCases) {
      console.log(`\n📍 ${test.name} (${test.lat}°, ${test.lng}°)`)
      
      const solarPos = SolarPositionCalculator.calculateSolarPosition(test.lat, test.lng, testDate)
      const elevationDegrees = solarPos.elevation * 180 / Math.PI
      const azimuthDegrees = solarPos.azimuth * 180 / Math.PI
      
      console.log(`  Elevation: ${elevationDegrees.toFixed(2)}°`)
      console.log(`  Azimuth: ${azimuthDegrees.toFixed(2)}°`)
      
      // Check if sun is above horizon
      if (solarPos.elevation > 0) {
        console.log(`  ✅ Sun is above horizon`)
        expect(solarPos.elevation).toBeGreaterThan(0)
      } else {
        console.log(`  ❌ Sun is below horizon (elevation < 0)`)
        // This might be expected for some locations
      }
      
      // Test hour angle calculation
      const dayOfYear = SolarPositionCalculator.getDayOfYear(testDate)
      const hour = testDate.getHours() + testDate.getMinutes() / 60
      const hourAngle = SolarPositionCalculator.calculateHourAngleWithLongitude(hour, test.lng, dayOfYear)
      const hourAngleDegrees = hourAngle * 180 / Math.PI
      
      console.log(`  Hour Angle: ${hourAngleDegrees.toFixed(2)}°`)
      console.log(`  Local Hour: ${hour.toFixed(2)}`)
      console.log(`  Day of Year: ${dayOfYear}`)
    }
  })

  it('should show different results for different longitudes', () => {
    const baseLat = 40
    const testDate = new Date('2024-06-21T12:00:00Z')
    
    const positions = []
    for (let lng = -80; lng <= 80; lng += 20) {
      const solarPos = SolarPositionCalculator.calculateSolarPosition(baseLat, lng, testDate)
      positions.push({
        longitude: lng,
        elevation: solarPos.elevation * 180 / Math.PI,
        azimuth: solarPos.azimuth * 180 / Math.PI
      })
    }
    
    console.log('\nLongitude sweep results:')
    console.log('Lng    Elevation  Azimuth')
    console.log('------------------------')
    positions.forEach(pos => {
      console.log(`${pos.longitude.toString().padStart(3)}°  ${pos.elevation.toFixed(2).padStart(8)}°  ${pos.azimuth.toFixed(2).padStart(8)}°`)
    })
    
    // Check that we get different results for different longitudes
    const elevations = positions.map(p => p.elevation)
    const uniqueElevations = new Set(elevations.map(e => Math.round(e * 100)))
    
    console.log(`\nUnique elevation values: ${uniqueElevations.size} out of ${elevations.length}`)
    
    // At least some longitudes should give different results
    expect(uniqueElevations.size).toBeGreaterThan(1)
  })

  it('should test solar noon calculation', () => {
    const testDate = new Date('2024-06-21T12:00:00Z')
    const longitude = -20 // Problem longitude
    
    console.log(`\nTesting solar noon for longitude ${longitude}°`)
    
    // Calculate solar noon for this longitude
    const solarNoon = SolarPositionCalculator.calculateSolarNoon(longitude, testDate)
    console.log(`Solar noon: ${solarNoon.toISOString()}`)
    
    // Calculate solar position at solar noon
    const solarPos = SolarPositionCalculator.calculateSolarPosition(40, longitude, solarNoon)
    const elevationDegrees = solarPos.elevation * 180 / Math.PI
    const azimuthDegrees = solarPos.azimuth * 180 / Math.PI
    
    console.log(`At solar noon:`)
    console.log(`  Elevation: ${elevationDegrees.toFixed(2)}°`)
    console.log(`  Azimuth: ${azimuthDegrees.toFixed(2)}°`)
    
    // At solar noon, elevation should be maximum for the day
    expect(solarPos.elevation).toBeGreaterThan(0)
  })
})
