import { Component, computed, inject, signal } from '@angular/core';
import { DemoOperationsFacade } from '../../../core/operations/demo-operations.facade';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';

@Component({
  selector: 'hp-firma-reports-page',
  standalone: true,
  imports: [HpPanelCardComponent],
  templateUrl: './firma-reports-page.component.html',
  styleUrl: './firma-reports-page.component.scss',
})
export class FirmaReportsPageComponent {
  private readonly ops = inject(DemoOperationsFacade);
  readonly period = signal<'gunluk' | 'haftalik' | 'aylik'>('gunluk');

  private readonly delivered = computed(() =>
    this.ops.orders().filter((o) => o.status === 'teslim-edildi'),
  );

  readonly deliveredCount = computed(() => this.delivered().length);
  readonly cancelledCount = computed(
    () => this.ops.orders().filter((o) => o.status === 'iptal').length,
  );

  readonly avgDeliveryMinutes = computed(() => {
    const mins = this.delivered()
      .map((o) => {
        const delivered = o.timeline.find((e) => e.type === 'teslim-edildi');
        const outForDelivery = o.timeline.find((e) => e.type === 'dagitimda');
        if (!delivered || !outForDelivery) {
          return null;
        }
        const diff = Math.round((delivered.atMs - outForDelivery.atMs) / 60_000);
        return diff > 0 ? diff : null;
      })
      .filter((v): v is number => v !== null);

    if (!mins.length) {
      return 0;
    }
    return Math.round(mins.reduce((a, b) => a + b, 0) / mins.length);
  });

  readonly kpis = computed(() => [
    { key: 'total', label: 'Toplam Sipariş', value: this.ops.orders().length.toString() },
    { key: 'delivered', label: 'Teslim Edilen', value: this.deliveredCount().toString() },
    { key: 'cancelled', label: 'İptal Edildi', value: this.cancelledCount().toString() },
    { key: 'avg', label: 'Ortalama Süre', value: `${this.avgDeliveryMinutes()} dk` },
  ]);

  readonly statusBreakdown = computed(() => {
    const all = this.ops.orders();
    return [
      { label: 'Hazırlanıyor', count: all.filter((o) => o.status === 'hazirlaniyor').length },
      { label: 'Kurye Atandı', count: all.filter((o) => o.status === 'alinacak').length },
      { label: 'Yolda', count: all.filter((o) => o.status === 'dagitimda').length },
      { label: 'Teslim Edildi', count: all.filter((o) => o.status === 'teslim-edildi').length },
      { label: 'İptal', count: all.filter((o) => o.status === 'iptal').length },
    ];
  });

  readonly trendBars = computed(() => {
    const map = {
      gunluk: [
        { label: '09', value: 3 },
        { label: '11', value: 5 },
        { label: '13', value: 4 },
        { label: '15', value: 6 },
        { label: '17', value: 5 },
      ],
      haftalik: [
        { label: 'Pzt', value: 18 },
        { label: 'Sal', value: 21 },
        { label: 'Car', value: 17 },
        { label: 'Per', value: 24 },
        { label: 'Cum', value: 22 },
        { label: 'Cmt', value: 27 },
        { label: 'Paz', value: 19 },
      ],
      aylik: [
        { label: '1H', value: 72 },
        { label: '2H', value: 81 },
        { label: '3H', value: 77 },
        { label: '4H', value: 92 },
        { label: '5H', value: 86 },
        { label: '6H', value: 88 },
      ],
    } as const;
    const values = map[this.period()];
    const max = Math.max(...values.map((v) => v.value), 1);
    return values.map((v) => ({ ...v, height: (v.value / max) * 100 }));
  });

  setPeriod(value: 'gunluk' | 'haftalik' | 'aylik'): void {
    this.period.set(value);
  }
}
