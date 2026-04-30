import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DemoOperationsFacade } from '../../../core/operations/demo-operations.facade';
import type { AdminOrderPatchInput, OperationCourier } from '../../../core/operations/operations.types';
import { OperationOrderStatus } from '../../../core/operations/operations.types';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';
import { HpToastService } from '../../../shared/ui/hp-toast.service';

@Component({
  selector: 'hp-admin-orders-page',
  standalone: true,
  imports: [HpPanelCardComponent, FormsModule, DatePipe, RouterLink],
  templateUrl: './admin-orders-page.component.html',
  styleUrl: './admin-orders-page.component.scss',
})
export class AdminOrdersPageComponent {
  readonly ops = inject(DemoOperationsFacade);
  private readonly toast = inject(HpToastService);

  readonly orders = this.ops.orders;
  readonly couriers = this.ops.couriers;
  readonly districtZones = this.ops.districtZones;
  readonly selectedOrder = this.ops.selectedOrder;
  readonly selectedCourierId = signal('');

  readonly patchCustomer = signal('');
  readonly patchPhone = signal('');
  readonly patchFrom = signal('');
  readonly patchTo = signal('');
  readonly patchFeeRaw = signal('');

  readonly cancelReason = signal('');
  readonly newZoneName = signal('');
  readonly newZoneNeighbors = signal('');
  readonly zoneNeighborDraft = signal<Record<string, string>>({});

  readonly timeline = computed(() => this.selectedOrder()?.timeline ?? []);
  readonly selectedCourierName = computed(() =>
    this.selectedOrder()
      ? this.ops.courierName(this.selectedOrder()!.assignedCourierId)
      : 'Atanmadı',
  );

  readonly orderHydrateFingerprint = computed(() => {
    const order = this.selectedOrder();
    if (!order) {
      return '';
    }
    const headEv = order.timeline[0];
    return [
      order.id,
      order.customer,
      order.customerPhone ?? '',
      order.from,
      order.to,
      order.status,
      order.assignedCourierId ?? '',
      order.deliveryFeeTry ?? '',
      headEv?.atMs ?? '-',
      headEv?.label ?? '-',
    ].join('\x1e');
  });

  readonly canAdminReassign = computed(() => {
    const order = this.selectedOrder();
    return !!order && order.status !== 'teslim-edildi' && order.status !== 'iptal';
  });

  readonly canAdminCancelOrPatch = computed(() => {
    const order = this.selectedOrder();
    return !!order && order.status !== 'iptal';
  });

  readonly selectedZoneHints = computed(() => {
    const order = this.selectedOrder();
    if (!order) {
      return '';
    }
    const hits = this.ops.matchDistrictZonesForRoutes(order.from, order.to);
    if (!hits.length) {
      return 'Mahalle bilgisi rota ile eşleşmedi — listeyi veya haritayı kontrol edin.';
    }
    return `Eşleşen bölgeler: ${hits.map((z) => z.name).join(', ')}`;
  });

  readonly suggestedCourierLabel = computed(() => {
    const order = this.selectedOrder();
    if (!order) {
      return '';
    }
    const id = this.ops.suggestCourierIdByDistrictZone(order);
    if (!id) {
      return '';
    }
    return this.ops.courierName(id);
  });

  constructor() {
    effect(() => {
      void this.orderHydrateFingerprint();
      const order = this.selectedOrder();
      if (!order) {
        return;
      }
      this.patchCustomer.set(order.customer);
      this.patchPhone.set(order.customerPhone ?? '');
      this.patchFrom.set(order.from);
      this.patchTo.set(order.to);
      this.patchFeeRaw.set(order.deliveryFeeTry != null ? String(order.deliveryFeeTry) : '');
      this.cancelReason.set('');
    });
  }

  selectOrder(orderId: string): void {
    this.ops.setSelectedOrder(orderId);
    this.selectedCourierId.set('');
  }

  assignSelected(): void {
    const order = this.selectedOrder();
    const courierId = this.selectedCourierId();
    if (!order || !courierId || !this.canAdminReassign()) {
      return;
    }
    this.ops.adminAssignOrReassignCourier(order.id, courierId);
    this.selectedCourierId.set('');
    const label = this.couriers().find((c) => c.id === courierId)?.name ?? courierId;
    this.toast.show('Atama güncellendi', label, 2200);
  }

  applyPatches(): void {
    const order = this.selectedOrder();
    if (!order || !this.canAdminCancelOrPatch()) {
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
        this.toast.show('Ücret geçersiz', 'Sayı olarak girin ya da ücreti silin.', 2600);
        return;
      }
      patch.deliveryFeeTry = n;
    }
    this.ops.adminPatchOrder(order.id, patch);
    this.toast.show('Kayıt güncellendi', order.id, 2200);
  }

  clearDeliveryFee(): void {
    const order = this.selectedOrder();
    if (!order || !this.canAdminCancelOrPatch()) {
      return;
    }
    this.patchFeeRaw.set('');
    this.ops.adminPatchOrder(order.id, { deliveryFeeTry: null });
    this.toast.show('Ücret kaldırıldı', order.id, 2000);
  }

  cancelOrder(): void {
    const order = this.selectedOrder();
    if (!order || order.status === 'iptal') {
      return;
    }
    const ok = window.confirm(
      `${order.id} siparişini iptal etmek üzeresiniz. Havuz ve kurye ataması kaldırılır. Devam?`,
    );
    if (!ok) {
      return;
    }
    this.ops.adminCancelOrder(order.id, this.cancelReason().trim() || undefined);
    this.toast.show('İptal edildi', order.id, 2400);
  }

  assignByDistrictZone(): void {
    const order = this.selectedOrder();
    if (!order) {
      return;
    }
    const ok = this.ops.autoAssignCourierByDistrictZone(order.id);
    if (!ok) {
      this.toast.show(
        'Otomatik atama yapılamadı',
        'Uygun bölge / çevrimiçi kurye yok. Manuel seçin.',
        3200,
      );
      return;
    }
    const name = this.suggestedCourierLabel();
    this.toast.show(
      'Bölgeye göre atandı',
      name || 'Kurye güncellendi',
      2400,
    );
  }

  addDistrictZoneSubmit(): void {
    const zone = this.ops.addDistrictZone(this.newZoneName(), this.newZoneNeighbors());
    if (!zone) {
      this.toast.show('Bölge eklenemedi', 'Başlık ve en az bir mahalle gerekiyor.', 2800);
      return;
    }
    this.newZoneName.set('');
    this.newZoneNeighbors.set('');
    this.toast.show('Bölge eklendi', zone.name, 2200);
  }

  appendNeighborhood(zoneId: string): void {
    const text = this.zoneNeighborDraft()[zoneId]?.trim() ?? '';
    if (!text) {
      return;
    }
    this.ops.appendNeighborhoodToDistrictZone(zoneId, text);
    this.zoneNeighborDraft.update((draft) => {
      const copy = { ...draft };
      copy[zoneId] = '';
      return copy;
    });
    this.toast.show('Mahalle eklendi', text, 1800);
  }

  onZoneDraftInput(zoneId: string, value: string): void {
    this.zoneNeighborDraft.update((d) => ({ ...d, [zoneId]: value }));
  }

  zoneDraft(zoneId: string): string {
    return this.zoneNeighborDraft()[zoneId] ?? '';
  }

  courierHasZone(c: OperationCourier, zoneId: string): boolean {
    return !!(c.zoneIds?.includes(zoneId));
  }

  toggleCourierZone(courier: OperationCourier, zoneId: string, checked: boolean): void {
    this.ops.toggleCourierDistrictZone(courier.id, zoneId, checked);
  }

  assignHint(): string {
    const order = this.selectedOrder();
    if (!order) {
      return 'Atama için sipariş seçin.';
    }
    if (!this.canAdminReassign()) {
      return 'Tamamlanan veya iptal edilen paketlerde kurye değişikliği yapılmaz.';
    }
    if (order.status === 'dagitimda') {
      return 'Yoldaki iş başka kuryeye devredilir; öncekinin üzerinden çekilir.';
    }
    return 'Hazırlanıyor veya Alınacak aşamasındaki siparişe doğrudan atama yapılabilir.';
  }

  statusClass(status: OperationOrderStatus): string {
    if (status === 'teslim-edildi') {
      return 'hp-aorders__pill--success';
    }
    if (status === 'iptal') {
      return 'hp-aorders__pill--danger';
    }
    if (status === 'dagitimda' || status === 'alinacak') {
      return 'hp-aorders__pill--active';
    }
    return 'hp-aorders__pill--muted';
  }
}
