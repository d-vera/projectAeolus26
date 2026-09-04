import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { StoplightIndicatorComponent } from './stoplight-indicator.component';
import { AirQualityThresholdService } from '../../../../core/services/air-quality-threshold.service';
import { AirQualityReading } from '../../../../models/air-quality.model';
import enTranslations from '../../../../../assets/i18n/en.json';
import esTranslations from '../../../../../assets/i18n/es.json';

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

describe('StoplightIndicatorComponent', () => {
  let component: StoplightIndicatorComponent;
  let fixture: ComponentFixture<StoplightIndicatorComponent>;
  let translate: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        StoplightIndicatorComponent
      ],
      providers: [
        AirQualityThresholdService,
        provideTranslateService()
      ]
    }).compileComponents();

    translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', enTranslations);
    translate.setTranslation('es', esTranslations);
    translate.use('en');

    fixture = TestBed.createComponent(StoplightIndicatorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Green State ──────────────────────────────────────────

  describe('Green state', () => {
    beforeEach(() => {
      component.reading = makeReading();
      component.ngOnChanges();
      fixture.detectChanges();
    });

    it('should show green status when all parameters are safe', () => {
      expect(component.status()).toBe('green');
    });

    it('should have no violations', () => {
      expect(component.violations()).toHaveLength(0);
    });

    it('should render the green container class', () => {
      const container = fixture.nativeElement.querySelector('.stoplight-green');
      expect(container).toBeTruthy();
    });

    it('should not render any violation cards', () => {
      const violationCards = fixture.nativeElement.querySelectorAll('.violation-card');
      expect(violationCards.length).toBe(0);
    });

    it('should not render the violations list', () => {
      const list = fixture.nativeElement.querySelector('.violations-list');
      expect(list).toBeFalsy();
    });

    it('should render the green light as active', () => {
      const lightGreen = fixture.nativeElement.querySelector('.light-green');
      expect(lightGreen).toBeTruthy();
    });

    it('should render red and middle lights as dimmed', () => {
      const dimmedLights = fixture.nativeElement.querySelectorAll('.light-dimmed');
      expect(dimmedLights.length).toBe(2);
    });

    it('should render the stoplight housing with 3 lights', () => {
      const housing = fixture.nativeElement.querySelector('.stoplight-housing');
      expect(housing).toBeTruthy();
      const lights = housing.querySelectorAll('.stoplight-light');
      expect(lights.length).toBe(3);
    });

    it('should render the green status badge', () => {
      const badge = fixture.nativeElement.querySelector('.badge-green');
      expect(badge).toBeTruthy();
    });
  });

  // ── Yellow State ─────────────────────────────────────────

  describe('Yellow state', () => {
    beforeEach(() => {
      component.reading = makeReading({ pm2_5: 20.0 }); // yellow range
      component.ngOnChanges();
      fixture.detectChanges();
    });

    it('should show yellow status', () => {
      expect(component.status()).toBe('yellow');
    });

    it('should have one violation', () => {
      expect(component.violations()).toHaveLength(1);
      expect(component.violations()[0].severity).toBe('yellow');
    });

    it('should render the yellow container class', () => {
      const container = fixture.nativeElement.querySelector('.stoplight-yellow');
      expect(container).toBeTruthy();
    });

    it('should render the yellow light as active', () => {
      const lightYellow = fixture.nativeElement.querySelector('.light-yellow');
      expect(lightYellow).toBeTruthy();
    });

    it('should render one violation card with yellow styling', () => {
      const violationCards = fixture.nativeElement.querySelectorAll('.violation-card-yellow');
      expect(violationCards.length).toBe(1);
    });

    it('should render yellow violation dot', () => {
      const dot = fixture.nativeElement.querySelector('.violation-dot-yellow');
      expect(dot).toBeTruthy();
    });

    it('should display the yellow status badge', () => {
      const badge = fixture.nativeElement.querySelector('.badge-yellow');
      expect(badge).toBeTruthy();
    });

    it('should display health message for yellow PM2.5', () => {
      const healthText = fixture.nativeElement.querySelector('.violation-health-text');
      expect(healthText?.textContent).toContain('respiratory tract irritation');
    });

    it('should not have red-pulse animation', () => {
      const redContainer = fixture.nativeElement.querySelector('.stoplight-red');
      expect(redContainer).toBeFalsy();
    });
  });

  // ── Orange State ─────────────────────────────────────────

  describe('Orange state', () => {
    beforeEach(() => {
      component.reading = makeReading({ co2: 1200 }); // orange range
      component.ngOnChanges();
      fixture.detectChanges();
    });

    it('should show orange status', () => {
      expect(component.status()).toBe('orange');
    });

    it('should have one violation', () => {
      expect(component.violations()).toHaveLength(1);
      expect(component.violations()[0].severity).toBe('orange');
    });

    it('should render the orange container class', () => {
      const container = fixture.nativeElement.querySelector('.stoplight-orange');
      expect(container).toBeTruthy();
    });

    it('should render the orange light as active', () => {
      const lightOrange = fixture.nativeElement.querySelector('.light-orange');
      expect(lightOrange).toBeTruthy();
    });

    it('should render one violation card with orange styling', () => {
      const violationCards = fixture.nativeElement.querySelectorAll('.violation-card-orange');
      expect(violationCards.length).toBe(1);
    });

    it('should render orange violation dot', () => {
      const dot = fixture.nativeElement.querySelector('.violation-dot-orange');
      expect(dot).toBeTruthy();
    });

    it('should display the orange status badge', () => {
      const badge = fixture.nativeElement.querySelector('.badge-orange');
      expect(badge).toBeTruthy();
    });

    it('should display health message for orange CO₂', () => {
      const healthText = fixture.nativeElement.querySelector('.violation-health-text');
      expect(healthText?.textContent).toContain('impaired cognitive performance');
    });
  });

  // ── Red State with single violation ──────────────────────

  describe('Red state with single violation', () => {
    beforeEach(() => {
      component.reading = makeReading({ pm2_5: 82.3 });
      component.ngOnChanges();
      fixture.detectChanges();
    });

    it('should show red status', () => {
      expect(component.status()).toBe('red');
    });

    it('should have one violation', () => {
      expect(component.violations()).toHaveLength(1);
    });

    it('should render the red container class', () => {
      const container = fixture.nativeElement.querySelector('.stoplight-red');
      expect(container).toBeTruthy();
    });

    it('should render the red light as active', () => {
      const lightRed = fixture.nativeElement.querySelector('.light-red');
      expect(lightRed).toBeTruthy();
    });

    it('should render one violation card with red styling', () => {
      const violationCards = fixture.nativeElement.querySelectorAll('.violation-card-red');
      expect(violationCards.length).toBe(1);
    });

    it('should display the violation parameter name', () => {
      const paramName = fixture.nativeElement.querySelector('.violation-param-name');
      expect(paramName?.textContent?.trim()).toBe('PM 2.5');
    });

    it('should display the health message', () => {
      const healthText = fixture.nativeElement.querySelector('.violation-health-text');
      expect(healthText?.textContent).toContain('respiratory inflammation');
    });

    it('should render the red status badge', () => {
      const badge = fixture.nativeElement.querySelector('.badge-red');
      expect(badge).toBeTruthy();
    });
  });

  // ── Red State with multiple violations ───────────────────

  describe('Red state with multiple violations', () => {
    beforeEach(() => {
      component.reading = makeReading({ pm2_5: 82.3, co2: 1820 });
      component.ngOnChanges();
      fixture.detectChanges();
    });

    it('should have two violations', () => {
      expect(component.violations()).toHaveLength(2);
    });

    it('should render two violation cards', () => {
      const violationCards = fixture.nativeElement.querySelectorAll('.violation-card');
      expect(violationCards.length).toBe(2);
    });

    it('should display health messages for each violation', () => {
      const healthTexts = fixture.nativeElement.querySelectorAll('.violation-health-text');
      expect(healthTexts.length).toBe(2);
      const allText = Array.from(healthTexts).map((el: any) => el.textContent).join(' ');
      expect(allText).toContain('respiratory inflammation');
      expect(allText).toContain('Drowsiness');
    });
  });

  // ── Mixed severity violations ────────────────────────────

  describe('Mixed severity (red + yellow)', () => {
    beforeEach(() => {
      // PM2.5 = red (82.3), CO₂ = yellow (850)
      component.reading = makeReading({ pm2_5: 82.3, co2: 850 });
      component.ngOnChanges();
      fixture.detectChanges();
    });

    it('should show red status (worst wins)', () => {
      expect(component.status()).toBe('red');
    });

    it('should have two violations', () => {
      expect(component.violations()).toHaveLength(2);
    });

    it('should render red container (not yellow)', () => {
      expect(fixture.nativeElement.querySelector('.stoplight-red')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.stoplight-yellow')).toBeFalsy();
    });

    it('should render both red and yellow violation cards', () => {
      const redCards = fixture.nativeElement.querySelectorAll('.violation-card-red');
      const yellowCards = fixture.nativeElement.querySelectorAll('.violation-card-yellow');
      expect(redCards.length).toBe(1);
      expect(yellowCards.length).toBe(1);
    });

    it('should render both red and yellow violation dots', () => {
      expect(fixture.nativeElement.querySelector('.violation-dot-red')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.violation-dot-yellow')).toBeTruthy();
    });

    it('should show violations sorted by severity (red first)', () => {
      const violations = component.violations();
      expect(violations[0].severity).toBe('red');
      expect(violations[1].severity).toBe('yellow');
    });
  });

  describe('Mixed severity (orange + yellow)', () => {
    beforeEach(() => {
      // PM10 = orange (120.0), PM2.5 = yellow (20.0)
      component.reading = makeReading({ pm10: 120.0, pm2_5: 20.0 });
      component.ngOnChanges();
      fixture.detectChanges();
    });

    it('should show orange status (worst wins, no red)', () => {
      expect(component.status()).toBe('orange');
    });

    it('should render orange container', () => {
      expect(fixture.nativeElement.querySelector('.stoplight-orange')).toBeTruthy();
    });

    it('should have two violations', () => {
      expect(component.violations()).toHaveLength(2);
    });

    it('should render both orange and yellow violation cards', () => {
      const orangeCards = fixture.nativeElement.querySelectorAll('.violation-card-orange');
      const yellowCards = fixture.nativeElement.querySelectorAll('.violation-card-yellow');
      expect(orangeCards.length).toBe(1);
      expect(yellowCards.length).toBe(1);
    });
  });

  // ── Red state with low temperature ───────────────────────

  describe('Red state with low temperature', () => {
    beforeEach(() => {
      component.reading = makeReading({ temperature: 8.5 });
      component.ngOnChanges();
      fixture.detectChanges();
    });

    it('should show red status for low temperature', () => {
      expect(component.status()).toBe('red');
    });

    it('should display hypothermia health message', () => {
      const healthText = fixture.nativeElement.querySelector('.violation-health-text');
      expect(healthText?.textContent).toContain('hypothermia');
    });
  });

  // ── Red state with low humidity ──────────────────────────

  describe('Red state with low humidity', () => {
    beforeEach(() => {
      component.reading = makeReading({ humidity: 12.0 });
      component.ngOnChanges();
      fixture.detectChanges();
    });

    it('should show red status for low humidity', () => {
      expect(component.status()).toBe('red');
    });

    it('should display dry skin health message', () => {
      const healthText = fixture.nativeElement.querySelector('.violation-health-text');
      expect(healthText?.textContent).toContain('dry skin');
    });
  });

  // ── Pulsing animation ───────────────────────────────────

  describe('Pulsing animation', () => {
    it('should have red-pulse animation class on red state container', () => {
      component.reading = makeReading({ pm2_5: 82.3 });
      component.ngOnChanges();
      fixture.detectChanges();
      const container = fixture.nativeElement.querySelector('.stoplight-red');
      expect(container).toBeTruthy();
    });

    it('should not have red state classes on green state', () => {
      component.reading = makeReading();
      component.ngOnChanges();
      fixture.detectChanges();
      const redContainer = fixture.nativeElement.querySelector('.stoplight-red');
      expect(redContainer).toBeFalsy();
    });

    it('should not have red state classes on yellow state', () => {
      component.reading = makeReading({ pm2_5: 20.0 });
      component.ngOnChanges();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.stoplight-red')).toBeFalsy();
    });

    it('should not have red state classes on orange state', () => {
      component.reading = makeReading({ co2: 1200 });
      component.ngOnChanges();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.stoplight-red')).toBeFalsy();
    });
  });

  // ── No reading ──────────────────────────────────────────

  describe('No reading', () => {
    it('should default to green when no reading is provided', () => {
      component.reading = null;
      component.ngOnChanges();
      fixture.detectChanges();
      expect(component.status()).toBe('green');
      expect(component.violations()).toHaveLength(0);
    });

    it('should not render the container when reading is null', () => {
      component.reading = null;
      component.ngOnChanges();
      fixture.detectChanges();
      const container = fixture.nativeElement.querySelector('.stoplight-container');
      expect(container).toBeFalsy();
    });
  });

  // ── Spanish Translation ─────────────────────────────────

  describe('Spanish Translation', () => {
    it('should display Spanish parameter name and health message when language is ES', () => {
      translate.use('es');
      component.reading = makeReading({ pm2_5: 20.0 }); // yellow
      component.ngOnChanges();
      fixture.detectChanges();

      const paramName = fixture.nativeElement.querySelector('.violation-param-name');
      expect(paramName?.textContent?.trim()).toBe('PM 2.5');

      const healthText = fixture.nativeElement.querySelector('.violation-health-text');
      expect(healthText?.textContent).toContain('Irritación leve de las vías respiratorias');

      const badge = fixture.nativeElement.querySelector('.badge-yellow');
      expect(badge?.textContent).toContain('Calidad del Aire Moderada');
    });

    it('should translate humidity parameter name to "Humedad" and health message in Spanish', () => {
      translate.use('es');
      component.reading = makeReading({ humidity: 30.0 }); // yellow
      component.ngOnChanges();
      fixture.detectChanges();

      const paramName = fixture.nativeElement.querySelector('.violation-param-name');
      expect(paramName?.textContent?.trim()).toBe('Humedad');

      const healthText = fixture.nativeElement.querySelector('.violation-health-text');
      expect(healthText?.textContent).toContain('Sequedad leve en los ojos');
    });

    it('should translate temperature parameter name to "Temperatura" and health message in Spanish for red state', () => {
      translate.use('es');
      component.reading = makeReading({ temperature: 35.0 }); // red
      component.ngOnChanges();
      fixture.detectChanges();

      const paramName = fixture.nativeElement.querySelector('.violation-param-name');
      expect(paramName?.textContent?.trim()).toBe('Temperatura');

      const healthText = fixture.nativeElement.querySelector('.violation-health-text');
      expect(healthText?.textContent).toContain('Riesgo de agotamiento o golpe de calor');

      const badge = fixture.nativeElement.querySelector('.badge-red');
      expect(badge?.textContent).toContain('Alerta de Salud — Calidad del Aire Crítica');
    });

    it('should translate orange state title and health message in Spanish', () => {
      translate.use('es');
      component.reading = makeReading({ co2: 1200 }); // orange
      component.ngOnChanges();
      fixture.detectChanges();

      const paramName = fixture.nativeElement.querySelector('.violation-param-name');
      expect(paramName?.textContent?.trim()).toBe('CO₂');

      const healthText = fixture.nativeElement.querySelector('.violation-health-text');
      expect(healthText?.textContent).toContain('Dolores de cabeza');

      const badge = fixture.nativeElement.querySelector('.badge-orange');
      expect(badge?.textContent).toContain('Calidad del Aire Deficiente — Tome Precauciones');
    });
  });
});
