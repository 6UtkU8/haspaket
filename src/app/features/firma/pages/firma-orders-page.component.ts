import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DemoOperationsFacade } from '../../../core/operations/demo-operations.facade';
import type { OperationOrder } from '../../../core/operations/operations.types';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';
import { HpToastService } from '../../../shared/ui/hp-toast.service';

type FirmaFilter = 'all' | 'yeni' | 'hazirlaniyor' | 'alinacak' | 'dagitimda' | 'teslim-edildi' | 'iptal';

@Component({
  selector: 'hp-firma-orders-page',
  standalone: true,
  imports: [HpPanelCardComponent, FormsModule, DatePipe, RouterLink],
  templateUrl: './firma-orders-page.component.html',
  styleUrl: './firma-orders-page.component.scss',
})
export class FirmaOrdersPageComponent {
  readonly ops = inject(DemoOperationsFacade);
  private readonly toast = inject(HpToastService);

  readonly q = signal('');
  readonly status = signal<FirmaFilter>('all');
  readonly selectedId = signal<string | null>(null);

  readonly orders = computed(() => this.ops.orders());

  readonly filtered = computed(() => {
    const rawQ = this.q().trim().toLocaleLowerCase('tr');
    const status = this.status();
    const base = this.orders().filter((o) => {
      if (status === 'all') {
        return true;
      }
      if (status === 'yeni') {
        return this.badgeKey(o) === 'yeni';
      }
      return o.status === status;
    });
    if (!rawQ) {
      return base;
    }
    return base.filter((o) => {
      const hay = `${o.id} ${o.customer} ${o.from} ${o.to} ${this.ops.courierName(o.assignedCourierId)}`.toLocaleLowerCase('tr');
      return hay.includes(rawQ);
    });
  });

  readonly summary = computed(() => {
    const all = this.orders();
    const count = (k: FirmaFilter) =>
      k === 'all' ? all.length : all.filter((o) => (k === 'yeni' ? this.badgeKey(o) === 'yeni' : o.status === k)).length;
    return [
      { key: 'all' as const, label: 'Toplam', value: count('all') },
      { key: 'yeni' as const, label: 'Yeni', value: count('yeni') },
      { key: 'dagitimda' as const, label: 'Yolda', value: count('dagitimda') },
      { key: 'teslim-edildi' as const, label: 'Teslim', value: count('teslim-edildi') },
    ];
  });

  readonly selectedOrder = computed(() => {
    const id = this.selectedId();
    if (!id) {
      return this.filtered()[0] ?? null;
    }
    return this.filtered().find((o) => o.id === id) ?? this.filtered()[0] ?? null;
  });

  readonly hasResult = computed(() => this.filtered().length > 0);

  setSelected(orderId: string): void {
    this.selectedId.set(orderId);
  }

  badgeKey(order: OperationOrder): FirmaFilter {
    if (order.status === 'hazirlaniyor' && !order.assignedCourierId) {
      return 'yeni';
    }
    return order.status;
  }

  badgeLabel(order: OperationOrder): string {
    const key = this.badgeKey(order);
    switch (key) {
      case 'yeni':
        return 'Yeni';
      case 'hazirlaniyor':
        return 'Hazırlanıyor';
      case 'alinacak':
        return 'Kurye Atandı';
      case 'dagitimda':
        return 'Yolda';
      case 'teslim-edildi':
        return 'Teslim Edildi';
      case 'iptal':
        return 'İptal';
      default:
        return 'Yeni';
    }
  }

  timelineStatusLabel(order: OperationOrder['timeline'][number]): string {
    return this.ops.statusLabel(order.type);
  }

  readonly firmCancelState = computed(() => {
    const o = this.selectedOrder();
    return o ? this.ops.firmCancelAllowed(o) : { ok: false as const, reason: 'Sipariş seçilmedi.' };
  });

  requestCancelSelected(): void {
    const o = this.selectedOrder();
    if (o) {
      this.requestCancelFor(o);
    }
  }

  requestCancelFor(order: OperationOrder): void {
    const pre = this.ops.firmCancelAllowed(order);
    if (!pre.ok) {
      this.toast.show('İptal edilemedi', pre.reason ?? '', 3600);
      return;
    }
    if (!confirm(`${order.id} siparişini iptal etmek istediğinize emin misiniz?`)) {
      return;
    }
    const res = this.ops.firmCancelOrderByFirm(order.id);
    if (res.ok) {
      this.toast.show('Sipariş iptal edildi', order.id, 2400);
    } else {
      this.toast.show('İptal edilemedi', res.reason ?? '', 3600);
    }
  }

  badgeClass(order: OperationOrder): string {
    const key = this.badgeKey(order);
    if (key === 'teslim-edildi') {
      return 'hp-forders__badge--success';
    }
    if (key === 'dagitimda' || key === 'alinacak') {
      return 'hp-forders__badge--active';
    }
    if (key === 'iptal') {
      return 'hp-forders__badge--danger';
    }
    return 'hp-forders__badge--muted';
  }
}
