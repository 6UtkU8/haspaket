import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DemoOperationsFacade } from '../../../core/operations/demo-operations.facade';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';

type CourierFilter = 'all' | 'active' | 'offline';

@Component({
  selector: 'hp-firma-couriers-page',
  standalone: true,
  imports: [HpPanelCardComponent, FormsModule, RouterLink],
  templateUrl: './firma-couriers-page.component.html',
  styleUrl: './firma-couriers-page.component.scss',
})
export class FirmaCouriersPageComponent {
  private readonly ops = inject(DemoOperationsFacade);

  readonly q = signal('');
  readonly filter = signal<CourierFilter>('all');

  private readonly regionMap: Record<string, string> = {
    'c-1': 'Kadıköy',
    'c-2': 'Şişli',
    'c-3': 'Üsküdar',
    'c-4': 'Ataşehir',
  };

  private readonly scoreMap: Record<string, number> = {
    'c-1': 96,
    'c-2': 93,
    'c-3': 91,
    'c-4': 88,
  };

  readonly couriers = computed(() =>
    this.ops.couriers().map((c) => {
      const activeDeliveries = this.ops
        .orders()
        .filter(
          (o) =>
            o.assignedCourierId === c.id &&
            o.status !== 'teslim-edildi' &&
            o.status !== 'iptal',
        ).length;
      return {
        ...c,
        activeDeliveries,
        region: this.regionMap[c.id] ?? 'Bölge atanmadı',
        score: this.scoreMap[c.id] ?? 90,
      };
    }),
  );

  readonly filtered = computed(() => {
    const q = this.q().trim().toLocaleLowerCase('tr');
    const f = this.filter();
    return this.couriers().filter((c) => {
      if (f === 'active' && !c.active) {
        return false;
      }
      if (f === 'offline' && c.active) {
        return false;
      }
      if (!q) {
        return true;
      }
      const hay = `${c.name} ${c.region}`.toLocaleLowerCase('tr');
      return hay.includes(q);
    });
  });
}
