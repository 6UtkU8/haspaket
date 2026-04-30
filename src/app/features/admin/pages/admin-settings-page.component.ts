import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';
import type { ResponsibleContactPerson } from '../../../core/operations/operations.types';
import type { AdminMarkaModel } from '../../../core/theme/admin-appearance.service';
import { AdminAppearanceService } from '../../../core/theme/admin-appearance.service';
import { DemoOperationsFacade } from '../../../core/operations/demo-operations.facade';

type DirectorShift = 'Gündüz' | 'Akşam' | 'Gece';
type DirectorWorkStatus = 'Aktif' | 'İzinde' | 'Pasif';

type Director = {
  id: string;
  name: string;
  email: string;
  phone: string;
  shift: DirectorShift;
  permissionCount: number;
  workStatus: DirectorWorkStatus;
  leftCompany: boolean;
};

type SettingsModel = {
  genel: {
    panelTitle: string;
    supportEmail: string;
    supportPhone: string;
    headquartersAddress: string;
  };
  operasyon: {
    cancelLimitMinutes: number;
    maxActivePerCourier: number;
    requireRestaurantPhone: boolean;
    hideCourierAddressUntilPickup: boolean;
  };
  otomasyon: {
    autoAssignCourier: boolean;
    assignDelaySec: number;
    smartPrioritization: boolean;
  };
  harita: {
    liveRefreshSec: number;
    showCourierTrails: boolean;
    addressVisibilityMode: 'Tam Adres' | 'Mahalle + Sokak' | 'Sadece Bölge';
  };
  bolge: {
    pricingType: 'Mesafe Bazlı' | 'Sabit Ücret' | 'Hibrit';
    baseDeliveryFee: number;
    distanceStepKm: number;
  };
  finans: {
    defaultPaymentView: 'Tümü' | 'Online Öncelikli' | 'Kapıda Ödeme Öncelikli';
    highlightOnlinePayments: boolean;
  };
  vardiya: {
    allowBreakRequest: boolean;
    peakHourBreakRestriction: boolean;
    defaultBreakMinutes: number;
  };
  bildirim: {
    notificationSound: boolean;
    instantNotification: boolean;
    emailDigest: boolean;
  };
  marka: {
    accentColor: 'Turuncu' | 'Mavi' | 'Mor' | 'Yeşil';
    cardDensity: 'Konforlu' | 'Kompakt' | 'Geniş';
    glassSurfaceEffect: boolean;
  };
  guvenlik: {
    logLevel: 'Standart' | 'Detaylı' | 'Tam Denetim';
    logRetentionDays: number;
    showSensitiveEvents: boolean;
    lastUpdatedAt: number;
  };
  direktorler: Director[];
};

type ModuleId =
  | 'genel'
  | 'firmaportal'
  | 'operasyon'
  | 'otomasyon'
  | 'harita'
  | 'bolge'
  | 'finans'
  | 'vardiya'
  | 'bildirim'
  | 'marka'
  | 'guvenlik'
  | 'direktorler';

@Component({
  selector: 'hp-admin-settings-page',
  standalone: true,
  imports: [HpPanelCardComponent, FormsModule, DatePipe],
  templateUrl: './admin-settings-page.component.html',
  styleUrl: './admin-settings-page.component.scss',
})
export class AdminSettingsPageComponent {
  private readonly storageKey = 'hp_admin_modular_settings_v1';
  private readonly adminAppearance = inject(AdminAppearanceService);
  readonly ops = inject(DemoOperationsFacade);
  readonly activeModule = signal<ModuleId>('genel');

  readonly settings = signal<SettingsModel>(this.loadSettings());
  readonly saveMessage = signal('');

  readonly addDirectorModalOpen = signal(false);
  readonly formerDirectorsModalOpen = signal(false);
  readonly newDirector = signal({
    name: '',
    email: '',
    phone: '',
    shift: 'Gündüz' as DirectorShift,
    permissionCount: 4,
    workStatus: 'Aktif' as DirectorWorkStatus,
  });

  readonly modules = [
    { id: 'genel', icon: '⚙️', title: 'Genel', desc: 'Panel bilgileri ve destek kanalları' },
    { id: 'firmaportal', icon: '🏪', title: 'Firma paneli', desc: 'Dükkan sorumluları ve iptal kuralları' },
    { id: 'operasyon', icon: '📦', title: 'Paket ve Operasyon', desc: 'Sipariş akış kuralları' },
    { id: 'otomasyon', icon: '🤖', title: 'Otomasyon', desc: 'Atama ve öncelik ayarları' },
    { id: 'harita', icon: '🗺️', title: 'Harita ve Konum', desc: 'Canlı takip görünümü' },
    { id: 'bolge', icon: '📍', title: 'Bölge ve Fiyatlandırma', desc: 'Ücret ve mesafe modeli' },
    { id: 'finans', icon: '💳', title: 'Finans ve Ödeme', desc: 'Ödeme panel tercihleri' },
    { id: 'vardiya', icon: '🕒', title: 'Vardiya ve Mola', desc: 'Mola ve vardiya politikası' },
    { id: 'bildirim', icon: '🔔', title: 'Bildirimler', desc: 'Uyarı ve özet seçenekleri' },
    { id: 'marka', icon: '🎨', title: 'Marka ve Görünüm', desc: 'Tema ve yoğunluk tercihleri' },
    { id: 'guvenlik', icon: '🛡️', title: 'Güvenlik / Kayıtlar', desc: 'Log seviyesi ve saklama' },
    { id: 'direktorler', icon: '👥', title: 'Direktörler', desc: 'Direktör listesi ve statü' },
  ] as const satisfies ReadonlyArray<{ id: ModuleId; icon: string; title: string; desc: string }>;

  readonly formerDirectors = computed(() => this.settings().direktorler.filter((d) => d.leftCompany));
  readonly activeDirectors = computed(() => this.settings().direktorler.filter((d) => !d.leftCompany));

  readonly newFirmaResponsible = signal({ name: '', phone: '', roleLabel: '' });

  setActiveModule(moduleId: ModuleId): void {
    this.activeModule.set(moduleId);
  }

  updateSettings(mutator: (draft: SettingsModel) => SettingsModel): void {
    this.settings.update((prev) => mutator(structuredClone(prev)));
  }

  updateGenel<K extends keyof SettingsModel['genel']>(key: K, value: SettingsModel['genel'][K]): void {
    this.updateSettings((draft) => {
      draft.genel[key] = value;
      return draft;
    });
  }

  updateOperasyon<K extends keyof SettingsModel['operasyon']>(key: K, value: SettingsModel['operasyon'][K]): void {
    this.updateSettings((draft) => {
      draft.operasyon[key] = value;
      return draft;
    });
  }

  updateOtomasyon<K extends keyof SettingsModel['otomasyon']>(key: K, value: SettingsModel['otomasyon'][K]): void {
    this.updateSettings((draft) => {
      draft.otomasyon[key] = value;
      return draft;
    });
  }

  updateHarita<K extends keyof SettingsModel['harita']>(key: K, value: SettingsModel['harita'][K]): void {
    this.updateSettings((draft) => {
      draft.harita[key] = value;
      return draft;
    });
  }

  updateBolge<K extends keyof SettingsModel['bolge']>(key: K, value: SettingsModel['bolge'][K]): void {
    this.updateSettings((draft) => {
      draft.bolge[key] = value;
      return draft;
    });
  }

  updateFinans<K extends keyof SettingsModel['finans']>(key: K, value: SettingsModel['finans'][K]): void {
    this.updateSettings((draft) => {
      draft.finans[key] = value;
      return draft;
    });
  }

  updateVardiya<K extends keyof SettingsModel['vardiya']>(key: K, value: SettingsModel['vardiya'][K]): void {
    this.updateSettings((draft) => {
      draft.vardiya[key] = value;
      return draft;
    });
  }

  updateBildirim<K extends keyof SettingsModel['bildirim']>(key: K, value: SettingsModel['bildirim'][K]): void {
    this.updateSettings((draft) => {
      draft.bildirim[key] = value;
      return draft;
    });
  }

  updateMarka<K extends keyof SettingsModel['marka']>(key: K, value: SettingsModel['marka'][K]): void {
    this.updateSettings((draft) => {
      draft.marka[key] = value;
      return draft;
    });
    this.adminAppearance.applyMarka(this.settings().marka as AdminMarkaModel);
  }

  updateGuvenlik<K extends keyof SettingsModel['guvenlik']>(key: K, value: SettingsModel['guvenlik'][K]): void {
    this.updateSettings((draft) => {
      draft.guvenlik[key] = value;
      return draft;
    });
  }

  updateDirectorShift(id: string, shift: DirectorShift): void {
    this.updateSettings((draft) => {
      const director = draft.direktorler.find((x) => x.id === id);
      if (director) {
        director.shift = shift;
      }
      return draft;
    });
  }

  saveAll(): void {
    const now = Date.now();
    this.updateSettings((draft) => {
      draft.guvenlik.lastUpdatedAt = now;
      return draft;
    });
    localStorage.setItem(this.storageKey, JSON.stringify(this.settings()));
    this.adminAppearance.applyMarka(this.settings().marka as AdminMarkaModel);
    this.saveMessage.set('Tüm ayarlar kaydedildi.');
    setTimeout(() => this.saveMessage.set(''), 1800);
  }

  resetAll(): void {
    this.settings.set(this.defaultSettings());
    localStorage.setItem(this.storageKey, JSON.stringify(this.settings()));
    this.adminAppearance.applyMarka(this.settings().marka as AdminMarkaModel);
    this.saveMessage.set('Varsayılan ayarlar geri yüklendi.');
    setTimeout(() => this.saveMessage.set(''), 1800);
  }

  toggleDirectorLeave(id: string): void {
    this.updateSettings((draft) => {
      const director = draft.direktorler.find((item) => item.id === id);
      if (director) {
        director.leftCompany = !director.leftCompany;
        director.workStatus = director.leftCompany ? 'Pasif' : 'Aktif';
      }
      return draft;
    });
  }

  removeDirector(id: string): void {
    this.updateSettings((draft) => {
      draft.direktorler = draft.direktorler.filter((item) => item.id !== id);
      return draft;
    });
  }

  openAddDirectorModal(): void {
    this.newDirector.set({
      name: '',
      email: '',
      phone: '',
      shift: 'Gündüz',
      permissionCount: 4,
      workStatus: 'Aktif',
    });
    this.addDirectorModalOpen.set(true);
  }

  addDirector(): void {
    const form = this.newDirector();
    if (!form.name.trim() || !form.email.trim()) {
      return;
    }
    this.updateSettings((draft) => {
      draft.direktorler.unshift({
        id: `dir-${Date.now()}`,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        shift: form.shift,
        permissionCount: Number(form.permissionCount) || 0,
        workStatus: form.workStatus,
        leftCompany: false,
      });
      return draft;
    });
    this.addDirectorModalOpen.set(false);
  }

  setFirmCancellationEnabled(v: boolean): void {
    this.ops.patchFirmPortalGlobalSettings({ firmCancellationEnabled: v });
  }

  firmGraceLimitEnabled(): boolean {
    return this.ops.firmPortalGlobalSettings().firmCancellationGraceMinutes !== null;
  }

  firmGraceMinutesDraft(): number {
    const g = this.ops.firmPortalGlobalSettings().firmCancellationGraceMinutes;
    return typeof g === 'number' && Number.isFinite(g) && g >= 0 ? g : 45;
  }

  setFirmGraceLimitEnabled(enabled: boolean): void {
    const cur = this.ops.firmPortalGlobalSettings();
    if (!enabled) {
      this.ops.patchFirmPortalGlobalSettings({ firmCancellationGraceMinutes: null });
      return;
    }
    const n =
      typeof cur.firmCancellationGraceMinutes === 'number' && cur.firmCancellationGraceMinutes >= 0
        ? cur.firmCancellationGraceMinutes
        : 45;
    this.ops.patchFirmPortalGlobalSettings({ firmCancellationGraceMinutes: n });
  }

  patchFirmGraceMinutes(n: unknown): void {
    const raw = typeof n === 'number' ? n : parseInt(String(n), 10);
    const v = Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 0;
    this.ops.patchFirmPortalGlobalSettings({ firmCancellationGraceMinutes: v });
  }

  updateFirmaResponsibleField(id: string, partial: Partial<ResponsibleContactPerson>): void {
    const list = this.ops
      .firmPortalGlobalSettings()
      .responsibleContacts.map((c) => (c.id === id ? { ...c, ...partial } : c));
    this.ops.patchFirmPortalGlobalSettings({ responsibleContacts: list });
  }

  onFirmaResponsibleRoleLabel(id: string, raw: string): void {
    const t = raw.trim();
    this.updateFirmaResponsibleField(id, { roleLabel: t ? t : undefined });
  }

  removeFirmaResponsible(id: string): void {
    const next = this.ops.firmPortalGlobalSettings().responsibleContacts.filter((c) => c.id !== id);
    this.ops.patchFirmPortalGlobalSettings({ responsibleContacts: next });
  }

  addFirmaResponsiblePerson(): void {
    const form = this.newFirmaResponsible();
    if (!form.name.trim() || !form.phone.trim()) {
      return;
    }
    const list = [
      ...this.ops.firmPortalGlobalSettings().responsibleContacts,
      {
        id: `rcp-${Date.now()}`,
        name: form.name.trim(),
        phone: form.phone.trim(),
        roleLabel: form.roleLabel.trim() || undefined,
      },
    ];
    this.ops.patchFirmPortalGlobalSettings({ responsibleContacts: list });
    this.newFirmaResponsible.set({ name: '', phone: '', roleLabel: '' });
  }

  private loadSettings(): SettingsModel {
    const fallback = this.defaultSettings();
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return fallback;
    }
    try {
      const parsed = JSON.parse(raw) as SettingsModel;
      return {
        ...fallback,
        ...parsed,
        genel: { ...fallback.genel, ...parsed.genel },
        operasyon: { ...fallback.operasyon, ...parsed.operasyon },
        otomasyon: { ...fallback.otomasyon, ...parsed.otomasyon },
        harita: { ...fallback.harita, ...parsed.harita },
        bolge: { ...fallback.bolge, ...parsed.bolge },
        finans: { ...fallback.finans, ...parsed.finans },
        vardiya: { ...fallback.vardiya, ...parsed.vardiya },
        bildirim: { ...fallback.bildirim, ...parsed.bildirim },
        marka: { ...fallback.marka, ...parsed.marka },
        guvenlik: { ...fallback.guvenlik, ...parsed.guvenlik },
        direktorler: Array.isArray(parsed.direktorler) ? parsed.direktorler : fallback.direktorler,
      };
    } catch {
      return fallback;
    }
  }

  private defaultSettings(): SettingsModel {
    return {
      genel: {
        panelTitle: 'HasPaket Yönetim Paneli',
        supportEmail: 'destek@haspaket.com',
        supportPhone: '+90 850 123 45 67',
        headquartersAddress: 'Kozyatağı Mah. İnönü Cad. No:12 Kadıköy / İstanbul',
      },
      operasyon: {
        cancelLimitMinutes: 8,
        maxActivePerCourier: 4,
        requireRestaurantPhone: true,
        hideCourierAddressUntilPickup: true,
      },
      otomasyon: {
        autoAssignCourier: true,
        assignDelaySec: 45,
        smartPrioritization: true,
      },
      harita: {
        liveRefreshSec: 12,
        showCourierTrails: true,
        addressVisibilityMode: 'Mahalle + Sokak',
      },
      bolge: {
        pricingType: 'Mesafe Bazlı',
        baseDeliveryFee: 65,
        distanceStepKm: 1.5,
      },
      finans: {
        defaultPaymentView: 'Online Öncelikli',
        highlightOnlinePayments: true,
      },
      vardiya: {
        allowBreakRequest: true,
        peakHourBreakRestriction: true,
        defaultBreakMinutes: 15,
      },
      bildirim: {
        notificationSound: true,
        instantNotification: true,
        emailDigest: true,
      },
      marka: {
        accentColor: 'Turuncu',
        cardDensity: 'Konforlu',
        glassSurfaceEffect: true,
      },
      guvenlik: {
        logLevel: 'Detaylı',
        logRetentionDays: 90,
        showSensitiveEvents: true,
        lastUpdatedAt: Date.now(),
      },
      direktorler: [
        {
          id: 'dir-1',
          name: 'Mert Yılmaz',
          email: 'mert.yilmaz@haspaket.com',
          phone: '+90 532 111 22 33',
          shift: 'Gündüz',
          permissionCount: 8,
          workStatus: 'Aktif',
          leftCompany: false,
        },
        {
          id: 'dir-2',
          name: 'Selin Akar',
          email: 'selin.akar@haspaket.com',
          phone: '+90 532 444 55 66',
          shift: 'Akşam',
          permissionCount: 6,
          workStatus: 'İzinde',
          leftCompany: false,
        },
        {
          id: 'dir-3',
          name: 'Can Atik',
          email: 'can.atik@haspaket.com',
          phone: '+90 533 777 88 99',
          shift: 'Gece',
          permissionCount: 5,
          workStatus: 'Pasif',
          leftCompany: true,
        },
      ],
    };
  }
}
