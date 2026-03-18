import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'chef' | 'cook';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  
  currentUser = signal<User | null>(null);

  constructor() {
    const stored = localStorage.getItem('kitchen_user');
    if (stored) {
      try {
        this.currentUser.set(JSON.parse(stored));
      } catch {
        localStorage.removeItem('kitchen_user');
      }
    }
  }

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
          localStorage.setItem('kitchen_user', JSON.stringify(mockUser));
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
    localStorage.removeItem('kitchen_user');
    this.router.navigate(['/login']);
  }
}
