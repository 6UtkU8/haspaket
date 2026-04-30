import { Injectable, inject, signal } from '@angular/core';
import { CourierSettingsService } from '../../features/courier/settings/courier-settings.service';

export interface HpToastItem {
  id: string;
  title: string;
  subtitle?: string;
}

@Injectable({ providedIn: 'root' })
export class HpToastService {
  private readonly _items = signal<HpToastItem[]>([]);
  private readonly courierSettings = inject(CourierSettingsService);

  readonly items = this._items.asReadonly();

  show(title: string, subtitle?: string, durationMs = 2500): void {
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `toast-${Date.now()}-${Math.random().toString(16).slice(2, 9)}`;
    this._items.update((list) => [...list, { id, title, subtitle }]);
    if (typeof window !== 'undefined') {
      this.maybeCourierToastFeedback();
      window.setTimeout(() => this.dismiss(id), durationMs);
    }
  }

  /** Kurye alanında: yeni paket sesi → kısa bip; titreşim tercihi ayrı kontrol edilir. */
  private maybeCourierToastFeedback(): void {
    if (typeof window === 'undefined') {
      return;
    }
    if (!window.location.pathname.includes('/courier')) {
      return;
    }
    if (this.courierSettings.taskSound()) {
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) {
          return;
        }
        const ctx = new AC();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 920;
        gain.gain.value = 0.035;
        osc.connect(gain);
        gain.connect(ctx.destination);
        const end = ctx.currentTime + 0.07;
        osc.start(ctx.currentTime);
        osc.stop(end);
        osc.onended = () => {
          void ctx.close().catch(() => {});
        };
      } catch {
        /* ignore */
      }
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate && this.courierSettings.vibration()) {
      try {
        navigator.vibrate(12);
      } catch {
        /* ignore */
      }
    }
  }
  dismiss(id: string): void {
    this._items.update((list) => list.filter((item) => item.id !== id));
  }
}
