import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { DemoAuthService } from '../../../core/auth/demo-auth.service';
import { DemoOperationsFacade } from '../../../core/operations/demo-operations.facade';
import { ThemeService } from '../../../core/theme/theme.service';

export type CourierUiThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'haspaket_courier_settings_v2';

interface CourierStoredPayload {
  v: 3;
  courierPhone: string;
  courierVehicle: string;
  language: string;
  theme: CourierUiThemePreference;
  autoOnline: boolean;
  breakReminder: boolean;
  taskSound: boolean;
  vibration: boolean;
  shareLiveLocation: boolean;
  showPhone: boolean;
  locationPrecision: string;
  compactTasks: boolean;
}

@Injectable({ providedIn: 'root' })
export class CourierSettingsService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly auth = inject(DemoAuthService);
  private readonly ops = inject(DemoOperationsFacade);
  private readonly theme = inject(ThemeService);

  readonly courierName = signal('');
  readonly courierEmail = signal('');
  readonly courierPhone = signal('');
  readonly courierVehicle = signal('Motosiklet');
  readonly language = signal('tr');
  readonly themePreference = signal<CourierUiThemePreference>('system');

  readonly autoOnline = signal(true);
  readonly breakReminder = signal(true);
  readonly taskSound = signal(true);
  readonly vibration = signal(true);

  readonly shareLiveLocation = signal(true);
  readonly showPhone = signal(false);
  readonly locationPrecision = signal('high');

  readonly compactTasks = signal(false);

  private systemThemeMq?: MediaQueryList;
  private systemThemeMqHandler?: (this: MediaQueryList, ev: MediaQueryListEvent) => void;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.hydrate();
      this.bindSystemThemeListener();
    }
  }

  displayNameFallback(): string {
    return this.ops.courierName(this.resolvedCourierId());
  }

  emailFallback(): string {
    const email = this.auth.sessionReadonly()?.email;
    if (email) {
      return email;
    }
    return (
      this.ops.couriers().find((courier) => courier.id === this.resolvedCourierId())?.loginIdentifier ??
      'kurye@haspaket.com'
    );
  }

  resolvedCourierId(): string {
    const sessionCourierId = this.auth.sessionReadonly()?.userId ?? '';
    if (this.ops.couriers().some((courier) => courier.id === sessionCourierId)) {
      return sessionCourierId;
    }
    return this.ops.couriers()[0]?.id ?? 'c-1';
  }

  hydrate(): void {
    let parsed: CourierStoredPayload | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        parsed = JSON.parse(raw) as CourierStoredPayload;
      }
    } catch {
      parsed = null;
    }
    if (parsed?.v !== 3) {
      this.patchFromPayload({
        v: 3,
        courierPhone: '+90 555 888 00 11',
        courierVehicle: 'Motosiklet',
        language: 'tr',
        theme: 'system',
        autoOnline: true,
        breakReminder: true,
        taskSound: true,
        vibration: true,
        shareLiveLocation: true,
        showPhone: false,
        locationPrecision: 'high',
        compactTasks: false,
      });
    } else {
      this.patchFromPayload(parsed);
    }
    this.applyLanguageDom();
    this.applyResolvedTheme();
    this.refreshSystemThemeListenerBinding();
    this.applyPrivacyDom();
  }

  buildPayload(): CourierStoredPayload {
    return {
      v: 3,
      courierPhone: this.courierPhone().trim(),
      courierVehicle: this.courierVehicle(),
      language: this.language(),
      theme: this.themePreference(),
      autoOnline: this.autoOnline(),
      breakReminder: this.breakReminder(),
      taskSound: this.taskSound(),
      vibration: this.vibration(),
      shareLiveLocation: this.shareLiveLocation(),
      showPhone: this.showPhone(),
      locationPrecision: this.locationPrecision(),
      compactTasks: this.compactTasks(),
    };
  }

  persist(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.buildPayload()));
    this.applyLanguageDom();
    this.applyResolvedTheme();
    this.refreshSystemThemeListenerBinding();
    this.applyPrivacyDom();
  }

  /** Temayı anında uygular; kalıcı kayıt için `persist()` çağrılmalı (ör. Ayarları Kaydet). */
  setThemePreference(pref: CourierUiThemePreference): void {
    if (pref !== 'light' && pref !== 'dark' && pref !== 'system') {
      return;
    }
    this.themePreference.set(pref);
    this.applyResolvedTheme();
    this.refreshSystemThemeListenerBinding();
  }

  /** Dil sinyalini günceller; kalıcı kayıt `persist()` ile. */
  setLanguage(lang: string): void {
    this.language.set(lang === 'en' ? 'en' : 'tr');
    this.applyLanguageDom();
  }

  validatePasswordFields(current: string, next: string): string | null {
    const nextTrimmed = next.trim();
    const currentTrimmed = current.trim();
    if (!currentTrimmed && !nextTrimmed) {
      return null;
    }
    if (currentTrimmed && !nextTrimmed) {
      return 'Yeni şifre en az 6 karakter olmalıdır.';
    }
    if (!currentTrimmed && nextTrimmed) {
      return 'Mevcut şifreyi girin.';
    }
    if (nextTrimmed.length < 6) {
      return 'Yeni şifre en az 6 karakter olmalıdır.';
    }
    const courierId = this.resolvedCourierId();
    const expected = this.ops.couriers().find((courier) => courier.id === courierId)?.loginPassword ?? '';
    if (currentTrimmed !== expected) {
      return 'Mevcut şifre hatalı (demo).';
    }
    return null;
  }

  /** localStorage kaydını siler ve varsayılanlara döner (ad/e‑posta demo oturumdan alınır). */
  resetToDefaults(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.hydrate();
    this.persist();
  }

  touchAutoOnlineLaunch(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (!this.autoOnline()) {
      return;
    }
    const key = `haspaket_courier_auto_online_applied_${this.resolvedCourierId()}`;
    if (sessionStorage.getItem(key)) {
      return;
    }
    this.ops.setCourierState(this.resolvedCourierId(), 'online');
    sessionStorage.setItem(key, '1');
  }

  private patchFromPayload(p: CourierStoredPayload): void {
    this.syncIdentityFields();
    this.courierPhone.set(p.courierPhone?.trim() ? p.courierPhone : '+90 555 888 00 11');
    this.courierVehicle.set(p.courierVehicle ?? 'Motosiklet');
    this.language.set(p.language ?? 'tr');
    this.themePreference.set(p.theme ?? 'system');
    this.autoOnline.set(p.autoOnline !== false);
    this.breakReminder.set(p.breakReminder !== false);
    this.taskSound.set(p.taskSound !== false);
    this.vibration.set(p.vibration !== false);
    this.shareLiveLocation.set(p.shareLiveLocation !== false);
    this.showPhone.set(p.showPhone === true);
    this.locationPrecision.set(p.locationPrecision ?? 'high');
    this.compactTasks.set(p.compactTasks === true);
  }

  private syncIdentityFields(): void {
    this.courierName.set(this.displayNameFallback());
    this.courierEmail.set(this.emailFallback());
  }

  private applyLanguageDom(): void {
    const html = this.document.documentElement;
    const lang = this.language() === 'en' ? 'en' : 'tr';
    html.setAttribute('lang', lang);
  }

  private applyPrivacyDom(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const body = this.document.body;
    body.setAttribute('data-courier-live-location', this.shareLiveLocation() ? '1' : '0');
    body.setAttribute('data-courier-show-phone', this.showPhone() ? '1' : '0');
    body.setAttribute('data-courier-location-precision', this.locationPrecision());
  }

  effectiveThemeMode(): 'dark' | 'light' {
    const pref = this.themePreference();
    if (pref === 'dark') {
      return 'dark';
    }
    if (pref === 'light') {
      return 'light';
    }
    if (!isPlatformBrowser(this.platformId)) {
      return 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyResolvedTheme(): void {
    const mode = this.effectiveThemeMode();
    this.theme.setMode(mode);
  }

  private bindSystemThemeListener(): void {
    this.refreshSystemThemeListenerBinding();
  }

  private refreshSystemThemeListenerBinding(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (this.systemThemeMq && this.systemThemeMqHandler) {
      this.systemThemeMq.removeEventListener('change', this.systemThemeMqHandler);
    }
    this.systemThemeMq = undefined;
    this.systemThemeMqHandler = undefined;

    if (this.themePreference() !== 'system') {
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemThemeMq = mq;
    const handler = (): void => this.applyResolvedTheme();
    this.systemThemeMqHandler = handler;
    mq.addEventListener('change', handler);
  }
}
