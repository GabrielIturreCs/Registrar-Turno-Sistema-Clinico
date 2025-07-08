import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { User, Turno, Tratamiento, Paciente } from '../../interfaces';
import { ChatbotService } from '../../services/ChatBot.service';
import { ChatService } from '../../services/chat.service';
import { ChatMessage, QuickQuestion } from '../../interfaces/chatbot.interface';
import { ActionButton } from '../../interfaces/message.interface';
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
  showWelcomeBubble = false;
  
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
      // Solo agregar mensaje de bienvenida si no hay historial
      if (this.messages.length === 0) {
        this.addWelcomeMessage();
      }
    }
    // Mostrar burbuja de bienvenida después de un retraso
    this.showWelcomeBubbleAfterDelay();
  }

  // Cargar historial del chat desde ChatService con localStorage
  loadChatHistory(): void {
    const history = this.chatService.getConversationHistory();
    if (history.length > 0) {
      // Convertir el historial del ChatService al formato del componente
      this.messages = history.map(msg => ({
        text: msg.content,
        isUser: msg.role === 'user',
        timestamp: msg.timestamp,
        actions: msg.actions || []
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
      text: '👋 **¡Hola! Soy tu asistente virtual inteligente.**\n\n🎯 **Estoy aquí para ayudarte con:**\n\n• 📅 **Gestionar tus turnos** (cancelar, reprogramar, ver historial)\n• 💳 **Consultas sobre pagos** y facturación\n• 📞 **Contactar la clínica** por WhatsApp o teléfono\n• 🏥 **Información de tratamientos** y servicios\n• 📋 **Actualizar tus datos** personales\n\n💬 **Puedes escribir consultas como:**\n• "Quiero cancelar un turno"\n• "¿Cuánto cuesta una limpieza?"\n• "Necesito reprogramar mi cita"\n\n**¿En qué puedo ayudarte hoy?**',
      isUser: false,
      timestamp: new Date(),
      actions: [
        {
          text: '📅 Ver Mis Turnos',
          action: 'navigate:/misTurnos',
          icon: 'calendar-check',
          variant: 'primary'
        },
        {
          text: '➕ Reservar Turno',
          action: 'navigate:/reservarTurno',
          icon: 'calendar-plus',
          variant: 'success'
        },
        {
          text: '📞 Contactar Clínica',
          action: 'call:(011) 4567-8901',
          icon: 'phone',
          variant: 'info'
        }
      ]
    };
    this.messages.push(welcomeMessage);
  }

  // Métodos para la burbuja de bienvenida
  openChatFromBubble(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showWelcomeBubble = false;
    this.chatOpen = true;
    if (this.messages.length === 0) {
      this.addWelcomeMessage();
    }
    this.scrollToBottom();
  }

  closeWelcomeBubble(event: Event): void {
    event.stopPropagation();
    this.showWelcomeBubble = false;
    // Guardar preferencia para no mostrar la burbuja nuevamente
    localStorage.setItem('welcomeBubbleShown', 'true');
  }

  private showWelcomeBubbleAfterDelay(): void {
    // Verificar si ya se mostró la burbuja anteriormente
    const bubbleShown = localStorage.getItem('welcomeBubbleShown');
    console.log('Burbuja de bienvenida - bubbleShown:', bubbleShown);
    
    if (!bubbleShown) {
      console.log('Mostrando burbuja de bienvenida...');
      setTimeout(() => {
        this.showWelcomeBubble = true;
        console.log('Burbuja visible:', this.showWelcomeBubble);
        // Auto-ocultar después de 10 segundos
        setTimeout(() => {
          this.showWelcomeBubble = false;
          console.log('Burbuja auto-ocultada');
        }, 10000);
      }, 2000); // Mostrar después de 2 segundos
    } else {
      console.log('Burbuja ya fue mostrada anteriormente');
    }
  }

  toggleChat(): void {
    this.chatOpen = !this.chatOpen;
    if (this.chatOpen) {
      this.showWelcomeBubble = false; // Ocultar burbuja si se abre el chat
      if (this.messages.length === 0) {
        this.addWelcomeMessage();
      }
    }
    this.scrollToBottom();
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
    console.log('Respuesta del ChatService:', chatResponse);
    
    setTimeout(() => {
      const botMessage: ChatMessage = {
        text: chatResponse.content,
        isUser: false,
        timestamp: new Date(),
        actions: chatResponse.actions || []
      };
      console.log('Mensaje del bot con acciones:', botMessage);
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
        timestamp: msg.timestamp,
        actions: msg.actions || []
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

  // Función temporal para debugging - forzar recarga de turnos
  forceReloadTurnos(): void {
    console.log('🔄 Forzando recarga de turnos...');
    this.loadTurnosData();
  }

  loadTurnosData(): void {
    this.isLoading = true;
    console.log('🔄 Cargando turnos desde API...');
    console.log('👤 Usuario actual:', this.user);
    console.log('👤 Paciente actual:', this.pacienteActual);
    
    // Forzar recarga desde backend para obtener el estado actualizado
    this.turnoService.getTurnosFromAPI().subscribe({
      next: (turnos) => {
        console.log('✅ Turnos recibidos del backend:', turnos);
        console.log('📊 Total de turnos recibidos:', turnos.length);
        
        // Debug específico para pacientes
        if (this.user?.tipoUsuario === 'paciente' && this.pacienteActual) {
          console.log('🔍 Buscando turnos para paciente:', this.pacienteActual);
          
          const turnosDelPaciente = turnos.filter(turno => {
            const pacienteId = this.pacienteActual?._id || this.pacienteActual?.id;
            
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
          
          console.log(`🎯 Turnos encontrados para ${this.pacienteActual.nombre} ${this.pacienteActual.apellido}:`, turnosDelPaciente.length);
          console.log('📋 Turnos del paciente:', turnosDelPaciente);
        }
        
        // Debug: mostrar información de pago de cada turno
        turnos.forEach((turno, index) => {
          if (index < 5) { // Solo mostrar los primeros 5 para no saturar la consola
            console.log(`📋 Turno ${index + 1}:`, {
              nroTurno: turno.nroTurno,
              paciente: `${turno.nombre} ${turno.apellido}`,
              estado: turno.estado,
              paymentStatus: turno.paymentStatus,
              paymentId: turno.paymentId,
              metodoPago: turno.metodoPago,
              fechaPago: turno.fechaPago,
              montoRecibido: turno.montoRecibido,
              // Mostrar el valor que se usará en la template
              finalPaymentValue: turno.paymentStatus || turno.metodoPago || ''
            });
          }
        });
        
        this.turnos = turnos;
        this.isLoading = false;
        
        console.log('✅ Turnos asignados al componente. Total:', this.turnos.length);
      },
      error: (error) => {
        console.error('❌ Error cargando turnos:', error);
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
    if (!this.user?.id) {
      console.warn('⚠️ No hay user.id disponible para cargar datos del paciente');
      return;
    }
    
    console.log('👤 Cargando datos del paciente para userId:', this.user.id);
    
    this.pacienteService.getPacientes().subscribe({
      next: (pacientes) => {
        console.log('📋 Pacientes disponibles:', pacientes.length);
        
        // Buscar el paciente que corresponde al usuario logueado
        this.pacienteActual = pacientes.find(p => p.userId === this.user?.id.toString()) || null;
        
        if (this.pacienteActual) {
          console.log('✅ Paciente encontrado:', {
            id: this.pacienteActual._id || this.pacienteActual.id,
            nombre: this.pacienteActual.nombre,
            apellido: this.pacienteActual.apellido,
            userId: this.pacienteActual.userId
          });
          
          // Configurar el formulario con el pacienteId correcto
          this.turnoForm.pacienteId = this.pacienteActual._id || this.pacienteActual.id?.toString() || '';
          
          // Recargar turnos después de obtener los datos del paciente
          if (this.currentView === 'mis-turnos') {
            console.log('🔄 Recargando turnos después de obtener datos del paciente...');
            this.loadTurnosData();
          }
        } else {
          console.warn('⚠️ No se encontró información del paciente para el usuario:', this.user?.id);
          console.log('📋 Pacientes disponibles para debug:', pacientes.map(p => ({
            id: p._id || p.id,
            nombre: p.nombre,
            apellido: p.apellido,
            userId: p.userId
          })));
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar datos del paciente:', error);
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
    
    // Si navegamos a mis-turnos, recargar los datos para asegurar que estén actualizados
    if (view === 'mis-turnos') {
      console.log('🔄 Navegando a Mis Turnos - recargando datos...');
      this.loadTurnosData();
    }
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

  // Nuevas funciones para manejo de estado de pago
  getPaymentStatusClass(paymentStatus: string): string {
    switch (paymentStatus) {
      case 'approved': 
      case 'pagado': 
        return 'badge bg-success text-white';
      case 'pending': 
      case 'pendiente_pago_online': 
        return 'badge bg-warning text-dark';
      case 'rejected': 
      case 'cancelled': 
        return 'badge bg-danger text-white';
      case 'refunded': 
        return 'badge bg-info text-white';
      case 'efectivo': 
        return 'badge bg-secondary text-white';
      case 'online':
        return 'badge bg-primary text-white';
      case '':
      case null:
      case undefined:
        return 'badge bg-light text-dark';
      default: 
        return 'badge bg-light text-dark';
    }
  }

  getPaymentStatusLabel(paymentStatus: string): string {
    // Normalizar el valor
    const status = (paymentStatus || '').toLowerCase().trim();
    
    switch (status) {
      case 'approved': return '✅ Pagado Online';
      case 'pagado': return '✅ Pagado';
      case 'pending': return '⏳ Pago Pendiente';
      case 'pendiente_pago_online': return '⏳ Esperando Pago Online';
      case 'rejected': return '❌ Pago Rechazado';
      case 'cancelled': return '🚫 Pago Cancelado';
      case 'refunded': return '💰 Reembolsado';
      case 'efectivo': return '💵 Pago en Efectivo';
      case 'online': return '🌐 Pago Online';
      case '': 
      case 'null':
      case 'undefined':
        return '⏸️ Sin Procesar';
      default: 
        // Mostrar el estado original si no reconocemos el valor
        return '❓ ' + paymentStatus;
    }
  }

  // Función para obtener etiqueta de estado más descriptiva
  getStatusLabel(estado: string): string {
    switch (estado) {
      case 'reservado': return 'Reservado';
      case 'reservado_pendiente_pago': return 'Reservado - Pago Pendiente';
      case 'pendiente_pago_online': return 'Esperando Pago Online';
      case 'pagado': return 'Pagado';
      case 'completado': return 'Completado';
      case 'cancelado': return 'Cancelado';
      case 'pendiente': return 'Pendiente';
      default: return estado || 'Sin Estado';
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

  // Mejorar la función getStatusClass para incluir los nuevos estados
  getStatusClass(estado: string): string {
    switch (estado) {
      case 'reservado': return 'badge bg-primary text-white';
      case 'reservado_pendiente_pago': return 'badge bg-info text-white';
      case 'pendiente_pago_online': return 'badge bg-warning text-dark';
      case 'pagado': return 'badge bg-success text-white';
      case 'completado': return 'badge bg-dark text-white';
      case 'cancelado': return 'badge bg-danger text-white';
      case 'pendiente': return 'badge bg-secondary text-white';
      default: return 'badge bg-light text-dark';
    }
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
  }

  // Método para manejar acciones de botones del chat
  handleChatAction(action: ActionButton): void {
    console.log('Acción ejecutada:', action);
    const actionType = action.action.split(':')[0];
    const actionValue = action.action.split(':').slice(1).join(':');

    switch (actionType) {
      case 'navigate':
        // Navegar a una ruta específica
        console.log('Navegando a:', actionValue);
        
        // Manejar navegación específica para "Mis Turnos"
        if (actionValue === '/misTurnos') {
          this.navigateTo('mis-turnos');
          // Cerrar el chat después de navegar para mejor UX
          this.chatOpen = false;
          // Agregar mensaje de confirmación
          this.addConfirmationMessage('🎯 **Perfecto!** Te he llevado a tu sección de turnos. Aquí puedes ver todos tus turnos y cancelar cualquiera que necesites.');
        } else if (actionValue === '/reservarTurno') {
          this.navigateTo('registrar-turno');
          this.chatOpen = false;
          this.addConfirmationMessage('📅 **¡Excelente!** Ahora puedes reservar tu nuevo turno. Completa el formulario y confirma tu cita.');
        } else if (actionValue === '/vistaPaciente') {
          this.router.navigate(['/vistaPaciente']);
          this.chatOpen = false;
        } else {
          // Navegación general
          this.router.navigate([actionValue]);
          this.chatOpen = false;
        }
        break;
        
      case 'call':
        // Iniciar llamada telefónica
        if (typeof window !== 'undefined') {
          window.open(`tel:${actionValue}`, '_self');
          this.addConfirmationMessage(`📞 **Llamada iniciada** al ${actionValue}. Si no se abre automáticamente, puedes marcar este número desde tu teléfono.`);
        }
        break;
        
      case 'whatsapp':
        // Abrir WhatsApp
        if (typeof window !== 'undefined') {
          const whatsappUrl = `https://wa.me/${actionValue.replace(/\D/g, '')}`;
          window.open(whatsappUrl, '_blank');
          this.addConfirmationMessage(`💬 **WhatsApp abierto** para contactar al ${actionValue}. Puedes escribir tu consulta directamente.`);
        }
        break;
        
      case 'email':
        // Abrir cliente de email
        if (typeof window !== 'undefined') {
          window.open(`mailto:${actionValue}`, '_self');
          this.addConfirmationMessage(`📧 **Email abierto** para contactar a ${actionValue}. Describe tu consulta en el mensaje.`);
        }
        break;
        
      case 'map':
        // Abrir mapa con la dirección
        if (typeof window !== 'undefined') {
          const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(actionValue)}`;
          window.open(mapUrl, '_blank');
          this.addConfirmationMessage(`🗺️ **Mapa abierto** con la ubicación de la clínica. Puedes ver las indicaciones para llegar.`);
        }
        break;
        
      case 'show-schedule':
        // Mostrar horarios (agregar lógica específica)
        this.showScheduleInfo();
        break;
        
      default:
        console.warn('Acción no reconocida:', action.action);
    }
  }

  // Método auxiliar para agregar mensajes de confirmación
  private addConfirmationMessage(text: string): void {
    setTimeout(() => {
      this.messages.push({
        text: text,
        isUser: false,
        timestamp: new Date()
      });
      this.scrollToBottom();
    }, 500);
  }

  // Método auxiliar para mostrar información de horarios
  private showScheduleInfo(): void {
    const scheduleMessage: ChatMessage = {
      text: `📅 **Horarios de atención:**\n\n• Lunes a Viernes: 8:00 - 20:00\n• Sábados: 8:00 - 14:00\n• Domingos: Cerrado\n\n📞 Emergencias 24/7: (011) 4567-8901`,
      isUser: false,
      timestamp: new Date()
    };
    
    this.messages.push(scheduleMessage);
    this.scrollToBottom();
  }

  // Método para formatear el texto del mensaje
  formatMessageText(text: string): string {
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/###\s(.*?)(?=\n|$)/g, '<h4>$1</h4>')
      .replace(/##\s(.*?)(?=\n|$)/g, '<h3>$1</h3>')
      .replace(/#\s(.*?)(?=\n|$)/g, '<h2>$1</h2>');
  }

  // Método para resetear la burbuja de bienvenida (solo para pruebas)
  resetWelcomeBubble(): void {
    localStorage.removeItem('welcomeBubbleShown');
    this.showWelcomeBubble = false;
    console.log('Burbuja de bienvenida reseteada');
    this.showWelcomeBubbleAfterDelay();
  }
}
