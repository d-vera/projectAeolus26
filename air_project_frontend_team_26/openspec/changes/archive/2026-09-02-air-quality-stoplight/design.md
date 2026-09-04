## Context

The air quality dashboard (Angular 19, standalone components, TailwindCSS) displays real-time sensor readings via `RealTimeCardsComponent` which receives `AirQualityReading[]` from the parent `DashboardComponent`. The readings contain six parameters: temperature, humidity, co2, pm1_0, pm2_5, pm10.

Currently, all values are displayed with static colors (amber for temp, sky for humidity, etc.) regardless of whether they are safe or dangerous. There is no threshold evaluation logic anywhere in the codebase.

The user has defined WHO-based threshold ranges for four severity levels (green, yellow, orange, red). This change implements a full 4-state stoplight indicator that evaluates all six parameters against WHO thresholds and alerts the user with color-coded health impact information.

## Goals / Non-Goals

**Goals:**
- Provide an immediate visual signal (stoplight) when any air quality parameter deviates from optimal ranges
- Support four severity levels: green (good), yellow (moderate/warning), orange (unhealthy/poor), red (critical/hazardous)
- Show which specific parameters are in yellow, orange, or red zones with their current values
- Display health impact messages explaining what each severity level means for the user's health
- Implement a clear priority system: the stoplight displays the worst severity found across all parameters
- Encapsulate all threshold logic in a testable, reusable service

**Non-Goals:**
- Coloring individual metric cards based on threshold (future enhancement)
- Push notifications or sound alerts
- Historical threshold analysis
- User-configurable thresholds

## Decisions

### 1. Standalone threshold service vs. inline logic

**Decision**: Create `AirQualityThresholdService` as a standalone injectable service.

**Rationale**: Threshold evaluation is pure business logic with no UI concerns. A dedicated service makes it independently testable, reusable across components (e.g., if we later want threshold-based card coloring), and keeps the component layer thin. The alternative — embedding threshold checks directly in the component — would tangle business logic with presentation.

### 2. Component placement: below real-time cards

**Decision**: The `StoplightIndicatorComponent` is placed in the `DashboardComponent` template immediately after `<app-real-time-cards>`, before the map section.

**Rationale**: The user specified "down the cards with realtime data." Placing it in the dashboard template (not inside `RealTimeCardsComponent`) keeps the real-time cards component focused on display and makes the stoplight independently removable or repositionable.

### 3. Stoplight visual: full 4-state (green / yellow / orange / red)

**Decision**: The stoplight displays three light circles in a vertical housing (red, yellow/orange, green) resembling a classic traffic light. The active severity level lights up; inactive lights are dimmed. When the status is orange, the middle light shows orange; when yellow, it shows yellow.

**Rationale**: A full 4-state system provides progressive warnings before reaching critical levels, allowing users to take precautionary action. The visual resemblance to a traffic light makes the meaning immediately intuitive.

### 4. Severity priority system

**Decision**: The overall stoplight status is determined by the **worst** severity across all six parameters, following this priority:

1. 🔴 **Red** (highest priority) — if at least one parameter is red, the stoplight is **red**
2. 🟠 **Orange** — if no parameter is red but at least one is orange, the stoplight is **orange**
3. 🟡 **Yellow** — if no parameter is red or orange but at least one is yellow, the stoplight is **yellow**
4. 🟢 **Green** (lowest priority) — only when **all** parameters are green

**Rationale**: The worst-case-wins approach ensures that a single critical reading is never masked by other safe readings. This follows the precautionary principle used in environmental health monitoring.

### 5. Health impact messages: hardcoded in the service

**Decision**: Health impact messages are stored as static data within the threshold service, keyed by parameter name and severity level.

**Rationale**: These are based on established WHO guidelines and do not change at runtime. Externalizing to a config file or API would add complexity with no benefit. Messages should also go through the i18n pipeline (translation keys) to match the app's existing internationalization pattern.

### 6. WHO-based threshold configuration table

Based on the user-provided WHO data, the complete threshold table is:

| Parameter | 🟢 Green (Good) | 🟡 Yellow (Moderate) | 🟠 Orange (Unhealthy) | 🔴 Red (Critical) |
|-----------|-----------------|---------------------|----------------------|-------------------|
| PM 2.5 (µg/m³) | ≤15.0 | 15.1–35.0 | 35.1–75.0 | >75.0 |
| PM 10 (µg/m³) | ≤45.0 | 45.1–100.0 | 100.1–150.0 | >150.0 |
| PM 1.0 (µg/m³) | ≤10.0 | 10.1–25.0 | 25.1–50.0 | >50.0 |
| CO₂ (ppm) | ≤700 | 701–1000 | 1001–1500 | >1500 |
| Temperature (°C) | 18.0–24.0 | 24.1–28.0 or 15.0–17.9 | 28.1–32.0 or 10.0–14.9 | >32.0 or <10.0 |
| Humidity (%) | 35.0–60.0 | 60.1–70.0 or 25.0–34.9 | 70.1–80.0 or 15.0–24.9 | >80.0 or <15.0 |

### 7. Health impact messages per severity

#### 🟡 Yellow (Moderate / Warning)

| Parameter | Health Impact |
|-----------|---------------|
| PM 2.5 | Mild respiratory tract irritation and subtle reduction in lung function, especially in sensitive individuals (asthma, children, elderly) |
| PM 10 | Upper respiratory tract irritation, mucous membrane dryness, and mild coughing in sensitive individuals |
| PM 1.0 | Early alveolar deposition causing mild cellular oxidative stress and subtle airway discomfort in susceptible individuals |
| CO₂ | Mild mental fatigue, reduced concentration, stuffiness, and subtle cognitive slowdown |
| Temperature (high 24.1–28.0) | Thermal discomfort, mild dehydration risk, reduced alertness, and increased sweating |
| Temperature (low 15.0–17.9) | Mild cold discomfort, peripheral vasoconstriction (reduced blood flow to extremities), and slight increase in blood pressure |
| Humidity (high 60.1–70.0) | Increased perspiration discomfort, dust mite proliferation, and mild allergy or sinus symptoms |
| Humidity (low 25.0–34.9) | Mild dryness of eyes, skin dryness, and mucous membrane irritation |

#### 🟠 Orange (Unhealthy / Poor)

| Parameter | Health Impact |
|-----------|---------------|
| PM 2.5 | Airway inflammation, aggravated asthma attacks, coughing, wheezing, and increased cardiovascular strain in vulnerable groups |
| PM 10 | Bronchial irritation, increased airway resistance, exacerbation of asthma, and worsening bronchitis symptoms |
| PM 1.0 | Systemic oxidative stress, microvascular inflammation, increased cardiovascular strain, and worsening pulmonary conditions |
| CO₂ | Headaches, drowsiness, impaired cognitive performance, sluggish decision-making, and increased heart rate |
| Temperature (high 28.1–32.0) | Elevated cardiovascular strain, risk of heat cramps, heavy fatigue, and thermoregulatory stress in vulnerable populations |
| Temperature (low 10.0–14.9) | Cold-induced airway constriction, elevated blood pressure, cardiovascular stress, and increased risk of bronchospasms |
| Humidity (high 70.1–80.0) | Accelerated mold and fungal spore growth, triggering allergic rhinitis, respiratory tract infections, and worsening asthma |
| Humidity (low 15.0–24.9) | Significant mucous membrane dehydration, impaired respiratory barrier, and heightened susceptibility to viral infections |

#### 🔴 Red (Critical / Hazardous)

| Parameter | Health Impact |
|-----------|---------------|
| PM 2.5 | Aggravated asthma, respiratory inflammation, increased cardiovascular risk, potential lung damage with prolonged exposure |
| PM 10 | Upper airway irritation, bronchitis symptoms, reduced lung function |
| PM 1.0 | Deep lung penetration, particles enter bloodstream, systemic inflammation risk |
| CO₂ | Drowsiness, headaches, impaired decision-making, dizziness — ventilate the area immediately |
| Temperature (high >32.0) | Risk of heat exhaustion or heat stroke — unsafe for prolonged indoor activity |
| Temperature (low <10.0) | Risk of hypothermia — unsafe for prolonged exposure without heating |
| Humidity (high >80.0) | Promotes mold growth and dust mites — respiratory and allergy risks |
| Humidity (low <15.0) | Causes dry skin, eye irritation, and respiratory tract inflammation |

### 8. Violation display grouping

**Decision**: When the stoplight is active (non-green), the component shows **all** violations (not just the worst severity) grouped by severity level in descending priority order: red violations first, then orange, then yellow.

**Rationale**: Showing only the worst severity would hide useful information. A user in a red-state scenario benefits from also seeing which other parameters are at orange or yellow to understand the full air quality picture.

### 9. Animation per severity

**Decision**:
- **Red**: Pulsing glow animation (CSS, slow breathing pulse) — draws immediate attention
- **Orange**: Static warm glow — indicates concern without alarm
- **Yellow**: No glow, just a mild highlighted background — informational
- **Green**: No glow, calm background — everything is fine

**Rationale**: Animation intensity should match urgency. Red is a health hazard requiring immediate action; orange is a precaution; yellow is informational.

## Risks / Trade-offs

- **Hardcoded thresholds** → If WHO guidelines update, we must change code. Mitigation: thresholds are centralized in one service, easy to update. A future enhancement could make them configurable.
- **i18n for health messages** → Adding translation keys for all severity levels and parameters requires updating all locale files. Mitigation: health messages are new keys grouped under `STOPLIGHT`, no conflict with existing translations.
- **Visual complexity** → A 4-state stoplight with multiple violation groups could overwhelm users. Mitigation: violations are collapsed when green; only shown when an issue exists. Each severity group is visually distinct.
- **Dual-range parameters** (temperature, humidity) → These have both high and low thresholds at each severity level, doubling the evaluation logic. Mitigation: the service handles this cleanly with directional health messages (e.g., "too hot" vs. "too cold").
