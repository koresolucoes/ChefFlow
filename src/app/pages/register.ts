import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-stone-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="flex justify-center mb-8">
          <div class="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
            <mat-icon class="text-emerald-600 text-4xl w-10 h-10">restaurant_menu</mat-icon>
          </div>
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-stone-900">
          ChefFlow
        </h2>
        <p class="mt-2 text-center text-sm text-stone-600">
          Cadastre seu restaurante ou
          <a routerLink="/login" class="font-medium text-emerald-600 hover:text-emerald-500">
            faça login em uma conta existente
          </a>
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-stone-100">
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-6">
            
            <!-- Nome do Restaurante -->
            <div>
              <label for="restaurantName" class="block text-sm font-medium text-stone-700 mb-2">Nome do Restaurante</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <mat-icon class="text-stone-400 text-[20px] w-5 h-5">storefront</mat-icon>
                </div>
                <input id="restaurantName" type="text" formControlName="restaurantName" required
                  class="block w-full pl-10 pr-3 py-3 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-shadow" placeholder="Ex: Cantina do Chef">
              </div>
            </div>

            <!-- Nome do Usuário -->
            <div>
              <label for="name" class="block text-sm font-medium text-stone-700 mb-2">Seu Nome (Chef Executivo / Admin)</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <mat-icon class="text-stone-400 text-[20px] w-5 h-5">person</mat-icon>
                </div>
                <input id="name" type="text" formControlName="name" required
                  class="block w-full pl-10 pr-3 py-3 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-shadow" placeholder="João Silva">
              </div>
            </div>

            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-stone-700 mb-2">E-mail</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <mat-icon class="text-stone-400 text-[20px] w-5 h-5">email</mat-icon>
                </div>
                <input id="email" type="email" formControlName="email" required
                  class="block w-full pl-10 pr-3 py-3 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-shadow" placeholder="joao@restaurante.com">
              </div>
            </div>

            <!-- Senha -->
            <div>
              <label for="password" class="block text-sm font-medium text-stone-700 mb-2">Senha</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <mat-icon class="text-stone-400 text-[20px] w-5 h-5">lock</mat-icon>
                </div>
                <input id="password" type="password" formControlName="password" required
                  class="block w-full pl-10 pr-3 py-3 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-shadow" placeholder="••••••••">
              </div>
            </div>

            @if (error()) {
              <div class="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-100 flex items-start gap-2">
                <mat-icon class="text-[18px] w-4.5 h-4.5 shrink-0">error_outline</mat-icon>
                <span>{{ error() }}</span>
              </div>
            }

            @if (success()) {
              <div class="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-100 flex items-start gap-2">
                <mat-icon class="text-[18px] w-4.5 h-4.5 shrink-0">check_circle</mat-icon>
                <span>{{ success() }}</span>
              </div>
            }

            <div>
              <button type="submit" [disabled]="registerForm.invalid || loading()"
                class="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors">
                @if (loading()) {
                  <mat-icon class="animate-spin mr-2">refresh</mat-icon>
                  Criando conta...
                } @else {
                  Cadastrar Restaurante
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);

  registerForm = this.fb.group({
    restaurantName: ['', Validators.required],
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  async onSubmit() {
    if (this.registerForm.invalid) return;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const { restaurantName, name, email, password } = this.registerForm.value;

    this.http.post<{message: string}>(environment.apiUrl + '/register', {
      restaurantName,
      name,
      email,
      password
    }).subscribe({
      next: () => {
        this.success.set('Conta criada com sucesso! Redirecionando...');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Erro ao criar conta. Tente novamente.');
        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }
}
