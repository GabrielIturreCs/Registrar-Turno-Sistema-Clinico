import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pago-fallido',
  templateUrl: './pago-fallido.component.html',
  styleUrls: ['./pago-fallido.component.css']
})
export class PagoFallidoComponent implements OnInit {
  message: string = 'Tu pago ha sido rechazado. Por favor, intenta de nuevo.';

  constructor(private router: Router) {}

  ngOnInit(): void {}

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