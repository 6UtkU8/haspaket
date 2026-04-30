import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  PLATFORM_ID,
  signal,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { DemoAuthService } from '../../core/auth/demo-auth.service';
import { DemoOperationsFacade } from '../../core/operations/demo-operations.facade';
import { HpBrandLogoComponent } from '../../shared/ui/hp-brand-logo.component';
import { HpToastService } from '../../shared/ui/hp-toast.service';
import { HpThemeToggleComponent } from '../../shared/ui/hp-theme-toggle.component';
import { CourierSettingsService } from './settings/courier-settings.service';

@Component({
  selector: 'hp-courier-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule, HpBrandLogoComponent, HpThemeToggleComponent],
  templateUrl: './courier-shell.component.html',
  styleUrl: './courier-shell.component.scss',
})
export class CourierShellComponent {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  @ViewChild('courierScroll', { read: ElementRef }) private courierScroll?: ElementRef<HTMLElement>;
  private readonly demoAuth = inject(DemoAuthService);
  private readonly ops = inject(DemoOperationsFacade);
  private readonly toast = inject(HpToastService);
  readonly courierSettings = inject(CourierSettingsService);
  private readonly courierId = computed(() => {
    const sessionCourierId = this.demoAuth.sessionReadonly()?.userId ?? '';
    if (this.ops.couriers().some((courier) => courier.id === sessionCourierId)) {
      return sessionCourierId;
    }
    return this.ops.couriers()[0]?.id ?? 'c-1';
  });

  readonly sidebarOpen = signal(false);
  readonly breakModalOpen = signal(false);
  readonly breakReason = signal('Yemek');
  readonly breakDuration = signal('15');

  readonly userName = computed(() => {
    const custom = this.courierSettings.courierName().trim();
    if (custom.length > 0) {
      return custom;
    }
    return this.ops.courierName(this.courierId());
  });
  readonly userEmail = computed(() => {
    const custom = this.courierSettings.courierEmail().trim();
    if (custom.length > 0) {
      return custom;
    }
    const sessionEmail = this.demoAuth.sessionReadonly()?.email;
    if (sessionEmail) {
      return sessionEmail;
    }
    return this.ops.couriers().find((courier) => courier.id === this.courierId())?.loginIdentifier ?? 'kurye@haspaket.com';
  });
  readonly pendingStateRequest = computed(
    () =>
      this.ops
        .pendingCourierBreakRequests()
        .find((request) => request.courierId === this.courierId()) ?? null,
  );
  readonly courierState = computed(() => this.ops.getCourierState(this.courierId()));
  readonly stateTone = computed<'online' | 'offline' | 'break'>(() => this.courierState());
  readonly stateIndex = computed(() => {
    const state = this.courierState();
    if (state === 'online') {
      return 0;
    }
    if (state === 'offline') {
      return 1;
    }
    return 2;
  });

  readonly navItems = [
    { label: 'Anasayfa', path: '/courier/dashboard', icon: 'dash' },
    { label: 'Paketler', path: '/courier/paketler', icon: 'packages' },
    { label: 'Havuz', path: '/courier/havuz', icon: 'pool' },
    { label: 'Raporlar', path: '/courier/raporlar', icon: 'reports' },
    { label: 'Ayarlar', path: '/courier/ayarlar', icon: 'settings' },
  ] as const;

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((e) => {
        this.sidebarOpen.set(false);
        this.resetCourierMainScroll(e.urlAfterRedirects ?? e.url);
      });

    queueMicrotask(() => this.courierSettings.touchAutoOnlineLaunch());
  }

  @HostListener('window:resize')
  onResize(): void {
    if (typeof window !== 'undefined' && window.innerWidth >= 960) {
      this.sidebarOpen.set(false);
    }
  }

  private resetCourierMainScroll(url: string): void {
    if (!isPlatformBrowser(this.platformId) || !url.startsWith('/courier')) {
      return;
    }
    const raw = url.split('?')[0].split('#')[0];
    const normalized = raw.startsWith('/') ? raw : `/${raw}`;
    const el = this.courierScroll?.nativeElement;

    /** Ayarlar: tek hamlede üst sıfır; async tekrarlama ana sütunda titreme yaratır. */
    if (normalized.endsWith('/ayarlar') && normalized.includes('/courier')) {
      if (el) {
        el.scrollTop = 0;
      }
      return;
    }

    const run = (): void => {
      const host = this.courierScroll?.nativeElement;
      if (host && host.scrollTop !== 0) {
        host.scrollTop = 0;
      }
    };
    run();
    queueMicrotask(() => {
      run();
      const host = this.courierScroll?.nativeElement;
      if (host && host.scrollTop !== 0) {
        requestAnimationFrame(run);
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  setState(state: 'online' | 'offline' | 'break'): void {
    if (state === 'break') {
      if (this.pendingStateRequest()) {
        return;
      }
      this.breakModalOpen.set(true);
      return;
    }
    if (state === 'offline') {
      const cid = this.courierId();
      if (this.ops.requestCourierStateChange(cid, state)) {
        this.toast.show('İstek gönderildi.', 'Admin onayı bekleniyor.', 2500);
      }
      return;
    }
    this.ops.setCourierState(this.courierId(), state);
  }

  closeBreakModal(): void {
    this.breakModalOpen.set(false);
  }

  submitBreakRequest(): void {
    const durationMin = Number(this.breakDuration());
    const sent = this.ops.requestCourierStateChange(this.courierId(), 'break', {
      breakReason: this.breakReason(),
      breakDurationMin: Number.isFinite(durationMin) && durationMin > 0 ? durationMin : 15,
    });
    this.breakModalOpen.set(false);
    if (sent) {
      this.toast.show('İstek gönderildi.', 'Admin onayı bekleniyor.', 2500);
    }
  }

  logout(): void {
    this.demoAuth.logout();
    void this.router.navigate(['/auth/login']);
  }
}
