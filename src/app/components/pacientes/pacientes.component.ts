import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Paciente, RegisterForm } from '../../interfaces';
import { PacienteService } from '../../services/paciente.service';
import { RegisterService } from '../../services/register.service';

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
  
  // Modal y formulario para nuevo paciente
  showModal: boolean = false;
  isCreating: boolean = false;
  pacienteForm = {
    // Datos de usuario (para autenticación)
    nombreUsuario: '',
    password: '',
    confirmPassword: '',
    tipoUsuario: 'paciente',
    email: '',
    // Datos del paciente
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    obraSocial: '',
    direccion: ''
  };

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
    private registerService: RegisterService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPacientes();
  }

  loadPacientes(): void {
    this.isLoading = true;
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

  navigateToTratamientos(): void {
    this.router.navigate(['/tratamiento']);
  }

  // Métodos para el modal de nuevo paciente
  openCreateModal(): void {
    this.showModal = true;
    this.resetForm();
  }

  closeModal(): void {
    this.showModal = false;
    this.resetForm();
  }

  resetForm(): void {
    this.pacienteForm = {
      nombreUsuario: '',
      password: '',
      confirmPassword: '',
      tipoUsuario: 'paciente',
      email: '',
      nombre: '',
      apellido: '',
      dni: '',
      telefono: '',
      obraSocial: '',
      direccion: ''
    };
  }

  createPaciente(): void {
    if (!this.isValidForm()) {
      alert('Por favor, completa todos los campos obligatorios');
      return;
    }

    if (this.pacienteForm.password !== this.pacienteForm.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    this.isCreating = true;

    // Preparar datos para el registro usando la estructura de RegisterForm
    const registerData: RegisterForm = {
      nombreUsuario: this.pacienteForm.nombreUsuario.trim(),
      password: this.pacienteForm.password,
      confirmPassword: this.pacienteForm.confirmPassword,
      nombre: this.pacienteForm.nombre.trim(),
      apellido: this.pacienteForm.apellido.trim(),
      telefono: this.pacienteForm.telefono.trim(),
      direccion: this.pacienteForm.direccion.trim(),
      dni: this.pacienteForm.dni.trim(),
      tipoUsuario: 'paciente',
      obraSocial: this.pacienteForm.obraSocial.trim(),
      email: this.pacienteForm.email.trim()
    };

    // Usar el RegisterService para crear el usuario completo (usuario + paciente)
    this.registerService.addUsuario(registerData).subscribe({
      next: (response) => {
        console.log('Usuario y paciente creados exitosamente:', response);
        this.isCreating = false;
        this.closeModal();
        alert('Paciente creado exitosamente. Se ha creado una cuenta de usuario para el paciente.');
        
        // Force page reload to ensure fresh data
        setTimeout(() => {
          window.location.reload();
        }, 500);
      },
      error: (error) => {
        console.error('Error al crear paciente:', error);
        this.isCreating = false;
        
        if (error.status === 400) {
          alert('Error: Verifica que el nombre de usuario no esté en uso y que todos los datos sean válidos.');
        } else {
          alert('Error al crear el paciente. Por favor, intenta nuevamente.');
        }
      }
    });
  }

  isValidForm(): boolean {
    return this.pacienteForm.nombreUsuario.trim() !== '' &&
           this.pacienteForm.password.trim() !== '' &&
           this.pacienteForm.confirmPassword.trim() !== '' &&
           this.pacienteForm.email.trim() !== '' &&
           this.pacienteForm.nombre.trim() !== '' &&
           this.pacienteForm.apellido.trim() !== '' &&
           this.pacienteForm.dni.trim() !== '' &&
           this.pacienteForm.obraSocial.trim() !== '' &&
           this.pacienteForm.password === this.pacienteForm.confirmPassword;
  }

  get canCreatePaciente(): boolean {
    return this.isValidForm() && !this.isCreating;
  }
}