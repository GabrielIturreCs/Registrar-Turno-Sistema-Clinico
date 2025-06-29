import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Paciente } from '../../interfaces';
import { PacienteService } from '../../services/paciente.service';

@Component({
  selector: 'app-pacientes',
  imports: [CommonModule, FormsModule],
  templateUrl: './pacientes.component.html',
  styleUrl: './pacientes.component.css'
})
export class PacientesComponent implements OnInit {
  pacientes: Paciente[] = [];
  pacientesFiltrados: Paciente[] = [];
  isLoading: boolean = false;
  searchTerm: string = '';
  selectedPaciente: Paciente | null = null;

  // Datos de prueba para desarrollo
  testData = {
    pacientes: [
      { id: 1, nombre: 'Juan', apellido: 'Pérez', dni: '12345678', obraSocial: 'OSDE', telefono: '123456789' },
      { id: 2, nombre: 'María', apellido: 'García', dni: '87654321', obraSocial: 'Swiss Medical', telefono: '987654321' },
      { id: 3, nombre: 'Carlos', apellido: 'López', dni: '11223344', obraSocial: 'Galeno', telefono: '555666777' },
      { id: 4, nombre: 'Ana', apellido: 'Martínez', dni: '55667788', obraSocial: 'OSDE', telefono: '111222333' },
      { id: 5, nombre: 'Luis', apellido: 'Rodríguez', dni: '99887766', obraSocial: 'Swiss Medical', telefono: '444555666' }
    ]
  };

  constructor(
    private pacienteService: PacienteService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPacientes();
  }

  loadPacientes(): void {
    this.isLoading = true;
    
    // Usar datos de prueba por ahora
    setTimeout(() => {
      this.pacientes = this.testData.pacientes;
      this.pacientesFiltrados = this.pacientes;
      this.isLoading = false;
    }, 500);

    // Cuando el backend esté listo, usar esto:
    /*
    this.pacienteService.getPacientes().subscribe(
      (pacientes) => {
        this.pacientes = pacientes;
        this.pacientesFiltrados = pacientes;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error cargando pacientes:', error);
        this.isLoading = false;
      }
    );
    */
  }

  filterPacientes(): void {
    if (!this.searchTerm.trim()) {
      this.pacientesFiltrados = this.pacientes;
    } else {
      const term = this.searchTerm.toLowerCase();
      this.pacientesFiltrados = this.pacientes.filter(paciente =>
        paciente.nombre.toLowerCase().includes(term) ||
        paciente.apellido.toLowerCase().includes(term) ||
        paciente.dni.includes(term) ||
        paciente.obraSocial.toLowerCase().includes(term)
      );
    }
  }

  verDashboardPaciente(paciente: Paciente): void {
    // Guardar el paciente seleccionado en localStorage para que el dashboard lo use
    localStorage.setItem('selectedPaciente', JSON.stringify(paciente));
    this.router.navigate(['/dashboard'], { queryParams: { pacienteId: paciente.id } });
  }

  editarPaciente(paciente: Paciente): void {
    // Implementar edición de paciente
    console.log('Editar paciente:', paciente);
    // this.router.navigate(['/editar-paciente', paciente.id]);
  }

  eliminarPaciente(paciente: Paciente): void {
    if (confirm(`¿Estás seguro de que quieres eliminar a ${paciente.nombre} ${paciente.apellido}?`)) {
      // Implementar eliminación de paciente
      console.log('Eliminar paciente:', paciente);
      // this.pacienteService.deletePaciente(paciente.id.toString()).subscribe(...)
    }
  }

  getObraSocialClass(obraSocial: string): string {
    switch (obraSocial.toLowerCase()) {
      case 'osde': return 'badge bg-primary';
      case 'swiss medical': return 'badge bg-success';
      case 'galeno': return 'badge bg-warning';
      default: return 'badge bg-secondary';
    }
  }
}