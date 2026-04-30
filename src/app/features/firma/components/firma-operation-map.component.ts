import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HpLeafletMapComponent } from '../../../shared/ui/hp-leaflet-map.component';
import type { PanelMapMarker } from '../../../shared/ui/hp-leaflet-map.component';

/** İstanbul çevresi örnek koordinatlar — API ile değiştirilecek */
@Component({
  selector: 'hp-firma-operation-map',
  standalone: true,
  imports: [HpLeafletMapComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<hp-leaflet-map [markers]="markers" ariaLabel="Firma operasyon haritası" />`,
})
export class FirmaOperationMapComponent {
  readonly markers: readonly PanelMapMarker[] = [
    {
      id: 'fc1',
      kind: 'courier',
      lat: 41.042,
      lng: 29.002,
      label: 'Kurye · Ahmet — bölgeniz',
    },
    {
      id: 'fc2',
      kind: 'courier',
      lat: 41.048,
      lng: 29.016,
      label: 'Kurye · Mehmet — yolda',
    },
    {
      id: 'fo1',
      kind: 'order',
      lat: 41.036,
      lng: 29.008,
      label: 'Sipariş HP-4821 — hazırlanıyor',
    },
    {
      id: 'fo2',
      kind: 'order',
      lat: 41.039,
      lng: 29.021,
      label: 'Sipariş HP-4819 — teslimatta',
    },
    {
      id: 'fd1',
      kind: 'dropoff',
      lat: 41.033,
      lng: 28.995,
      label: 'Teslim noktası',
    },
  ];
}
