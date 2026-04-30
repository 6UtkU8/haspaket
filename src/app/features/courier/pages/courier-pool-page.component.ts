import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DemoOperationsFacade } from '../../../core/operations/demo-operations.facade';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';

type PoolFilter = 'all' | 'nearby' | 'priority' | 'new';

@Component({
  selector: 'hp-courier-pool-page',
  standalone: true,
  imports: [HpPanelCardComponent, RouterLink],
  templateUrl: './courier-pool-page.component.html',
  styleUrl: './courier-pool-page.component.scss',
})
export class CourierPoolPageComponent {
  readonly ops = inject(DemoOperationsFacade);
  private readonly courierId = 'c-1';

  readonly filter = signal<PoolFilter>('all');

  readonly poolOrders = computed(() => {
    const currentFilter = this.filter();
    return this.ops.availablePoolOrders().filter((order) => {
      if (currentFilter === 'nearby') {
        return order.from.includes('Kadıköy') || order.from.includes('Kadikoy');
      }
      if (currentFilter === 'priority') {
        return this.getPriority(order.id) !== 'Normal';
      }
      if (currentFilter === 'new') {
        return Date.now() - order.createdAtMs < 20 * 60_000;
      }
      return true;
    });
  });

  setFilter(value: PoolFilter): void {
    this.filter.set(value);
  }

  mapSearchUrl(address: string): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
  }

  openInMaps(address: string): void {
    const query = address.trim();
    if (!query) {
      return;
    }
    window.open(this.mapSearchUrl(query), '_blank', 'noopener,noreferrer');
  }

  claimOrder(orderId: string): void {
    this.ops.claimOrderFromPool(orderId, this.courierId);
  }

  getPriority(orderId: string): 'Acil' | 'Yuksek' | 'Normal' {
    const seed = Number.parseInt(orderId.replace(/\D/g, ''), 10) % 3;
    if (seed === 0) {
      return 'Acil';
    }
    if (seed === 1) {
      return 'Yuksek';
    }
    return 'Normal';
  }

  priorityClass(orderId: string): string {
    const priority = this.getPriority(orderId);
    if (priority === 'Acil') {
      return 'hp-cpool__badge--priority-urgent';
    }
    if (priority === 'Yuksek') {
      return 'hp-cpool__badge--priority-high';
    }
    return 'hp-cpool__badge--priority-normal';
  }
}
