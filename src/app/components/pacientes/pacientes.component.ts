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
  
  // Modal y formulario para editar paciente
  showEditModal: boolean = false;
  isUpdating: boolean = false;
  editPacienteForm: Partial<Paciente> = {};
  currentEditingPaciente: Paciente | null = null;
  
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

  getObraSocialClass(obraSocial: string): string {
    switch (obraSocial.toLowerCase()) {
      case 'osde': return 'badge bg-primary obra-social-osde fw-bold';
      case 'swiss medical': return 'badge bg-success obra-social-swiss fw-bold';
      case 'galeno': return 'badge bg-warning obra-social-galeno fw-bold';
      case 'medicus': return 'badge bg-info obra-social-medicus fw-bold';
      case 'pami': return 'badge bg-secondary obra-social-pami fw-bold';
      case 'ioma': return 'badge bg-danger obra-social-ioma fw-bold';
      case 'particular': return 'badge bg-gradient-accent obra-social-particular fw-bold';
      default: return 'badge bg-gradient-secondary obra-social-default fw-bold';
    }
  }

  editarPaciente(paciente: Paciente): void {
    this.currentEditingPaciente = paciente;
    this.editPacienteForm = {
      nombre: paciente.nombre,
      apellido: paciente.apellido,
      dni: paciente.dni,
      telefono: paciente.telefono || '',
      obraSocial: paciente.obraSocial
    };
    this.showEditModal = true;
  }

  eliminarPaciente(paciente: Paciente): void {
    if (confirm(`¿Estás seguro de que quieres eliminar a ${paciente.nombre} ${paciente.apellido}?`)) {
      // Usar _id de MongoDB o id dependiendo de lo que esté disponible
      const pacienteId = (paciente as any)._id || paciente.id;
      
      if (!pacienteId) {
        alert('Error: No se puede identificar el paciente para eliminar');
        return;
      }

      console.log('Eliminando paciente con ID:', pacienteId);
      
      this.pacienteService.deletePaciente(pacienteId.toString()).subscribe({
        next: () => {
          console.log('Paciente eliminado exitosamente');
          alert('Paciente eliminado exitosamente');
          this.loadPacientes(); // Recargar la lista
        },
        error: (error) => {
          console.error('Error al eliminar paciente:', error);
          alert('Error al eliminar el paciente. Por favor, intenta nuevamente.');
        }
      });
    }
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

  // Métodos para el modal de editar paciente
  closeEditModal(): void {
    this.showEditModal = false;
    this.editPacienteForm = {};
    this.currentEditingPaciente = null;
  }

  updatePaciente(): void {
    if (!this.isValidEditForm()) {
      alert('Por favor, completa todos los campos obligatorios');
      return;
    }

    if (!this.currentEditingPaciente) {
      alert('Error: No hay paciente seleccionado para editar');
      return;
    }

    this.isUpdating = true;

    // Usar _id de MongoDB o id dependiendo de lo que esté disponible
    const pacienteId = (this.currentEditingPaciente as any)._id || this.currentEditingPaciente.id;

    // Crear el objeto con los datos actualizados
    const updatedPaciente: Paciente = {
      ...this.currentEditingPaciente,
      ...this.editPacienteForm
    };

    this.pacienteService.updatePaciente(pacienteId.toString(), updatedPaciente).subscribe({
      next: (response) => {
        console.log('Paciente actualizado exitosamente:', response);
        this.isUpdating = false;
        this.closeEditModal();
        alert('Paciente actualizado exitosamente');
        this.loadPacientes(); // Recargar la lista
      },
      error: (error) => {
        console.error('Error al actualizar paciente:', error);
        this.isUpdating = false;
        alert('Error al actualizar el paciente. Por favor, intenta nuevamente.');
      }
    });
  }

  isValidEditForm(): boolean {
    return (this.editPacienteForm.nombre?.trim() !== '' &&
           this.editPacienteForm.apellido?.trim() !== '' &&
           this.editPacienteForm.dni?.trim() !== '' &&
           this.editPacienteForm.obraSocial?.trim() !== '') || false;
  }

  get canUpdatePaciente(): boolean {
    return this.isValidEditForm() && !this.isUpdating;
  }

  // Método para volver al dashboard
  volverAlDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}