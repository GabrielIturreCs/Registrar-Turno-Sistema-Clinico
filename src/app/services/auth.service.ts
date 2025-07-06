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
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.currentUserSubject.next(user);
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
    localStorage.clear();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
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