import { DatePipe, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../../core/theme/theme.service';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';

type FirmaModuleId =
  | 'genel'
  | 'iletisim'
  | 'bildirim'
  | 'operasyon'
  | 'gorunum'
  | 'guvenlik';
type FirmaThemePreference = 'light' | 'dark' | 'system';
type FirmaLanguage = 'tr' | 'en';

type FirmaSettingsModel = {
  genel: {
    companyName: string;
    taxNumber: string;
    tradeRegistryNo: string;
  };
  iletisim: {
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
  };
  bildirim: {
    emailNotif: boolean;
    smsNotif: boolean;
    pushNotif: boolean;
    orderAssignedNotif: boolean;
    orderDelayedNotif: boolean;
    orderCancelledNotif: boolean;
  };
  operasyon: {
    workingStart: string;
    workingEnd: string;
    sameDayDelivery: boolean;
    maxDeliveryRadius: string;
    orderAutoAssign: boolean;
  };
  gorunum: {
    denseMode: boolean;
    theme: FirmaThemePreference;
    language: FirmaLanguage;
  };
  guvenlik: {
    twoFactorEnabled: boolean;
    lastUpdatedAt: number;
  };
};

@Component({
  selector: 'hp-firma-settings-page',
  standalone: true,
  imports: [HpPanelCardComponent, FormsModule, DatePipe],
  templateUrl: './firma-settings-page.component.html',
  styleUrl: './firma-settings-page.component.scss',
})
export class FirmaSettingsPageComponent {
  private readonly storageKey = 'hp_firma_settings_v2';
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly themeService = inject(ThemeService);

  readonly activeModule = signal<FirmaModuleId>('genel');
  readonly settings = signal<FirmaSettingsModel>(this.loadSettings());
  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly saveMessage = signal('');

  readonly modules = [
    { id: 'genel', icon: '🏢', title: 'Genel', desc: 'Firma kimliği ve resmî bilgiler' },
    { id: 'iletisim', icon: '📇', title: 'İletişim', desc: 'Yetkili, telefon ve adres bilgileri' },
    { id: 'bildirim', icon: '🔔', title: 'Bildirimler', desc: 'Sipariş ve kanal tercihleri' },
    { id: 'operasyon', icon: '📦', title: 'Operasyon', desc: 'Mesai ve teslimat tercihleri' },
    { id: 'gorunum', icon: '🎨', title: 'Görünüm', desc: 'Tema, dil ve yoğunluk ayarı' },
    { id: 'guvenlik', icon: '🛡️', title: 'Güvenlik', desc: 'Şifre ve doğrulama alanı' },
  ] as const satisfies ReadonlyArray<{
    id: FirmaModuleId;
    icon: string;
    title: string;
    desc: string;
  }>;

  constructor() {
    this.applyUiPreferences();
  }

  setActiveModule(moduleId: FirmaModuleId): void {
    this.activeModule.set(moduleId);
  }

  updateSettings(mutator: (draft: FirmaSettingsModel) => FirmaSettingsModel): void {
    this.settings.update((prev) => mutator(structuredClone(prev)));
  }

  updateGenel<K extends keyof FirmaSettingsModel['genel']>(
    key: K,
    value: FirmaSettingsModel['genel'][K],
  ): void {
    this.updateSettings((draft) => {
      draft.genel[key] = value;
      return draft;
    });
  }

  updateIletisim<K extends keyof FirmaSettingsModel['iletisim']>(
    key: K,
    value: FirmaSettingsModel['iletisim'][K],
  ): void {
    this.updateSettings((draft) => {
      draft.iletisim[key] = value;
      return draft;
    });
  }

  updateBildirim<K extends keyof FirmaSettingsModel['bildirim']>(
    key: K,
    value: FirmaSettingsModel['bildirim'][K],
  ): void {
    this.updateSettings((draft) => {
      draft.bildirim[key] = value;
      return draft;
    });
  }

  updateOperasyon<K extends keyof FirmaSettingsModel['operasyon']>(
    key: K,
    value: FirmaSettingsModel['operasyon'][K],
  ): void {
    this.updateSettings((draft) => {
      draft.operasyon[key] = value;
      return draft;
    });
  }

  updateGorunum<K extends keyof FirmaSettingsModel['gorunum']>(
    key: K,
    value: FirmaSettingsModel['gorunum'][K],
  ): void {
    this.updateSettings((draft) => {
      draft.gorunum[key] = value;
      return draft;
    });
  }

  updateGuvenlik<K extends keyof FirmaSettingsModel['guvenlik']>(
    key: K,
    value: FirmaSettingsModel['guvenlik'][K],
  ): void {
    this.updateSettings((draft) => {
      draft.guvenlik[key] = value;
      return draft;
    });
  }

  onThemePick(value: string): void {
    if (value !== 'light' && value !== 'dark' && value !== 'system') {
      return;
    }
    this.updateGorunum('theme', value);
    this.applyUiPreferences();
  }

  onLanguagePick(value: string): void {
    const nextLanguage: FirmaLanguage = value === 'en' ? 'en' : 'tr';
    this.updateGorunum('language', nextLanguage);
    this.applyUiPreferences();
  }

  saveAll(): void {
    const passwordError = this.validatePasswordFields(
      this.currentPassword(),
      this.newPassword(),
    );
    if (passwordError) {
      this.setSaveMessage(passwordError, 2600);
      return;
    }

    const now = Date.now();
    this.updateGuvenlik('lastUpdatedAt', now);
    localStorage.setItem(this.storageKey, JSON.stringify(this.settings()));
    this.applyUiPreferences();
    this.currentPassword.set('');
    this.newPassword.set('');
    this.setSaveMessage('Firma ayarları kaydedildi.');
  }

  resetAll(): void {
    const fallback = this.defaultSettings();
    this.settings.set(fallback);
    localStorage.setItem(this.storageKey, JSON.stringify(fallback));
    this.applyUiPreferences();
    this.currentPassword.set('');
    this.newPassword.set('');
    this.setSaveMessage('Varsayılan firma ayarları geri yüklendi.');
  }

  private setSaveMessage(message: string, duration = 1800): void {
    this.saveMessage.set(message);
    setTimeout(() => {
      if (this.saveMessage() === message) {
        this.saveMessage.set('');
      }
    }, duration);
  }

  private validatePasswordFields(current: string, next: string): string | null {
    const currentTrimmed = current.trim();
    const nextTrimmed = next.trim();

    if (!currentTrimmed && !nextTrimmed) {
      return null;
    }
    if (!currentTrimmed && nextTrimmed) {
      return 'Yeni şifre için mevcut şifreyi girin.';
    }
    if (currentTrimmed && !nextTrimmed) {
      return 'Yeni şifre alanını doldurun.';
    }
    if (nextTrimmed.length < 6) {
      return 'Yeni şifre en az 6 karakter olmalıdır.';
    }
    return null;
  }

  private applyUiPreferences(): void {
    this.document.documentElement.setAttribute(
      'lang',
      this.settings().gorunum.language,
    );
    const themePreference = this.settings().gorunum.theme;
    if (themePreference === 'system') {
      const resolvedTheme =
        isPlatformBrowser(this.platformId) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      this.themeService.setMode(resolvedTheme);
      return;
    }
    this.themeService.setMode(themePreference);
  }

  private loadSettings(): FirmaSettingsModel {
    const fallback = this.defaultSettings();
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<FirmaSettingsModel>;
      return {
        ...fallback,
        ...parsed,
        genel: { ...fallback.genel, ...parsed.genel },
        iletisim: { ...fallback.iletisim, ...parsed.iletisim },
        bildirim: { ...fallback.bildirim, ...parsed.bildirim },
        operasyon: { ...fallback.operasyon, ...parsed.operasyon },
        gorunum: { ...fallback.gorunum, ...parsed.gorunum },
        guvenlik: { ...fallback.guvenlik, ...parsed.guvenlik },
      };
    } catch {
      return fallback;
    }
  }

  private defaultSettings(): FirmaSettingsModel {
    return {
      genel: {
        companyName: 'HasPaket Demo Firma',
        taxNumber: '1234567890',
        tradeRegistryNo: 'TR-452110',
      },
      iletisim: {
        contactName: 'Operasyon Ekibi',
        contactEmail: 'operasyon@haspaket.com',
        contactPhone: '+90 555 123 45 67',
        address: 'İstanbul / Kadıköy',
      },
      bildirim: {
        emailNotif: true,
        smsNotif: false,
        pushNotif: true,
        orderAssignedNotif: true,
        orderDelayedNotif: true,
        orderCancelledNotif: true,
      },
      operasyon: {
        workingStart: '09:00',
        workingEnd: '22:00',
        sameDayDelivery: true,
        maxDeliveryRadius: '8',
        orderAutoAssign: true,
      },
      gorunum: {
        denseMode: false,
        theme: 'system',
        language: 'tr',
      },
      guvenlik: {
        twoFactorEnabled: false,
        lastUpdatedAt: Date.now(),
      },
    };
  }
}
