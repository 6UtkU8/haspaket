import {
  Component,
  DestroyRef,
  computed,
  effect,
  HostListener,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { DemoAuthService } from '../../core/auth/demo-auth.service';
import { DemoOperationsFacade } from '../../core/operations/demo-operations.facade';
import { AdminAppearanceService } from '../../core/theme/admin-appearance.service';
import { HpBrandLogoComponent } from '../../shared/ui/hp-brand-logo.component';
import { HpToastService } from '../../shared/ui/hp-toast.service';
import { HpThemeToggleComponent } from '../../shared/ui/hp-theme-toggle.component';
import { HpManualOrderFormComponent } from '../../shared/manual-order/hp-manual-order-form.component';

const ADMIN_NAV_ITEMS = [
  { label: 'Anasayfa', path: '/admin/dashboard', icon: 'dash' },
  { label: 'Firmalar', path: '/admin/firmalar', icon: 'firms' },
  { label: 'Kuryeler', path: '/admin/kuryeler', icon: 'couriers' },
  { label: 'Siparişler', path: '/admin/siparisler', icon: 'orders' },
  { label: 'Başvurular', path: '/admin/basvurular', icon: 'inbox' },
  { label: 'Raporlar', path: '/admin/raporlar', icon: 'reports' },
  { label: 'Ayarlar', path: '/admin/ayarlar', icon: 'settings' },
] as const;

@Component({
  selector: 'hp-admin-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    HpBrandLogoComponent,
    HpThemeToggleComponent,
    HpManualOrderFormComponent,
  ],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
})
export class AdminShellComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly demoAuth = inject(DemoAuthService);
  private readonly ops = inject(DemoOperationsFacade);
  readonly appearance = inject(AdminAppearanceService);
  private readonly toast = inject(HpToastService);
  private readonly seenCourierNotifIds = new Set<string>();
  private courierNotifToastPrimed = false;

  readonly manualOrderForm = viewChild(HpManualOrderFormComponent);

  readonly sidebarOpen = signal(false);
  readonly newFirmOpen = signal(false);
  readonly newOrderOpen = signal(false);

  readonly firmName = signal('');
  readonly contactPerson = signal('');
  readonly phone = signal('');
  readonly email = signal('');
  readonly address = signal('');
  readonly status = signal<'aktif' | 'pasif'>('aktif');

  readonly isChief = computed(() => this.demoAuth.role() === 'chief');
  readonly canManageCompanies = computed(() => !this.isChief());
  readonly userName = computed(() => {
    const session = this.demoAuth.sessionReadonly();
    if (session?.displayName?.trim()) {
      return session.displayName;
    }
    return this.isChief() ? 'Operasyon Şefi' : 'Sistem Yöneticisi';
  });
  readonly userEmail = computed(
    () => this.demoAuth.sessionReadonly()?.email ?? 'admin@haspaket.com',
  );
  readonly userRoleLabel = computed(() =>
    this.isChief() ? 'Şef paneli' : 'Tam yönetim',
  );
  readonly manualOrderActorLabel = computed(() =>
    this.isChief() ? 'Operasyon Şefi' : 'Admin',
  );
  readonly navItems = computed(() =>
    this.isChief()
      ? ADMIN_NAV_ITEMS.filter((item) =>
          item.path === '/admin/dashboard' ||
          item.path === '/admin/kuryeler' ||
          item.path === '/admin/siparisler' ||
          item.path === '/admin/raporlar',
        )
      : ADMIN_NAV_ITEMS,
  );

  constructor() {
    effect(() => {
      const notifications = this.ops.courierStateNotifications();
      if (!this.courierNotifToastPrimed) {
        notifications.forEach((n) => this.seenCourierNotifIds.add(n.id));
        this.courierNotifToastPrimed = true;
        return;
      }
      for (const n of notifications) {
        if (this.seenCourierNotifIds.has(n.id)) {
          continue;
        }
        this.seenCourierNotifIds.add(n.id);
        if (n.type === 'request-break' || n.type === 'request-offline') {
          this.toast.show('Yeni kurye talebi', n.message, 2500);
        }
      }
    });

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.sidebarOpen.set(false);
        if (this.newOrderOpen()) {
          this.closeNewOrder();
        }
      });
  }

  @HostListener('window:resize')
  onResize(): void {
    if (typeof window !== 'undefined' && window.innerWidth >= 960) {
      this.sidebarOpen.set(false);
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  onNewFirm(): void {
    if (!this.canManageCompanies()) {
      return;
    }
    this.newFirmOpen.set(true);
  }

  closeNewFirm(): void {
    this.newFirmOpen.set(false);
  }

  saveNewFirm(): void {
    if (!this.canManageCompanies()) {
      return;
    }
    if (
      !this.firmName().trim() ||
      !this.contactPerson().trim() ||
      !this.phone().trim() ||
      !this.email().trim() ||
      !this.address().trim()
    ) {
      this.toast.show('Yeni firma kaydedilemedi', 'Tüm alanları doldurun.', 2800);
      return;
    }
    this.ops.addCompanyFromAdmin({
      name: this.firmName(),
      contactPerson: this.contactPerson(),
      phone: this.phone(),
      email: this.email(),
      address: this.address(),
      isActive: this.status() === 'aktif',
    });
    const createdFirmName = this.firmName();
    this.firmName.set('');
    this.contactPerson.set('');
    this.phone.set('');
    this.email.set('');
    this.address.set('');
    this.status.set('aktif');
    this.toast.show('Yeni firma eklendi', createdFirmName, 2400);
    this.newFirmOpen.set(false);
  }

  logout(): void {
    this.demoAuth.logout();
    void this.router.navigate(['/auth/login']);
  }

  onNewOrder(): void {
    this.newOrderOpen.set(true);
  }

  closeNewOrder(): void {
    this.manualOrderForm()?.hardReset();
    this.newOrderOpen.set(false);
  }

  onAdminManualOrderSaved(ev: { id: string }): void {
    this.toast.show('Sipariş oluşturuldu', ev.id, 2400);
    this.closeNewOrder();
  }
}
