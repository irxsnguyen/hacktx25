<!-- 84490e20-3c50-4c77-a474-51ea5a0fa327 cf031689-8873-4e4b-94c7-1154ca966211 -->
# Irradiance Computation Diagnostics & Validation

## Overview

Add comprehensive diagnostics to verify every step from solar position → AOI → POA → kWh, focusing on catching the longitude discontinuity issue around -20°.

## Implementation Steps

### 1. Create Diagnostic Test File

**File**: `src/lib/__tests__/irradianceDiagnostics.test.ts`

Create two primary test functions:

- `runFixedUTCSweep()` - Tests at fixed UTC time (12:00 UTC on 2025-06-21)
- `runSolarNoonSweep()` - Tests at true solar noon (hour angle H ≈ 0°)

### 2. Add Unit Validation Utilities

**File**: `src/utils/solarCalculations.ts` (add helper methods)

Add runtime checks:

```typescript
// Validate degrees vs radians
private static validateRadians(angle: number, name: string): void
private static validateDegrees(angle: number, name: string): void

// Check for expected ranges
private static checkElevationRange(elevation: number): void
private static checkAzimuthRange(azimuth: number): void
```

### 3. Add Solar Noon Calculator

**File**: `src/utils/solarCalculations.ts`

Add method to calculate true solar noon:

```typescript
private static calculateSolarNoon(
  longitude: number, 
  date: Date
): Date
```

This accounts for:

- Longitude offset: `longitude / 15` hours
- Equation of Time correction
- Returns Date object at true solar noon

### 4. Enhance Solar Position with Diagnostics

**File**: `src/utils/solarCalculations.ts`

Extend `calculateSolarPosition()` to optionally return diagnostic data:

```typescript
interface SolarPositionDiagnostics {
  declination: number // degrees
  hourAngle: number   // degrees
  zenith: number      // degrees
  elevation: number   // degrees (redundant with existing)
  azimuth: number     // degrees
  convention: string  // "0°=North" or "0°=South"
}
```

### 5. Add AOI Validation

**File**: `src/utils/solarCalculations.ts`

Add diagnostic method:

```typescript
private static validateAOI(
  solarPos: SolarPosition,
  tilt: number,
  panelAzimuth: number,
  latitude: number
): {
  cosIncidence: number
  aoiDegrees: number
  isNegative: boolean
  beamContribution: number
}
```

### 6. Add POA Component Breakdown

**File**: `src/utils/solarCalculations.ts`

Extend POA calculation to return components:

```typescript
interface POAComponents {
  beamPOA: number
  diffusePOA: number
  groundReflected: number
  totalPOA: number
  dni: number
  dhi: number
  ghi: number
  ghiCheck: number // DNI*cos(zenith) + DHI
  ghiError: number // abs(ghi - ghiCheck)
}
```

### 7. Implement Geographic Sweep Tests

**File**: `src/lib/__tests__/irradianceDiagnostics.test.ts`

For each sweep mode (Fixed UTC, Solar Noon):

- Latitude bands: 15°N, 35°N, 55°N
- Longitude range: -80° to +40° in 1° steps
- Date: June 21, 2025 (summer solstice)

For each point, collect:

- lat, lon, mode, UTC_time, H_deg, θz_deg, ψs_deg
- cosθi, Eb_POA, Ed_POA, Er_POA, POA_total
- Unit validation flags

### 8. Add Azimuth Wrap Testing

**File**: `src/lib/__tests__/irradianceDiagnostics.test.ts`

Test continuity around azimuth wrapping:

- Sample azimuth values: 358°, 359°, 0°, 1°, 2°
- Sample panel azimuth differences across wrap
- Assert no discontinuities in (ψs - γ) calculations

### 9. Output Formatting

**File**: `src/lib/__tests__/irradianceDiagnostics.test.ts`

Generate outputs:

- Console table with key diagnostics per sample
- CSV export capability for plotting
- Summary statistics (min/max/stddev of POA_total)
- Pass/fail assertions with clear messages

### 10. Acceptance Criteria Checks

**File**: `src/lib/__tests__/irradianceDiagnostics.test.ts`

Assert:

1. At solar noon, POA_total vs longitude is smooth (no peak at -20°)
2. No degree↔radian violations
3. Azimuth and AOI conventions consistent
4. GHI ≈ DNI*cos(θz) + DHI within tolerance
5. Beam POA = 0 when cosθi < 0
6. No sudden jumps at 0°/360° azimuth wrap

## Key Files Modified

- `src/utils/solarCalculations.ts` - Add diagnostic methods and validation
- `src/lib/__tests__/irradianceDiagnostics.test.ts` - New comprehensive test suite

## Expected Outcomes

The diagnostics will identify:

- Whether longitude is properly used in solar position calculations
- If degree/radian conversions are correct
- If azimuth conventions are consistent
- Where the -20° longitude discontinuity originates
- Whether the issue is time-based, geometric, or unit-related

### To-dos

- [ ] Create src/lib/__tests__/irradianceDiagnostics.test.ts with sweep test framework
- [ ] Add unit validation utilities (validateRadians, validateDegrees) to solarCalculations.ts
- [ ] Implement calculateSolarNoon() method with longitude offset and Equation of Time
- [ ] Extend calculateSolarPosition() to optionally return diagnostic data structure
- [ ] Add validateAOI() method to check angle of incidence calculations
- [ ] Extend POA calculations to return component breakdown (beam/diffuse/ground)
- [ ] Implement Fixed UTC and Solar Noon geographic sweep tests
- [ ] Add azimuth wrap continuity tests around 0°/360°
- [ ] Implement console/CSV output with summary statistics
- [ ] Add pass/fail assertions based on acceptance criteria