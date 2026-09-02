## 1. Threshold Service

- [x] 1.1 Update `AirQualityThresholdService` at `src/app/core/services/air-quality-threshold.service.ts`: expand `StoplightStatus` type to `'green' | 'yellow' | 'orange' | 'red'`; rename `RedZoneViolation` to `ThresholdViolation` adding a `severity` field
- [x] 1.2 Replace `redCondition` in each `ThresholdConfig` with a `getStatus(value): StoplightStatus` function that evaluates all 4 WHO-based levels per parameter:
  - PM 2.5: green ≤15.0, yellow 15.1–35.0, orange 35.1–75.0, red >75.0
  - PM 10: green ≤45.0, yellow 45.1–100.0, orange 100.1–150.0, red >150.0
  - PM 1.0: green ≤10.0, yellow 10.1–25.0, orange 25.1–50.0, red >50.0
  - CO₂: green ≤700, yellow 701–1000, orange 1001–1500, red >1500
  - Temperature: green 18.0–24.0, yellow 24.1–28.0 or 15.0–17.9, orange 28.1–32.0 or 10.0–14.9, red >32.0 or <10.0
  - Humidity: green 35.0–60.0, yellow 60.1–70.0 or 25.0–34.9, orange 70.1–80.0 or 15.0–24.9, red >80.0 or <15.0
- [x] 1.3 Add `getParameterStatus(paramName, value): StoplightStatus` method for single parameter evaluation
- [x] 1.4 Add `getViolations(reading): ThresholdViolation[]` method that returns all non-green violations with their severity, value, unit, threshold label, and health message
- [x] 1.5 Update `getOverallStatus(reading): StoplightStatus` to return the worst severity across all parameters using priority: red > orange > yellow > green
- [x] 1.6 Add yellow-level health messages for each parameter (with separate high/low messages for temperature and humidity)
- [x] 1.7 Add orange-level health messages for each parameter (with separate high/low messages for temperature and humidity)
- [x] 1.8 Keep backward-compatible `isRedZone()` and `getRedZoneViolations()` methods delegating to new logic
- [x] 1.9 Write unit tests for all new threshold scenarios: yellow detection for each parameter, orange detection for each parameter, boundary values at each transition (green→yellow, yellow→orange, orange→red), dual-range parameters (temperature high/low, humidity high/low), `getOverallStatus` worst-severity-wins logic, and backward compatibility of `isRedZone`/`getRedZoneViolations`

## 2. Stoplight Indicator Component

- [x] 2.1 Update `StoplightIndicatorComponent` template: show 3 light circles (red, yellow/orange, green) in a vertical stoplight housing; the active severity lights up, others are dimmed
- [x] 2.2 Add yellow state rendering: yellow header title with "Moderate Air Quality", subtitle showing count of yellow parameters, list of yellow violations
- [x] 2.3 Add orange state rendering: orange header title with "Poor Air Quality — Take Precautions", subtitle showing count of orange+ parameters, list of orange violations (and any yellow violations grouped below)
- [x] 2.4 Update red state rendering: show red + orange + yellow violations grouped by severity in descending priority order
- [x] 2.5 Color-code each violation card's dot by its severity (yellow dot, orange dot, red dot)
- [x] 2.6 Add CSS: `.stoplight-yellow` and `.stoplight-orange` container styles, `.light-yellow` and `.light-orange` circle styles, yellow/orange violation dot colors, dark mode variants for all new colors
- [x] 2.7 Add animations: pulsing glow on red state only, static warm glow on orange state, no glow on yellow/green
- [x] 2.8 Wire component to updated service: use `getViolations()` and `getOverallStatus()`, group violations by severity for display
- [x] 2.9 Write unit tests: yellow state rendering (container class, light, title, violations), orange state rendering, grouped violations display (e.g., reading with red + yellow violations), priority logic reflected in UI, keep existing green and red tests passing

## 3. Dashboard Integration

- [x] 3.1 Verify `StoplightIndicatorComponent` import in `DashboardComponent` and template placement after `<app-real-time-cards>`
- [x] 3.2 Pass the current reading to the stoplight component (already wired, verify still works)
- [x] 3.3 Verify the stoplight renders correctly in all four states (green, yellow, orange, red)

## 4. Internationalization

- [x] 4.1 Add translation keys to EN locale: `STOPLIGHT.YELLOW_TITLE`, `STOPLIGHT.YELLOW_SUBTITLE`, `STOPLIGHT.ORANGE_TITLE`, `STOPLIGHT.ORANGE_SUBTITLE`
- [x] 4.2 Add corresponding Spanish translations to ES locale

## 5. Verification

- [x] 5.1 Run `ng build` and confirm zero compilation errors
- [x] 5.2 Run `npm test` and confirm all existing and new tests pass
- [x] 5.3 Visually verify the stoplight renders below the real-time cards in the running application
- [x] 5.4 Test with yellow-zone values to confirm yellow state, violations list, and health messages appear correctly
- [x] 5.5 Test with orange-zone values to confirm orange state with grouped violations
- [x] 5.6 Test with red-zone values to confirm red state with all severity groups displayed
- [x] 5.7 Test with mixed severities (e.g., one red + one yellow) to confirm stoplight shows red and lists both violations
