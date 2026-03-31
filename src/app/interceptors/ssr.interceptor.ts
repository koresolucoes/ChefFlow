import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { of } from 'rxjs';

export const ssrInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  
  if (!isPlatformBrowser(platformId)) {
    // Return empty array for GET requests during SSR to prevent timeouts
    if (req.method === 'GET') {
      return of(new HttpResponse({ status: 200, body: [] }));
    }
    // For other methods, just return empty object
    return of(new HttpResponse({ status: 200, body: {} }));
  }
  
  return next(req);
};
