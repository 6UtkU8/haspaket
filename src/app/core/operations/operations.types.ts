export type OperationOrderStatus =
  | 'hazirlaniyor'
  | 'alinacak'
  | 'dagitimda'
  | 'teslim-edildi'
  | 'iptal';

export interface OperationTimelineEvent {
  id: string;
  orderId: string;
  type: OperationOrderStatus;
  label: string;
  actor: string;
  atMs: number;
}

/** Firma / admin / şef panelinden manuel sipariş oluşturma (demo facade) */
export interface CreateManualOrderInput {
  customer: string;
  customerPhone?: string;
  /** Çıkış lokasyonu — boşsa "Firma" */
  from: string;
  /** Teslimat adresi */
  to: string;
  assignedCourierId: string | null;
  packageType?: string;
  paymentType?: string;
  note?: string;
  /** Zaman çizelgesi satırında gösterilir (Firma / Admin / Operasyon Şefi vb.) */
  actorLabel: string;
}

export interface OperationOrder {
  id: string;
  customer: string;
  /** Müşteri GSM / sabit — kurye araması için (demo ve gerçek entegrasyon) */
  customerPhone?: string;
  from: string;
  to: string;
  /** Teslimat ücreti (₺) — admin düzenleyebilir */
  deliveryFeeTry?: number;
  status: OperationOrderStatus;
  assignedCourierId: string | null;
  createdAtMs: number;
  stageStartedAtMs: number;
  timeline: OperationTimelineEvent[];
  /** Firma panelinde ödeme metodu gösterimi (sipariş oluşturma vb.) */
  firmPaymentMethod?: string;
}

export interface ResponsibleContactPerson {
  id: string;
  name: string;
  phone: string;
  /** örn: Kurye şefi */
  roleLabel?: string;
}

/** Admin tarafından yönetilen, tüm firma panellerinde paylaşılan ayarlar (demo facade) */
export interface FirmPortalGlobalSettings {
  responsibleContacts: ResponsibleContactPerson[];
  /** Firma iptal düğmesi görünsün mü */
  firmCancellationEnabled: boolean;
  /** Sipariş oluşturulduktan bu kadar dakika içinde firma iptal edebilir. null = süre sınırı yok. */
  firmCancellationGraceMinutes: number | null;
}

/** Mahalle / semt adlarını gruplayarak tek bölgede otomatik atama için kullanılır */
export interface DeliveryDistrictZone {
  id: string;
  name: string;
  neighborhoods: string[];
}

export interface OperationCourier {
  id: string;
  name: string;
  active: boolean;
  state?: 'online' | 'offline' | 'break';
  loginIdentifier: string;
  loginPassword: string;
  /** Kuryenin görev aldığı bölge kimlikleri — {@link DeliveryDistrictZone} ile eşleşir */
  zoneIds?: string[];
  /** Firma için kuryeye ulaşım GSM (tel:) */
  contactPhone?: string;
}

/** Admin panelinden sipariş kaydı güncelleme */
export interface AdminOrderPatchInput {
  customer?: string;
  customerPhone?: string;
  from?: string;
  to?: string;
  /** null: alanı sıfırla */
  deliveryFeeTry?: number | null;
}

export interface CourierBreakRequest {
  id: string;
  courierId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAtMs: number;
  requestedState: 'offline' | 'break';
  previousState: 'online' | 'offline';
  breakReason?: string;
  breakDurationMin?: number;
}

export interface CourierStateNotification {
  id: string;
  courierId: string;
  type: 'request-break' | 'request-offline' | 'changed-online';
  message: string;
  createdAtMs: number;
}

/** Fiş / rapor için kurye tarafından düzenlenebilir demo ödeme-tutar geçersiz kılma */
export type CourierReceiptPayment =
  | 'Nakit'
  | 'Kart'
  | 'Online Ödeme'
  | 'Ücretsiz'
  | 'Restorana Havale'
  | 'Kapıda Yemek Kartı'
  | 'Online Yemek Kartı';

export interface CourierReceiptOverride {
  amount?: number;
  payment?: CourierReceiptPayment;
}

/** localStorage + cross-tab sync snapshot for {@link DemoOperationsFacade} */
export interface DemoOperationsPersistedSnapshot {
  v: 1;
  orders: OperationOrder[];
  couriers: OperationCourier[];
  companies: OperationCompany[];
  applications: OperationApplication[];
  courierBreakRequests: CourierBreakRequest[];
  courierStateNotifications: CourierStateNotification[];
  courierStateNotificationLog?: CourierStateNotification[];
  courierStateFeedback: Record<string, string>;
  selectedOrderId: string | null;
  /** Firma listesi satırından onaylanan durum — tekrar liste üzerinden değiştirmeyi kilitler */
  companyListStatusLocked?: Record<string, boolean>;
  courierReceiptOverrides?: Record<string, CourierReceiptOverride>;
  /** Çıkış / teslimat adres metinlerinden eşlenen teslimat bölgeleri */
  districtZones?: DeliveryDistrictZone[];
  firmPortalGlobalSettings?: FirmPortalGlobalSettings;
}

export type ApplicationStatus = 'bekliyor' | 'onaylandi' | 'reddedildi';

export type ApplicationType = 'kurye' | 'firma';

export interface CourierApplicationData {
  name: string;
  phone: string;
  region: string;
  vehicleType?: string;
}

export interface CompanyApplicationData {
  companyName: string;
  address: string;
  contactPerson: string;
  phone?: string;
}

export interface OperationApplication {
  id: string;
  type: ApplicationType;
  data: CourierApplicationData | CompanyApplicationData;
  status: ApplicationStatus;
  createdAt: number;
}

export interface OperationCompany {
  id: string;
  name: string;
  address: string;
  phone: string;
  contactPerson?: string;
  email?: string;
  isActive?: boolean;
  loginIdentifier: string;
  loginPassword: string;
  /** Firma için kuryeye ulaşım GSM (tel: bağlantıları) */
  contactPhone?: string;
}
