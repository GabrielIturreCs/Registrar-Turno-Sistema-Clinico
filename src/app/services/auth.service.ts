import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common'; 
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { User } from '../interfaces'; 
import { tap, catchError } from 'rxjs/operators'; 
import { environment } from '../environments/environment'; 

// Declaración global para la librería de Google, para que TypeScript no de error
declare const google: any;

// Definición de la interfaz de respuesta de login de tu BACKEND
interface LoginBackendResponse {
  success: boolean;
  message: string;
  appToken?: string; // El token JWT de la aplicación
  user?: {
    id: string; // 
    nombreUsuario: string;
    email: string;
    tipoUsuario: string;
    nombre: string;
    apellido: string;
    telefono?: string; 
    direccion?: string;
    dni?: string;
    obraSocial?: string; 
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  hostBase: string; // La URL base de la API de autenticación

  constructor(
    private router: Router,
    private _http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object // Inyecta PLATFORM_ID
  ) {
    this.hostBase = 'http://localhost:3000/api/auth/'; // URL base del backend
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    // Usa isPlatformBrowser para acceder a localStorage solo en el navegador
    if (isPlatformBrowser(this.platformId)) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          this.currentUserSubject.next(user);
        } catch (e) {
          console.error('Error al parsear usuario de localStorage:', e);
          localStorage.clear(); // Limpiar si los datos están corruptos
          this.currentUserSubject.next(null);
        }
      }
    }
  }

  public login(
    nombreUsuario: string, 
    password: string
  ): Observable<LoginBackendResponse> {
    const httpOption = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };
    const body = JSON.stringify({
      nombreUsuario: nombreUsuario,
      password: password,
    });
    console.log("Enviando credenciales de login:", body);
    return this._http
      .post<LoginBackendResponse>(this.hostBase + 'login', body, httpOption)
      .pipe(
        tap((response) => {
          if (response.success && response.appToken && response.user) {
            console.log('Login exitoso. Respuesta del backend:', response);
            // Guardar token y datos completos del usuario
            localStorage.setItem('token', response.appToken);
            localStorage.setItem('rol', response.user.tipoUsuario || '');
            localStorage.setItem('user', JSON.stringify(response.user));

            this.currentUserSubject.next({
              id: response.user.id, // ID es string de Mongoose
              nombreUsuario: response.user.nombreUsuario,
              tipoUsuario: response.user.tipoUsuario,
              nombre: response.user.nombre,
              apellido: response.user.apellido,
              email: response.user.email,
              telefono: response.user.telefono || '',
              direccion: response.user.direccion || '',
              dni: response.user.dni || '',
              obraSocial: response.user.obraSocial || '', 
            });

            // Redireccionar al usuario inmediatamente después de actualizar el estado
            this.redirectByUserType();
          } else {
            console.warn('Login fallido o respuesta inesperada:', response);
            // Si el backend envía un 'message' en caso de fallo
            throw new Error(response.message || 'Error desconocido al iniciar sesión.');
          }
        }),
        catchError((errorRes) => {
          // Captura errores HTTP y relanza un error legible para el componente
          console.error("Error en AuthService.login:", errorRes);
          let errorMessage = 'Error de conexión con el servidor.';
          if (errorRes.error && errorRes.error.message) {
            errorMessage = errorRes.error.message; // Mensaje del backend
          } else if (errorRes.statusText) {
            errorMessage = `Error ${errorRes.status}: ${errorRes.statusText}`;
          }
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // --- NUEVO MÉTODO PARA GOOGLE LOGIN ---
  public googleLogin(credential: string): Observable<LoginBackendResponse> {
    const httpOption = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };
    const body = JSON.stringify({ credential: credential }); // El backend espera un objeto { credential: "..." }
    console.log("Enviando credencial de Google:", body);

    return this._http
      .post<LoginBackendResponse>(this.hostBase + 'google-login', body, httpOption)
      .pipe(
        tap((response) => {
          if (response.success && response.appToken && response.user) {
            console.log("Login con Google exitoso. Respuesta del backend:", response);
            localStorage.setItem('token', response.appToken);
            localStorage.setItem('rol', response.user.tipoUsuario || '');
            localStorage.setItem('user', JSON.stringify(response.user));

            this.currentUserSubject.next({
              id: response.user.id,
              nombreUsuario: response.user.nombreUsuario,
              tipoUsuario: response.user.tipoUsuario,
              nombre: response.user.nombre,
              apellido: response.user.apellido,
              email: response.user.email,
              telefono: response.user.telefono || '',
              direccion: response.user.direccion || '',
              dni: response.user.dni || '',
              obraSocial: response.user.obraSocial || '',
            });

            this.redirectByUserType(); // Redirige después de un login exitoso con Google
          } else {
            console.warn("Login con Google fallido o respuesta inesperada:", response);
            throw new Error(response.message || 'Error desconocido al iniciar sesión con Google.');
          }
        }),
        catchError((errorRes) => {
          console.error("Error en AuthService.googleLogin:", errorRes);
          let errorMessage = 'Error de conexión con el servidor al intentar Google Login.';
          if (errorRes.error && errorRes.error.message) {
            errorMessage = errorRes.error.message;
          } else if (errorRes.statusText) {
            errorMessage = `Error ${errorRes.status}: ${errorRes.statusText}`;
          }
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  logout(): void {
    // Si estás usando Google Sign-In con un botón custom o el One Tap,
    // es buena práctica revocar la sesión de Google también.
    if (isPlatformBrowser(this.platformId) && typeof google !== 'undefined' && google.accounts) {
        // Para revocar, necesitas el email de la cuenta de Google con la que se logueó el usuario.
        // Asegúrate de que lo guardas en localStorage o lo tienes accesible.
        const userStored = localStorage.getItem('user');
        let userEmailToRevoke: string | null = null;
        if (userStored) {
            try {
                const parsedUser = JSON.parse(userStored);
                userEmailToRevoke = parsedUser.email;
            } catch (e) {
                console.error("Error parsing user from localStorage for Google logout:", e);
            }
        }

        if (userEmailToRevoke) {
            google.accounts.id.revoke(userEmailToRevoke, (done: boolean) => {
                console.log('Google session revoked:', done); // 'done' será true si la revocación fue exitosa
            });
        }
    }
    localStorage.clear(); // Limpia todos los datos de la sesión local
    this.currentUserSubject.next(null); // Establece el usuario actual a null
    this.router.navigate(['/login']); // Redirige al login
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    // Verificar si hay un token en localStorage Y el usuario en el BehaviorSubject,
    // y solo si estamos en un navegador (no en SSR).
    return isPlatformBrowser(this.platformId) && !!localStorage.getItem('token') && this.currentUserSubject.value !== null;
  }

  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return user?.tipoUsuario === role;
  }

  redirectByUserType(): void {
    const user = this.currentUserSubject.value;
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    switch (user.tipoUsuario) {
      case 'administrador':
        this.router.navigate(['/dashboard']);
        break;
      case 'dentista':
        this.router.navigate(['/agenda']);
        break;
      case 'paciente':
        this.router.navigate(['/misTurnos']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }
}
