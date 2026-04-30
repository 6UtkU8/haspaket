import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DemoOperationsFacade } from '../../../core/operations/demo-operations.facade';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';

type DetailTab = 'genel' | 'siparis' | 'kuryeler';

type DetailStatusConfirm = {
  targetActive: boolean;
};

@Component({
  selector: 'hp-admin-firmalar-detail-page',
  standalone: true,
  imports: [HpPanelCardComponent],
  templateUrl: './admin-firmalar-detail-page.component.html',
  styleUrl: './admin-firmalar-detail-page.component.scss',
})
export class AdminFirmalarDetailPageComponent {
  protected readonly ops = inject(DemoOperationsFacade);
  private readonly route = inject(ActivatedRoute);

  readonly activeTab = signal<DetailTab>('genel');
  readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly detailConfirm = signal<DetailStatusConfirm | null>(null);

  readonly company = computed(() =>
    this.ops.companies().find((item) => item.id === this.companyId) ?? null,
  );
  readonly isActive = computed(() => this.company()?.isActive ?? true);

  readonly orderSummary = computed(() => {
    const orders = this.ops.orders();
    const companyName = (this.company()?.name ?? '').toLocaleLowerCase('tr');
    const related = orders.filter((order) =>
      order.customer.toLocaleLowerCase('tr').includes(companyName),
    );
    const source = related.length ? related : orders;
    return {
      total: source.length,
      active: source.filter((o) => o.status !== 'teslim-edildi' && o.status !== 'iptal').length,
      delivered: source.filter((o) => o.status === 'teslim-edildi').length,
      cancelled: source.filter((o) => o.status === 'iptal').length,
    };
  });

  readonly courierPreview = computed(() =>
    this.ops
      .couriers()
      .slice(0, 5)
      .map((courier) => ({
        id: courier.id,
        name: courier.name,
        status: courier.active ? 'Aktif' : 'Pasif',
      })),
  );

  setTab(tab: DetailTab): void {
    this.activeTab.set(tab);
  }

  requestDetailStatusChange(targetActive: boolean): void {
    const firma = this.company();
    if (!firma) {
      return;
    }
    const active = firma.isActive ?? true;
    if ((targetActive && active) || (!targetActive && !active)) {
      return;
    }
    this.detailConfirm.set({ targetActive });
  }

  closeDetailConfirm(): void {
    this.detailConfirm.set(null);
  }

  applyDetailConfirm(): void {
    const pending = this.detailConfirm();
    if (!pending) {
      return;
    }
    this.ops.setCompanyIsActive(this.companyId, pending.targetActive);
    this.detailConfirm.set(null);
  }
}
