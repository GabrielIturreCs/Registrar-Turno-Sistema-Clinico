import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  imports: [FormsModule, CommonModule],
  templateUrl: './administrador.component.html',
  styleUrls: ['./administrador.component.css']
})
export class AdminComponent {
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

  constructor(private router: Router) {}

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