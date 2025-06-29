import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { User, Turno, Tratamiento, Paciente } from '../../interfaces';
import { ChatbotService } from '../../services/ChatBot.service';
import { ChatMessage, QuickQuestion } from '../../interfaces/chatbot.interface';

@Component({
  selector: 'app-turnos',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './turnos.component.html',
  styleUrl: './turnos.component.css'
})
export class TurnosComponent implements OnInit {
  currentView: string = 'turnos';
  user: User | null = null;
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
  pacientes: Paciente[] = [
    { id: 1, nombre: 'Juan', apellido: 'Pérez', dni: '87654321', obraSocial: 'OSDE', telefono: '123456789' },
    { id: 2, nombre: 'María', apellido: 'García', dni: '20123456', obraSocial: 'Swiss Medical', telefono: '987654321' },
    { id: 3, nombre: 'Carlos', apellido: 'López', dni: '25789123', obraSocial: 'OSDE', telefono: '555666777' }
  ];

  tratamientos: Tratamiento[] = [
    { id: 1, descripcion: 'Consulta General', precio: 5000, duracion: 30 },
    { id: 2, descripcion: 'Limpieza Dental', precio: 8000, duracion: 45 },
    { id: 3, descripcion: 'Empaste', precio: 12000, duracion: 60 },
    { id: 4, descripcion: 'Extracción', precio: 15000, duracion: 30 },
    { id: 5, descripcion: 'Ortodoncia - Consulta', precio: 10000, duracion: 45 }
  ];

  testData = {
    turnos: [
      { id: 1, nroTurno: 'T001', fecha: '2024-01-20', hora: '09:00', estado: 'reservado', tratamiento: 'Consulta General', precioFinal: 5000, nombre: 'Juan', apellido: 'Pérez', pacienteId: 1, tratamientoId: 1 },
      { id: 2, nroTurno: 'T002', fecha: '2024-01-21', hora: '10:30', estado: 'reservado', tratamiento: 'Limpieza Dental', precioFinal: 8000, nombre: 'María', apellido: 'García', pacienteId: 2, tratamientoId: 2 },
      { id: 3, nroTurno: 'T003', fecha: '2024-01-22', hora: '14:00', estado: 'completado', tratamiento: 'Empaste', precioFinal: 12000, nombre: 'Carlos', apellido: 'López', pacienteId: 3, tratamientoId: 3 },
      { id: 4, nroTurno: 'T004', fecha: '2024-01-23', hora: '16:00', estado: 'cancelado', tratamiento: 'Extracción', precioFinal: 15000, nombre: 'Ana', apellido: 'Martínez', pacienteId: 4, tratamientoId: 4 }
    ]
  };

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private chatbotService: ChatbotService
  ) {
    this.chatForm = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadTurnosData();
    // Si el usuario es paciente, mostrar directamente "Mis Turnos"
    if (this.user?.tipoUsuario === 'paciente') {
      this.currentView = 'mis-turnos';
      this.turnoForm.pacienteId = this.user.id.toString();
      // Agregar mensaje de bienvenida del chatbot solo para pacientes en "Mis Turnos"
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
    this.turnos = this.testData.turnos;
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
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

    // Simular registro de turno
    setTimeout(() => {
      const newTurno: Turno = {
        id: this.turnos.length + 1,
        nroTurno: 'T' + String(this.turnos.length + 1).padStart(3, '0'),
        fecha: this.turnoForm.fecha,
        hora: this.turnoForm.hora,
        estado: 'reservado',
        tratamiento: this.tratamientos.find(t => t.id === parseInt(this.turnoForm.tratamientoId))?.descripcion || '',
        precioFinal: this.tratamientos.find(t => t.id === parseInt(this.turnoForm.tratamientoId))?.precio || 0,
        pacienteId: parseInt(this.turnoForm.pacienteId),
        tratamientoId: parseInt(this.turnoForm.tratamientoId)
      };

      this.turnos.push(newTurno);
      
      // Limpiar formulario
      this.turnoForm = {
        pacienteId: '',
        fecha: '',
        hora: '',
        tratamientoId: ''
      };

      this.currentView = 'turnos';
      this.isLoading = false;
      alert('Turno registrado exitosamente');
    }, 1000);
  }

  get canRegisterTurno(): boolean {
    return this.turnoForm.pacienteId !== '' &&
           this.turnoForm.fecha !== '' &&
           this.turnoForm.hora !== '' &&
           this.turnoForm.tratamientoId !== '';
  }

  cancelarTurno(turno: Turno): void {
    if (confirm('¿Estás seguro de que quieres cancelar este turno?')) {
      turno.estado = 'cancelado';
      // Mensaje de feedback visual
      alert('Turno cancelado exitosamente');
    }
  }

  completarTurno(turno: Turno): void {
    if (confirm('¿Confirmar que el turno ha sido completado?')) {
      turno.estado = 'completado';
      alert('Turno marcado como completado');
    }
  }

  get filteredTurnos(): Turno[] {
    let filtered = this.turnos;

    // Filtrar por búsqueda
    if (this.searchTerm.trim() !== '') {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(turno => 
        turno.nroTurno.toLowerCase().includes(search) ||
        turno.tratamiento.toLowerCase().includes(search) ||
        turno.nombre?.toLowerCase().includes(search) ||
        turno.apellido?.toLowerCase().includes(search)
      );
    }

    // Filtrar por estado
    if (this.filterEstado !== 'todos') {
      filtered = filtered.filter(turno => turno.estado === this.filterEstado);
    }

    // Filtrar por usuario (si es paciente, solo mostrar sus turnos)
    if (this.user?.tipoUsuario === 'paciente') {
      filtered = filtered.filter(turno => turno.pacienteId === this.user?.id);
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
}
