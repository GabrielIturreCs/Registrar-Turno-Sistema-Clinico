import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { User, Turno, Tratamiento, Paciente } from '../../interfaces';

@Component({
  selector: 'app-turnos',
  imports: [CommonModule, FormsModule],
  templateUrl: './turnos.component.html',
  styleUrl: './turnos.component.css'
})
export class TurnosComponent implements OnInit {
  currentView: string = 'turnos';
  user: User | null = null;
  turnos: Turno[] = [];
  searchTerm: string = '';
  filterEstado: string = 'todos';
  isLoading: boolean = false;
  
  // Formulario de turno
  turnoForm = {
    pacienteId: '',
    fecha: '',
    hora: '',
    tratamientoId: ''
  };

  // Datos de prueba
  pacientes: Paciente[] = [
    { id: 1, nombre: 'Juan', apellido: 'Pérez', dni: '87654321', obraSocial: 'OSDE', telefono: '123456789' },
    { id: 2, nombre: 'María', apellido: 'García', dni: '20123456', obraSocial: 'Swiss Medical', telefono: '987654321' },
    { id: 3, nombre: 'Carlos', apellido: 'López', dni: '25789123', obraSocial: 'OSDE', telefono: '555666777' }
  ];

  tratamientos: Tratamiento[] = [
    { id: 1, descripcion: 'Consulta General', precio: 5000, duracion: 30 },
    { id: 2, descripcion: 'Limpieza Dental', precio: 8000, duracion: 45 },
    { id: 3, descripcion: 'Empaste', precio: 12000, duracion: 60 },
    { id: 4, descripcion: 'Extracción', precio: 15000, duracion: 30 },
    { id: 5, descripcion: 'Ortodoncia - Consulta', precio: 10000, duracion: 45 }
  ];

  testData = {
    turnos: [
      { id: 1, nroTurno: 'T001', fecha: '2024-01-20', hora: '09:00', estado: 'reservado', tratamiento: 'Consulta General', precioFinal: 5000, nombre: 'Juan', apellido: 'Pérez', pacienteId: 1, tratamientoId: 1 },
      { id: 2, nroTurno: 'T002', fecha: '2024-01-21', hora: '10:30', estado: 'reservado', tratamiento: 'Limpieza Dental', precioFinal: 8000, nombre: 'María', apellido: 'García', pacienteId: 2, tratamientoId: 2 },
      { id: 3, nroTurno: 'T003', fecha: '2024-01-22', hora: '14:00', estado: 'completado', tratamiento: 'Empaste', precioFinal: 12000, nombre: 'Carlos', apellido: 'López', pacienteId: 3, tratamientoId: 3 },
      { id: 4, nroTurno: 'T004', fecha: '2024-01-23', hora: '16:00', estado: 'cancelado', tratamiento: 'Extracción', precioFinal: 15000, nombre: 'Ana', apellido: 'Martínez', pacienteId: 4, tratamientoId: 4 }
    ]
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadTurnosData();
  }

  loadUserData(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.user = JSON.parse(userStr);
    } else {
      this.router.navigate(['/login']);
    }
  }

  loadTurnosData(): void {
    this.turnos = this.testData.turnos;
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  navigateTo(view: string): void {
    this.currentView = view;
  }

  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  registrarTurno(): void {
    if (!this.canRegisterTurno) return;

    this.isLoading = true;

    // Simular registro de turno
    setTimeout(() => {
      const newTurno: Turno = {
        id: this.turnos.length + 1,
        nroTurno: 'T' + String(this.turnos.length + 1).padStart(3, '0'),
        fecha: this.turnoForm.fecha,
        hora: this.turnoForm.hora,
        estado: 'reservado',
        tratamiento: this.tratamientos.find(t => t.id === parseInt(this.turnoForm.tratamientoId))?.descripcion || '',
        precioFinal: this.tratamientos.find(t => t.id === parseInt(this.turnoForm.tratamientoId))?.precio || 0,
        pacienteId: parseInt(this.turnoForm.pacienteId),
        tratamientoId: parseInt(this.turnoForm.tratamientoId)
      };

      this.turnos.push(newTurno);
      
      // Limpiar formulario
      this.turnoForm = {
        pacienteId: '',
        fecha: '',
        hora: '',
        tratamientoId: ''
      };

      this.currentView = 'turnos';
      this.isLoading = false;
      alert('Turno registrado exitosamente');
    }, 1000);
  }

  get canRegisterTurno(): boolean {
    return this.turnoForm.pacienteId !== '' &&
           this.turnoForm.fecha !== '' &&
           this.turnoForm.hora !== '' &&
           this.turnoForm.tratamientoId !== '';
  }

  cancelarTurno(turno: Turno): void {
    if (confirm('¿Estás seguro de que quieres cancelar este turno?')) {
      turno.estado = 'cancelado';
      alert('Turno cancelado exitosamente');
    }
  }

  completarTurno(turno: Turno): void {
    if (confirm('¿Confirmar que el turno ha sido completado?')) {
      turno.estado = 'completado';
      alert('Turno marcado como completado');
    }
  }

  get filteredTurnos(): Turno[] {
    let filtered = this.turnos;

    // Filtrar por búsqueda
    if (this.searchTerm.trim() !== '') {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(turno => 
        turno.nroTurno.toLowerCase().includes(search) ||
        turno.tratamiento.toLowerCase().includes(search) ||
        turno.nombre?.toLowerCase().includes(search) ||
        turno.apellido?.toLowerCase().includes(search)
      );
    }

    // Filtrar por estado
    if (this.filterEstado !== 'todos') {
      filtered = filtered.filter(turno => turno.estado === this.filterEstado);
    }

    // Filtrar por usuario (si es paciente, solo mostrar sus turnos)
    if (this.user?.tipoUsuario === 'paciente') {
      filtered = filtered.filter(turno => turno.pacienteId === this.user?.id);
    }

    return filtered;
  }

  getStatusClass(estado: string): string {
    switch (estado) {
      case 'reservado': return 'badge bg-primary';
      case 'completado': return 'badge bg-success';
      case 'cancelado': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }
}
