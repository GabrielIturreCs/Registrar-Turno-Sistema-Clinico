import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-payment-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-callback.component.html',
  styleUrls: ['./payment-callback.component.css']
})
export class PaymentCallbackComponent implements OnInit {
  status: string | null = null;
  isProcessing = true;
  message = 'Procesando tu pago...';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Debug logging
    console.log('💳 PaymentCallbackComponent initialized');
    console.log('🌐 API URL:', environment.apiUrl);
    
    // Obtener el status desde la URL
    this.route.url.subscribe(segments => {
      console.log('🔍 URL segments:', segments);
      if (segments.length >= 2) {
        this.status = segments[1].path; // success, failure, pending
        console.log('✅ Status detectado:', this.status);
      } else {
        console.log('⚠️ No se pudo detectar status desde URL');
      }
    });

    // También obtener parámetros de query si los hay
    this.route.queryParams.subscribe(params => {
      console.log('📋 Payment callback params completos:', params);
      
      // Procesar parámetros de MercadoPago
      const collectionId = params['collection_id'];
      const collectionStatus = params['collection_status'];
      const externalReference = params['external_reference'];
      
      console.log('🔍 Parámetros extraídos:', { 
        collectionId, 
        collectionStatus, 
        externalReference 
      });
      
      if (collectionId && collectionStatus && externalReference) {
        console.log('✅ Parámetros válidos encontrados - procediendo a actualizar turno');
        
        // Actualizar el turno con la información del pago
        this.updateTurnoPaymentStatus(externalReference, collectionId, collectionStatus);
      } else {
        console.log('⚠️ Parámetros insuficientes - usando redirección simple');
        // Si no hay parámetros de pago, simplemente redirigir
        this.handleRedirect();
      }
    });
  }

  async updateTurnoPaymentStatus(turnoId: string, paymentId: string, paymentStatus: string) {
    try {
      this.message = 'Actualizando estado del turno...';
      console.log('🔄 Iniciando actualización de turno:', { turnoId, paymentId, paymentStatus });
      
      const updateUrl = `${environment.apiUrl}/payment-callback/update-payment-status`;
      console.log('📡 URL de actualización:', updateUrl);
      
      const requestBody = {
        turnoId: turnoId,
        paymentId: paymentId,
        paymentStatus: paymentStatus
      };
      console.log('📦 Request body:', requestBody);
      
      // Llamar al backend para actualizar el estado del pago
      const response = await this.http.post(updateUrl, requestBody).toPromise();
      
      console.log('✅ Respuesta del servidor:', response);
      
      // Guardar información del pago
      const paymentInfo = {
        paymentId: paymentId,
        paymentStatus: paymentStatus,
        externalReference: turnoId,
        timestamp: new Date().toISOString(),
        turnoUpdated: true
      };
      
      if (paymentStatus === 'approved') {
        console.log('✅ Pago aprobado y turno actualizado');
        sessionStorage.setItem('payment_success_info', JSON.stringify(paymentInfo));
        sessionStorage.setItem('payment_success', 'true');
        this.message = '¡Pago exitoso! Turno confirmado';
        this.status = 'success';
        
        // Redirigir a la vista del paciente para ver sus turnos actualizados
        setTimeout(() => {
          console.log('🔄 Redirigiendo a vista del paciente...');
          this.router.navigate(['/vistaPaciente'], { 
            queryParams: { 
              payment: 'success',
              turnoUpdated: 'true'
            } 
          });
        }, 2000);
      } else if (paymentStatus === 'pending') {
        console.log('⏳ Pago pendiente');
        sessionStorage.setItem('payment_pending', 'true');
        this.message = 'Pago pendiente de confirmación';
        this.status = 'pending';
        setTimeout(() => {
          this.router.navigate(['/vistaPaciente'], { 
            queryParams: { 
              payment: 'pending'
            } 
          });
        }, 2000);
      } else if (paymentStatus === 'rejected' || paymentStatus === 'failure') {
        console.log('❌ Pago fallido');
        sessionStorage.setItem('payment_failed', 'true');
        this.message = 'Pago rechazado. Intenta nuevamente';
        this.status = 'failure';
        setTimeout(() => {
          this.router.navigate(['/vistaPaciente'], { 
            queryParams: { 
              payment: 'failure'
            } 
          });
        }, 2000);
      }
      
    } catch (error: any) {
      console.error('❌ Error actualizando turno - Detalles completos:', error);
      console.error('❌ Error response:', error?.error);
      console.error('❌ Error status:', error?.status);
      console.error('❌ Error message:', error?.message);
      
      this.message = 'Error procesando el pago. Contacta al soporte.';
      this.status = 'error';
      
      // Aún así, guardar información para intentar recuperar más tarde
      const errorInfo = {
        turnoId: turnoId,
        paymentId: paymentId,
        paymentStatus: paymentStatus,
        error: {
          message: error?.message,
          status: error?.status,
          details: error?.error
        },
        timestamp: new Date().toISOString()
      };
      
      sessionStorage.setItem('payment_error_info', JSON.stringify(errorInfo));
      console.log('💾 Error info guardada en sessionStorage para recuperación:', errorInfo);
      
      setTimeout(() => {
        this.router.navigate(['/vistaPaciente']);
      }, 3000);
    } finally {
      this.isProcessing = false;
      console.log('✅ Procesamiento finalizado');
    }
  }

  handleRedirect() {
    // Redirección simple sin parámetros de pago
    this.isProcessing = false;
    
    if (this.status === 'success') {
      this.message = 'Pago procesado correctamente';
    } else if (this.status === 'pending') {
      this.message = 'Pago pendiente de confirmación';
    } else if (this.status === 'failure') {
      this.message = 'El pago no pudo procesarse';
    }
    
    setTimeout(() => {
      this.router.navigate(['/vistaPaciente']);
    }, 2000);
  }

  goToReservar() {
    this.router.navigate(['/reservarTurno']);
  }

  goToVistaPaciente() {
    this.router.navigate(['/vistaPaciente']);
  }
}
