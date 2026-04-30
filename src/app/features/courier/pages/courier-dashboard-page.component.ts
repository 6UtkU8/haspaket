import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { DatePipe, NgClass, isPlatformBrowser } from '@angular/common';
import { Component, HostListener, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DemoAuthService } from '../../../core/auth/demo-auth.service';
import { DemoOperationsFacade } from '../../../core/operations/demo-operations.facade';
import { OperationOrder, OperationOrderStatus } from '../../../core/operations/operations.types';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';
import { CourierSettingsService } from '../settings/courier-settings.service';

const ASSIGNED_SORT_KEY = 'haspaket_courier_assigned_sort_v1';
const MANUAL_ORDER_KEY = 'haspaket_courier_assigned_manual_order_v1';

/** Atanan paketler sıralaması — localStorage değeriyle uyumlu. */
export type CourierAssignedSortOption =
  | 'newest-added'
  | 'oldest-added'
  | 'elapsed-asc'
  | 'elapsed-desc'
  | 'route-zone'
  | 'status-sort'
  | 'manuel-siralama';

const SORT_OPTIONS_LIST: CourierAssignedSortOption[] = [
  'newest-added',
  'oldest-added',
  'elapsed-asc',
  'elapsed-desc',
  'route-zone',
  'status-sort',
  'manuel-siralama',
];

function normalizeStoredSort(raw: string | null): CourierAssignedSortOption {
  if (raw && (SORT_OPTIONS_LIST as string[]).includes(raw)) {
    return raw as CourierAssignedSortOption;
  }
  return 'newest-added';
}

@Component({
  selector: 'hp-courier-dashboard-page',
  standalone: true,
  imports: [HpPanelCardComponent, DatePipe, NgClass, FormsModule, DragDropModule],
  templateUrl: './courier-dashboard-page.component.html',
  styleUrl: './courier-dashboard-page.component.scss',
})
export class CourierDashboardPageComponent {
  private readonly auth = inject(DemoAuthService);
  private readonly ops = inject(DemoOperationsFacade);
  private readonly courierSettings = inject(CourierSettingsService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly courierId = computed(() => {
    const sessionCourierId = this.auth.sessionReadonly()?.userId ?? '';
    if (this.ops.couriers().some((courier) => courier.id === sessionCourierId)) {
      return sessionCourierId;
    }
    return this.ops.couriers()[0]?.id ?? 'c-1';
  });
  readonly selectedId = signal<string | null>(null);
  readonly deliveryConfirmTaskId = signal<string | null>(null);

  /** Sorun / iptal akışı: menu → onay */
  readonly issueFlowStep = signal<'idle' | 'menu' | 'confirm'>('idle');
  readonly issueChoice = signal<'report' | 'cancel' | null>(null);
  readonly issueTaskId = signal<string | null>(null);

  readonly issueConfirmBody = computed(() => {
    const choice = this.issueChoice();
    if (choice === 'report') {
      return 'Sorun bildirimi ile paket iptal edilecek.';
    }
    if (choice === 'cancel') {
      return 'Paket iptal durumuna alınacak.';
    }
    return '';
  });

  readonly activeTasks = computed(() =>
    this.ops
      .orders()
      .filter(
        (o) =>
          o.assignedCourierId === this.courierId() &&
          o.status !== 'teslim-edildi' &&
          o.status !== 'iptal',
      ),
  );

  readonly sortOption = signal<CourierAssignedSortOption>('newest-added');

  readonly sortedActiveTasks = computed(() => this.sortAssignedOrders([...this.activeTasks()]));

  readonly selectedTask = computed(() => {
    const id = this.selectedId();
    const list = this.sortedActiveTasks();
    if (!id) {
      return list[0] ?? null;
    }
    return list.find((task) => task.id === id) ?? list[0] ?? null;
  });
  readonly lastCompletedTask = computed(
    () =>
      this.ops
        .orders()
        .filter((o) => o.assignedCourierId === this.courierId() && o.status === 'teslim-edildi')
        .sort((a, b) => b.stageStartedAtMs - a.stageStartedAtMs)[0] ?? null,
  );
  readonly doneCount = computed(
    () =>
      this.ops
        .orders()
        .filter((o) => o.assignedCourierId === this.courierId() && o.status === 'teslim-edildi')
        .length,
  );
  readonly selectedTimeline = computed(() => this.selectedTask()?.timeline ?? []);
  readonly canMarkPicked = computed(() => this.selectedTask()?.status === 'alinacak');

  readonly statusLabel = this.ops.statusLabel.bind(this.ops);
  readonly elapsedFor = this.ops.elapsedFor.bind(this.ops);

  customerPhoneTelHref(order: OperationOrder): string | null {
    return this.ops.customerPhoneTelHref(order);
  }

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.sortOption.set(normalizeStoredSort(localStorage.getItem(ASSIGNED_SORT_KEY)));
    }
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

  customerPhone(orderId: string): string {
    const suffix = ((Number(orderId.replace(/\D/g, '')) || 0) + 1000).toString().slice(-4);
    return `+90 555 12${suffix}`;
  }

  /** Ayarlarda telefon paylaşımı kapalıysa arama linki gösterilmez. */
  readonly showCustomerPhoneLink = this.courierSettings.showPhone;

  selectTask(taskId: string): void {
    this.selectedId.set(taskId);
  }

  isTaskSelected(taskId: string): boolean {
    return this.selectedTask()?.id === taskId;
  }

  markPicked(): void {
    const task = this.selectedTask();
    if (!task) {
      return;
    }
    this.ops.courierMarkPicked(task.id, this.courierId());
  }

  startDelivery(taskId?: string): void {
    const task = taskId ? this.activeTasks().find((item) => item.id === taskId) : this.selectedTask();
    if (!task) {
      return;
    }
    this.ops.courierStartDelivery(task.id, this.courierId());
  }

  completeDelivery(taskId?: string): void {
    const task = taskId ? this.activeTasks().find((item) => item.id === taskId) : this.selectedTask();
    if (!task) {
      return;
    }
    this.deliveryConfirmTaskId.set(task.id);
  }

  cancelDeliveryConfirm(): void {
    this.deliveryConfirmTaskId.set(null);
  }

  approveDeliveryConfirm(): void {
    const taskId = this.deliveryConfirmTaskId();
    if (!taskId) {
      return;
    }
    const task = this.activeTasks().find((item) => item.id === taskId);
    if (!task) {
      this.deliveryConfirmTaskId.set(null);
      return;
    }
    this.ops.courierCompleteDelivery(task.id, this.courierId());
    this.deliveryConfirmTaskId.set(null);
  }

  openIssueFlow(): void {
    if (!this.selectedTask()) {
      return;
    }
    this.issueChoice.set(null);
    this.issueTaskId.set(null);
    this.issueFlowStep.set('menu');
  }

  closeIssueFlow(): void {
    this.issueFlowStep.set('idle');
    this.issueChoice.set(null);
    this.issueTaskId.set(null);
  }

  selectIssueOption(kind: 'report' | 'cancel'): void {
    const task = this.selectedTask();
    if (!task) {
      this.closeIssueFlow();
      return;
    }
    this.issueTaskId.set(task.id);
    this.issueChoice.set(kind);
    this.issueFlowStep.set('confirm');
  }

  confirmIssueAction(): void {
    const taskId = this.issueTaskId() ?? this.selectedTask()?.id;
    if (!taskId) {
      this.closeIssueFlow();
      return;
    }
    const task = this.activeTasks().find((item) => item.id === taskId);
    if (!task) {
      this.closeIssueFlow();
      return;
    }
    this.ops.courierReportIssue(task.id, this.courierId());
    this.closeIssueFlow();
  }

  @HostListener('document:keydown.escape')
  onEscapeIssueFlow(): void {
    if (this.issueFlowStep() !== 'idle') {
      this.closeIssueFlow();
    }
  }

  throwToPool(taskId: string): void {
    this.ops.courierReturnToPool(taskId, this.courierId());
    if (this.selectedId() === taskId) {
      this.selectedId.set(null);
    }
  }

  packageChipModifier(status: OperationOrderStatus): string {
    switch (status) {
      case 'hazirlaniyor':
        return 'hp-cdash__chip--prep';
      case 'alinacak':
        return 'hp-cdash__chip--pickup';
      case 'dagitimda':
        return 'hp-cdash__chip--transit';
      case 'teslim-edildi':
        return 'hp-cdash__chip--done';
      case 'iptal':
        return 'hp-cdash__chip--cancel';
      default:
        return '';
    }
  }

  completionLabel(taskId: string): string {
    const completed = this.ops
      .orders()
      .find((order) => order.id === taskId && order.status === 'teslim-edildi');
    return completed ? new Date(completed.stageStartedAtMs).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
  }

  setSortOption(value: string): void {
    const next = normalizeStoredSort(value.trim() || null);
    this.sortOption.set(next);
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(ASSIGNED_SORT_KEY, next);
      } catch {
        /* ignore quota */
      }
    }
  }

  private sortAssignedOrders(rows: OperationOrder[]): OperationOrder[] {
    const opt = this.sortOption();
    if (opt === 'manuel-siralama') {
      return this.applyManualOrder(rows);
    }
    const byId = (a: OperationOrder, b: OperationOrder): number => a.id.localeCompare(b.id);
    const statusRank = (s: OperationOrderStatus): number => {
      switch (s) {
        case 'hazirlaniyor':
          return 0;
        case 'alinacak':
          return 1;
        case 'dagitimda':
          return 2;
        default:
          return 9;
      }
    };
    rows.sort((a, b) => {
      let c = 0;
      switch (opt) {
        case 'newest-added':
          c = b.createdAtMs - a.createdAtMs;
          break;
        case 'oldest-added':
          c = a.createdAtMs - b.createdAtMs;
          break;
        case 'elapsed-asc':
          c = this.ops.elapsedSeconds(a) - this.ops.elapsedSeconds(b);
          break;
        case 'elapsed-desc':
          c = this.ops.elapsedSeconds(b) - this.ops.elapsedSeconds(a);
          break;
        case 'route-zone':
          c = a.to.localeCompare(b.to, 'tr', { sensitivity: 'base' });
          break;
        case 'status-sort':
          c = statusRank(a.status) - statusRank(b.status);
          break;
        default:
          c = 0;
      }
      return c !== 0 ? c : byId(a, b);
    });
    return rows;
  }

  onAssignedDrop(event: CdkDragDrop<OperationOrder[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    const data = [...event.container.data];
    moveItemInArray(data, event.previousIndex, event.currentIndex);
    this.persistManualOrder(data.map((o) => o.id));
    this.setSortOption('manuel-siralama');
  }

  private applyManualOrder(rows: OperationOrder[]): OperationOrder[] {
    const merged = this.mergeOrderIds(this.loadManualOrder(this.courierId()), rows);
    const byId = new Map(rows.map((o) => [o.id, o] as const));
    const out: OperationOrder[] = [];
    for (const id of merged) {
      const o = byId.get(id);
      if (o) {
        out.push(o);
      }
    }
    return out.length ? out : [...rows];
  }

  private mergeOrderIds(saved: string[] | null, rows: OperationOrder[]): string[] {
    const curIds = rows.map((r) => r.id);
    const have = new Set<string>();
    const result: string[] = [];
    if (saved) {
      for (const id of saved) {
        if (curIds.includes(id)) {
          result.push(id);
          have.add(id);
        }
      }
    }
    for (const id of curIds) {
      if (!have.has(id)) {
        result.push(id);
      }
    }
    return result;
  }

  private loadManualOrder(courierId: string): string[] | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    try {
      const raw = localStorage.getItem(MANUAL_ORDER_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as Record<string, string[]>;
      const list = parsed[courierId];
      return Array.isArray(list) ? list : null;
    } catch {
      return null;
    }
  }

  private persistManualOrder(ids: string[]): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const cid = this.courierId();
    try {
      let map: Record<string, string[]> = {};
      const raw = localStorage.getItem(MANUAL_ORDER_KEY);
      if (raw) {
        map = { ...(JSON.parse(raw) as Record<string, string[]>) };
      }
      map[cid] = ids;
      localStorage.setItem(MANUAL_ORDER_KEY, JSON.stringify(map));
    } catch {
      /* ignore */
    }
  }
}
