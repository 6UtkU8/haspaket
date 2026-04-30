import { Routes } from '@angular/router';

import {
  demoAdminGuard,
  demoCourierGuard,
  demoFirmaGuard,
  demoLoginPageGuard,
} from './core/auth/demo-auth.guards';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/public/public-page.component').then(
        (m) => m.PublicPageComponent,
      ),
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        canActivate: [demoLoginPageGuard],
        loadComponent: () =>
          import('./features/auth/login-page.component').then(
            (m) => m.LoginPageComponent,
          ),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login',
      },
    ],
  },
  {
    path: 'basvuru',
    children: [
      {
        path: 'kurye',
        loadComponent: () =>
          import('./features/public/courier-application-page.component').then(
            (m) => m.CourierApplicationPageComponent,
          ),
      },
      {
        path: 'firma',
        loadComponent: () =>
          import('./features/public/company-application-page.component').then(
            (m) => m.CompanyApplicationPageComponent,
          ),
      },
    ],
  },
  {
    path: 'firma',
    canActivate: [demoFirmaGuard],
    loadChildren: () =>
      import('./features/firma/firma.routes').then((m) => m.FIRMA_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [demoAdminGuard],
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'courier',
    canActivate: [demoCourierGuard],
    loadChildren: () =>
      import('./features/courier/courier.routes').then((m) => m.COURIER_ROUTES),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
