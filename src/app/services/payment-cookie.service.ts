import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface PaymentData {
  turnoInfo: any;
  userType: string;
  paymentReference?: string;
  paymentToken?: string;
  paymentInProgress?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentCookieService {
  private apiUrl = `${environment.apiUrl}/payment`;

  constructor(private http: HttpClient) { }

  /**
   * Guardar información de pago en cookies seguras del backend
   */
  setPaymentData(turnoInfo: any, userType: string, paymentReference?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/set-payment-data`, {
      turnoInfo,
      userType,
      paymentReference
    }, { 
      withCredentials: true // Importante para enviar cookies
    });
  }

  /**
   * Recuperar información de pago desde cookies seguras
   */
  getPaymentData(): Observable<{ success: boolean; data?: PaymentData; message?: string }> {
    return this.http.get<{ success: boolean; data?: PaymentData; message?: string }>(
      `${this.apiUrl}/get-payment-data`,
      { withCredentials: true }
    );
  }

  /**
   * Limpiar cookies de pago
   */
  clearPaymentData(): Observable<any> {
    return this.http.post(`${this.apiUrl}/clear-payment-data`, {}, {
      withCredentials: true
    });
  }

  /**
   * Marcar pago como exitoso
   */
  markPaymentSuccess(paymentId: string, status: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/mark-payment-success`, {
      paymentId,
      status
    }, {
      withCredentials: true
    });
  }

  /**
   * Verificar si hay un pago en progreso
   */
  hasPaymentInProgress(): Observable<boolean> {
    return new Observable(observer => {
      this.getPaymentData().subscribe({
        next: (response) => {
          observer.next(response.success && response.data?.paymentInProgress === true);
          observer.complete();
        },
        error: () => {
          observer.next(false);
          observer.complete();
        }
      });
    });
  }
}
