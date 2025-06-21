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

interface Tratamiento {
  id: number;
  descripcion: string;
  precio: number;
  duracion: number;
}

interface Paciente {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  obraSocial: string;
}

@Component({
  selector: 'app-reservar',
  imports: [CommonModule, FormsModule],
  templateUrl: './reservar.component.html',
  styleUrl: './reservar.component.css'
})
export class ReservarComponent implements OnInit {
  user: User | null = null;
  isLoading: boolean = false;

  turnoForm = {
    pacienteId: '',
    fecha: '',
    hora: '',
    tratamientoId: ''
  };

  tratamientos: Tratamiento[] = [];
  pacientes: Paciente[] = [];

  // Datos de prueba
  testData = {
    tratamientos: [
      { id: 1, descripcion: 'Consulta General', precio: 5000, duracion: 30 },
      { id: 2, descripcion: 'Limpieza Dental', precio: 8000, duracion: 45 },
      { id: 3, descripcion: 'Empaste', precio: 12000, duracion: 60 },
      { id: 4, descripcion: 'Extracción', precio: 15000, duracion: 30 },
      { id: 5, descripcion: 'Ortodoncia - Consulta', precio: 10000, duracion: 45 }
    ],
    pacientes: [
      { id: 1, nombre: 'Juan', apellido: 'Pérez', dni: '87654321', obraSocial: 'OSDE' },
      { id: 2, nombre: 'María', apellido: 'García', dni: '20123456', obraSocial: 'Swiss Medical' },
      { id: 3, nombre: 'Carlos', apellido: 'López', dni: '25789123', obraSocial: 'OSDE' }
    ]
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadData();
  }

  loadUserData(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.user = JSON.parse(userStr);
    } else {
      this.router.navigate(['/login']);
    }
  }

  loadData(): void {
    this.tratamientos = this.testData.tratamientos;
    this.pacientes = this.testData.pacientes;
  }

  registrarTurno(): void {
    if (!this.canRegisterTurno) return;

    this.isLoading = true;

    // Simular registro de turno
    setTimeout(() => {
      const tratamiento = this.tratamientos.find(t => t.id === Number(this.turnoForm.tratamientoId));
      const paciente = this.pacientes.find(p => p.id === Number(this.turnoForm.pacienteId));

      if (tratamiento) {
        const nuevoTurno = {
          id: Date.now(),
          nroTurno: 'T' + String(Date.now()).slice(-4),
          fecha: this.turnoForm.fecha,
          hora: this.turnoForm.hora,
          estado: 'reservado',
          tratamiento: tratamiento.descripcion,
          precioFinal: tratamiento.precio,
          nombre: paciente?.nombre || this.user?.nombre,
          apellido: paciente?.apellido || this.user?.apellido,
          pacienteId: Number(this.turnoForm.pacienteId) || this.user?.id,
          tratamientoId: Number(this.turnoForm.tratamientoId)
        };

        console.log('Turno registrado:', nuevoTurno);
        alert('¡Turno registrado exitosamente!');
        this.router.navigate(['/dashboard']);
      }
      
      this.isLoading = false;
    }, 1000);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  get canRegisterTurno(): boolean {
    if (this.user?.tipoUsuario !== 'paciente' && !this.turnoForm.pacienteId) {
      return false;
    }
    return this.turnoForm.fecha.trim() !== '' &&
           this.turnoForm.hora.trim() !== '' &&
           this.turnoForm.tratamientoId.trim() !== '';
  }
}
