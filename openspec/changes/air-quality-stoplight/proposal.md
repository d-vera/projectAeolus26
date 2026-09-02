## Why

The dashboard currently displays real-time air quality metrics (PM2.5, PM10, PM1.0, CO₂, Temperature, Humidity) as flat value cards with no visual indication of whether values are safe or dangerous. Users must memorize WHO thresholds to interpret readings. When parameters deviate from optimal ranges — whether moderately or critically — there is no alert mechanism and no guidance on health consequences. Users can unknowingly remain in environments with degrading or dangerous air quality without any progressive warning.

## What Changes

- Add a **stoplight indicator component** positioned below the real-time data cards that evaluates all six parameters against WHO-based thresholds across **four severity levels**: green (good), yellow (moderate/warning), orange (unhealthy/poor), and red (critical/hazardous)
- The stoplight uses a **worst-severity-wins priority system**:
  - 🔴 **Red** — if at least one parameter is in the red zone
  - 🟠 **Orange** — if no parameter is red, but at least one is orange
  - 🟡 **Yellow** — if no parameter is red or orange, but at least one is yellow
  - 🟢 **Green** — only when all parameters are within optimal ranges
- The stoplight displays **three light circles** (red, yellow/orange, green) in a vertical housing, with the active severity lit and others dimmed
- When non-green, the component expands to list **all violations grouped by severity** (red first, then orange, then yellow), showing the current value, the threshold range, and a health impact warning message specific to each parameter and severity
- The **air quality threshold service** encapsulates all threshold evaluation logic for all four severity levels using the WHO-based threshold table
- Health impact messages are specific to each parameter and severity level (e.g., PM2.5 yellow → mild respiratory discomfort for sensitive individuals; PM2.5 red → aggravated asthma and cardiovascular risk)

## Capabilities

### New Capabilities
- `air-quality-stoplight`: Full 4-state stoplight indicator component that evaluates real-time readings against WHO-based thresholds (green/yellow/orange/red), displays the worst severity status, and shows grouped health impact warnings for all parameters outside optimal ranges

### Modified Capabilities
_(none — this is a new visual feature added to the existing dashboard, no existing spec requirements change)_

## Impact

- **Dashboard component**: Template updated to include the new stoplight component below `<app-real-time-cards>`
- **New service**: `AirQualityThresholdService` — pure logic service with full 4-level threshold evaluation, no API calls, no external dependencies
- **New component**: `StoplightIndicatorComponent` — standalone Angular component with 4-state visual rendering
- **i18n**: New translation keys for all four severity states (titles, subtitles) in EN and ES locale files
- **Models**: No changes to existing data models; the `AirQualityReading` interface already has all needed fields
- **Dependencies**: No new packages required
