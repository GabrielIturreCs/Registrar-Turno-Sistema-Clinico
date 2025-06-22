import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { User, Turno } from '../../interfaces';

@Component({
  selector: 'app-agenda',
  imports: [CommonModule, FormsModule],
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.css'
})
export class AgendaComponent implements OnInit {
  user: User | null = null;
  turnos: Turno[] = [];
  selectedDate: string = '';
  searchTerm: string = '';
  filterEstado: string = 'todos';

  // Datos de prueba
  testData = {
    turnos: [
      { 
        id: 1, 
        nroTurno: 'T001', 
        fecha: '2024-01-20', 
        hora: '09:00', 
        estado: 'reservado', 
        tratamiento: 'Consulta General', 
        precioFinal: 5000, 
        nombre: 'Juan', 
        apellido: 'Pérez', 
        dni: '87654321',
        telefono: '123456789',
        duracion: 30,
        pacienteId: 1, 
        tratamientoId: 1 
      },
      { 
        id: 2, 
        nroTurno: 'T002', 
        fecha: '2024-01-20', 
        hora: '10:30', 
        estado: 'reservado', 
        tratamiento: 'Limpieza Dental', 
        precioFinal: 8000, 
        nombre: 'María', 
        apellido: 'García', 
        dni: '20123456',
        telefono: '987654321',
        duracion: 45,
        pacienteId: 2, 
        tratamientoId: 2 
      },
      { 
        id: 3, 
        nroTurno: 'T003', 
        fecha: '2024-01-20', 
        hora: '14:00', 
        estado: 'completado', 
        tratamiento: 'Empaste', 
        precioFinal: 12000, 
        nombre: 'Carlos', 
        apellido: 'López', 
        dni: '25789123',
        telefono: '555666777',
        duracion: 60,
        pacienteId: 3, 
        tratamientoId: 3 
      },
      { 
        id: 4, 
        nroTurno: 'T004', 
        fecha: '2024-01-20', 
        hora: '16:00', 
        estado: 'cancelado', 
        tratamiento: 'Extracción', 
        precioFinal: 15000, 
        nombre: 'Ana', 
        apellido: 'Martínez', 
        dni: '32165498',
        telefono: '111222333',
        duracion: 30,
        pacienteId: 4, 
        tratamientoId: 4 
      }
    ]
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadTurnosData();
    this.selectedDate = new Date().toISOString().split('T')[0];
  }

  loadUserData(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.user = JSON.parse(userStr);
      if (this.user?.tipoUsuario !== 'dentista') {
        this.router.navigate(['/dashboard']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  loadTurnosData(): void {
    this.turnos = this.testData.turnos;
  }

  onDateChange(): void {
    // Aquí podrías cargar los turnos de la fecha seleccionada desde el backend
    console.log('Fecha seleccionada:', this.selectedDate);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  navigateToReservar(): void {
    this.router.navigate(['/reservarTurno']);
  }

  completarTurno(turno: Turno): void {
    if (confirm('¿Confirmar que el turno ha sido completado?')) {
      turno.estado = 'completado';
      alert('Turno marcado como completado');
    }
  }

  reprogramarTurno(turno: Turno): void {
    // Aquí podrías abrir un modal para reprogramar
    alert('Función de reprogramación - En desarrollo');
  }

  cancelarTurno(turno: Turno): void {
    if (confirm('¿Estás seguro de que quieres cancelar este turno?')) {
      turno.estado = 'cancelado';
      alert('Turno cancelado exitosamente');
    }
  }

  verDetalles(turno: Turno): void {
    // Aquí podrías abrir un modal con los detalles del turno
    alert(`Detalles del turno ${turno.nroTurno}:\nPaciente: ${turno.nombre} ${turno.apellido}\nTratamiento: ${turno.tratamiento}\nPrecio: $${turno.precioFinal}`);
  }

  exportarAgenda(): void {
    // Aquí podrías generar un PDF o Excel con la agenda
    alert('Función de exportación - En desarrollo');
  }

  get filteredTurnos(): Turno[] {
    let filtered = this.turnos.filter(turno => turno.fecha === this.selectedDate);

    // Filtrar por búsqueda
    if (this.searchTerm.trim() !== '') {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(turno => 
        turno.nombre?.toLowerCase().includes(search) ||
        turno.apellido?.toLowerCase().includes(search) ||
        turno.dni?.includes(search) ||
        turno.tratamiento.toLowerCase().includes(search)
      );
    }

    // Filtrar por estado
    if (this.filterEstado !== 'todos') {
      filtered = filtered.filter(turno => turno.estado === this.filterEstado);
    }

    // Ordenar por hora
    return filtered.sort((a, b) => a.hora.localeCompare(b.hora));
  }

  get turnosHoy(): number {
    return this.turnos.filter(t => t.fecha === this.selectedDate).length;
  }

  get turnosCompletados(): number {
    return this.turnos.filter(t => t.fecha === this.selectedDate && t.estado === 'completado').length;
  }

  get turnosPendientes(): number {
    return this.turnos.filter(t => t.fecha === this.selectedDate && t.estado === 'reservado').length;
  }

  get ingresosHoy(): number {
    return this.turnos
      .filter(t => t.fecha === this.selectedDate && t.estado === 'completado')
      .reduce((total, t) => total + t.precioFinal, 0);
  }

  getStatusClass(estado: string): string {
    switch (estado) {
      case 'reservado': return 'badge bg-warning';
      case 'completado': return 'badge bg-success';
      case 'cancelado': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }
}
