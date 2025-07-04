import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="payment-callback-container">
      <div class="container py-5">
        <div class="row justify-content-center">
          <div class="col-md-6">
            <div class="card shadow">
              <div class="card-body text-center py-5">
                
                <!-- Success -->
                <div *ngIf="status === 'success'" class="success-content">
                  <div class="icon-success mb-4">
                    <i class="fas fa-check-circle fa-4x text-success"></i>
                  </div>
                  <h3 class="text-success mb-3">¡Pago Exitoso!</h3>
                  <p class="text-muted mb-4">
                    Tu pago ha sido procesado correctamente. 
                    El turno ha sido confirmado.
                  </p>
                  <button class="btn btn-success" (click)="redirectToUserDashboard()">
                    <i class="fas fa-arrow-right me-2"></i>
                    Continuar
                  </button>
                </div>

                <!-- Pending -->
                <div *ngIf="status === 'pending'" class="pending-content">
                  <div class="icon-pending mb-4">
                    <i class="fas fa-clock fa-4x text-warning"></i>
                  </div>
                  <h3 class="text-warning mb-3">Pago Pendiente</h3>
                  <p class="text-muted mb-4">
                    Tu pago está siendo procesado. 
                    Te notificaremos cuando se confirme.
                  </p>
                  <button class="btn btn-warning" (click)="redirectToUserDashboard()">
                    <i class="fas fa-arrow-right me-2"></i>
                    Continuar
                  </button>
                </div>

                <!-- Failure -->
                <div *ngIf="status === 'failure'" class="failure-content">
                  <div class="icon-failure mb-4">
                    <i class="fas fa-times-circle fa-4x text-danger"></i>
                  </div>
                  <h3 class="text-danger mb-3">Error en el Pago</h3>
                  <p class="text-muted mb-4">
                    Ha ocurrido un error al procesar tu pago. 
                    Por favor, intenta nuevamente.
                  </p>
                  <div class="d-flex gap-2 justify-content-center">
                    <button class="btn btn-outline-secondary" (click)="redirectToUserDashboard()">
                      <i class="fas fa-home me-2"></i>
                      Volver al inicio
                    </button>
                    <button class="btn btn-primary" (click)="retryPayment()">
                      <i class="fas fa-redo me-2"></i>
                      Intentar de nuevo
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payment-callback-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
    }
    
    .icon-success, .icon-pending, .icon-failure {
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    
    .card {
      border: none;
      border-radius: 15px;
    }
  `]
})
export class PaymentCallbackComponent implements OnInit {
  status: 'success' | 'pending' | 'failure' = 'success';
  returnUrl: string = '/';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtener el status de la URL
    const urlPath = this.router.url;
    if (urlPath.includes('/payment/success')) {
      this.status = 'success';
    } else if (urlPath.includes('/payment/pending')) {
      this.status = 'pending';
    } else if (urlPath.includes('/payment/failure')) {
      this.status = 'failure';
    }

    // Obtener la URL de retorno
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['return'] || '/';
    });
  }

  redirectToUserDashboard(): void {
    // Redirigir según el parámetro return
    if (this.returnUrl === 'vistaPaciente') {
      this.router.navigate(['/vistaPaciente']);
    } else if (this.returnUrl === 'dashboard') {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/']);
    }
  }

  retryPayment(): void {
    // Volver a la página de reservar turno
    this.router.navigate(['/reservarTurno']);
  }
}
