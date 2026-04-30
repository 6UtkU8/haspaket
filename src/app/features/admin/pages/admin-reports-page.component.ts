import { Component, computed, inject, signal } from '@angular/core';
import { DemoOperationsFacade } from '../../../core/operations/demo-operations.facade';
import { HpKpiCardComponent } from '../../../shared/ui/hp-kpi-card.component';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';

type ReportRange = 'today' | 'weekly' | 'monthly';

@Component({
  selector: 'hp-admin-reports-page',
  standalone: true,
  imports: [HpKpiCardComponent, HpPanelCardComponent],
  templateUrl: './admin-reports-page.component.html',
  styleUrl: './admin-reports-page.component.scss',
})
export class AdminReportsPageComponent {
  private readonly ops = inject(DemoOperationsFacade);
  readonly range = signal<ReportRange>('today');

  readonly kpis = computed(() => {
    const orders = this.ops.orders();
    const total = orders.length;
    const active = orders.filter((o) => o.status !== 'teslim-edildi' && o.status !== 'iptal').length;
    const delivered = orders.filter((o) => o.status === 'teslim-edildi').length;
    const cancelled = orders.filter((o) => o.status === 'iptal').length;
    const avgMinutes = total > 0 ? Math.round(28 + delivered * 1.5) : 0;
    const activeCouriers = this.ops.couriers().filter((courier) => courier.active).length;
    return [
      { key: 'total', label: 'Toplam Sipariş', value: total, hint: 'Seçili dönem', icon: 'package' as const },
      { key: 'active', label: 'Aktif Sipariş', value: active, hint: 'Operasyonda', icon: 'users' as const },
      { key: 'done', label: 'Teslim Edilen', value: delivered, hint: 'Tamamlanan', icon: 'check' as const },
      { key: 'cancelled', label: 'İptal', value: cancelled, hint: 'Başarısız', icon: 'building' as const },
      { key: 'avg', label: 'Ort. Teslim Süresi (dk)', value: avgMinutes, hint: 'Tahmini', icon: 'package' as const },
      { key: 'couriers', label: 'Aktif Kurye', value: activeCouriers, hint: 'Çevrimiçi', icon: 'users' as const },
    ] as const;
  });

  readonly statusDistribution = computed(() => {
    const statusLabels = [
      { key: 'hazirlaniyor', label: 'Hazırlanıyor' },
      { key: 'alinacak', label: 'Kurye Atandı' },
      { key: 'dagitimda', label: 'Yolda' },
      { key: 'teslim-edildi', label: 'Teslim Edildi' },
      { key: 'iptal', label: 'İptal Edildi' },
    ] as const;
    const orders = this.ops.orders();
    const total = Math.max(orders.length, 1);
    return statusLabels.map((item) => {
      const count = orders.filter((order) => order.status === item.key).length;
      return {
        ...item,
        count,
        ratio: Math.round((count / total) * 100),
      };
    });
  });

  readonly courierPerformance = computed(() => {
    const orders = this.ops.orders();
    return this.ops.couriers().map((courier) => {
      const courierOrders = orders.filter((order) => order.assignedCourierId === courier.id);
      const delivered = courierOrders.filter((order) => order.status === 'teslim-edildi').length;
      return {
        id: courier.id,
        name: courier.name,
        delivered,
        activeOrders: courierOrders.length - delivered,
      };
    });
  });

  readonly companyPerformance = computed(() => {
    const orders = this.ops.orders();
    return this.ops.companies().map((company, index) => {
      const totalOrders = orders.filter((order) => order.customer === company.name).length;
      const deliveredOrders = orders.filter(
        (order) => order.customer === company.name && order.status === 'teslim-edildi',
      ).length;
      return {
        id: company.id,
        name: company.name,
        totalOrders,
        deliveredOrders,
        score: 80 + index * 6,
      };
    });
  });

  readonly recentActivity = computed(() =>
    this.ops
      .orders()
      .flatMap((order) =>
        order.timeline.map((event) => ({
          id: event.id,
          orderId: order.id,
          label: event.label,
          actor: event.actor,
          atMs: event.atMs,
        })),
      )
      .sort((a, b) => b.atMs - a.atMs)
      .slice(0, 6),
  );

  readonly chartBars = computed(() => {
    const presets: Record<ReportRange, number[]> = {
      today: [4, 7, 6, 9, 8, 5],
      weekly: [22, 25, 19, 31, 28, 26, 24],
      monthly: [78, 85, 73, 96, 92, 88, 91, 94],
    };
    const labels: Record<ReportRange, string[]> = {
      today: ['09', '11', '13', '15', '17', '19'],
      weekly: ['Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz'],
      monthly: ['1H', '2H', '3H', '4H', '5H', '6H', '7H', '8H'],
    };
    const values = presets[this.range()];
    const max = Math.max(...values, 1);
    return values.map((value, index) => ({
      label: labels[this.range()][index],
      value,
      height: (value / max) * 100,
    }));
  });

  setRange(value: ReportRange): void {
    this.range.set(value);
  }

  formatTime(value: number): string {
    return new Date(value).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
