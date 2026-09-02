import { TestBed } from '@angular/core/testing';
import { AirQualityThresholdService, StoplightStatus } from './air-quality-threshold.service';
import { AirQualityReading } from '../../models/air-quality.model';

function makeReading(overrides: Partial<AirQualityReading> = {}): AirQualityReading {
  return {
    deviceId: 'TEST_001',
    time: new Date().toISOString(),
    temperature: 22.0,
    humidity: 50.0,
    co2: 400,
    pm1_0: 5.0,
    pm2_5: 10.0,
    pm10: 20.0,
    ...overrides
  };
}

describe('AirQualityThresholdService', () => {
  let service: AirQualityThresholdService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AirQualityThresholdService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── getParameterStatus ──────────────────────────────────

  describe('getParameterStatus', () => {

    // ── PM 2.5 ──
    describe('PM 2.5', () => {
      it('should return green for value ≤ 15.0', () => {
        expect(service.getParameterStatus('pm2_5', 10.0)).toBe('green');
        expect(service.getParameterStatus('pm2_5', 15.0)).toBe('green');
      });

      it('should return yellow for value 15.1–35.0', () => {
        expect(service.getParameterStatus('pm2_5', 15.1)).toBe('yellow');
        expect(service.getParameterStatus('pm2_5', 25.0)).toBe('yellow');
        expect(service.getParameterStatus('pm2_5', 35.0)).toBe('yellow');
      });

      it('should return orange for value 35.1–75.0', () => {
        expect(service.getParameterStatus('pm2_5', 35.1)).toBe('orange');
        expect(service.getParameterStatus('pm2_5', 55.0)).toBe('orange');
        expect(service.getParameterStatus('pm2_5', 75.0)).toBe('orange');
      });

      it('should return red for value > 75.0', () => {
        expect(service.getParameterStatus('pm2_5', 75.1)).toBe('red');
        expect(service.getParameterStatus('pm2_5', 100.0)).toBe('red');
      });
    });

    // ── PM 10 ──
    describe('PM 10', () => {
      it('should return green for value ≤ 45.0', () => {
        expect(service.getParameterStatus('pm10', 20.0)).toBe('green');
        expect(service.getParameterStatus('pm10', 45.0)).toBe('green');
      });

      it('should return yellow for value 45.1–100.0', () => {
        expect(service.getParameterStatus('pm10', 45.1)).toBe('yellow');
        expect(service.getParameterStatus('pm10', 70.0)).toBe('yellow');
        expect(service.getParameterStatus('pm10', 100.0)).toBe('yellow');
      });

      it('should return orange for value 100.1–150.0', () => {
        expect(service.getParameterStatus('pm10', 100.1)).toBe('orange');
        expect(service.getParameterStatus('pm10', 125.0)).toBe('orange');
        expect(service.getParameterStatus('pm10', 150.0)).toBe('orange');
      });

      it('should return red for value > 150.0', () => {
        expect(service.getParameterStatus('pm10', 150.1)).toBe('red');
        expect(service.getParameterStatus('pm10', 200.0)).toBe('red');
      });
    });

    // ── PM 1.0 ──
    describe('PM 1.0', () => {
      it('should return green for value ≤ 10.0', () => {
        expect(service.getParameterStatus('pm1_0', 5.0)).toBe('green');
        expect(service.getParameterStatus('pm1_0', 10.0)).toBe('green');
      });

      it('should return yellow for value 10.1–25.0', () => {
        expect(service.getParameterStatus('pm1_0', 10.1)).toBe('yellow');
        expect(service.getParameterStatus('pm1_0', 17.0)).toBe('yellow');
        expect(service.getParameterStatus('pm1_0', 25.0)).toBe('yellow');
      });

      it('should return orange for value 25.1–50.0', () => {
        expect(service.getParameterStatus('pm1_0', 25.1)).toBe('orange');
        expect(service.getParameterStatus('pm1_0', 37.0)).toBe('orange');
        expect(service.getParameterStatus('pm1_0', 50.0)).toBe('orange');
      });

      it('should return red for value > 50.0', () => {
        expect(service.getParameterStatus('pm1_0', 50.1)).toBe('red');
        expect(service.getParameterStatus('pm1_0', 60.0)).toBe('red');
      });
    });

    // ── CO₂ ──
    describe('CO₂', () => {
      it('should return green for value ≤ 700', () => {
        expect(service.getParameterStatus('co2', 400)).toBe('green');
        expect(service.getParameterStatus('co2', 700)).toBe('green');
      });

      it('should return yellow for value 701–1000', () => {
        expect(service.getParameterStatus('co2', 701)).toBe('yellow');
        expect(service.getParameterStatus('co2', 850)).toBe('yellow');
        expect(service.getParameterStatus('co2', 1000)).toBe('yellow');
      });

      it('should return orange for value 1001–1500', () => {
        expect(service.getParameterStatus('co2', 1001)).toBe('orange');
        expect(service.getParameterStatus('co2', 1250)).toBe('orange');
        expect(service.getParameterStatus('co2', 1500)).toBe('orange');
      });

      it('should return red for value > 1500', () => {
        expect(service.getParameterStatus('co2', 1501)).toBe('red');
        expect(service.getParameterStatus('co2', 2000)).toBe('red');
      });
    });

    // ── Temperature (dual-range: high and low) ──
    describe('Temperature', () => {
      it('should return green for value 18.0–24.0', () => {
        expect(service.getParameterStatus('temperature', 18.0)).toBe('green');
        expect(service.getParameterStatus('temperature', 22.0)).toBe('green');
        expect(service.getParameterStatus('temperature', 24.0)).toBe('green');
      });

      it('should return yellow for high temp 24.1–28.0', () => {
        expect(service.getParameterStatus('temperature', 24.1)).toBe('yellow');
        expect(service.getParameterStatus('temperature', 26.0)).toBe('yellow');
        expect(service.getParameterStatus('temperature', 28.0)).toBe('yellow');
      });

      it('should return yellow for low temp 15.0–17.9', () => {
        expect(service.getParameterStatus('temperature', 17.9)).toBe('yellow');
        expect(service.getParameterStatus('temperature', 16.0)).toBe('yellow');
        expect(service.getParameterStatus('temperature', 15.0)).toBe('yellow');
      });

      it('should return orange for high temp 28.1–32.0', () => {
        expect(service.getParameterStatus('temperature', 28.1)).toBe('orange');
        expect(service.getParameterStatus('temperature', 30.0)).toBe('orange');
        expect(service.getParameterStatus('temperature', 32.0)).toBe('orange');
      });

      it('should return orange for low temp 10.0–14.9', () => {
        expect(service.getParameterStatus('temperature', 14.9)).toBe('orange');
        expect(service.getParameterStatus('temperature', 12.0)).toBe('orange');
        expect(service.getParameterStatus('temperature', 10.0)).toBe('orange');
      });

      it('should return red for high temp > 32.0', () => {
        expect(service.getParameterStatus('temperature', 32.1)).toBe('red');
        expect(service.getParameterStatus('temperature', 40.0)).toBe('red');
      });

      it('should return red for low temp < 10.0', () => {
        expect(service.getParameterStatus('temperature', 9.9)).toBe('red');
        expect(service.getParameterStatus('temperature', 0.0)).toBe('red');
      });
    });

    // ── Humidity (dual-range: high and low) ──
    describe('Humidity', () => {
      it('should return green for value 35.0–60.0', () => {
        expect(service.getParameterStatus('humidity', 35.0)).toBe('green');
        expect(service.getParameterStatus('humidity', 50.0)).toBe('green');
        expect(service.getParameterStatus('humidity', 60.0)).toBe('green');
      });

      it('should return yellow for high humidity 60.1–70.0', () => {
        expect(service.getParameterStatus('humidity', 60.1)).toBe('yellow');
        expect(service.getParameterStatus('humidity', 65.0)).toBe('yellow');
        expect(service.getParameterStatus('humidity', 70.0)).toBe('yellow');
      });

      it('should return yellow for low humidity 25.0–34.9', () => {
        expect(service.getParameterStatus('humidity', 34.9)).toBe('yellow');
        expect(service.getParameterStatus('humidity', 30.0)).toBe('yellow');
        expect(service.getParameterStatus('humidity', 25.0)).toBe('yellow');
      });

      it('should return orange for high humidity 70.1–80.0', () => {
        expect(service.getParameterStatus('humidity', 70.1)).toBe('orange');
        expect(service.getParameterStatus('humidity', 75.0)).toBe('orange');
        expect(service.getParameterStatus('humidity', 80.0)).toBe('orange');
      });

      it('should return orange for low humidity 15.0–24.9', () => {
        expect(service.getParameterStatus('humidity', 24.9)).toBe('orange');
        expect(service.getParameterStatus('humidity', 20.0)).toBe('orange');
        expect(service.getParameterStatus('humidity', 15.0)).toBe('orange');
      });

      it('should return red for high humidity > 80.0', () => {
        expect(service.getParameterStatus('humidity', 80.1)).toBe('red');
        expect(service.getParameterStatus('humidity', 90.0)).toBe('red');
      });

      it('should return red for low humidity < 15.0', () => {
        expect(service.getParameterStatus('humidity', 14.9)).toBe('red');
        expect(service.getParameterStatus('humidity', 5.0)).toBe('red');
      });
    });

    // ── Edge cases ──
    it('should return green for unknown parameter name', () => {
      expect(service.getParameterStatus('unknown_param', 999)).toBe('green');
    });

    it('should accept label-style parameter names', () => {
      expect(service.getParameterStatus('PM 2.5', 82.3)).toBe('red');
      expect(service.getParameterStatus('CO₂', 850)).toBe('yellow');
      expect(service.getParameterStatus('Temperature', 30.0)).toBe('orange');
    });
  });

  // ── getViolations ───────────────────────────────────────

  describe('getViolations', () => {
    it('should return empty array when all parameters are within green ranges', () => {
      const reading = makeReading();
      const violations = service.getViolations(reading);
      expect(violations).toEqual([]);
    });

    it('should return a yellow violation for PM2.5 at 20.0', () => {
      const reading = makeReading({ pm2_5: 20.0 });
      const violations = service.getViolations(reading);
      expect(violations).toHaveLength(1);
      expect(violations[0].parameter).toBe('PM 2.5');
      expect(violations[0].severity).toBe('yellow');
      expect(violations[0].value).toBe(20.0);
      expect(violations[0].unit).toBe('µg/m³');
      expect(violations[0].threshold).toBe('15.1–35.0 µg/m³');
      expect(violations[0].healthMessage).toContain('respiratory tract irritation');
    });

    it('should return an orange violation for CO₂ at 1200', () => {
      const reading = makeReading({ co2: 1200 });
      const violations = service.getViolations(reading);
      expect(violations).toHaveLength(1);
      expect(violations[0].parameter).toBe('CO₂');
      expect(violations[0].severity).toBe('orange');
      expect(violations[0].threshold).toBe('1001–1500 ppm');
      expect(violations[0].healthMessage).toContain('impaired cognitive performance');
    });

    it('should return a red violation for PM2.5 at 82.3', () => {
      const reading = makeReading({ pm2_5: 82.3 });
      const violations = service.getViolations(reading);
      expect(violations).toHaveLength(1);
      expect(violations[0].parameter).toBe('PM 2.5');
      expect(violations[0].severity).toBe('red');
      expect(violations[0].value).toBe(82.3);
      expect(violations[0].threshold).toBe('> 75.0 µg/m³');
      expect(violations[0].healthMessage).toContain('respiratory inflammation');
    });

    it('should return multiple violations sorted by severity (red first)', () => {
      const reading = makeReading({ pm2_5: 82.3, co2: 850 });
      const violations = service.getViolations(reading);
      expect(violations).toHaveLength(2);
      expect(violations[0].severity).toBe('red');
      expect(violations[0].parameter).toBe('PM 2.5');
      expect(violations[1].severity).toBe('yellow');
      expect(violations[1].parameter).toBe('CO₂');
    });

    it('should return all six violations when every parameter is in the red zone', () => {
      const reading = makeReading({
        pm2_5: 100,
        pm10: 200,
        pm1_0: 60,
        co2: 2000,
        temperature: 35,
        humidity: 90
      });
      const violations = service.getViolations(reading);
      expect(violations).toHaveLength(6);
      violations.forEach(v => expect(v.severity).toBe('red'));
    });

    it('should return mixed-severity violations in correct order', () => {
      const reading = makeReading({
        pm2_5: 20.0,    // yellow
        pm10: 120.0,    // orange
        co2: 1800,      // red
        temperature: 22, // green
        humidity: 50     // green
      });
      const violations = service.getViolations(reading);
      expect(violations).toHaveLength(3);
      expect(violations[0].severity).toBe('red');      // CO₂
      expect(violations[1].severity).toBe('orange');    // PM 10
      expect(violations[2].severity).toBe('yellow');    // PM 2.5
    });

    it('should return correct health message for low temperature (orange)', () => {
      const reading = makeReading({ temperature: 12.0 });
      const violations = service.getViolations(reading);
      expect(violations).toHaveLength(1);
      expect(violations[0].severity).toBe('orange');
      expect(violations[0].threshold).toBe('10.0–14.9°C');
      expect(violations[0].healthMessage).toContain('Cold-induced airway constriction');
    });

    it('should return correct health message for high temperature (yellow)', () => {
      const reading = makeReading({ temperature: 26.0 });
      const violations = service.getViolations(reading);
      expect(violations).toHaveLength(1);
      expect(violations[0].severity).toBe('yellow');
      expect(violations[0].threshold).toBe('24.1–28.0°C');
      expect(violations[0].healthMessage).toContain('Thermal discomfort');
    });

    it('should return correct health message for low humidity (yellow)', () => {
      const reading = makeReading({ humidity: 30.0 });
      const violations = service.getViolations(reading);
      expect(violations).toHaveLength(1);
      expect(violations[0].severity).toBe('yellow');
      expect(violations[0].threshold).toBe('25.0–34.9%');
      expect(violations[0].healthMessage).toContain('Mild dryness of eyes');
    });

    it('should return correct health message for high humidity (orange)', () => {
      const reading = makeReading({ humidity: 75.0 });
      const violations = service.getViolations(reading);
      expect(violations).toHaveLength(1);
      expect(violations[0].severity).toBe('orange');
      expect(violations[0].threshold).toBe('70.1–80.0%');
      expect(violations[0].healthMessage).toContain('mold and fungal spore');
    });

    it('should return correct health message for low temperature (red)', () => {
      const reading = makeReading({ temperature: 8.5 });
      const violations = service.getViolations(reading);
      expect(violations).toHaveLength(1);
      expect(violations[0].severity).toBe('red');
      expect(violations[0].threshold).toBe('< 10.0°C');
      expect(violations[0].healthMessage).toContain('hypothermia');
    });

    it('should return correct health message for high temperature (red)', () => {
      const reading = makeReading({ temperature: 35.0 });
      const violations = service.getViolations(reading);
      expect(violations).toHaveLength(1);
      expect(violations[0].severity).toBe('red');
      expect(violations[0].threshold).toBe('> 32.0°C');
      expect(violations[0].healthMessage).toContain('heat exhaustion');
    });

    it('should return correct health message for low humidity (red)', () => {
      const reading = makeReading({ humidity: 12.0 });
      const violations = service.getViolations(reading);
      expect(violations).toHaveLength(1);
      expect(violations[0].severity).toBe('red');
      expect(violations[0].threshold).toBe('< 15.0%');
      expect(violations[0].healthMessage).toContain('dry skin');
    });

    it('should return correct health message for high humidity (red)', () => {
      const reading = makeReading({ humidity: 85.0 });
      const violations = service.getViolations(reading);
      expect(violations).toHaveLength(1);
      expect(violations[0].severity).toBe('red');
      expect(violations[0].threshold).toBe('> 80.0%');
      expect(violations[0].healthMessage).toContain('mold growth');
    });
  });

  // ── getOverallStatus ───────────────────────────────────

  describe('getOverallStatus', () => {
    it('should return green when all parameters are within optimal ranges', () => {
      const reading = makeReading();
      expect(service.getOverallStatus(reading)).toBe('green');
    });

    it('should return yellow when at least one parameter is yellow and none are worse', () => {
      const reading = makeReading({ pm2_5: 20.0 });
      expect(service.getOverallStatus(reading)).toBe('yellow');
    });

    it('should return orange when at least one parameter is orange and none are red', () => {
      const reading = makeReading({ co2: 1200 });
      expect(service.getOverallStatus(reading)).toBe('orange');
    });

    it('should return red when at least one parameter is red', () => {
      const reading = makeReading({ pm2_5: 82.3 });
      expect(service.getOverallStatus(reading)).toBe('red');
    });

    it('should return red when mixed with red + orange + yellow', () => {
      const reading = makeReading({ pm2_5: 82.3, co2: 1200, pm10: 60.0 });
      expect(service.getOverallStatus(reading)).toBe('red');
    });

    it('should return orange when mixed with orange + yellow (no red)', () => {
      const reading = makeReading({ co2: 1200, pm2_5: 20.0 });
      expect(service.getOverallStatus(reading)).toBe('orange');
    });

    it('should return red for low temperature violation', () => {
      const reading = makeReading({ temperature: 8.5 });
      expect(service.getOverallStatus(reading)).toBe('red');
    });

    it('should return orange for temperature in orange range', () => {
      const reading = makeReading({ temperature: 30.0 });
      expect(service.getOverallStatus(reading)).toBe('orange');
    });

    it('should return yellow for temperature in yellow range', () => {
      const reading = makeReading({ temperature: 26.0 });
      expect(service.getOverallStatus(reading)).toBe('yellow');
    });

    it('should return red for low humidity violation', () => {
      const reading = makeReading({ humidity: 12.0 });
      expect(service.getOverallStatus(reading)).toBe('red');
    });

    it('should return green at exact green boundary values', () => {
      const reading = makeReading({
        pm2_5: 15.0,
        pm10: 45.0,
        pm1_0: 10.0,
        co2: 700,
        temperature: 24.0,
        humidity: 60.0
      });
      expect(service.getOverallStatus(reading)).toBe('green');
    });

    it('should return yellow at exact yellow boundary values', () => {
      // Just past the green boundary for each
      const reading = makeReading({
        pm2_5: 15.1,
        pm10: 45.1,
        pm1_0: 10.1,
        co2: 701,
        temperature: 24.1,
        humidity: 60.1
      });
      expect(service.getOverallStatus(reading)).toBe('yellow');
    });
  });

  // ── Backward compatibility ──────────────────────────────

  describe('isRedZone (backward compatible)', () => {
    it('should return true for PM2.5 above 75.0', () => {
      expect(service.isRedZone('pm2_5', 82.3)).toBe(true);
    });

    it('should return false for PM2.5 at exactly 75.0 (boundary)', () => {
      expect(service.isRedZone('pm2_5', 75.0)).toBe(false);
    });

    it('should return false for PM2.5 in yellow range', () => {
      expect(service.isRedZone('pm2_5', 20.0)).toBe(false);
    });

    it('should return false for PM2.5 in orange range', () => {
      expect(service.isRedZone('pm2_5', 50.0)).toBe(false);
    });

    it('should return true for temperature above 32.0', () => {
      expect(service.isRedZone('temperature', 35.0)).toBe(true);
    });

    it('should return true for temperature below 10.0', () => {
      expect(service.isRedZone('temperature', 8.5)).toBe(true);
    });

    it('should return false for temperature in orange range', () => {
      expect(service.isRedZone('temperature', 30.0)).toBe(false);
    });

    it('should return false for unknown parameter name', () => {
      expect(service.isRedZone('unknown_param', 999)).toBe(false);
    });

    it('should accept label-style parameter names', () => {
      expect(service.isRedZone('PM 2.5', 82.3)).toBe(true);
      expect(service.isRedZone('CO₂', 1820)).toBe(true);
    });
  });

  describe('getRedZoneViolations (backward compatible)', () => {
    it('should return empty array when all parameters are within safe ranges', () => {
      const reading = makeReading();
      const violations = service.getRedZoneViolations(reading);
      expect(violations).toEqual([]);
    });

    it('should return empty array when parameters are in yellow/orange but not red', () => {
      const reading = makeReading({ pm2_5: 20.0, co2: 1200 });
      const violations = service.getRedZoneViolations(reading);
      expect(violations).toEqual([]);
    });

    it('should return only red violations, not yellow or orange', () => {
      const reading = makeReading({ pm2_5: 82.3, co2: 850, pm10: 120.0 });
      const violations = service.getRedZoneViolations(reading);
      expect(violations).toHaveLength(1);
      expect(violations[0].parameter).toBe('PM 2.5');
      expect(violations[0].severity).toBe('red');
    });

    it('should return all six violations when every parameter is in red zone', () => {
      const reading = makeReading({
        pm2_5: 100,
        pm10: 200,
        pm1_0: 60,
        co2: 2000,
        temperature: 35,
        humidity: 90
      });
      const violations = service.getRedZoneViolations(reading);
      expect(violations).toHaveLength(6);
    });
  });
});
