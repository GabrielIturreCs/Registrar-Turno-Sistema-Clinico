import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { User, Turno } from '../../interfaces';
import { TurnoService } from '../../services/turno.service';
import { PacienteService } from '../../services/paciente.service';
import { PdfExportService } from '../../services/pdf-export.service';
import { NotificationService } from '../../services/notification.service';
import { Tratamiento } from '../../interfaces';
import { DataRefreshService } from '../../services/data-refresh.service';

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
  private refreshSubscription: any;

  constructor(
    private router: Router, 
    private turnoService: TurnoService, 
    private pacienteService: PacienteService,
    private pdfExportService: PdfExportService,
    private notificationService: NotificationService,
    private dataRefreshService: DataRefreshService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.loadTurnosData();
    // Suscribirse a refresh global de turnos
    this.refreshSubscription = this.dataRefreshService.refresh$.subscribe((component) => {
      if (component === 'all' || component === 'agenda') {
        this.loadTurnosData();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
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
        this.turnos = turnos; // Guarda todos los turnos
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
    try {
      // Obtener estadísticas del día
      const estadisticas = {
        total: this.turnosHoy,
        completados: this.turnosCompletados,
        pendientes: this.turnosPendientes,
        cancelados: this.turnos.filter(t => t.fecha === this.selectedDate && t.estado === 'cancelado').length,
        ingresos: this.ingresosHoy
      };

      // Determinar qué turnos exportar según el filtro actual
      let turnosAExportar: Turno[];
      
      if (this.filterEstado === 'todos') {
        // Exportar todos los turnos del día
        turnosAExportar = this.turnos.filter(t => t.fecha === this.selectedDate);
      } else {
        // Exportar solo los turnos del estado seleccionado
        turnosAExportar = this.turnos.filter(t => 
          t.fecha === this.selectedDate && t.estado === this.filterEstado
        );
      }

      // Ordenar por hora
      turnosAExportar.sort((a, b) => a.hora.localeCompare(b.hora));
      
      // Verificar si hay turnos para exportar
      if (turnosAExportar.length === 0) {
        this.notificationService.showWarning('No hay turnos para exportar con los filtros seleccionados');
        return;
      }
      
      this.pdfExportService.exportarAgendaPDF(turnosAExportar, this.selectedDate, estadisticas, this.filterEstado);
      
      const mensaje = this.filterEstado === 'todos' 
        ? `Agenda completa exportada exitosamente (${turnosAExportar.length} turnos)`
        : `Agenda de turnos ${this.filterEstado} exportada exitosamente (${turnosAExportar.length} turnos)`;
      
      this.notificationService.showSuccess(mensaje);
    } catch (error) {
      console.error('Error al exportar agenda:', error);
      this.notificationService.showError('Error al exportar la agenda');
    }
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
    // Normalizar la fecha seleccionada a YYYY-MM-DD
    const selected = this.selectedDate.slice(0, 10);
    let filtered = this.turnos.filter(turno => {
      // Normalizar la fecha del turno a YYYY-MM-DD
      const turnoFecha = (turno.fecha || '').slice(0, 10);
      return turnoFecha === selected;
    });

    // Filtrar por búsqueda
    if (this.searchTerm.trim() !== '') {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(turno => 
        (turno.nombre?.toLowerCase().includes(search) ||
        turno.apellido?.toLowerCase().includes(search) ||
        turno.tratamiento?.toLowerCase().includes(search))
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

