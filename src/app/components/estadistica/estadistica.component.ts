import { Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User,Turno,Estadisticas } from '../../interfaces';
import { TurnoService } from '../../services/turno.service';
import { NgChartsModule } from 'ng2-charts';
import { PdfExportService } from '../../services/pdf-export.service';

interface EstadisticaTratamiento {
  tratamiento: string;
  cantidad: number;
  ingresos: number;
}

@Component({
  selector: 'app-estadistica',
  imports: [CommonModule,FormsModule, NgChartsModule],
  templateUrl: './estadistica.component.html',
  styleUrl: './estadistica.component.css'
})
export class EstadisticaComponent implements OnInit {
  user: User | null = null;
  turnos: Turno[] = [];

  // Estructura para las estadísticas generales
  estadisticas: Estadisticas = {
    total: 0,
    reservados: 0,
    completados: 0,
    cancelados: 0,
    ingresos: 0
  };
  

  //fechas para filtrar turnos
  fechaDesde: string = '';
  fechaHasta: string = '';


  // Filtro para usuarios
  filtroUsuario: string = 'todos';
  estadisticasPorTratamiento: EstadisticaTratamiento[] = [];
  turnosRecientes: Turno[] = [];

  barChartData = {
    labels: [] as string[],
    datasets: [
      { data: [] as number[], label: 'Cantidad de Turnos' }
    ]
  };

  pieChartData = {
    labels: ['Reservados', 'Completados', 'Cancelados'],
    datasets: [
      { data: [] as number[], backgroundColor: ['#00bfff', '#28a745', '#dc3545'] }
    ]
  };

  // Constructor para inyectar servicios
  constructor(
    private router: Router,
    private turnoService: TurnoService,
    private authService: AuthService,
    private pdfExportService: PdfExportService
  ) {}
  ngOnInit(): void {
    this.loadUserData();
    // Datos mock variados y recientes para mostrar estadísticas
    this.turnos = [
      // Pacientes
      { id: 1, nroTurno: 'T-101', fecha: '2025-06-01', hora: '09:00', nombre: 'Juan', apellido: 'Pérez', tratamiento: 'Limpieza', estado: 'completado', precioFinal: 2000, tipoUsuario: 'paciente' },
      { id: 2, nroTurno: 'T-102', fecha: '2025-06-02', hora: '10:00', nombre: 'Ana', apellido: 'García', tratamiento: 'Extracción', estado: 'reservado', precioFinal: 3500, tipoUsuario: 'paciente' },
      { id: 3, nroTurno: 'T-103', fecha: '2025-06-03', hora: '11:00', nombre: 'Carlos', apellido: 'López', tratamiento: 'Ortodoncia', estado: 'cancelado', precioFinal: 0, tipoUsuario: 'paciente' },
      { id: 4, nroTurno: 'T-104', fecha: '2025-06-04', hora: '12:00', nombre: 'Lucía', apellido: 'Martínez', tratamiento: 'Limpieza', estado: 'completado', precioFinal: 2000, tipoUsuario: 'paciente' },
      { id: 5, nroTurno: 'T-105', fecha: '2025-06-05', hora: '13:00', nombre: 'Pedro', apellido: 'Sánchez', tratamiento: 'Extracción', estado: 'completado', precioFinal: 3500, tipoUsuario: 'paciente' },
      // Dentistas
      { id: 6, nroTurno: 'T-106', fecha: '2025-06-06', hora: '14:00', nombre: 'Dr. Mario', apellido: 'Fernández', tratamiento: 'Ortodoncia', estado: 'reservado', precioFinal: 5000, tipoUsuario: 'dentista' },
      { id: 7, nroTurno: 'T-107', fecha: '2025-06-07', hora: '15:00', nombre: 'Dra. Sofía', apellido: 'Gómez', tratamiento: 'Limpieza', estado: 'reservado', precioFinal: 2000, tipoUsuario: 'dentista' },
      { id: 8, nroTurno: 'T-108', fecha: '2025-06-08', hora: '16:00', nombre: 'Dr. Diego', apellido: 'Ruiz', tratamiento: 'Extracción', estado: 'cancelado', precioFinal: 0, tipoUsuario: 'dentista' },
      { id: 9, nroTurno: 'T-109', fecha: '2025-06-09', hora: '17:00', nombre: 'Dra. Valentina', apellido: 'Torres', tratamiento: 'Ortodoncia', estado: 'completado', precioFinal: 5000, tipoUsuario: 'dentista' },
      { id: 10, nroTurno: 'T-110', fecha: '2025-06-10', hora: '18:00', nombre: 'Dr. Martín', apellido: 'Castro', tratamiento: 'Limpieza', estado: 'completado', precioFinal: 2000, tipoUsuario: 'dentista' },
      // Administradores (turnos de gestión, reuniones, etc.)
      { id: 11, nroTurno: 'T-111', fecha: '2025-06-11', hora: '09:30', nombre: 'Admin Elena', apellido: 'Mendoza', tratamiento: 'Reunión de Gestión', estado: 'completado', precioFinal: 0, tipoUsuario: 'administrador' },
      { id: 12, nroTurno: 'T-112', fecha: '2025-06-12', hora: '10:30', nombre: 'Admin Luis', apellido: 'Silva', tratamiento: 'Auditoría', estado: 'reservado', precioFinal: 0, tipoUsuario: 'administrador' },
      // Más variedad
      { id: 13, nroTurno: 'T-113', fecha: '2025-06-13', hora: '11:30', nombre: 'Paula', apellido: 'Ríos', tratamiento: 'Extracción', estado: 'completado', precioFinal: 3500, tipoUsuario: 'paciente' },
      { id: 14, nroTurno: 'T-114', fecha: '2025-06-14', hora: '12:30', nombre: 'Jorge', apellido: 'Moreno', tratamiento: 'Ortodoncia', estado: 'cancelado', precioFinal: 0, tipoUsuario: 'dentista' },
      { id: 15, nroTurno: 'T-115', fecha: '2025-06-15', hora: '13:30', nombre: 'Marta', apellido: 'Vega', tratamiento: 'Blanqueamiento', estado: 'completado', precioFinal: 4000, tipoUsuario: 'paciente' },
      { id: 16, nroTurno: 'T-116', fecha: '2025-06-16', hora: '14:30', nombre: 'Raúl', apellido: 'Soto', tratamiento: 'Limpieza', estado: 'reservado', precioFinal: 2000, tipoUsuario: 'dentista' },
      { id: 17, nroTurno: 'T-117', fecha: '2025-06-17', hora: '15:30', nombre: 'Cecilia', apellido: 'Aguilar', tratamiento: 'Extracción', estado: 'completado', precioFinal: 3500, tipoUsuario: 'paciente' },
      { id: 18, nroTurno: 'T-118', fecha: '2025-06-18', hora: '16:30', nombre: 'Tomás', apellido: 'Paz', tratamiento: 'Ortodoncia', estado: 'reservado', precioFinal: 5000, tipoUsuario: 'dentista' },
      { id: 19, nroTurno: 'T-119', fecha: '2025-06-19', hora: '17:30', nombre: 'Rosa', apellido: 'Campos', tratamiento: 'Blanqueamiento', estado: 'completado', precioFinal: 4000, tipoUsuario: 'paciente' },
      { id: 20, nroTurno: 'T-120', fecha: '2025-06-20', hora: '18:30', nombre: 'Nicolás', apellido: 'Luna', tratamiento: 'Limpieza', estado: 'completado', precioFinal: 2000, tipoUsuario: 'paciente' }
    ];
    // Forzar fechas para que incluyan todos los datos mock
    this.fechaDesde = '2025-06-01';
    this.fechaHasta = '2025-06-30';
    this.actualizarEstadisticas();
  }

  //aca se carga el usuario actual
  loadUserData(): void {
    this.user = this.authService.getCurrentUser();
    // Solo permitir acceso a administrador
    if (!this.user || this.user.tipoUsuario !== 'administrador') {
      this.router.navigate(['/login']);
    }
  }

  //aca se cargan los turnos desde el servicio
  loadData(): void {
    this.turnoService.getTurnos().subscribe(turnos => {
      this.turnos = turnos;
      this.actualizarEstadisticas();
    });
  }

  //establecer las fechas por defecto para el filtro
  //30 dias atras y hoy
  setDefaultDates(): void {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    this.fechaDesde = thirtyDaysAgo.toISOString().split('T')[0];
    this.fechaHasta = today.toISOString().split('T')[0];
  }

  // Actualizar estadísticas según los turnos filtrados
  actualizarEstadisticas(): void {
    let filteredTurnos = this.turnos;

    // Filtrar por fecha
    if (this.fechaDesde && this.fechaHasta) {
      filteredTurnos = filteredTurnos.filter(turno => 
        turno.fecha >= this.fechaDesde && turno.fecha <= this.fechaHasta
      );
    }
    // Filtrar por tipo de usuario
    if (this.filtroUsuario && this.filtroUsuario !== 'todos') {
      filteredTurnos = filteredTurnos.filter(turno => turno.tipoUsuario === this.filtroUsuario);
    }

    // Calcular estadísticas
    this.estadisticas = {
      total: filteredTurnos.length,
      reservados: filteredTurnos.filter(t => t.estado === 'reservado').length,
      completados: filteredTurnos.filter(t => t.estado === 'completado').length,
      cancelados: filteredTurnos.filter(t => t.estado === 'cancelado').length,
      ingresos: filteredTurnos
        .filter(t => t.estado === 'completado')
        .reduce((total, t) => total + Number(t.precioFinal || 0), 0)
    };

    // Calcular estadísticas por tratamiento
    this.calcularEstadisticasPorTratamiento(filteredTurnos);

    // Obtener turnos recientes
    this.turnosRecientes = filteredTurnos
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 10);

    // Actualizar gráfico de barras
    this.barChartData.labels = this.estadisticasPorTratamiento.map(e => e.tratamiento);
    this.barChartData.datasets[0].data = this.estadisticasPorTratamiento.map(e => e.cantidad);

    // Actualizar gráfico de torta
    this.pieChartData.datasets[0].data = [
      this.estadisticas.reservados,
      this.estadisticas.completados,
      this.estadisticas.cancelados
    ];
  }

  
  calcularEstadisticasPorTratamiento(turnos: Turno[]): void {
    const tratamientosMap = new Map<string, EstadisticaTratamiento>();

    turnos.forEach(turno => {
      if (!tratamientosMap.has(turno.tratamiento)) {
        tratamientosMap.set(turno.tratamiento, {
          tratamiento: turno.tratamiento,
          cantidad: 0,
          ingresos: 0
        });
      }

      const estadistica = tratamientosMap.get(turno.tratamiento)!;
      estadistica.cantidad++;
      
      if (turno.estado === 'completado') {
        estadistica.ingresos += Number(turno.precioFinal || 0);
      }
    });

    this.estadisticasPorTratamiento = Array.from(tratamientosMap.values())
      .sort((a, b) => b.cantidad - a.cantidad);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  exportarEstadisticas(): void {
    this.pdfExportService.exportarEstadisticasPDF(
      this.estadisticas,
      this.estadisticasPorTratamiento,
      this.turnosRecientes,
      this.fechaDesde,
      this.fechaHasta
    );
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
