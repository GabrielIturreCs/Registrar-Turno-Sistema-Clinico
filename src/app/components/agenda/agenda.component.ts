import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { User, Turno } from '../../interfaces';
import { TurnoService } from '../../services/turno.service';
import { PacienteService } from '../../services/paciente.service';
import { Tratamiento } from '../../interfaces';

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

  constructor(private router: Router, private turnoService: TurnoService, private pacienteService: PacienteService) {}

  ngOnInit(): void {
    this.loadUserData();
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.loadTurnosData();
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
    this.turnoService.getTurnosFromAPI().subscribe({
      next: (turnos) => {
        this.turnos = turnos.filter(t => t.fecha === this.selectedDate);
      },
      error: () => {
        this.turnos = [];
      }
    });
  }

  onDateChange(): void {
    this.loadTurnosData();
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  navigateToReservar(): void {
    this.router.navigate(['/reservarTurno']);
  }

  completarTurno(turno: Turno): void {
    if (confirm('¿Confirmar que el turno ha sido completado?')) {
      const turnoId = turno._id || turno.id?.toString() || '';
      if (turnoId) {
        this.turnoService.cambiarEstadoTurno(turnoId, 'completado').subscribe({
          next: () => {
            this.loadTurnosData();
            alert('Turno marcado como completado');
          },
          error: () => alert('Error al completar el turno')
        });
      }
    }
  }

  reprogramarTurno(turno: Turno): void {
    // Aquí podrías abrir un modal para reprogramar
    alert('Función de reprogramación - En desarrollo');
  }

  cancelarTurno(turno: Turno): void {
    if (confirm('¿Estás seguro de que quieres cancelar este turno?')) {
      const turnoId = turno._id || turno.id?.toString() || '';
      if (turnoId) {
        this.turnoService.cambiarEstadoTurno(turnoId, 'cancelado').subscribe({
          next: () => {
            this.loadTurnosData();
            alert('Turno cancelado exitosamente');
          },
          error: () => alert('Error al cancelar el turno')
        });
      }
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
      .reduce((total, t) => total + Number(t.precioFinal || 0), 0);
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
