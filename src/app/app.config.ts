import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  LOCALE_ID
} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideHttpClient, withFetch, withInterceptors} from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

registerLocaleData(localePt, 'pt-BR');

import {routes} from './app.routes';
import {authInterceptor} from './interceptors/auth.interceptor';
import {ssrInterceptor} from './interceptors/ssr.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(), 
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([ssrInterceptor, authInterceptor])
    ),
    { provide: LOCALE_ID, useValue: 'pt-BR' }
  ],
};
