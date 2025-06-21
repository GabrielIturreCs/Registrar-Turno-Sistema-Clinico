import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro',
  imports: [CommonModule, FormsModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent implements OnInit {
  currentView: string = 'register';
  isLoading: boolean = false;
  
  registerForm = {
    nombreUsuario: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    apellido: '',
    telefono: '',
    direccion: '',
    dni: '',
    tipoUsuario: 'paciente',
    obraSocial: ''
  };

  constructor(private router: Router) {}

  ngOnInit(): void {}

  register(): void {
    if (!this.canRegister) return;

    if (this.registerForm.password !== this.registerForm.confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    if (this.registerForm.tipoUsuario === 'paciente' && !this.registerForm.obraSocial) {
      alert('Los pacientes deben seleccionar una obra social.');
      return;
    }

    this.isLoading = true;

    // Simular registro
    setTimeout(() => {
      // Aquí normalmente harías una llamada al backend
      console.log('Usuario registrado:', this.registerForm);
      
      alert('¡Usuario registrado exitosamente!');
      this.router.navigate(['/login']);
      
      this.isLoading = false;
    }, 1000);
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  get canRegister(): boolean {
    return this.registerForm.nombreUsuario.trim() !== '' &&
           this.registerForm.password.trim() !== '' &&
           this.registerForm.confirmPassword.trim() !== '' &&
           this.registerForm.nombre.trim() !== '' &&
           this.registerForm.apellido.trim() !== '' &&
           this.registerForm.dni.trim() !== '' &&
           this.registerForm.password === this.registerForm.confirmPassword &&
           (this.registerForm.tipoUsuario !== 'paciente' || this.registerForm.obraSocial.trim() !== '');
  }
}
