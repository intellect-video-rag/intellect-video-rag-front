import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Send Bearer token for local API calls or relative paths, avoiding external third-party requests
  const shouldAddToken = req.url.startsWith('/') || req.url.includes('localhost') || req.url.includes('/api/');

  if (authService.isAuthenticated() && token && shouldAddToken) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized errors globally by logging out or forcing login
        if (error.status === 401) {
          console.warn('Unauthorized API request (401 status). Logging out...');
          authService.logout();
        }
        return throwError(() => error);
      })
    );
  }

  return next(req);
};
