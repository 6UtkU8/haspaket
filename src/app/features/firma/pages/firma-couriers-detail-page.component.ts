import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DemoOperationsFacade } from '../../../core/operations/demo-operations.facade';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';

@Component({
  selector: 'hp-firma-couriers-detail-page',
  standalone: true,
  imports: [HpPanelCardComponent],
  templateUrl: './firma-couriers-detail-page.component.html',
  styleUrl: './firma-couriers-detail-page.component.scss',
})
export class FirmaCouriersDetailPageComponent {
  private readonly ops = inject(DemoOperationsFacade);
  private readonly route = inject(ActivatedRoute);

  readonly courierId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly courier = computed(
    () => this.ops.couriers().find((c) => c.id === this.courierId) ?? null,
  );

  readonly activeTaskCount = computed(
    () =>
      this.ops
        .orders()
        .filter(
          (o) =>
            o.assignedCourierId === this.courierId &&
            o.status !== 'teslim-edildi' &&
            o.status !== 'iptal',
        ).length,
  );

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

  readonly performanceBadges = computed(() => {
    const count = this.activeTaskCount();
    return [
      { label: 'Dakiklik', value: count > 0 ? 'Yüksek' : 'Orta' },
      { label: 'Teslim Başarısı', value: '%96' },
      { label: 'Müşteri Puanı', value: '4.8/5' },
    ] as const;
  });
}
