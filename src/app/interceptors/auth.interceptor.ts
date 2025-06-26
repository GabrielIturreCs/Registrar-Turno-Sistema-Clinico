// src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http'; 
import { HttpHeaders } from '@angular/common/http'; 
export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  // Obtiene el token de autenticación de tu aplicación almacenado en localStorage
  const appToken = localStorage.getItem('appToken');

  let headers = req.headers; // Empieza con las cabeceras existentes

  // Si existe un token, añade la cabecera de autorización
  if (appToken) {
    headers = headers.set('Authorization', `Bearer ${appToken}`);
  }

  // Clona la solicitud original con las nuevas cabeceras
  const clonedRequest = req.clone({
    headers: headers
  });

  // o hacia el backend si no hay más interceptores
  return next(clonedRequest);
};