// src/app/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Obtener el token del localStorage
    const token = localStorage.getItem('token');
    
    // Configurar headers y credentials
    const headers: { [key: string]: string } = {};
    
    // Si hay token, agregarlo al header Authorization
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Clonar la request con headers y credentials
    const authRequest = request.clone({
      setHeaders: headers,
      withCredentials: true // Siempre enviar cookies
    });

    // Continuar con la petición
    return next.handle(authRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        // Manejar errores de autenticación
        if (error.status === 401) {
          // Token expirado o inválido
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('rol');
          
          // Redirigir al login
          this.router.navigate(['/login']);
          
          return throwError(() => new Error('Sesión expirada. Por favor, inicie sesión nuevamente.'));
        }
        
        // Para otros errores, simplemente re-lanzar el error
        return throwError(() => error);
      })
    );
  }
}