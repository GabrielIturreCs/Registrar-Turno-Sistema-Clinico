import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TurnoService } from '../../services/turno.service';

@Component({
  selector: 'app-pago-fallido',
  templateUrl: './pago-fallido.component.html',
  styleUrls: ['./pago-fallido.component.css'],
  providers: [TurnoService]
})
export class PagoFallidoComponent implements OnInit {
  message: string = 'Tu pago ha sido rechazado. Por favor, intenta de nuevo.';

  constructor(private router: Router, private turnoService: TurnoService) {}

  ngOnInit(): void {
    // Si hay info de pago fallido en sessionStorage, actualiza el turno
    const paymentInfoStr = sessionStorage.getItem('payment_success_info');
    if (paymentInfoStr) {
      try {
        const paymentInfo = JSON.parse(paymentInfoStr);
        if (paymentInfo.externalReference) {
          this.turnoService.cambiarEstadoTurno(paymentInfo.externalReference, 'cancelado').subscribe({
            next: () => this.turnoService.refreshTurnos(),
            error: (err: any) => console.error('Error actualizando turno:', err)
          });
        }
      } catch (e) { console.error('Error leyendo payment_success_info:', e); }
    }
  }

  volverAReservar() {
    this.router.navigate(['/reservarTurno'], { 
      queryParams: { 
        payment: 'failure',
        step: '5',
        returnFromPayment: 'true'
      } 
    });
  }
} 