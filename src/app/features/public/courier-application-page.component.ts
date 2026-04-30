import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DemoOperationsFacade } from '../../core/operations/demo-operations.facade';

@Component({
  selector: 'hp-courier-application-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './courier-application-page.component.html',
  styleUrl: './courier-application-page.component.scss',
})
export class CourierApplicationPageComponent {
  private readonly ops = inject(DemoOperationsFacade);

  readonly name = signal('');
  readonly phone = signal('');
  readonly region = signal('');
  readonly vehicleType = signal('');
  readonly successMessage = signal('');

  submit(): void {
    if (!this.name().trim() || !this.phone().trim() || !this.region().trim()) {
      return;
    }
    this.ops.addCourierApplication({
      name: this.name(),
      phone: this.phone(),
      region: this.region(),
      vehicleType: this.vehicleType(),
    });
    this.name.set('');
    this.phone.set('');
    this.region.set('');
    this.vehicleType.set('');
    this.successMessage.set('Başvurunuz alındı. Durum: Bekliyor.');
    setTimeout(() => this.successMessage.set(''), 2200);
  }
}
