import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

// Interfaces para Mercado Pago
export interface MercadoPagoItem {
  title: string;
  description: string;
  picture_url?: string;
  category_id?: string;
  quantity: number;
  unit_price: number;
}

export interface MercadoPagoPayer {
  name: string;
  surname: string;
  email: string;
  phone?: {
    area_code: string;
    number: string;
  };
  identification?: {
    type: string;
    number: string;
  };
  address?: {
    street_name: string;
    street_number: number;
    zip_code: string;
  };
}

export interface PaymentRequest {
  payer_email: string;
  items: MercadoPagoItem[];
  payer?: MercadoPagoPayer;
  external_reference?: string;
  notification_url?: string;
  statement_descriptor?: string;
  user_type?: string; // Agregar tipo de usuario
  back_urls?: {
    failure: string;
    pending: string;
    success: string;
  };
  auto_return?: 'approved' | 'all';
}

export interface SubscriptionRequest {
  reason: string;
  payer_email: string;
  frequency: number;
  frequency_type: 'days' | 'months';
  transaction_amount: number;
  currency_id: string;
  back_url?: string;
}

export interface MercadoPagoResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
  preference_id: string;
  [key: string]: any;
}

export interface SubscriptionResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class MercadoPagoService {
  private apiUrl = `${environment.apiUrl}/mp`;
  private frontendUrl = window.location.origin;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  private getRequestOptions() {
    return {
      headers: this.getHeaders(),
      withCredentials: true // Importante: enviar cookies
    };
  }

  /**
   * Crear un pago único en Mercado Pago
   * @param paymentData Datos del pago
   * @returns Observable con la respuesta de Mercado Pago
   */
  createPayment(paymentData: PaymentRequest): Observable<MercadoPagoResponse> {
    // Agregar back_urls y auto_return si no están presentes
    const paymentDataWithUrls = {
      ...paymentData,
      back_urls: {
        failure: "http://localhost:4200/reservar?payment=failure",
        pending: "http://localhost:4200/reservar?payment=pending",
        success: "http://localhost:4200/reservar?payment=success"
      },
      auto_return: 'approved'
    };

    return this.http.post<MercadoPagoResponse>(
      `${this.apiUrl}/payment`, 
      paymentDataWithUrls, 
      this.getRequestOptions()
    );
  }

  /**
   * Crear una suscripción en Mercado Pago
   * @param subscriptionData Datos de la suscripción
   * @returns Observable con la respuesta de Mercado Pago
   */
  createSubscription(subscriptionData: SubscriptionRequest): Observable<SubscriptionResponse> {
    return this.http.post<SubscriptionResponse>(
      `${this.apiUrl}/subscription`, 
      subscriptionData, 
      this.getRequestOptions()
    );
  }

  /**
   * Crear un pago para un turno médico
   * @param turnoId ID del turno
   * @param pacienteEmail Email del paciente
   * @param monto Monto del pago
   * @param descripcion Descripción del tratamiento
   * @param userType Tipo de usuario (opcional)
   * @returns Observable con la respuesta de Mercado Pago
   */
  createTurnoPayment(
    turnoId: string, 
    pacienteEmail: string, 
    monto: number, 
    descripcion: string,
    userType?: string
  ): Observable<MercadoPagoResponse> {
    const paymentData: PaymentRequest = {
      payer_email: pacienteEmail,
      external_reference: turnoId,
      user_type: userType || 'paciente',
      items: [
        {
          title: `Turno Médico - ${descripcion}`,
          description: `Pago por turno médico programado`,
          quantity: 1,
          unit_price: monto,
          category_id: 'health'
        }
      ],
      back_urls: {
        failure: "http://localhost:4200/reservar?payment=failure",
        pending: "http://localhost:4200/reservar?payment=pending",
        success: "http://localhost:4200/reservar?payment=success"
      },
      auto_return: 'approved'
    };

    return this.createPayment(paymentData);
  }

  /**
   * Crear una suscripción para un plan de tratamiento
   * @param pacienteEmail Email del paciente
   * @param monto Monto mensual
   * @param descripcion Descripción del plan
   * @param frecuencia Frecuencia en meses (por defecto 1)
   * @returns Observable con la respuesta de Mercado Pago
   */
  createPlanSubscription(
    pacienteEmail: string,
    monto: number,
    descripcion: string,
    frecuencia: number = 1
  ): Observable<SubscriptionResponse> {
    const subscriptionData: SubscriptionRequest = {
      reason: descripcion,
      payer_email: pacienteEmail,
      frequency: frecuencia,
      frequency_type: 'months',
      transaction_amount: monto,
      currency_id: 'ARS',
      back_url: 'http://localhost:4200/reservar?payment=success'
    };

    return this.createSubscription(subscriptionData);
  }

  /**
   * Redirigir al usuario al link de pago de Mercado Pago
   * @param initPoint URL de pago de Mercado Pago
   */
  redirectToPayment(initPoint: string): void {
    window.location.href = initPoint;
  }

  /**
   * Procesar el resultado de un pago desde los query params
   * @param queryParams Parámetros de la URL de retorno
   * @returns Objeto con la información del pago
   */
  processPaymentResult(queryParams: any): {
    paymentId: string | null;
    status: string | null;
    externalReference: string | null;
    merchantOrderId: string | null;
    preferenceId: string | null;
  } {
    return {
      paymentId: queryParams['collection_id'] || queryParams['payment_id'] || null,
      status: queryParams['collection_status'] || queryParams['status'] || null,
      externalReference: queryParams['external_reference'] || null,
      merchantOrderId: queryParams['merchant_order_id'] || null,
      preferenceId: queryParams['preference_id'] || null
    };
  }

  /**
   * Verificar si un pago fue exitoso
   * @param status Estado del pago
   * @returns true si el pago fue aprobado
   */
  isPaymentSuccessful(status: string): boolean {
    return status === 'approved';
  }

  /**
   * Verificar si un pago está pendiente
   * @param status Estado del pago
   * @returns true si el pago está pendiente
   */
  isPaymentPending(status: string): boolean {
    return status === 'pending' || status === 'in_process';
  }

  /**
   * Verificar si un pago falló
   * @param status Estado del pago
   * @returns true si el pago falló
   */
  isPaymentFailed(status: string): boolean {
    return status === 'rejected' || status === 'cancelled' || status === 'failure';
  }

  /**
   * Obtener mensaje descriptivo del estado del pago
   * @param status Estado del pago
   * @returns Mensaje descriptivo
   */
  getPaymentStatusMessage(status: string): string {
    switch (status) {
      case 'approved':
        return '¡Tu pago ha sido aprobado exitosamente!';
      case 'pending':
        return 'Tu pago está pendiente de confirmación.';
      case 'in_process':
        return 'Tu pago está siendo procesado.';
      case 'rejected':
        return 'Tu pago ha sido rechazado.';
      case 'cancelled':
        return 'Tu pago ha sido cancelado.';
      case 'failure':
        return 'Tu pago ha fallado.';
      default:
        return 'Estado del pago desconocido.';
    }
  }
} 