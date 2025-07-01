import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User, Turno, Tratamiento, Paciente, Estadisticas, TipoAlerta, Dentista } from '../../interfaces';
import { Router } from '@angular/router';
import { TurnoService } from '../../services/turno.service';
import { PacienteService } from '../../services/paciente.service';
import { DentistaService } from '../../services/dentista.service';

@Component({
  selector: 'app-dentista',
  imports: [CommonModule, FormsModule],
  templateUrl: './dentista.component.html',
  styleUrl: './dentista.component.css'
})
export class DentistaComponent implements OnInit {

  // Estado de la aplicación
  currentView: string = 'dashboard';
  user: User | null = null;
  isLoading: boolean = false;

  // Alertas
  alertVisible: boolean = false;
  currentAlertType: TipoAlerta = 'success';
  currentAlertMessage: string = '';

  // Formularios
  turnoForm = {
    pacienteId: '',
    fecha: '',
    hora: '',
    tratamientoId: ''
  };

  // Datos
  turnos: Turno[] = [];
  tratamientos: Tratamiento[] = [];
  pacientes: Paciente[] = [];
  usuarios: User[] = [];
  dentistas: Dentista[] = [];
  dentistaForm: Dentista = {
    legajo: '',
    email: '',
    nombre: '',
    apellido: '',
    telefono: '',
    direccion: '',
    dni: '',
    userId: ''
  };
  isEditMode: boolean = false;

  // Filtros
  searchTerm: string = '';
  filterEstado: string = 'todos';
  filterTipo: string = 'todos';

  constructor(
    private http: HttpClient,
    private router: Router,
    private turnoService: TurnoService,
    private pacienteService: PacienteService,
    private dentistaService: DentistaService
  ) {}

  ngOnInit(): void {
    this.loadDentistas();
    this.user = {
      id: '2',
      nombreUsuario: 'dentista1',
      nombre: 'Dr. María',
      apellido: 'González',
      tipoUsuario: 'dentista',
      dni: '12345678',
      telefono: '123456789'
    };
    this.loadTurnos();
    this.loadPacientes();
    this.loadTratamientos();
  }

  // Métodos de navegación
  navigateTo(view: string): void {
    this.currentView = view;
    this.clearForms();
  }

  navigateToTratamientos(): void {
    this.currentView = 'tratamientos';
  }

  // Métodos de turnos
  registrarTurno(): void {
    if (!this.canRegisterTurno) return;
    this.isLoading = true;
    const turnoData = {
      pacienteId: parseInt(this.turnoForm.pacienteId),
      fecha: this.turnoForm.fecha,
      hora: this.turnoForm.hora,
      tratamientoId: parseInt(this.turnoForm.tratamientoId)
    };
    this.turnoService.createTurno(turnoData).subscribe({
      next: () => {
        this.loadTurnos();
        this.clearForms();
        this.navigateTo('dashboard');
        this.isLoading = false;
        this.showAlert('¡Turno registrado exitosamente!', 'success');
      },
      error: () => {
        this.isLoading = false;
        this.showAlert('Error al registrar el turno', 'danger');
      }
    });
  }

  cancelarTurno(turno: Turno): void {
    this.turnoService.cambiarEstadoTurno(turno.id.toString(), 'cancelado').subscribe({
      next: () => {
        this.loadTurnos();
        this.showAlert('Turno cancelado exitosamente.', 'warning');
      },
      error: () => this.showAlert('Error al cancelar el turno', 'danger')
    });
  }

  completarTurno(turno: Turno): void {
    this.turnoService.cambiarEstadoTurno(turno.id.toString(), 'completado').subscribe({
      next: () => {
        this.loadTurnos();
        this.showAlert('Turno completado exitosamente.', 'success');
      },
      error: () => this.showAlert('Error al completar el turno', 'danger')
    });
  }

  clearForms(): void {
    this.turnoForm = {
      pacienteId: '',
      fecha: '',
      hora: '',
      tratamientoId: ''
    };
  }

  showAlert(message: string, type: TipoAlerta): void {
    this.currentAlertMessage = message;
    this.currentAlertType = type;
    this.alertVisible = true;
    setTimeout(() => this.closeAlert(), 5000);
  }

  closeAlert(): void {
    this.alertVisible = false;
  }

  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Getters para validaciones
  get canRegisterTurno(): boolean {
    return !!(
      this.turnoForm.pacienteId &&
      this.turnoForm.fecha &&
      this.turnoForm.hora &&
      this.turnoForm.tratamientoId
    );
  }

  // Getters para filtros
  get filteredTurnos(): Turno[] {
    let filtered = this.turnos;

    // Filtrar por búsqueda
    if (this.searchTerm) {
      filtered = filtered.filter(turno =>
        turno.nroTurno.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        turno.nombre?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        turno.apellido?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        turno.tratamiento.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Filtrar por estado
    if (this.filterEstado !== 'todos') {
      filtered = filtered.filter(turno => turno.estado === this.filterEstado);
    }

    return filtered;
  }

  get filteredDentistas(): Dentista[] {
    let filtered = this.dentistas;
    if (this.searchTerm) {
      filtered = filtered.filter(dentista =>
        dentista.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dentista.apellido.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dentista.legajo.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dentista.dni.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    return filtered;
  }

  // Getters para estadísticas
  get totalTurnos(): number {
    return this.turnos.length;
  }

  get turnosHoy(): number {
    const today = new Date().toISOString().split('T')[0];
    return this.turnos.filter(t => t.fecha === today).length;
  }

  get proximoTurno(): Turno | null {
    const today = new Date().toISOString().split('T')[0];
    const turnosHoy = this.turnos.filter(t => t.fecha === today && t.estado === 'reservado');
    return turnosHoy.length > 0 ? turnosHoy[0] : null;
  }

  get estadisticas(): Estadisticas {
    const total = this.turnos.length;
    const reservados = this.turnos.filter(t => t.estado === 'reservado').length;
    const completados = this.turnos.filter(t => t.estado === 'completado').length;
    const cancelados = this.turnos.filter(t => t.estado === 'cancelado').length;
    const ingresos = this.turnos
      .filter(t => t.estado === 'completado')
      .reduce((sum, t) => sum + t.precioFinal, 0);

    return { total, reservados, completados, cancelados, ingresos };
  }

  // Métodos para clases CSS
  getStatusClass(estado: string): string {
    switch (estado) {
      case 'reservado': return 'badge bg-primary';
      case 'completado': return 'badge bg-success';
      case 'cancelado': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  getTipoClass(tipo: string): string {
    switch (tipo) {
      case 'administrador': return 'badge bg-danger';
      case 'dentista': return 'badge bg-primary';
      case 'paciente': return 'badge bg-success';
      default: return 'badge bg-secondary';
    }
  }

  volverAlDashboardAdmin(): void {
    this.router.navigate(['/dashboard']);
  }

  loadTurnos(): void {
    this.turnoService.getTurnosFromAPI().subscribe({
      next: (turnos) => this.turnos = turnos,
      error: () => this.turnos = []
    });
  }

  loadPacientes(): void {
    this.pacienteService.getPacientes().subscribe({
      next: (pacientes) => this.pacientes = pacientes,
      error: () => this.pacientes = []
    });
  }

  loadTratamientos(): void {
    this.turnoService.getTratamientos().subscribe({
      next: (tratamientos) => this.tratamientos = tratamientos,
      error: () => this.tratamientos = []
    });
  }

  // CRUD Dentistas
  loadDentistas(): void {
    this.dentistaService.getDentistas().subscribe({
      next: (dentistas) => this.dentistas = dentistas,
      error: () => this.dentistas = []
    });
  }

  saveDentista(): void {
    if (!this.dentistaForm.userId) {
      this.showAlert('Debe ingresar un userId válido para el dentista.', 'danger');
      return;
    }
    if (this.isEditMode) {
      this.dentistaService.updateDentista(this.dentistaForm._id!, this.dentistaForm).subscribe({
        next: () => {
          this.loadDentistas();
          this.showAlert('Dentista actualizado correctamente', 'success');
          this.clearDentistaForm();
        },
        error: () => this.showAlert('Error al actualizar el dentista', 'danger')
      });
    } else {
      this.dentistaService.createDentista(this.dentistaForm).subscribe({
        next: () => {
          this.loadDentistas();
          this.showAlert('Dentista creado correctamente', 'success');
          this.clearDentistaForm();
        },
        error: () => this.showAlert('Error al crear el dentista', 'danger')
      });
    }
  }

  editDentista(dentista: Dentista): void {
    this.dentistaForm = { ...dentista };
    this.isEditMode = true;
  }

  deleteDentista(dentista: Dentista): void {
    if (confirm('¿Está seguro de eliminar este dentista?')) {
      this.dentistaService.deleteDentista(dentista._id!).subscribe({
        next: () => {
          this.loadDentistas();
          this.showAlert('Dentista eliminado correctamente', 'success');
        },
        error: () => this.showAlert('Error al eliminar el dentista', 'danger')
      });
    }
  }

  clearDentistaForm(): void {
    this.dentistaForm = {
      legajo: '',
      email: '',
      nombre: '',
      apellido: '',
      telefono: '',
      direccion: '',
      dni: '',
      userId: ''
    };
    this.isEditMode = false;
  }
} 