import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CalendarEvent {
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{ email: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleCalendarService {
  private apiUrl = 'https://www.googleapis.com/calendar/v3';
  private accessToken: string | null = null;

  constructor(private http: HttpClient) {
    this.accessToken = localStorage.getItem('googleAccessToken');
  }

  // Crear evento en Google Calendar
  createEvent(event: CalendarEvent): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(
      `${this.apiUrl}/calendars/primary/events`,
      event,
      { headers }
    );
  }

  // Obtener eventos del calendario
  getEvents(timeMin: string, timeMax: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.accessToken}`
    });

    const params = {
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: 'true',
      orderBy: 'startTime'
    };

    return this.http.get(`${this.apiUrl}/calendars/primary/events`, {
      headers,
      params
    });
  }

  // Crear evento de turno
  createTurnoEvent(turno: any, pacienteEmail: string): Observable<any> {
    const event: CalendarEvent = {
      summary: `Turno Odontológico - ${turno.tratamiento}`,
      description: `Paciente: ${turno.nombre} ${turno.apellido}\nTratamiento: ${turno.tratamiento}\nPrecio: $${turno.precioFinal}`,
      start: {
        dateTime: `${turno.fecha}T${turno.hora}:00`,
        timeZone: 'America/Argentina/Buenos_Aires'
      },
      end: {
        dateTime: `${turno.fecha}T${this.addMinutes(turno.hora, turno.duracion || 30)}:00`,
        timeZone: 'America/Argentina/Buenos_Aires'
      },
      attendees: [
        { email: pacienteEmail }
      ]
    };

    return this.createEvent(event);
  }

  private addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
    localStorage.setItem('googleAccessToken', token);
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
} 