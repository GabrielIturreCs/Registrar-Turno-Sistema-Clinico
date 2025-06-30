import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User, Turno, Tratamiento, Paciente, Estadisticas, TipoAlerta } from '../../interfaces';
import { Router } from '@angular/router';
import { TurnoService } from '../../services/turno.service';
import { PacienteService } from '../../services/paciente.service';

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

  // Filtros
  searchTerm: string = '';
  filterEstado: string = 'todos';
  filterTipo: string = 'todos';

  // Datos de prueba para dentistas
  testData = {
    usuarios: [
      { id: '1', nombreUsuario: 'admin', password: 'password', nombre: 'Admin', apellido: 'Sistema', tipoUsuario: 'administrador', dni: '00000000', telefono: '1100000000' },
      { id: '2', nombreUsuario: 'dentista1', password: 'password', nombre: 'Dr. María', apellido: 'González', tipoUsuario: 'dentista', dni: '12345678', telefono: '123456789' },
      { id: '3', nombreUsuario: 'dentista2', password: 'password', nombre: 'Dr. Carlos', apellido: 'López', tipoUsuario: 'dentista', dni: '23456789', telefono: '234567890' },
      { id: '4', nombreUsuario: 'dentista3', password: 'password', nombre: 'Dra. Ana', apellido: 'Martínez', tipoUsuario: 'dentista', dni: '34567890', telefono: '345678901' },
      { id: '5', nombreUsuario: 'paciente1', password: 'password', nombre: 'Juan', apellido: 'Pérez', tipoUsuario: 'paciente', dni: '87654321', telefono: '987654321', obraSocial: 'OSDE' }
    ],
    tratamientos: [
      { id: 1, nroTratamiento: 1, descripcion: 'Consulta General', precio: 5000, duracion: '30', historial: 'N/A' },
      { id: 2, nroTratamiento: 2, descripcion: 'Limpieza Dental', precio: 8000, duracion: '45', historial: 'N/A' },
      { id: 3, nroTratamiento: 3, descripcion: 'Empaste', precio: 12000, duracion: '60', historial: 'N/A' },
      { id: 4, nroTratamiento: 4, descripcion: 'Extracción', precio: 15000, duracion: '30', historial: 'N/A' },
      { id: 5, nroTratamiento: 5, descripcion: 'Ortodoncia - Consulta', precio: 10000, duracion: '45', historial: 'N/A' },
      { id: 6, nroTratamiento: 6, descripcion: 'Blanqueamiento', precio: 20000, duracion: '90', historial: 'N/A' },
      { id: 7, nroTratamiento: 7, descripcion: 'Endodoncia', precio: 25000, duracion: '120', historial: 'N/A' }
    ],
    pacientes: [
      { id: 1, nombre: 'Juan', apellido: 'Pérez', dni: '87654321', obraSocial: 'OSDE', telefono: '987654321' },
      { id: 2, nombre: 'María', apellido: 'García', dni: '20123456', obraSocial: 'Swiss Medical', telefono: '123456789' },
      { id: 3, nombre: 'Carlos', apellido: 'López', dni: '25789123', obraSocial: 'OSDE', telefono: '234567890' },
      { id: 4, nombre: 'Ana', apellido: 'Rodríguez', dni: '34567890', obraSocial: 'Galeno', telefono: '345678901' },
      { id: 5, nombre: 'Luis', apellido: 'Fernández', dni: '45678901', obraSocial: 'Medicus', telefono: '456789012' }
    ],
    turnos: [
      { id: 1, nroTurno: 'T001', fecha: '2024-01-20', hora: '09:00', estado: 'reservado', tratamiento: 'Consulta General', precioFinal: 5000, nombre: 'Juan', apellido: 'Pérez', pacienteId: 1, tratamientoId: 1 },
      { id: 2, nroTurno: 'T002', fecha: '2024-01-21', hora: '10:30', estado: 'reservado', tratamiento: 'Limpieza Dental', precioFinal: 8000, nombre: 'María', apellido: 'García', pacienteId: 2, tratamientoId: 2 },
      { id: 3, nroTurno: 'T003', fecha: '2024-01-22', hora: '14:00', estado: 'completado', tratamiento: 'Empaste', precioFinal: 12000, nombre: 'Carlos', apellido: 'López', pacienteId: 3, tratamientoId: 3 },
      { id: 4, nroTurno: 'T004', fecha: '2024-01-23', hora: '16:30', estado: 'cancelado', tratamiento: 'Extracción', precioFinal: 15000, nombre: 'Ana', apellido: 'Rodríguez', pacienteId: 4, tratamientoId: 4 }
    ] as Turno[]
  };

  constructor(private http: HttpClient, private router: Router, private turnoService: TurnoService, private pacienteService: PacienteService) {}

  ngOnInit(): void {
    this.loadTestData();
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

  eliminarUsuario(usuario: User): void {
    const index = this.testData.usuarios.findIndex(u => u.id === usuario.id);
    if (index > -1) {
      this.testData.usuarios.splice(index, 1);
      this.usuarios = [...this.testData.usuarios];
      this.showAlert('Usuario eliminado exitosamente.', 'success');
    }
  }

  loadTestData(): void {
    this.turnos = [...this.testData.turnos];
    this.tratamientos = [...this.testData.tratamientos];
    this.pacientes = [...this.testData.pacientes];
    this.usuarios = [...this.testData.usuarios];
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

  get filteredUsuarios(): User[] {
    let filtered = this.usuarios.filter(u => u.tipoUsuario === 'dentista');

    // Filtrar por búsqueda
    if (this.searchTerm) {
      filtered = filtered.filter(usuario =>
        usuario.nombreUsuario.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        usuario.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        usuario.apellido.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        usuario.dni?.toLowerCase().includes(this.searchTerm.toLowerCase())
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
} 