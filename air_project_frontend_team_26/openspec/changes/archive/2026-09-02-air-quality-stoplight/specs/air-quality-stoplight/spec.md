## ADDED Requirements

### Requirement: Stoplight evaluates all parameters against WHO thresholds (4 Severity Levels)
The system SHALL evaluate all six air quality parameters (PM2.5, PM10, PM1.0, CO₂, Temperature, Humidity) from the current reading against WHO-based thresholds across four severity levels:
- 🟢 Green (Good / Optimal)
- 🟡 Yellow (Moderate / Warning)
- 🟠 Orange (Unhealthy / Poor)
- 🔴 Red (Critical / Hazardous)

The threshold ranges are defined below:

| Parameter | 🟢 Green (Optimal) | 🟡 Yellow (Moderate) | 🟠 Orange (Unhealthy) | 🔴 Red (Critical) |
|-----------|--------------------|----------------------|-----------------------|-------------------|
| PM 2.5 (µg/m³) | ≤15.0 | 15.1–35.0 | 35.1–75.0 | >75.0 |
| PM 10 (µg/m³) | ≤45.0 | 45.1–100.0 | 100.1–150.0 | >150.0 |
| PM 1.0 (µg/m³) | ≤10.0 | 10.1–25.0 | 25.1–50.0 | >50.0 |
| CO₂ (ppm) | ≤700 | 701–1000 | 1001–1500 | >1500 |
| Temperature (°C) | 18.0–24.0 | 24.1–28.0 or 15.0–17.9 | 28.1–32.0 or 10.0–14.9 | >32.0 or <10.0 |
| Humidity (%) | 35.0–60.0 | 60.1–70.0 or 25.0–34.9 | 70.1–80.0 or 15.0–24.9 | >80.0 or <15.0 |

#### Scenario: Overall priority evaluation (Worst severity wins)
- **WHEN** at least one parameter is in the red zone
- **THEN** the stoplight indicator SHALL display in the **red** state
- **WHEN** no parameter is red, but at least one parameter is in the orange zone
- **THEN** the stoplight indicator SHALL display in the **orange** state
- **WHEN** no parameter is red or orange, but at least one parameter is in the yellow zone
- **THEN** the stoplight indicator SHALL display in the **yellow** state
- **WHEN** all six parameters are within green thresholds
- **THEN** the stoplight indicator SHALL display in the **green** state

---

### Requirement: Stoplight displays violation details grouped by severity
When the stoplight is in a non-green state (yellow, orange, or red), the system SHALL display a list of all parameters currently deviating from optimal levels, sorted in descending priority order (red violations first, then orange, then yellow). Each listed violation MUST show:
1. The parameter name (e.g., "PM 2.5")
2. The severity-coded visual indicator (dot / badge)
3. The current value with its unit (e.g., "20.0 µg/m³")
4. The threshold range (e.g., "15.1–35.0 µg/m³")
5. The WHO health impact message corresponding to the parameter and severity

#### Scenario: Yellow state display
- **WHEN** PM2.5 is 20.0 µg/m³ (yellow) and all other parameters are green
- **THEN** the stoplight SHALL show yellow status and list PM2.5 with its yellow health impact message

#### Scenario: Orange state display
- **WHEN** CO₂ is 1200 ppm (orange) and all other parameters are green
- **THEN** the stoplight SHALL show orange status and list CO₂ with its orange health impact message

#### Scenario: Red state display with mixed violations
- **WHEN** PM2.5 is 82.3 µg/m³ (red) and CO₂ is 850 ppm (yellow)
- **THEN** the stoplight SHALL show red status and list both violations with red shown first, followed by yellow

---

### Requirement: Stoplight shows WHO health impact messages for each severity level
For each parameter outside optimal green ranges, the system SHALL display a health impact warning message describing the physiological effect on health according to WHO guidelines:

#### 🟡 Yellow (Moderate / Warning) Health Messages
| Parameter | Health Impact Message |
|-----------|-----------------------|
| PM 2.5 | Mild respiratory tract irritation and subtle reduction in lung function, especially in sensitive individuals (asthma, children, elderly) |
| PM 10 | Upper respiratory tract irritation, mucous membrane dryness, and mild coughing in sensitive individuals |
| PM 1.0 | Early alveolar deposition causing mild cellular oxidative stress and subtle airway discomfort in susceptible individuals |
| CO₂ | Mild mental fatigue, reduced concentration, stuffiness, and subtle cognitive slowdown |
| Temperature (high) | Thermal discomfort, mild dehydration risk, reduced alertness, and increased sweating |
| Temperature (low) | Mild cold discomfort, peripheral vasoconstriction (reduced blood flow to extremities), and slight increase in blood pressure |
| Humidity (high) | Increased perspiration discomfort, dust mite proliferation, and mild allergy or sinus symptoms |
| Humidity (low) | Mild dryness of eyes, skin dryness, and mucous membrane irritation |

#### 🟠 Orange (Unhealthy / Poor) Health Messages
| Parameter | Health Impact Message |
|-----------|-----------------------|
| PM 2.5 | Airway inflammation, aggravated asthma attacks, coughing, wheezing, and increased cardiovascular strain in vulnerable groups |
| PM 10 | Bronchial irritation, increased airway resistance, exacerbation of asthma, and worsening bronchitis symptoms |
| PM 1.0 | Systemic oxidative stress, microvascular inflammation, increased cardiovascular strain, and worsening pulmonary conditions |
| CO₂ | Headaches, drowsiness, impaired cognitive performance, sluggish decision-making, and increased heart rate |
| Temperature (high) | Elevated cardiovascular strain, risk of heat cramps, heavy fatigue, and thermoregulatory stress in vulnerable populations |
| Temperature (low) | Cold-induced airway constriction, elevated blood pressure, cardiovascular stress, and increased risk of bronchospasms |
| Humidity (high) | Accelerated mold and fungal spore growth, triggering allergic rhinitis, respiratory tract infections, and worsening asthma |
| Humidity (low) | Significant mucous membrane dehydration, impaired respiratory barrier, and heightened susceptibility to viral infections |

#### 🔴 Red (Critical / Hazardous) Health Messages
| Parameter | Health Impact Message |
|-----------|-----------------------|
| PM 2.5 | Aggravated asthma, respiratory inflammation, increased cardiovascular risk, potential lung damage with prolonged exposure |
| PM 10 | Upper airway irritation, bronchitis symptoms, reduced lung function |
| PM 1.0 | Deep lung penetration, particles enter bloodstream, systemic inflammation risk |
| CO₂ | Drowsiness, headaches, impaired decision-making, dizziness — ventilate the area immediately |
| Temperature (high) | Risk of heat exhaustion or heat stroke — unsafe for prolonged indoor activity |
| Temperature (low) | Risk of hypothermia — unsafe for prolonged exposure without heating |
| Humidity (high) | Promotes mold growth and dust mites — respiratory and allergy risks |
| Humidity (low) | Causes dry skin, eye irritation, and respiratory tract inflammation |

---

### Requirement: Stoplight is positioned below real-time data cards
The stoplight indicator component SHALL be rendered in the dashboard layout immediately after the real-time air quality cards section and before the sensor station map section.

#### Scenario: Stoplight placement in dashboard
- **WHEN** the dashboard page loads with sensor data
- **THEN** the stoplight indicator SHALL appear between the real-time metric cards and the sensor station map

---

### Requirement: Stoplight visual presentation and animations
The stoplight component SHALL display a 3-light vertical housing (red, yellow/orange, green).
- **Red state**: Active red light with pulsing animation (`red-pulse`), red background container
- **Orange state**: Active orange middle light with static warm glow, orange background container
- **Yellow state**: Active yellow middle light, yellow background container
- **Green state**: Active green light, calm green background container

#### Scenario: Visual presentation across severity states
- **WHEN** the stoplight is in the red state
- **THEN** the top red light is active with a pulsing glow animation
- **WHEN** the stoplight is in the orange state
- **THEN** the middle light displays orange with a static warm glow
- **WHEN** the stoplight is in the yellow state
- **THEN** the middle light displays yellow
- **WHEN** the stoplight is in the green state
- **THEN** the bottom light displays green with a calm background
