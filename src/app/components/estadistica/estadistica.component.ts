import { Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User,Turno,Estadisticas } from '../../interfaces';
import { TurnoService } from '../../services/turno.service';

interface EstadisticaTratamiento {
  tratamiento: string;
  cantidad: number;
  ingresos: number;
}

@Component({
  selector: 'app-estadistica',
  imports: [CommonModule,FormsModule],
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

  // Constructor para inyectar servicios
  constructor(private router: Router,private turnoService: TurnoService,private authService: AuthService) {}
  ngOnInit(): void {
    this.loadUserData();
    this.loadData();
    this.setDefaultDates();
  }

  //aca se carga el usuario actual
  loadUserData(): void {
    this.user = this.authService.getCurrentUser();
    // Permitir acceso a administrador y dentista
    if (!this.user || (this.user.tipoUsuario !== 'administrador' && this.user.tipoUsuario !== 'dentista')) {
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

    // Calcular estadísticas
    this.estadisticas = {
      total: filteredTurnos.length,
      reservados: filteredTurnos.filter(t => t.estado === 'reservado').length,
      completados: filteredTurnos.filter(t => t.estado === 'completado').length,
      cancelados: filteredTurnos.filter(t => t.estado === 'cancelado').length,
      ingresos: filteredTurnos
        .filter(t => t.estado === 'completado')
        .reduce((total, t) => total + t.precioFinal, 0)
    };

    // Calcular estadísticas por tratamiento
    this.calcularEstadisticasPorTratamiento(filteredTurnos);

    // Obtener turnos recientes
    this.turnosRecientes = filteredTurnos
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 10);
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
        estadistica.ingresos += turno.precioFinal;
      }
    });

    this.estadisticasPorTratamiento = Array.from(tratamientosMap.values())
      .sort((a, b) => b.cantidad - a.cantidad);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  exportarEstadisticas(): void {
    // Aquí podrías generar un PDF o Excel con las estadísticas
    alert('Función de exportación - En desarrollo');
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
