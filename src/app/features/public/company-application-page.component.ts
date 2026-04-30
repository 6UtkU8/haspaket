import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DemoOperationsFacade } from '../../core/operations/demo-operations.facade';

@Component({
  selector: 'hp-company-application-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './company-application-page.component.html',
  styleUrl: './company-application-page.component.scss',
})
export class CompanyApplicationPageComponent {
  private readonly ops = inject(DemoOperationsFacade);

  readonly companyName = signal('');
  readonly address = signal('');
  readonly contactPerson = signal('');
  readonly phone = signal('');
  readonly successMessage = signal('');

  submit(): void {
    if (
      !this.companyName().trim() ||
      !this.address().trim() ||
      !this.contactPerson().trim() ||
      !this.phone().trim()
    ) {
      return;
    }
    this.ops.addCompanyApplication({
      companyName: this.companyName(),
      address: this.address(),
      contactPerson: this.contactPerson(),
      phone: this.phone(),
    });
    this.companyName.set('');
    this.address.set('');
    this.contactPerson.set('');
    this.phone.set('');
    this.successMessage.set('Başvurunuz alındı. Durum: Bekliyor.');
    setTimeout(() => this.successMessage.set(''), 2200);
  }
}
