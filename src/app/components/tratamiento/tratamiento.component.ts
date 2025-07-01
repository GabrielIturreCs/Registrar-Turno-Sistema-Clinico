import { Component, OnInit } from '@angular/core';
import { TratamientoService } from '../../services/tratamiento.service';
import { Tratamiento } from '../../interfaces';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tratamiento',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tratamiento.component.html',
  styleUrls: ['./tratamiento.component.css']
})
export class TratamientoComponent implements OnInit {
  tratamientos: Tratamiento[] = [];
  formulario: FormGroup;
  editando: boolean = false;
  nroEditando: number | null = null;
  showModal: boolean = false;
  showDeleteModal: boolean = false;
  tratamientoAEliminar: number | null = null;

  // NUEVO: Variables para búsqueda, loading y filtrado
  searchText: string = '';
  filteredTratamientos: Tratamiento[] = [];
  loading: boolean = false;
  historialTratamientos: { nroTratamiento: number, accion: string, fecha: Date, descripcion: string }[] = [];

  constructor(private tratamientoService: TratamientoService, private fb: FormBuilder) {
    this.formulario = this.fb.group({
      nroTratamiento: ['', Validators.required],
      descripcion: ['', Validators.required],
      duracion: ['', Validators.required],
      historial: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.cargarTratamientos();
    // Simulación de historial (puedes reemplazarlo con datos reales si tienes endpoint)
    this.historialTratamientos = [];
  }

  cargarTratamientos() {
    this.loading = true;
    this.tratamientoService.getTratamientos().subscribe(data => {
      this.tratamientos = data;
      this.filterTratamientos();
      this.loading = false;
      // El historial solo se llena al crear/editar/eliminar, no aquí
      // this.historialTratamientos = data.map(t => ({ ... })); // ELIMINADO
    }, () => {
      this.loading = false;
    });
  }

  // NUEVO: Función de filtrado
  filterTratamientos() {
    const text = this.searchText ? this.searchText.toLowerCase() : '';
    this.filteredTratamientos = this.tratamientos.filter(t =>
      t.descripcion.toLowerCase().includes(text) ||
      t.duracion.toLowerCase().includes(text) ||
      t.historial.toLowerCase().includes(text) ||
      ('' + t.nroTratamiento).includes(text)
    );
  }

  guardar() {
    if (this.formulario.invalid) return;
    if (this.editando && this.nroEditando !== null) {
      // Buscar el tratamiento por nroTratamiento
      const t = this.tratamientos.find(x => x.nroTratamiento === this.nroEditando);
      if (t && (t as any)._id) {
        this.tratamientoService.actualizarTratamiento((t as any)._id, this.formulario.value).subscribe(() => {
          this.cargarTratamientos();
          this.historialTratamientos.unshift({
            nroTratamiento: this.formulario.value.nroTratamiento,
            accion: 'Editado',
            fecha: new Date(),
            descripcion: this.formulario.value.descripcion
          });
          this.cancelar();
        });
      }
    } else {
      this.tratamientoService.crearTratamiento(this.formulario.value).subscribe(() => {
        this.cargarTratamientos();
        this.historialTratamientos.unshift({
          nroTratamiento: this.formulario.value.nroTratamiento,
          accion: 'Creado',
          fecha: new Date(),
          descripcion: this.formulario.value.descripcion
        });
        this.cancelar();
      });
    }
  }

  editarPorNro(nro: number) {
    const t = this.tratamientos.find(x => x.nroTratamiento === nro);
    if (t) {
      this.editando = true;
      this.nroEditando = nro;
      this.formulario.patchValue({
        nroTratamiento: t.nroTratamiento,
        descripcion: t.descripcion,
        duracion: t.duracion,
        historial: t.historial
      });
    }
  }

  eliminarPorNro(nro: number) {
    const t = this.tratamientos.find(x => x.nroTratamiento === nro);
    if (t && (t as any)._id && confirm('¿Eliminar tratamiento?')) {
      this.tratamientoService.eliminarTratamiento((t as any)._id).subscribe(() => {
        this.cargarTratamientos();
        this.historialTratamientos.unshift({
          nroTratamiento: t.nroTratamiento,
          accion: 'Eliminado',
          fecha: new Date(),
          descripcion: t.descripcion
        });
      });
    }
  }

  cancelar() {
    this.editando = false;
    this.nroEditando = null;
    this.formulario.reset();
  }
}
