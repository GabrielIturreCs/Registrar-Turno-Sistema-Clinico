import { Component, OnInit } from '@angular/core';
import { Tratamiento } from '../../interfaces';
import { TratamientoService } from '../../services/tratamiento.service';

@Component({
  selector: 'app-tratamiento',
  imports: [],
  templateUrl: './tratamiento.component.html',
  styleUrl: './tratamiento.component.css'
})
export class TratamientoComponent implements OnInit {
  tratamientos: Tratamiento[] = [];
  isLoading = false;
  errorMsg = '';

  constructor(private tratamientoService: TratamientoService) { }

  ngOnInit(): void {
    this.cargarTratamientos();
  }

  cargarTratamientos(): void {
    this.isLoading = true;
    this.tratamientoService.getTratamientos().subscribe({
      next: (data) => {
        this.tratamientos = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMsg = 'Error al cargar tratamientos';
        this.isLoading = false;
      }
    });
  }
}
