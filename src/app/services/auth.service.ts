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
  token = signal<string | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('kitchen_user');
      const storedToken = localStorage.getItem('kitchen_token');
      if (stored) {
        try {
          this.currentUser.set(JSON.parse(stored));
        } catch {
          localStorage.removeItem('kitchen_user');
        }
      }
      if (storedToken) {
        this.token.set(storedToken);
      }
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ user: User, token: string }>(`${environment.apiUrl}/login`, { email, password })
      );

      if (response && response.user && response.token) {
        this.currentUser.set(response.user);
        this.token.set(response.token);
        
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('kitchen_user', JSON.stringify(response.user));
          localStorage.setItem('kitchen_token', response.token);
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

  logout() {
    this.currentUser.set(null);
    this.token.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('kitchen_user');
      localStorage.removeItem('kitchen_token');
    }
    this.router.navigate(['/login']);
  }
}
