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
  modalTitle: string = '';
  modalMessage: string = '';
  isLoading: boolean = false;

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
    if (confirm(`¿Marcar como completado el turno de ${turno.nombre} ${turno.apellido}?\n\nTratamiento: ${turno.tratamiento}\nPrecio: $${turno.precioFinal}`)) {
      const turnoId = turno._id || turno.id?.toString() || '';
      if (turnoId) {
        this.turnoService.cambiarEstadoTurno(turnoId, 'completado').subscribe({
          next: () => {
            this.loadTurnosData();
            this.mostrarModal('Éxito', '✅ Turno marcado como completado exitosamente');
          },
          error: () => this.mostrarModal('Error', '❌ Error al completar el turno')
        });
      }
    }
  }

  reprogramarTurno(turno: Turno): void {
    // Aquí podrías abrir un modal para reprogramar
    this.mostrarModal('En desarrollo', 'Función de reprogramación - En desarrollo');
  }

  cancelarTurno(turno: Turno): void {
    if (confirm(`¿Cancelar el turno de ${turno.nombre} ${turno.apellido}?\n\nFecha: ${turno.fecha} - ${turno.hora}\nTratamiento: ${turno.tratamiento}\n\nEsta acción se puede revertir.`)) {
      const turnoId = turno._id || turno.id?.toString() || '';
      if (turnoId) {
        this.turnoService.cambiarEstadoTurno(turnoId, 'cancelado').subscribe({
          next: () => {
            this.loadTurnosData();
            this.mostrarModal('Éxito', '✅ Turno cancelado exitosamente');
          },
          error: () => this.mostrarModal('Error', '❌ Error al cancelar el turno')
        });
      }
    }
  }

  verDetalles(turno: Turno): void {
    const detalles = `
📅 DETALLES DEL TURNO #${turno.nroTurno}

👤 PACIENTE:
   • Nombre: ${turno.nombre} ${turno.apellido}
   • Teléfono: ${turno.telefono || 'No especificado'}

🦷 TRATAMIENTO:
   • Descripción: ${turno.tratamiento}
   • Duración: ${turno.duracion || '30'} minutos
   • Precio: $${turno.precioFinal}

⏰ HORARIO:
   • Fecha: ${turno.fecha}
   • Hora: ${turno.hora}

📋 ESTADO: ${turno.estado.toUpperCase()}
    `.trim();
    
    this.mostrarModal('Detalles del turno', detalles);
  }

  exportarAgenda(): void {
    this.mostrarModal('Función de exportación', 'En desarrollo');
  }

  mostrarModal(titulo: string, mensaje: string) {
    this.modalTitle = titulo;
    this.modalMessage = mensaje;
    const modal = new (window as any).bootstrap.Modal(document.getElementById('agendaAlertModal'));
    modal.show();
  }

  reservarTurno(turno: Turno): void {
    if (confirm('¿Confirmar que el turno ha sido reservado nuevamente?')) {
      const turnoId = turno._id || turno.id?.toString() || '';
      if (turnoId) {
        this.turnoService.cambiarEstadoTurno(turnoId, 'reservado').subscribe({
          next: () => {
            this.loadTurnosData();
            this.mostrarModal('Éxito', 'Turno marcado como reservado');
          },
          error: () => this.mostrarModal('Error', 'Error al reservar el turno')
        });
      }
    }
  }

  get filteredTurnos(): Turno[] {
    let filtered = this.turnos.filter(turno => turno.fecha === this.selectedDate);

    // Filtrar por búsqueda
    if (this.searchTerm.trim() !== '') {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(turno => 
        turno.nombre?.toLowerCase().includes(search) ||
        turno.apellido?.toLowerCase().includes(search) ||
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
      case 'reservado': return 'badge bg-warning text-dark';
      case 'completado': return 'badge bg-success';
      case 'cancelado': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  getStatusIcon(estado: string): string {
    switch (estado) {
      case 'reservado': return 'fas fa-calendar-check';
      case 'completado': return 'fas fa-check-circle';
      case 'cancelado': return 'fas fa-times-circle';
      default: return 'fas fa-question-circle';
    }
  }

  getStatusText(estado: string): string {
    switch (estado) {
      case 'reservado': return 'Reservado';
      case 'completado': return 'Completado';
      case 'cancelado': return 'Cancelado';
      default: return 'Sin estado';
    }
  }
}

