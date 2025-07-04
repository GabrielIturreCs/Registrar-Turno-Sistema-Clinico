import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Turno, Tratamiento, Paciente } from '../interfaces';
import { tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TurnoService {
  private apiUrl = `${environment.apiUrl}/turno`;
  private turnosSubject = new BehaviorSubject<Turno[]>([]);
  public turnos$ = this.turnosSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadTurnos();
  }

  private getHeaders(): HttpHeaders {
    // Simplificar headers por ahora para debugging
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  private loadTurnos(): void {
    this.getTurnosFromAPI().subscribe({
      next: (turnos) => {
        this.turnosSubject.next(turnos);
      },
      error: (error) => {
        console.error('Error cargando turnos:', error);
        this.turnosSubject.next([]);
      }
    });
  }

  // Obtener todos los turnos desde el backend
  getTurnosFromAPI(): Observable<Turno[]> {
    return this.http.get<Turno[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  // Obtener turnos (para compatibilidad con el componente)
  getTurnos(): Observable<Turno[]> {
    return this.turnos$;
  }

  // Obtener turno por ID
  getTurnoById(id: string): Observable<Turno> {
    return this.http.get<Turno>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // Obtener turnos por fecha
  getTurnosByDate(fecha: string): Observable<Turno[]> {
    return this.http.get<Turno[]>(`${this.apiUrl}/fecha/${fecha}`, { headers: this.getHeaders() });
  }

  // Obtener turnos por paciente
  getTurnosByPaciente(pacienteId: string): Observable<Turno[]> {
    return this.http.get<Turno[]>(`${this.apiUrl}/paciente/${pacienteId}`, { headers: this.getHeaders() });
  }

  // Obtener turnos por dentista
  getTurnosByDentista(dentistaId: string): Observable<Turno[]> {
    return this.http.get<Turno[]>(`${this.apiUrl}/dentista/${dentistaId}`, { headers: this.getHeaders() });
  }

  // Crear nuevo turno
  createTurno(turnoData: Partial<Turno>): Observable<Turno> {
    return this.http.post<Turno>(this.apiUrl, turnoData, { headers: this.getHeaders() })
      .pipe(
        // Actualizar la lista local después de crear
        tap((newTurno) => {
          const currentTurnos = this.turnosSubject.value;
          this.turnosSubject.next([...currentTurnos, newTurno]);
        })
      );
  }

  // Actualizar turno
  updateTurno(id: string, updates: Partial<Turno>): Observable<Turno> {
    return this.http.put<Turno>(`${this.apiUrl}/${id}`, updates, { headers: this.getHeaders() })
      .pipe(
        // Actualizar la lista local después de actualizar
        tap((updatedTurno) => {
          const currentTurnos = this.turnosSubject.value;
          const updatedTurnos = currentTurnos.map(turno => 
            String(turno.id) === String(updatedTurno.id) ? updatedTurno : turno
          );
          this.turnosSubject.next(updatedTurnos);
        })
      );
  }

  // Eliminar turno
  deleteTurno(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(
        // Actualizar la lista local después de eliminar
        tap(() => {
          const currentTurnos = this.turnosSubject.value;
          const filteredTurnos = currentTurnos.filter(turno => String(turno.id) !== id);
          this.turnosSubject.next(filteredTurnos);
        })
      );
  }

  /**
   * Cambia el estado de un turno existente
   * @param id ID del turno
   * @param nuevoEstado Estado a establecer (ej: 'pendiente', 'reservado', 'cancelado')
   */
  cambiarEstadoTurno(id: string, nuevoEstado: string): Observable<Turno> {
    return this.updateTurno(id, { estado: nuevoEstado });
  }

  // Obtener estadísticas
  getEstadisticas(fechaDesde?: string, fechaHasta?: string): Observable<any> {
    let url = `${this.apiUrl}/estadisticas`;
    const params: any = {};
    
    if (fechaDesde) params.fechaDesde = fechaDesde;
    if (fechaHasta) params.fechaHasta = fechaHasta;
    
    return this.http.get(url, { 
      headers: this.getHeaders(),
      params 
    });
  }

  // Obtener tratamientos disponibles
  getTratamientos(): Observable<Tratamiento[]> {
    // Sin headers de autenticación para simplificar
    return this.http.get<Tratamiento[]>(`${environment.apiUrl}/tratamiento`);
  }

  // Obtener pacientes
  getPacientes(): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(`${environment.apiUrl}/paciente`, { 
      headers: this.getHeaders() 
    });
  }

  // Verificar disponibilidad de horario
  verificarDisponibilidad(fecha: string, hora: string, dentistaId?: string): Observable<boolean> {
    const params: any = { fecha, hora };
    if (dentistaId) params.dentistaId = dentistaId;
    
    return this.http.get<boolean>(`${this.apiUrl}/disponibilidad`, {
      headers: this.getHeaders(),
      params
    });
  }

  // Obtener horarios disponibles para una fecha
  getHorariosDisponibles(fecha: string, dentistaId?: string): Observable<string[]> {
    const params: any = { fecha };
    if (dentistaId) params.dentistaId = dentistaId;
    
    return this.http.get<string[]>(`${this.apiUrl}/horarios-disponibles`, {
      headers: this.getHeaders(),
      params
    });
  }

  // Refrescar datos desde el backend
  refreshTurnos(): void {
    this.loadTurnos();
  }
} 