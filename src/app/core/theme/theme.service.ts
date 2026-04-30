import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'haspaket_theme_v1';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  /** Aktif tema — `data-theme` ile `documentElement` üzerinde senkron */
  readonly mode = signal<ThemeMode>('dark');

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const initial: ThemeMode = stored === 'light' ? 'light' : 'dark';
    this.mode.set(initial);
    this.applyDom(initial);
  }

  toggle(): void {
    this.setMode(this.mode() === 'dark' ? 'light' : 'dark');
  }

  setMode(next: ThemeMode): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.mode.set(next);
    localStorage.setItem(STORAGE_KEY, next);
    this.applyDom(next);
  }

  private applyDom(m: ThemeMode): void {
    const html = this.document.documentElement;
    const body = this.document.body;
    html.setAttribute('data-theme', m);
    html.classList.remove('theme-dark', 'theme-light');
    body?.classList.remove('theme-dark', 'theme-light');
    const cls = m === 'dark' ? 'theme-dark' : 'theme-light';
    html.classList.add(cls);
    body?.classList.add(cls);
  }
}
