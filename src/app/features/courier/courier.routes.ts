import { Routes } from '@angular/router';

export const COURIER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./courier-shell.component').then((m) => m.CourierShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/courier-dashboard-page.component').then(
            (m) => m.CourierDashboardPageComponent,
          ),
      },
      {
        path: 'paketler',
        loadComponent: () =>
          import('./pages/courier-packages-page.component').then(
            (m) => m.CourierPackagesPageComponent,
          ),
      },
      {
        path: 'gorevler',
        redirectTo: 'dashboard',
      },
      {
        path: 'havuz',
        loadComponent: () =>
          import('./pages/courier-pool-page.component').then(
            (m) => m.CourierPoolPageComponent,
          ),
      },
      {
        path: 'gorevler/:id',
        redirectTo: 'dashboard',
      },
      {
        path: 'raporlar',
        loadComponent: () =>
          import('./pages/courier-reports-page.component').then(
            (m) => m.CourierReportsPageComponent,
          ),
      },
      {
        path: 'ayarlar',
        loadComponent: () =>
          import('./pages/courier-settings-page.component').then(
            (m) => m.CourierSettingsPageComponent,
          ),
      },
    ],
  },
];
