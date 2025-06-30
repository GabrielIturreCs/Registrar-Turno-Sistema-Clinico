import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatbotService } from '../../services/ChatBot.service';
import { ChatMessage, QuickQuestion } from '../../interfaces/chatbot.interface';
import { TurnoService } from '../../services/turno.service';
import { PacienteService } from '../../services/paciente.service';
import { Tratamiento } from '../../interfaces';

interface User {
  id: number;
  nombreUsuario: string;
  nombre: string;
  apellido: string;
  tipoUsuario: string;
}

interface Paciente {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  obraSocial: string;
}

@Component({
  selector: 'app-reservar',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './reservar.component.html',
  styleUrl: './reservar.component.css'
})
export class ReservarComponent implements OnInit {
  user: User | null = null;
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
    { text: '¿Cuáles son los precios?', action: 'precios' },
    { text: '¿Cómo funciona la reserva?', action: 'reserva' }
  ];

  turnoForm = {
    pacienteId: '',
    fecha: '',
    hora: '',
    tratamientoId: ''
  };

  tratamientos: Tratamiento[] = [];
  pacientes: Paciente[] = [];

  constructor(
    private router: Router,
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
    this.loadPacientes();
    this.loadTratamientos();
    this.addWelcomeMessage();
  }

  // Chatbot methods
  addWelcomeMessage(): void {
    const welcomeMessage: ChatMessage = {
      text: '¡Hola! Te ayudo con tu reserva de turno. ¿Tienes alguna pregunta sobre nuestros tratamientos o precios?',
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
      'hola': '¡Hola! ¿En qué puedo ayudarte con tu reserva de turno?',
      'tratamientos': 'Ofrecemos: Consulta General ($5000), Limpieza Dental ($8000), Empastes ($12000), Extracciones ($15000), y Ortodoncia ($10000).',
      'precios': 'Nuestros precios son: Consulta General $5000, Limpieza $8000, Empaste $12000, Extracción $15000, Ortodoncia $10000.',
      'horarios': 'Nuestros horarios de atención son de lunes a viernes de 8:00 a 18:00 y sábados de 9:00 a 13:00.',
      'reserva': 'Para reservar, simplemente completa el formulario seleccionando fecha, hora y tratamiento. ¡Es muy fácil!',
      'disponibilidad': 'Puedes ver las fechas disponibles en el calendario. Te recomiendo reservar con anticipación.',
      'cancelar': 'Si necesitas cancelar tu turno más tarde, podrás hacerlo desde "Mis Turnos" en el dashboard.',
      'gracias': '¡De nada! ¿Hay algo más que quieras saber antes de reservar tu turno?',
      'ayuda': 'Puedo ayudarte con: información de tratamientos, precios, horarios disponibles, y el proceso de reserva.'
    };

    // Buscar palabras clave en el mensaje
    for (const key in localResponses) {
      if (msg.includes(key)) {
        return localResponses[key];
      }
    }

    // Respuestas contextuales más avanzadas
    if (msg.includes('cuando') || msg.includes('cuándo') || msg.includes('fecha')) {
      return 'Puedes seleccionar cualquier fecha desde hoy en adelante en el campo "Fecha". Nuestros horarios son de 8:00 a 18:00 de lunes a viernes.';
    }
    
    if (msg.includes('cuanto') || msg.includes('cuesta') || msg.includes('precio')) {
      return 'Los precios varían por tratamiento: Consulta ($5000), Limpieza ($8000), Empaste ($12000), Extracción ($15000), Ortodoncia ($10000). ¿Te interesa alguno en particular?';
    }

    if (msg.includes('donde') || msg.includes('ubicacion')) {
      return 'Nuestra clínica está ubicada en el centro de la ciudad. Una vez que reserves tu turno, te enviaremos la dirección exacta.';
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
    // Verificar si estamos en el navegador (no en el servidor)
    if (typeof window !== 'undefined' && window.localStorage) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        this.user = JSON.parse(userStr);
      } else {
        this.router.navigate(['/login']);
      }
    }
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

  registrarTurno(): void {
    if (!this.canRegisterTurno) return;
    this.isLoading = true;
    const turnoData = {
      pacienteId: this.user?.tipoUsuario === 'paciente' ? this.user.id : parseInt(this.turnoForm.pacienteId),
      fecha: this.turnoForm.fecha,
      hora: this.turnoForm.hora,
      tratamientoId: parseInt(this.turnoForm.tratamientoId)
    };
    this.turnoService.createTurno(turnoData).subscribe({
      next: () => {
        this.isLoading = false;
        alert('¡Turno registrado exitosamente!');
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.isLoading = false;
        alert('Error al registrar el turno');
      }
    });
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  get canRegisterTurno(): boolean {
    if (this.user?.tipoUsuario !== 'paciente' && !this.turnoForm.pacienteId) {
      return false;
    }
    return this.turnoForm.fecha.trim() !== '' &&
           this.turnoForm.hora.trim() !== '' &&
           this.turnoForm.tratamientoId.trim() !== '';
  }
}
