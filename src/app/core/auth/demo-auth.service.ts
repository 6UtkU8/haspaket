/**
 * DEMO / GEÇİCİ kimlik doğrulama — backend yokken localStorage veya sessionStorage kullanır.
 * Üretimde gerçek AuthService ile değiştirin; public API benzer tutulabilir (login/logout/session).
 */

import { Injectable, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DemoOperationsFacade } from '../operations/demo-operations.facade';
import {
  DEMO_AUTH_STORAGE_KEY,
  type DemoAuthRole,
  type DemoAuthSession,
} from './demo-auth.types';

const DEMO_DELAY_MS_MIN = 500;
const DEMO_DELAY_MS_MAX = 800;

@Injectable({ providedIn: 'root' })
export class DemoAuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ops = inject(DemoOperationsFacade);

  /** Mevcut demo oturumu (SSR’da null kalabilir) */
  private readonly session = signal<DemoAuthSession | null>(null);

  /** Salt okunur sinyal — bileşenlerde abone olunabilir */
  readonly sessionReadonly = this.session.asReadonly();

  readonly isAuthenticated = computed(
    () => this.session()?.isAuthenticated === true,
  );

  readonly role = computed(() => this.session()?.role ?? null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.hydrateFromStorage();
    }
  }

  isLoggedIn(): boolean {
    return this.session()?.isAuthenticated === true;
  }

  getRole(): DemoAuthRole | null {
    return this.session()?.role ?? null;
  }

  async login(params: {
    email: string;
    password: string;
    role: DemoAuthRole;
    remember: boolean;
  }): Promise<void> {
    await this.simulateNetworkDelay();
    const email = params.email.trim();
    const password = params.password;
    const resolved = this.resolveLogin(params.role, email, password);
    if (!resolved) {
      throw new Error('INVALID_CREDENTIALS');
    }
    const session: DemoAuthSession = {
      v: 1,
      isAuthenticated: true,
      role: params.role,
      userId: resolved.userId,
      email: resolved.email,
      displayName: resolved.displayName,
    };
    this.persist(session, params.remember);
    this.session.set(session);
  }

  logout(): void {
    this.clearStorage();
    this.session.set(null);
  }

  private hydrateFromStorage(): void {
    const raw =
      sessionStorage.getItem(DEMO_AUTH_STORAGE_KEY) ??
      localStorage.getItem(DEMO_AUTH_STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as DemoAuthSession;
      if (
        parsed?.v === 1 &&
        parsed.isAuthenticated === true &&
        (parsed.role === 'firma' ||
          parsed.role === 'admin' ||
          parsed.role === 'chief' ||
          parsed.role === 'courier') &&
        typeof parsed.email === 'string' &&
        typeof parsed.userId === 'string' &&
        (parsed.displayName === undefined || typeof parsed.displayName === 'string')
      ) {
        this.session.set(parsed);
      }
    } catch {
      this.clearStorage();
    }
  }

  private persist(data: DemoAuthSession, remember: boolean): void {
    const json = JSON.stringify(data);
    if (remember) {
      localStorage.setItem(DEMO_AUTH_STORAGE_KEY, json);
      sessionStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
    } else {
      sessionStorage.setItem(DEMO_AUTH_STORAGE_KEY, json);
      localStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
    }
  }

  private clearStorage(): void {
    sessionStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
    localStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
  }

  private simulateNetworkDelay(): Promise<void> {
    const ms =
      DEMO_DELAY_MS_MIN +
      Math.random() * (DEMO_DELAY_MS_MAX - DEMO_DELAY_MS_MIN);
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private resolveLogin(
    role: DemoAuthRole,
    email: string,
    password: string,
  ): { userId: string; email: string; displayName?: string } | null {
    const normalized = email.toLocaleLowerCase('tr');
    if (role === 'firma') {
      if (normalized === 'firma@haspaket.com' && password === 'Firma123!') {
        return {
          userId: 'f-demo',
          email: 'firma@haspaket.com',
          displayName: 'Demo Firma',
        };
      }
      if (normalized === 'firma@test.com' && password === '123456') {
        return {
          userId: 'f-test',
          email: 'firma@test.com',
          displayName: 'Test Firma',
        };
      }
      const company = this.ops.findCompanyByCredentials(email, password);
      if (!company) {
        return null;
      }
      return {
        userId: company.id,
        email: company.loginIdentifier,
        displayName: company.name,
      };
    }
    if (role === 'admin') {
      if (normalized === 'admin@haspaket.com' && password === 'Admin123!') {
        return {
          userId: 'admin-1',
          email: 'admin@haspaket.com',
          displayName: 'Sistem Yöneticisi',
        };
      }
      return null;
    }
    if (role === 'chief') {
      if (normalized === 'sef@haspaket.com' && password === 'Sef123!') {
        return {
          userId: 'chief-1',
          email: 'sef@haspaket.com',
          displayName: 'Operasyon Şefi',
        };
      }
      return null;
    }
    if (role === 'courier') {
      if (normalized === 'kurye@haspaket.com' && password === 'Kurye123!') {
        return {
          userId: 'c-1',
          email: 'kurye@haspaket.com',
          displayName: 'Ali Kurye',
        };
      }
      if (normalized === 'kurye@test.com' && password === '123456') {
        return {
          userId: 'c-2',
          email: 'kurye@test.com',
          displayName: 'Test Kurye',
        };
      }
      const courier = this.ops.findCourierByCredentials(email, password);
      if (!courier) {
        return null;
      }
      return {
        userId: courier.id,
        email: courier.loginIdentifier,
        displayName: courier.name,
      };
    }
    return null;
  }
}
