import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LoginForm } from '../interfaces';
import { environment } from '../environments/environment';
import { User } from '../interfaces';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  hostBase: string;

  constructor(
    private router: Router,
    private _http: HttpClient,
    private notificationService: NotificationService
  ) {
    this.hostBase = `${environment.apiUrl}/usuario/`;
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
        console.log('👤 Usuario cargado desde localStorage:', user);
      } catch (error) {
        console.error('❌ Error al parsear usuario desde localStorage:', error);
        this.logout();
      }
    }
  }

  public login(nombreUsuario: string, password: string):Observable<any> 
  { 
     const httpOption = { 
       headers: new HttpHeaders({ 
         'Content-Type': 'application/json' 
       }) 
     } 
     let body = JSON.stringify({ 
      nombreUsuario: nombreUsuario, 
       password: password 
     }); 
     console.log(body); 
     return this._http.post(this.hostBase + 'login', body, httpOption); 
  }

  public googleLogin(credential: string): Observable<any> {
    console.log('🔍 === AUTH SERVICE: GOOGLE LOGIN ===');
    console.log('Credential recibido:', credential);
    console.log('Backend URL:', environment.apiUrl);
    
    const httpOption = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      withCredentials: true
    };
    
    const body = JSON.stringify({ token: credential });
    const url = environment.apiUrl + '/google-auth/verify-token';
    
    console.log('🌐 Enviando petición a:', url);
    console.log('📦 Body:', body);
    
    return this._http.post(url, body, httpOption).pipe(
      tap((response: any) => {
        console.log('✅ Respuesta exitosa del backend:', response);
      }),
      catchError(error => {
        console.error('❌ Error en petición al backend:', error);
        return throwError(error);
      })
    );
  }

  // Verificar si el usuario de Google tiene un perfil de paciente completo
  private checkPatientProfile(user: any): Observable<any> {
    const httpOption = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    
    return this._http.get(`${environment.apiUrl}/paciente/by-user/${user.id}`, httpOption);
  }

  // Crear perfil de paciente para usuario de Google
  public createPatientProfile(patientData: any): Observable<any> {
    const httpOption = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    
    return this._http.post(`${environment.apiUrl}/paciente`, patientData, httpOption);
  }

  // Verificar si el usuario actual necesita completar su perfil
  public needsProfileCompletion(): boolean {
    const user = this.getCurrentUser();
    return !!(user && (user.tipoUsuario === 'paciente') && !user.hasCompleteProfile);
  }

  // Obtener ID del paciente para el usuario actual
  public getCurrentPatientId(): string | null {
    const user = this.getCurrentUser();
    return user?.patientId || null;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // Métodos para manejar JWT token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  removeToken(): void {
    localStorage.removeItem('token');
  }

  // Método para obtener headers con autorización
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.currentUserSubject.value;
    
    // Si no hay token o usuario, no está autenticado
    if (!token || !user) {
      return false;
    }
    
    // Verificar si el token no ha expirado (opcional - solo verificación básica)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      
      if (payload.exp && payload.exp < now) {
        console.log('🔒 Token expirado, cerrando sesión');
        this.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error al verificar token:', error);
      this.logout();
      return false;
    }
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

    // Si es paciente de Google y no tiene perfil completo, redirigir a completar perfil
    if (user.tipoUsuario === 'paciente' && user.needsProfileCompletion) {
      this.router.navigate(['/complete-profile']);
      return;
    }

    switch (user.tipoUsuario) {
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