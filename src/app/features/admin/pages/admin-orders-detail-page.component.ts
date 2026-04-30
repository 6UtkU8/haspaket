import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { AdminOrderPatchInput } from '../../../core/operations/operations.types';
import { DemoOperationsFacade } from '../../../core/operations/demo-operations.facade';
import { OperationOrderStatus } from '../../../core/operations/operations.types';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';
import { HpToastService } from '../../../shared/ui/hp-toast.service';

@Component({
  selector: 'hp-admin-orders-detail-page',
  standalone: true,
  imports: [HpPanelCardComponent, FormsModule, DatePipe, RouterLink],
  templateUrl: './admin-orders-detail-page.component.html',
  styleUrl: './admin-orders-detail-page.component.scss',
})
export class AdminOrdersDetailPageComponent {
  readonly ops = inject(DemoOperationsFacade);
  private readonly toast = inject(HpToastService);
  private readonly route = inject(ActivatedRoute);

  readonly orderId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly order = computed(() => this.ops.orders().find((item) => item.id === this.orderId) ?? null);
  readonly selectedCourierId = signal('');
  readonly couriers = this.ops.couriers;

  readonly patchCustomer = signal('');
  readonly patchPhone = signal('');
  readonly patchFrom = signal('');
  readonly patchTo = signal('');
  readonly patchFeeRaw = signal('');
  readonly cancelReason = signal('');

  readonly orderHydrateFingerprint = computed(() => {
    const o = this.order();
    if (!o) {
      return '';
    }
    const headEv = o.timeline[0];
    return [
      o.customer,
      o.customerPhone ?? '',
      o.from,
      o.to,
      o.status,
      o.assignedCourierId ?? '',
      o.deliveryFeeTry ?? '',
      headEv?.atMs ?? '-',
      headEv?.label ?? '-',
    ].join('\x1e');
  });

  readonly canAdminReassign = computed(() => {
    const o = this.order();
    return !!o && o.status !== 'teslim-edildi' && o.status !== 'iptal';
  });

  readonly canAdminCancelOrPatch = computed(() => {
    const o = this.order();
    return !!o && o.status !== 'iptal';
  });

  readonly selectedZoneHints = computed(() => {
    const o = this.order();
    if (!o) {
      return '';
    }
    const hits = this.ops.matchDistrictZonesForRoutes(o.from, o.to);
    if (!hits.length) {
      return 'Mahalle bilgisi rota ile eşleşmedi.';
    }
    return hits.map((z) => z.name).join(', ');
  });

  readonly suggestedCourierLabel = computed(() => {
    const o = this.order();
    if (!o) {
      return '';
    }
    const id = this.ops.suggestCourierIdByDistrictZone(o);
    return id ? this.ops.courierName(id) : '';
  });

  constructor() {
    effect(() => {
      void this.orderHydrateFingerprint();
      const o = this.order();
      if (!o) {
        return;
      }
      this.patchCustomer.set(o.customer);
      this.patchPhone.set(o.customerPhone ?? '');
      this.patchFrom.set(o.from);
      this.patchTo.set(o.to);
      this.patchFeeRaw.set(o.deliveryFeeTry != null ? String(o.deliveryFeeTry) : '');
      this.cancelReason.set('');
    });
  }

  statusClass(status: OperationOrderStatus): string {
    if (status === 'teslim-edildi') {
      return 'hp-aodetail__badge--success';
    }
    if (status === 'iptal') {
      return 'hp-aodetail__badge--danger';
    }
    if (status === 'dagitimda' || status === 'alinacak') {
      return 'hp-aodetail__badge--active';
    }
    return 'hp-aodetail__badge--muted';
  }

  assignCourier(): void {
    const o = this.order();
    const courierId = this.selectedCourierId();
    if (!o || !courierId || !this.canAdminReassign()) {
      return;
    }
    this.ops.adminAssignOrReassignCourier(o.id, courierId);
    this.selectedCourierId.set('');
    const label = this.couriers().find((c) => c.id === courierId)?.name ?? courierId;
    this.toast.show('Atama güncellendi', label, 2200);
  }

  assignHint(): string {
    const o = this.order();
    if (!o) {
      return '';
    }
    if (!this.canAdminReassign()) {
      return 'Tamamlanan veya iptal edilen paketlerde kurye değişikliği yapılmaz.';
    }
    if (o.status === 'dagitimda') {
      return 'Yoldaki işi başka kuryeye aktarır; önceki atama kaldırılır.';
    }
    return 'Hazır / alınacak aşamasındaki siparişe admin ataması yapılabilir.';
  }

  applyPatches(): void {
    const o = this.order();
    if (!o || !this.canAdminCancelOrPatch()) {
      return;
    }
    const feeRaw = this.patchFeeRaw().trim();
    const patch: AdminOrderPatchInput = {
      customer: this.patchCustomer(),
      customerPhone: this.patchPhone(),
      from: this.patchFrom(),
      to: this.patchTo(),
    };
    if (feeRaw === '') {
      patch.deliveryFeeTry = undefined;
    } else {
      const n = Number(feeRaw.replace(',', '.'));
      if (Number.isNaN(n) || n < 0) {
        this.toast.show('Ücret geçersiz', 'Sayı girin.', 2600);
        return;
      }
      patch.deliveryFeeTry = n;
    }
    this.ops.adminPatchOrder(o.id, patch);
    this.toast.show('Kayıt güncellendi', o.id, 2200);
  }

  clearDeliveryFee(): void {
    const o = this.order();
    if (!o || !this.canAdminCancelOrPatch()) {
      return;
    }
    this.patchFeeRaw.set('');
    this.ops.adminPatchOrder(o.id, { deliveryFeeTry: null });
    this.toast.show('Ücret kaldırıldı', o.id, 2000);
  }

  cancelOrder(): void {
    const o = this.order();
    if (!o || o.status === 'iptal') {
      return;
    }
    if (
      !window.confirm(
        `${o.id} iptal edilecek. Görev havuza düşer. Devam?`,
      )
    ) {
      return;
    }
    this.ops.adminCancelOrder(o.id, this.cancelReason().trim() || undefined);
    this.toast.show('İptal edildi', o.id, 2400);
  }

  assignByDistrictZone(): void {
    const o = this.order();
    if (!o) {
      return;
    }
    const ok = this.ops.autoAssignCourierByDistrictZone(o.id);
    if (!ok) {
      this.toast.show('Otomatik atama olmadı', 'Bölge / kurye yok.', 3200);
      return;
    }
    this.toast.show(
      'Bölgeye göre atandı',
      this.suggestedCourierLabel() || 'Tamamlandı',
      2400,
    );
  }
}
