import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface User {
  id: number;
  nombreUsuario: string;
  nombre: string;
  apellido: string;
  tipoUsuario: string;
}

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  isLoading: boolean = false;
  
  loginForm = {
    nombreUsuario: '',
    password: ''
  };

  // Datos de prueba
  testData = {
    usuarios: [
      { id: 1, nombreUsuario: 'admin', password: 'password', nombre: 'Admin', apellido: 'Sistema', tipoUsuario: 'administrador', dni: '00000000', telefono: '1100000000' },
      { id: 2, nombreUsuario: 'dentista', password: 'password', nombre: 'Dr. María', apellido: 'González', tipoUsuario: 'dentista', dni: '12345678', telefono: '123456789' },
      { id: 3, nombreUsuario: 'paciente1', password: 'password', nombre: 'Juan', apellido: 'Pérez', tipoUsuario: 'paciente', dni: '87654321', telefono: '987654321' }
    ]
  };

  constructor(private router: Router) {}

  ngOnInit(): void {}

  login(): void {
    if (!this.canLogin) return;

    this.isLoading = true;
    
    // Simular autenticación
    setTimeout(() => {
      const foundUser = this.testData.usuarios.find(u => 
        u.nombreUsuario === this.loginForm.nombreUsuario && 
        u.password === this.loginForm.password
      );

      if (foundUser) {
        const user = {
          id: foundUser.id,
          nombreUsuario: foundUser.nombreUsuario,
          nombre: foundUser.nombre,
          apellido: foundUser.apellido,
          tipoUsuario: foundUser.tipoUsuario
        };
        
        // Guardar en localStorage
        localStorage.setItem('token', 'fake-token-' + Date.now());
        localStorage.setItem('rol', user.tipoUsuario);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Redirigir según el tipo de usuario
        this.redirectByUserType(user.tipoUsuario);
      } else {
        alert('Usuario o contraseña incorrectos.');
      }
      
      this.isLoading = false;
    }, 1000);
  }

  navigateToRegister(): void {
    this.router.navigate(['/registro']);
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
        this.router.navigate(['/misTurnos']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }

  get canLogin(): boolean {
    return this.loginForm.nombreUsuario.trim() !== '' && 
           this.loginForm.password.trim() !== '';
  }
}
