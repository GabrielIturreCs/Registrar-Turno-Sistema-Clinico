import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Turno, Tratamiento, Paciente } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class TurnoService {
  private turnosSubject = new BehaviorSubject<Turno[]>([]);
  public turnos$ = this.turnosSubject.asObservable();

  // Datos de prueba
  private testData = {
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
      } as Turno,
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
      } as Turno,
      { 
        id: 3, 
        nroTurno: 'T003', 
        fecha: '2024-01-21', 
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
      } as Turno
    ] as Turno[],
    tratamientos: [
      { id: 1, descripcion: 'Consulta General', precio: 5000, duracion: 30 },
      { id: 2, descripcion: 'Limpieza Dental', precio: 8000, duracion: 45 },
      { id: 3, descripcion: 'Empaste', precio: 12000, duracion: 60 },
      { id: 4, descripcion: 'Extracción', precio: 15000, duracion: 30 },
      { id: 5, descripcion: 'Ortodoncia - Consulta', precio: 10000, duracion: 45 }
    ],
    pacientes: [
      { id: 1, nombre: 'Juan', apellido: 'Pérez', dni: '87654321', obraSocial: 'OSDE', telefono: '123456789' },
      { id: 2, nombre: 'María', apellido: 'García', dni: '20123456', obraSocial: 'Swiss Medical', telefono: '987654321' },
      { id: 3, nombre: 'Carlos', apellido: 'López', dni: '25789123', obraSocial: 'OSDE', telefono: '555666777' }
    ]
  };

  constructor() {
    this.loadTurnos();
  }

  private loadTurnos(): void {
    this.turnosSubject.next(this.testData.turnos);
  }

  getTurnos(): Observable<Turno[]> {
    return this.turnos$;
  }

  getTurnosByDate(fecha: string): Turno[] {
    return this.testData.turnos.filter(turno => turno.fecha === fecha);
  }

  getTurnosByUser(userId: number): Turno[] {
    return this.testData.turnos.filter(turno => turno.pacienteId === userId);
  }

  getTurnosByDentista(dentistaId: number): Turno[] {
    // En un sistema real, los turnos estarían asociados a un dentista específico
    return this.testData.turnos;
  }

  createTurno(turnoData: Partial<Turno>): Promise<Turno> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newId = Math.max(...this.testData.turnos.map(t => t.id)) + 1;
        const newTurno: Turno = {
          id: newId,
          nroTurno: 'T' + String(newId).padStart(3, '0'),
          fecha: turnoData.fecha || '',
          hora: turnoData.hora || '',
          estado: 'reservado',
          tratamiento: turnoData.tratamiento || '',
          precioFinal: turnoData.precioFinal || 0,
          nombre: turnoData.nombre || '',
          apellido: turnoData.apellido || '',
          dni: turnoData.dni || '',
          telefono: turnoData.telefono || '',
          duracion: turnoData.duracion || 0,
          pacienteId: turnoData.pacienteId || 0,
          tratamientoId: turnoData.tratamientoId || 0
        };

        this.testData.turnos.push(newTurno);
        this.turnosSubject.next([...this.testData.turnos]);
        resolve(newTurno);
      }, 500);
    });
  }

  updateTurno(id: number, updates: Partial<Turno>): Promise<Turno | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = this.testData.turnos.findIndex(t => t.id === id);
        if (index !== -1) {
          this.testData.turnos[index] = { ...this.testData.turnos[index], ...updates };
          this.turnosSubject.next([...this.testData.turnos]);
          resolve(this.testData.turnos[index]);
        } else {
          resolve(null);
        }
      }, 500);
    });
  }

  deleteTurno(id: number): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = this.testData.turnos.findIndex(t => t.id === id);
        if (index !== -1) {
          this.testData.turnos.splice(index, 1);
          this.turnosSubject.next([...this.testData.turnos]);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 500);
    });
  }

  getTratamientos(): Tratamiento[] {
    return this.testData.tratamientos;
  }

  getPacientes(): Paciente[] {
    return this.testData.pacientes;
  }

  getEstadisticas(fecha?: string): any {
    const turnos = fecha ? this.getTurnosByDate(fecha) : this.testData.turnos;
    
    return {
      total: turnos.length,
      reservados: turnos.filter(t => t.estado === 'reservado').length,
      completados: turnos.filter(t => t.estado === 'completado').length,
      cancelados: turnos.filter(t => t.estado === 'cancelado').length,
      ingresos: turnos
        .filter(t => t.estado === 'completado')
        .reduce((total, t) => total + t.precioFinal, 0)
    };
  }
} 