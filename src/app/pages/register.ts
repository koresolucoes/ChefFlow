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
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="flex justify-center text-indigo-600">
          <mat-icon class="!w-12 !h-12 !text-5xl">restaurant</mat-icon>
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Cadastre seu Restaurante
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Ou
          <a routerLink="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
            faça login em uma conta existente
          </a>
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-6">
            
            <!-- Nome do Restaurante -->
            <div>
              <label for="restaurantName" class="block text-sm font-medium text-gray-700">Nome do Restaurante</label>
              <div class="mt-1">
                <input id="restaurantName" type="text" formControlName="restaurantName" required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>
            </div>

            <!-- Nome do Usuário -->
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">Seu Nome</label>
              <div class="mt-1">
                <input id="name" type="text" formControlName="name" required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>
            </div>

            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
              <div class="mt-1">
                <input id="email" type="email" formControlName="email" required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>
            </div>

            <!-- Senha -->
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">Senha</label>
              <div class="mt-1">
                <input id="password" type="password" formControlName="password" required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>
            </div>

            @if (error()) {
              <div class="rounded-md bg-red-50 p-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <mat-icon class="text-red-400">error</mat-icon>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">{{ error() }}</h3>
                  </div>
                </div>
              </div>
            }

            @if (success()) {
              <div class="rounded-md bg-green-50 p-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <mat-icon class="text-green-400">check_circle</mat-icon>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-green-800">{{ success() }}</h3>
                  </div>
                </div>
              </div>
            }

            <div>
              <button type="submit" [disabled]="registerForm.invalid || loading()"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                @if (loading()) {
                  <mat-icon class="animate-spin mr-2">refresh</mat-icon>
                  Cadastrando...
                } @else {
                  Criar Conta
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

    this.http.post<{message: string}>(environment.apiUrl + '/api/register', {
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
