import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pago-exitoso',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pago-exitoso.component.html',
  styleUrls: ['./pago-exitoso.component.css']
})
export class PagoExitosoComponent implements OnInit {
  paymentId: string | null = null;
  paymentStatus: string | null = null;
  externalReference: string | null = null;
  loading: boolean = true;
  message: string = 'Procesando tu pago...';
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    console.log('🎉 PagoExitosoComponent inicializado');
    
    this.route.queryParams.subscribe(params => {
      console.log('📋 Parámetros recibidos:', params);
      
      this.paymentId = params['collection_id'] || params['payment_id'];
      this.paymentStatus = params['collection_status'] || params['status'];
      this.externalReference = params['external_reference'];

      console.log('💳 Datos del pago:', {
        paymentId: this.paymentId,
        paymentStatus: this.paymentStatus,
        externalReference: this.externalReference
      });

      if (this.paymentId && this.paymentStatus === 'approved') {
        console.log('✅ Pago aprobado, procesando...');
        
        // Guardar información del pago exitoso en sessionStorage
        const paymentInfo = {
          paymentId: this.paymentId,
          paymentStatus: this.paymentStatus,
          externalReference: this.externalReference,
          timestamp: new Date().toISOString()
        };
        sessionStorage.setItem('payment_success_info', JSON.stringify(paymentInfo));
        
        // Marcar el pago como exitoso
        sessionStorage.setItem('payment_success', 'true');
        localStorage.setItem('pago_exitoso', 'true');
        
        this.message = '¡Tu pago ha sido aprobado! Redirigiendo al paso 5...';
        this.loading = false;
        
        // Redirigir inmediatamente a reservar con parámetros específicos para el paso 5
        setTimeout(() => {
          console.log('🔄 Redirigiendo a /reservarTurno con parámetros de pago exitoso');
          this.router.navigate(['/reservarTurno'], { 
            queryParams: { 
              payment: 'success',
              step: '5',
              returnFromPayment: 'true',
              paymentId: this.paymentId
            } 
          });
        }, 1500);
        
      } else if (this.paymentStatus === 'pending') {
        console.log('⏳ Pago pendiente');
        this.message = 'Tu pago está pendiente. Te notificaremos cuando se complete.';
        sessionStorage.setItem('payment_pending', 'true');
        this.loading = false;
        
        setTimeout(() => {
          this.router.navigate(['/reservarTurno'], { 
            queryParams: { 
              payment: 'pending',
              step: '5'
            } 
          });
        }, 1500);
        
      } else if (this.paymentStatus === 'rejected' || this.paymentStatus === 'failure') {
        console.log('❌ Pago fallido');
        this.message = 'Tu pago ha sido rechazado. Por favor, intenta de nuevo.';
        sessionStorage.setItem('payment_failed', 'true');
        this.loading = false;
        
        setTimeout(() => {
          this.router.navigate(['/reservarTurno'], { 
            queryParams: { 
              payment: 'failure',
              step: '5'
            } 
          });
        }, 1500);
        
      } else {
        console.log('❓ Estado de pago desconocido:', this.paymentStatus);
        this.message = 'No se pudo determinar el estado del pago.';
        this.loading = false;
      }
    });
  }

  volverAReservar() {
    console.log('🔄 Botón "Volver a reservar" clickeado');
    
    // Asegurar que los datos del pago estén guardados
    if (this.paymentId) {
      const paymentInfo = {
        paymentId: this.paymentId,
        paymentStatus: this.paymentStatus,
        externalReference: this.externalReference,
        timestamp: new Date().toISOString()
      };
      sessionStorage.setItem('payment_success_info', JSON.stringify(paymentInfo));
      sessionStorage.setItem('payment_success', 'true');
      localStorage.setItem('pago_exitoso', 'true');
    }
    
    // Redirigir a reservar con parámetros específicos para el paso 5
    this.router.navigate(['/reservarTurno'], { 
      queryParams: { 
        payment: 'success',
        step: '5',
        returnFromPayment: 'true',
        paymentId: this.paymentId
      } 
    });
  }
} 