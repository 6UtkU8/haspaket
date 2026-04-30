/**
 * DEMO route koruması — DemoAuthService ile uyumlu.
 * Gerçek auth’ta aynı mantık JWT/refresh ve AuthService üzerinden yapılır.
 */

import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { DemoAuthService } from './demo-auth.service';
import type { DemoAuthRole } from './demo-auth.types';

function navigateByRole(router: Router, role: DemoAuthRole): void {
  switch (role) {
    case 'firma':
      void router.navigate(['/firma']);
      break;
    case 'admin':
    case 'chief':
      void router.navigate(['/admin']);
      break;
    case 'courier':
      void router.navigate(['/courier']);
      break;
  }
}

function redirectToLogin(router: Router, returnUrl: string): false {
  void router.navigate(['/auth/login'], {
    queryParams: { returnUrl },
  });
  return false;
}

/** Zaten giriş yapılmışsa login sayfasından panele gönderir */
export const demoLoginPageGuard: CanActivateFn = () => {
  const auth = inject(DemoAuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    return true;
  }
  const r = auth.getRole();
  if (r) {
    navigateByRole(router, r);
  }
  return false;
};

/** Sadece firma oturumu */
export const demoFirmaGuard: CanActivateFn = (_route, state) => {
  const auth = inject(DemoAuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    return redirectToLogin(router, state.url);
  }
  const r = auth.getRole();
  if (r === 'firma') {
    return true;
  }
  if (r === 'admin' || r === 'chief') {
    void router.navigate(['/admin']);
    return false;
  }
  if (r === 'courier') {
    void router.navigate(['/courier']);
    return false;
  }
  void router.navigate(['/auth/login']);
  return false;
};

/** Sadece admin oturumu */
export const demoAdminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(DemoAuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    return redirectToLogin(router, state.url);
  }
  const r = auth.getRole();
  if (r === 'admin' || r === 'chief') {
    return true;
  }
  if (r === 'firma') {
    void router.navigate(['/firma']);
    return false;
  }
  if (r === 'courier') {
    void router.navigate(['/courier']);
    return false;
  }
  void router.navigate(['/auth/login']);
  return false;
};

/** Sadece kurye oturumu */
export const demoCourierGuard: CanActivateFn = (_route, state) => {
  const auth = inject(DemoAuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    return redirectToLogin(router, state.url);
  }
  const r = auth.getRole();
  if (r === 'courier') {
    return true;
  }
  if (r === 'firma') {
    void router.navigate(['/firma']);
    return false;
  }
  if (r === 'admin' || r === 'chief') {
    void router.navigate(['/admin']);
    return false;
  }
  void router.navigate(['/auth/login']);
  return false;
};

/** Admin shell icindeki rol bazli gorunum siniri */
export const demoAdminAreaGuard: CanActivateFn = (route, state) => {
  const auth = inject(DemoAuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    return redirectToLogin(router, state.url);
  }

  const currentRole = auth.getRole();
  if (!currentRole) {
    void router.navigate(['/auth/login']);
    return false;
  }

  if (currentRole !== 'admin' && currentRole !== 'chief') {
    navigateByRole(router, currentRole);
    return false;
  }

  const allowedRoles = route.data['allowedRoles'] as DemoAuthRole[] | undefined;
  if (!allowedRoles || allowedRoles.includes(currentRole)) {
    return true;
  }

  void router.navigate(['/admin/dashboard']);
  return false;
};
