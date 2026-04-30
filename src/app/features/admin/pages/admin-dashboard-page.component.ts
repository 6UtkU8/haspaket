import { Component, computed, inject } from '@angular/core';
import { AdminLiveMapComponent } from '../components/admin-live-map.component';
import { HpKpiCardComponent } from '../../../shared/ui/hp-kpi-card.component';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';
import { DemoOperationsFacade } from '../../../core/operations/demo-operations.facade';
import { DemoAuthService } from '../../../core/auth/demo-auth.service';
import type { OperationTimelineEvent } from '../../../core/operations/operations.types';

@Component({
  selector: 'hp-admin-dashboard-page',
  standalone: true,
  imports: [HpKpiCardComponent, HpPanelCardComponent, AdminLiveMapComponent],
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.scss',
})
export class AdminDashboardPageComponent {
  private readonly ops = inject(DemoOperationsFacade);
  private readonly auth = inject(DemoAuthService);

  readonly isChief = computed(() => this.auth.role() === 'chief');
  private readonly pendingBreakRequestsSignal = computed(
    () => this.ops.pendingCourierBreakRequests().length,
  );

  private readonly kpisSignal = computed(() => {
    const orders = this.ops.orders();
    const couriers = this.ops.couriers();
    const totalOrders = orders.length;
    const failedOrders = orders.filter((o) => o.status === 'iptal').length;
    const deliveredRevenue = orders
      .filter((o) => o.status === 'teslim-edildi')
      .reduce((sum, order) => sum + this.ops.receiptAmount(order.id), 0);
    const activeCouriers = couriers.filter((c) => c.active).length;
    const thirdValue = this.isChief()
      ? this.pendingBreakRequestsSignal()
      : activeCouriers;
    const thirdLabel = this.isChief()
      ? 'Bekleyen kurye talebi'
      : 'Aktif Kurye';
    const thirdHint = this.isChief()
      ? 'Müdahale bekleyen saha istekleri'
      : `${couriers.length} toplam kurye`;

    return [
      {
        key: 'total-orders',
        label: 'Toplam Paket',
        value: totalOrders,
        hint: 'Sistemdeki tüm siparişler',
        icon: 'package' as const,
        isCurrency: false,
      },
      {
        key: 'failed-orders',
        label: 'Teslim Edilemedi',
        value: failedOrders,
        hint: 'İptal veya kapanmayan siparişler',
        icon: 'check' as const,
        isCurrency: false,
      },
      {
        key: 'queue',
        label: thirdLabel,
        value: thirdValue,
        hint: thirdHint,
        icon: 'building' as const,
        isCurrency: false,
      },
      {
        key: 'revenue',
        label: 'Toplam Ciro',
        value: deliveredRevenue,
        hint: 'Teslim edilen siparişlerden hesaplanır',
        icon: 'money' as const,
        isCurrency: true,
      },
    ] as const;
  });

  get kpis() {
    return this.kpisSignal();
  }

  readonly recentActivity = computed(() => {
    type Row = {
      id: string;
      atMs: number;
      kind: string;
      detail: string;
      status: string;
      warn: boolean;
    };
    const rows: Row[] = this.ops.orders().flatMap((order) =>
      order.timeline.map((ev): Row => {
        const { status, warn } = this.activityStatus(ev);
        return {
          id: ev.id,
          atMs: ev.atMs,
          kind: ev.actor === 'Admin' ? 'Sipariş' : 'Kurye',
          detail: `${order.id} · ${ev.label}`,
          status,
          warn,
        };
      }),
    );
    return rows
      .sort((a, b) => b.atMs - a.atMs)
      .slice(0, 10)
      .map((r) => ({
        id: r.id,
        time: new Date(r.atMs).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        kind: r.kind,
        detail: r.detail,
        status: r.status,
        warn: r.warn,
      }));
  });

  private activityStatus(ev: OperationTimelineEvent): { status: string; warn: boolean } {
    switch (ev.type) {
      case 'iptal':
        return { status: 'İptal', warn: true };
      case 'teslim-edildi':
        return { status: 'Tamamlandı', warn: false };
      case 'hazirlaniyor':
        return ev.label.toLocaleLowerCase('tr').includes('havuza')
          ? { status: 'Uyarı', warn: true }
          : { status: 'Kuyrukta', warn: false };
      case 'dagitimda':
        return { status: 'Yolda', warn: false };
      case 'alinacak':
      default:
        return { status: 'Atandı', warn: false };
    }
  }

  private readonly operationPipelineSignal = computed(() => {
    const orders = this.ops.orders();
    const couriers = this.ops.couriers();
    const activeAssignedCourierIds = new Set(
      orders
        .filter(
          (o) =>
            o.assignedCourierId &&
            o.status !== 'teslim-edildi' &&
            o.status !== 'iptal',
        )
        .map((o) => o.assignedCourierId as string),
    );
    const total = couriers.length || 1;
    const available = couriers.filter(
      (c) => c.active && !activeAssignedCourierIds.has(c.id),
    ).length;
    const onTask = couriers.filter((c) =>
      activeAssignedCourierIds.has(c.id),
    ).length;
    const offline = couriers.filter((c) => !c.active).length;
    return [
      {
        label: 'Müsait kurye',
        count: available,
        share: available / total,
        tone: 'neutral' as const,
      },
      {
        label: 'Görevde kurye',
        count: onTask,
        share: onTask / total,
        tone: 'neutral' as const,
      },
      {
        label: 'Çevrimdışı',
        count: offline,
        share: offline / total,
        tone: 'risk' as const,
      },
    ] as const;
  });

  get operationPipeline() {
    return this.operationPipelineSignal();
  }

  readonly applicationsSummary = computed(() => {
    const apps = this.ops.applications();
    return [
      {
        label: 'Bekleyen başvuru',
        value: String(apps.filter((a) => a.status === 'bekliyor').length),
      },
      {
        label: 'Onaylanan',
        value: String(apps.filter((a) => a.status === 'onaylandi').length),
      },
      {
        label: 'Reddedilen',
        value: String(apps.filter((a) => a.status === 'reddedildi').length),
      },
    ] as const;
  });

  readonly chiefRequestsSummary = computed(() => {
    const notifications = this.ops.courierStateNotifications();
    return [
      {
        label: 'Bekleyen mola talebi',
        value: String(this.pendingBreakRequestsSignal()),
      },
      {
        label: 'Mola bildirimleri',
        value: String(
          notifications.filter((item) => item.type === 'request-break').length,
        ),
      },
      {
        label: 'Çevrimdışı talepleri',
        value: String(
          notifications.filter((item) => item.type === 'request-offline')
            .length,
        ),
      },
    ] as const;
  });

  readonly systemHealth = [
    { label: 'API gecikmesi (p95)', value: '42 ms' },
    { label: 'Uptime (30 gün)', value: '%99.98' },
    { label: 'Kuyruk derinliği', value: 'Düşük' },
  ] as const;

  readonly chiefShiftSummary = computed(() => {
    const couriers = this.ops.couriers();
    return [
      {
        label: 'Çevrimiçi kurye',
        value: String(couriers.filter((item) => item.state === 'online').length),
      },
      {
        label: 'Moladaki kurye',
        value: String(couriers.filter((item) => item.state === 'break').length),
      },
      {
        label: 'Çevrimdışı kurye',
        value: String(couriers.filter((item) => item.state === 'offline').length),
      },
    ] as const;
  });

  readonly bottomLeftTitle = computed(() =>
    this.isChief() ? 'Kurye talepleri' : 'Başvurular',
  );
  readonly bottomRightTitle = computed(() =>
    this.isChief() ? 'Vardiya özeti' : 'Sistem',
  );
  readonly bottomLeftStats = computed(() =>
    this.isChief() ? this.chiefRequestsSummary() : this.applicationsSummary(),
  );
  readonly bottomRightStats = computed(() =>
    this.isChief() ? this.chiefShiftSummary() : this.systemHealth,
  );
  readonly bottomSectionLabel = computed(() =>
    this.isChief()
      ? 'Kurye talepleri ve vardiya özeti'
      : 'Başvurular ve sistem',
  );
}
