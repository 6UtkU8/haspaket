import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  Component,
  DestroyRef,
  HostListener,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DemoAuthService } from '../../core/auth/demo-auth.service';
import { DemoOperationsFacade } from '../../core/operations/demo-operations.facade';
import { HpManualOrderFormComponent } from '../../shared/manual-order/hp-manual-order-form.component';
import { HpBrandLogoComponent } from '../../shared/ui/hp-brand-logo.component';
import { HpToastService } from '../../shared/ui/hp-toast.service';
import { HpThemeToggleComponent } from '../../shared/ui/hp-theme-toggle.component';

@Component({
  selector: 'hp-firma-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    HpManualOrderFormComponent,
    HpBrandLogoComponent,
    HpThemeToggleComponent,
  ],
  templateUrl: './firma-shell.component.html',
  styleUrl: './firma-shell.component.scss',
})
export class FirmaShellComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly demoAuth = inject(DemoAuthService);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly toast = inject(HpToastService);
  readonly ops = inject(DemoOperationsFacade);

  readonly manualOrderForm = viewChild(HpManualOrderFormComponent);

  readonly sidebarOpen = signal(false);
  readonly newOrderOpen = signal(false);
  readonly responsibleModalOpen = signal(false);
  /** Drawer animasyonu — reduced-motion’da sınıf ile kapatılır */
  readonly reduceMotion = signal(false);

  /** Mock kullanıcı — API ile değiştirilecek */
  readonly userName = 'Firma hesabı';
  readonly userEmail = 'ornek@firma.com';

  readonly navItems = [
    { label: 'Anasayfa', path: '/firma/dashboard', icon: 'dash' },
    { label: 'Siparişler', path: '/firma/siparisler', icon: 'orders' },
    { label: 'Kuryeler', path: '/firma/kuryeler', icon: 'couriers' },
    { label: 'Raporlar', path: '/firma/raporlar', icon: 'reports' },
    { label: 'Ayarlar', path: '/firma/ayarlar', icon: 'settings' },
  ] as const;

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reduceMotion.set(mq.matches);
    });
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.sidebarOpen.set(false);
        if (this.newOrderOpen()) {
          this.cancelNewOrder();
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

  onNewOrder(): void {
    this.sidebarOpen.set(false);
    this.newOrderOpen.set(true);
    this.lockBodyScroll(true);
  }

  closeNewOrder(): void {
    this.newOrderOpen.set(false);
    this.lockBodyScroll(false);
  }

  onNewOrderBackdropClick(): void {
    this.cancelNewOrder();
  }

  onFirmaManualOrderSaved(ev: { id: string }): void {
    this.toast.show('Sipariş oluşturuldu', ev.id, 2400);
    this.closeNewOrder();
  }

  cancelNewOrder(): void {
    this.manualOrderForm()?.hardReset();
    this.closeNewOrder();
  }

  openResponsibleModal(): void {
    this.sidebarOpen.set(false);
    this.responsibleModalOpen.set(true);
    this.lockBodyScroll(true);
  }

  closeResponsibleModal(): void {
    this.responsibleModalOpen.set(false);
    this.lockBodyScroll(false);
  }

  private lockBodyScroll(lock: boolean): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const html = this.document.documentElement;
    const body = this.document.body;
    if (lock) {
      const w = window.innerWidth - html.clientWidth;
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      if (w > 0) {
        body.style.paddingRight = `${w}px`;
      }
    } else {
      html.style.overflow = '';
      body.style.overflow = '';
      body.style.paddingRight = '';
    }
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(ev: KeyboardEvent): void {
    if (ev.key !== 'Escape') {
      return;
    }
    if (this.newOrderOpen()) {
      this.cancelNewOrder();
    } else if (this.responsibleModalOpen()) {
      this.closeResponsibleModal();
    }
  }

  logout(): void {
    this.demoAuth.logout();
    void this.router.navigate(['/auth/login']);
  }

  telHrefForResponsible(raw: string): string {
    let d = raw.replace(/\D/g, '');
    if (!d.length) {
      return '#';
    }
    if (d.startsWith('0')) {
      d = `90${d.slice(1)}`;
    } else if (!d.startsWith('90')) {
      d = `90${d}`;
    }
    return `tel:+${d}`;
  }
}
