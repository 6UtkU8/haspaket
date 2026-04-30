import { Component, computed, inject } from '@angular/core';
import { FirmaLiveTrackingMapComponent } from '../components/firma-live-tracking-map.component';
import { HpKpiCardComponent } from '../../../shared/ui/hp-kpi-card.component';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';
import { DemoOperationsFacade } from '../../../core/operations/demo-operations.facade';

@Component({
  selector: 'hp-firma-dashboard-page',
  standalone: true,
  imports: [HpKpiCardComponent, HpPanelCardComponent, FirmaLiveTrackingMapComponent],
  templateUrl: './firma-dashboard-page.component.html',
  styleUrl: './firma-dashboard-page.component.scss',
})
export class FirmaDashboardPageComponent {
  private readonly ops = inject(DemoOperationsFacade);

  private readonly kpisSignal = computed(() => {
    const orders = this.ops.orders();
    const couriers = this.ops.couriers();
    const activeAssignedCourierIds = new Set(
      orders
        .filter(
          (o) => o.assignedCourierId && o.status !== 'teslim-edildi' && o.status !== 'iptal',
        )
        .map((o) => o.assignedCourierId as string),
    );
    const activeOrders = orders.filter((o) => o.status !== 'teslim-edildi' && o.status !== 'iptal').length;
    const delivered = orders.filter((o) => o.status === 'teslim-edildi').length;
    const cancelled = orders.filter((o) => o.status === 'iptal').length;
    const totalOrders = orders.length;
    const activeCouriers = couriers.filter((c) => activeAssignedCourierIds.has(c.id)).length;
    const assignedOrders = orders.filter((o) => !!o.assignedCourierId).length;
    return [
      {
        key: 'total',
        label: 'Toplam Sipariş',
        value: totalOrders,
        hint: 'Tüm siparişler',
        icon: 'package' as const,
        isCurrency: false,
      },
      {
        key: 'active',
        label: 'Aktif Sipariş',
        value: activeOrders,
        hint: 'Canlı operasyon',
        icon: 'check' as const,
        isCurrency: false,
      },
      {
        key: 'delivered',
        label: 'Teslim Edilen',
        value: delivered,
        hint: 'Tamamlanan',
        icon: 'check' as const,
        isCurrency: false,
      },
      {
        key: 'cancelled',
        label: 'İptal Edilen',
        value: cancelled,
        hint: `${activeCouriers} aktif kurye / ${assignedOrders} atama`,
        icon: 'user' as const,
        isCurrency: false,
      },
    ] as const;
  });

  get kpis() {
    return this.kpisSignal();
  }

  private readonly recentOrdersSignal = computed(() =>
    [...this.ops.orders()]
      .sort((a, b) => b.stageStartedAtMs - a.stageStartedAtMs)
      .slice(0, 6)
      .map((o) => ({
        id: o.id,
        customer: o.customer,
        status: this.ops.statusLabel(o.status),
        time: new Date(o.stageStartedAtMs).toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      })),
  );

  get recentOrders() {
    return this.recentOrdersSignal();
  }

  private readonly operationPipelineSignal = computed(() => {
    const orders = this.ops.orders();
    const total = orders.length || 1;
    const yolda = orders.filter((o) => o.status === 'dagitimda').length;
    const teslim = orders.filter((o) => o.status === 'teslim-edildi').length;
    const planli = orders.filter((o) => o.status === 'hazirlaniyor' || o.status === 'alinacak').length;
    return [
      { label: 'Yolda', count: yolda, share: yolda / total },
      { label: 'Teslim edildi', count: teslim, share: teslim / total },
      { label: 'Planlandı', count: planli, share: planli / total },
    ] as const;
  });

  get operationPipeline() {
    return this.operationPipelineSignal();
  }

  /** Günlük sipariş (son 7 gün) — mock */
  readonly dailyOrders = [
    { day: 'Pzt', n: 38 },
    { day: 'Sal', n: 42 },
    { day: 'Çar', n: 35 },
    { day: 'Per', n: 51 },
    { day: 'Cum', n: 47 },
    { day: 'Cmt', n: 62 },
    { day: 'Paz', n: 44 },
  ] as const;

  private readonly courierPerfSignal = computed(() => {
    const activeAssignedCourierIds = new Set(
      this.ops
        .orders()
        .filter(
          (o) => o.assignedCourierId && o.status !== 'teslim-edildi' && o.status !== 'iptal',
        )
        .map((o) => o.assignedCourierId as string),
    );
    return this.ops.couriers().slice(0, 4).map((c) => ({
      name: c.name,
      score: c.active ? (activeAssignedCourierIds.has(c.id) ? 95 : 88) : 70,
    }));
  });

  get courierPerf() {
    return this.courierPerfSignal();
  }

  readonly maxDaily = Math.max(...this.dailyOrders.map((d) => d.n), 1);
  readonly maxCourierScore = 100;
}
