import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { User, Turno, Tratamiento, Paciente } from '../../interfaces';
import { ChatbotService } from '../../services/ChatBot.service';
import { ChatService } from '../../services/chat.service';
import { ChatMessage, QuickQuestion } from '../../interfaces/chatbot.interface';
import { TurnoService } from '../../services/turno.service';
import { PacienteService } from '../../services/paciente.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-turnos',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './turnos.component.html',
  styleUrl: './turnos.component.css'
})
export class TurnosComponent implements OnInit {
  currentView: string = 'turnos';
  user: User | null = null;
  pacienteActual: Paciente | null = null; // Información del paciente logueado
  turnos: Turno[] = [];
  searchTerm: string = '';
  filterEstado: string = 'todos';
  isLoading: boolean = false;
  
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
  
  // Formulario de turno
  turnoForm = {
    pacienteId: '',
    fecha: '',
    hora: '',
    tratamientoId: ''
  };

  // Datos de prueba
  pacientes: Paciente[] = [];

  tratamientos: Tratamiento[] = [];

  selectedTurnoParaCancelar: any = null;
  showCancelModal = false;
  showSuccessModal = false;
  reembolsoStatus: string | null = null;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private chatbotService: ChatbotService,
    private chatService: ChatService,
    private turnoService: TurnoService,
    private pacienteService: PacienteService,
    private notificationService: NotificationService
  ) {
    this.chatForm = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadTurnosData();
    this.loadPacientes();
    this.loadTratamientos();
    if (this.user?.tipoUsuario === 'paciente') {
      this.currentView = 'mis-turnos';
      this.loadPacienteData(); // Cargar datos del paciente
      this.loadChatHistory();
      this.addWelcomeMessage();
    }
  }

  // Cargar historial del chat desde ChatService con localStorage
  loadChatHistory(): void {
    const history = this.chatService.getConversationHistory();
    if (history.length > 0) {
      // Convertir el historial del ChatService al formato del componente
      this.messages = history.map(msg => ({
        text: msg.content,
        isUser: msg.role === 'user',
        timestamp: msg.timestamp
      }));
      
      // Mostrar contexto de conversación si es una continuación
      if (this.chatService.isContinuingConversation()) {
        const summary = this.chatService.getConversationSummary();
        console.log('Continuando conversación en turnos:', summary);
      }
    }
  }

  // Chatbot methods
  addWelcomeMessage(): void {
    const welcomeMessage: ChatMessage = {
      text: '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte con tus turnos?',
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
      
      // Sincronizar con ChatService y mostrar contexto si es necesario
      this.syncWithChatService();
      
      // Mostrar sugerencia de siguiente paso si es apropiado
      const suggestedNextStep = this.chatService.getSuggestedNextStep();
      if (suggestedNextStep) {
        console.log('Sugerencia del chatbot en turnos:', suggestedNextStep);
      }
    }
  }

  handleQuickQuestion(question: QuickQuestion): void {
    const userMessage: ChatMessage = {
      text: question.text,
      isUser: true,
      timestamp: new Date()
    };
    
    this.messages.push(userMessage);
    this.handleHybridChat(question.text);
    this.scrollToBottom();
  }

  private handleHybridChat(message: string): void {
    this.isTyping = true;
    
    // Determinar el tipo de usuario
    const userType = this.user?.tipoUsuario === 'dentista' ? 'dentist' : 'patient';
    
    // Verificar si es una continuación de conversación
    const isContinuing = this.chatService.isContinuingConversation();
    const lastTopic = this.chatService.getLastTopic();
    
    // Usar ChatService para generar respuesta con contexto
    const chatResponse = this.chatService.generateResponse(message, userType);
    
    setTimeout(() => {
      const botMessage: ChatMessage = {
        text: chatResponse,
        isUser: false,
        timestamp: new Date()
      };
      this.messages.push(botMessage);
      this.isTyping = false;
      this.scrollToBottom();
      
      // Sincronizar con ChatService
      this.syncWithChatService();
      
      // Log del contexto para debugging
      if (isContinuing && lastTopic) {
        console.log(`Continuando conversación en turnos sobre: ${lastTopic}`);
      }
    }, 800);
  }

  // Sincronizar mensajes del componente con ChatService
  private syncWithChatService(): void {
    // El ChatService ya maneja su propio historial internamente
    // Solo necesitamos asegurar que los mensajes del componente estén sincronizados
    const history = this.chatService.getConversationHistory();
    if (history.length > this.messages.length) {
      // Si hay más mensajes en ChatService, actualizar el componente
      this.messages = history.map(msg => ({
        text: msg.content,
        isUser: msg.role === 'user',
        timestamp: msg.timestamp
      }));
    }
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

  loadTurnosData(): void {
    this.isLoading = true;
    // Forzar recarga desde backend para obtener el estado actualizado
    this.turnoService.getTurnosFromAPI().subscribe({
      next: (turnos) => {
        this.turnos = turnos;
        this.isLoading = false;
      },
      error: () => {
        this.turnos = [];
        this.isLoading = false;
      }
    });
  }

  loadPacientes(): void {
    this.pacienteService.getPacientes().subscribe({
      next: (pacientes) => this.pacientes = pacientes,
      error: () => this.pacientes = []
    });
  }

  loadTratamientos(): void {
    this.turnoService.getTratamientos().subscribe({
      next: (tratamientos) => this.tratamientos = tratamientos,
      error: () => this.tratamientos = []
    });
  }

  loadPacienteData(): void {
    if (!this.user?.id) return;
    
    this.pacienteService.getPacientes().subscribe({
      next: (pacientes) => {
        // Buscar el paciente que corresponde al usuario logueado
        this.pacienteActual = pacientes.find(p => p.userId === this.user?.id.toString()) || null;
        
        if (this.pacienteActual) {
          console.log('Paciente encontrado:', this.pacienteActual);
          // Configurar el formulario con el pacienteId correcto
          this.turnoForm.pacienteId = this.pacienteActual._id || this.pacienteActual.id?.toString() || '';
        } else {
          console.warn('No se encontró información del paciente para el usuario:', this.user?.id);
        }
      },
      error: (error) => {
        console.error('Error al cargar datos del paciente:', error);
      }
    });
  }

  navigateToDashboard(): void {
    // Redirigir según el tipo de usuario
    if (this.user?.tipoUsuario === 'paciente') {
      this.router.navigate(['/vistaPaciente']);
    } else {
      // Para dentistas y administradores
      this.router.navigate(['/dashboard']);
    }
  }

  navigateTo(view: string): void {
    this.currentView = view;
  }

  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  registrarTurno(): void {
    if (!this.canRegisterTurno) return;
    this.isLoading = true;
    const turnoData = {
      pacienteId: this.turnoForm.pacienteId,
      fecha: this.turnoForm.fecha,
      hora: this.turnoForm.hora,
      tratamientoId: this.turnoForm.tratamientoId
    };
    this.turnoService.createTurno(turnoData).subscribe({
      next: (response) => {
        console.log('Turno creado exitosamente:', response);
        this.isLoading = false;
        this.notificationService.showSuccess('Turno registrado exitosamente');
        
        // Force page reload to ensure fresh data
        setTimeout(() => {
          window.location.reload();
        }, 500);
      },
      error: (error) => {
        console.error('Error al registrar turno:', error);
        this.isLoading = false;
        const errorMessage = error.error?.msg || 'Error al registrar el turno';
        this.notificationService.showError(errorMessage);
      }
    });
  }

  get canRegisterTurno(): boolean {
    return this.turnoForm.pacienteId !== '' &&
           this.turnoForm.fecha !== '' &&
           this.turnoForm.hora !== '' &&
           this.turnoForm.tratamientoId !== '';
  }

  cancelarTurno(turno: Turno): void {
    this.selectedTurnoParaCancelar = turno;
    this.showCancelModal = true;
  }

  closeCancelModal() {
    this.showCancelModal = false;
    this.selectedTurnoParaCancelar = null;
  }

  getPaymentStatusLabel(status: string): string {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'refunded': return 'Reembolsado';
      case 'cancelled': return 'Cancelado';
      case 'pending': return 'Pendiente';
      default: return status ? status : '—';
    }
  }

  getPaymentStatusClass(status: string): string {
    switch (status) {
      case 'approved': return 'badge bg-success';
      case 'refunded': return 'badge bg-info';
      case 'cancelled': return 'badge bg-danger';
      case 'pending': return 'badge bg-warning text-dark';
      default: return 'badge bg-secondary';
    }
  }

  confirmCancelTurno() {
    if (this.selectedTurnoParaCancelar) {
      const turnoId = this.selectedTurnoParaCancelar._id || this.selectedTurnoParaCancelar.id?.toString() || '';
      if (turnoId) {
        this.isLoading = true;
        this.turnoService.cancelarTurnoYReembolso(turnoId).subscribe({
          next: (res) => {
            this.reembolsoStatus = res?.refundResult ? 'reembolsado' : 'cancelado';
            this.showSuccessModal = true;
            this.isLoading = false;
            setTimeout(() => {
              window.location.reload();
            }, 500);
            this.showCancelModal = false;
            this.selectedTurnoParaCancelar = null;
          },
          error: (error) => {
            this.isLoading = false;
            this.reembolsoStatus = null;
            const errorMessage = error.error?.msg || 'Error al cancelar el turno o el pago';
            this.notificationService.showError(errorMessage);
            this.showCancelModal = false;
            this.selectedTurnoParaCancelar = null;
          }
        });
      }
    }
  }

  completarTurno(turno: Turno): void {
    if (confirm('¿Confirmar que el turno ha sido completado?')) {
      const turnoId = turno._id || turno.id?.toString() || '';
      if (turnoId) {
        this.turnoService.cambiarEstadoTurno(turnoId, 'completado').subscribe({
          next: () => {
            this.notificationService.showSuccess('Turno marcado como completado');
            // Force page reload to ensure fresh data
            setTimeout(() => {
              window.location.reload();
            }, 500);
          },
          error: () => this.notificationService.showError('Error al completar el turno')
        });
      }
    }
  }

  get filteredTurnos(): Turno[] {
    let filtered = this.turnos;

    // Debug: mostrar información inicial
    if (this.user?.tipoUsuario === 'paciente') {
      console.log('Filtrando turnos para paciente:');
      console.log('- Usuario:', this.user);
      console.log('- Paciente actual:', this.pacienteActual);
      console.log('- Total turnos:', this.turnos.length);
    }

    // Filtrar por búsqueda
    if (this.searchTerm.trim() !== '') {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(turno => 
        String(turno.nroTurno).toLowerCase().includes(search) ||
        turno.tratamiento.toLowerCase().includes(search) ||
        turno.nombre?.toLowerCase().includes(search) ||
        turno.apellido?.toLowerCase().includes(search)
      );
    }

    // Filtrar por estado
    if (this.filterEstado !== 'todos') {
      filtered = filtered.filter(turno => turno.estado === this.filterEstado);
    }

    // Filtrar por usuario según el tipo y la vista actual
    if (this.user?.tipoUsuario === 'paciente') {
      // Para pacientes: mostrar solo sus turnos usando múltiples criterios
      if (this.pacienteActual) {
        const pacienteId = this.pacienteActual._id || this.pacienteActual.id;
        filtered = filtered.filter(turno => {
          // Verificar por pacienteId
          if (pacienteId && turno.pacienteId) {
            const idMatch = turno.pacienteId.toString() === pacienteId.toString();
            if (idMatch) return true;
          }
          
          // Verificar por nombre y apellido como fallback
          if (this.pacienteActual?.nombre && this.pacienteActual?.apellido && turno.nombre && turno.apellido) {
            const nombreMatch = turno.nombre.toLowerCase().trim() === this.pacienteActual.nombre.toLowerCase().trim();
            const apellidoMatch = turno.apellido.toLowerCase().trim() === this.pacienteActual.apellido.toLowerCase().trim();
            return nombreMatch && apellidoMatch;
          }
          
          return false;
        });
      } else {
        // Si no se encontró la información del paciente, no mostrar ningún turno
        filtered = [];
      }
    }
    // Para dentistas y administradores: mostrar todos los turnos (no filtrar por paciente)

    // Debug: mostrar resultado final
    if (this.user?.tipoUsuario === 'paciente') {
      console.log('- Turnos filtrados:', filtered.length);
      console.log('- Turnos finales:', filtered);
    }

    return filtered;
  }

  getStatusClass(estado: string): string {
    // Mejorar visualización de estados con badges de colores
    switch (estado) {
      case 'reservado': return 'badge bg-primary';
      case 'completado': return 'badge bg-success';
      case 'cancelado': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
  }
}
