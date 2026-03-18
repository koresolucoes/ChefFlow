import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'chef' | 'cook';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  
  currentUser = signal<User | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('kitchen_user');
      if (stored) {
        try {
          this.currentUser.set(JSON.parse(stored));
        } catch {
          localStorage.removeItem('kitchen_user');
        }
      }
    }
  }

  // Exemplo de como será a chamada REAL para a sua API na Vercel
  async loginReal(email: string, password: string): Promise<boolean> {
    try {
      // Faz o POST para a sua API na Vercel (que conecta no Neon)
      const response = await firstValueFrom(
        this.http.post<{ user: User, token: string }>(`${environment.apiUrl}/login`, { email, password })
      );

      if (response && response.user && response.token) {
        this.currentUser.set(response.user);
        
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('kitchen_user', JSON.stringify(response.user));
          localStorage.setItem('kitchen_token', response.token); // Salva o JWT
        }
        
        this.router.navigate(['/']);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  }

  // Mantendo o mock temporário para o preview funcionar
  login(email: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (email && password) {
          const mockUser: User = {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Chef Executivo',
            email: email,
            role: 'chef'
          };
          this.currentUser.set(mockUser);
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('kitchen_user', JSON.stringify(mockUser));
          }
          this.router.navigate(['/']);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 800);
    });
  }

  logout() {
    this.currentUser.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('kitchen_user');
      localStorage.removeItem('kitchen_token');
    }
    this.router.navigate(['/login']);
  }
}
