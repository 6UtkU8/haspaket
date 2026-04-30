import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HpManualOrderFormComponent } from '../../../shared/manual-order/hp-manual-order-form.component';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';
import { HpToastService } from '../../../shared/ui/hp-toast.service';

@Component({
  selector: 'hp-firma-orders-new-page',
  standalone: true,
  imports: [HpPanelCardComponent, RouterLink, HpManualOrderFormComponent],
  templateUrl: './firma-orders-new-page.component.html',
  styleUrl: './firma-orders-new-page.component.scss',
})
export class FirmaOrdersNewPageComponent {
  private readonly router = inject(Router);
  private readonly toast = inject(HpToastService);

  navigateToOrders(): void {
    void this.router.navigate(['/firma/siparisler']);
  }

  onSaved(ev: { id: string }): void {
    this.toast.show('Sipariş oluşturuldu', ev.id, 2400);
    void this.router.navigate(['/firma/siparisler']);
  }
}
