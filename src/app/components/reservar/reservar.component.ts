import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatbotService } from '../../services/ChatBot.service';
import { ChatMessage, QuickQuestion } from '../../interfaces/chatbot.interface';
import { TurnoService } from '../../services/turno.service';
import { PacienteService } from '../../services/paciente.service';
import { DataRefreshService } from '../../services/data-refresh.service';
import { Tratamiento } from '../../interfaces';

interface User {
  id: number;
  nombreUsuario: string;
  nombre: string;
  apellido: string;
  tipoUsuario: string;
}

interface Paciente {
  id?: number;
  _id?: string;
  nombre: string;
  apellido: string;
  dni: string;
  obraSocial: string;
  userId?: string;
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

  // Wizard Steps
  currentStep: number = 1;
  totalSteps: number = 5;
  
  // Para dentistas/administradores - selección de paciente
  selectedPaciente: Paciente | null = null;
  
  // Calendar and booking data
  selectedDate: string = '';
  selectedTime: string = '';
  selectedTreatment: Tratamiento | null = null;
  availableDates: string[] = [];
  availableTimeSlots: { time: string, available: boolean }[] = [];
  occupiedSlots: { [key: string]: string[] } = {}; // fecha -> array de horas ocupadas
  
  // Calendar view
  currentMonth: Date = new Date();
  calendarDays: { date: Date, available: boolean, isToday: boolean, isSelected: boolean }[] = [];

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
    private pacienteService: PacienteService,
    private dataRefreshService: DataRefreshService
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
    this.generateCalendar();
    this.loadOccupiedSlots();
    
    // Ajustar total de pasos según el tipo de usuario
    if (this.user?.tipoUsuario === 'dentista' || this.user?.tipoUsuario === 'administrador') {
      this.totalSteps = 6; // Paso adicional para seleccionar paciente
    } else {
      this.totalSteps = 5;
    }
    
    // Force page refresh when at the beginning of the wizard
    // This ensures fresh data when starting the reservation process
    setTimeout(() => {
      // Check if we're at the very beginning (step 1)
      if (this.currentStep === 1) {
        console.log('At beginning of reservation wizard - checking if page needs refresh');
        const hasRefreshed = sessionStorage.getItem('reservar-step1-refreshed');
        if (!hasRefreshed) {
          console.log('Refreshing page at step 1 for fresh data');
          sessionStorage.setItem('reservar-step1-refreshed', 'true');
          setTimeout(() => {
            window.location.reload();
          }, 100);
          return;
        }
      }
    }, 500); // Give more time for user data to load
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
    console.log('Cargando tratamientos...');
    this.turnoService.getTratamientos().subscribe({
      next: (tratamientos) => {
        console.log('Tratamientos recibidos:', tratamientos);
        this.tratamientos = tratamientos;
      },
      error: (error) => {
        console.error('Error cargando tratamientos:', error);
        // Datos de prueba en caso de error
        this.tratamientos = [
          {
            id: 1,
            nroTratamiento: 1,
            descripcion: 'Consulta General',
            duracion: '30',
            precio: 5000,
            _id: '1'
          },
          {
            id: 2,
            nroTratamiento: 2,
            descripcion: 'Limpieza Dental',
            duracion: '45',
            precio: 8000,
            _id: '2'
          },
          {
            id: 3,
            nroTratamiento: 3,
            descripcion: 'Empaste',
            duracion: '60',
            precio: 12000,
            _id: '3'
          },
          {
            id: 4,
            nroTratamiento: 4,
            descripcion: 'Extracción',
            duracion: '45',
            precio: 15000,
            _id: '4'
          },
          {
            id: 5,
            nroTratamiento: 5,
            descripcion: 'Ortodoncia',
            duracion: '90',
            precio: 10000,
            _id: '5'
          }
        ];
        console.log('Usando datos de prueba:', this.tratamientos);
      }
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
        // Trigger refresh for patient dashboard
        // Trigger refresh for patient dashboard
        this.dataRefreshService.triggerRefresh('vistaPaciente');
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.isLoading = false;
        alert('Error al registrar el turno');
      }
    });
  }

  navigateToDashboard(): void {
    // Trigger refresh for patient dashboard before navigation
    this.dataRefreshService.triggerRefresh('vistaPaciente');
    
    // Add delay for more reliable navigation
    setTimeout(() => {
      // Check user type and navigate accordingly
      if (this.user?.tipoUsuario === 'paciente') {
        this.router.navigate(['/vistaPaciente']).catch((error: any) => {
          console.error('Navigation to /vistaPaciente failed:', error);
          window.location.href = '/vistaPaciente';
        });
      } else {
        this.router.navigate(['/dashboard']).catch((error: any) => {
          console.error('Navigation to /dashboard failed:', error);
          window.location.href = '/dashboard';
        });
      }
    }, 200);
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

  // Wizard Navigation Methods
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      // Clear refresh flag when advancing past step 1
      if (this.currentStep > 1) {
        sessionStorage.removeItem('reservar-step1-refreshed');
      }
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    this.currentStep = step;
  }

  resetWizard(): void {
    this.currentStep = 1;
    this.selectedDate = '';
    this.selectedTime = '';
    this.selectedTreatment = null;
    this.selectedPaciente = null; // Resetear paciente seleccionado
    this.generateCalendar();
  }

  // Calendar Methods
  generateCalendar(): void {
    this.calendarDays = [];
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the first Monday of the week containing the 1st day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7));
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dateStr = this.formatDate(currentDate);
      const isToday = this.isToday(currentDate);
      const isCurrentMonth = currentDate.getMonth() === month;
      const isPastDate = currentDate < new Date(new Date().setHours(0, 0, 0, 0));
      const hasAvailableSlots = this.hasAvailableSlots(dateStr);
      
      this.calendarDays.push({
        date: currentDate,
        available: isCurrentMonth && !isPastDate && hasAvailableSlots,
        isToday: isToday,
        isSelected: dateStr === this.selectedDate
      });
    }
  }

  prevMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generateCalendar();
  }

  selectDate(day: any): void {
    if (!day.available) return;
    
    this.selectedDate = this.formatDate(day.date);
    this.generateTimeSlots();
    this.generateCalendar(); // Refresh to show selection
    this.nextStep();
  }

  // Time Slots Methods
  generateTimeSlots(): void {
    this.availableTimeSlots = [];
    const startHour = 8; // 8:00 AM
    const endHour = 18; // 6:00 PM
    const intervalMinutes = 20;
    
    const occupiedTimes = this.occupiedSlots[this.selectedDate] || [];
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const isOccupied = occupiedTimes.includes(timeStr);
        
        this.availableTimeSlots.push({
          time: timeStr,
          available: !isOccupied
        });
      }
    }
  }

  selectTime(timeSlot: any): void {
    if (!timeSlot.available) return;
    
    this.selectedTime = timeSlot.time;
    this.nextStep();
  }

  selectTreatment(treatment: Tratamiento): void {
    this.selectedTreatment = treatment;
    this.nextStep();
  }

  // Método para seleccionar paciente (solo para dentistas/administradores)
  selectPaciente(paciente: Paciente): void {
    this.selectedPaciente = paciente;
    this.nextStep();
  }

  // Determinar si el usuario debe seleccionar paciente
  get shouldSelectPaciente(): boolean {
    return this.user?.tipoUsuario === 'dentista' || this.user?.tipoUsuario === 'administrador';
  }

  // Determinar cuál es el paso actual basado en el tipo de usuario
  getCurrentStepForUser(): number {
    if (this.shouldSelectPaciente) {
      // Para dentistas: 1=Paciente, 2=Fecha, 3=Hora, 4=Tratamiento, 5=Confirmar, 6=Éxito
      return this.currentStep;
    } else {
      // Para pacientes: 1=Fecha, 2=Hora, 3=Tratamiento, 4=Confirmar, 5=Éxito
      return this.currentStep;
    }
  }

  // Helper Methods
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  hasAvailableSlots(dateStr: string): boolean {
    // Simular que hay slots disponibles (en una app real, esto vendría del backend)
    const occupiedTimes = this.occupiedSlots[dateStr] || [];
    const totalSlots = (18 - 8) * 3; // 8AM to 6PM, every 20 minutes
    return occupiedTimes.length < totalSlots;
  }

  loadOccupiedSlots(): void {
    // Simular datos ocupados (en una app real, esto vendría del backend)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    this.occupiedSlots = {
      [this.formatDate(today)]: ['09:00', '10:20', '14:00', '15:40'],
      [this.formatDate(tomorrow)]: ['08:00', '11:00', '16:20']
    };
  }

  getMonthName(): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[this.currentMonth.getMonth()];
  }

  getYear(): number {
    return this.currentMonth.getFullYear();
  }

  formatSelectedDate(): string {
    if (!this.selectedDate) return '';
    const date = new Date(this.selectedDate);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
  }

  // Final Booking
  async confirmBooking(): Promise<void> {
    if (!this.selectedDate || !this.selectedTime || !this.selectedTreatment) {
      console.log('Datos incompletos para confirmar booking');
      return;
    }
    
    this.isLoading = true;
    
    // Obtener el pacienteId correcto
    const pacienteId = await this.getPacienteId();
    if (!pacienteId) {
      this.isLoading = false;
      alert('Error: No se pudo obtener el ID del paciente');
      return;
    }
    
    const turnoData = {
      pacienteId: pacienteId,
      fecha: this.selectedDate,
      hora: this.selectedTime,
      tratamientoId: this.selectedTreatment._id || this.selectedTreatment.id // Usar _id del backend o id de fallback
    };

    console.log('Datos del turno a enviar:', turnoData);
    console.log('User completo:', this.user);
    console.log('Selected treatment completo:', this.selectedTreatment);
    console.log('Tipo de pacienteId:', typeof turnoData.pacienteId);
    console.log('Tipo de tratamientoId:', typeof turnoData.tratamientoId);
    console.log('Paso actual antes de confirmar:', this.currentStep);

    this.turnoService.createTurno(turnoData).subscribe({
      next: (response) => {
        console.log('Turno creado exitosamente:', response);
        console.log('Cambiando al paso final (éxito)');
        this.isLoading = false;
        this.currentStep = this.shouldSelectPaciente ? 6 : 5; // Ir al paso correcto según el tipo de usuario
        console.log('Paso actual después de éxito:', this.currentStep);
        
        // Trigger refresh for patient dashboard
        this.dataRefreshService.triggerRefresh('vistaPaciente');
      },
      error: (error) => {
        console.error('Error al registrar el turno:', error);
        this.isLoading = false;
        alert('Error al registrar el turno. Por favor, intenta nuevamente.');
      }
    });
  }

  // Navigate back to dashboard/home
  volverAlInicio(): void {
    console.log('volverAlInicio called');
    console.log('User:', this.user);
    console.log('User tipo:', this.user?.tipoUsuario);
    
    // Clear any refresh flags
    sessionStorage.removeItem('reservar-step1-refreshed');
    
    // Trigger refresh for patient dashboard before navigation
    this.dataRefreshService.triggerRefresh('vistaPaciente');
    
    // Add a small delay to ensure refresh is processed and navigation is reliable
    setTimeout(() => {
      if (this.user?.tipoUsuario === 'paciente') {
        console.log('Navigating to /vistaPaciente and forcing page reload');
        this.router.navigate(['/vistaPaciente']).then(
          (success) => {
            if (success) {
              // Force page reload to ensure data is completely fresh
              console.log('Navigation successful, forcing page reload');
              setTimeout(() => {
                window.location.reload();
              }, 500);
            }
          }
        ).catch((error: any) => {
          console.error('Navigation to /vistaPaciente failed:', error);
          // Force hard navigation as fallback
          window.location.href = '/vistaPaciente';
        });
      } else {
        // Para dentistas y administradores
        console.log('Attempting navigation to /dashboard');
        this.router.navigate(['/dashboard']).catch((error: any) => {
          console.error('Navigation to /dashboard failed:', error);
          window.location.href = '/dashboard';
        });
      }
    }, 200);
  }

  // Start a new booking
  nuevaReserva(): void {
    this.resetWizard();
  }

  // Cancelar reserva y volver al inicio
  cancelarReserva(): void {
    // Confirmar si realmente quiere cancelar
    if (confirm('¿Estás seguro de que quieres cancelar la reserva? Se perderán todos los datos ingresados.')) {
      this.resetWizard();
      this.volverAlInicio();
    }
  }

  // Método para obtener el pacienteId correcto
  async getPacienteId(): Promise<string | null> {
    if (this.user?.tipoUsuario === 'paciente') {
      // Para usuarios tipo paciente, buscar en la lista de pacientes el que tenga userId igual al user.id
      const paciente = this.pacientes.find(p => p.userId === this.user?.id?.toString());
      if (paciente) {
        return paciente._id || paciente.id?.toString() || null;
      }
      // Si no encontramos el paciente, intentar cargarlo desde el servidor
      try {
        const allPacientes = await this.pacienteService.getPacientes().toPromise() as any[];
        const foundPaciente = allPacientes?.find((p: any) => p.userId === this.user?.id?.toString());
        return foundPaciente?._id || foundPaciente?.id?.toString() || null;
      } catch (error) {
        console.error('Error al buscar paciente:', error);
        return null;
      }
    } else {
      // Para usuarios tipo dentista/administrador, usar el paciente seleccionado en el wizard
      if (this.selectedPaciente) {
        return this.selectedPaciente._id || this.selectedPaciente.id?.toString() || null;
      }
      // Fallback: usar el pacienteId del formulario si existe
      return this.turnoForm.pacienteId || null;
    }
  }
}
