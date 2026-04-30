import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { DemoOperationsFacade } from '../../core/operations/demo-operations.facade';
import { HpSelectComponent, HpSelectOption } from '../ui/hp-select.component';
import { HpToastService } from '../ui/hp-toast.service';

export type ManualOrderFormSkin = 'firma' | 'admin' | 'plain';

let manualOrderUid = 0;

@Component({
  selector: 'hp-manual-order-form',
  standalone: true,
  imports: [HpSelectComponent],
  templateUrl: './hp-manual-order-form.component.html',
  styleUrl: './hp-manual-order-form.component.scss',
})
export class HpManualOrderFormComponent {
  private readonly ops = inject(DemoOperationsFacade);
  private readonly toast = inject(HpToastService);

  /** Zaman çizelgesinde ve olay kayıtlarında kullanılan etiket */
  readonly actorLabel = input.required<string>();
  readonly skin = input<ManualOrderFormSkin>('plain');

  readonly cancelClick = output<void>();
  readonly saved = output<{ id: string }>();

  private readonly uidNum = manualOrderUid++;
  readonly nameId = `hp-mo-${this.uidNum}-name`;
  readonly phoneId = `hp-mo-${this.uidNum}-phone`;
  readonly addrId = `hp-mo-${this.uidNum}-addr`;
  readonly noteId = `hp-mo-${this.uidNum}-note`;

  readonly packageTypes = ['Küçük', 'Orta', 'Büyük'] as const;
  readonly paymentTypes = ['Nakit', 'Kart', 'Online'] as const;

  readonly packageTypeOptions: HpSelectOption[] = this.packageTypes.map((p) => ({
    value: p,
    label: p,
  }));
  readonly paymentTypeOptions: HpSelectOption[] = this.paymentTypes.map((p) => ({
    value: p,
    label: p,
  }));

  readonly courierSelectOptions = computed<HpSelectOption[]>(() => [
    { value: '', label: 'Tercih yok · sistem otomatik ataması' },
    ...this.ops.couriers().map((c) => ({
      value: c.id,
      label: `${c.name} — ${HpManualOrderFormComponent.courierStateLabel(c.state, c.active)}`,
    })),
  ]);

  readonly orderCustomerName = signal('');
  readonly orderPhone = signal('');
  readonly orderAddress = signal('');
  readonly orderNote = signal('');
  readonly orderPackageType = signal<string>(this.packageTypes[1]);
  readonly orderPaymentType = signal<string>(this.paymentTypes[0]);
  readonly orderCourierId = signal<string>(this.pickDefaultCourierId());

  constructor() {
    effect(() => {
      const allowed = new Set(this.ops.couriers().map((c) => c.id));
      allowed.add('');
      const cur = this.orderCourierId();
      if (!allowed.has(cur)) {
        this.orderCourierId.set(this.pickDefaultCourierId());
      }
    });
  }

  readonly buttonGhostClass = computed(() => {
    switch (this.skin()) {
      case 'firma':
        return 'hp-firma__drawer-btn hp-firma__drawer-btn--ghost';
      case 'admin':
        return 'hp-admin__modal-btn hp-admin__modal-btn--ghost';
      default:
        return 'hp-manual-order__btn hp-manual-order__btn--ghost';
    }
  });

  readonly buttonPrimaryClass = computed(() => {
    switch (this.skin()) {
      case 'firma':
        return 'hp-firma__drawer-btn hp-firma__drawer-btn--primary';
      case 'admin':
        return 'hp-admin__modal-btn hp-admin__modal-btn--primary';
      default:
        return 'hp-manual-order__btn hp-manual-order__btn--primary';
    }
  });

  /** GSM: en fazla 11 rakam (örn. 05321112233 veya 5321112233). */
  readonly phoneMaxDigits = 11;

  cancel(): void {
    this.resetFields();
    this.cancelClick.emit();
  }

  /** Telefon: yalnızca rakam, en fazla {@link phoneMaxDigits} hane. */
  setPhoneDigitsFromInput(raw: string): void {
    const digits = raw.replace(/\D/g, '').slice(0, this.phoneMaxDigits);
    this.orderPhone.set(digits);
  }

  onPhoneKeydown(ev: KeyboardEvent): void {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) {
      return;
    }
    if (
      ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(ev.key)
    ) {
      return;
    }
    if (/^\d$/.test(ev.key)) {
      const el = ev.target as HTMLInputElement | null;
      if (!el || typeof el.selectionStart !== 'number') {
        return;
      }
      const digits = el.value.replace(/\D/g, '');
      const a = el.selectionStart;
      const b = el.selectionEnd ?? a;
      const replacing = b !== a;
      if (!replacing && digits.length >= this.phoneMaxDigits) {
        ev.preventDefault();
      }
      return;
    }
    ev.preventDefault();
  }

  save(): void {
    const customer = this.orderCustomerName().trim();
    const to = this.orderAddress().trim();
    if (!customer || !to) {
      this.toast.show('Eksik bilgi', 'Müşteri adı ve adres zorunlu.', 2600);
      return;
    }

    let courierPick = this.orderCourierId().trim();
    const allowedCourier = new Set(this.ops.couriers().map((c) => c.id));
    if (courierPick && !allowedCourier.has(courierPick)) {
      courierPick = '';
    }

    try {
      const id = this.ops.createManualOrder({
        customer,
        customerPhone: this.orderPhone().trim() || undefined,
        from: 'Firma çıkış',
        to,
        assignedCourierId: courierPick ? courierPick : null,
        packageType: this.orderPackageType(),
        paymentType: this.orderPaymentType(),
        note: this.orderNote().trim() || undefined,
        actorLabel: this.actorLabel(),
      });
      this.resetFieldsAfterSave();
      this.saved.emit({ id });
    } catch {
      /* createManualOrder sadece boş müşteri için — form zaten filtreliyor */
    }
  }

  resetForReuse(): void {
    this.resetFieldsAfterSave();
  }

  /** Drawer üstten kapatıldığında (backdrop, X) iç formu sıfırlar */
  hardReset(): void {
    this.resetFields();
  }

  private pickDefaultCourierId(): string {
    const list = this.ops.couriers();
    if (!list.length) {
      return '';
    }
    return list.find((c) => c.active)?.id ?? list[0].id;
  }

  private resetFields(): void {
    this.orderCustomerName.set('');
    this.orderPhone.set('');
    this.orderAddress.set('');
    this.orderNote.set('');
    this.orderPackageType.set(this.packageTypes[1]);
    this.orderPaymentType.set(this.paymentTypes[0]);
    this.orderCourierId.set(this.pickDefaultCourierId());
  }

  private resetFieldsAfterSave(): void {
    this.resetFields();
  }

  private static courierStateLabel(
    state: 'online' | 'offline' | 'break' | undefined,
    active: boolean,
  ): string {
    switch (state) {
      case 'online':
        return 'Çevrimiçi';
      case 'break':
        return 'Mola';
      case 'offline':
        return 'Çevrimdışı';
      default:
        return active ? 'Aktif' : 'Kapalı';
    }
  }
}
