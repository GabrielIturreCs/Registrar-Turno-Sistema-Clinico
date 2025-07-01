import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PacienteService } from '../../services/paciente.service';
import { DentistaService } from '../../services/dentista.service';
import { RegisterService } from '../../services/register.service';

@Component({
  selector: 'app-admin',
  imports: [FormsModule, CommonModule],
  templateUrl: './administrador.component.html',
  styleUrls: ['./administrador.component.css']
})
export class AdminComponent implements OnInit {
  currentView = 'admin';
  user = { tipoUsuario: 'administrador' };
  searchTerm = '';
  filterTipo = 'todos';
  usuarios = [
    { nombre: 'Juan', apellido: 'Pérez', tipoUsuario: 'paciente', nombreUsuario: 'jperez', dni: '12345678', telefono: '123-456-7890' },
    { nombre: 'María', apellido: 'González', tipoUsuario: 'dentista', nombreUsuario: 'mgonzalez', dni: '87654321', telefono: '987-654-3210' }
  ];
  usuarioAEliminar: any;
  showDeleteModal = false;
  showAddUserModal = false;
  toastMessage = '';
  newUser = { nombre: '', apellido: '', tipoUsuario: 'paciente', nombreUsuario: '', dni: '', telefono: '' };

  constructor(
    private router: Router,
    private pacienteService: PacienteService,
    private dentistaService: DentistaService,
    private registerService: RegisterService
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.usuarios = [];
    this.pacienteService.getPacientes().subscribe(pacientes => {
      const pacientesMapped = pacientes.map((p: any) => ({
        ...p,
        tipoUsuario: 'paciente',
        nombreUsuario: (p as any).nombreUsuario || (p as any).email || '',
        telefono: p.telefono || ''
      }));
      this.usuarios = [...this.usuarios, ...pacientesMapped];
    });
    this.dentistaService.getDentistas().subscribe((dentistas: any[]) => {
      const dentistasMapped = dentistas.map((d: any) => ({
        ...d,
        tipoUsuario: 'dentista',
        nombreUsuario: d.nombreUsuario || d.email || '',
        telefono: d.telefono || ''
      }));
      this.usuarios = [...this.usuarios, ...dentistasMapped];
    });
    this.registerService.getUsuarios().subscribe((admins: any[]) => {
      const adminsMapped = admins.map((a: any) => ({
        ...a,
        tipoUsuario: 'administrador',
        nombreUsuario: a.nombreUsuario || a.email || '',
        telefono: a.telefono || ''
      }));
      this.usuarios = [...this.usuarios, ...adminsMapped];
    });
  }

  getUserCardClass(tipoUsuario: string) {
    return `user-card ${tipoUsuario}`;
  }

  getUserBorderClass(tipoUsuario: string) {
    return `border-${tipoUsuario === 'administrador' ? 'danger' : tipoUsuario === 'dentista' ? 'primary' : 'warning'}`;
  }

  getTipoClass(tipoUsuario: string) {
    return `badge-${tipoUsuario}`;
  }

  openDeleteModal(usuario: any) {
    this.usuarioAEliminar = usuario;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.usuarioAEliminar = null;
  }

  confirmarEliminarUsuario() {
    this.usuarios = this.usuarios.filter(u => u !== this.usuarioAEliminar);
    this.toastMessage = 'Usuario eliminado con éxito';
    this.closeDeleteModal();
    setTimeout(() => this.toastMessage = '', 3000);
    this.cargarUsuarios();
  }

  openAddUserModal() {
    this.newUser = { nombre: '', apellido: '', tipoUsuario: 'paciente', nombreUsuario: '', dni: '', telefono: '' };
    this.showAddUserModal = true;
  }

  closeAddUserModal() {
    this.showAddUserModal = false;
  }

  addUser() {
    this.usuarios.push({ ...this.newUser });
    this.toastMessage = 'Usuario agregado con éxito';
    this.closeAddUserModal();
    setTimeout(() => this.toastMessage = '', 3000);
    this.cargarUsuarios();
  }

  navigateTo(view: string) {
    this.router.navigate([view]);
  }

  get filteredUsuarios() {
    return this.usuarios.filter(usuario =>
      (usuario.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
       usuario.apellido.toLowerCase().includes(this.searchTerm.toLowerCase())) &&
      (this.filterTipo === 'todos' || usuario.tipoUsuario === this.filterTipo)
    ).filter(usuario => usuario.tipoUsuario === 'paciente' || usuario.tipoUsuario === 'dentista');
  }
}