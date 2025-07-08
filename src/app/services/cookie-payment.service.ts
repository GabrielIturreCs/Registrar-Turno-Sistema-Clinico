import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface PaymentStatusResponse {
  success: boolean;
  paymentStatus?: {
    status: string;
    userType: string;
    timestamp: number;
  };
  turnoInfo?: any;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CookiePaymentService {
  private apiUrl = `${environment.apiUrl}/payment-callback`;

  constructor(private http: HttpClient) { }

  // Verificar el estado del pago desde cookies del servidor
  checkPaymentStatus(): Observable<PaymentStatusResponse> {
    return this.http.get<PaymentStatusResponse>(`${this.apiUrl}/status`, {
      withCredentials: true // Importante: enviar cookies
    });
  }

  // Limpiar cualquier estado de pago local
  clearLocalPaymentData(): void {
    // Limpiar cualquier dato local que pueda haber quedado
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('payment_success');
      sessionStorage.removeItem('payment_pending');
      sessionStorage.removeItem('payment_failure');
      sessionStorage.removeItem('turno_pendiente');
      sessionStorage.removeItem('turno_info_success');
      localStorage.removeItem('payment_success');
      localStorage.removeItem('turno_info_backup');
      localStorage.removeItem('turno_info_success');
    }
  }

  // Obtener el tipo de dashboard según el tipo de usuario
  getDashboardRoute(userType: string): string {
    switch (userType) {
      case 'paciente':
        return '/vistaPaciente';
      case 'dentista':
      case 'administrador':
        return '/dashboard';
      default:
        return '/dashboard';
    }
  }
}
