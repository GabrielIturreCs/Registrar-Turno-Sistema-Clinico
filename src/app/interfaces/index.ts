// Interfaces compartidas para toda la aplicación

export interface User {
  id: string;
  nombreUsuario: string;
  nombre: string;
  apellido: string;
  tipoUsuario: string;
  dni?: string;
  telefono?: string;
  direccion?: string;
  obraSocial?: string;
  email?: string;
}

export interface Turno {
  id: number;
  nroTurno: string;
  fecha: string;
  hora: string;
  estado: string;
  tratamiento: string;
  precioFinal: number;
  nombre?: string;
  apellido?: string;
  dni?: string;
  telefono?: string;
  duracion?: number;
  pacienteId?: number;
  tratamientoId?: number;
  tipoUsuario?: string;
}

export interface Tratamiento {
  id?: number;
  nroTratamiento: number;
  descripcion: string;
  duracion: string;
  historial: string;
  precio?: number;
}

export interface Paciente {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  obraSocial: string;
  telefono?: string;
}

export interface LoginForm {
  nombreUsuario: string;
  password: string;
  email: string;
}

export interface RegisterForm {
  nombreUsuario: string;
  password: string;
  confirmPassword: string;
  nombre: string;
  apellido: string;
  telefono: string;
  direccion: string;
  dni: string;
  tipoUsuario: string;
  obraSocial: string;
  email: string;
}

export interface TurnoForm {
  pacienteId: string;
  fecha: string;
  hora: string;
  tratamientoId: string;
}

export interface Estadisticas {
  total: number;
  reservados: number;
  completados: number;
  cancelados: number;
  ingresos: number;
}

// Tipos de estado de turno
export type EstadoTurno = 'reservado' | 'completado' | 'cancelado';

// Tipos de usuario
export type TipoUsuario = 'administrador' | 'dentista' | 'paciente';

// Tipos de alerta
export type TipoAlerta = 'success' | 'danger' | 'warning' | 'info'; 