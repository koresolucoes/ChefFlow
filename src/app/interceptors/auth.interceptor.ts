import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  
  // Só tenta pegar o token se estiver rodando no navegador
  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('kitchen_token');
    
    if (token) {
      // Clona a requisição e adiciona o cabeçalho de Autorização (Bearer Token)
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next(authReq);
    }
  }
  
  return next(req);
};
