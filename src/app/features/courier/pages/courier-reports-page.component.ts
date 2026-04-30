import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DemoAuthService } from '../../../core/auth/demo-auth.service';
import { DemoOperationsFacade } from '../../../core/operations/demo-operations.facade';
import type { CourierReceiptPayment, OperationOrder } from '../../../core/operations/operations.types';
import { HpKpiCardComponent } from '../../../shared/ui/hp-kpi-card.component';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';

type ReportPeriod = 'today' | 'weekly' | 'monthly';
type DayReportRow = { date: string; count: number; amount: number; dayMs: number };

function periodBoundsMs(kind: ReportPeriod, anchorMs = Date.now()): { start: number; end: number } {
  switch (kind) {
    case 'today': {
      const start = startOfDayLocalMs(anchorMs);
      const end = endOfDayLocalMs(anchorMs);
      return { start, end };
    }
    case 'weekly': {
      const start = startOfWeekMondayLocalMs(anchorMs);
      const end = endOfWeekSundayLocalMs(anchorMs);
      return { start, end };
    }
    case 'monthly': {
      const start = startOfMonthLocalMs(anchorMs);
      const end = endOfMonthLocalMs(anchorMs);
      return { start, end };
    }
  }
}

function startOfDayLocalMs(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfDayLocalMs(t: number): number {
  const d = new Date(t);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/** Pazartesi 00:00 (yerel) */
function startOfWeekMondayLocalMs(t: number): number {
  const d = new Date(t);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + mondayOffset);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfWeekSundayLocalMs(t: number): number {
  const mon = startOfWeekMondayLocalMs(t);
  const d = new Date(mon);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function startOfMonthLocalMs(t: number): number {
  const d = new Date(t);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfMonthLocalMs(t: number): number {
  const d = new Date(t);
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

@Component({
  selector: 'hp-courier-reports-page',
  standalone: true,
  imports: [HpPanelCardComponent, HpKpiCardComponent, DatePipe, FormsModule],
  templateUrl: './courier-reports-page.component.html',
  styleUrl: './courier-reports-page.component.scss',
})
export class CourierReportsPageComponent {
  private readonly auth = inject(DemoAuthService);
  readonly ops = inject(DemoOperationsFacade);
  private readonly courierId = computed(() => {
    const sessionCourierId = this.auth.sessionReadonly()?.userId ?? '';
    if (this.ops.couriers().some((courier) => courier.id === sessionCourierId)) {
      return sessionCourierId;
    }
    return this.ops.couriers()[0]?.id ?? 'c-1';
  });

  readonly period = signal<ReportPeriod>('today');
  readonly periods: { key: ReportPeriod; label: string }[] = [
    { key: 'today', label: 'Bugün' },
    { key: 'weekly', label: 'Haftalık' },
    { key: 'monthly', label: 'Aylık' },
  ];

  readonly myOrders = computed(() => this.ops.orders().filter((order) => order.assignedCourierId === this.courierId()));

  readonly completedOrders = computed(() =>
    this.myOrders()
      .filter((order) => order.status === 'teslim-edildi')
      .sort((a, b) => b.stageStartedAtMs - a.stageStartedAtMs),
  );

  readonly completedOrdersInPeriod = computed(() => {
    const { start, end } = periodBoundsMs(this.period());
    return this.completedOrders().filter(
      (order) => order.stageStartedAtMs >= start && order.stageStartedAtMs <= end,
    );
  });
  readonly completedCount = computed(() => this.completedOrdersInPeriod().length);
  readonly totalEarned = computed(() =>
    this.completedOrdersInPeriod().reduce((acc, order) => acc + this.ops.receiptAmount(order.id), 0),
  );
  readonly totalActiveMinutes = computed(() =>
    this.completedOrdersInPeriod().reduce(
      (sum, order) => sum + Math.max(5, Math.round((order.stageStartedAtMs - order.createdAtMs) / 60_000)),
      0,
    ),
  );
  readonly averagePackageAmount = computed(() => {
    const list = this.completedOrdersInPeriod();
    const n = list.length;
    if (!n) {
      return 0;
    }
    const sum = list.reduce((acc, order) => acc + this.ops.receiptAmount(order.id), 0);
    return Math.round(sum / n);
  });
  readonly deliveredList = computed(() =>
    this.myOrders()
      .filter((order) => order.status === 'teslim-edildi')
      .sort((a, b) => b.stageStartedAtMs - a.stageStartedAtMs)
      .slice(0, 10),
  );

  readonly editModalOrderId = signal<string | null>(null);
  readonly editPrice = signal('130');
  readonly editPaymentType = signal<CourierReceiptPayment>('Nakit');

  readonly paymentOptions: CourierReceiptPayment[] = [
    'Nakit',
    'Kart',
    'Online Ödeme',
    'Ücretsiz',
    'Restorana Havale',
    'Kapıda Yemek Kartı',
    'Online Yemek Kartı',
  ];
  readonly selectedDayDetail = signal<DayReportRow | null>(null);

  readonly rangeDraftStart = signal('');
  readonly rangeDraftEnd = signal('');
  readonly appliedRangeStartMs = signal<number | null>(null);
  readonly appliedRangeEndMs = signal<number | null>(null);

  readonly dayRows = computed<DayReportRow[]>(() => {
    const orders = this.completedOrders();
    const byDay = new Map<number, typeof orders>();
    for (const o of orders) {
      const d = new Date(o.stageStartedAtMs);
      d.setHours(0, 0, 0, 0);
      const k = d.getTime();
      let bucket = byDay.get(k);
      if (!bucket) {
        bucket = [];
        byDay.set(k, bucket);
      }
      bucket.push(o);
    }
    const fmt = new Intl.DateTimeFormat('tr-TR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return [...byDay.entries()]
      .map(([dayMs, list]) => ({
        dayMs,
        date: fmt.format(new Date(dayMs)),
        count: list.length,
        amount: list.reduce((sum, ord) => sum + this.ops.receiptAmount(ord.id), 0),
      }))
      .sort((a, b) => b.dayMs - a.dayMs);
  });

  readonly rangeSummary = computed(() => {
    const startMs = this.appliedRangeStartMs();
    const endDayMs = this.appliedRangeEndMs();
    if (startMs == null || endDayMs == null) {
      return null;
    }
    const endCal = new Date(endDayMs);
    endCal.setHours(23, 59, 59, 999);
    const endInclusiveMs = endCal.getTime();

    const inRangeOrders = this.completedOrders().filter(
      (o) => o.stageStartedAtMs >= startMs && o.stageStartedAtMs <= endInclusiveMs,
    );
    let nakit = 0;
    let kart = 0;
    for (const o of inRangeOrders) {
      const a = this.ops.receiptAmount(o.id);
      if (this.ops.receiptPaymentBucket(o) === 'nakit') {
        nakit += a;
      } else {
        kart += a;
      }
    }
    const totalEarned = inRangeOrders.reduce((acc, o) => acc + this.ops.receiptAmount(o.id), 0);
    return {
      totalPackages: inRangeOrders.length,
      totalEarned,
      nakit,
      kart,
      labelStart: this.formatRangeDayLabel(startMs),
      labelEnd: this.formatRangeDayLabel(endDayMs),
    };
  });

  setPeriod(period: ReportPeriod): void {
    this.period.set(period);
  }

  applyRange(): void {
    const a = this.rangeDraftStart().trim();
    const b = this.rangeDraftEnd().trim();
    if (!a || !b) {
      return;
    }
    const ds = new Date(`${a}T00:00:00`);
    const de = new Date(`${b}T00:00:00`);
    if (Number.isNaN(ds.getTime()) || Number.isNaN(de.getTime()) || de < ds) {
      return;
    }
    this.appliedRangeStartMs.set(ds.getTime());
    this.appliedRangeEndMs.set(de.getTime());
  }

  clearRange(): void {
    this.rangeDraftStart.set('');
    this.rangeDraftEnd.set('');
    this.appliedRangeStartMs.set(null);
    this.appliedRangeEndMs.set(null);
  }

  private formatRangeDayLabel(dayMs: number): string {
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dayMs));
  }

  paymentLabel(orderId: string): CourierReceiptPayment {
    return this.ops.receiptPaymentLabel(orderId);
  }

  amount(orderId: string): number {
    return this.ops.receiptAmount(orderId);
  }

  readonly editModalDeliverySummary = computed(() => {
    const id = this.editModalOrderId();
    if (!id) {
      return null;
    }
    const order = this.myOrders().find((o) => o.id === id);
    if (!order) {
      return null;
    }
    const b = this.ops.courierDeliveryTimingBreakdown(order);
    return {
      totalMin: b.totalMin,
      firmToRoadMin: b.firmToRoadMin,
      roadToDeliverMin: b.roadToDeliverMin,
    };
  });

  openEditModal(orderId: string): void {
    this.editModalOrderId.set(orderId);
    this.editPrice.set(String(this.amount(orderId)));
    this.editPaymentType.set(this.paymentLabel(orderId));
  }

  hasDeliveryLegs(ds: { totalMin: number | null; firmToRoadMin: number | null; roadToDeliverMin: number | null }): boolean {
    return ds.totalMin != null || ds.firmToRoadMin != null || ds.roadToDeliverMin != null;
  }

  closeEditModal(): void {
    this.editModalOrderId.set(null);
  }

  onEditPriceInput(value: string | number): void {
    this.editPrice.set(String(value));
  }

  saveEditModal(): void {
    const id = this.editModalOrderId();
    if (!id) {
      return;
    }
    const parsed = Number(String(this.editPrice()).trim().replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed < 0) {
      return;
    }
    const payment = this.editPaymentType();
    this.ops.setCourierReceiptOverride(id, { amount: parsed, payment });
    this.editModalOrderId.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscapeClose(): void {
    if (this.editModalOrderId()) {
      this.closeEditModal();
      return;
    }
    if (this.selectedDayDetail()) {
      this.closeDayDetail();
    }
  }

  openDayDetail(item: DayReportRow): void {
    this.selectedDayDetail.set(item);
  }

  closeDayDetail(): void {
    this.selectedDayDetail.set(null);
  }

  dayDetailDeliveredList = computed(() => {
    const detail = this.selectedDayDetail();
    if (!detail) {
      return [];
    }
    return this.completedOrders().filter((o) => {
      const d = new Date(o.stageStartedAtMs);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === detail.dayMs;
    });
  });

  readonly selectedDayPaymentSummary = computed(() => {
    const detail = this.selectedDayDetail();
    if (!detail) {
      return null;
    }
    const orders = this.dayDetailDeliveredList();
    let nakit = 0;
    let kart = 0;
    let diger = 0;
    for (const o of orders) {
      const line = this.ops.receiptAmount(o.id);
      switch (this.ops.receiptPaymentBucket(o)) {
        case 'nakit':
          nakit += line;
          break;
        case 'kart':
          kart += line;
          break;
        default:
          diger += line;
          break;
      }
    }
    return {
      dateTitle: this.formatRangeDayLabel(detail.dayMs),
      packageCount: orders.length,
      nakit,
      kart,
      diger,
      total: nakit + kart + diger,
    };
  });

  formatTry(value: number): string {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  paymentCategoryLabel(order: OperationOrder): string {
    return this.ops.paymentDisplayLabel(order);
  }
}
