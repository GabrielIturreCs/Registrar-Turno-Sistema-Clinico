import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export function authGuard(role: string | string[] = ''): CanActivateFn {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    console.log('🛡️ AuthGuard: Verificando acceso a', state.url);
    
    // Verificar si viene de un pago exitoso (caso especial)
    const urlParams = new URLSearchParams(state.url.split('?')[1] || '');
    const isReturnFromPayment = urlParams.get('returnFromPayment') === 'true' || 
                               urlParams.get('payment') === 'success' ||
                               sessionStorage.getItem('payment_success') === 'true';
    
    if (isReturnFromPayment) {
      console.log('🛡️ AuthGuard: Detectado retorno de pago exitoso');
      // Verificar si la sesión está activa
      const isAuthenticated = authService.isAuthenticated();
      console.log('🛡️ AuthGuard: Usuario autenticado en retorno de pago:', isAuthenticated);
      
      if (!isAuthenticated) {
        console.log('🛡️ AuthGuard: Sesión perdida incluso con pago exitoso, redirigiendo a login');
        router.navigate(['/login']);
        return false;
      }
      
      return true;
    }
    
    // Verificación normal de autenticación
    const isAuthenticated = authService.isAuthenticated();
    const currentUser = authService.getCurrentUser();
    
    console.log('🛡️ AuthGuard: Usuario autenticado:', isAuthenticated);
    console.log('🛡️ AuthGuard: Usuario actual:', currentUser);
    console.log('🛡️ AuthGuard: Rol requerido:', role);
    
    if (!isAuthenticated) {
      console.log('🛡️ AuthGuard: No autenticado, redirigiendo a login');
      router.navigate(['/login']);
      return false;
    }
    
    // Verificar roles si es necesario
    if (role && role.length > 0 && currentUser) {
      const userRole = currentUser.tipoUsuario;
      
      // Si es un array de roles, verificar si el usuario tiene alguno de ellos
      if (Array.isArray(role)) {
        if (!role.includes(userRole || '')) {
          console.log('🛡️ AuthGuard: Usuario no tiene ninguno de los roles requeridos:', role);
          router.navigate(['/login']);
          return false;
        }
      } else {
        // Si es un string, verificar si coincide exactamente
        if (userRole !== role) {
          console.log('🛡️ AuthGuard: Usuario no tiene el rol requerido. Tiene:', userRole, 'Requiere:', role);
          router.navigate(['/login']);
          return false;
        }
      }
    }
    
    console.log('🛡️ AuthGuard: Acceso permitido');
    return true;
  };
}
