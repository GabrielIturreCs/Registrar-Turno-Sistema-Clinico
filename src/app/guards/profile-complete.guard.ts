import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileCompleteGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const user = this.authService.getCurrentUser();
    
    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }

    // Si es un paciente y necesita completar el perfil
    if (user.tipoUsuario === 'paciente' && user.needsProfileCompletion) {
      this.router.navigate(['/complete-profile']);
      return false;
    }

    return true;
  }
}
