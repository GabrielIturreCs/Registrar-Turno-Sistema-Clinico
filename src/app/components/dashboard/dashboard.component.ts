import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { User, Turno, Paciente } from '../../interfaces';
import { ChatbotService } from '../../services/ChatBot.service';
import { ChatMessage, QuickQuestion } from '../../interfaces/chatbot.interface';
import { TurnoService } from '../../services/turno.service';
import { PacienteService } from '../../services/paciente.service';
import { interval, Subscription } from 'rxjs';
// import { ReservarComponent } from '../reservar/reservar.component';

interface AdminStats {
  totalUsuarios: number;
  turnosEsteMes: number;
  ingresosEsteMes: number;
  dentistasActivos: number;
  ocupacionTurnos: number;
  satisfaccionPacientes: number;
  eficienciaSistema: number;
  alertas: Array<{
    tipo: string;
    titulo: string;
    descripcion: string;
    tiempo: string;
  }>;
  actividadReciente: Array<{
    tipo: string;
    titulo: string;
    descripcion: string;
    tiempo: string;
  }>;
  proximosEventos: Array<{
    hora: string;
    titulo: string;
    ubicacion: string;
  }>;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: User | null = null;
  turnos: Turno[] = [];
  selectedPaciente: Paciente | null = null;
  isPacienteView: boolean = false;

  // Admin dashboard properties
  adminStats: AdminStats = {
    totalUsuarios: 0,
    turnosEsteMes: 0,
    ingresosEsteMes: 0,
    dentistasActivos: 0,
    ocupacionTurnos: 0,
    satisfaccionPacientes: 0,
    eficienciaSistema: 0,
    alertas: [],
    actividadReciente: [],
    proximosEventos: []
  };

  // Chatbot properties
  @ViewChild('chatMessages') chatMessages!: ElementRef;
  chatOpen = false;
  messages: ChatMessage[] = [];
  chatForm: FormGroup;
  isTyping = false;
  quickQuestions: QuickQuestion[] = [
    { text: '¿Cuáles son los horarios?', action: 'horarios' },
    { text: '¿Qué tratamientos ofrecen?', action: 'tratamientos' },
    { text: '¿Cómo reservo un turno?', action: 'reservar' },
    { text: '¿Cómo cancelo un turno?', action: 'cancelar' }
  ];

    // Datos de prueba
    testData = {
    turnos: [
      { id: 1, nroTurno: 'T001', fecha: '2024-01-20', hora: '09:00', estado: 'reservado', tratamiento: 'Consulta General', precioFinal: 5000, nombre: 'Juan', apellido: 'Pérez', pacienteId: 1, tratamientoId: 1 },
      { id: 2, nroTurno: 'T002', fecha: '2024-01-21', hora: '10:30', estado: 'reservado', tratamiento: 'Limpieza Dental', precioFinal: 8000, nombre: 'María', apellido: 'García', pacienteId: 2, tratamientoId: 2 },
      { id: 3, nroTurno: 'T003', fecha: '2024-01-22', hora: '14:00', estado: 'completado', tratamiento: 'Empaste', precioFinal: 12000, nombre: 'Carlos', apellido: 'López', pacienteId: 3, tratamientoId: 3 }
    ]
  };

  // NUEVO: Variables para rendimiento del sistema (solo admin)
  rendimiento = {
    ocupacion: 0, // % de turnos completados sobre el total
    usuarios: 0   // cantidad real de usuarios registrados (pacientes)
  };

  alertas: any[] = [];
  private alertaInterval?: Subscription;
  cargandoAlertas = false;

  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private chatbotService: ChatbotService,
    private turnoService: TurnoService,
    private pacienteService: PacienteService
  ) {
    this.chatForm = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit(): void {
    this.loadUserData();
    this.checkPacienteView();
    this.loadTurnosData();
    this.loadAdminStats();
    this.addWelcomeMessage();
    if (this.user?.tipoUsuario === 'administrador') {
      this.cargarRendimientoSistema();
      this.generarAlertasSistema();
      this.alertaInterval = interval(600000).subscribe(() => { // cada 10 minutos
        this.generarAlertasSistema();
      });
    }
  }

  ngOnDestroy(): void {
    this.alertaInterval?.unsubscribe();
  }

  // Admin dashboard methods
  loadAdminStats(): void {
    if (this.user?.tipoUsuario === 'administrador') {
      // Simular datos de estadísticas administrativas
      this.adminStats = {
        totalUsuarios: 156,
        turnosEsteMes: 342,
        ingresosEsteMes: 2850000,
        dentistasActivos: 8,
        ocupacionTurnos: 78,
        satisfaccionPacientes: 92,
        eficienciaSistema: 85,
        alertas: [
          {
            tipo: 'warning',
            titulo: 'Mantenimiento Programado',
            descripcion: 'El sistema estará en mantenimiento mañana de 2:00 a 4:00 AM',
            tiempo: 'Hace 2 horas'
          },
          {
            tipo: 'info',
            titulo: 'Nuevo Dentista Registrado',
            descripcion: 'Dr. María González se ha unido al equipo',
            tiempo: 'Hace 4 horas'
          },
          {
            tipo: 'success',
            titulo: 'Meta Mensual Alcanzada',
            descripcion: 'Se ha alcanzado el 100% de la meta de turnos del mes',
            tiempo: 'Hace 1 día'
          }
        ],
        actividadReciente: [
          {
            tipo: 'user',
            titulo: 'Nuevo Paciente Registrado',
            descripcion: 'Ana Martínez se registró en el sistema',
            tiempo: 'Hace 30 min'
          },
          {
            tipo: 'turno',
            titulo: 'Turno Cancelado',
            descripcion: 'Turno #T045 cancelado por el paciente',
            tiempo: 'Hace 1 hora'
          },
          {
            tipo: 'payment',
            titulo: 'Pago Procesado',
            descripcion: 'Pago de $15,000 procesado exitosamente',
            tiempo: 'Hace 2 horas'
          },
          {
            tipo: 'system',
            titulo: 'Backup Completado',
            descripcion: 'Backup automático del sistema completado',
            tiempo: 'Hace 3 horas'
          }
        ],
        proximosEventos: [
          {
            hora: '09:00',
            titulo: 'Reunión de Equipo',
            ubicacion: 'Sala de Conferencias'
          },
          {
            hora: '14:30',
            titulo: 'Capacitación Nuevo Software',
            ubicacion: 'Aula de Capacitación'
          },
          {
            hora: '16:00',
            titulo: 'Revisión de Inventario',
            ubicacion: 'Almacén'
          }
        ]
      };
    }
  }

  getAlertIcon(tipo: string): string {
    const icons: { [key: string]: string } = {
      'warning': 'fas fa-exclamation-triangle',
      'info': 'fas fa-info-circle',
      'success': 'fas fa-check-circle',
      'danger': 'fas fa-times-circle'
    };
    return icons[tipo] || 'fas fa-info-circle';
  }

  getActivityIcon(tipo: string): string {
    const icons: { [key: string]: string } = {
      'user': 'fas fa-user-plus',
      'turno': 'fas fa-calendar-times',
      'payment': 'fas fa-credit-card',
      'system': 'fas fa-cog',
      'dentist': 'fas fa-user-md',
      'patient': 'fas fa-user'
    };
    return icons[tipo] || 'fas fa-info-circle';
  }

  // Chatbot methods
  addWelcomeMessage(): void {
    const welcomeMessage: ChatMessage = {
      text: '¡Hola! Soy tu asistente virtual del dashboard. ¿En qué puedo ayudarte?',
      isUser: false,
      timestamp: new Date()
    };
    this.messages.push(welcomeMessage);
  }

  toggleChat(): void {
    this.chatOpen = !this.chatOpen;
    if (this.chatOpen && this.messages.length === 0) {
      this.addWelcomeMessage();
    }
  }

  onSubmit(): void {
    if (this.chatForm.valid && this.chatForm.value.message.trim()) {
      const userMessage: ChatMessage = {
        text: this.chatForm.value.message,
        isUser: true,
        timestamp: new Date()
      };
      
      this.messages.push(userMessage);
      this.handleHybridChat(userMessage.text);
      this.chatForm.patchValue({ message: '' });
      this.scrollToBottom();
    }
  }

  handleQuickQuestion(question: QuickQuestion): void {
    const userMessage: ChatMessage = {
      text: question.text,
      isUser: true,
      timestamp: new Date()
    };
    
    this.messages.push(userMessage);
    this.handleHybridChat(question.action);
    this.scrollToBottom();
  }

  private handleHybridChat(message: string): void {
    this.isTyping = true;
    
    // Intentar respuesta local primero
    const localResponse = this.getLocalResponse(message);
    
    if (localResponse) {
      setTimeout(() => {
        const botMessage: ChatMessage = {
          text: localResponse,
          isUser: false,
          timestamp: new Date()
        };
        this.messages.push(botMessage);
        this.isTyping = false;
        this.scrollToBottom();
      }, 800);
    } else {
      // Si no hay respuesta local, usar API externa
      this.chatbotService.sendMessage(message).subscribe({
        next: (response) => {
          const botMessage: ChatMessage = {
            text: response.success ? response.message : 'Lo siento, no pude procesar tu consulta en este momento.',
            isUser: false,
            timestamp: new Date()
          };
          this.messages.push(botMessage);
          this.isTyping = false;
          this.scrollToBottom();
        },
        error: () => {
          const errorMessage: ChatMessage = {
            text: 'Disculpa, estoy teniendo problemas de conexión. ¿Puedes intentar más tarde?',
            isUser: false,
            timestamp: new Date()
          };
          this.messages.push(errorMessage);
          this.isTyping = false;
          this.scrollToBottom();
        }
      });
    }
  }

  private getLocalResponse(message: string): string | null {
    const msg = message.toLowerCase();
    
    const localResponses: { [key: string]: string } = {
      'hola': '¡Hola! ¿En qué puedo ayudarte desde el dashboard?',
      'turnos': `Tienes ${this.totalTurnos} turnos en total, ${this.turnosHoy} turnos para hoy.`,
      'reservar': 'Para reservar un turno, puedes hacer clic en "Reservar Turno" o navegar a la sección correspondiente.',
      'cancelar': 'Para cancelar un turno, puedes hacerlo directamente desde las tarjetas de turnos usando el botón "Cancelar".',
      'horarios': 'Nuestros horarios de atención son de lunes a viernes de 8:00 a 18:00 y sábados de 9:00 a 13:00.',
      'estadisticas': `Estadísticas actuales: ${this.totalTurnos} turnos totales, ${this.turnosHoy} turnos hoy, ${this.filteredTurnos.length} turnos activos.`,
      'proximo': this.proximoTurno ? `Tu próximo turno es el ${this.proximoTurno.fecha} a las ${this.proximoTurno.hora}.` : 'No tienes turnos próximos programados.',
      'tratamientos': 'Ofrecemos: Consulta General ($5000), Limpieza Dental ($8000), Empastes ($12000), Extracciones ($15000), y Ortodoncia.',
      'gracias': '¡De nada! ¿Hay algo más en lo que pueda ayudarte?',
      'ayuda': 'Desde el dashboard puedo ayudarte con: estadísticas de turnos, información sobre tu próximo turno, navegación, y consultas generales.'
    };

    // Buscar palabras clave en el mensaje
    for (const key in localResponses) {
      if (msg.includes(key)) {
        return localResponses[key];
      }
    }

    // Respuestas contextuales más avanzadas
    if (msg.includes('cuando') || msg.includes('cuándo')) {
      return this.proximoTurno ? 
        `Tu próximo turno es el ${this.proximoTurno.fecha} a las ${this.proximoTurno.hora} para ${this.proximoTurno.tratamiento}.` :
        'No tienes turnos próximos programados. ¿Te gustaría reservar uno?';
    }
    
    if (msg.includes('cuantos') || msg.includes('cantidad')) {
      return `Tienes ${this.totalTurnos} turnos en total. ${this.turnosHoy} son para hoy y ${this.filteredTurnos.length} están activos.`;
    }

    return null; // No hay respuesta local, usar API
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatMessages) {
        this.chatMessages.nativeElement.scrollTop = this.chatMessages.nativeElement.scrollHeight;
      }
    }, 100);
  }

  loadUserData(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        this.user = JSON.parse(userStr);
      } else {
        this.router.navigate(['/login']);
      }
    }
  }

  checkPacienteView(): void {
    // Verificar si hay un paciente seleccionado (viene desde la vista de pacientes)
    if (typeof window !== 'undefined' && window.localStorage) {
      const selectedPacienteStr = localStorage.getItem('selectedPaciente');
      if (selectedPacienteStr) {
        this.selectedPaciente = JSON.parse(selectedPacienteStr);
        this.isPacienteView = true;
        
        // Limpiar el localStorage después de obtener el paciente
        localStorage.removeItem('selectedPaciente');
      }
    }

    // También verificar si viene por query params
    this.route.queryParams.subscribe(params => {
      if (params['pacienteId'] && !this.selectedPaciente) {
        // Buscar el paciente por ID en los datos de prueba
        const pacienteId = parseInt(params['pacienteId']);
        // Aquí podrías hacer una llamada al servicio para obtener el paciente
        // Por ahora usamos datos de prueba
        this.selectedPaciente = {
          id: pacienteId,
          nombre: 'Paciente',
          apellido: 'Ejemplo',
          dni: '12345678',
          obraSocial: 'OSDE'
        };
        this.isPacienteView = true;
      }
    });
  }

  loadTurnosData(): void {
    this.turnoService.getTurnosFromAPI().subscribe({
      next: (turnos) => {
        if (this.selectedPaciente) {
          this.turnos = turnos.filter(turno => turno.pacienteId === this.selectedPaciente!.id);
        } else {
          this.turnos = turnos;
        }
      },
      error: () => {
        this.turnos = [];
      }
    });
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  navigateToReservar(): void {
    this.router.navigate(['/reservarTurno']);
  }

  navigateToTurnos(): void {
    this.router.navigate(['/misTurnos']);
  }

  navigateToAdmin(): void {
    this.router.navigate(['/admin']);
  }

  navigateToEstadisticas(): void {
    this.router.navigate(['/estadistica']);
  }

  navigateToPacientes(): void {
    this.router.navigate(['/pacientes']);
  }

  navigateToDentistas(): void {
    this.router.navigate(['/dentista']);
  }

  navigateToAgenda(): void {
    this.router.navigate(['/agenda']);
  }

  volverAPacientes(): void {
    this.router.navigate(['/pacientes']);
  }

  cancelarTurno(turno: Turno): void {
    if (confirm('¿Estás seguro de que quieres cancelar este turno?')) {
      this.turnoService.cambiarEstadoTurno(turno.id.toString(), 'cancelado').subscribe({
        next: () => {
          this.loadTurnosData();
          alert('Turno cancelado exitosamente');
        },
        error: () => alert('Error al cancelar el turno')
      });
    }
  }

  get filteredTurnos(): Turno[] {
    return this.turnos.filter(turno => turno.estado !== 'cancelado');
  }

  get totalTurnos(): number {
    return this.turnos.length;
  }

  get turnosHoy(): number {
    const today = new Date().toISOString().split('T')[0];
    return this.turnos.filter(turno => turno.fecha === today).length;
  }

  get proximoTurno(): Turno | null {
    const today = new Date().toISOString().split('T')[0];
    const futureTurnos = this.turnos
      .filter(turno => turno.fecha >= today && turno.estado === 'reservado')
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    
    return futureTurnos.length > 0 ? futureTurnos[0] : null;
  }

  getStatusClass(estado: string): string {
    switch (estado) {
      case 'reservado': return 'badge bg-primary';
      case 'completado': return 'badge bg-success';
      case 'cancelado': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  getTipoClass(tipo: string): string {
    switch (tipo) {
      case 'administrador': return 'badge bg-danger';
      case 'dentista': return 'badge bg-primary';
      case 'paciente': return 'badge bg-success';
      default: return 'badge bg-secondary';
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

  cargarRendimientoSistema(): void {
    // Obtener turnos y pacientes en paralelo
    this.turnoService.getTurnosFromAPI().subscribe((turnos: any[]) => {
      const total = turnos.length;
      const completados = turnos.filter((t: any) => t.estado === 'completado').length;
      this.rendimiento.ocupacion = total ? Math.round((completados / total) * 100) : 0;
    });
    this.pacienteService.getPacientes().subscribe((pacientes: any[]) => {
      this.rendimiento.usuarios = pacientes.length;
    });
  }

  generarAlertasSistema(): void {
    this.cargandoAlertas = true;
    this.turnoService.getTurnosFromAPI().subscribe((turnos: any[]) => {
      const recientes = turnos
        .slice(-5)
        .reverse()
        .map((t: any) => ({
          tipo: t.estado === 'completado' ? 'success' : t.estado === 'cancelado' ? 'warning' : 'info',
          titulo: t.estado === 'completado' ? 'Turno Completado' : t.estado === 'cancelado' ? 'Turno Cancelado' : 'Nuevo Turno',
          descripcion: `Turno #${t.nroTurno} para ${t.nombre} ${t.apellido}`,
          tiempo: t.fecha
        }));

      this.pacienteService.getPacientes().subscribe((pacientes: any[]) => {
        const nuevosPacientes = pacientes
          .slice(-5)
          .reverse()
          .map((p: any) => ({
            tipo: 'info',
            titulo: 'Nuevo Paciente Registrado',
            descripcion: `${p.nombre} ${p.apellido} se registró en el sistema`,
            tiempo: ''
          }));

        this.alertas = [...recientes, ...nuevosPacientes];
        this.cargandoAlertas = false;
      }, () => this.cargandoAlertas = false);
    }, () => this.cargandoAlertas = false);
  }
}
