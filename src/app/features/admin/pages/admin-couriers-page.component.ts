import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DemoOperationsFacade } from '../../../core/operations/demo-operations.facade';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';

type CourierFilter = 'all' | 'active' | 'offline';

@Component({
  selector: 'hp-admin-couriers-page',
  standalone: true,
  imports: [HpPanelCardComponent, FormsModule, RouterLink, DatePipe],
  templateUrl: './admin-couriers-page.component.html',
  styleUrl: './admin-couriers-page.component.scss',
})
export class AdminCouriersPageComponent {
  private readonly ops = inject(DemoOperationsFacade);

  readonly q = signal('');
  readonly filter = signal<CourierFilter>('all');

  readonly rows = computed(() =>
    this.ops.couriers().map((c) => {
      const activeOrders = this.ops.orders().filter(
        (o) =>
          o.assignedCourierId === c.id &&
          o.status !== 'teslim-edildi' &&
          o.status !== 'iptal',
      );
      return {
        ...c,
        state: this.ops.getCourierState(c.id),
        breakPending: this.ops
          .pendingCourierBreakRequests()
          .some((request) => request.courierId === c.id),
        activeDeliveries: activeOrders.length,
        currentOrders: activeOrders.map((o) => o.id).join(', ') || '-',
      };
    }),
  );

  readonly pendingStateRequests = computed(() =>
    this.ops.pendingCourierBreakRequests(),
  );

  readonly stateNotifications = computed(() =>
    this.ops.courierStateNotifications().map((item) => ({
      ...item,
      courierName:
        this.ops.couriers().find((courier) => courier.id === item.courierId)
          ?.name ?? item.courierId,
    })),
  );

  readonly recentStateNotifications = computed(() =>
    this.stateNotifications().slice(0, 10),
  );

  readonly filtered = computed(() => {
    const q = this.q().trim().toLocaleLowerCase('tr');
    const f = this.filter();
    return this.rows().filter((r) => {
      if (f === 'active' && r.state !== 'online') {
        return false;
      }
      if (f === 'offline' && r.state === 'online') {
        return false;
      }
      if (!q) {
        return true;
      }
      return `${r.name} ${r.currentOrders}`
        .toLocaleLowerCase('tr')
        .includes(q);
    });
  });

  stateLabel(state: 'online' | 'offline' | 'break'): string {
    if (state === 'online') {
      return 'Çevrimiçi';
    }
    if (state === 'break') {
      return 'Molada';
    }
    return 'Çevrimdışı';
  }

  approveBreak(requestId: string): void {
    this.ops.approveCourierBreakRequest(requestId);
  }

  rejectBreak(requestId: string): void {
    this.ops.rejectCourierBreakRequest(requestId);
  }

  setCourierState(
    courierId: string,
    state: 'online' | 'offline' | 'break',
  ): void {
    this.ops.setCourierStateFromAdmin(courierId, state);
  }

  requestLabel(state: 'offline' | 'break'): string {
    return state === 'break' ? 'Mola' : 'İzin';
  }

  courierName(courierId: string): string {
    return (
      this.ops.couriers().find((courier) => courier.id === courierId)?.name ??
      courierId
    );
  }

  requestCurrentStatus(courierId: string): string {
    return this.stateLabel(this.ops.getCourierState(courierId));
  }

  requestMeta(request: {
    breakReason?: string;
    breakDurationMin?: number;
    requestedState: 'offline' | 'break';
  }): string {
    if (request.requestedState !== 'break') {
      return 'Admin onayı bekleniyor';
    }
    const reason = request.breakReason?.trim() || 'Belirtilmedi';
    const duration =
      typeof request.breakDurationMin === 'number'
        ? `${request.breakDurationMin} dk`
        : '?';
    return `${reason} · ${duration}`;
  }
}
