import { Component, Input, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { AirQualityReading } from '../../../../models/air-quality.model';
import {
  AirQualityThresholdService,
  ThresholdViolation,
  StoplightStatus
} from '../../../../core/services/air-quality-threshold.service';

@Component({
  selector: 'app-stoplight-indicator',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    @if (reading) {
      <div class="stoplight-container"
        [class.stoplight-green]="status() === 'green'"
        [class.stoplight-yellow]="status() === 'yellow'"
        [class.stoplight-orange]="status() === 'orange'"
        [class.stoplight-red]="status() === 'red'">

        <!-- Stoplight Header -->
        <div class="stoplight-header">
          <!-- 3-Light Vertical Stoplight Housing -->
          <div class="stoplight-housing">
            <div class="stoplight-light"
              [class.light-red]="status() === 'red'"
              [class.light-dimmed]="status() !== 'red'">
            </div>
            <div class="stoplight-light"
              [class.light-yellow]="status() === 'yellow'"
              [class.light-orange]="status() === 'orange'"
              [class.light-dimmed]="status() !== 'yellow' && status() !== 'orange'">
            </div>
            <div class="stoplight-light"
              [class.light-green]="status() === 'green'"
              [class.light-dimmed]="status() !== 'green'">
            </div>
          </div>

          <!-- Title & Status Icon Area -->
          <div class="stoplight-title-area">
            @switch (status()) {
              @case ('red') {
                <div class="status-badge badge-red">
                  <svg class="badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>{{ 'STOPLIGHT.RED_TITLE' | translate }}</span>
                </div>
                <p class="stoplight-subtitle subtitle-red">
                  {{ 'STOPLIGHT.RED_SUBTITLE' | translate:{ count: violations().length } }}
                </p>
              }
              @case ('orange') {
                <div class="status-badge badge-orange">
                  <svg class="badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>{{ 'STOPLIGHT.ORANGE_TITLE' | translate }}</span>
                </div>
                <p class="stoplight-subtitle subtitle-orange">
                  {{ 'STOPLIGHT.ORANGE_SUBTITLE' | translate:{ count: violations().length } }}
                </p>
              }
              @case ('yellow') {
                <div class="status-badge badge-yellow">
                  <svg class="badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{{ 'STOPLIGHT.YELLOW_TITLE' | translate }}</span>
                </div>
                <p class="stoplight-subtitle subtitle-yellow">
                  {{ 'STOPLIGHT.YELLOW_SUBTITLE' | translate:{ count: violations().length } }}
                </p>
              }
              @default {
                <div class="status-badge badge-green">
                  <svg class="badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                      d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{{ 'STOPLIGHT.GREEN_TITLE' | translate }}</span>
                </div>
                <p class="stoplight-subtitle subtitle-green">
                  {{ 'STOPLIGHT.GREEN_SUBTITLE' | translate }}
                </p>
              }
            }
          </div>
        </div>

        <!-- Violations List (grouped by severity) -->
        @if (violations().length > 0) {
          <div class="violations-list">
            @for (violation of violations(); track violation.parameter) {
              <div class="violation-card"
                [class.violation-card-red]="violation.severity === 'red'"
                [class.violation-card-orange]="violation.severity === 'orange'"
                [class.violation-card-yellow]="violation.severity === 'yellow'">
                <div class="violation-header">
                  <div class="violation-param-badge">
                    <span class="violation-dot"
                      [class.violation-dot-red]="violation.severity === 'red'"
                      [class.violation-dot-orange]="violation.severity === 'orange'"
                      [class.violation-dot-yellow]="violation.severity === 'yellow'">
                    </span>
                    <span class="violation-param-name">{{ (violation.paramTranslationKey ? (violation.paramTranslationKey | translate) : violation.parameter) }}</span>
                  </div>
                  <div class="violation-values">
                    <span class="violation-current-value"
                      [class.value-red]="violation.severity === 'red'"
                      [class.value-orange]="violation.severity === 'orange'"
                      [class.value-yellow]="violation.severity === 'yellow'">
                      {{ violation.value | number:'1.1-1' }} {{ violation.unit }}
                    </span>
                    <span class="violation-threshold">{{ 'STOPLIGHT.THRESHOLD_LABEL' | translate }} {{ violation.threshold }}</span>
                  </div>
                </div>
                <div class="violation-health">
                  <svg class="violation-health-icon"
                    [class.health-icon-red]="violation.severity === 'red'"
                    [class.health-icon-orange]="violation.severity === 'orange'"
                    [class.health-icon-yellow]="violation.severity === 'yellow'"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span class="violation-health-text">{{ (violation.healthMessageKey ? (violation.healthMessageKey | translate) : violation.healthMessage) }}</span>
                </div>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .stoplight-container {
      border-radius: 1.25rem;
      padding: 1.25rem 1.5rem;
      transition: all 0.3s ease;
    }

    /* ── Green State ── */
    .stoplight-green {
      background: linear-gradient(135deg, #ecfdf5, #d1fae5);
      border: 1px solid #a7f3d0;
    }
    :host-context(.dark) .stoplight-green {
      background: linear-gradient(135deg, rgba(6, 78, 59, 0.2), rgba(6, 95, 70, 0.15));
      border-color: rgba(52, 211, 153, 0.2);
    }

    /* ── Yellow State ── */
    .stoplight-yellow {
      background: linear-gradient(135deg, #fefce8, #fef9c3);
      border: 1px solid #fde68a;
    }
    :host-context(.dark) .stoplight-yellow {
      background: linear-gradient(135deg, rgba(113, 63, 18, 0.2), rgba(133, 77, 14, 0.15));
      border-color: rgba(253, 224, 71, 0.2);
    }

    /* ── Orange State ── */
    .stoplight-orange {
      background: linear-gradient(135deg, #fff7ed, #ffedd5);
      border: 1px solid #fed7aa;
      box-shadow: 0 0 12px 2px rgba(251, 146, 60, 0.1);
    }
    :host-context(.dark) .stoplight-orange {
      background: linear-gradient(135deg, rgba(124, 45, 18, 0.2), rgba(154, 52, 18, 0.15));
      border-color: rgba(251, 146, 60, 0.25);
      box-shadow: 0 0 12px 2px rgba(251, 146, 60, 0.08);
    }

    /* ── Red State ── */
    .stoplight-red {
      background: linear-gradient(135deg, #fef2f2, #fee2e2);
      border: 1px solid #fca5a5;
      animation: red-pulse 2s ease-in-out infinite;
    }
    :host-context(.dark) .stoplight-red {
      background: linear-gradient(135deg, rgba(127, 29, 29, 0.2), rgba(153, 27, 27, 0.15));
      border-color: rgba(248, 113, 113, 0.3);
    }

    @keyframes red-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
      50% { box-shadow: 0 0 20px 4px rgba(239, 68, 68, 0.15); }
    }

    /* ── Header ── */
    .stoplight-header {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    /* ── Stoplight Housing (3 Lights) ── */
    .stoplight-housing {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      background: #1e293b;
      border-radius: 1.25rem;
      padding: 0.4rem;
    }
    :host-context(.dark) .stoplight-housing {
      background: #0f172a;
      box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
    }

    .stoplight-light {
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      transition: all 0.3s ease;
    }

    .light-dimmed {
      background-color: #334155;
      opacity: 0.35;
    }
    :host-context(.dark) .light-dimmed {
      background-color: #1e293b;
      opacity: 0.3;
    }

    .light-green {
      background-color: #10b981;
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
    }
    :host-context(.dark) .light-green {
      background-color: #059669;
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
    }

    .light-yellow {
      background-color: #eab308;
      box-shadow: 0 0 10px rgba(234, 179, 8, 0.5);
    }
    :host-context(.dark) .light-yellow {
      background-color: #ca8a04;
      box-shadow: 0 0 12px rgba(234, 179, 8, 0.4);
    }

    .light-orange {
      background-color: #f97316;
      box-shadow: 0 0 10px rgba(249, 115, 22, 0.5);
    }
    :host-context(.dark) .light-orange {
      background-color: #ea580c;
      box-shadow: 0 0 12px rgba(249, 115, 22, 0.4);
    }

    .light-red {
      background-color: #ef4444;
      box-shadow: 0 0 14px rgba(239, 68, 68, 0.6);
      animation: light-glow-red 2s ease-in-out infinite;
    }
    :host-context(.dark) .light-red {
      background-color: #dc2626;
      box-shadow: 0 0 16px rgba(239, 68, 68, 0.5);
    }

    @keyframes light-glow-red {
      0%, 100% { box-shadow: 0 0 14px rgba(239, 68, 68, 0.6); }
      50% { box-shadow: 0 0 24px rgba(239, 68, 68, 0.9); }
    }

    /* ── Status Badge ── */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.9375rem;
      font-weight: 800;
      line-height: 1.3;
    }

    .badge-icon {
      width: 1.125rem;
      height: 1.125rem;
      flex-shrink: 0;
    }

    .badge-green { color: #065f46; }
    :host-context(.dark) .badge-green { color: #6ee7b7; }

    .badge-yellow { color: #713f12; }
    :host-context(.dark) .badge-yellow { color: #fde047; }

    .badge-orange { color: #9a3412; }
    :host-context(.dark) .badge-orange { color: #fdba74; }

    .badge-red { color: #991b1b; }
    :host-context(.dark) .badge-red { color: #fca5a5; }

    /* ── Subtitle ── */
    .stoplight-subtitle {
      font-size: 0.75rem;
      margin: 0.125rem 0 0;
    }

    .subtitle-green { color: #047857; }
    :host-context(.dark) .subtitle-green { color: #34d399; }

    .subtitle-yellow { color: #854d0e; }
    :host-context(.dark) .subtitle-yellow { color: #facc15; }

    .subtitle-orange { color: #c2410c; }
    :host-context(.dark) .subtitle-orange { color: #fb923c; }

    .subtitle-red { color: #b91c1c; }
    :host-context(.dark) .subtitle-red { color: #f87171; }

    /* ── Title Area ── */
    .stoplight-title-area {
      flex: 1;
    }

    /* ── Violations List ── */
    .violations-list {
      margin-top: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .violation-card {
      border-radius: 0.875rem;
      padding: 0.875rem 1rem;
    }

    .violation-card-red {
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid #fecaca;
    }
    :host-context(.dark) .violation-card-red {
      background: rgba(30, 30, 30, 0.5);
      border-color: rgba(248, 113, 113, 0.2);
    }

    .violation-card-orange {
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid #fed7aa;
    }
    :host-context(.dark) .violation-card-orange {
      background: rgba(30, 30, 30, 0.5);
      border-color: rgba(251, 146, 60, 0.2);
    }

    .violation-card-yellow {
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid #fef08a;
    }
    :host-context(.dark) .violation-card-yellow {
      background: rgba(30, 30, 30, 0.5);
      border-color: rgba(253, 224, 71, 0.2);
    }

    .violation-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .violation-param-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .violation-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .violation-dot-red { background-color: #ef4444; }
    .violation-dot-orange { background-color: #f97316; }
    .violation-dot-yellow { background-color: #eab308; }

    .violation-param-name {
      font-size: 0.8125rem;
      font-weight: 700;
      color: #1e293b;
    }
    :host-context(.dark) .violation-param-name {
      color: #f1f5f9;
    }

    .violation-values {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .violation-current-value {
      font-size: 0.875rem;
      font-weight: 800;
    }

    .value-red { color: #dc2626; }
    :host-context(.dark) .value-red { color: #f87171; }

    .value-orange { color: #ea580c; }
    :host-context(.dark) .value-orange { color: #fb923c; }

    .value-yellow { color: #ca8a04; }
    :host-context(.dark) .value-yellow { color: #facc15; }

    .violation-threshold {
      font-size: 0.6875rem;
      color: #94a3b8;
      background: rgba(148, 163, 184, 0.1);
      padding: 0.125rem 0.5rem;
      border-radius: 999px;
    }
    :host-context(.dark) .violation-threshold {
      color: #64748b;
      background: rgba(148, 163, 184, 0.08);
    }

    /* ── Health Message ── */
    .violation-health {
      display: flex;
      align-items: flex-start;
      gap: 0.375rem;
      margin-top: 0.5rem;
    }

    .violation-health-icon {
      width: 0.875rem;
      height: 0.875rem;
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    .health-icon-red { color: #f87171; }
    :host-context(.dark) .health-icon-red { color: #fb7185; }

    .health-icon-orange { color: #fb923c; }
    :host-context(.dark) .health-icon-orange { color: #fdba74; }

    .health-icon-yellow { color: #facc15; }
    :host-context(.dark) .health-icon-yellow { color: #fde047; }

    .violation-health-text {
      font-size: 0.75rem;
      color: #64748b;
      line-height: 1.4;
    }
    :host-context(.dark) .violation-health-text {
      color: #94a3b8;
    }

    /* ── Responsive ── */
    @media (max-width: 640px) {
      .stoplight-container {
        padding: 1rem;
      }

      .stoplight-light {
        width: 1.25rem;
        height: 1.25rem;
      }

      .stoplight-housing {
        padding: 0.3rem;
        gap: 0.25rem;
      }

      .violation-header {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class StoplightIndicatorComponent {
  private thresholdService = inject(AirQualityThresholdService);

  @Input() reading: AirQualityReading | null = null;

  status = computed<StoplightStatus>(() => {
    const r = this.readingSignal();
    if (!r) return 'green';
    return this.thresholdService.getOverallStatus(r);
  });

  violations = computed<ThresholdViolation[]>(() => {
    const r = this.readingSignal();
    if (!r) return [];
    return this.thresholdService.getViolations(r);
  });

  // Internal signal to make Input reactive with computed
  readingSignal = signal<AirQualityReading | null>(null);

  ngOnChanges(): void {
    this.readingSignal.set(this.reading);
  }
}
