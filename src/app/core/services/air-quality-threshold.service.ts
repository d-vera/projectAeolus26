import { Injectable } from '@angular/core';
import { AirQualityReading } from '../../models/air-quality.model';

export type StoplightStatus = 'green' | 'yellow' | 'orange' | 'red';

/**
 * Represents a parameter that is outside the green (optimal) zone.
 * Includes the severity level, current value, threshold label, health message,
 * and translation keys for internationalization.
 */
export interface ThresholdViolation {
  parameter: string;
  paramKey?: keyof AirQualityReading;
  paramTranslationKey: string;
  severity: StoplightStatus;
  value: number;
  unit: string;
  threshold: string;
  healthMessage: string;
  healthMessageKey: string;
}

/** @deprecated Use ThresholdViolation instead */
export type RedZoneViolation = ThresholdViolation;

interface ThresholdConfig {
  paramKey: keyof AirQualityReading;
  label: string;
  paramTranslationKey: string;
  unit: string;
  getStatus: (value: number) => StoplightStatus;
  getThresholdLabel: (value: number, severity: StoplightStatus) => string;
  getHealthMessage: (value: number, severity: StoplightStatus) => string;
  getHealthMessageKey: (value: number, severity: StoplightStatus) => string;
}

/** Priority order for severity levels (higher index = worse) */
const SEVERITY_PRIORITY: Record<StoplightStatus, number> = {
  green: 0,
  yellow: 1,
  orange: 2,
  red: 3
};

@Injectable({
  providedIn: 'root'
})
export class AirQualityThresholdService {

  private readonly thresholdConfigs: ThresholdConfig[] = [
    // ── PM 2.5 ──
    {
      paramKey: 'pm2_5',
      label: 'PM 2.5',
      paramTranslationKey: 'STOPLIGHT.PARAMS.PM2_5',
      unit: 'µg/m³',
      getStatus: (v) => {
        if (v > 75.0) return 'red';
        if (v > 35.0) return 'orange';
        if (v > 15.0) return 'yellow';
        return 'green';
      },
      getThresholdLabel: (_v, severity) => {
        switch (severity) {
          case 'red': return '> 75.0 µg/m³';
          case 'orange': return '35.1–75.0 µg/m³';
          case 'yellow': return '15.1–35.0 µg/m³';
          default: return '≤ 15.0 µg/m³';
        }
      },
      getHealthMessage: (_v, severity) => {
        switch (severity) {
          case 'red':
            return 'Aggravated asthma, respiratory inflammation, increased cardiovascular risk, potential lung damage with prolonged exposure';
          case 'orange':
            return 'Airway inflammation, aggravated asthma attacks, coughing, wheezing, and increased cardiovascular strain in vulnerable groups';
          case 'yellow':
            return 'Mild respiratory tract irritation and subtle reduction in lung function, especially in sensitive individuals (asthma, children, elderly)';
          default:
            return '';
        }
      },
      getHealthMessageKey: (_v, severity) => {
        switch (severity) {
          case 'red': return 'STOPLIGHT.HEALTH.PM2_5_RED';
          case 'orange': return 'STOPLIGHT.HEALTH.PM2_5_ORANGE';
          case 'yellow': return 'STOPLIGHT.HEALTH.PM2_5_YELLOW';
          default: return '';
        }
      }
    },
    // ── PM 10 ──
    {
      paramKey: 'pm10',
      label: 'PM 10',
      paramTranslationKey: 'STOPLIGHT.PARAMS.PM10',
      unit: 'µg/m³',
      getStatus: (v) => {
        if (v > 150.0) return 'red';
        if (v > 100.0) return 'orange';
        if (v > 45.0) return 'yellow';
        return 'green';
      },
      getThresholdLabel: (_v, severity) => {
        switch (severity) {
          case 'red': return '> 150.0 µg/m³';
          case 'orange': return '100.1–150.0 µg/m³';
          case 'yellow': return '45.1–100.0 µg/m³';
          default: return '≤ 45.0 µg/m³';
        }
      },
      getHealthMessage: (_v, severity) => {
        switch (severity) {
          case 'red':
            return 'Upper airway irritation, bronchitis symptoms, reduced lung function';
          case 'orange':
            return 'Bronchial irritation, increased airway resistance, exacerbation of asthma, and worsening bronchitis symptoms';
          case 'yellow':
            return 'Upper respiratory tract irritation, mucous membrane dryness, and mild coughing in sensitive individuals';
          default:
            return '';
        }
      },
      getHealthMessageKey: (_v, severity) => {
        switch (severity) {
          case 'red': return 'STOPLIGHT.HEALTH.PM10_RED';
          case 'orange': return 'STOPLIGHT.HEALTH.PM10_ORANGE';
          case 'yellow': return 'STOPLIGHT.HEALTH.PM10_YELLOW';
          default: return '';
        }
      }
    },
    // ── PM 1.0 ──
    {
      paramKey: 'pm1_0',
      label: 'PM 1.0',
      paramTranslationKey: 'STOPLIGHT.PARAMS.PM1_0',
      unit: 'µg/m³',
      getStatus: (v) => {
        if (v > 50.0) return 'red';
        if (v > 25.0) return 'orange';
        if (v > 10.0) return 'yellow';
        return 'green';
      },
      getThresholdLabel: (_v, severity) => {
        switch (severity) {
          case 'red': return '> 50.0 µg/m³';
          case 'orange': return '25.1–50.0 µg/m³';
          case 'yellow': return '10.1–25.0 µg/m³';
          default: return '≤ 10.0 µg/m³';
        }
      },
      getHealthMessage: (_v, severity) => {
        switch (severity) {
          case 'red':
            return 'Deep lung penetration, particles enter bloodstream, systemic inflammation risk';
          case 'orange':
            return 'Systemic oxidative stress, microvascular inflammation, increased cardiovascular strain, and worsening pulmonary conditions';
          case 'yellow':
            return 'Early alveolar deposition causing mild cellular oxidative stress and subtle airway discomfort in susceptible individuals';
          default:
            return '';
        }
      },
      getHealthMessageKey: (_v, severity) => {
        switch (severity) {
          case 'red': return 'STOPLIGHT.HEALTH.PM1_0_RED';
          case 'orange': return 'STOPLIGHT.HEALTH.PM1_0_ORANGE';
          case 'yellow': return 'STOPLIGHT.HEALTH.PM1_0_YELLOW';
          default: return '';
        }
      }
    },
    // ── CO₂ ──
    {
      paramKey: 'co2',
      label: 'CO₂',
      paramTranslationKey: 'STOPLIGHT.PARAMS.CO2',
      unit: 'ppm',
      getStatus: (v) => {
        if (v > 1500) return 'red';
        if (v > 1000) return 'orange';
        if (v > 700) return 'yellow';
        return 'green';
      },
      getThresholdLabel: (_v, severity) => {
        switch (severity) {
          case 'red': return '> 1500 ppm';
          case 'orange': return '1001–1500 ppm';
          case 'yellow': return '701–1000 ppm';
          default: return '≤ 700 ppm';
        }
      },
      getHealthMessage: (_v, severity) => {
        switch (severity) {
          case 'red':
            return 'Drowsiness, headaches, impaired decision-making, dizziness — ventilate the area immediately';
          case 'orange':
            return 'Headaches, drowsiness, impaired cognitive performance, sluggish decision-making, and increased heart rate';
          case 'yellow':
            return 'Mild mental fatigue, reduced concentration, stuffiness, and subtle cognitive slowdown';
          default:
            return '';
        }
      },
      getHealthMessageKey: (_v, severity) => {
        switch (severity) {
          case 'red': return 'STOPLIGHT.HEALTH.CO2_RED';
          case 'orange': return 'STOPLIGHT.HEALTH.CO2_ORANGE';
          case 'yellow': return 'STOPLIGHT.HEALTH.CO2_YELLOW';
          default: return '';
        }
      }
    },
    // ── Temperature ──
    {
      paramKey: 'temperature',
      label: 'Temperature',
      paramTranslationKey: 'STOPLIGHT.PARAMS.TEMPERATURE',
      unit: '°C',
      getStatus: (v) => {
        if (v > 32.0 || v < 10.0) return 'red';
        if (v > 28.0 || v < 15.0) return 'orange';
        if (v > 24.0 || v < 18.0) return 'yellow';
        return 'green';
      },
      getThresholdLabel: (v, severity) => {
        switch (severity) {
          case 'red': return v > 32.0 ? '> 32.0°C' : '< 10.0°C';
          case 'orange': return v > 28.0 ? '28.1–32.0°C' : '10.0–14.9°C';
          case 'yellow': return v > 24.0 ? '24.1–28.0°C' : '15.0–17.9°C';
          default: return '18.0–24.0°C';
        }
      },
      getHealthMessage: (v, severity) => {
        switch (severity) {
          case 'red':
            return v > 32.0
              ? 'Risk of heat exhaustion or heat stroke — unsafe for prolonged indoor activity'
              : 'Risk of hypothermia — unsafe for prolonged exposure without heating';
          case 'orange':
            return v > 28.0
              ? 'Elevated cardiovascular strain, risk of heat cramps, heavy fatigue, and thermoregulatory stress in vulnerable populations'
              : 'Cold-induced airway constriction, elevated blood pressure, cardiovascular stress, and increased risk of bronchospasms';
          case 'yellow':
            return v > 24.0
              ? 'Thermal discomfort, mild dehydration risk, reduced alertness, and increased sweating'
              : 'Mild cold discomfort, peripheral vasoconstriction (reduced blood flow to extremities), and slight increase in blood pressure';
          default:
            return '';
        }
      },
      getHealthMessageKey: (v, severity) => {
        switch (severity) {
          case 'red': return v > 32.0 ? 'STOPLIGHT.HEALTH.TEMP_HIGH_RED' : 'STOPLIGHT.HEALTH.TEMP_LOW_RED';
          case 'orange': return v > 28.0 ? 'STOPLIGHT.HEALTH.TEMP_HIGH_ORANGE' : 'STOPLIGHT.HEALTH.TEMP_LOW_ORANGE';
          case 'yellow': return v > 24.0 ? 'STOPLIGHT.HEALTH.TEMP_HIGH_YELLOW' : 'STOPLIGHT.HEALTH.TEMP_LOW_YELLOW';
          default: return '';
        }
      }
    },
    // ── Humidity ──
    {
      paramKey: 'humidity',
      label: 'Humidity',
      paramTranslationKey: 'STOPLIGHT.PARAMS.HUMIDITY',
      unit: '%',
      getStatus: (v) => {
        if (v > 80.0 || v < 15.0) return 'red';
        if (v > 70.0 || v < 25.0) return 'orange';
        if (v > 60.0 || v < 35.0) return 'yellow';
        return 'green';
      },
      getThresholdLabel: (v, severity) => {
        switch (severity) {
          case 'red': return v > 80.0 ? '> 80.0%' : '< 15.0%';
          case 'orange': return v > 70.0 ? '70.1–80.0%' : '15.0–24.9%';
          case 'yellow': return v > 60.0 ? '60.1–70.0%' : '25.0–34.9%';
          default: return '35.0–60.0%';
        }
      },
      getHealthMessage: (v, severity) => {
        switch (severity) {
          case 'red':
            return v > 80.0
              ? 'Promotes mold growth and dust mites — respiratory and allergy risks'
              : 'Causes dry skin, eye irritation, and respiratory tract inflammation';
          case 'orange':
            return v > 70.0
              ? 'Accelerated mold and fungal spore growth, triggering allergic rhinitis, respiratory tract infections, and worsening asthma'
              : 'Significant mucous membrane dehydration, impaired respiratory barrier, and heightened susceptibility to viral infections';
          case 'yellow':
            return v > 60.0
              ? 'Increased perspiration discomfort, dust mite proliferation, and mild allergy or sinus symptoms'
              : 'Mild dryness of eyes, skin dryness, and mucous membrane irritation';
          default:
            return '';
        }
      },
      getHealthMessageKey: (v, severity) => {
        switch (severity) {
          case 'red': return v > 80.0 ? 'STOPLIGHT.HEALTH.HUMIDITY_HIGH_RED' : 'STOPLIGHT.HEALTH.HUMIDITY_LOW_RED';
          case 'orange': return v > 70.0 ? 'STOPLIGHT.HEALTH.HUMIDITY_HIGH_ORANGE' : 'STOPLIGHT.HEALTH.HUMIDITY_LOW_ORANGE';
          case 'yellow': return v > 60.0 ? 'STOPLIGHT.HEALTH.HUMIDITY_HIGH_YELLOW' : 'STOPLIGHT.HEALTH.HUMIDITY_LOW_YELLOW';
          default: return '';
        }
      }
    }
  ];

  /**
   * Get the severity status for a single parameter value.
   */
  getParameterStatus(paramName: string, value: number): StoplightStatus {
    const config = this.thresholdConfigs.find(c => c.paramKey === paramName || c.label === paramName);
    if (!config) {
      return 'green';
    }
    return config.getStatus(value);
  }

  /**
   * Return all non-green violations for a given reading, sorted by severity (red first, then orange, then yellow).
   * Returns an empty array when everything is within optimal ranges.
   */
  getViolations(reading: AirQualityReading): ThresholdViolation[] {
    const violations: ThresholdViolation[] = [];

    for (const config of this.thresholdConfigs) {
      const value = reading[config.paramKey] as number;
      if (value != null) {
        const severity = config.getStatus(value);
        if (severity !== 'green') {
          violations.push({
            parameter: config.label,
            paramKey: config.paramKey,
            paramTranslationKey: config.paramTranslationKey,
            severity,
            value,
            unit: config.unit,
            threshold: config.getThresholdLabel(value, severity),
            healthMessage: config.getHealthMessage(value, severity),
            healthMessageKey: config.getHealthMessageKey(value, severity)
          });
        }
      }
    }

    // Sort by severity priority descending (red first)
    violations.sort((a, b) => SEVERITY_PRIORITY[b.severity] - SEVERITY_PRIORITY[a.severity]);

    return violations;
  }

  /**
   * Return the overall stoplight status for a reading.
   * Uses worst-severity-wins priority: red > orange > yellow > green.
   */
  getOverallStatus(reading: AirQualityReading): StoplightStatus {
    let worstPriority = 0;

    for (const config of this.thresholdConfigs) {
      const value = reading[config.paramKey] as number;
      if (value != null) {
        const severity = config.getStatus(value);
        const priority = SEVERITY_PRIORITY[severity];
        if (priority > worstPriority) {
          worstPriority = priority;
        }
        // Short-circuit: can't get worse than red
        if (worstPriority === 3) return 'red';
      }
    }

    const entries = Object.entries(SEVERITY_PRIORITY) as [StoplightStatus, number][];
    return entries.find(([, p]) => p === worstPriority)?.[0] ?? 'green';
  }

  // ── Backward-compatible methods ──

  /**
   * @deprecated Use getParameterStatus() instead.
   * Check whether a single parameter value is in the red (critical/hazardous) zone.
   */
  isRedZone(paramName: string, value: number): boolean {
    return this.getParameterStatus(paramName, value) === 'red';
  }

  /**
   * @deprecated Use getViolations() instead.
   * Return all red-zone violations for a given reading.
   */
  getRedZoneViolations(reading: AirQualityReading): ThresholdViolation[] {
    return this.getViolations(reading).filter(v => v.severity === 'red');
  }
}
