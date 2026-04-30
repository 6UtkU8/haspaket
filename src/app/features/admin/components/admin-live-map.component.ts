import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { HpLeafletMapComponent } from '../../../shared/ui/hp-leaflet-map.component';
import type { PanelMapMarker } from '../../../shared/ui/hp-leaflet-map.component';
import { DemoOperationsFacade } from '../../../core/operations/demo-operations.facade';

@Component({
  selector: 'hp-admin-live-map',
  standalone: true,
  imports: [HpLeafletMapComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<hp-leaflet-map [markers]="markers()" ariaLabel="Canlı harita" />`,
})
export class AdminLiveMapComponent {
  private readonly ops = inject(DemoOperationsFacade);

  readonly markers = computed((): PanelMapMarker[] => {
    const baseLat = 41.035;
    const baseLng = 28.998;
    const jitter = (seed: string, slot: number): { lat: number; lng: number } => {
      const h = [...seed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      return {
        lat: baseLat + ((h + slot * 17) % 140) / 2000,
        lng: baseLng + ((h + slot * 29) % 160) / 2000,
      };
    };

    const out: PanelMapMarker[] = [];

    for (const c of this.ops.couriers()) {
      const pos = jitter(c.id, 0);
      const state = c.state ?? (c.active ? 'online' : 'offline');
      const stateLabel =
        state === 'online' ? 'Çevrimiçi' : state === 'break' ? 'Mola' : c.active ? 'Hazır' : 'Kapalı';
      out.push({
        id: `cr-${c.id}`,
        kind: 'courier',
        lat: pos.lat,
        lng: pos.lng,
        label: `Kurye · ${c.name} — ${stateLabel}`,
      });
    }

    for (const order of this.ops.orders()) {
      if (order.status === 'teslim-edildi' || order.status === 'iptal') {
        continue;
      }
      const pos = jitter(this.ops.mapJitterSeedForOrder(order), 3);
      const fromShort = order.from.length > 28 ? `${order.from.slice(0, 28)}…` : order.from;
      out.push({
        id: `ord-${order.id}`,
        kind: 'order',
        lat: pos.lat,
        lng: pos.lng,
        label: `${order.id} · ${this.ops.statusLabel(order.status)} · ${fromShort}`,
      });
    }

    return out.slice(0, 40);
  });
}
