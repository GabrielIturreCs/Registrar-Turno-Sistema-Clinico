import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export function authGuard(role: string | string[] = ''): CanActivateFn {
  return (route, state) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('rol');
    if (!token) {
      // No logueado
      return false;
    }
    if (role && role.length > 0) {
      // Si es un array de roles, verificar si el usuario tiene alguno de ellos
      if (Array.isArray(role)) {
        if (!role.includes(userRole || '')) {
          // Logueado pero no tiene ninguno de los roles requeridos
          return false;
        }
      } else {
        // Si es un string, verificar si coincide exactamente
        if (userRole !== role) {
          // Logueado pero no tiene el rol requerido
          return false;
        }
      }
    }
    return true;
  };
}
