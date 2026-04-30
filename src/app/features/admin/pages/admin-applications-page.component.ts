import { Component, computed, inject } from '@angular/core';
import { DemoOperationsFacade } from '../../../core/operations/demo-operations.facade';
import {
  ApplicationStatus,
  CompanyApplicationData,
  CourierApplicationData,
} from '../../../core/operations/operations.types';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';

@Component({
  selector: 'hp-admin-applications-page',
  standalone: true,
  imports: [HpPanelCardComponent],
  templateUrl: './admin-applications-page.component.html',
  styleUrl: './admin-applications-page.component.scss',
})
export class AdminApplicationsPageComponent {
  private readonly ops = inject(DemoOperationsFacade);

  readonly courierApplications = computed(() =>
    this.ops.courierApplications().map((application) => ({
      ...application,
      data: application.data as CourierApplicationData,
    })),
  );
  readonly companyApplications = computed(() =>
    this.ops.companyApplications().map((application) => ({
      ...application,
      data: application.data as CompanyApplicationData,
    })),
  );
  readonly approvedCouriers = computed(() =>
    this.ops.couriers().filter((courier) => courier.id.startsWith('app-c-')),
  );
  readonly approvedCompanies = computed(() =>
    this.ops.companies().filter((company) => company.id.startsWith('app-f-')),
  );

  setCourierStatus(applicationId: string, status: ApplicationStatus): void {
    if (status === 'onaylandi') {
      this.ops.approveApplication(applicationId);
    } else if (status === 'reddedildi') {
      this.ops.rejectApplication(applicationId);
    } else {
      this.ops.setApplicationStatus(applicationId, status);
    }
  }

  setCompanyStatus(applicationId: string, status: ApplicationStatus): void {
    if (status === 'onaylandi') {
      this.ops.approveApplication(applicationId);
    } else if (status === 'reddedildi') {
      this.ops.rejectApplication(applicationId);
    } else {
      this.ops.setApplicationStatus(applicationId, status);
    }
  }

  badgeLabel(status: ApplicationStatus): string {
    if (status === 'onaylandi') {
      return 'Onaylandı';
    }
    if (status === 'reddedildi') {
      return 'Reddedildi';
    }
    return 'Bekliyor';
  }
}
