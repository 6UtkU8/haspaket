import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DemoOperationsFacade } from '../../../core/operations/demo-operations.facade';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';

@Component({
  selector: 'hp-admin-couriers-detail-page',
  standalone: true,
  imports: [HpPanelCardComponent, DatePipe],
  templateUrl: './admin-couriers-detail-page.component.html',
  styleUrl: './admin-couriers-detail-page.component.scss',
})
export class AdminCouriersDetailPageComponent {
  public readonly ops = inject(DemoOperationsFacade);
  private readonly route = inject(ActivatedRoute);

  readonly courierId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly courier = computed(
    () => this.ops.couriers().find((c) => c.id === this.courierId) ?? null,
  );

  readonly stateLabel = computed(() => {
    const state = this.ops.getCourierState(this.courierId);
    if (state === 'break') {
      return 'Molada';
    }
    if (state === 'offline') {
      return 'Çevrimdışı';
    }
    return 'Çevrimiçi';
  });

  readonly activeTasks = computed(() =>
    this.ops
      .orders()
      .filter(
        (o) =>
          o.assignedCourierId === this.courierId &&
          o.status !== 'teslim-edildi' &&
          o.status !== 'iptal',
      ),
  );

  readonly timeline = computed(() => {
    const events = this.ops
      .orders()
      .filter((o) => o.assignedCourierId === this.courierId)
      .flatMap((o) => o.timeline.map((ev) => ({ ...ev, orderId: o.id })))
      .sort((a, b) => b.atMs - a.atMs);
    return events.slice(0, 6);
  });

  readonly region = computed(() => {
    const map: Record<string, string> = {
      'c-1': 'Kadıköy',
      'c-2': 'Şişli',
      'c-3': 'Üsküdar',
      'c-4': 'Ataşehir',
    };
    return map[this.courierId] ?? 'Atanmadı';
  });

  readonly phone = computed(() => {
    const map: Record<string, string> = {
      'c-1': '+90 555 100 00 01',
      'c-2': '+90 555 100 00 02',
      'c-3': '+90 555 100 00 03',
      'c-4': '+90 555 100 00 04',
    };
    return map[this.courierId] ?? '-';
  });
}
