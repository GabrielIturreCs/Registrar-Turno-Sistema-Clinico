import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../interfaces';
@Component({
  selector: 'app-administrador',
  imports: [CommonModule, FormsModule],
  templateUrl: './administrador.component.html',
  styleUrl: './administrador.component.css'
})
export class AdministradorComponent implements OnInit{
  currentView: string = 'admin';
  user: User | null = null;
  searchTerm: string = '';
  filterTipo: string = 'todos';

  usuarios: User[] = [
    { id: 1, nombreUsuario: 'admin', nombre: 'Administrador', apellido: 'Sistema', tipoUsuario: 'administrador', dni: '12345678', telefono: '111111111' },
    { id: 2, nombreUsuario: 'dr.garcia', nombre: 'María', apellido: 'García', tipoUsuario: 'dentista', dni: '87654321', telefono: '222222222' },
    { id: 3, nombreUsuario: 'juan.perez', nombre: 'Juan', apellido: 'Pérez', tipoUsuario: 'paciente', dni: '11223344', telefono: '333333333', obraSocial: 'OSDE' }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadUserData();
  }
  // Cargar datos del usuario desde localStorage
  loadUserData(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.user = JSON.parse(userStr);
      if (this.user?.tipoUsuario !== 'administrador') {
        this.router.navigate(['/dashboard']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  // Navegar a diferentes vistas
  navigateTo(view: string): void {
    this.router.navigate([`/${view}`]);
  }

  // Eliminar usuario
  eliminarUsuario(usuario: User): void {
    if (confirm(`¿Estás seguro de que quieres eliminar al usuario ${usuario.nombre} ${usuario.apellido}?`)) {
      this.usuarios = this.usuarios.filter(u => u.id !== usuario.id);
      alert('Usuario eliminado exitosamente');
    }
  }

  // Filtrar usuarios según búsqueda y tipo
  get filteredUsuarios(): User[] {
    let filtered = this.usuarios;

    // Filtrar por búsqueda
    if (this.searchTerm.trim() !== '') {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(usuario => 
        usuario.nombreUsuario.toLowerCase().includes(search) ||
        usuario.nombre.toLowerCase().includes(search) ||
        usuario.apellido.toLowerCase().includes(search) ||
        usuario.dni?.includes(search)
      );
    }

    // Filtrar por tipo
    if (this.filterTipo !== 'todos') {
      filtered = filtered.filter(usuario => usuario.tipoUsuario === this.filterTipo);
    }

    return filtered;
  }
  // Obtener clase CSS según el tipo de usuario
  getTipoClass(tipo: string): string {
    switch (tipo) {
      case 'administrador': return 'badge bg-danger';
      case 'dentista': return 'badge bg-primary';
      case 'paciente': return 'badge bg-success';
      default: return 'badge bg-secondary';
    }
  }
}
