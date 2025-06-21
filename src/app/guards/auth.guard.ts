import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export function authGuard(role: string = ''): CanActivateFn {
  return (route, state) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('rol');
    if (!token) {
      // No logueado
      return false;
    }
    if (role && userRole !== role) {
      // Logueado pero no tiene el rol requerido
      return false;
    }
    return true;
  };
}
