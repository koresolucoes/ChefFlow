import { ChangeDetectionStrategy, Component, signal, inject, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <div class="min-h-screen bg-stone-50 flex">
      <!-- Sidebar (Desktop Only) -->
      <aside class="hidden md:flex w-64 bg-stone-900 text-stone-300 flex-col shrink-0">
        <div class="p-6 flex items-center gap-3 text-white border-b border-stone-800">
          <mat-icon class="text-emerald-500">restaurant_menu</mat-icon>
          <span class="text-xl font-bold tracking-tight">ChefFlow</span>
        </div>
        
        <nav class="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <a routerLink="/dashboard" routerLinkActive="bg-stone-800 text-white" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-800 hover:text-white transition-colors">
            <mat-icon>dashboard</mat-icon>
            <span class="font-medium">Dashboard</span>
          </a>
          
          <div class="pt-4 pb-2 px-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Gestão
          </div>
          
          <a routerLink="/equipe" routerLinkActive="bg-stone-800 text-white" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-800 hover:text-white transition-colors">
            <mat-icon>badge</mat-icon>
            <span class="font-medium">Equipe & Praças</span>
          </a>

          <a routerLink="/escalas" routerLinkActive="bg-stone-800 text-white" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-800 hover:text-white transition-colors">
            <mat-icon>groups</mat-icon>
            <span class="font-medium">Escalas & Pessoal</span>
          </a>
          
          <a routerLink="/producao" routerLinkActive="bg-stone-800 text-white" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-800 hover:text-white transition-colors">
            <mat-icon>receipt_long</mat-icon>
            <span class="font-medium">Produção (Prep)</span>
          </a>
          
          <a routerLink="/estoque" routerLinkActive="bg-stone-800 text-white" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-800 hover:text-white transition-colors">
            <mat-icon>inventory_2</mat-icon>
            <span class="font-medium">Estoque</span>
          </a>
          
          <a routerLink="/limpeza" routerLinkActive="bg-stone-800 text-white" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-800 hover:text-white transition-colors">
            <mat-icon>cleaning_services</mat-icon>
            <span class="font-medium">Higiene & Limpeza</span>
          </a>
          
          <a routerLink="/comunicacao" routerLinkActive="bg-stone-800 text-white" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-800 hover:text-white transition-colors">
            <mat-icon>campaign</mat-icon>
            <span class="font-medium">Comunicação</span>
          </a>
        </nav>
        
        <div class="p-4 border-t border-stone-800">
          <div class="flex items-center justify-between px-3 py-2">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {{ authService.currentUser()?.name?.charAt(0) || 'U' }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-white truncate">{{ authService.currentUser()?.name || 'Usuário' }}</p>
                <p class="text-xs text-stone-500 truncate capitalize">{{ authService.currentUser()?.role || 'Admin' }}</p>
              </div>
            </div>
            <button (click)="logout()" class="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors" title="Sair">
              <mat-icon class="text-[20px] w-5 h-5">logout</mat-icon>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Top Header (Mobile) -->
        <header class="bg-white border-b border-stone-200 h-16 flex items-center justify-between px-4 md:hidden shrink-0">
          <div class="flex items-center gap-2">
            <mat-icon class="text-emerald-600">restaurant_menu</mat-icon>
            <span class="text-lg font-bold text-stone-900">ChefFlow</span>
          </div>
          <button (click)="toggleSidebar()" class="p-2 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors">
            <mat-icon>apps</mat-icon>
          </button>
        </header>

        <!-- Content Area -->
        <div class="flex-1 overflow-auto p-4 md:p-8">
          <div class="max-w-7xl mx-auto">
            <router-outlet></router-outlet>
          </div>
        </div>
      </main>
      
      <!-- Mobile App Drawer Overlay -->
      @if (isSidebarOpen()) {
        <div class="fixed inset-0 z-50 bg-stone-50 flex flex-col md:hidden animate-in slide-in-from-bottom-full duration-300">
          <div class="flex items-center justify-between p-4 bg-white border-b border-stone-200 shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                {{ authService.currentUser()?.name?.charAt(0) || 'U' }}
              </div>
              <div>
                <p class="text-sm font-bold text-stone-900">{{ authService.currentUser()?.name || 'Usuário' }}</p>
                <p class="text-xs text-stone-500 capitalize">{{ authService.currentUser()?.role || 'Admin' }}</p>
              </div>
            </div>
            <button (click)="toggleSidebar()" class="p-2 text-stone-500 hover:bg-stone-100 rounded-full transition-colors">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          
          <div class="flex-1 overflow-y-auto p-4">
            <h2 class="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 px-2">Menu Principal</h2>
            <div class="grid grid-cols-2 gap-3">
              <a routerLink="/dashboard" (click)="toggleSidebar()" routerLinkActive="ring-2 ring-emerald-500 bg-emerald-50/50" [routerLinkActiveOptions]="{exact: true}" class="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-2xl shadow-sm border border-stone-200 active:scale-95 transition-all">
                <mat-icon class="text-[32px] w-8 h-8 text-emerald-600">dashboard</mat-icon>
                <span class="font-bold text-stone-900 text-sm">Dashboard</span>
              </a>
              
              <a routerLink="/equipe" (click)="toggleSidebar()" routerLinkActive="ring-2 ring-emerald-500 bg-emerald-50/50" class="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-2xl shadow-sm border border-stone-200 active:scale-95 transition-all">
                <mat-icon class="text-[32px] w-8 h-8 text-blue-600">badge</mat-icon>
                <span class="font-bold text-stone-900 text-sm text-center">Equipe</span>
              </a>

              <a routerLink="/escalas" (click)="toggleSidebar()" routerLinkActive="ring-2 ring-emerald-500 bg-emerald-50/50" class="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-2xl shadow-sm border border-stone-200 active:scale-95 transition-all">
                <mat-icon class="text-[32px] w-8 h-8 text-indigo-600">groups</mat-icon>
                <span class="font-bold text-stone-900 text-sm text-center">Escalas</span>
              </a>
              
              <a routerLink="/producao" (click)="toggleSidebar()" routerLinkActive="ring-2 ring-emerald-500 bg-emerald-50/50" class="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-2xl shadow-sm border border-stone-200 active:scale-95 transition-all">
                <mat-icon class="text-[32px] w-8 h-8 text-amber-600">receipt_long</mat-icon>
                <span class="font-bold text-stone-900 text-sm text-center">Produção</span>
              </a>
              
              <a routerLink="/estoque" (click)="toggleSidebar()" routerLinkActive="ring-2 ring-emerald-500 bg-emerald-50/50" class="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-2xl shadow-sm border border-stone-200 active:scale-95 transition-all">
                <mat-icon class="text-[32px] w-8 h-8 text-orange-600">inventory_2</mat-icon>
                <span class="font-bold text-stone-900 text-sm text-center">Estoque</span>
              </a>
              
              <a routerLink="/limpeza" (click)="toggleSidebar()" routerLinkActive="ring-2 ring-emerald-500 bg-emerald-50/50" class="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-2xl shadow-sm border border-stone-200 active:scale-95 transition-all">
                <mat-icon class="text-[32px] w-8 h-8 text-cyan-600">cleaning_services</mat-icon>
                <span class="font-bold text-stone-900 text-sm text-center">Limpeza</span>
              </a>
              
              <a routerLink="/comunicacao" (click)="toggleSidebar()" routerLinkActive="ring-2 ring-emerald-500 bg-emerald-50/50" class="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-2xl shadow-sm border border-stone-200 active:scale-95 transition-all">
                <mat-icon class="text-[32px] w-8 h-8 text-purple-600">campaign</mat-icon>
                <span class="font-bold text-stone-900 text-sm text-center">Mural & BI</span>
              </a>
            </div>
            
            <div class="mt-8 px-2 pb-8">
              <button (click)="logout()" class="w-full flex items-center justify-center gap-2 p-4 bg-rose-100 text-rose-700 rounded-2xl font-bold active:scale-95 transition-all">
                <mat-icon>logout</mat-icon>
                Sair do Sistema
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutComponent {
  authService = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  isSidebarOpen = signal(false);

  constructor() {
    effect(() => {
      if (isPlatformBrowser(this.platformId) && !this.authService.currentUser()) {
        this.router.navigate(['/login']);
      }
    });
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  logout() {
    this.authService.logout();
  }
}
