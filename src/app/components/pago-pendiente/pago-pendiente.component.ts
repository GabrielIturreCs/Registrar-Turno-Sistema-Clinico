import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TurnoService } from '../../services/turno.service';

@Component({
  selector: 'app-pago-pendiente',
  templateUrl: './pago-pendiente.component.html',
  styleUrls: ['./pago-pendiente.component.css'],
  providers: [TurnoService]
})
export class PagoPendienteComponent implements OnInit {
  message: string = 'Tu pago está pendiente. Te notificaremos cuando se complete.';

  constructor(private router: Router, private turnoService: TurnoService) {}

  ngOnInit(): void {
    // Si hay info de pago pendiente en sessionStorage, actualiza el turno
    const paymentInfoStr = sessionStorage.getItem('payment_success_info');
    if (paymentInfoStr) {
      try {
        const paymentInfo = JSON.parse(paymentInfoStr);
        if (paymentInfo.externalReference) {
          this.turnoService.cambiarEstadoTurno(paymentInfo.externalReference, 'pendiente').subscribe({
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
        payment: 'pending',
        step: '5',
        returnFromPayment: 'true'
      } 
    });
  }
} 