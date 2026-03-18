import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <div class="min-h-screen bg-stone-50 flex">
      <!-- Sidebar -->
      <aside class="w-64 bg-stone-900 text-stone-300 flex flex-col transition-all duration-300" [class.-ml-64]="!isSidebarOpen()" [class.md:ml-0]="true">
        <div class="p-6 flex items-center gap-3 text-white border-b border-stone-800">
          <mat-icon class="text-emerald-500">restaurant_menu</mat-icon>
          <span class="text-xl font-bold tracking-tight">ChefFlow</span>
        </div>
        
        <nav class="flex-1 py-6 px-3 space-y-1">
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
        <header class="bg-white border-b border-stone-200 h-16 flex items-center px-4 md:hidden">
          <button (click)="toggleSidebar()" class="p-2 -ml-2 text-stone-500 hover:text-stone-900 rounded-lg">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="ml-2 text-lg font-bold text-stone-900">ChefFlow</span>
        </header>

        <!-- Content Area -->
        <div class="flex-1 overflow-auto p-4 md:p-8">
          <div class="max-w-7xl mx-auto">
            <router-outlet></router-outlet>
          </div>
        </div>
      </main>
      
      <!-- Mobile Overlay -->
      @if (isSidebarOpen()) {
        <div class="fixed inset-0 bg-black/50 z-40 md:hidden" (click)="toggleSidebar()" (keyup.enter)="toggleSidebar()" tabindex="0" role="button" aria-label="Close sidebar"></div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutComponent {
  authService = inject(AuthService);
  isSidebarOpen = signal(false);

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  logout() {
    this.authService.logout();
  }
}
