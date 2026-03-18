import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div class="p-8 sm:p-10">
          <div class="flex justify-center mb-8">
            <div class="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <mat-icon class="text-emerald-600 text-4xl w-10 h-10">restaurant_menu</mat-icon>
            </div>
          </div>
          
          <h2 class="text-2xl font-bold text-stone-900 text-center mb-2">ChefFlow</h2>
          <p class="text-stone-500 text-center mb-8">Acesse o sistema de gestão da cozinha</p>
          
          <form (ngSubmit)="onSubmit()" class="space-y-6">
            <div>
              <label for="email" class="block text-sm font-medium text-stone-700 mb-2">E-mail</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <mat-icon class="text-stone-400 text-[20px] w-5 h-5">email</mat-icon>
                </div>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  [(ngModel)]="email"
                  required
                  class="block w-full pl-10 pr-3 py-3 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-shadow" 
                  placeholder="chef@restaurante.com">
              </div>
            </div>
            
            <div>
              <div class="flex items-center justify-between mb-2">
                <label for="password" class="block text-sm font-medium text-stone-700">Senha</label>
                <a href="#" class="text-sm font-medium text-emerald-600 hover:text-emerald-500">Esqueceu a senha?</a>
              </div>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <mat-icon class="text-stone-400 text-[20px] w-5 h-5">lock</mat-icon>
                </div>
                <input 
                  type="password" 
                  id="password" 
                  name="password"
                  [(ngModel)]="password"
                  required
                  class="block w-full pl-10 pr-3 py-3 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-shadow" 
                  placeholder="••••••••">
              </div>
            </div>
            
            @if (error()) {
              <div class="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-100 flex items-start gap-2">
                <mat-icon class="text-[18px] w-4.5 h-4.5 shrink-0">error_outline</mat-icon>
                <span>{{ error() }}</span>
              </div>
            }

            <button 
              type="submit" 
              [disabled]="isLoading() || !email() || !password()"
              class="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors">
              @if (isLoading()) {
                <mat-icon class="animate-spin mr-2">refresh</mat-icon>
                Entrando...
              } @else {
                Entrar no Sistema
              }
            </button>
          </form>
        </div>
        <div class="px-8 py-6 bg-stone-50 border-t border-stone-100 text-center">
          <p class="text-sm text-stone-500">
            Não tem uma conta? <a href="#" class="font-medium text-emerald-600 hover:text-emerald-500">Fale com o Administrador</a>
          </p>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = signal('');
  password = signal('');
  isLoading = signal(false);
  error = signal('');

  async onSubmit() {
    if (!this.email() || !this.password()) return;
    
    this.isLoading.set(true);
    this.error.set('');
    
    try {
      const success = await this.authService.login(this.email(), this.password());
      if (!success) {
        this.error.set('E-mail ou senha incorretos.');
      }
    } catch {
      this.error.set('Ocorreu um erro ao tentar fazer login.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
