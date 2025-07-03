import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export function authGuard(role: string | string[] = ''): CanActivateFn {
  return (route, state) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('rol');
    const user = localStorage.getItem('user');
    
    console.log('AuthGuard: Verificando acceso a', state.url);
    console.log('AuthGuard: Token:', token ? 'Presente' : 'Ausente');
    console.log('AuthGuard: Rol:', userRole);
    console.log('AuthGuard: Usuario:', user ? 'Presente' : 'Ausente');
    console.log('AuthGuard: Rol requerido:', role);
    
    if (!token) {
      console.log('AuthGuard: No hay token, redirigiendo a login');
      return false;
    }
    
    if (role && role.length > 0) {
      // Si es un array de roles, verificar si el usuario tiene alguno de ellos
      if (Array.isArray(role)) {
        if (!role.includes(userRole || '')) {
          console.log('AuthGuard: Usuario no tiene ninguno de los roles requeridos:', role);
          return false;
        }
      } else {
        // Si es un string, verificar si coincide exactamente
        if (userRole !== role) {
          console.log('AuthGuard: Usuario no tiene el rol requerido. Tiene:', userRole, 'Requiere:', role);
          return false;
        }
      }
    }
    
    console.log('AuthGuard: Acceso permitido');
    return true;
  };
}
