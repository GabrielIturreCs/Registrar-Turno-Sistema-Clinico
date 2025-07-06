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
    this.route.queryParams.subscribe(params => {
      this.paymentId = params['collection_id'] || params['payment_id'];
      this.paymentStatus = params['collection_status'] || params['status'];
      this.externalReference = params['external_reference'];

      if (this.paymentId && this.paymentStatus === 'approved') {
        // Llama a tu backend para validar el pago (opcional, recomendado)
        this.http.post('/api/validar-pago', {
          paymentId: this.paymentId,
          externalReference: this.externalReference
        }).subscribe({
          next: (res: any) => {
            this.message = '¡Tu pago ha sido aprobado! Redirigiendo...';
            setTimeout(() => {
              this.router.navigate(['/reservar'], { queryParams: { payment: 'success' } });
            }, 2000);
          },
          error: (err) => {
            this.error = 'No se pudo validar el pago en el servidor.';
            this.loading = false;
          }
        });
      } else if (this.paymentStatus === 'pending') {
        this.message = 'Tu pago está pendiente. Te notificaremos cuando se complete.';
        this.loading = false;
      } else if (this.paymentStatus === 'rejected' || this.paymentStatus === 'failure') {
        this.message = 'Tu pago ha sido rechazado. Por favor, intenta de nuevo.';
        this.loading = false;
      } else {
        this.message = 'No se pudo determinar el estado del pago.';
        this.loading = false;
      }
    });
  }

  volverAReservar() {
    this.router.navigate(['/reservar']);
  }
} 