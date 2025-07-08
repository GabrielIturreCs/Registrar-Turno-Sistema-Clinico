import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataRefreshService {
  private refreshSubject = new Subject<string>();
  
  // Observable que otros componentes pueden suscribirse
  refresh$ = this.refreshSubject.asObservable();

  // Método para notificar que se deben refrescar los datos
  triggerRefresh(component: string = 'all') {
    console.log(`Triggering refresh for: ${component}`);
    this.refreshSubject.next(component);
  }
}
