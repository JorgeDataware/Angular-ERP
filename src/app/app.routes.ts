import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    children: [
      {
        path: 'landing',
        loadChildren: () =>
          import('./pages/landing/landing.routes').then(m => m.landingRoutes),
      },
      { path: '', redirectTo: 'landing', pathMatch: 'full' },
    ],
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./pages/auth/auth.routes').then(m => m.authRoutes),
  },
  { path: '', redirectTo: 'home/landing', pathMatch: 'full' },
  { path: '**', redirectTo: 'home/landing' },
];
