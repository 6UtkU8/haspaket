import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

const STORAGE_KEY = 'hp_admin_modular_settings_v1';

export type AdminAccentSlug = 'turuncu' | 'mavi' | 'mor' | 'yesil';
export type AdminDensitySlug = 'konforlu' | 'kompakt' | 'genis';

export interface AdminMarkaModel {
  accentColor: 'Turuncu' | 'Mavi' | 'Mor' | 'Yeşil';
  cardDensity: 'Konforlu' | 'Kompakt' | 'Geniş';
  glassSurfaceEffect: boolean;
}

const DEFAULT_MARKA: AdminMarkaModel = {
  accentColor: 'Turuncu',
  cardDensity: 'Konforlu',
  glassSurfaceEffect: true,
};

@Injectable({ providedIn: 'root' })
export class AdminAppearanceService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly accent = signal<AdminAccentSlug>('turuncu');
  readonly density = signal<AdminDensitySlug>('konforlu');
  readonly glass = signal(true);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.hydrateFromStorage();
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue == null) {
        return;
      }
      try {
        const parsed = JSON.parse(e.newValue) as { marka?: Partial<AdminMarkaModel> };
        if (parsed.marka) {
          this.applyMarka({ ...DEFAULT_MARKA, ...parsed.marka });
        }
      } catch {
        /* ignore */
      }
    });
  }

  hydrateFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      this.applyMarka(DEFAULT_MARKA);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as { marka?: Partial<AdminMarkaModel> };
      this.applyMarka({ ...DEFAULT_MARKA, ...parsed.marka });
    } catch {
      this.applyMarka(DEFAULT_MARKA);
    }
  }

  applyMarka(marka: AdminMarkaModel): void {
    this.accent.set(accentLabelToSlug(marka.accentColor));
    this.density.set(densityLabelToSlug(marka.cardDensity));
    this.glass.set(marka.glassSurfaceEffect);
  }
}

function accentLabelToSlug(label: string): AdminAccentSlug {
  const n = label.trim().toLocaleLowerCase('tr');
  if (n === 'mavi') {
    return 'mavi';
  }
  if (n === 'mor') {
    return 'mor';
  }
  if (n === 'yeşil' || n === 'yesil') {
    return 'yesil';
  }
  return 'turuncu';
}

function densityLabelToSlug(label: string): AdminDensitySlug {
  const n = label.trim().toLocaleLowerCase('tr');
  if (n === 'kompakt') {
    return 'kompakt';
  }
  if (n === 'geniş' || n === 'genis') {
    return 'genis';
  }
  return 'konforlu';
}
