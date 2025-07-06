import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-callback.component.html',
  styleUrls: ['./payment-callback.component.css']
})
export class PaymentCallbackComponent implements OnInit {
  status: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Obtener el status desde la URL
    this.route.url.subscribe(segments => {
      if (segments.length >= 2) {
        this.status = segments[1].path; // success, failure, pending
        console.log('Status detectado:', this.status);
      }
    });

    // También obtener parámetros de query si los hay
    this.route.queryParams.subscribe(params => {
      console.log('Payment callback params:', params);
      
      // Procesar parámetros de MercadoPago
      const collectionId = params['collection_id'];
      const collectionStatus = params['collection_status'];
      const externalReference = params['external_reference'];
      
      if (collectionId && collectionStatus) {
        console.log('Parámetros de MercadoPago:', { collectionId, collectionStatus, externalReference });
        
        // Guardar información del pago
        const paymentInfo = {
          paymentId: collectionId,
          paymentStatus: collectionStatus,
          externalReference: externalReference,
          timestamp: new Date().toISOString()
        };
        
        if (collectionStatus === 'approved') {
          console.log('✅ Pago aprobado, guardando información');
          sessionStorage.setItem('payment_success_info', JSON.stringify(paymentInfo));
          sessionStorage.setItem('payment_success', 'true');
          
          // Redirigir al paso 5 del wizard de reserva
          setTimeout(() => {
            this.router.navigate(['/reservarTurno'], { 
              queryParams: { 
                payment: 'success',
                step: '5',
                returnFromPayment: 'true'
              } 
            });
          }, 2000);
        } else if (collectionStatus === 'pending') {
          console.log('⏳ Pago pendiente');
          sessionStorage.setItem('payment_pending', 'true');
          setTimeout(() => {
            this.router.navigate(['/reservarTurno'], { 
              queryParams: { 
                payment: 'pending',
                step: '5'
              } 
            });
          }, 2000);
        } else if (collectionStatus === 'rejected' || collectionStatus === 'failure') {
          console.log('❌ Pago fallido');
          sessionStorage.setItem('payment_failed', 'true');
          setTimeout(() => {
            this.router.navigate(['/reservarTurno'], { 
              queryParams: { 
                payment: 'failure',
                step: '5'
              } 
            });
          }, 2000);
        }
      }
    });
  }

  goToReservar() {
    this.router.navigate(['/reservarTurno']);
  }
}
