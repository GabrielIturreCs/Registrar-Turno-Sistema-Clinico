import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Interfaces y servicios para turnos
import { User, Turno, Tratamiento, Paciente } from '../../interfaces';
import { ChatbotService } from '../../services/ChatBot.service';

// Interfaces y servicios para chatbot avanzado
import { Message, QuickQuestion, ConsultorioInfo } from '../../interfaces/message.interface';
import { ChatService } from '../../services/chat.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-turnos-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './turnos.component.html',
  styleUrls: ['./turnos.component.css']
})
export class TurnoComponent implements OnInit {
  // ----- Turnos -----
  currentView: string = 'turnos';
  user: User | null = null;
  turnos: Turno[] = [];
  searchTerm: string = '';
  filterEstado: string = 'todos';
  isLoading: boolean = false;

  turnoForm = {
    pacienteId: '',
    fecha: '',
    hora: '',
    tratamientoId: ''
  };

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
    private chatbotService: ChatbotService,
    private fb: FormBuilder,
    private chatService: ChatService,
    private dataService: DataService
  ) {
    // Chatbot avanzado
    this.chatForm = this.fb.group({
      message: ["", [Validators.required, Validators.minLength(1)]],
    });
    this.quickQuestions = this.dataService.getQuickQuestions();
    this.consultorioInfo = this.dataService.getConsultorioInfo();
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadTurnosData();
    if (this.user?.tipoUsuario === 'paciente') {
      this.turnoForm.pacienteId = this.user.id.toString();
    }
    this.addWelcomeMessage();
  }

  // ----- Chatbot simple -----
  userMessage = '';
  chat: { role: string, content: string }[] = [];
  loading = false;

  send(): void {
    if (!this.userMessage.trim()) return;
    this.chat.push({ role: 'user', content: this.userMessage });
    this.loading = true;

    this.chatbotService.sendMessage(this.userMessage).subscribe({
      next: (res) => {
        const botReply = res?.message || 'Sin respuesta del bot';
        this.chat.push({ role: 'bot', content: botReply });
        this.loading = false;
      },
      error: () => {
        this.chat.push({ role: 'bot', content: 'Error al conectar con el bot.' });
        this.loading = false;
      }
    });

    this.userMessage = '';
  }

  // ----- Turnos -----
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
      this.turnoForm = { pacienteId: '', fecha: '', hora: '', tratamientoId: '' };
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

    if (this.searchTerm.trim() !== '') {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(turno =>
        turno.nroTurno.toLowerCase().includes(search) ||
        turno.tratamiento.toLowerCase().includes(search) ||
        turno.nombre?.toLowerCase().includes(search) ||
        turno.apellido?.toLowerCase().includes(search)
      );
    }

    if (this.filterEstado !== 'todos') {
      filtered = filtered.filter(turno => turno.estado === this.filterEstado);
    }

    if (this.user?.tipoUsuario === 'paciente') {
      filtered = filtered.filter(turno => turno.pacienteId === this.user?.id);
    }

    return filtered;
  }

  getStatusClass(estado: string): string {
    switch (estado) {
      case 'reservado': return 'badge bg-primary';
      case 'completado': return 'badge bg-success';
      case 'cancelado': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  // ----- Chatbot avanzado -----
  @ViewChild("messagesContainer") private messagesContainer!: ElementRef;
  mostrarChat = false;
  messages: Message[] = [];
  chatForm: FormGroup;
  showQuickQuestions = true;
  quickQuestions: QuickQuestion[] = [];
  consultorioInfo: ConsultorioInfo;

  private addWelcomeMessage(): void {
    this.messages.push(
      this.chatService.createMessage("assistant", this.dataService.getWelcomeMessage())
    );
  }

  onSubmit(): void {
    if (this.chatForm.valid && !this.isLoading) {
      const messageText = this.chatForm.get("message")?.value.trim();
      if (messageText) {
        this.handleHybridChat(messageText);
      }
    }
  }

  onQuickQuestion(question: string): void {
    this.handleHybridChat(question);
    this.showQuickQuestions = false;
  }

  /**
   * Lógica híbrida: primero intenta respuesta local, si no hay o es genérica, consulta la API.
   */
  private handleHybridChat(content: string): void {
    // Mensaje del usuario
    this.messages.push({
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    });
    this.chatForm.reset();
    this.showQuickQuestions = false;
    this.isLoading = true;

    // 1. Intenta respuesta local
    const localResponse = this.chatService.generateResponse(content);

    // Si la respuesta local es vacía o genérica, consulta la API
    if (localResponse && localResponse.trim() !== '' && !this.isGenericResponse(localResponse)) {
      setTimeout(() => {
        this.isLoading = false;
        this.messages.push({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: localResponse,
          timestamp: new Date()
        });
        this.scrollToBottom();
      }, 600); // respuesta rápida local
    } else {
      // 2. Si no hay respuesta local específica, consulta la API
      this.chatbotService.sendMessage(content).subscribe(res => {
        this.isLoading = false;
        this.messages.push({
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: res.message || 'Sin respuesta del bot',
          timestamp: new Date()
        });
        this.scrollToBottom();
      });
    }
  }

  /**
   * Detecta si la respuesta local es genérica (ajusta según tu lógica real).
   */
  private isGenericResponse(response: string): boolean {
    // Cambia este texto por el de tu respuesta genérica real
    return response.startsWith('Gracias por tu consulta. Soy DentalBot');
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }
}