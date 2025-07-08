import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paciente } from '../interfaces';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PacienteService {
  private apiUrl = `${environment.apiUrl}/paciente`; 

  constructor(private http: HttpClient) { }

  getPacientes(): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(this.apiUrl);
  }

  getPacienteById(id: string): Observable<Paciente> {
    return this.http.get<Paciente>(`${this.apiUrl}/${id}`);
  }

  createPaciente(paciente: Paciente): Observable<Paciente> {
    return this.http.post<Paciente>(this.apiUrl, paciente);
  }

  updatePaciente(id: string, paciente: Paciente): Observable<Paciente> {
    return this.http.put<Paciente>(`${this.apiUrl}/${id}`, paciente);
  }

  deletePaciente(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getOdontograma(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/odontograma`);
  }

  updateOdontograma(id: string, odontograma: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/odontograma`, { odontograma });
  }
}
