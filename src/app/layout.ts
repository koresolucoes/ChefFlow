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
    <div class="h-[100dvh] flex bg-stone-50 text-stone-900 overflow-hidden font-sans w-full">
      
      <!-- Edge-to-Edge Sidebar (Desktop Mode) -->
      <aside class="hidden md:flex flex-col w-[280px] bg-white border-r border-stone-200 h-full shrink-0 z-10 shadow-sm relative">
        <div class="h-20 flex items-center gap-3 px-6 border-b border-stone-100">
          <div class="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-sm">
            <mat-icon class="text-white">restaurant_menu</mat-icon>
          </div>
          <div>
            <span class="text-xl font-black tracking-tight text-stone-900 leading-none block">ChefFlow</span>
            <span class="text-[10px] font-bold text-stone-400 tracking-widest uppercase">Sistema OS</span>
          </div>
        </div>
        
        <nav class="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <a routerLink="/dashboard" routerLinkActive="bg-stone-50 text-emerald-700" [routerLinkActiveOptions]="{exact: true}" class="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-stone-50 text-stone-600 transition-colors font-bold text-sm">
            <mat-icon>dashboard</mat-icon>
            Início
          </a>
          
          <div class="pt-4 pb-2 px-3 text-[10px] font-black text-stone-400 uppercase tracking-widest">
            Gestão
          </div>
          
          @if (authService.canManageTeam()) {
            <a routerLink="/equipe" routerLinkActive="bg-stone-50 text-indigo-700" class="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-stone-50 text-stone-600 transition-colors font-bold text-sm">
              <mat-icon>badge</mat-icon>
              Equipe & Praças
            </a>
          }

          @if (!authService.isEstoque() && !authService.isAuditor()) {
            <a routerLink="/escalas" routerLinkActive="bg-stone-50 text-emerald-700" class="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-stone-50 text-stone-600 transition-colors font-bold text-sm">
              <mat-icon>groups</mat-icon>
              Escalas & Pessoal
            </a>
          }
            
          @if (!authService.isEstoque()) {
            <a routerLink="/producao" routerLinkActive="bg-stone-50 text-amber-700" class="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-stone-50 text-stone-600 transition-colors font-bold text-sm">
              <mat-icon>receipt_long</mat-icon>
              Produção (Prep)
            </a>
            <a routerLink="/receitas" routerLinkActive="bg-stone-50 text-orange-700" class="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-stone-50 text-stone-600 transition-colors font-bold text-sm">
              <mat-icon>menu_book</mat-icon>
              Fichas Técnicas
            </a>
            <a routerLink="/desperdicio" routerLinkActive="bg-stone-50 text-rose-700" class="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-stone-50 text-stone-600 transition-colors font-bold text-sm">
              <mat-icon>delete_sweep</mat-icon>
              Desperdício
            </a>
          }
          
          @if (!authService.isCook()) {
            <a routerLink="/estoque" routerLinkActive="bg-stone-50 text-teal-700" class="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-stone-50 text-stone-600 transition-colors font-bold text-sm">
              <mat-icon>inventory_2</mat-icon>
              Estoque Central
            </a>
            <a routerLink="/compras" routerLinkActive="bg-stone-50 text-cyan-700" class="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-stone-50 text-stone-600 transition-colors font-bold text-sm">
              <mat-icon>local_shipping</mat-icon>
              Compras & Fornecedores
            </a>
          }

          @if (!authService.isAuditor()) {
            <a routerLink="/requisicoes" routerLinkActive="bg-stone-50 text-rose-700" class="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-stone-50 text-stone-600 transition-colors font-bold text-sm">
              <mat-icon>shopping_cart</mat-icon>
              Requisições
            </a>
          }

          @if (authService.isCook() || authService.isChef() || authService.isAdmin() || authService.isEstoque() || authService.isAuditor()) {
            <a routerLink="/contagem" routerLinkActive="bg-stone-50 text-teal-700" class="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-stone-50 text-stone-600 transition-colors font-bold text-sm">
              <mat-icon>fact_check</mat-icon>
              Contagem
            </a>
          }
          
          @if (!authService.isEstoque()) {
            <a routerLink="/limpeza" routerLinkActive="bg-stone-50 text-blue-700" class="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-stone-50 text-stone-600 transition-colors font-bold text-sm">
              <mat-icon>checklist</mat-icon>
              Qualidade & Checklist
            </a>
          }
          
          <a routerLink="/comunicacao" routerLinkActive="bg-stone-50 text-purple-700" class="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-stone-50 text-stone-600 transition-colors font-bold text-sm">
            <mat-icon>campaign</mat-icon>
            Comunicação
          </a>
        </nav>
        
        <div class="p-4 border-t border-stone-100 bg-stone-50/50">
          <div class="flex items-center justify-between p-2">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0 border border-emerald-200">
                {{ authService.currentUser()?.name?.charAt(0) || 'U' }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-stone-900 truncate">{{ authService.currentUser()?.name || 'Usuário' }}</p>
                <p class="text-[10px] text-stone-500 truncate uppercase font-bold tracking-wider">{{ authService.currentUser()?.role || 'Admin' }}</p>
              </div>
            </div>
            <button (click)="logout()" class="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-all" title="Sair">
              <mat-icon class="text-[20px] w-5 h-5">logout</mat-icon>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-stone-50 md:bg-white text-stone-900">
        <!-- Minimal Top App Bar (Mobile) -->
        <header class="bg-stone-50/80 backdrop-blur-xl h-14 flex items-center justify-between px-4 md:hidden shrink-0 sticky top-0 z-30">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-emerald-400 rounded-lg flex items-center justify-center shadow-sm">
              <mat-icon class="text-white text-[18px]">restaurant_menu</mat-icon>
            </div>
            <span class="text-lg font-black tracking-tight text-stone-900">ChefFlow</span>
          </div>
        </header>

        <!-- Content Area -->
        <div class="flex-1 overflow-auto bg-stone-50 pb-[100px] md:pb-8 md:p-8">
          <div class="max-w-7xl mx-auto h-full rounded-none md:rounded-3xl">
            <router-outlet></router-outlet>
          </div>
        </div>
      </main>

      <!-- Bottom Navigation (Mobile Only) -->
      <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-stone-200 flex items-center justify-around pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 px-2 z-[60] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] text-stone-900">
        <a routerLink="/dashboard" routerLinkActive="text-stone-900" [routerLinkActiveOptions]="{exact: true}" class="flex flex-col items-center p-2 text-stone-400 hover:text-stone-900 transition-colors flex-1 text-center group">
          <mat-icon class="text-[26px] w-6 h-6 mb-1 group-active:scale-90 transition-transform" [class.material-icons-outlined]="!isActive('/dashboard')">dashboard</mat-icon>
          <span class="text-[10px] sm:text-xs font-semibold">Início</span>
        </a>

        @if (!authService.isEstoque()) {
          <a routerLink="/producao" routerLinkActive="text-stone-900" class="flex flex-col items-center p-2 text-stone-400 hover:text-stone-900 transition-colors flex-1 text-center group">
            <mat-icon class="text-[26px] w-6 h-6 mb-1 group-active:scale-90 transition-transform">receipt_long</mat-icon>
            <span class="text-[10px] sm:text-xs font-semibold">Produção</span>
          </a>
        }

        @if (authService.isCook() || authService.isChef() || authService.isAdmin() || authService.isEstoque() || authService.isAuditor()) {
          <a routerLink="/contagem" routerLinkActive="text-stone-900" class="flex flex-col items-center p-2 text-stone-400 hover:text-stone-900 transition-colors flex-1 text-center group">
            <mat-icon class="text-[26px] w-6 h-6 mb-1 group-active:scale-90 transition-transform">fact_check</mat-icon>
            <span class="text-[10px] sm:text-xs font-semibold">Contagem</span>
          </a>
        }

        @if (authService.isEstoque()) {
          <a routerLink="/estoque" routerLinkActive="text-stone-900" class="flex flex-col items-center p-2 text-stone-400 hover:text-stone-900 transition-colors flex-1 text-center group">
            <mat-icon class="text-[26px] w-6 h-6 mb-1 group-active:scale-90 transition-transform">inventory_2</mat-icon>
            <span class="text-[10px] sm:text-xs font-semibold">Estoque</span>
          </a>
        }

        @if (!authService.isEstoque()) {
          <a routerLink="/limpeza" routerLinkActive="text-stone-900" class="flex flex-col items-center p-2 text-stone-400 hover:text-stone-900 transition-colors flex-1 text-center group">
            <mat-icon class="text-[26px] w-6 h-6 mb-1 group-active:scale-90 transition-transform">cleaning_services</mat-icon>
            <span class="text-[10px] sm:text-xs font-semibold">Checklists</span>
          </a>
        }

        <button (click)="toggleSidebar()" class="flex flex-col items-center p-2 text-stone-400 hover:text-stone-900 transition-colors flex-1 text-center group" [class.text-stone-900]="isSidebarOpen()">
          <mat-icon class="text-[26px] w-6 h-6 mb-1 group-active:scale-90 transition-transform">menu</mat-icon>
          <span class="text-[10px] sm:text-xs font-semibold">Menu</span>
        </button>
      </nav>
      
      <!-- Mobile App Drawer Overlay -->
      @if (isSidebarOpen()) {
        <div class="fixed inset-0 z-[70] bg-stone-50 flex flex-col md:hidden animate-in slide-in-from-bottom-full duration-300">
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
                <span class="font-bold text-stone-900 text-sm">Painel de Controle</span>
              </a>
              
              @if (authService.canManageTeam()) {
                <a routerLink="/equipe" (click)="toggleSidebar()" routerLinkActive="ring-2 ring-emerald-500 bg-emerald-50/50" class="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-2xl shadow-sm border border-stone-200 active:scale-95 transition-all">
                  <mat-icon class="text-[32px] w-8 h-8 text-blue-600">badge</mat-icon>
                  <span class="font-bold text-stone-900 text-sm text-center">Equipe</span>
                </a>
              }

              @if (!authService.isEstoque() && !authService.isAuditor()) {
                <a routerLink="/escalas" (click)="toggleSidebar()" routerLinkActive="ring-2 ring-emerald-500 bg-emerald-50/50" class="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-2xl shadow-sm border border-stone-200 active:scale-95 transition-all">
                  <mat-icon class="text-[32px] w-8 h-8 text-indigo-600">groups</mat-icon>
                  <span class="font-bold text-stone-900 text-sm text-center">Escalas</span>
                </a>
              }
                
              @if (!authService.isEstoque()) {
                <a routerLink="/producao" (click)="toggleSidebar()" routerLinkActive="ring-2 ring-emerald-500 bg-emerald-50/50" class="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-2xl shadow-sm border border-stone-200 active:scale-95 transition-all">
                  <mat-icon class="text-[32px] w-8 h-8 text-amber-600">receipt_long</mat-icon>
                  <span class="font-bold text-stone-900 text-sm text-center">Produção</span>
                </a>
                <a routerLink="/receitas" (click)="toggleSidebar()" routerLinkActive="ring-2 ring-emerald-500 bg-emerald-50/50" class="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-2xl shadow-sm border border-stone-200 active:scale-95 transition-all">
                  <mat-icon class="text-[32px] w-8 h-8 text-emerald-600">menu_book</mat-icon>
                  <span class="font-bold text-stone-900 text-sm text-center">Receitas</span>
                </a>
                <a routerLink="/desperdicio" (click)="toggleSidebar()" routerLinkActive="ring-2 ring-blue-500 bg-blue-50/50" class="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-2xl shadow-sm border border-stone-200 active:scale-95 transition-all">
                  <mat-icon class="text-[32px] w-8 h-8 text-rose-600">delete_sweep</mat-icon>
                  <span class="font-bold text-stone-900 text-sm text-center">Desperdício</span>
                </a>
              }
              
              @if (!authService.isCook()) {
                <a routerLink="/estoque" (click)="toggleSidebar()" routerLinkActive="ring-2 ring-emerald-500 bg-emerald-50/50" class="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-2xl shadow-sm border border-stone-200 active:scale-95 transition-all">
                  <mat-icon class="text-[32px] w-8 h-8 text-orange-600">inventory_2</mat-icon>
                  <span class="font-bold text-stone-900 text-sm text-center">Estoque</span>
                </a>
                <a routerLink="/compras" (click)="toggleSidebar()" routerLinkActive="ring-2 ring-emerald-500 bg-emerald-50/50" class="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-2xl shadow-sm border border-stone-200 active:scale-95 transition-all">
                  <mat-icon class="text-[32px] w-8 h-8 text-blue-600">local_shipping</mat-icon>
                  <span class="font-bold text-stone-900 text-sm text-center">Compras</span>
                </a>
              }

              @if (!authService.isAuditor()) {
                <a routerLink="/requisicoes" (click)="toggleSidebar()" routerLinkActive="ring-2 ring-emerald-500 bg-emerald-50/50" class="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-2xl shadow-sm border border-stone-200 active:scale-95 transition-all">
                  <mat-icon class="text-[32px] w-8 h-8 text-rose-600">shopping_cart</mat-icon>
                  <span class="font-bold text-stone-900 text-sm text-center">Requisições</span>
                </a>
              }

              @if (authService.isCook() || authService.isChef() || authService.isAdmin() || authService.isEstoque() || authService.isAuditor()) {
                <a routerLink="/contagem" (click)="toggleSidebar()" routerLinkActive="ring-2 ring-emerald-500 bg-emerald-50/50" class="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-2xl shadow-sm border border-stone-200 active:scale-95 transition-all">
                  <mat-icon class="text-[32px] w-8 h-8 text-teal-600">fact_check</mat-icon>
                  <span class="font-bold text-stone-900 text-sm text-center">Contagem</span>
                </a>
              }
              
              <a routerLink="/limpeza" (click)="toggleSidebar()" routerLinkActive="ring-2 ring-emerald-500 bg-emerald-50/50" class="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-2xl shadow-sm border border-stone-200 active:scale-95 transition-all">
                <mat-icon class="text-[32px] w-8 h-8 text-cyan-600">checklist</mat-icon>
                <span class="font-bold text-stone-900 text-sm text-center">Checklist</span>
              </a>
              
              <a routerLink="/comunicacao" (click)="toggleSidebar()" routerLinkActive="ring-2 ring-emerald-500 bg-emerald-50/50" class="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-2xl shadow-sm border border-stone-200 active:scale-95 transition-all">
                <mat-icon class="text-[32px] w-8 h-8 text-purple-600">campaign</mat-icon>
                <span class="font-bold text-stone-900 text-sm text-center">Comunicação</span>
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

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  logout() {
    this.authService.logout();
  }
}
