// Simple test script to verify water body exclusion
import { ExclusionMask } from './src/lib/exclusionMask.js'

async function testWaterExclusion() {
  console.log('Testing water body exclusion...')
  
  // Test with water bodies enabled
  const center = { lat: 40.7128, lng: -74.0060 } // New York City
  const radiusKm = 2
  
  console.log('Testing with water bodies enabled...')
  const resultWithWater = await ExclusionMask.isPointExcluded(
    40.7128,
    -74.0060,
    center,
    radiusKm,
    { 
      enabled: true, 
      bufferMeters: 50, 
      includeWater: true, 
      includeSensitive: false,
      tagSetVersion: '1.0',
      cacheExpiryDays: 7,
      apiTimeout: 10000
    }
  )
  
  console.log('Result with water enabled:', resultWithWater)
  
  console.log('Testing with water bodies disabled...')
  const resultWithoutWater = await ExclusionMask.isPointExcluded(
    40.7128,
    -74.0060,
    center,
    radiusKm,
    { 
      enabled: true, 
      bufferMeters: 50, 
      includeWater: false, 
      includeSensitive: false,
      tagSetVersion: '1.0',
      cacheExpiryDays: 7,
      apiTimeout: 10000
    }
  )
  
  console.log('Result with water disabled:', resultWithoutWater)
}

testWaterExclusion().catch(console.error)
