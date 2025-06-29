import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { User, LoginForm } from '../../interfaces'; // Asegúrate que User y LoginForm sean correctas
import { AuthService } from '../../services/auth.service';
import { environment } from '../../environments/environment'; // <<< ¡Asegúrate de importar environment!

// Declaración global para la librería de Google Identity Services
declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  isLoading: boolean = false;
  msglogin: string = '';
  emailConfirmMessage: string = '';

  loginForm: LoginForm = {
    nombreUsuario: '', // Campo principal para el login 
    password: '',
    email: '', // Este campo existirá en el modelo de formulario
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Comprobar si el usuario viene de una confirmación de email
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params['emailConfirmado'] === 'true') {
        if (params['status'] === 'success') {
          this.emailConfirmMessage =
            '¡Tu cuenta ha sido confirmada con éxito! Ya puedes iniciar sesión.';
        } else if (params['status'] === 'alreadyConfirmed') {
          this.emailConfirmMessage =
            'Tu cuenta ya estaba confirmada. Por favor, inicia sesión.';
        }
        // Limpiar los query params para que el mensaje no se muestre en futuras cargas
        this.router.navigate([], {
          queryParams: { emailConfirmado: null, status: null },
          queryParamsHandling: 'merge',
        });
      }
    });
  }

  // --- Ciclo de vida AfterViewInit para inicializar Google ---
  ngAfterViewInit(): void {
    // Cargar el script de Google Identity Services dinámicamente si no está ya en el DOM
    if (!document.getElementById('google-identity-script')) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.id = 'google-identity-script';
      document.head.appendChild(script);

      script.onload = () => {
        // Una vez que el script de Google cargue, inicializar el cliente de Google
        this.initializeGoogleSignIn();
      };
    } else {
      // Si el script ya está cargado (ej. navegación de SPA), solo inicializar
      this.initializeGoogleSignIn();
    }
  }

  // --- Ciclo de vida OnDestroy para limpiar recursos de Google ---
  ngOnDestroy(): void {
    // Opcional: limpiar la referencia del botón de Google al destruir el componente
    if (typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.cancel();
    }
  }

  // --- Inicialización del cliente de Google Identity Services ---
  private initializeGoogleSignIn(): void {
    // Verificar si la librería de Google ya está disponible
    if (typeof google === 'undefined' || !google.accounts) {
      console.warn(
        'Google Identity Services no está disponible. Reintentando...'
      );
      setTimeout(() => this.initializeGoogleSignIn(), 500); // Reintentar si no cargó completamente
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId, // Client ID de tu entorno (environment.ts)
      callback: (response: any) =>
        this.handleGoogleCredentialResponse(response),
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Renderizar el botón de Google en el div `#google-login-button`
    google.accounts.id.renderButton(
      document.getElementById('google-login-button'),
      {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        shape: 'rectangular',
        text: 'signin_with',
        width: '380',
      }
    );
  }

  // --- Manejador de la respuesta de credenciales de Google ---
  private handleGoogleCredentialResponse(response: any): void {
    console.log('ID Token de Google recibido:', response.credential);

    if (response.credential) {
      this.isLoading = true;
      this.msglogin = 'Iniciando sesión con Google...';

      this.authService.googleLogin(response.credential).subscribe({
        next: (res) => {
          if (res.success && res.appToken) {
            console.log('Login con Google exitoso:', res.message);
            this.msglogin = res.message;
          } else {
            this.msglogin = res.message || 'Fallo el login con Google.';
          }
        },
        error: (error) => {
          console.error('Error durante el login con Google:', error);
          this.msglogin =
            error.error?.message ||
            'Error al conectar con Google o el servidor.';
        },
        complete: () => {
          this.isLoading = false;
        },
      });
    } else {
      this.msglogin = 'No se recibió la credencial de Google.';
    }
  }

  // --- Método de Login Tradicional (NOMBRE DE USUARIO / Contraseña) ---
  login(): void {
    
    if (
      !this.loginForm.nombreUsuario.trim() ||
      !this.loginForm.password.trim()
    ) {
      this.msglogin = 'Por favor, ingresa tu nombre de usuario y contraseña.';
      return;
    }

    this.isLoading = true;
    this.msglogin = '';

    // Verificar si es un usuario de prueba
    if (this.isTestUser()) {
      this.handleTestUserLogin();
      return;
    }

    this.authService
      
      .login(this.loginForm.nombreUsuario, this.loginForm.password)
      .subscribe({
        next: (res) => {
          this.msglogin = res.message || 'Login exitoso.';
        },
        error: (error) => {
          console.error('Error durante el login:', error);
          // Mostrar el mensaje de error que viene del AuthService (que a su vez viene del backend)
          this.msglogin = error.message;
        },
        complete: () => {
          this.isLoading = false;
        },
      });
  }

  // Método para verificar si es un usuario de prueba
  private isTestUser(): boolean {
    const testUsers = [
      { username: 'admin', password: 'password', tipo: 'administrador' },
      { username: 'dentista', password: 'password', tipo: 'dentista' },
      { username: 'paciente1', password: 'password', tipo: 'paciente' }
    ];

    return testUsers.some(user => 
      user.username === this.loginForm.nombreUsuario && 
      user.password === this.loginForm.password
    );
  }

  // Método para manejar el login de usuarios de prueba
  private handleTestUserLogin(): void {
    const testUsers = [
      { username: 'admin', password: 'password', tipo: 'administrador' },
      { username: 'dentista', password: 'password', tipo: 'dentista' },
      { username: 'paciente1', password: 'password', tipo: 'paciente' }
    ];

    const testUser = testUsers.find(user => 
      user.username === this.loginForm.nombreUsuario && 
      user.password === this.loginForm.password
    );

    if (testUser) {
      // Crear un token de prueba y datos de usuario
      const testToken = 'test-token-' + Date.now();
      const testUserData = {
        id: 'test-' + testUser.username,
        nombreUsuario: testUser.username,
        tipoUsuario: testUser.tipo,
        email: testUser.username + '@test.com',
        nombre: 'Usuario de Prueba ' + testUser.tipo,
        apellido: 'Test',
        telefono: '',
        direccion: '',
        dni: '',
        obraSocial: ''
      };

      // Guardar en localStorage (simulando el comportamiento del AuthService)
      localStorage.setItem('token', testToken);
      localStorage.setItem('rol', testUser.tipo);
      localStorage.setItem('user', JSON.stringify(testUserData));

      // Actualizar el currentUserSubject del AuthService
      this.authService['currentUserSubject'].next(testUserData);

      this.msglogin = `Login exitoso como ${testUser.tipo} de prueba`;
      
      // Redirigir según el tipo de usuario
      setTimeout(() => {
        this.redirectByUserType(testUser.tipo);
      }, 1000);
    }

    this.isLoading = false;
  }

  // Método placeholder para el login con Google (solo vista)
  loginWithGoogle() {
    // Solo placeholder visual, la funcionalidad será implementada por el equipo de backend
  }

  navigateToRegister(): void {
    this.router.navigate(['/registro']);
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  private redirectByUserType(tipoUsuario: string): void {
    switch (tipoUsuario) {
      case 'administrador':
        this.router.navigate(['/dashboard']);
        break;
      case 'dentista':
        this.router.navigate(['/agenda']);
        break;
      case 'paciente':
        this.router.navigate(['/dashboard']); // Redirigir a dashboard de paciente
        break;
      default:
        this.router.navigate(['/']);
    }
  }

  // Getter para habilitar/deshabilitar el botón de login
  get canLogin(): boolean {
    return (
      this.loginForm.nombreUsuario.trim() !== '' &&
      this.loginForm.password.trim() !== ''
    );
  }
}
