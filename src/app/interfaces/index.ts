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
  hasCompleteProfile?: boolean;
  needsProfileCompletion?: boolean;
  patientId?: string;
  picture?: string;
}

export interface Turno {
  id?: number | string;
  _id?: string;
  nroTurno: string | number;
  fecha: string;
  hora: string;
  estado: string;
  tratamiento: string;
  precioFinal: number | string;
  nombre?: string;
  apellido?: string;
  dni?: string;
  telefono?: string;
  duracion?: number | string;
  pacienteId?: number | string;
  tratamientoId?: number | string;
  tipoUsuario?: string;
  // Campos de pago mejorados
  paymentStatus?: string; // Estado del pago (approved, pending, rejected, refunded, cancelled)
  paymentId?: string; // ID de pago de MercadoPago
  metodoPago?: string; // Método de pago seleccionado (efectivo, online)
  fechaPago?: string | Date; // Fecha cuando se procesó el pago
  montoRecibido?: number; // Monto realmente recibido
  paymentNotificationDate?: string | Date; // Fecha de notificación del webhook
  paymentDetails?: any; // Detalles adicionales del pago
}

export interface Tratamiento {
  _id?: string;
  id?: number;
  nroTratamiento: number;
  descripcion: string;
  duracion: string;
  precio: number;
}

export interface Paciente {
  id: number;
  _id?: string;
  nombre: string;
  apellido: string;
  dni: string;
  obraSocial: string;
  telefono?: string;
  userId?: string;
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
  legajo?: string;
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

export interface Dentista {
  _id?: string;
  legajo: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono: string;
  direccion: string;
  dni: string;
  userId: string;
} 