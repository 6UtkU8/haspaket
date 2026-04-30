import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DemoAuthService } from '../../../core/auth/demo-auth.service';
import { DemoOperationsFacade } from '../../../core/operations/demo-operations.facade';
import type { CourierReceiptPayment, OperationOrder } from '../../../core/operations/operations.types';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

function dayBoundsMs(iso: string): { start: number; end: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) {
    return null;
  }
  const y = Number(match[1]);
  const m = Number(match[2]);
  const da = Number(match[3]);
  const start = new Date(y, m - 1, da, 0, 0, 0, 0).getTime();
  const end = new Date(y, m - 1, da, 23, 59, 59, 999).getTime();
  return { start, end };
}

@Component({
  selector: 'hp-courier-packages-page',
  standalone: true,
  imports: [HpPanelCardComponent, DatePipe, FormsModule],
  templateUrl: './courier-packages-page.component.html',
  styleUrl: './courier-packages-page.component.scss',
})
export class CourierPackagesPageComponent {
  private readonly auth = inject(DemoAuthService);
  readonly ops = inject(DemoOperationsFacade);

  private readonly courierId = computed(() => {
    const sessionCourierId = this.auth.sessionReadonly()?.userId ?? '';
    if (this.ops.couriers().some((courier) => courier.id === sessionCourierId)) {
      return sessionCourierId;
    }
    return this.ops.couriers()[0]?.id ?? 'c-1';
  });

  readonly selectedDay = signal(todayISO());

  readonly paymentOptions: CourierReceiptPayment[] = [
    'Nakit',
    'Kart',
    'Online Ödeme',
    'Ücretsiz',
    'Restorana Havale',
    'Kapıda Yemek Kartı',
    'Online Yemek Kartı',
  ];

  readonly deliveredForDay = computed(() => {
    const bounds = dayBoundsMs(this.selectedDay());
    if (!bounds) {
      return [];
    }
    return this.ops
      .orders()
      .filter(
        (o) =>
          o.assignedCourierId === this.courierId() &&
          o.status === 'teslim-edildi' &&
          o.stageStartedAtMs >= bounds.start &&
          o.stageStartedAtMs <= bounds.end,
      )
      .sort((a, b) => b.stageStartedAtMs - a.stageStartedAtMs);
  });

  readonly editModalOrderId = signal<string | null>(null);
  readonly editPrice = signal('130');
  readonly editPaymentType = signal<CourierReceiptPayment>('Nakit');

  readonly editModalDeliverySummary = computed(() => {
    const id = this.editModalOrderId();
    if (!id) {
      return null;
    }
    const order = this.ops.orders().find((o) => o.id === id);
    if (!order) {
      return null;
    }
    return this.ops.courierDeliveryTimingBreakdown(order);
  });

  setDayFromInput(value: string): void {
    this.selectedDay.set(value);
  }

  formatTry(value: number): string {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  minLabel(m: number | null): string {
    if (m == null) {
      return '—';
    }
    return `${m} dk`;
  }

  openEditModal(orderId: string): void {
    this.editModalOrderId.set(orderId);
    this.editPrice.set(String(this.ops.receiptAmount(orderId)));
    this.editPaymentType.set(this.ops.receiptPaymentLabel(orderId));
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
    this.ops.setCourierReceiptOverride(id, { amount: parsed, payment: this.editPaymentType() });
    this.editModalOrderId.set(null);
  }

  hasDeliveryLegs(ds: {
    totalMin: number | null;
    createdToPickupMin: number | null;
    firmToRoadMin: number | null;
    roadToDeliverMin: number | null;
  }): boolean {
    return (
      ds.totalMin != null ||
      ds.createdToPickupMin != null ||
      ds.firmToRoadMin != null ||
      ds.roadToDeliverMin != null
    );
  }

  timing(order: OperationOrder) {
    return this.ops.courierDeliveryTimingBreakdown(order);
  }

  @HostListener('document:keydown.escape')
  onEscapeClose(): void {
    if (this.editModalOrderId()) {
      this.closeEditModal();
    }
  }
}
