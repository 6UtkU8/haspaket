import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { DemoOperationsFacade } from '../../../core/operations/demo-operations.facade';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';
import { HpToastService } from '../../../shared/ui/hp-toast.service';

@Component({
  selector: 'hp-firma-orders-detail-page',
  standalone: true,
  imports: [HpPanelCardComponent, DatePipe],
  templateUrl: './firma-orders-detail-page.component.html',
  styleUrl: './firma-orders-detail-page.component.scss',
})
export class FirmaOrdersDetailPageComponent {
  readonly ops = inject(DemoOperationsFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(HpToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly orderId = signal(this.route.snapshot.paramMap.get('id') ?? '');

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((p) => {
      this.orderId.set(p.get('id') ?? '');
    });
  }

  readonly order = computed(() =>
    this.ops.orders().find((o) => o.id === this.orderId()) ?? null,
  );

  readonly cancelState = computed(() => {
    const o = this.order();
    return o ? this.ops.firmCancelAllowed(o) : { ok: false as const, reason: 'Sipariş bulunamadı.' };
  });

  requestCancel(): void {
    const order = this.order();
    if (!order) {
      return;
    }
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
}
