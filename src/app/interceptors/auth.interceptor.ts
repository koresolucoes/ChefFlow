import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);
  
  let authReq = req;
  
  // Só tenta pegar o token se estiver rodando no navegador
  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('kitchen_token');
    
    if (token) {
      // Clona a requisição e adiciona o cabeçalho de Autorização (Bearer Token)
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }
  
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token is invalid, expired, or missing
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
