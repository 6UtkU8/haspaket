import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { HpLeafletMapComponent } from '../../../shared/ui/hp-leaflet-map.component';
import type { PanelMapMarker } from '../../../shared/ui/hp-leaflet-map.component';
import { DemoOperationsFacade } from '../../../core/operations/demo-operations.facade';

/** Admin canlı harita ile aynı jitter — demo konumlar */
function istanbulJitter(seed: string, slot: number): { lat: number; lng: number } {
  const baseLat = 41.035;
  const baseLng = 28.998;
  const h = [...seed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return {
    lat: baseLat + ((h + slot * 17) % 140) / 2000,
    lng: baseLng + ((h + slot * 29) % 160) / 2000,
  };
}

@Component({
  selector: 'hp-firma-live-tracking-map',
  standalone: true,
  imports: [HpLeafletMapComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hp-flivemap">
      <hp-leaflet-map [markers]="markers()" ariaLabel="Yoldaki siparişler canlı harita" />
      <p class="hp-flivemap__hint">
        Kurye paketi yola çıkardığında (<strong>dağıtımda</strong>) konum burada güncellenir; demo konumlar rota
        metnine göre üretilir.
      </p>
    </div>
  `,
  styles: `
    .hp-flivemap {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }
    .hp-flivemap__hint {
      margin: 0;
      font-size: var(--hp-panel-caption);
      color: var(--hp-color-text-muted);
    }
  `,
})
export class FirmaLiveTrackingMapComponent {
  private readonly ops = inject(DemoOperationsFacade);

  readonly markers = computed((): PanelMapMarker[] => {
    const out: PanelMapMarker[] = [];
    const active = this.ops
      .orders()
      .filter((o) => o.status === 'dagitimda' && o.assignedCourierId)
      .slice(0, 12);

    for (const order of active) {
      const cid = order.assignedCourierId as string;
      const courier = this.ops.couriers().find((c) => c.id === cid);
      const cname = courier?.name ?? this.ops.courierName(cid);
      const seed = this.ops.mapJitterSeedForOrder(order);
      const posOrder = istanbulJitter(seed, 3);
      const posCourier = istanbulJitter(cid, 11);
      out.push({
        id: `fo-${order.id}`,
        kind: 'order',
        lat: posOrder.lat,
        lng: posOrder.lng,
        label: `${order.id} · yolda → ${order.to}`,
      });
      out.push({
        id: `fc-${order.id}-${cid}`,
        kind: 'courier',
        lat: posCourier.lat + 0.004,
        lng: posCourier.lng + 0.003,
        label: `Kurye · ${cname} · ${order.id}`,
      });
    }

    return out;
  });
}
