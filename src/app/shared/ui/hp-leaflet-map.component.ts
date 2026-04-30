import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  Injector,
  input,
  OnDestroy,
  PLATFORM_ID,
  runInInjectionContext,
  ViewChild,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import * as L from 'leaflet';
import { distinctUntilChanged, skip } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ThemeService, type ThemeMode } from '../../core/theme/theme.service';

export type PanelMapMarkerKind = 'courier' | 'order' | 'dropoff';

export interface PanelMapMarker {
  id: string;
  kind: PanelMapMarkerKind;
  lat: number;
  lng: number;
  label: string;
}

function kindColors(
  kind: PanelMapMarkerKind,
  light: boolean,
): { fill: string; stroke: string } {
  const stroke = light ? 'rgba(15, 23, 42, 0.38)' : 'rgba(0, 0, 0, 0.45)';
  switch (kind) {
    case 'courier':
      return { fill: '#ff6b00', stroke };
    case 'order':
      return { fill: light ? '#0284c7' : '#38bdf8', stroke };
    case 'dropoff':
      return { fill: light ? '#16a34a' : '#4ade80', stroke };
  }
}

const TILE_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

const TILE_OPTS = {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  subdomains: 'abcd' as const,
  maxZoom: 19,
};

@Component({
  selector: 'hp-leaflet-map',
  standalone: true,
  templateUrl: './hp-leaflet-map.component.html',
})
export class HpLeafletMapComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);
  private readonly theme = inject(ThemeService);

  readonly markers = input.required<ReadonlyArray<PanelMapMarker>>();
  readonly showLegend = input(true);
  readonly ariaLabel = input('Harita');

  readonly mapHint = computed(() =>
    this.theme.mode() === 'light'
      ? 'OpenStreetMap (CARTO açık katman). Koordinatlar API ile güncellenecek.'
      : 'OpenStreetMap (CARTO koyu katman). Koordinatlar API ile güncellenecek.',
  );

  @ViewChild('mapEl') private readonly mapEl!: ElementRef<HTMLDivElement>;

  private map?: L.Map;
  private layerGroup?: L.LayerGroup;
  private tileLayer?: L.TileLayer;
  private themeSub?: Subscription;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const el = this.mapEl.nativeElement;
    const center = L.latLng(41.04, 28.99);
    const m = L.map(el, { zoomControl: true }).setView(center, 12);

    const mode = this.theme.mode();
    this.tileLayer = L.tileLayer(
      mode === 'light' ? TILE_LIGHT : TILE_DARK,
      TILE_OPTS,
    ).addTo(m);

    this.map = m;
    this.layerGroup = L.layerGroup().addTo(m);
    this.redraw();

    queueMicrotask(() => m.invalidateSize());
    setTimeout(() => m.invalidateSize(), 280);

    runInInjectionContext(this.injector, () => {
      this.themeSub = toObservable(this.theme.mode)
        .pipe(distinctUntilChanged(), skip(1))
        .subscribe((mod) => {
          this.swapTiles(mod);
          this.redraw();
        });
    });
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();
    this.map?.remove();
    this.map = undefined;
    this.layerGroup = undefined;
    this.tileLayer = undefined;
  }

  @HostListener('window:resize')
  onResize(): void {
    this.map?.invalidateSize();
  }

  private swapTiles(mode: ThemeMode): void {
    if (!this.map || !this.tileLayer) {
      return;
    }
    this.map.removeLayer(this.tileLayer);
    const url = mode === 'light' ? TILE_LIGHT : TILE_DARK;
    this.tileLayer = L.tileLayer(url, TILE_OPTS).addTo(this.map);
  }

  private redraw(): void {
    if (!this.map || !this.layerGroup) {
      return;
    }
    this.layerGroup.clearLayers();
    const list = this.markers();
    const light = this.theme.mode() === 'light';
    for (const mk of list) {
      const { fill, stroke } = kindColors(mk.kind, light);
      const c = L.circleMarker([mk.lat, mk.lng], {
        radius: 8,
        color: stroke,
        weight: 2,
        fillColor: fill,
        fillOpacity: 0.92,
      });
      c.bindTooltip(mk.label, { sticky: true, direction: 'top', opacity: 0.95 });
      c.addTo(this.layerGroup);
    }
    if (list.length > 0) {
      const b = L.latLngBounds(list.map((x) => [x.lat, x.lng]));
      this.map.fitBounds(b, { padding: [32, 32], maxZoom: 14 });
    }
  }
}
