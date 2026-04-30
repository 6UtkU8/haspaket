import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DemoOperationsFacade } from '../../../core/operations/demo-operations.facade';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';

@Component({
  selector: 'hp-courier-tasks-detail-page',
  standalone: true,
  imports: [HpPanelCardComponent, DatePipe],
  templateUrl: './courier-tasks-detail-page.component.html',
  styleUrl: './courier-tasks-detail-page.component.scss',
})
export class CourierTasksDetailPageComponent {
  readonly ops = inject(DemoOperationsFacade);
  private readonly route = inject(ActivatedRoute);

  readonly orderId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly order = computed(() => this.ops.orders().find((o) => o.id === this.orderId) ?? null);
  readonly infoMessage = signal('');

  actionMock(label: string): void {
    this.infoMessage.set(`${label} islemi uygulandi (mock).`);
    setTimeout(() => this.infoMessage.set(''), 1800);
  }
}
