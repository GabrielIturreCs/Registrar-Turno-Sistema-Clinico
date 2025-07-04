import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { User, Turno, Tratamiento, Paciente } from '../../interfaces';
import { ChatbotService } from '../../services/ChatBot.service';
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

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private chatbotService: ChatbotService,
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
      this.addWelcomeMessage();
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
      'hola': '¡Hola! ¿En qué puedo ayudarte hoy?',
      'turnos': 'Puedo ayudarte con información sobre tus turnos. ¿Quieres ver tus turnos próximos o necesitas agendar uno nuevo?',
      'reservar': 'Para reservar un turno, puedes hacer clic en "Nuevo Turno" o decirme qué tipo de consulta necesitas.',
      'cancelar': 'Si necesitas cancelar un turno, puedes hacerlo desde la tabla de turnos usando el botón rojo con una X.',
      'horarios': 'Nuestros horarios de atención son de lunes a viernes de 8:00 a 18:00 y sábados de 9:00 a 13:00.',
      'precios': 'Los precios varían según el tratamiento. Una consulta general cuesta $5000, limpieza dental $8000.',
      'tratamientos': 'Ofrecemos: Consulta General ($5000), Limpieza Dental ($8000), Empastes ($12000), Extracciones ($15000), y Ortodoncia.',
      'gracias': '¡De nada! ¿Hay algo más en lo que pueda ayudarte?',
      'ayuda': 'Puedo ayudarte con: ver turnos, reservar turnos, cancelar turnos, información sobre tratamientos y precios.'
    };

    // Buscar palabras clave en el mensaje
    for (const key in localResponses) {
      if (msg.includes(key)) {
        return localResponses[key];
      }
    }

    // Respuestas contextuales más avanzadas
    if (msg.includes('cuando') || msg.includes('cuándo')) {
      return 'Nuestros horarios son de lunes a viernes de 8:00 a 18:00, y sábados de 9:00 a 13:00.';
    }
    
    if (msg.includes('cuanto') || msg.includes('cuesta') || msg.includes('precio')) {
      return 'Los precios varían por tratamiento: Consulta ($5000), Limpieza ($8000), Empaste ($12000), Extracción ($15000). ¿Te interesa alguno en particular?';
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

  confirmCancelTurno() {
    if (this.selectedTurnoParaCancelar) {
      const turnoId = this.selectedTurnoParaCancelar._id || this.selectedTurnoParaCancelar.id?.toString() || '';
      if (turnoId) {
        this.turnoService.cambiarEstadoTurno(turnoId, 'cancelado').subscribe({
          next: () => {
            this.showSuccessModal = true;
            // Force page reload to ensure fresh data
            setTimeout(() => {
              window.location.reload();
            }, 500);
            this.showCancelModal = false;
            this.selectedTurnoParaCancelar = null;
          },
          error: (error) => {
            const errorMessage = error.error?.msg || 'Error al cancelar el turno';
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
            alert('Turno marcado como completado');
            // Force page reload to ensure fresh data
            setTimeout(() => {
              window.location.reload();
            }, 500);
          },
          error: () => alert('Error al completar el turno')
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
