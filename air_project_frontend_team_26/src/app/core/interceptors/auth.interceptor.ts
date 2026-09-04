import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const TOKEN_KEY = 'auth_token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);
  const router = inject(Router);

  // Read the token directly from localStorage to avoid circular dependency:
  // AuthService → HttpClient → authInterceptor → AuthService
  const token = localStorage.getItem(TOKEN_KEY);

  let authReq = req;
  if (token && !req.url.includes('/api/auth/login') && !req.url.includes('/api/auth/register')) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        // Lazily resolve AuthService only when needed (on 401)
        const authService = injector.get(AuthService);
        authService.clearAuthData();
        router.navigate(['/login'], { queryParams: { expired: 'true' } });
      }
      return throwError(() => error);
    })
  );
};
