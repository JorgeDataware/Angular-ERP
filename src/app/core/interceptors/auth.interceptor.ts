import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Interceptor HTTP que:
 * 1. Agrega el header Authorization: Bearer {token} a todas las peticiones autenticadas
 * 2. Redirige al login si recibe un 401 (token inválido/expirado)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('auth_token');

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token inválido o expirado — limpiar sesión y redirigir al login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_permissions');
        localStorage.removeItem('auth_expires_at');
        localStorage.removeItem('auth_user');
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};
