import {
  DestroyRef,
  Injectable,
  computed,
  effect,
  inject,
  NgZone,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  AdminOrderPatchInput,
  CourierBreakRequest,
  CourierReceiptOverride,
  CourierReceiptPayment,
  CourierStateNotification,
  CompanyApplicationData,
  CourierApplicationData,
  CreateManualOrderInput,
  DemoOperationsPersistedSnapshot,
  DeliveryDistrictZone,
  FirmPortalGlobalSettings,
  OperationApplication,
  OperationCompany,
  OperationCourier,
  OperationOrder,
  OperationOrderStatus,
  ResponsibleContactPerson,
} from './operations.types';

const DEMO_OPS_STORAGE_KEY = 'haspaket_demo_operations_v1';
const COURIER_NOTIFICATION_VISIBLE_LIMIT = 10;
const COURIER_NOTIFICATION_LOG_LIMIT = 250;

@Injectable({ providedIn: 'root' })
export class DemoOperationsFacade {
  private readonly nowMs = signal(Date.now());
  private readonly ordersState = signal<OperationOrder[]>(seedOrders());
  private readonly couriersState = signal<OperationCourier[]>(
    mergeCourierZoneDefaults(seedCouriers()),
  );
  private readonly companiesState = signal<OperationCompany[]>(seedCompanies());
  private readonly applicationsState = signal<OperationApplication[]>(seedApplications());
  private readonly courierBreakRequestsState = signal<CourierBreakRequest[]>([]);
  private readonly courierStateNotificationsState = signal<CourierStateNotification[]>([]);
  private readonly courierStateNotificationLogState = signal<CourierStateNotification[]>([]);
  private readonly courierStateFeedbackState = signal<Record<string, string>>({});
  /** Firma satırından onay sonrası liste aksiyonunu kilitle */
  private readonly companyListStatusLockedState = signal<Record<string, boolean>>({});
  private readonly selectedOrderIdState = signal<string | null>(this.ordersState()[0]?.id ?? null);
  private readonly courierReceiptOverridesState = signal<Record<string, CourierReceiptOverride>>({});
  private readonly districtZonesState = signal<DeliveryDistrictZone[]>(seedDistrictZones());
  private readonly firmPortalGlobalSettingsState = signal<FirmPortalGlobalSettings>(
    seedFirmPortalGlobalSettings(),
  );

  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private persistLocked = false;

  readonly orders = computed(() => this.ordersState());
  readonly couriers = computed(() => this.couriersState());
  readonly companies = computed(() => this.companiesState());
  readonly applications = computed(() => this.applicationsState());
  readonly courierBreakRequests = computed(() => this.courierBreakRequestsState());
  readonly courierStateNotifications = computed(() => this.courierStateNotificationsState());
  readonly courierStateNotificationLog = computed(() => this.courierStateNotificationLogState());
  readonly courierStateFeedback = computed(() => this.courierStateFeedbackState());
  readonly pendingCourierBreakRequests = computed(() =>
    this.courierBreakRequestsState().filter((request) => request.status === 'pending'),
  );
  readonly courierApplications = computed(() =>
    this.applicationsState().filter((app) => app.type === 'kurye'),
  );
  readonly companyApplications = computed(() =>
    this.applicationsState().filter((app) => app.type === 'firma'),
  );
  readonly districtZones = computed(() => this.districtZonesState());
  readonly firmPortalGlobalSettings = computed(() => this.firmPortalGlobalSettingsState());
  readonly selectedOrderId = computed(() => this.selectedOrderIdState());
  readonly selectedOrder = computed(() => {
    const selected = this.selectedOrderIdState();
    if (!selected) {
      return null;
    }
    return this.ordersState().find((o) => o.id === selected) ?? null;
  });

  constructor() {
    /** Süre göstergeleri — görünmez sekmede durdurulur (gereksiz sinyal/çizim yükünü keser). */
    if (isPlatformBrowser(this.platformId)) {
      const bumpNow = (): void => {
        this.nowMs.set(Date.now());
      };
      let tickId: ReturnType<typeof setInterval> | undefined;
      const restartTick = (): void => {
        if (tickId !== undefined) {
          clearInterval(tickId);
          tickId = undefined;
        }
        bumpNow();
        tickId = setInterval(bumpNow, 1000);
      };
      const onVisibility = (): void => {
        if (document.visibilityState === 'hidden') {
          if (tickId !== undefined) {
            clearInterval(tickId);
            tickId = undefined;
          }
          return;
        }
        restartTick();
      };
      restartTick();
      document.addEventListener('visibilitychange', onVisibility);
      this.destroyRef.onDestroy(() => {
        document.removeEventListener('visibilitychange', onVisibility);
        if (tickId !== undefined) {
          clearInterval(tickId);
        }
      });
    }

    if (isPlatformBrowser(this.platformId)) {
      this.hydrateFromStorage();
      this.ensureBundledDemoOrdersPresent();

      effect(() => {
        this.ordersState();
        this.couriersState();
        this.companiesState();
        this.applicationsState();
        this.courierBreakRequestsState();
        this.courierStateNotificationsState();
        this.courierStateNotificationLogState();
        this.courierStateFeedbackState();
        this.companyListStatusLockedState();
        this.selectedOrderIdState();
        this.courierReceiptOverridesState();
        this.districtZonesState();
        this.firmPortalGlobalSettingsState();

        if (this.persistLocked) {
          return;
        }
        queueMicrotask(() => {
          if (this.persistLocked) {
            return;
          }
          try {
            localStorage.setItem(DEMO_OPS_STORAGE_KEY, JSON.stringify(this.buildPersistedSnapshot()));
          } catch {
            /* ignore quota */
          }
        });
      });

      window.addEventListener('storage', (e: StorageEvent) => {
        const next = e.newValue;
        if (e.key !== DEMO_OPS_STORAGE_KEY || next == null) {
          return;
        }
        this.ngZone.run(() => {
          try {
            const parsed = JSON.parse(next) as DemoOperationsPersistedSnapshot;
            this.applyPersistedSnapshot(parsed);
          } catch {
            /* ignore */
          }
        });
      });
    }
  }

  private buildPersistedSnapshot(): DemoOperationsPersistedSnapshot {
    return {
      v: 1,
      orders: this.ordersState(),
      couriers: this.couriersState(),
      companies: this.companiesState(),
      applications: this.applicationsState(),
      courierBreakRequests: this.courierBreakRequestsState(),
      courierStateNotifications: this.courierStateNotificationsState(),
      courierStateNotificationLog: this.courierStateNotificationLogState(),
      courierStateFeedback: this.courierStateFeedbackState(),
      courierReceiptOverrides: this.courierReceiptOverridesState(),
      selectedOrderId: this.selectedOrderIdState(),
      companyListStatusLocked: this.companyListStatusLockedState(),
      districtZones: this.districtZonesState(),
      firmPortalGlobalSettings: this.firmPortalGlobalSettingsState(),
    };
  }

  private hydrateFromStorage(): void {
    try {
      const raw = localStorage.getItem(DEMO_OPS_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as DemoOperationsPersistedSnapshot;
      if (parsed.v !== 1 || !Array.isArray(parsed.orders) || !Array.isArray(parsed.couriers)) {
        return;
      }
      this.applyPersistedSnapshot(parsed);
    } catch {
      /* ignore */
    }
  }

  /** Eski localStorage ile çalışan demo kurulumlarına sabit sipariş setinin tamamının eklenmesi (çapraz panel senaryoları için). */
  private ensureBundledDemoOrdersPresent(): void {
    const bundled = buildBundledDemoOrders(Date.now());
    const ids = new Set(this.ordersState().map((order) => order.id));
    const missing = bundled.filter((order) => !ids.has(order.id));
    if (missing.length === 0) {
      return;
    }
    this.ordersState.update((orders) => mergeDemoCustomerPhones([...missing, ...orders]));
  }

  private applyPersistedSnapshot(parsed: DemoOperationsPersistedSnapshot): void {
    if (parsed.v !== 1) {
      return;
    }
    this.persistLocked = true;
    try {
      this.ordersState.set(mergeDemoCustomerPhones(parsed.orders));
      this.couriersState.set(mergeCourierZoneDefaults(parsed.couriers));
      this.companiesState.set(Array.isArray(parsed.companies) ? parsed.companies : []);
      this.applicationsState.set(Array.isArray(parsed.applications) ? parsed.applications : []);
      this.courierBreakRequestsState.set(
        Array.isArray(parsed.courierBreakRequests) ? parsed.courierBreakRequests : [],
      );
      this.courierStateNotificationsState.set(
        Array.isArray(parsed.courierStateNotifications) ? parsed.courierStateNotifications : [],
      );
      this.courierStateNotificationLogState.set(
        Array.isArray(parsed.courierStateNotificationLog) ? parsed.courierStateNotificationLog : [],
      );
      this.courierStateFeedbackState.set(
        parsed.courierStateFeedback && typeof parsed.courierStateFeedback === 'object'
          ? parsed.courierStateFeedback
          : {},
      );
      const sel = parsed.selectedOrderId;
      this.selectedOrderIdState.set(typeof sel === 'string' || sel === null ? sel : null);
      this.companyListStatusLockedState.set(
        parsed.companyListStatusLocked && typeof parsed.companyListStatusLocked === 'object'
          ? parsed.companyListStatusLocked
          : {},
      );
      this.courierReceiptOverridesState.set(
        parsed.courierReceiptOverrides &&
          typeof parsed.courierReceiptOverrides === 'object' &&
          parsed.courierReceiptOverrides !== null
          ? parsed.courierReceiptOverrides
          : {},
      );
      const zones = parsed.districtZones;
      this.districtZonesState.set(
        Array.isArray(zones) && zones.length > 0 ? normalizeDistrictZones(zones) : seedDistrictZones(),
      );
      const fp = parsed.firmPortalGlobalSettings;
      this.firmPortalGlobalSettingsState.set(
        normalizeFirmPortalGlobalSettings({
          ...seedFirmPortalGlobalSettings(),
          ...(typeof fp === 'object' && fp !== null ? (fp as object) : {}),
        }),
      );
    } finally {
      this.persistLocked = false;
    }
  }

  setSelectedOrder(orderId: string): void {
    this.selectedOrderIdState.set(orderId);
  }

  /**
   * Firma / yönetim / şef panellerinden tek kaynak sipariş listesine ekler.
   * Kurye atanmışsa durum doğrudan `alinacak` olur.
   */
  createManualOrder(input: CreateManualOrderInput): string {
    const customer = input.customer.trim();
    const to = input.to.trim() || '—';
    const from = input.from.trim() || 'Firma';
    if (!customer) {
      throw new Error('Müşteri adı gerekli');
    }

    let assignedCourierId: string | null = null;
    const wantCourier = input.assignedCourierId?.trim();
    if (wantCourier) {
      const c = this.couriersState().find((item) => item.id === wantCourier);
      if (c) {
        assignedCourierId = c.id;
      }
    }

    const phoneTrim = input.customerPhone?.trim() ?? '';

    const detailParts = [
      input.packageType?.trim() && `Paket: ${input.packageType!.trim()}`,
      input.paymentType?.trim() && `Ödeme: ${input.paymentType!.trim()}`,
      input.note?.trim() && `Not: ${input.note!.trim()}`,
    ].filter((p): p is string => Boolean(p));

    const id = `HP-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`;
    const nowBucket = Date.now();
    const status: OperationOrderStatus = assignedCourierId ? 'alinacak' : 'hazirlaniyor';
    const courier = assignedCourierId
      ? this.couriersState().find((item) => item.id === assignedCourierId)
      : undefined;

    const detailLine =
      detailParts.length > 0 ? detailParts.join(' · ') : 'Sipariş oluşturuldu';

    const timeline: OperationOrder['timeline'] = [];
    if (assignedCourierId && courier) {
      timeline.push(
        this.makeEvent(
          id,
          'alinacak',
          `${detailLine} — ${courier.name} atandı`,
          input.actorLabel,
        ),
      );
      timeline.push(this.makeEvent(id, 'hazirlaniyor', 'Sipariş sisteme düştü', 'Sistem'));
    } else {
      timeline.push(this.makeEvent(id, 'hazirlaniyor', detailLine, input.actorLabel));
      timeline.push(this.makeEvent(id, 'hazirlaniyor', 'Sipariş sisteme düştü', 'Sistem'));
    }

    const phone = phoneTrim || undefined;
    const order: OperationOrder = {
      id,
      customer,
      customerPhone: phone || undefined,
      from,
      to,
      firmPaymentMethod: input.paymentType?.trim() || undefined,
      status,
      assignedCourierId,
      createdAtMs: nowBucket,
      stageStartedAtMs: nowBucket,
      timeline,
    };

    this.ordersState.update((orders) => [order, ...orders]);
    return id;
  }

  assignOrder(orderId: string, courierId: string): void {
    this.ordersState.update((orders) =>
      orders.map((order) => {
        if (order.id !== orderId) {
          return order;
        }
        if (!(order.status === 'hazirlaniyor' || order.status === 'alinacak')) {
          return order;
        }
        const assigned = this.couriersState().find((c) => c.id === courierId);
        if (!assigned) {
          return order;
        }
        const event = this.makeEvent(order.id, 'alinacak', `${assigned.name} atandı`, 'Admin');
        return {
          ...order,
          status: 'alinacak',
          assignedCourierId: courierId,
          stageStartedAtMs: event.atMs,
          timeline: [event, ...order.timeline],
        };
      }),
    );
  }

  /**
   * Admin: Paketi manuel ata veya yoldaki (`dagitimda`) işi başka kuryeye ver.
   * Teslim / iptal olanlarda işlem yapılmaz.
   */
  adminAssignOrReassignCourier(orderId: string, courierId: string): void {
    const nextCourier = this.couriersState().find((c) => c.id === courierId);
    if (!nextCourier) {
      return;
    }
    this.ordersState.update((orders) =>
      orders.map((order) => {
        if (order.id !== orderId) {
          return order;
        }
        if (order.status === 'teslim-edildi' || order.status === 'iptal') {
          return order;
        }
        if (order.status === 'dagitimda') {
          if (order.assignedCourierId === courierId) {
            return order;
          }
          const prevName = this.courierName(order.assignedCourierId);
          const msg = `Admin kurye değiştirdi: ${prevName} → ${nextCourier.name}`;
          const event = this.makeEvent(order.id, 'dagitimda', msg, 'Admin');
          return {
            ...order,
            assignedCourierId: courierId,
            stageStartedAtMs: event.atMs,
            timeline: [event, ...order.timeline],
          };
        }
        if (order.status === 'hazirlaniyor' || order.status === 'alinacak') {
          const event = this.makeEvent(order.id, 'alinacak', `${nextCourier.name} atandı (Admin)`, 'Admin');
          return {
            ...order,
            status: 'alinacak',
            assignedCourierId: courierId,
            stageStartedAtMs: event.atMs,
            timeline: [event, ...order.timeline],
          };
        }
        return order;
      }),
    );
  }

  /** Demo haritada aynı teslimat bölgesindeki siparişleri kümelemek için kullanılan benzersiz anahtar. */
  mapJitterSeedForOrder(order: OperationOrder): string {
    const hits = this.matchDistrictZonesForRoutes(order.from, order.to);
    return hits[0]?.id ?? order.id;
  }

  matchDistrictZonesForRoutes(from: string, to: string): DeliveryDistrictZone[] {
    return matchZonesForAddressText(`${from} ${to}`, this.districtZonesState());
  }

  suggestCourierIdByDistrictZone(order: OperationOrder): string | null {
    const hitZoneIds = new Set(this.matchDistrictZonesForRoutes(order.from, order.to).map((z) => z.id));
    const couriers = [...this.couriersState()].sort((a, b) => a.id.localeCompare(b.id));
    const isOnline = (c: OperationCourier) => c.active && (c.state === 'online' || c.state === undefined);
    const hasOverlap = (c: OperationCourier) =>
      !!(c.zoneIds?.length && c.zoneIds.some((zid) => hitZoneIds.has(zid)));

    const a = couriers.filter((c) => isOnline(c) && hasOverlap(c))[0];
    if (a) {
      return a.id;
    }
    const b = couriers.filter((c) => c.active && hasOverlap(c))[0];
    return b?.id ?? couriers.filter((c) => isOnline(c))[0]?.id ?? null;
  }

  /** Sipariş adresine göre uygun çevrimiçi kurye varsa atanır; başarılıysa true. */
  autoAssignCourierByDistrictZone(orderId: string): boolean {
    const order = this.ordersState().find((o) => o.id === orderId);
    if (!order || order.status === 'iptal' || order.status === 'teslim-edildi') {
      return false;
    }
    const cid = this.suggestCourierIdByDistrictZone(order);
    if (!cid) {
      return false;
    }
    this.adminAssignOrReassignCourier(orderId, cid);
    return true;
  }

  adminCancelOrder(orderId: string, reason?: string): void {
    const label = reason?.trim()
      ? `Admin iptal — ${reason.trim()}`
      : 'Admin iptal etti';
    this.ordersState.update((orders) =>
      orders.map((order) => {
        if (order.id !== orderId || order.status === 'iptal') {
          return order;
        }
        const event = this.makeEvent(order.id, 'iptal', label, 'Admin');
        return {
          ...order,
          status: 'iptal',
          assignedCourierId: null,
          stageStartedAtMs: event.atMs,
          timeline: [event, ...order.timeline],
        };
      }),
    );
  }

  adminPatchOrder(orderId: string, patch: AdminOrderPatchInput): void {
    this.ordersState.update((orders) =>
      orders.map((order) => {
        if (order.id !== orderId || order.status === 'iptal') {
          return order;
        }
        const changes: string[] = [];
        let next = order;

        const applyTrim = (
          label: string,
          nextVal: string,
          prevVal: string,
          apply: () => void,
        ): void => {
          if (!nextVal || nextVal === prevVal) {
            return;
          }
          changes.push(`${label} "${nextVal}"`);
          apply();
        };

        if (patch.customer !== undefined) {
          const v = patch.customer.trim();
          applyTrim('müşteri', v, order.customer, () => {
            next = { ...next, customer: v };
          });
        }
        if (patch.customerPhone !== undefined) {
          const raw = patch.customerPhone.trim();
          if (raw === '') {
            if (next.customerPhone != null) {
              changes.push('telefon kaldırıldı');
              const { customerPhone: _, ...rest } = next;
              next = rest as OperationOrder;
            }
          } else if (raw !== (order.customerPhone ?? '')) {
            changes.push(`telefon ${raw}`);
            next = { ...next, customerPhone: raw };
          }
        }
        if (patch.from !== undefined) {
          const v = patch.from.trim();
          applyTrim('çıkış', v, order.from, () => {
            next = { ...next, from: v };
          });
        }
        if (patch.to !== undefined) {
          const v = patch.to.trim();
          applyTrim('teslim', v, order.to, () => {
            next = { ...next, to: v };
          });
        }
        if (patch.deliveryFeeTry !== undefined) {
          const d = patch.deliveryFeeTry;
          if (d === null) {
            if (order.deliveryFeeTry != null) {
              changes.push('ücret kaldırıldı');
              const { deliveryFeeTry: _, ...rest } = next;
              next = rest as OperationOrder;
            }
          } else if (typeof d === 'number' && !Number.isNaN(d) && d >= 0 && d !== order.deliveryFeeTry) {
            changes.push(`${d} ₺`);
            next = { ...next, deliveryFeeTry: d };
          }
        }

        if (changes.length === 0) {
          return order;
        }
        const event = this.makeEvent(
          orderId,
          next.status,
          `Kayıt güncellendi: ${changes.join(', ')}`,
          'Admin',
        );
        return {
          ...next,
          stageStartedAtMs: event.atMs,
          timeline: [event, ...next.timeline],
        };
      }),
    );
  }

  setCourierDistrictZones(courierId: string, zoneIds: string[]): void {
    const valid = new Set(this.districtZonesState().map((z) => z.id));
    const cleaned = [...new Set(zoneIds)].filter((z) => valid.has(z));
    this.couriersState.update((rows) =>
      rows.map((c) => (c.id === courierId ? { ...c, zoneIds: cleaned } : c)),
    );
  }

  toggleCourierDistrictZone(courierId: string, zoneId: string, enabled: boolean): void {
    const c = this.couriersState().find((item) => item.id === courierId);
    if (!c) {
      return;
    }
    const cur = new Set(c.zoneIds ?? []);
    if (enabled) {
      cur.add(zoneId);
    } else {
      cur.delete(zoneId);
    }
    this.setCourierDistrictZones(courierId, [...cur]);
  }

  addDistrictZone(displayName: string, neighborhoodsCsv: string): DeliveryDistrictZone | null {
    const name = displayName.trim();
    const neighborhoods = splitNeighborhoodCsv(neighborhoodsCsv);
    if (!name || neighborhoods.length === 0) {
      return null;
    }
    const id = `zone-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`;
    const zone: DeliveryDistrictZone = { id, name, neighborhoods };
    this.districtZonesState.update((z) => [...z, zone]);
    return zone;
  }

  appendNeighborhoodToDistrictZone(zoneId: string, neighborhood: string): void {
    const n = neighborhood.trim();
    if (!n) {
      return;
    }
    this.districtZonesState.update((zones) =>
      zones.map((z) =>
        z.id === zoneId
          ? {
              ...z,
              neighborhoods: dedupePlaces([...z.neighborhoods, n]),
            }
          : z,
      ),
    );
  }

  patchFirmPortalGlobalSettings(patch: Partial<FirmPortalGlobalSettings>): void {
    this.firmPortalGlobalSettingsState.update((prev) =>
      normalizeFirmPortalGlobalSettings({ ...structuredClone(prev), ...patch }),
    );
  }

  setFirmResponsibleContacts(contacts: ResponsibleContactPerson[]): void {
    this.patchFirmPortalGlobalSettings({ responsibleContacts: contacts });
  }

  /** Firmanın iptal etme süresinin dolup dolmadığını ve özelliği kontrol et. */
  firmCancelAllowed(order: OperationOrder | null): { ok: boolean; reason?: string } {
    if (!order || order.status === 'iptal' || order.status === 'teslim-edildi') {
      return {
        ok: false,
        reason: order?.status === 'teslim-edildi' ? 'Teslim tamamlandığı için iptal yok.' : 'İşlem uygun değil.',
      };
    }
    const s = this.firmPortalGlobalSettingsState();
    if (!s.firmCancellationEnabled) {
      return { ok: false, reason: 'Firma iptalı yönetim tarafından kapatıldı.' };
    }
    const grace = s.firmCancellationGraceMinutes;
    if (grace === null || grace < 0) {
      return { ok: true };
    }
    const elapsedMin = (Date.now() - order.createdAtMs) / 60_000;
    if (elapsedMin > grace) {
      return {
        ok: false,
        reason: `Sipariş üzerinden ${grace} dk geçti; iptal süresi doldu. Yönetimle görüşün.`,
      };
    }
    return { ok: true };
  }

  firmCancelOrderByFirm(orderId: string, reason?: string): { ok: boolean; reason?: string } {
    const order = this.ordersState().find((o) => o.id === orderId) ?? null;
    const chk = this.firmCancelAllowed(order);
    if (!chk.ok || !order) {
      return { ok: false, reason: chk.reason ?? 'İptal edilemedi.' };
    }
    const label = reason?.trim()
      ? `Firma iptal — ${reason.trim()}`
      : 'Firma siparişi iptal etti';
    const event = this.makeEvent(orderId, 'iptal', label, 'Firma');
    this.ordersState.update((orders) =>
      orders.map((o) => {
        if (o.id !== orderId || o.status === 'iptal') {
          return o;
        }
        return {
          ...o,
          status: 'iptal',
          assignedCourierId: null,
          stageStartedAtMs: event.atMs,
          timeline: [event, ...o.timeline],
        };
      }),
    );
    return { ok: true };
  }

  /** Kurye GSM — önce iletişim alanı / yoksa e-postanın local kısmı */
  courierContactDisplay(courierId: string | null | undefined): string {
    const c = courierId ? this.couriersState().find((x) => x.id === courierId) : undefined;
    if (!c) {
      return '—';
    }
    const p = c.contactPhone?.trim();
    if (p) {
      return p;
    }
    const lid = c.loginIdentifier;
    const at = lid.indexOf('@');
    return at > 0 ? lid.slice(0, at) : lid;
  }

  courierContactTelHref(courierId: string | null | undefined): string | null {
    const c = courierId ? this.couriersState().find((x) => x.id === courierId) : undefined;
    const p = c?.contactPhone?.trim();
    if (!p) {
      return null;
    }
    let d = p.replace(/\D/g, '');
    if (d.startsWith('0')) {
      d = `90${d.slice(1)}`;
    } else if (!d.startsWith('90')) {
      d = `90${d}`;
    }
    if (d.length < 12) {
      return null;
    }
    return `tel:+${d}`;
  }

  availablePoolOrders(): OperationOrder[] {
    return this.ordersState().filter(
      (order) =>
        order.assignedCourierId === null &&
        (order.status === 'hazirlaniyor' || order.status === 'alinacak'),
    );
  }

  claimOrderFromPool(orderId: string, courierId: string): void {
    this.ordersState.update((orders) =>
      orders.map((order) => {
        if (order.id !== orderId || order.assignedCourierId !== null) {
          return order;
        }
        if (!(order.status === 'hazirlaniyor' || order.status === 'alinacak')) {
          return order;
        }
        const courier = this.couriersState().find((item) => item.id === courierId);
        if (!courier) {
          return order;
        }
        const event = this.makeEvent(
          order.id,
          'alinacak',
          'Kurye görevi havuzdan aldı (Hazır)',
          'Kurye',
        );
        return {
          ...order,
          status: 'alinacak',
          assignedCourierId: courierId,
          stageStartedAtMs: event.atMs,
          timeline: [event, ...order.timeline],
        };
      }),
    );
  }

  courierProgressOrder(orderId: string, courierId: string): void {
    this.ordersState.update((orders) =>
      orders.map((order) => {
        if (order.id !== orderId || order.assignedCourierId !== courierId) {
          return order;
        }
        if (order.status === 'iptal' || order.status === 'teslim-edildi') {
          return order;
        }

        let nextStatus: OperationOrderStatus;
        let label: string;
        if (order.status === 'alinacak') {
          nextStatus = 'dagitimda';
          label = 'Kurye siparişi aldı (Alındı)';
        } else if (order.status === 'dagitimda') {
          nextStatus = 'teslim-edildi';
          label = 'Teslim edildi';
        } else {
          return order;
        }

        const event = this.makeEvent(order.id, nextStatus, label, 'Kurye');
        return {
          ...order,
          status: nextStatus,
          stageStartedAtMs: event.atMs,
          timeline: [event, ...order.timeline],
        };
      }),
    );
  }

  courierMarkPicked(orderId: string, courierId: string): void {
    this.ordersState.update((orders) =>
      orders.map((order) => {
        if (order.id !== orderId || order.assignedCourierId !== courierId) {
          return order;
        }
        if (order.status !== 'alinacak') {
          return order;
        }
        const alreadyPicked = order.timeline.some(
          (event) => event.actor === 'Kurye' && event.label === 'Paketi aldı',
        );
        if (alreadyPicked) {
          return order;
        }
        const event = this.makeEvent(order.id, 'alinacak', 'Paketi aldı', 'Kurye');
        return {
          ...order,
          stageStartedAtMs: event.atMs,
          timeline: [event, ...order.timeline],
        };
      }),
    );
  }

  courierStartDelivery(orderId: string, courierId: string): void {
    this.ordersState.update((orders) =>
      orders.map((order) => {
        if (order.id !== orderId || order.assignedCourierId !== courierId) {
          return order;
        }
        if (order.status !== 'alinacak') {
          return order;
        }
        const event = this.makeEvent(order.id, 'dagitimda', 'Yola çıktı', 'Kurye');
        return {
          ...order,
          status: 'dagitimda',
          stageStartedAtMs: event.atMs,
          timeline: [event, ...order.timeline],
        };
      }),
    );
  }

  courierCompleteDelivery(orderId: string, courierId: string): void {
    this.ordersState.update((orders) =>
      orders.map((order) => {
        if (order.id !== orderId || order.assignedCourierId !== courierId) {
          return order;
        }
        if (order.status !== 'dagitimda') {
          return order;
        }
        const event = this.makeEvent(order.id, 'teslim-edildi', 'Teslim edildi', 'Kurye');
        return {
          ...order,
          status: 'teslim-edildi',
          stageStartedAtMs: event.atMs,
          timeline: [event, ...order.timeline],
        };
      }),
    );
  }

  courierReportIssue(orderId: string, courierId: string): void {
    this.ordersState.update((orders) =>
      orders.map((order) => {
        if (order.id !== orderId || order.assignedCourierId !== courierId) {
          return order;
        }
        if (order.status === 'teslim-edildi' || order.status === 'iptal') {
          return order;
        }
        const event = this.makeEvent(order.id, 'iptal', 'Sorun bildirimi sonrası iptal edildi', 'Kurye');
        return {
          ...order,
          status: 'iptal',
          stageStartedAtMs: event.atMs,
          timeline: [event, ...order.timeline],
        };
      }),
    );
  }

  courierReturnToPool(orderId: string, courierId: string): void {
    this.ordersState.update((orders) =>
      orders.map((order) => {
        if (order.id !== orderId || order.assignedCourierId !== courierId) {
          return order;
        }
        if (order.status === 'teslim-edildi' || order.status === 'iptal') {
          return order;
        }
        const event = this.makeEvent(order.id, 'hazirlaniyor', 'Kurye görevi havuza geri attı', 'Kurye');
        return {
          ...order,
          status: 'hazirlaniyor',
          assignedCourierId: null,
          stageStartedAtMs: event.atMs,
          timeline: [event, ...order.timeline],
        };
      }),
    );
  }

  /** Teslim veya iptal tamamlandıysa: oluşturma → olay zamanı (sabit, artmaz). */
  private terminalElapsedWholeOrderSeconds(order: OperationOrder): number | null {
    if (order.status === 'teslim-edildi') {
      const deliverEv =
        [...order.timeline].filter((e) => e.type === 'teslim-edildi').sort((a, b) => b.atMs - a.atMs)[0] ??
        null;
      const endMs = deliverEv?.atMs ?? order.stageStartedAtMs;
      return Math.max(0, Math.floor((endMs - order.createdAtMs) / 1000));
    }
    if (order.status === 'iptal') {
      const cancelEv =
        [...order.timeline].filter((e) => e.type === 'iptal').sort((a, b) => b.atMs - a.atMs)[0] ?? null;
      const endMs = cancelEv?.atMs ?? order.stageStartedAtMs;
      return Math.max(0, Math.floor((endMs - order.createdAtMs) / 1000));
    }
    return null;
  }

  private formatElapsedMmSs(secFromStageOrTotal: number): string {
    const sec = Math.max(0, Math.floor(secFromStageOrTotal));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  elapsedFor(order: OperationOrder): string {
    const terminal = this.terminalElapsedWholeOrderSeconds(order);
    if (terminal !== null) {
      return this.formatElapsedMmSs(terminal);
    }
    const sec = Math.max(0, Math.floor((this.nowMs() - order.stageStartedAtMs) / 1000));
    return this.formatElapsedMmSs(sec);
  }

  /** Süre sıralaması — teslim/iptalde sabit tam süre; aksi halde mevcut aşama için canlı süre (now). */
  elapsedSeconds(order: OperationOrder): number {
    const terminal = this.terminalElapsedWholeOrderSeconds(order);
    if (terminal !== null) {
      return terminal;
    }
    return Math.max(0, Math.floor((this.nowMs() - order.stageStartedAtMs) / 1000));
  }

  statusLabel(status: OperationOrderStatus): string {
    switch (status) {
      case 'hazirlaniyor':
        return 'Hazır';
      case 'alinacak':
        return 'Alındı';
      case 'dagitimda':
        return 'Yolda';
      case 'teslim-edildi':
        return 'Teslim edildi';
      case 'iptal':
        return 'İptal';
    }
  }

  lifecycleLabel(order: OperationOrder): string {
    switch (order.status) {
      case 'hazirlaniyor':
        return 'Hazır';
      case 'alinacak':
        return 'Alındı';
      case 'dagitimda':
        return 'Yolda';
      case 'teslim-edildi':
        return 'Teslim edildi';
      case 'iptal':
        return 'İptal edildi';
    }
  }

  courierName(courierId: string | null): string {
    if (!courierId) {
      return 'Atanmadı';
    }
    return this.couriersState().find((c) => c.id === courierId)?.name ?? 'Atanmadı';
  }

  /** Cihaz araması için `tel:` URI; numara yoksa veya anlaşılmazsa null (yine de düz metin gösterilir). */
  customerPhoneTelHref(order: OperationOrder): string | null {
    const raw = order.customerPhone?.trim();
    if (!raw) {
      return null;
    }
    let d = raw.replace(/\D/g, '');
    if (!d.length) {
      return null;
    }
    if (d.startsWith('90')) {
      d = d.slice(2);
    }
    while (d.length > 10 && d.startsWith('0')) {
      d = d.slice(1);
    }
    if (d.length === 11 && d.startsWith('0')) {
      d = d.slice(1);
    }
    if (d.length !== 10 || !/^5[0-9]{9}$/.test(d)) {
      return null;
    }
    return `tel:+90${d}`;
  }

  findCourierByCredentials(identifier: string, password: string): OperationCourier | null {
    const normalized = identifier.trim().toLocaleLowerCase('tr');
    return (
      this.couriersState().find(
        (courier) =>
          courier.loginIdentifier.toLocaleLowerCase('tr') === normalized &&
          courier.loginPassword === password,
      ) ?? null
    );
  }

  findCompanyByCredentials(identifier: string, password: string): OperationCompany | null {
    const normalized = identifier.trim().toLocaleLowerCase('tr');
    return (
      this.companiesState().find(
        (company) =>
          company.loginIdentifier.toLocaleLowerCase('tr') === normalized &&
          company.loginPassword === password,
      ) ?? null
    );
  }

  approveApplication(applicationId: string): void {
    const application = this.applicationsState().find((item) => item.id === applicationId);
    if (!application || application.status !== 'bekliyor') {
      return;
    }
    this.setApplicationStatus(applicationId, 'onaylandi');
    if (application.type === 'kurye') {
      const data = application.data as CourierApplicationData;
      this.couriersState.update((couriers) => {
        const mappedId = `app-c-${applicationId}`;
        if (couriers.some((courier) => courier.id === mappedId)) {
          return couriers;
        }
        const identifier = `kurye.${applicationId}@haspaket.com`;
        return [
          ...couriers,
          {
            id: mappedId,
            name: data.name,
            active: false,
            loginIdentifier: identifier,
            loginPassword: 'Kurye123!',
          },
        ];
      });
      return;
    }
    const data = application.data as CompanyApplicationData;
    this.companiesState.update((companies) => {
      const mappedId = `app-f-${applicationId}`;
      if (companies.some((company) => company.id === mappedId)) {
        return companies;
      }
      return [
        ...companies,
        {
          id: mappedId,
          name: data.companyName,
          address: data.address,
          phone: data.phone?.trim() || '-',
          isActive: true,
          loginIdentifier: `firma.${applicationId}@haspaket.com`,
          loginPassword: 'Firma123!',
        },
      ];
    });
  }

  rejectApplication(applicationId: string): void {
    const application = this.applicationsState().find((item) => item.id === applicationId);
    if (!application || application.status !== 'bekliyor') {
      return;
    }
    this.setApplicationStatus(applicationId, 'reddedildi');
  }

  addCourierApplication(input: {
    name: string;
    phone: string;
    region: string;
    vehicleType?: string;
  }): void {
    const item: OperationApplication = {
      id: `ca-${Date.now()}`,
      type: 'kurye',
      data: {
        name: input.name.trim(),
        phone: input.phone.trim(),
        region: input.region.trim(),
        vehicleType: input.vehicleType?.trim() || undefined,
      },
      status: 'bekliyor',
      createdAt: Date.now(),
    };
    this.applicationsState.update((applications) => [item, ...applications]);
  }

  addCompanyApplication(input: {
    companyName: string;
    address: string;
    contactPerson: string;
    phone: string;
  }): void {
    const item: OperationApplication = {
      id: `fa-${Date.now()}`,
      type: 'firma',
      data: {
        companyName: input.companyName.trim(),
        address: input.address.trim(),
        contactPerson: input.contactPerson.trim(),
        phone: input.phone.trim(),
      },
      status: 'bekliyor',
      createdAt: Date.now(),
    };
    this.applicationsState.update((applications) => [item, ...applications]);
  }

  addCompanyFromAdmin(input: {
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    isActive: boolean;
  }): void {
    const id = `f-${Date.now()}`;
    this.companiesState.update((companies) => [
      {
        id,
        name: input.name.trim(),
        address: input.address.trim(),
        phone: input.phone.trim(),
        contactPerson: input.contactPerson.trim(),
        email: input.email.trim().toLocaleLowerCase('tr'),
        isActive: input.isActive,
        loginIdentifier: input.email.trim().toLocaleLowerCase('tr'),
        loginPassword: 'Firma123!',
      },
      ...companies,
    ]);
  }

  setCompanyIsActive(companyId: string, isActive: boolean): void {
    this.companiesState.update((companies) =>
      companies.map((company) =>
        company.id === companyId ? { ...company, isActive } : company,
      ),
    );
  }

  /** Liste satırından onay sonrası — durum + liste kilidi */
  applyCompanyStatusFromList(companyId: string, isActive: boolean): void {
    this.setCompanyIsActive(companyId, isActive);
    this.companyListStatusLockedState.update((locks) => ({
      ...locks,
      [companyId]: true,
    }));
  }

  isCompanyListStatusLocked(companyId: string): boolean {
    return !!this.companyListStatusLockedState()[companyId];
  }

  getCourierState(courierId: string): 'online' | 'offline' | 'break' {
    const courier = this.couriersState().find((item) => item.id === courierId);
    if (!courier) {
      return 'offline';
    }
    return courier.state ?? (courier.active ? 'online' : 'offline');
  }

  setCourierState(courierId: string, state: 'online' | 'offline' | 'break'): void {
    if (state !== 'online') {
      this.requestCourierStateChange(courierId, state === 'break' ? 'break' : 'offline');
      return;
    }
    this.couriersState.update((couriers) =>
      couriers.map((courier) =>
        courier.id === courierId
          ? {
              ...courier,
              state,
              active: state === 'online',
            }
          : courier,
      ),
    );
    this.courierBreakRequestsState.update((requests) =>
      requests.filter(
        (request) =>
          !(request.courierId === courierId && request.status === 'pending'),
      ),
    );
    this.courierStateFeedbackState.update((stateMap) => ({
      ...stateMap,
      [courierId]: 'Durumunuz Çevrimiçi olarak güncellendi.',
    }));
    this.pushCourierStateNotification({
      courierId,
      type: 'changed-online',
      message: `${this.courierName(courierId)} Çevrimiçi oldu.`,
    });
  }

  setCourierStateFromAdmin(courierId: string, state: 'online' | 'offline' | 'break'): void {
    this.couriersState.update((couriers) =>
      couriers.map((courier) =>
        courier.id === courierId
          ? {
              ...courier,
              state,
              active: state === 'online',
            }
          : courier,
      ),
    );
    this.courierBreakRequestsState.update((requests) =>
      requests.filter((request) => !(request.courierId === courierId && request.status === 'pending')),
    );
    if (state === 'online') {
      this.courierStateFeedbackState.update((stateMap) => ({
        ...stateMap,
        [courierId]: 'Durumunuz Çevrimiçi olarak güncellendi.',
      }));
      this.pushCourierStateNotification({
        courierId,
        type: 'changed-online',
        message: `${this.courierName(courierId)} Çevrimiçi oldu.`,
      });
    }
  }

  requestCourierBreak(courierId: string): void {
    this.requestCourierStateChange(courierId, 'break');
  }

  approveCourierBreakRequest(requestId: string): void {
    const request = this.courierBreakRequestsState().find((item) => item.id === requestId);
    if (!request || request.status !== 'pending') {
      return;
    }
    this.courierBreakRequestsState.update((requests) =>
      requests.map((item) => (item.id === requestId ? { ...item, status: 'approved' } : item)),
    );
    this.couriersState.update((couriers) =>
      couriers.map((courier) =>
        courier.id === request.courierId
          ? {
              ...courier,
              state: request.requestedState,
              active: false,
            }
          : courier,
      ),
    );
    this.courierStateFeedbackState.update((stateMap) => ({
      ...stateMap,
      [request.courierId]:
        request.requestedState === 'break'
          ? 'Mola talebiniz onaylandı.'
          : 'Çevrimdışı talebiniz onaylandı.',
    }));
  }

  rejectCourierBreakRequest(requestId: string): void {
    const request = this.courierBreakRequestsState().find((item) => item.id === requestId);
    if (!request || request.status !== 'pending') {
      return;
    }
    this.courierBreakRequestsState.update((requests) =>
      requests.map((item) => (item.id === requestId ? { ...item, status: 'rejected' } : item)),
    );
    this.couriersState.update((couriers) =>
      couriers.map((courier) =>
        courier.id === request.courierId
          ? {
              ...courier,
              state: request.previousState,
              active: request.previousState === 'online',
            }
          : courier,
      ),
    );
    this.courierStateFeedbackState.update((stateMap) => ({
      ...stateMap,
      [request.courierId]:
        request.requestedState === 'break'
          ? 'Mola talebiniz reddedildi.'
          : 'Çevrimdışı talebiniz reddedildi.',
    }));
  }

  requestCourierStateChange(
    courierId: string,
    requestedState: 'offline' | 'break',
    meta?: { breakReason?: string; breakDurationMin?: number },
  ): boolean {
    const current = this.getCourierState(courierId);
    if (current === requestedState) {
      return false;
    }

    let createdNewPending = false;

    this.courierBreakRequestsState.update((requests) => {
      const pending = requests.find((request) => request.courierId === courierId && request.status === 'pending');
      if (pending) {
        return requests.map((request) =>
          request.id === pending.id
            ? {
                ...request,
                requestedAtMs: Date.now(),
                requestedState,
                previousState: current === 'online' ? 'online' : 'offline',
                breakReason:
                  requestedState === 'break' ? meta?.breakReason?.trim() || undefined : undefined,
                breakDurationMin:
                  requestedState === 'break' && typeof meta?.breakDurationMin === 'number'
                    ? meta.breakDurationMin
                    : undefined,
              }
            : request,
        );
      }
      createdNewPending = true;
      const previousState: 'online' | 'offline' = current === 'online' ? 'online' : 'offline';
      return [
        {
          id: `sr-${Date.now()}-${courierId}`,
          courierId,
          status: 'pending',
          requestedAtMs: Date.now(),
          requestedState,
          previousState,
          breakReason: requestedState === 'break' ? meta?.breakReason?.trim() || undefined : undefined,
          breakDurationMin:
            requestedState === 'break' && typeof meta?.breakDurationMin === 'number'
              ? meta.breakDurationMin
              : undefined,
        },
        ...requests,
      ];
    });

    this.courierStateFeedbackState.update((stateMap) => ({
      ...stateMap,
      [courierId]:
        requestedState === 'break'
          ? 'Mola talebiniz onay bekliyor.'
          : 'Çevrimdışı talebiniz onay bekliyor.',
    }));

    if (!createdNewPending) {
      return false;
    }

    this.pushCourierStateNotification({
      courierId,
      type: requestedState === 'break' ? 'request-break' : 'request-offline',
      message:
        requestedState === 'break'
          ? `${this.courierName(courierId)} Mola talebi oluşturdu.`
          : `${this.courierName(courierId)} Çevrimdışı talebi oluşturdu.`,
    });

    return true;
  }

  latestCourierStateFeedback(courierId: string): string {
    return this.courierStateFeedbackState()[courierId] ?? '';
  }

  /** Demo fiş düzenlemeleri — kurye raporları ile paylaşılır ve localStorage’da saklanır. */
  receiptAmount(orderId: string): number {
    const overridden = this.courierReceiptOverridesState()[orderId]?.amount;
    if (typeof overridden === 'number' && Number.isFinite(overridden)) {
      return overridden;
    }
    const seed = Number(orderId.replace(/\D/g, '')) || 1;
    return 95 + (seed % 6) * 20;
  }

  receiptPaymentLabel(orderId: string): CourierReceiptPayment {
    const overridden = this.courierReceiptOverridesState()[orderId]?.payment;
    if (overridden) {
      return overridden;
    }
    return Number(orderId.replace(/\D/g, '')) % 2 === 0 ? 'Kart' : 'Nakit';
  }

  setCourierReceiptOverride(orderId: string, patch: CourierReceiptOverride): void {
    this.courierReceiptOverridesState.update((m) => ({
      ...m,
      [orderId]: {
        ...(m[orderId] ?? {}),
        ...patch,
      },
    }));
  }

  paymentDisplayLabel(order: OperationOrder): string {
    return this.rawPaymentFieldFromOrder(order) ?? this.receiptPaymentLabel(order.id);
  }

  receiptPaymentBucket(order: OperationOrder): 'nakit' | 'kart' | 'diger' {
    const raw = this.rawPaymentFieldFromOrder(order);
    if (raw) {
      const s = raw.toLowerCase();
      if (/(nakit|cash|nakıt)/i.test(s)) {
        return 'nakit';
      }
      if (/(kart|card|kredi|credit|pos)/i.test(s)) {
        return 'kart';
      }
      return 'diger';
    }
    return this.bucketFromReceiptPaymentLabel(this.receiptPaymentLabel(order.id));
  }

  /** Hazır (ör. firma çıkış) zaman damgası — timeline'da hazirlaniyor kaydı veya oluşturma. */
  orderReadyAtMs(order: OperationOrder): number {
    const events = [...order.timeline].sort((a, b) => a.atMs - b.atMs);
    const ready = events.find((e) => e.type === 'hazirlaniyor');
    return ready?.atMs ?? order.createdAtMs;
  }

  /**
   * Teslim edilmiş görev süre özeti — dakika.
   * Firmadayım ≈ ilk / son alınacak (timeline), Yola ≈ dagitimda.
   */
  courierDeliveryTimingBreakdown(order: OperationOrder): {
    totalMin: number | null;
    createdToPickupMin: number | null;
    firmToRoadMin: number | null;
    roadToDeliverMin: number | null;
  } {
    if (order.status !== 'teslim-edildi') {
      return { totalMin: null, createdToPickupMin: null, firmToRoadMin: null, roadToDeliverMin: null };
    }
    const events = [...order.timeline].sort((a, b) => a.atMs - b.atMs);
    const pickupEv =
      [...events].filter((e) => e.type === 'alinacak').sort((a, b) => b.atMs - a.atMs)[0] ??
      [...events].find((e) => e.type === 'alinacak');
    const deliverEv =
      [...events].filter((e) => e.type === 'teslim-edildi').sort((a, b) => b.atMs - a.atMs)[0] ??
      [...events].find((e) => e.type === 'teslim-edildi');
    const roadEv = events.find((e) => e.type === 'dagitimda');

    let totalMin: number | null = null;
    let createdToPickupMin: number | null = null;
    let firmToRoadMin: number | null = null;
    let roadToDeliverMin: number | null = null;

    if (pickupEv) {
      createdToPickupMin = Math.max(0, Math.round((pickupEv.atMs - order.createdAtMs) / 60_000));
    }
    if (deliverEv) {
      totalMin = Math.max(1, Math.round((deliverEv.atMs - order.createdAtMs) / 60_000));
    }
    if (pickupEv && roadEv && roadEv.atMs >= pickupEv.atMs) {
      firmToRoadMin = Math.round((roadEv.atMs - pickupEv.atMs) / 60_000);
    }
    if (roadEv && deliverEv && deliverEv.atMs >= roadEv.atMs) {
      roadToDeliverMin = Math.round((deliverEv.atMs - roadEv.atMs) / 60_000);
    }
    return { totalMin, createdToPickupMin, firmToRoadMin, roadToDeliverMin };
  }

  private rawPaymentFieldFromOrder(order: OperationOrder): string | null {
    if (order.firmPaymentMethod?.trim()) {
      return order.firmPaymentMethod.trim();
    }
    const extended = order as OperationOrder & {
      paymentMethod?: unknown;
      paymentType?: unknown;
      odeme?: unknown;
    };
    for (const key of ['paymentMethod', 'paymentType', 'odeme'] as const) {
      const v = extended[key];
      if (typeof v === 'string' && v.trim()) {
        return v.trim();
      }
    }
    return null;
  }

  private bucketFromReceiptPaymentLabel(p: CourierReceiptPayment): 'nakit' | 'kart' | 'diger' {
    if (p === 'Nakit') {
      return 'nakit';
    }
    if (p === 'Kart' || p === 'Kapıda Yemek Kartı' || p === 'Online Yemek Kartı') {
      return 'kart';
    }
    return 'diger';
  }

  setApplicationStatus(applicationId: string, status: OperationApplication['status']): void {
    this.applicationsState.update((applications) =>
      applications.map((application) => {
        if (application.id !== applicationId) {
          return application;
        }
        if (application.status === 'onaylandi' || application.status === 'reddedildi') {
          return application;
        }
        return { ...application, status };
      }),
    );
  }

  private makeEvent(
    orderId: string,
    type: OperationOrderStatus,
    label: string,
    actor: string,
  ): OperationOrder['timeline'][number] {
    return {
      id: `${orderId}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      orderId,
      type,
      label,
      actor,
      atMs: Date.now(),
    };
  }

  private pushCourierStateNotification(input: {
    courierId: string;
    type: CourierStateNotification['type'];
    message: string;
  }): void {
    const notification: CourierStateNotification = {
      id: `sn-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      courierId: input.courierId,
      type: input.type,
      message: input.message,
      createdAtMs: Date.now(),
    };
    this.courierStateNotificationsState.update((items) => {
      const nextItems = [notification, ...items];
      if (nextItems.length <= COURIER_NOTIFICATION_VISIBLE_LIMIT) {
        return nextItems;
      }
      const visibleItems = nextItems.slice(0, COURIER_NOTIFICATION_VISIBLE_LIMIT);
      const archivedItems = nextItems.slice(COURIER_NOTIFICATION_VISIBLE_LIMIT);
      this.courierStateNotificationLogState.update((logItems) =>
        [...archivedItems, ...logItems].slice(0, COURIER_NOTIFICATION_LOG_LIMIT),
      );
      return visibleItems;
    });
  }
}

function normalizeRouteKey(s: string): string {
  return s
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Mahalle anahtarı — ASCII yaklaşımıyla eşleştirme */
function asciiFoldTr(s: string): string {
  return normalizeRouteKey(s)
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ı/g, 'i');
}

function dedupePlaces(places: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of places) {
    const trimmed = p.trim();
    if (!trimmed) {
      continue;
    }
    const k = asciiFoldTr(trimmed);
    if (!k || seen.has(k)) {
      continue;
    }
    seen.add(k);
    out.push(trimmed);
  }
  return out;
}

function splitNeighborhoodCsv(csv: string): string[] {
  return dedupePlaces(csv.split(/[,;/]+/).map((s) => s.trim()));
}

function matchZonesForAddressText(routeText: string, zones: DeliveryDistrictZone[]): DeliveryDistrictZone[] {
  const hay = asciiFoldTr(routeText);
  if (!hay) {
    return [];
  }
  const hits: DeliveryDistrictZone[] = [];
  const seen = new Set<string>();
  for (const z of zones) {
    for (const n of z.neighborhoods) {
      const nk = asciiFoldTr(n);
      if (nk.length < 3) {
        continue;
      }
      if (hay.includes(nk)) {
        if (!seen.has(z.id)) {
          seen.add(z.id);
          hits.push(z);
        }
        break;
      }
    }
  }
  return hits;
}

function normalizeDistrictZones(raw: unknown): DeliveryDistrictZone[] {
  if (!Array.isArray(raw)) {
    return seedDistrictZones();
  }
  const out: DeliveryDistrictZone[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const rec = item as Record<string, unknown>;
    const idVal = rec['id'];
    const id = typeof idVal === 'string' ? idVal.trim() : '';
    const nameVal = rec['name'];
    const name = typeof nameVal === 'string' ? nameVal.trim() : '';
    let neighborhoods: string[] = [];
    const rawN = rec['neighborhoods'];
    if (Array.isArray(rawN)) {
      neighborhoods = dedupePlaces(
        rawN.flatMap((n) =>
          typeof n === 'string' ? [n.trim()] : [],
        ),
      );
    }
    if (id && name && neighborhoods.length) {
      out.push({ id, name, neighborhoods });
    }
  }
  return out.length ? out : seedDistrictZones();
}

function seedFirmPortalGlobalSettings(): FirmPortalGlobalSettings {
  return {
    responsibleContacts: [
      { id: 'rcp-1', name: 'Ali Yılmaz', phone: '0533 111 22 33', roleLabel: 'Kurye şefi' },
      { id: 'rcp-2', name: 'Ahmet Demir', phone: '0532 644 88 99', roleLabel: 'Operasyon sorumlusu' },
    ],
    firmCancellationEnabled: true,
    firmCancellationGraceMinutes: 45,
  };
}

function normalizeFirmPortalGlobalSettings(
  raw: Partial<FirmPortalGlobalSettings> | Record<string, unknown>,
): FirmPortalGlobalSettings {
  const seed = seedFirmPortalGlobalSettings();
  const r = raw as Record<string, unknown>;
  let firmCancellationEnabled = seed.firmCancellationEnabled;
  if (typeof r['firmCancellationEnabled'] === 'boolean') {
    firmCancellationEnabled = r['firmCancellationEnabled'] as boolean;
  } else if (typeof (raw as FirmPortalGlobalSettings).firmCancellationEnabled === 'boolean') {
    firmCancellationEnabled = (raw as FirmPortalGlobalSettings).firmCancellationEnabled;
  }
  let firmCancellationGraceMinutes = seed.firmCancellationGraceMinutes;
  const gDirect = (raw as FirmPortalGlobalSettings).firmCancellationGraceMinutes;
  const gRec = r['firmCancellationGraceMinutes'];
  if (gDirect !== undefined || gRec !== undefined) {
    const gv = gDirect !== undefined ? gDirect : gRec;
    if (gv === null) {
      firmCancellationGraceMinutes = null;
    } else if (typeof gv === 'number' && Number.isFinite(gv) && gv >= 0) {
      firmCancellationGraceMinutes = gv;
    }
  }
  let responsibleContacts = seed.responsibleContacts;
  const arr = (raw as FirmPortalGlobalSettings).responsibleContacts ?? r['responsibleContacts'];
  if (Array.isArray(arr)) {
    const next: ResponsibleContactPerson[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      if (!item || typeof item !== 'object') {
        continue;
      }
      const o = item as unknown as Record<string, unknown>;
      const idRaw = o['id'];
      let id =
        typeof idRaw === 'string' && idRaw.trim() ? idRaw.trim() : `rcp-${Date.now()}-${i}`;
      if (seen.has(id)) {
        id = `${id}-x${i}`;
      }
      seen.add(id);
      const name = typeof o['name'] === 'string' ? o['name'].trim() : '';
      const phone = typeof o['phone'] === 'string' ? o['phone'].trim() : '';
      const roleLbl = o['roleLabel'];
      const roleLabel =
        typeof roleLbl === 'string' && roleLbl.trim() ? roleLbl.trim() : undefined;
      if (name && phone) {
        next.push({ id, name, phone, roleLabel });
      }
    }
    if (next.length) {
      responsibleContacts = next;
    }
  }
  return {
    responsibleContacts,
    firmCancellationEnabled,
    firmCancellationGraceMinutes,
  };
}

const DEFAULT_COURIER_ZONE_IDS = new Map<string, string[]>([
  ['c-1', ['zone-anadolu-1', 'zone-anadolu-2']],
  ['c-2', ['zone-avrupa-is', 'zone-avrupa-sahil']],
  ['c-3', ['zone-avrupa-is']],
  ['c-4', []],
]);

const DEFAULT_COURIER_CONTACT_PHONE = new Map<string, string>([
  ['c-1', '0532 900 01 01'],
  ['c-2', '0533 411 22 33'],
  ['c-3', '0542 300 44 55'],
]);

function mergeCourierZoneDefaults(couriers: OperationCourier[]): OperationCourier[] {
  return couriers.map((c) => ({
    ...c,
    zoneIds: c.zoneIds && c.zoneIds.length > 0 ? c.zoneIds : [...(DEFAULT_COURIER_ZONE_IDS.get(c.id) ?? [])],
    contactPhone: c.contactPhone?.trim()
      ? c.contactPhone.trim()
      : DEFAULT_COURIER_CONTACT_PHONE.get(c.id),
  }));
}

function seedDistrictZones(): DeliveryDistrictZone[] {
  return [
    {
      id: 'zone-anadolu-1',
      name: 'Anadolu — Kadıköy & Moda & Üsküdar',
      neighborhoods: dedupePlaces([
        'Kadıköy',
        'Kadikoy',
        'Moda',
        'Üsküdar',
        'Uskudar',
        'Ümraniye',
        'Umraniye',
      ]),
    },
    {
      id: 'zone-anadolu-2',
      name: 'Anadolu — Bostancı & Maltepe',
      neighborhoods: dedupePlaces(['Bostancı', 'Bostanci', 'Maltepe']),
    },
    {
      id: 'zone-avrupa-is',
      name: 'Avrupa iç — Levent, Şişli, Karaköy',
      neighborhoods: dedupePlaces([
        'Levent',
        'Mecidiyeköy',
        'Mecidiyekoy',
        'Şişli',
        'Sisli',
        'Ataşehir',
        'Atasehir',
        'Karaköy',
        'Karakoy',
        'Kabataş',
        'Kabatas',
        'Taksim',
        'Cihangir',
      ]),
    },
    {
      id: 'zone-avrupa-sahil',
      name: 'Avrupa sahil — Beşiktaş & Sarıyer',
      neighborhoods: dedupePlaces([
        'Beşiktaş',
        'Besiktas',
        'Sarıyer',
        'Sariyer',
        'Maslak',
      ]),
    },
  ];
}

function seedCouriers(): OperationCourier[] {
  return [
    {
      id: 'c-1',
      name: 'Ali Kurye',
      active: true,
      state: 'online',
      loginIdentifier: 'kurye@haspaket.com',
      loginPassword: 'Kurye123!',
      zoneIds: [...(DEFAULT_COURIER_ZONE_IDS.get('c-1') ?? [])],
    },
    {
      id: 'c-2',
      name: 'Mehmet Y.',
      active: true,
      state: 'online',
      loginIdentifier: 'courier.mehmet@haspaket.com',
      loginPassword: 'Kurye123!',
      zoneIds: [...(DEFAULT_COURIER_ZONE_IDS.get('c-2') ?? [])],
    },
    {
      id: 'c-3',
      name: 'Can D.',
      active: true,
      state: 'online',
      loginIdentifier: 'courier.can@haspaket.com',
      loginPassword: 'Kurye123!',
      zoneIds: [...(DEFAULT_COURIER_ZONE_IDS.get('c-3') ?? [])],
    },
    {
      id: 'c-4',
      name: 'Emre S.',
      active: false,
      state: 'offline',
      loginIdentifier: 'courier.emre@haspaket.com',
      loginPassword: 'Kurye123!',
      zoneIds: [...(DEFAULT_COURIER_ZONE_IDS.get('c-4') ?? [])],
    },
  ];
}

function seedCompanies(): OperationCompany[] {
  return [
    {
      id: 'f-1',
      name: 'Moda Doner',
      address: 'Kadikoy / Istanbul',
      phone: '+90 216 100 20 30',
      loginIdentifier: 'firma.moda@haspaket.com',
      loginPassword: 'Firma123!',
    },
    {
      id: 'f-2',
      name: 'Atasehir Lunch',
      address: 'Atasehir / Istanbul',
      phone: '+90 216 400 10 10',
      loginIdentifier: 'firma.atasehir@haspaket.com',
      loginPassword: 'Firma123!',
    },
  ];
}

function seedApplications(): OperationApplication[] {
  return [
    {
      id: 'ca-1',
      type: 'kurye',
      data: {
        name: 'Burak T.',
        phone: '+90 555 300 11 22',
        region: 'Kadikoy',
        vehicleType: 'Motosiklet',
      },
      status: 'bekliyor',
      createdAt: Date.now() - 7 * 60_000,
    },
    {
      id: 'ca-2',
      type: 'kurye',
      data: {
        name: 'Selim A.',
        phone: '+90 555 441 82 90',
        region: 'Besiktas',
        vehicleType: 'Arac',
      },
      status: 'bekliyor',
      createdAt: Date.now() - 22 * 60_000,
    },
    {
      id: 'fa-1',
      type: 'firma',
      data: {
        companyName: 'Nefis Burger',
        address: 'Sisli / Istanbul',
        contactPerson: 'Ece Demir',
        phone: '+90 212 111 12 13',
      },
      status: 'bekliyor',
      createdAt: Date.now() - 12 * 60_000,
    },
    {
      id: 'fa-2',
      type: 'firma',
      data: {
        companyName: 'Lezzet Duragi',
        address: 'Uskudar / Istanbul',
        contactPerson: 'Can Kaya',
        phone: '+90 216 222 90 00',
      },
      status: 'reddedildi',
      createdAt: Date.now() - 33 * 60_000,
    },
  ];
}

function seedOrders(): OperationOrder[] {
  return buildBundledDemoOrders(Date.now());
}

/** Paylaşılan demo siparişleri — tek kaynak; sıfır state ve eski persisted snapshot birleştirmesi aynı kümeye yakınsar. */
function buildBundledDemoOrders(now: number): OperationOrder[] {
  const t101a = now - 5 * 60_000 - 1200;
  const t101b = now - 8 * 60_000 - 3400;
  const t103a = now - 4 * 60_000 - 900;
  const t103b = now - 18 * 60_000 - 2100;
  const t104a = now - 6 * 60_000 - 800;
  const t104b = now - 22 * 60_000 - 4500;
  const t105a = now - 9 * 60_000 - 600;
  const t105b = now - 16 * 60_000 - 3200;
  const t106a = now - 12 * 60_000 - 500;
  const t106b = now - 28 * 60_000 - 1800;

  return [
    {
      id: 'HP-DEMO-101',
      customer: 'Bostancı Balıkçısı',
      customerPhone: '0532 611 01 01',
      from: 'Bostancı',
      to: 'Maltepe',
      status: 'hazirlaniyor',
      assignedCourierId: null,
      createdAtMs: now - 8 * 60_000,
      stageStartedAtMs: now - 5 * 60_000,
      timeline: [
        mk('HP-DEMO-101', 'hazirlaniyor', 'Hazırlanıyor — mutfakta', 'Firma', t101a),
        mk('HP-DEMO-101', 'hazirlaniyor', 'Sipariş sisteme düştü', 'Sistem', t101b),
      ],
    },
    {
      id: 'HP-DEMO-103',
      customer: 'Levent Cafe',
      customerPhone: '0532 611 01 03',
      from: 'Levent',
      to: 'Mecidiyeköy',
      status: 'alinacak',
      assignedCourierId: null,
      createdAtMs: now - 32 * 60_000,
      stageStartedAtMs: now - 4 * 60_000,
      timeline: [
        mk(
          'HP-DEMO-103',
          'alinacak',
          'Hazır — kurye atanması veya havuzdan alım bekliyor',
          'Firma',
          t103a,
        ),
        mk(
          'HP-DEMO-103',
          'hazirlaniyor',
          'Mutfaktan çıktı, paketlendi',
          'Firma',
          t103b,
        ),
      ],
    },
    {
      id: 'HP-DEMO-104',
      customer: 'Sarıyer Organik',
      customerPhone: '0532 611 01 04',
      from: 'Sarıyer',
      to: 'Maslak',
      status: 'alinacak',
      assignedCourierId: 'c-1',
      createdAtMs: now - 40 * 60_000,
      stageStartedAtMs: now - 6 * 60_000,
      timeline: [
        mk(
          'HP-DEMO-104',
          'alinacak',
          'Kuryeye atandı — restorandan alım bekleniyor',
          'Admin',
          t104a,
        ),
        mk(
          'HP-DEMO-104',
          'alinacak',
          'Paket teslime hazır (yola çıkmadı)',
          'Firma',
          t104b,
        ),
      ],
    },
    {
      id: 'HP-DEMO-105',
      customer: 'Karaköy Tost',
      customerPhone: '0532 611 01 05',
      from: 'Karaköy',
      to: 'Kabataş',
      status: 'dagitimda',
      assignedCourierId: 'c-1',
      createdAtMs: now - 55 * 60_000,
      stageStartedAtMs: now - 9 * 60_000,
      timeline: [
        mk('HP-DEMO-105', 'dagitimda', 'Yolda — dağıtımda', 'Kurye', t105a),
        mk(
          'HP-DEMO-105',
          'alinacak',
          'Firmadayım olarak işaretlendi → yola çıkıldı',
          'Kurye',
          t105b,
        ),
      ],
    },
    {
      id: 'HP-DEMO-106',
      customer: 'Cihangir Pasta',
      customerPhone: '0532 611 01 06',
      from: 'Cihangir',
      to: 'Taksim',
      status: 'teslim-edildi',
      assignedCourierId: 'c-1',
      createdAtMs: now - 180 * 60_000,
      stageStartedAtMs: now - 12 * 60_000,
      timeline: [
        mk(
          'HP-DEMO-106',
          'teslim-edildi',
          'Teslim edildi — teslim tamamlandı',
          'Kurye',
          t106a,
        ),
        mk('HP-DEMO-106', 'dagitimda', 'Yola çıktı', 'Kurye', t106b),
      ],
    },
    {
      id: 'HP-5102',
      customer: 'Kadıköy Market',
      customerPhone: '0532 611 51 02',
      from: 'Kadıköy',
      to: 'Üsküdar',
      status: 'alinacak',
      assignedCourierId: 'c-1',
      createdAtMs: now - 46 * 60_000,
      stageStartedAtMs: now - 12 * 60_000,
      timeline: [
        mk('HP-5102', 'alinacak', 'Kurye atandı ve alım bekleniyor', 'Admin', now - 12 * 60_000),
        mk('HP-5102', 'hazirlaniyor', 'Sipariş hazırlandı', 'Firma', now - 19 * 60_000),
      ],
    },
    {
      id: 'HP-5108',
      customer: 'Moda Cafe',
      customerPhone: '0532 611 51 08',
      from: 'Kadıköy',
      to: 'Beşiktaş',
      status: 'hazirlaniyor',
      assignedCourierId: null,
      createdAtMs: now - 18 * 60_000,
      stageStartedAtMs: now - 7 * 60_000,
      timeline: [mk('HP-5108', 'hazirlaniyor', 'Hazırlık başladı', 'Firma', now - 7 * 60_000)],
    },
    {
      id: 'HP-5098',
      customer: 'Ataşehir Ofis',
      customerPhone: '0532 611 50 98',
      from: 'Ataşehir',
      to: 'Şişli',
      status: 'dagitimda',
      assignedCourierId: 'c-2',
      createdAtMs: now - 71 * 60_000,
      stageStartedAtMs: now - 28 * 60_000,
      timeline: [
        mk('HP-5098', 'dagitimda', 'Dağıtıma çıktı', 'Kurye', now - 28 * 60_000),
        mk('HP-5098', 'alinacak', 'Restorandan alındı', 'Kurye', now - 39 * 60_000),
      ],
    },
    {
      id: 'HP-5091',
      customer: 'Üsküdar Eczane',
      customerPhone: '0532 611 50 91',
      from: 'Üsküdar',
      to: 'Ümraniye',
      status: 'teslim-edildi',
      assignedCourierId: 'c-3',
      createdAtMs: now - 122 * 60_000,
      stageStartedAtMs: now - 9 * 60_000,
      timeline: [
        mk('HP-5091', 'teslim-edildi', 'Teslimat tamamlandı', 'Kurye', now - 9 * 60_000),
        mk('HP-5091', 'dagitimda', 'Dağıtıma çıktı', 'Kurye', now - 31 * 60_000),
      ],
    },
  ];
}

let demoCustomerPhonesByOrderId: Map<string, string> | undefined;

function getDemoCustomerPhonesByOrderId(): Map<string, string> {
  if (!demoCustomerPhonesByOrderId) {
    demoCustomerPhonesByOrderId = new Map();
    for (const o of buildBundledDemoOrders(0)) {
      if (o.customerPhone) {
        demoCustomerPhonesByOrderId.set(o.id, o.customerPhone);
      }
    }
  }
  return demoCustomerPhonesByOrderId;
}

function mergeDemoCustomerPhones(orders: OperationOrder[]): OperationOrder[] {
  const map = getDemoCustomerPhonesByOrderId();
  return orders.map((order) => ({
    ...order,
    customerPhone: order.customerPhone ?? map.get(order.id),
  }));
}

function mk(
  orderId: string,
  type: OperationOrderStatus,
  label: string,
  actor: string,
  atMs: number,
) {
  return {
    id: `${orderId}-${atMs}`,
    orderId,
    type,
    label,
    actor,
    atMs,
  };
}
