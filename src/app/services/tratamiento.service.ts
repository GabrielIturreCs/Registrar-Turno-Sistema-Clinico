import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tratamiento } from '../interfaces';

// Interfaces para las respuestas del backend
interface ApiResponse<T> {
  status: string;
  msg: string;
  tratamiento?: T;
}

@Injectable({
  providedIn: 'root'
})
export class TratamientoService {
  private apiUrl = 'http://localhost:3000/api/tratamiento';

  constructor(private http: HttpClient) { }

  // Obtener todos los tratamientos
  getTratamientos(): Observable<Tratamiento[]> {
    return this.http.get<Tratamiento[]>(this.apiUrl);
  }

  // Obtener un tratamiento por ID
  getTratamiento(id: string): Observable<Tratamiento> {
    return this.http.get<Tratamiento>(`${this.apiUrl}/${id}`);
  }

  // Crear un nuevo tratamiento
  crearTratamiento(tratamiento: Tratamiento): Observable<ApiResponse<Tratamiento>> {
    return this.http.post<ApiResponse<Tratamiento>>(this.apiUrl, tratamiento);
  }

  // Actualizar un tratamiento existente
  actualizarTratamiento(id: string, tratamiento: Tratamiento): Observable<ApiResponse<Tratamiento>> {
    return this.http.put<ApiResponse<Tratamiento>>(`${this.apiUrl}/${id}`, tratamiento);
  }

  // Eliminar un tratamiento
  eliminarTratamiento(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }
}
