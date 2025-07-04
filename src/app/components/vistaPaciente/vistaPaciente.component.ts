import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { User, Turno, Tratamiento, Paciente } from '../../interfaces';
import { ChatbotService } from '../../services/ChatBot.service';
import { ChatMessage, QuickQuestion } from '../../interfaces/chatbot.interface';
import { TurnoService } from '../../services/turno.service';
import { TratamientoService } from '../../services/tratamiento.service';
import { PacienteService } from '../../services/paciente.service';
import { DataRefreshService } from '../../services/data-refresh.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { NotificationService } from '../../services/notification.service';

interface PacienteStats {
  totalTurnos: number;
  turnosReservados: number;
  turnosCompletados: number;
  turnosCancelados: number;
  totalGastado: number;
  proximoTurno: Turno | null;
}

@Component({
  selector: 'app-vistaPaciente',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './vistaPaciente.component.html',
  styleUrls: ['./vistaPaciente.component.css']
})
export class VistaPacienteComponent implements OnInit, OnDestroy {
  user: User | null = null;
  paciente: Paciente | null = null;
  misTurnos: Turno[] = [];
  tratamientos: Tratamiento[] = [];
  isLoading = false;
  private routerSubscription!: Subscription;
  private refreshSubscription!: Subscription;

  // Estadísticas del paciente
  pacienteStats: PacienteStats = {
    totalTurnos: 0,
    turnosReservados: 0,
    turnosCompletados: 0,
    turnosCancelados: 0,
    totalGastado: 0,
    proximoTurno: null
  };

  // Chatbot properties
  @ViewChild('chatMessages') chatMessages!: ElementRef;
  chatOpen = false;
  messages: ChatMessage[] = [];
  chatForm: FormGroup;
  isTyping = false;
  quickQuestions: QuickQuestion[] = [
    { text: '¿Cuáles son los horarios?', action: 'horarios' },
    { text: '¿Cómo reservo un turno?', action: 'reservar' },
    { text: '¿Cómo cancelo un turno?', action: 'cancelar' },
    { text: '¿Qué tratamientos ofrecen?', action: 'tratamientos' }
  ];

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private chatbotService: ChatbotService,
    private turnoService: TurnoService,
    private tratamientoService: TratamientoService,
    private pacienteService: PacienteService,
    private dataRefreshService: DataRefreshService,
    private notificationService: NotificationService
  ) {
    this.chatForm = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit(): void {
    this.loadUserData();
    
    // Suscribirse al servicio de refresh
    this.refreshSubscription = this.dataRefreshService.refresh$.subscribe((component) => {
      if (component === 'vistaPaciente' || component === 'all') {
        console.log('Recibida notificación de refresh para vistaPaciente');
        this.refreshData();
      }
    });
    
    // Escuchar cambios de navegación para recargar datos
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (event.url === '/vistaPaciente') {
          console.log('Navegando a vista paciente, recargando datos...');
          setTimeout(() => this.refreshData(), 100); // Pequeño delay para asegurar que el componente esté listo
        }
      });

    // También escuchar cuando la ventana recibe foco (útil cuando regresa de otra pestaña)
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        if (this.router.url === '/vistaPaciente') {
          console.log('Ventana recibió foco, recargando datos...');
          this.refreshData();
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  refreshData(): void {
    console.log('Refrescando datos del paciente...');
    this.isLoading = true;
    this.loadPacienteData();
    // loadPacienteData ya llama a loadMisTurnos(), así que no lo duplicamos
    this.loadTratamientos();
    
    // Mostrar un mensaje temporal de actualización
    setTimeout(() => {
      if (!this.isLoading) {
        console.log('Datos actualizados correctamente');
      }
    }, 1000);
  }

  loadUserData(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userData = localStorage.getItem('user');
      if (userData) {
        this.user = JSON.parse(userData);
        console.log('Usuario paciente logueado:', this.user);
        
        // Verificar que sea realmente un paciente
        if (this.user?.tipoUsuario !== 'paciente') {
          console.warn('Usuario no es paciente, redirigiendo...');
          this.router.navigate(['/dashboard']);
          return;
        }
        
        // Cargar información del paciente y luego los turnos
        this.loadPacienteData();
      } else {
        this.router.navigate(['/login']);
      }
    }
  }

  loadPacienteData(): void {
    if (!this.user?.id) {
      console.error('No se encontró ID de usuario');
      return;
    }

    this.isLoading = true;
    
    // Obtener todos los pacientes y buscar el que corresponde al usuario logueado
    this.pacienteService.getPacientes().subscribe({
      next: (pacientes) => {
        console.log('Pacientes obtenidos:', pacientes);
        
        // Buscar el paciente que tiene el userId igual al id del usuario logueado
        this.paciente = pacientes.find((p: any) => p.userId === this.user?.id?.toString()) || null;
        
        if (this.paciente) {
          console.log('Paciente encontrado:', this.paciente);
          // Una vez que tenemos el paciente, cargar sus turnos y tratamientos
          this.loadMisTurnos();
          this.loadTratamientos();
          this.addWelcomeMessage(); // Agregar mensaje después de cargar datos
        } else {
          console.error('No se encontró un paciente asociado al usuario logueado');
          // Intentar buscar por nombre y apellido como respaldo
          this.paciente = pacientes.find((p: any) => 
            p.nombre?.toLowerCase().trim() === this.user?.nombre?.toLowerCase().trim() &&
            p.apellido?.toLowerCase().trim() === this.user?.apellido?.toLowerCase().trim()
          ) || null;
          
          if (this.paciente) {
            console.log('Paciente encontrado por nombre/apellido:', this.paciente);
            this.loadMisTurnos();
            this.loadTratamientos();
            this.addWelcomeMessage(); // Agregar mensaje después de cargar datos
          } else {
            console.error('No se pudo encontrar información del paciente');
            this.addWelcomeMessage(); // Agregar mensaje genérico si no se encuentra paciente
            this.isLoading = false;
          }
        }
      },
      error: (error) => {
        console.error('Error al cargar datos del paciente:', error);
        this.isLoading = false;
      }
    });
  }

  loadMisTurnos(): void {
    if (!this.paciente) {
      console.error('No hay datos del paciente para cargar turnos');
      this.isLoading = false;
      return;
    }
    
    console.log('Cargando turnos para paciente:', this.paciente);
    
    // Forzar recarga desde backend para obtener el estado actualizado
    this.turnoService.getTurnosFromAPI().subscribe({
      next: (turnos) => {
        console.log('Todos los turnos obtenidos:', turnos.length);
        console.log('Paciente actual ID:', this.paciente?.id || this.paciente?._id);
        
        // Filtrar turnos usando el ID del paciente obtenido
        const pacienteId = this.paciente?.id?.toString() || this.paciente?._id?.toString();
        
        this.misTurnos = turnos.filter(turno => {
          // Verificar por pacienteId
          if (pacienteId && turno.pacienteId) {
            const idMatch = turno.pacienteId.toString() === pacienteId;
            if (idMatch) {
              console.log('Turno encontrado por pacienteId:', turno);
              return true;
            }
          }
          
          // Verificar por nombre y apellido como respaldo
          if (this.paciente?.nombre && this.paciente?.apellido && turno.nombre && turno.apellido) {
            const nombreMatch = turno.nombre.toLowerCase().trim() === this.paciente.nombre.toLowerCase().trim();
            const apellidoMatch = turno.apellido.toLowerCase().trim() === this.paciente.apellido.toLowerCase().trim();
            
            if (nombreMatch && apellidoMatch) {
              console.log('Turno encontrado por nombre/apellido:', turno);
              return true;
            }
          }
          
          return false;
        });
        
        console.log(`Turnos filtrados para ${this.paciente?.nombre} ${this.paciente?.apellido}:`, this.misTurnos.length);
        console.log('Mis turnos finales:', this.misTurnos);
        
        if (this.misTurnos.length > 0) {
          console.log('Primer turno:', this.misTurnos[0]);
          console.log('Campos disponibles:', Object.keys(this.misTurnos[0]));
        } else {
          console.log('No se encontraron turnos para este paciente');
        }
        
        this.calculateStats();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar turnos:', error);
        this.isLoading = false;
      }
    });
  }

  loadTratamientos(): void {
    this.turnoService.getTratamientos().subscribe({
      next: (tratamientos) => {
        this.tratamientos = tratamientos;
      },
      error: (error) => {
        console.error('Error al cargar tratamientos:', error);
      }
    });
  }

  calculateStats(): void {
    this.pacienteStats.totalTurnos = this.misTurnos.length;
    this.pacienteStats.turnosReservados = this.misTurnos.filter(t => t.estado === 'reservado').length;
    this.pacienteStats.turnosCompletados = this.misTurnos.filter(t => t.estado === 'completado').length;
    this.pacienteStats.turnosCancelados = this.misTurnos.filter(t => t.estado === 'cancelado').length;
    
    // Calcular total gastado
    this.pacienteStats.totalGastado = this.misTurnos
      .filter(t => t.estado === 'completado')
      .reduce((total, turno) => total + Number(turno.precioFinal || 0), 0);
    
    // Encontrar próximo turno
    const turnosReservados = this.misTurnos
      .filter(t => t.estado === 'reservado')
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    
    this.pacienteStats.proximoTurno = turnosReservados.length > 0 ? turnosReservados[0] : null;
  }

  // Navegación
  navigateToReservar(): void {
    this.router.navigate(['/reservarTurno']);
  }

  navigateToMisTurnos(): void {
    this.router.navigate(['/misTurnos']);
  }

  // Acciones de turnos
  cancelarTurno(turno: Turno): void {
    this.notificationService.showWarning('¿Estás seguro de que quieres cancelar este turno?');
    // Aquí podrías implementar una confirmación personalizada si tienes un sistema propio,
    // pero como NotificationService solo muestra mensajes, procederemos directamente:
    const turnoId = turno._id || turno.id?.toString() || '';
    if (turnoId) {
      this.turnoService.cambiarEstadoTurno(turnoId, 'cancelado').subscribe({
        next: () => {
          this.loadMisTurnos();
          this.notificationService.showSuccess('Turno cancelado exitosamente');
        },
        error: () => this.notificationService.showError('Error al cancelar el turno')
      });
    }
  }

  getStatusClass(estado: string): string {
    switch (estado) {
      case 'reservado': return 'badge bg-info text-white';
      case 'completado': return 'badge bg-success';
      case 'cancelado': return 'badge bg-danger';
      case 'pendiente': return 'badge bg-secondary';
      case 'pendiente_pago': return 'badge bg-secondary text-white';
      default: return 'badge bg-secondary';
    }
  }

  getStatusText(estado: string): string {
    switch (estado) {
      case 'reservado': return 'Reservado';
      case 'completado': return 'Completado';
      case 'cancelado': return 'Cancelado';
      case 'pendiente': return 'Pendiente';
      case 'pendiente_pago': return 'Pendiente de Pago';
      default: return 'Sin estado';
    }
  }

  // Chatbot methods
  addWelcomeMessage(): void {
    const nombrePaciente = this.paciente?.nombre || this.user?.nombre || 'Paciente';
    const welcomeMessage: ChatMessage = {
      text: `¡Hola ${nombrePaciente}! ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre turnos, tratamientos o horarios.`,
      isUser: false,
      timestamp: new Date()
    };
    this.messages.push(welcomeMessage);
  }

  toggleChat(): void {
    this.chatOpen = !this.chatOpen;
    if (this.chatOpen) {
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
    }
  }

  onSubmit(): void {
    if (this.chatForm.valid && !this.isTyping) {
      const messageText = this.chatForm.get('message')?.value.trim();
      if (messageText) {
        this.handleHybridChat(messageText);
        this.chatForm.reset();
      }
    }
  }

  handleQuickQuestion(question: QuickQuestion): void {
    this.handleHybridChat(question.text);
  }

  private handleHybridChat(message: string): void {
    // Agregar mensaje del usuario
    this.messages.push({
      text: message,
      isUser: true,
      timestamp: new Date()
    });

    this.scrollToBottom();

    // Intentar respuesta local primero
    const localResponse = this.getLocalResponse(message);
    
    if (localResponse) {
      // Simular typing
      this.isTyping = true;
      setTimeout(() => {
        this.messages.push({
          text: localResponse,
          isUser: false,
          timestamp: new Date()
        });
        this.isTyping = false;
        this.scrollToBottom();
      }, 1000);
    } else {
      // Usar API externa
      this.isTyping = true;
      this.chatbotService.sendMessage(message).subscribe({
        next: (response) => {
          this.messages.push({
            text: response.message || 'Lo siento, no pude procesar tu consulta.',
            isUser: false,
            timestamp: new Date()
          });
          this.isTyping = false;
          this.scrollToBottom();
        },
        error: () => {
          this.messages.push({
            text: 'Lo siento, hay un problema técnico. Por favor, intenta más tarde.',
            isUser: false,
            timestamp: new Date()
          });
          this.isTyping = false;
          this.scrollToBottom();
        }
      });
    }
  }

  private getLocalResponse(message: string): string | null {
    const msg = message.toLowerCase();
    const nombrePaciente = this.paciente?.nombre || this.user?.nombre || 'Paciente';
    
    const localResponses: { [key: string]: string } = {
      'hola': `¡Hola ${nombrePaciente}! ¿En qué puedo ayudarte con tus turnos?`,
      'horarios': 'Nuestros horarios de atención son de lunes a viernes de 8:00 a 18:00 y sábados de 9:00 a 13:00.',
      'precios': 'Los precios varían según el tratamiento. Puedes ver los precios específicos al seleccionar un tratamiento en "Reservar Turno".',
      'tratamientos': `Ofrecemos consultas generales, limpiezas, empastes, extracciones y ortodoncia. Tienes ${this.pacienteStats.totalTurnos} turnos registrados.`,
      'turnos': `Tienes ${this.pacienteStats.turnosReservados} turnos reservados y ${this.pacienteStats.turnosCompletados} completados.`,
    };

    for (const key in localResponses) {
      if (msg.includes(key)) {
        return localResponses[key];
      }
    }

    if (msg.includes('reservar') || msg.includes('sacar') || msg.includes('turno')) {
      return 'Para reservar un turno, puedes hacer clic en "Reservar Turno" en tu dashboard. ¡Te guiaré paso a paso!';
    }

    if (msg.includes('cancelar')) {
      return 'Para cancelar un turno, ve a "Mis Turnos" y haz clic en el botón rojo de cancelar junto al turno que deseas cancelar.';
    }

    return null;
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatMessages) {
        const element = this.chatMessages.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
  }

  // Navegación y utilidades
  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  // Método público para refrescar datos manualmente
  forceRefresh(): void {
    console.log('Forzando actualización de datos...');
    this.paciente = null;
    this.misTurnos = [];
    this.refreshData();
  }
}
