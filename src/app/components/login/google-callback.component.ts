import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-google-callback',
  template: `
    <div class="container-fluid vh-100 d-flex align-items-center justify-content-center">
      <div class="text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <h4 class="mt-3">Procesando login con Google...</h4>
        <p class="text-muted">Por favor espera un momento</p>
      </div>
    </div>
  `,
  styles: [`
    .spinner-border {
      width: 3rem;
      height: 3rem;
    }
  `]
})
export class GoogleCallbackComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.handleGoogleCallback();
  }

  private handleGoogleCallback(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const userStr = params['user'];
      const error = params['error'];

      if (error) {
        console.error('Error en Google Auth:', error);
        this.notificationService.showError('Error al iniciar sesión con Google');
        this.router.navigate(['/login']);
        return;
      }

      if (token && userStr) {
        try {
          const user = JSON.parse(decodeURIComponent(userStr));
          
          // Guardar en localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('rol', user.tipoUsuario);
          localStorage.setItem('user', JSON.stringify(user));
          
          // Actualizar el servicio de autenticación
          this.authService.setCurrentUser(user);
          
          // Mostrar notificación de éxito
          const nombreUsuario = user.nombre || user.nombreUsuario || user.displayName || 'Usuario';
          this.notificationService.showSuccess(`¡Bienvenido ${nombreUsuario}!`);
          
          // Redirigir según el tipo de usuario
          this.redirectByUserType(user.tipoUsuario);
          
        } catch (error) {
          console.error('Error procesando datos de Google:', error);
          this.notificationService.showError('Error procesando datos de Google');
          this.router.navigate(['/login']);
        }
      } else {
        this.notificationService.showError('No se recibieron datos de Google');
        this.router.navigate(['/login']);
      }
    });
  }

  private redirectByUserType(tipoUsuario: string): void {
    switch (tipoUsuario) {
      case 'administrador':
        this.router.navigate(['/dashboard']);
        break;
      case 'dentista':
        this.router.navigate(['/dashboard']);
        break;
      case 'paciente':
        this.router.navigate(['/vistaPaciente']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }
}
