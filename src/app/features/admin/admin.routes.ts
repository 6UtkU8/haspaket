import { Routes } from '@angular/router';
import { demoAdminAreaGuard } from '../../core/auth/demo-auth.guards';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin-shell.component').then((m) => m.AdminShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        canActivate: [demoAdminAreaGuard],
        data: { allowedRoles: ['admin', 'chief'] },
        loadComponent: () =>
          import('./pages/admin-dashboard-page.component').then(
            (m) => m.AdminDashboardPageComponent,
          ),
      },
      {
        path: 'firmalar',
        canActivate: [demoAdminAreaGuard],
        data: { allowedRoles: ['admin'] },
        loadComponent: () =>
          import('./pages/admin-firmalar-page.component').then(
            (m) => m.AdminFirmalarPageComponent,
          ),
      },
      {
        path: 'firmalar/:id',
        canActivate: [demoAdminAreaGuard],
        data: { allowedRoles: ['admin'] },
        loadComponent: () =>
          import('./pages/admin-firmalar-detail-page.component').then(
            (m) => m.AdminFirmalarDetailPageComponent,
          ),
      },
      {
        path: 'kuryeler',
        canActivate: [demoAdminAreaGuard],
        data: { allowedRoles: ['admin', 'chief'] },
        loadComponent: () =>
          import('./pages/admin-couriers-page.component').then(
            (m) => m.AdminCouriersPageComponent,
          ),
      },
      {
        path: 'kuryeler/:id',
        canActivate: [demoAdminAreaGuard],
        data: { allowedRoles: ['admin', 'chief'] },
        loadComponent: () =>
          import('./pages/admin-couriers-detail-page.component').then(
            (m) => m.AdminCouriersDetailPageComponent,
          ),
      },
      {
        path: 'siparisler',
        canActivate: [demoAdminAreaGuard],
        data: { allowedRoles: ['admin', 'chief'] },
        loadComponent: () =>
          import('./pages/admin-orders-page.component').then(
            (m) => m.AdminOrdersPageComponent,
          ),
      },
      {
        path: 'siparisler/:id',
        canActivate: [demoAdminAreaGuard],
        data: { allowedRoles: ['admin', 'chief'] },
        loadComponent: () =>
          import('./pages/admin-orders-detail-page.component').then(
            (m) => m.AdminOrdersDetailPageComponent,
          ),
      },
      {
        path: 'basvurular',
        canActivate: [demoAdminAreaGuard],
        data: { allowedRoles: ['admin'] },
        loadComponent: () =>
          import('./pages/admin-applications-page.component').then(
            (m) => m.AdminApplicationsPageComponent,
          ),
      },
      {
        path: 'raporlar',
        canActivate: [demoAdminAreaGuard],
        data: { allowedRoles: ['admin', 'chief'] },
        loadComponent: () =>
          import('./pages/admin-reports-page.component').then(
            (m) => m.AdminReportsPageComponent,
          ),
      },
      {
        path: 'ayarlar',
        canActivate: [demoAdminAreaGuard],
        data: { allowedRoles: ['admin'] },
        loadComponent: () =>
          import('./pages/admin-settings-page.component').then(
            (m) => m.AdminSettingsPageComponent,
          ),
      },
    ],
  },
];
