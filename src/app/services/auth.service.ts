import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LoginForm } from '../interfaces';
import { environment } from '../environments/environment';
import { User } from '../interfaces';
import { NotificationService } from './notification.service';

/*export interface User {
  id: number;
  nombreUsuario: string;
  nombre: string;
  apellido: string;
  tipoUsuario: string;
  dni?: string;
  telefono?: string;
  direccion?: string;
  obraSocial?: string;
}*/

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Datos de prueba
  /*private testData = {
    usuarios: [
      { id: 1, nombreUsuario: 'admin', password: 'password', nombre: 'Admin', apellido: 'Sistema', tipoUsuario: 'administrador', dni: '00000000', telefono: '1100000000' },
      { id: 2, nombreUsuario: 'dentista', password: 'password', nombre: 'Dr. María', apellido: 'González', tipoUsuario: 'dentista', dni: '12345678', telefono: '123456789' },
      { id: 3, nombreUsuario: 'paciente1', password: 'password', nombre: 'Juan', apellido: 'Pérez', tipoUsuario: 'paciente', dni: '87654321', telefono: '987654321', obraSocial: 'OSDE' }
    ]
  };*/

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

  /*login(nombreUsuario: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const foundUser = this.testData.usuarios.find(u => 
          u.nombreUsuario === nombreUsuario && 
          u.password === password
        );

        if (foundUser) {
          const user: User = {
            id: foundUser.id,
            nombreUsuario: foundUser.nombreUsuario,
            nombre: foundUser.nombre,
            apellido: foundUser.apellido,
            tipoUsuario: foundUser.tipoUsuario,
            dni: foundUser.dni,
            telefono: foundUser.telefono,
            obraSocial: foundUser.obraSocial
          };

          localStorage.setItem('token', 'fake-token-' + Date.now());
          localStorage.setItem('rol', user.tipoUsuario);
          localStorage.setItem('user', JSON.stringify(user));
          
          this.currentUserSubject.next(user);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 1000);
    });
  }*/
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
      withCredentials: true // Habilitar cookies
    };
    
    const body = JSON.stringify({ token: credential });
    const url = environment.apiUrl + '/google-auth/verify-token';
    
    console.log('🌐 Enviando petición a:', url);
    console.log('📦 Body:', body);
    
    return this._http.post(url, body, httpOption).pipe(
      tap(response => {
        console.log('✅ Respuesta exitosa del backend:', response);
      }),
      catchError(error => {
        console.error('❌ Error en petición al backend:', error);
        console.error('❌ Error status:', error.status);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error details:', error.error);
        return throwError(error);
      })
    );
  }

 /* register(userData: any): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Verificar si el usuario ya existe
        const existingUser = this.testData.usuarios.find(u => 
          u.nombreUsuario === userData.nombreUsuario || 
          u.dni === userData.dni
        );

        if (existingUser) {
          resolve(false);
          return;
        }

        // Agregar nuevo usuario
        const newId = Math.max(...this.testData.usuarios.map(u => u.id)) + 1;
        const newUser = {
          id: newId,
          nombreUsuario: userData.nombreUsuario,
          password: userData.password,
          nombre: userData.nombre,
          apellido: userData.apellido,
          tipoUsuario: userData.tipoUsuario,
          dni: userData.dni,
          telefono: userData.telefono,
          obraSocial: userData.obraSocial
        };

        this.testData.usuarios.push(newUser);
        resolve(true);
      }, 1000);
    });
  }*/

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

    switch (user.tipoUsuario) {
      case 'administrador':
        this.router.navigate(['/dashboard']);
        break;
      case 'dentista':
        this.router.navigate(['/dashboard']);
        break;
      case 'paciente':
        this.router.navigate(['/misTurnos']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }
} 