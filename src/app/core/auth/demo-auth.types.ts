/**
 * DEMO ONLY — gerçek backend auth ile değiştirilecek.
 * Oturum şekli ve anahtarlar ileride API/refresh token modeline uyarlanmalıdır.
 */

export const DEMO_AUTH_STORAGE_KEY = 'haspaket_demo_auth_v1';

/** UI ve guard’larda kullanılan rol */
export type DemoAuthRole = 'firma' | 'admin' | 'chief' | 'courier';

export interface DemoAuthSession {
  v: 1;
  isAuthenticated: true;
  role: DemoAuthRole;
  userId: string;
  /** Görüntüleme / debug; şifre asla saklanmaz */
  email: string;
  displayName?: string;
}
