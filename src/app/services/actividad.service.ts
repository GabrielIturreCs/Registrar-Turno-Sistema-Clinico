import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ActividadService {
  private actividadSubject = new Subject<any>();
  actividad$ = this.actividadSubject.asObservable();

  nuevaActividad(actividad: any) {
    this.actividadSubject.next(actividad);
  }
} 