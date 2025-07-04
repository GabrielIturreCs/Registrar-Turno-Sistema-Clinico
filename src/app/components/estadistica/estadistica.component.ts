import { Component, OnInit, OnDestroy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User,Turno,Estadisticas, Paciente, Tratamiento } from '../../interfaces';
import { TurnoService } from '../../services/turno.service';
import { PacienteService } from '../../services/paciente.service';
import { TratamientoService } from '../../services/tratamiento.service';
import { NgChartsModule } from 'ng2-charts';
import { PdfExportService } from '../../services/pdf-export.service';
import { Subscription, interval } from 'rxjs';

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
export class EstadisticaComponent implements OnInit, OnDestroy {
  user: User | null = null;
  turnos: Turno[] = [];
  pacientes: Paciente[] = [];
  tratamientos: Tratamiento[] = [];

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

  // Suscripciones para manejo de memoria
  private turnosSubscription?: Subscription;
  private pacientesSubscription?: Subscription;
  private tratamientosSubscription?: Subscription;
  private refreshInterval?: Subscription;

  // Estado de carga
  isLoading = false;

  // Constructor para inyectar servicios
  constructor(
    private router: Router,
    private turnoService: TurnoService,
    private pacienteService: PacienteService,
    private tratamientoService: TratamientoService,
    private authService: AuthService,
    private pdfExportService: PdfExportService
  ) {}
  
  ngOnInit(): void {
    this.loadUserData();
    this.setDefaultDates();
    this.loadData();
    
    // Configurar actualización automática cada 5 minutos
    this.refreshInterval = interval(300000).subscribe(() => {
      console.log('Estadísticas: Actualización automática iniciada');
      this.loadData();
    });
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones para evitar memory leaks
    this.turnosSubscription?.unsubscribe();
    this.pacientesSubscription?.unsubscribe();
    this.tratamientosSubscription?.unsubscribe();
    this.refreshInterval?.unsubscribe();
  }

  //aca se carga el usuario actual
  loadUserData(): void {
    // Verificar si hay usuario en localStorage
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');
    
    console.log('Estadísticas: Verificando autenticación...');
    console.log('Estadísticas: Token:', token);
    console.log('Estadísticas: Rol:', rol);
    console.log('Estadísticas: User:', userStr);
    
    if (userStr && token && rol) {
      this.user = JSON.parse(userStr);
      // Asegurar que el rol esté correctamente seteado
      if (this.user?.tipoUsuario) {
        localStorage.setItem('rol', this.user.tipoUsuario);
      }
    } else {
      this.user = this.authService.getCurrentUser();
    }
    
    // Solo permitir acceso a administrador
    if (!this.user || this.user.tipoUsuario !== 'administrador') {
      console.log('Estadísticas: Acceso denegado. Usuario:', this.user);
      alert('Acceso denegado. Solo los administradores pueden ver las estadísticas.');
      this.router.navigate(['/login']);
    } else {
      console.log('Estadísticas: Acceso permitido para administrador:', this.user.nombre);
    }
  }

  //aca se cargan los datos desde los servicios
  loadData(): void {
    this.isLoading = true;
    
    // Limpiar suscripciones anteriores
    this.turnosSubscription?.unsubscribe();
    this.pacientesSubscription?.unsubscribe();
    this.tratamientosSubscription?.unsubscribe();
    
    // Cargar turnos
    this.turnosSubscription = this.turnoService.getTurnos().subscribe({
      next: (turnos) => {
        console.log('Estadísticas: Turnos cargados:', turnos.length);
        this.turnos = turnos;
        this.actualizarEstadisticas();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando turnos:', error);
        this.turnos = [];
        this.actualizarEstadisticas();
        this.isLoading = false;
        this.mostrarNotificacion('Error al cargar turnos', 'error');
      }
    });

    // Cargar pacientes
    this.pacientesSubscription = this.pacienteService.getPacientes().subscribe({
      next: (pacientes) => {
        console.log('Estadísticas: Pacientes cargados:', pacientes.length);
        this.pacientes = pacientes;
      },
      error: (error) => {
        console.error('Error cargando pacientes:', error);
        this.pacientes = [];
        this.mostrarNotificacion('Error al cargar pacientes', 'error');
      }
    });

    // Cargar tratamientos
    this.tratamientosSubscription = this.tratamientoService.getTratamientos().subscribe({
      next: (tratamientos) => {
        console.log('Estadísticas: Tratamientos cargados:', tratamientos.length);
        this.tratamientos = tratamientos;
      },
      error: (error) => {
        console.error('Error cargando tratamientos:', error);
        this.tratamientos = [];
        this.mostrarNotificacion('Error al cargar tratamientos', 'error');
      }
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

  // Método para refrescar datos manualmente
  refreshEstadisticas(): void {
    console.log('Estadísticas: Refrescando datos...');
    this.loadData();
    this.mostrarNotificacion('Datos actualizados correctamente', 'success');
  }

  // Método para mostrar notificaciones
  private mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' | 'info'): void {
    // Crear una notificación simple
    const notificacion = document.createElement('div');
    notificacion.className = `alert alert-${tipo === 'success' ? 'success' : tipo === 'error' ? 'danger' : 'info'} alert-dismissible fade show position-fixed`;
    notificacion.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notificacion.innerHTML = `
      ${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notificacion);
    
    // Remover la notificación después de 3 segundos
    setTimeout(() => {
      if (notificacion.parentNode) {
        notificacion.parentNode.removeChild(notificacion);
      }
    }, 3000);
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

  // Método para obtener estadísticas adicionales
  getEstadisticasAdicionales(): any {
    const completados = this.estadisticas.completados;
    const ingresos = this.estadisticas.ingresos;
    return {
      totalPacientes: this.pacientes.length,
      totalTratamientos: this.tratamientos.length,
      promedioIngresosPorTurno: completados > 0 ? (ingresos / completados).toFixed(2) : '0',
    };
  }
}
