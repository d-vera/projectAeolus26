# Priority & Stoplight Behavior

This document defines the WHO-based threshold ranges, priority resolution hierarchy, visual indicator states, and physiological health impact messages for the Air Quality Stoplight system.

---

## 1. WHO Air Quality Threshold Matrix

All six monitored parameters are evaluated against the four standardized severity levels:

| Parameter | 🟢 Green (Good / Optimal) | 🟡 Yellow (Moderate / Warning) | 🟠 Orange (Unhealthy / Poor) | 🔴 Red (Critical / Hazardous) | Unit |
|---|---|---|---|---|---|
| **PM 2.5** | ≤ 15.0 (WHO Limit) | 15.1 – 35.0 | 35.1 – 75.0 | > 75.0 | µg/m³ |
| **PM 10** | ≤ 45.0 (WHO Limit) | 45.1 – 100.0 | 100.1 – 150.0 | > 150.0 | µg/m³ |
| **PM 1.0** | ≤ 10.0 | 10.1 – 25.0 | 25.1 – 50.0 | > 50.0 | µg/m³ |
| **CO₂** | ≤ 700 (Fresh Air) | 701 – 1000 (Acceptable) | 1001 – 1500 (Stale Air) | > 1500 (Ventilate) | ppm |
| **Temperature** | 18.0 – 24.0 | 24.1 – 28.0 or 15.0 – 17.9 | 28.1 – 32.0 or 10.0 – 14.9 | > 32.0 or < 10.0 | °C |
| **Humidity** | 35.0 – 60.0 | 60.1 – 70.0 or 25.0 – 34.9 | 70.1 – 80.0 or 15.0 – 24.9 | > 80.0 or < 15.0 | % |

---

## 2. Priority Hierarchy & Resolution Rules

The overall stoplight status follows a strict **worst-severity-wins** priority evaluation:

```
🔴 RED (Priority 1) > 🟠 ORANGE (Priority 2) > 🟡 YELLOW (Priority 3) > 🟢 GREEN (Priority 4)
```

### Resolution Rules:
1. **🔴 Red State**: Triggered when **at least one** parameter reaches the Red threshold (regardless of other parameters).
2. **🟠 Orange State**: Triggered when **at least one** parameter reaches Orange, and **no** parameter is Red.
3. **🟡 Yellow State**: Triggered when **at least one** parameter reaches Yellow, and **no** parameter is Orange or Red.
4. **🟢 Green State**: Triggered **only when all six parameters** are within their optimal Green ranges.

---

## 3. Visual & Stoplight Housing Behavior

The physical/UI stoplight consists of a 3-light vertical housing:

```
  ┌────────┐
  │  (🔴)  │  <- Red Light (Top)
  │  (🟡)  │  <- Yellow / Orange Light (Middle)
  │  (🟢)  │  <- Green Light (Bottom)
  └────────┘
```

| Overall State | Active Light | Animation / Styling | Violation Cards Displayed |
|---|---|---|---|
| **🔴 Red** | Red Light (Top) | Continuous pulsing breathing glow (`red-pulse`), Red container | All non-green violations sorted: **Red first**, then Orange, then Yellow |
| **🟠 Orange** | Orange Light (Middle) | Static warm glow, Orange container | All non-green violations sorted: **Orange first**, then Yellow |
| **🟡 Yellow** | Yellow Light (Middle) | Static clean highlight, Yellow container | All Yellow violations |
| **🟢 Green** | Green Light (Bottom) | Calm static glow, Emerald container | None (violations list collapsed) |

---

## 4. Health Impact Messages (According to WHO Guidelines)

When a parameter deviates from optimal levels, the UI renders the exact physiological health impact corresponding to its severity:

### 🟡 Yellow (Moderate / Warning)
| Parameter | Condition | Health Impact Message |
|---|---|---|
| **PM 2.5** | `15.1 – 35.0 µg/m³` | Mild respiratory tract irritation and subtle reduction in lung function, especially in sensitive individuals (asthma, children, elderly) |
| **PM 10** | `45.1 – 100.0 µg/m³` | Upper respiratory tract irritation, mucous membrane dryness, and mild coughing in sensitive individuals |
| **PM 1.0** | `10.1 – 25.0 µg/m³` | Early alveolar deposition causing mild cellular oxidative stress and subtle airway discomfort in susceptible individuals |
| **CO₂** | `701 – 1000 ppm` | Mild mental fatigue, reduced concentration, stuffiness, and subtle cognitive slowdown |
| **Temperature (High)** | `24.1 – 28.0°C` | Thermal discomfort, mild dehydration risk, reduced alertness, and increased sweating |
| **Temperature (Low)** | `15.0 – 17.9°C` | Mild cold discomfort, peripheral vasoconstriction (reduced blood flow to extremities), and slight increase in blood pressure |
| **Humidity (High)** | `60.1 – 70.0%` | Increased perspiration discomfort, dust mite proliferation, and mild allergy or sinus symptoms |
| **Humidity (Low)** | `25.0 – 34.9%` | Mild dryness of eyes, skin dryness, and mucous membrane irritation |

---

### 🟠 Orange (Unhealthy / Poor)
| Parameter | Condition | Health Impact Message |
|---|---|---|
| **PM 2.5** | `35.1 – 75.0 µg/m³` | Airway inflammation, aggravated asthma attacks, coughing, wheezing, and increased cardiovascular strain in vulnerable groups |
| **PM 10** | `100.1 – 150.0 µg/m³` | Bronchial irritation, increased airway resistance, exacerbation of asthma, and worsening bronchitis symptoms |
| **PM 1.0** | `25.1 – 50.0 µg/m³` | Systemic oxidative stress, microvascular inflammation, increased cardiovascular strain, and worsening pulmonary conditions |
| **CO₂** | `1001 – 1500 ppm` | Headaches, drowsiness, impaired cognitive performance, sluggish decision-making, and increased heart rate |
| **Temperature (High)** | `28.1 – 32.0°C` | Elevated cardiovascular strain, risk of heat cramps, heavy fatigue, and thermoregulatory stress in vulnerable populations |
| **Temperature (Low)** | `10.0 – 14.9°C` | Cold-induced airway constriction, elevated blood pressure, cardiovascular stress, and increased risk of bronchospasms |
| **Humidity (High)** | `70.1 – 80.0%` | Accelerated mold and fungal spore growth, triggering allergic rhinitis, respiratory tract infections, and worsening asthma |
| **Humidity (Low)** | `15.0 – 24.9%` | Significant mucous membrane dehydration, impaired respiratory barrier, and heightened susceptibility to viral infections |

---

### 🔴 Red (Critical / Hazardous)
| Parameter | Condition | Health Impact Message |
|---|---|---|
| **PM 2.5** | `> 75.0 µg/m³` | Aggravated asthma, respiratory inflammation, increased cardiovascular risk, potential lung damage with prolonged exposure |
| **PM 10** | `> 150.0 µg/m³` | Upper airway irritation, bronchitis symptoms, reduced lung function |
| **PM 1.0** | `> 50.0 µg/m³` | Deep lung penetration, particles enter bloodstream, systemic inflammation risk |
| **CO₂** | `> 1500 ppm` | Drowsiness, headaches, impaired decision-making, dizziness — ventilate the area immediately |
| **Temperature (High)** | `> 32.0°C` | Risk of heat exhaustion or heat stroke — unsafe for prolonged indoor activity |
| **Temperature (Low)** | `< 10.0°C` | Risk of hypothermia — unsafe for prolonged exposure without heating |
| **Humidity (High)** | `> 80.0%` | Promotes mold growth and dust mites — respiratory and allergy risks |
| **Humidity (Low)** | `< 15.0%` | Causes dry skin, eye irritation, and respiratory tract inflammation |

---

## 5. Evaluation Examples

### Example A: Single Red Parameter
- **Readings**: PM2.5 = `82.3 µg/m³` (🔴 Red), PM10 = `30.0` (🟢 Green), CO₂ = `600` (🟢 Green), Temp = `22.0` (🟢 Green), Humidity = `50.0` (🟢 Green), PM1.0 = `8.0` (🟢 Green)
- **Stoplight Status**: **🔴 Red**
- **UI Output**: Red housing active, 1 violation card for PM 2.5 with critical health alert.

### Example B: Mixed Severity (Red + Orange + Yellow)
- **Readings**: CO₂ = `1800 ppm` (🔴 Red), PM10 = `120.0 µg/m³` (🟠 Orange), PM2.5 = `20.0 µg/m³` (🟡 Yellow), Temp = `22.0°C` (🟢 Green)
- **Stoplight Status**: **🔴 Red** (Worst-severity wins)
- **UI Output**: Red housing active, 3 violation cards ordered:
  1. 🔴 CO₂ (1800 ppm)
  2. 🟠 PM 10 (120.0 µg/m³)
  3. 🟡 PM 2.5 (20.0 µg/m³)

### Example C: Orange & Yellow (No Red)
- **Readings**: PM10 = `120.0 µg/m³` (🟠 Orange), PM2.5 = `20.0 µg/m³` (🟡 Yellow), all others Green.
- **Stoplight Status**: **🟠 Orange**
- **UI Output**: Middle orange light active, 2 violation cards ordered:
  1. 🟠 PM 10 (120.0 µg/m³)
  2. 🟡 PM 2.5 (20.0 µg/m³)

### Example D: All Green
- **Readings**: All 6 parameters within optimal ranges.
- **Stoplight Status**: **🟢 Green**
- **UI Output**: Bottom green light active, "Air Quality OK", 0 violation cards.
