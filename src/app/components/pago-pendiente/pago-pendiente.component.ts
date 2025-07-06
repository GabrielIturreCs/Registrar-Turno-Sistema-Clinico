import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pago-pendiente',
  templateUrl: './pago-pendiente.component.html',
  styleUrls: ['./pago-pendiente.component.css']
})
export class PagoPendienteComponent implements OnInit {
  message: string = 'Tu pago está pendiente. Te notificaremos cuando se complete.';

  constructor(private router: Router) {}

  ngOnInit(): void {}

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