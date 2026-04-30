import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DemoOperationsFacade } from '../../../core/operations/demo-operations.facade';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';

type ListStatusConfirm = {
  companyId: string;
  companyName: string;
  targetActive: boolean;
};

@Component({
  selector: 'hp-admin-firmalar-page',
  standalone: true,
  imports: [HpPanelCardComponent, RouterLink],
  templateUrl: './admin-firmalar-page.component.html',
  styleUrl: './admin-firmalar-page.component.scss',
})
export class AdminFirmalarPageComponent {
  protected readonly ops = inject(DemoOperationsFacade);

  readonly selectedId = signal<string | null>(null);
  readonly listConfirm = signal<ListStatusConfirm | null>(null);

  readonly companies = computed(() =>
    this.ops.companies().map((company) => ({
      ...company,
      isActive: company.isActive ?? true,
    })),
  );

  readonly selectedCompany = computed(() => {
    const selectedId = this.selectedId();
    const rows = this.companies();
    if (!rows.length) {
      return null;
    }
    if (!selectedId) {
      return rows[0];
    }
    return rows.find((row) => row.id === selectedId) ?? rows[0];
  });

  selectCompany(companyId: string): void {
    this.selectedId.set(companyId);
  }

  requestListStatusChange(event: Event, company: { id: string; name: string; isActive: boolean }): void {
    event.stopPropagation();
    if (this.ops.isCompanyListStatusLocked(company.id)) {
      return;
    }
    this.listConfirm.set({
      companyId: company.id,
      companyName: company.name,
      targetActive: !company.isActive,
    });
  }

  closeListConfirm(): void {
    this.listConfirm.set(null);
  }

  applyListConfirm(): void {
    const pending = this.listConfirm();
    if (!pending) {
      return;
    }
    this.ops.applyCompanyStatusFromList(pending.companyId, pending.targetActive);
    this.listConfirm.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscapeClose(): void {
    if (this.listConfirm()) {
      this.closeListConfirm();
    }
  }
}
