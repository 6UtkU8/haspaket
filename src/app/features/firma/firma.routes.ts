import { Routes } from '@angular/router';

export const FIRMA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./firma-shell.component').then((m) => m.FirmaShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/firma-dashboard-page.component').then(
            (m) => m.FirmaDashboardPageComponent,
          ),
      },
      {
        path: 'siparisler',
        loadComponent: () =>
          import('./pages/firma-orders-page.component').then(
            (m) => m.FirmaOrdersPageComponent,
          ),
      },
      {
        path: 'siparisler/yeni',
        loadComponent: () =>
          import('./pages/firma-orders-new-page.component').then(
            (m) => m.FirmaOrdersNewPageComponent,
          ),
      },
      {
        path: 'siparisler/:id',
        loadComponent: () =>
          import('./pages/firma-orders-detail-page.component').then(
            (m) => m.FirmaOrdersDetailPageComponent,
          ),
      },
      {
        path: 'kuryeler',
        loadComponent: () =>
          import('./pages/firma-couriers-page.component').then(
            (m) => m.FirmaCouriersPageComponent,
          ),
      },
      {
        path: 'kuryeler/:id',
        loadComponent: () =>
          import('./pages/firma-couriers-detail-page.component').then(
            (m) => m.FirmaCouriersDetailPageComponent,
          ),
      },
      {
        path: 'raporlar',
        loadComponent: () =>
          import('./pages/firma-reports-page.component').then(
            (m) => m.FirmaReportsPageComponent,
          ),
      },
      {
        path: 'ayarlar',
        loadComponent: () =>
          import('./pages/firma-settings-page.component').then(
            (m) => m.FirmaSettingsPageComponent,
          ),
      },
    ],
  },
];
