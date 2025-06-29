import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DentistaService {
  private apiUrl = 'http://localhost:3000/api/dentista'; 

  constructor(private http: HttpClient) { }

  getDentistas(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getDentistaById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createDentista(dentista: any): Observable<any> {
    return this.http.post(this.apiUrl, dentista);
  }

  updateDentista(id: string, dentista: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, dentista);
  }

  deleteDentista(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
