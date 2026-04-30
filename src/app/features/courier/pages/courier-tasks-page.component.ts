import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DemoOperationsFacade } from '../../../core/operations/demo-operations.facade';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';

@Component({
  selector: 'hp-courier-tasks-page',
  standalone: true,
  imports: [HpPanelCardComponent, DatePipe, RouterLink],
  templateUrl: './courier-tasks-page.component.html',
  styleUrl: './courier-tasks-page.component.scss',
})
export class CourierTasksPageComponent {
  readonly ops = inject(DemoOperationsFacade);
  private readonly courierId = 'c-1';

  readonly selectedId = signal<string | null>(null);

  readonly tasks = computed(() =>
    this.ops
      .orders()
      .filter(
        (o) =>
          o.assignedCourierId === this.courierId &&
          o.status !== 'teslim-edildi' &&
          o.status !== 'iptal',
      ),
  );

  readonly selected = computed(() => {
    const id = this.selectedId();
    if (!id) {
      return this.tasks()[0] ?? null;
    }
    return this.tasks().find((t) => t.id === id) ?? this.tasks()[0] ?? null;
  });

  readonly doneTasks = computed(() =>
    this.ops
      .orders()
      .filter((o) => o.assignedCourierId === this.courierId && o.status === 'teslim-edildi').length,
  );

  selectTask(id: string): void {
    this.selectedId.set(id);
  }

  progressSelected(): void {
    const order = this.selected();
    if (!order) {
      return;
    }
    this.ops.courierProgressOrder(order.id, this.courierId);
  }
}
