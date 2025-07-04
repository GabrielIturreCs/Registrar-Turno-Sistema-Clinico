import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CookiePaymentService } from '../../services/cookie-payment.service';
import { NotificationService } from '../../services/notification.service';

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
                
                <!-- Loading -->
                <div *ngIf="loading" class="loading-content">
                  <div class="spinner-border text-primary mb-4" role="status">
                    <span class="visually-hidden">Cargando...</span>
                  </div>
                  <h3 class="text-muted mb-3">Procesando pago...</h3>
                  <p class="text-muted">Por favor espera mientras verificamos tu pago.</p>
                </div>

                <!-- Success -->
                <div *ngIf="!loading && status === 'success'" class="success-content">
                  <div class="icon-success mb-4">
                    <i class="fas fa-check-circle fa-4x text-success"></i>
                  </div>
                  <h3 class="text-success mb-3">¡Pago Exitoso!</h3>
                  <p class="text-muted mb-4">
                    Tu pago ha sido procesado correctamente. 
                    El turno ha sido confirmado y está listo.
                  </p>
                  <button class="btn btn-success" (click)="redirectToUserDashboard()">
                    <i class="fas fa-check me-2"></i>
                    Ver Turno Confirmado
                  </button>
                </div>

                <!-- Pending -->
                <div *ngIf="!loading && status === 'pending'" class="pending-content">
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
                <div *ngIf="!loading && status === 'failure'" class="failure-content">
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
  loading: boolean = true;
  userType: string = 'paciente';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cookiePaymentService: CookiePaymentService,
    private notificationService: NotificationService
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

    // Obtener parámetros de la URL
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['return'] || '/';
      this.userType = params['userType'] || 'paciente';
      
      // Verificar estado del pago desde cookies
      this.checkPaymentStatusFromCookies();
    });
  }

  checkPaymentStatusFromCookies(): void {
    this.cookiePaymentService.checkPaymentStatus().subscribe({
      next: (response) => {
        if (response.success && response.paymentStatus) {
          console.log('✅ Estado de pago desde cookies:', response.paymentStatus);
          
          // Actualizar el estado según la cookie
          this.status = response.paymentStatus.status as any;
          this.userType = response.paymentStatus.userType;
          
          // Limpiar datos locales obsoletos
          this.cookiePaymentService.clearLocalPaymentData();
          
          // Mostrar notificación apropiada
          this.showPaymentNotification();
          
        } else {
          console.log('ℹ️ No se encontró estado de pago en cookies');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al verificar estado de pago:', error);
        this.loading = false;
      }
    });
  }

  showPaymentNotification(): void {
    switch (this.status) {
      case 'success':
        localStorage.setItem('pago_exitoso', 'true');
        this.notificationService.showSuccess(
          '¡Pago exitoso! Tu turno ha sido confirmado.'
        );
        break;
      case 'pending':
        this.notificationService.showInfo(
          'Tu pago está siendo procesado. Te notificaremos cuando se confirme.'
        );
        break;
      case 'failure':
        this.notificationService.showError(
          'Ha ocurrido un error al procesar tu pago. Por favor, intenta nuevamente.'
        );
        break;
    }
  }

  redirectToUserDashboard(): void {
    // Limpiar cualquier dato local residual
    this.cookiePaymentService.clearLocalPaymentData();
    
    // Redirigir según el tipo de usuario
    const dashboardRoute = this.cookiePaymentService.getDashboardRoute(this.userType);
    
    if (this.status === 'success') {
      // Para pagos exitosos, redirigir al wizard paso 5
      this.router.navigate(['/reservarTurno'], { 
        queryParams: { 
          step: '5',
          paymentSuccess: 'true'
        }
      });
    } else {
      // Para otros casos, redirigir al dashboard correspondiente
      this.router.navigate([dashboardRoute]);
    }
  }

  retryPayment(): void {
    // Limpiar datos locales
    this.cookiePaymentService.clearLocalPaymentData();
    
    // Volver al wizard de reserva
    this.router.navigate(['/reservarTurno']);
  }
}
