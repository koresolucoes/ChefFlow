import { Routes } from '@angular/router';
import { LayoutComponent } from './layout';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        loadComponent: () => import('./pages/dashboard').then(m => m.DashboardComponent) 
      },
      { 
        path: 'escalas', 
        loadComponent: () => import('./pages/escalas').then(m => m.EscalasComponent) 
      },
      { 
        path: 'producao', 
        loadComponent: () => import('./pages/producao').then(m => m.ProducaoComponent) 
      },
      { 
        path: 'limpeza', 
        loadComponent: () => import('./pages/limpeza').then(m => m.LimpezaComponent) 
      },
      { 
        path: 'comunicacao', 
        loadComponent: () => import('./pages/comunicacao').then(m => m.ComunicacaoComponent) 
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
