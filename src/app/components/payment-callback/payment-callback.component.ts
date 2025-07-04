import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card">
            <div class="card-body text-center">
              <div *ngIf="status === 'success'" class="text-success">
                <i class="fas fa-check-circle fa-3x mb-3"></i>
                <h3>¡Pago Exitoso!</h3>
                <p>Tu turno ha sido confirmado y pagado correctamente.</p>
                <button class="btn btn-success" (click)="goToMisTurnos()">
                  Ver Mis Turnos
                </button>
              </div>
              
              <div *ngIf="status === 'failure'" class="text-danger">
                <i class="fas fa-times-circle fa-3x mb-3"></i>
                <h3>Pago Fallido</h3>
                <p>Hubo un problema con el pago. Por favor, intenta nuevamente.</p>
                <button class="btn btn-danger" (click)="goToReservar()">
                  Intentar Nuevamente
                </button>
              </div>
              
              <div *ngIf="status === 'pending'" class="text-warning">
                <i class="fas fa-clock fa-3x mb-3"></i>
                <h3>Pago Pendiente</h3>
                <p>Tu pago está siendo procesado. Te notificaremos cuando se complete.</p>
                <button class="btn btn-warning" (click)="goToMisTurnos()">
                  Ver Mis Turnos
                </button>
              </div>
              
              <div *ngIf="!status" class="text-info">
                <i class="fas fa-spinner fa-spin fa-3x mb-3"></i>
                <h3>Procesando...</h3>
                <p>Estamos procesando tu pago...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
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
      }
    });

    // También obtener parámetros de query si los hay
    this.route.queryParams.subscribe(params => {
      console.log('Payment callback params:', params);
      // Aquí puedes procesar los parámetros adicionales de MercadoPago
    });
  }

  goToMisTurnos() {
    this.router.navigate(['/misTurnos']);
  }

  goToReservar() {
    this.router.navigate(['/reservarTurno']);
  }
}
