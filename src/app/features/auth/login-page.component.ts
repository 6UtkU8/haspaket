import {
  afterNextRender,
  Component,
  computed,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DemoAuthService } from '../../core/auth/demo-auth.service';
import type { DemoAuthRole } from '../../core/auth/demo-auth.types';
import { HpBrandLogoComponent } from '../../shared/ui/hp-brand-logo.component';
import { HpThemeToggleComponent } from '../../shared/ui/hp-theme-toggle.component';

@Component({
  selector: 'hp-login-page',
  standalone: true,
  imports: [RouterLink, HpBrandLogoComponent, HpThemeToggleComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly demoAuth = inject(DemoAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly role = signal<DemoAuthRole>('firma');

  /** Kayar pill: 0 Kurye, 1 Firma, 2 Sef, 3 Admin */
  readonly segmentIndex = computed(() => {
    const r = this.role();
    if (r === 'courier') {
      return 0;
    }
    if (r === 'firma') {
      return 1;
    }
    if (r === 'chief') {
      return 2;
    }
    return 3;
  });

  readonly email = signal('');
  readonly password = signal('');
  readonly remember = signal(false);
  readonly reduceMotion = signal(false);

  readonly emailError = signal<string | null>(null);
  readonly passwordError = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);
  readonly loading = signal(false);

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reduceMotion.set(mq.matches);
    });
  }

  setRole(value: DemoAuthRole): void {
    this.role.set(value);
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.submitError.set(null);
    this.emailError.set(null);
    this.passwordError.set(null);

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const emailRaw = this.email().trim();
    const passwordRaw = this.password();

    let valid = true;
    if (!emailRaw) {
      this.emailError.set('E-posta adresi gerekli.');
      valid = false;
    } else if (!this.isValidEmail(emailRaw)) {
      this.emailError.set('Geçerli bir e-posta girin.');
      valid = false;
    }

    if (!passwordRaw) {
      this.passwordError.set('Şifre gerekli.');
      valid = false;
    }

    if (!valid) {
      return;
    }

    this.loading.set(true);
    try {
      await this.demoAuth.login({
        email: emailRaw,
        password: passwordRaw,
        role: this.role(),
        remember: this.remember(),
      });
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      if (returnUrl && this.isSafeInternalReturnUrl(returnUrl)) {
        await this.router.navigateByUrl(returnUrl);
      } else if (this.role() === 'firma') {
        await this.router.navigate(['/firma/dashboard']);
      } else if (this.role() === 'admin' || this.role() === 'chief') {
        await this.router.navigate(['/admin/dashboard']);
      } else {
        await this.router.navigate(['/courier/dashboard']);
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
        this.submitError.set('Secili role uygun e-posta veya sifre hatali.');
      } else {
        this.submitError.set(
          'Giriş şu an tamamlanamadı. Lütfen tekrar deneyin.',
        );
      }
    } finally {
      this.loading.set(false);
    }
  }

  private isSafeInternalReturnUrl(url: string): boolean {
    if (!url.startsWith('/') || url.startsWith('//')) {
      return false;
    }
    const path = url.split('?')[0];
    return (
      path === '/firma' ||
      path.startsWith('/firma/') ||
      path === '/admin' ||
      path.startsWith('/admin/') ||
      path === '/courier' ||
      path.startsWith('/courier/')
    );
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  onForgotPassword(event: Event): void {
    event.preventDefault();
  }
}
