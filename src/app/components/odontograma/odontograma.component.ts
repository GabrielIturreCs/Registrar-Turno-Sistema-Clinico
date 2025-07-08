import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PacienteService } from '../../services/paciente.service';

@Component({
  selector: 'app-odontograma',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './odontograma.component.html',
  styleUrls: ['./odontograma.component.css']
})
export class OdontogramaComponent {
  @Input() odontograma: any;
  @Input() paciente: any;
  @Output() cerrar = new EventEmitter<void>();

  dientesFDI: string[] = [
    '18','17','16','15','14','13','12','11',
    '21','22','23','24','25','26','27','28',
    '48','47','46','45','44','43','42','41',
    '31','32','33','34','35','36','37','38'
  ];

  estados = [
    { estado: 'sano', color: '#fff', label: 'Sano' },
    { estado: 'caries', color: '#f00', label: 'Caries' },
    { estado: 'restaurado', color: '#00f', label: 'Restaurado' },
    { estado: 'extraido', color: '#888', label: 'Extraído' }
  ];

  dienteSeleccionado: string | null = null;

  constructor(private pacienteService: PacienteService) {}

  seleccionarDiente(num: string) {
    if (!this.odontograma) return;
    this.dienteSeleccionado = num;
  }

  cambiarEstadoDiente(num: string, estado: any) {
    if (!this.odontograma || !this.odontograma[num]) return;
    this.odontograma[num].estado = estado.estado;
    this.odontograma[num].color = estado.color;
    // Guardar automáticamente en la base de datos
    if (this.paciente && this.paciente._id) {
      this.pacienteService.updateOdontograma(this.paciente._id, this.odontograma).subscribe();
    }
    this.dienteSeleccionado = null;
  }

  cerrarModal() {
    this.cerrar.emit();
  }
}
